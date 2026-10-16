import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import type Phaser from "phaser";
import { DRZEWA_3D, GATHER, REKWIZYTY_3D, WATERWHEEL, ZASLONY_3D } from "../config/GameConfig";
import { treeInstancesFor, type TreeInstance } from "../world/TreeLayer";
import { propInstancesFor, type PropInstance } from "../world/PropInstances";
import { pikseliNaJednostke } from "./Shared3D";

/**
 * ⭐ **DRZEWA 3D** (pilot 2026-10-05, `OI-164`) — w widoku 3D stempel drzewa
 * dostaje model z `tools/tree3d.py` zamiast billboardu pixel-artu.
 *
 * ⛔ **Wyłącznie obraz.** Kolizja pnia, NavGrid i zasłony (`Occluders`) liczą
 * się dalej ze stempla — ten obiekt tylko gasi dwa obrazki drzewa
 * (`renderWebGL`) i stawia w ich miejscu instancję modelu.
 *
 * ⭐ Instancje są grupowane po WARIANCIE i KWADRACIE mapy (1024 px): jedna
 * grupa = jedno wywołanie rysowania z własną sferą ograniczającą, więc three.js
 * odcina kwadraty poza kadrem. Jedna grupa na wariant na całą mapę rysowałaby
 * zawsze wszystkie ~1000 drzew lasu.
 *
 * ⭐ **Różnorodność** (2026-10-05, „drzewa wyglądają bardzo podobnie"): każdy
 * gatunek × rozmiar ma w `.glb` kilka KSZTAŁTÓW (`buk_duzy`, `buk_duzy_2`),
 * wybieranych po położeniu, a egzemplarz dostaje własny obrót, skalę,
 * rozciągnięcie w szerz/w górę, jasność i odcień (cieplej/chłodniej).
 *
 * Wiatr żyje w shaderze. ⭐ ZASŁONA (2026-10-05): egzemplarz, który naprawdę
 * zasłania tułów gracza, blednie CAŁY (atrybut `aZanik` per instancja,
 * dithering Bayera) — patrz `zaslania` i `ZASLONY_3D`. Zastąpił stały okrąg
 * szachownicy wokół gracza.
 */

/**
 * Dithering uporządkowany 4×4: próg 0…1 per piksel ekranu. Odrzucenie
 * `bayer4 < zanik·(1 − krycie)` daje równomierną „półprzezroczystość" CAŁEGO
 * obiektu bez sortowania — na ekranie telefonu czyta się jak przezroczystość.
 */
export const BAYER_GLSL = `
float bayer4(vec2 p) {
  vec2 q = mod(floor(p), 4.0);
  int i = int(q.x + q.y * 4.0);
  float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  return (m[i] + 0.5) / 16.0;
}`;
/** Fragment odrzucający piksele w zaniku — `vZanik` 0 = pełny, 1 = pełny zanik. */
export const ZANIK_DISCARD = `if (vZanik > 0.002 && bayer4(gl_FragCoord.xy) < vZanik * ${(1 - ZASLONY_3D.krycie).toFixed(3)}) discard;`;

/**
 * Czy obiekt zasłania tułów gracza. Kamera ortogonalna pochylona o θ: punkt na
 * wysokości h nad gruntem wypada na ekranie tam, gdzie punkt gruntu przesunięty
 * o h/tanθ NA PÓŁNOC. Obiekt (podstawa `zB`, wysokość `wys`, półszerokość
 * `pol`) przykrywa na ekranie pas „gruntu" od `zB + pol` do `zB − pol − wys/tanθ`.
 * ⚠ Obiekt ZA graczem (`zB ≤ gZ`) nie zasłania nigdy — rysuje się za nim.
 */
export function zaslania(gX: number, gZ: number, tulowPx: number, tanK: number,
  x: number, zB: number, pol: number, wys: number, tyl = 0): boolean {
  if (zB <= gZ + 2) return false;
  if (Math.abs(x - gX) > pol + ZASLONY_3D.marginesPx) return false;
  const u = gZ - tulowPx / tanK;
  // ⭐ Bryła zakotwiczona na FRONCIE i sięgająca `tyl` px w głąb (dom): zajmuje
  //   grunt [zB − tyl, zB], więc zasłania od frontu aż po cień swojej wysokości
  //   za tylną ścianą. ⚠ Liczona jak drzewo (środek w zB) nie bladła wcale,
  //   gdy gracz stał za chałupą — dom sięga 7 kafli w głąb od punktu zaczepienia.
  if (tyl > 0) return u < zB && u > zB - tyl - wys / tanK + ZASLONY_3D.zapasPx;
  // ⚠ zapas od góry: korona sięgająca ledwie stóp gracza bladła razem z tą,
  //   która naprawdę go zakrywa (zrzut 2026-10-05).
  return u < zB + pol && u > zB - pol - wys / tanK + ZASLONY_3D.zapasPx;
}

const KWADRAT = 1024;
const NIC = (): void => {};
/** Wysokość dużego drzewa w generatorze (j.) — skala kołysania. */
const WYS_ODNIESIENIA = 28;
/** Model domu z `houses3d.glb` (`REKWIZYTY_3D.sciezkaDomow`). */
const jestDomem = (wariant: string) => wariant.startsWith("dom-");

type Punkt = {
  x: number; y: number;
  /** Dom: kierunek frontu (stopnie; 0 = do kamery) i obrys do testu zasłony
   *  (px świata) — przy obrocie punkt zaczepienia nie jest środkiem obrysu. */
  obrot?: number; obrys?: { x: number; y: number; w: number; h: number };
};
type Grupa = {
  mesh: THREE.InstancedMesh; drzewa: Punkt[]; wariant: string; skala: number; staly: boolean; dokladny: boolean;
  /** Zanik per egzemplarz (0…1) i wymiary w px świata — do testu zasłony. */
  zanik: THREE.InstancedBufferAttribute; wysPx: Float32Array; polPx: Float32Array;
  /** Głębokość w px od punktu zaczepienia w tył (domy); 0 = bryła wycentrowana. */
  tylPx: Float32Array;
};
/** Zioło (`Gatherable`) widziane od strony obrazu — bez importu encji. */
type Ziolo = Phaser.GameObjects.GameObject & {
  x: number; y: number; alpha: number; scaleY: number; angle: number; herb: string; blisko?: boolean;
};
/** Rozciągnięcie egzemplarza w szerz (x, z) i w górę (y) — z położenia. */
const rozciag = (d: Punkt): [number, number] => [
  1 + (los(d.x, d.y, 6) * 2 - 1) * DRZEWA_3D.rozrzutSzerokosci,
  1 + (los(d.x, d.y, 7) * 2 - 1) * DRZEWA_3D.rozrzutWysokosci,
];
/**
 * Drzewo z KAFLI (Zagaje, Gęstwina): wariant już rozpoznany po dolnym kaflu
 * (`DRZEWA_3D.kafleNature`), punkt w gruncie i jak zgasić jego billboard —
 * wołane dopiero, gdy model naprawdę stanął.
 */
export type DrzewoZKafli = Punkt & {
  wariant: string; ukryj: () => void;
  /** Rekwizyt z kafla (kępka, krzaczek): skala własna, kwadrat i skala rekwizytów, bez cienia. */
  rekwizyt?: boolean; skala?: number;
  /** Model się nie znalazł w pliku (dom bez przebiegu generatora) — ostrzeżenie. */
  brak?: () => void;
};
type Wariant = { geo: THREE.BufferGeometry; promienKorony: number; wys: number; polSzer: number; tyl: number };

/** Stała pseudolosowa liczba z położenia — ten sam las przy każdym wczytaniu. */
function los(x: number, y: number, k: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

/** `buk_duzy2_new` → `buk_duzy`; `null`, gdy gatunek nie ma modelu. */
export function wariantDrzewa(nazwaStempla: string, wszystkie: boolean): string | null {
  const [gat, roz] = nazwaStempla.replace(/_new$/, "").split("_");
  let g = DRZEWA_3D.gatunki[gat];
  if (!g && wszystkie && gat !== "swierk") g = DRZEWA_3D.zastepczyLisciasty;
  const r = DRZEWA_3D.rozmiary[(roz ?? "").replace(/\d+$/, "")];
  return g && r ? `${g}_${r}` : null;
}

export class Trees3D {
  /** Obrazki drzew przejęte przez modele — `WorldView3D` ich nie billboarduje. */
  readonly przejete = new Set<Phaser.GameObjects.GameObject>();
  private readonly grupy: Grupa[] = [];
  private readonly warianty = new Map<string, Wariant>();
  /** `buk_duzy` → [`buk_duzy`, `buk_duzy_2`] — kształty jednego wariantu. */
  private readonly ksztalty = new Map<string, string[]>();
  private cienie: THREE.InstancedMesh | null = null;
  private cienieDrzew: { d: Punkt; w: Wariant; skala: number }[] = [];
  /** Zioła: model idzie za duszkiem co klatkę (pojawia się, kurczy przy zbiorze, kołysze). */
  private readonly ziola = new Map<Ziolo, { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial }>();
  private gotowe = false;
  private skala = 0;
  private zywy = true;
  private readonly czas = { value: 0 };
  private readonly material: THREE.MeshStandardMaterial;
  /** Domy: ten sam materiał BEZ kołysania (dach na 40 j. bujałby się o ~0,5 j.). */
  private readonly materialSztywny: THREE.MeshStandardMaterial;
  /** Płomień: bez światła — kolor wierzchołków wprost (`REKWIZYTY_3D.swiecace`). */
  private readonly materialSwiecacy = new THREE.MeshBasicMaterial({ vertexColors: true });

  constructor(
    private readonly scena: THREE.Scene,
    scene: Phaser.Scene,
    private readonly gdyPrzejete: (obiekty: Phaser.GameObjects.GameObject[]) => void,
    kaflowe: readonly DrzewoZKafli[] = [],
  ) {
    const drzewa = treeInstancesFor(scene);
    this.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
    const { amplituda, tempo } = DRZEWA_3D.wiatr;
    this.material.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { uCzas: this.czas });
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uCzas;\nattribute float aZanik;\nvarying float vZanik;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\n"
          + "float wysW = max(transformed.y, 0.0) / " + WYS_ODNIESIENIA.toFixed(1) + ";\n"
          + "float fazaW = instanceMatrix[3].x * 0.013 + instanceMatrix[3].z * 0.007;\n"
          + "float wychW = " + amplituda.toFixed(3) + " * wysW * wysW;\n"
          + "transformed.x += sin(uCzas * " + tempo.toFixed(3) + " + fazaW) * wychW;\n"
          + "transformed.z += sin(uCzas * " + (tempo * 0.73).toFixed(3) + " + fazaW * 1.7) * wychW * 0.5;\n"
          + "vZanik = aZanik;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vZanik;\n" + BAYER_GLSL)
        .replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\n" + ZANIK_DISCARD);
    };
    this.materialSztywny = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
    this.materialSztywny.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute float aZanik;\nvarying float vZanik;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvZanik = aZanik;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vZanik;\n" + BAYER_GLSL)
        .replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\n" + ZANIK_DISCARD);
    };
    const rekwizyty = propInstancesFor(scene);
    const wszystkie = typeof location !== "undefined"
      && new URLSearchParams(location.search).get("drzewa3d") === "wszystkie";
    // Każdy plik osobno: brak jednego (drzewa / rekwizyty) nie gasi drugiego.
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const wczytaj = (sciezka: string) => loader.loadAsync(sciezka).then((g) => g.scene).catch((e) => {
      console.warn(`[drzewa3d] ${sciezka} się nie wczytał — zostają billboardy.`, e);
      return null;
    });
    void Promise.all([wczytaj(DRZEWA_3D.sciezka), wczytaj(REKWIZYTY_3D.sciezka), wczytaj(REKWIZYTY_3D.sciezkaDomow)]).then((korzenie) => {
      if (this.zywy) this.zbuduj(korzenie.filter((k): k is THREE.Group => !!k), drzewa, kaflowe, rekwizyty, wszystkie);
    });
  }

  private zbuduj(
    korzenie: THREE.Object3D[], drzewa: readonly TreeInstance[], kaflowe: readonly DrzewoZKafli[],
    rekwizyty: readonly PropInstance[], wszystkie: boolean,
  ): void {
    for (const korzen of korzenie) korzen.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const geo = m.geometry;
      geo.computeBoundingBox();
      const b = geo.boundingBox!;
      this.warianty.set(m.name, { geo, promienKorony: Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2, wys: b.max.y,
        // dom: punkt zaczepienia na środku frontu, bryła w −z (tył)
        polSzer: Math.max(-b.min.x, b.max.x), tyl: Math.max(0, -b.min.z) });
      const baza = m.name.replace(/_\d+$/, "");
      this.ksztalty.set(baza, [...(this.ksztalty.get(baza) ?? []), m.name]);
    });
    const wg = new Map<string, Grupa>();
    const przejete: Phaser.GameObjects.GameObject[] = [];
    const postaw = (wariant: string | null, d: Punkt, skala = DRZEWA_3D.skala, kwadrat = KWADRAT, cien = true): boolean => {
      const lista = wariant ? this.ksztalty.get(wariant) : undefined;
      const nazwa = lista ? lista[Math.floor(los(d.x, d.y, 5) * lista.length) % lista.length] : null;
      const w = nazwa ? this.warianty.get(nazwa) : undefined;
      if (!nazwa || !w) return false;
      const klucz = `${nazwa}|${kwadrat}|${skala}|${Math.floor(d.x / kwadrat)}|${Math.floor(d.y / kwadrat)}`;
      let g = wg.get(klucz);
      if (!g) {
        const staly = REKWIZYTY_3D.bezObrotu.includes(wariant!) || jestDomem(wariant!);
        const dokladny = REKWIZYTY_3D.dokladne.includes(wariant!) || jestDomem(wariant!);
        g = { mesh: null as unknown as THREE.InstancedMesh, drzewa: [], wariant: nazwa, skala, staly, dokladny,
          zanik: null as unknown as THREE.InstancedBufferAttribute, wysPx: new Float32Array(0), polPx: new Float32Array(0),
          tylPx: new Float32Array(0) };
        wg.set(klucz, g);
      }
      g.drzewa.push(d);
      if (cien) this.cienieDrzew.push({ d, w, skala });
      return true;
    };
    let zKafli = 0;
    for (const k of kaflowe) {
      const ok = k.rekwizyt
        ? postaw(k.wariant, k, REKWIZYTY_3D.skala * (k.skala ?? 1), REKWIZYTY_3D.kwadrat,
          !REKWIZYTY_3D.bezCienia.includes(k.wariant) && !jestDomem(k.wariant))
        : postaw(k.wariant, k);
      if (ok) { k.ukryj(); zKafli++; } else k.brak?.();
    }
    const przejmij = (im: Phaser.GameObjects.GameObject) => {
      (im as unknown as Record<string, unknown>).renderWebGL = NIC;
      this.przejete.add(im);
      przejete.push(im);
    };
    let stempli = 0;
    for (const d of drzewa) {
      if (!postaw(wariantDrzewa(d.name, wszystkie), d)) continue;
      stempli++;
      for (const im of d.images) przejmij(im);
    }
    let rek = 0;
    for (const r of rekwizyty) {
      if (!postaw(r.name.replace(/_\d+$/, ""), r, REKWIZYTY_3D.skala, REKWIZYTY_3D.kwadrat)) continue;
      przejmij(r.image);
      rek++;
    }
    for (const g of wg.values()) {
      // Własna geometria grupy, ale te SAME bufory wierzchołków (wysyłane raz):
      // dochodzi tylko atrybut zaniku per egzemplarz tej grupy.
      const zrodlo = this.warianty.get(g.wariant)!.geo;
      const geo = new THREE.BufferGeometry();
      for (const [nazwa, a] of Object.entries(zrodlo.attributes)) geo.setAttribute(nazwa, a);
      geo.setIndex(zrodlo.index);
      const n = g.drzewa.length;
      g.zanik = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
      g.zanik.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute("aZanik", g.zanik);
      g.wysPx = new Float32Array(n);
      g.polPx = new Float32Array(n);
      g.tylPx = new Float32Array(n);
      const baza = g.wariant.replace(/_\d+$/, "");
      const mat = REKWIZYTY_3D.swiecace.includes(baza) ? this.materialSwiecacy
        : jestDomem(g.wariant) || baza in REKWIZYTY_3D.animacje || REKWIZYTY_3D.sztywne.includes(baza)
          ? this.materialSztywny : this.material;
      g.mesh = new THREE.InstancedMesh(geo, mat, n);
      if (baza in REKWIZYTY_3D.animacje) this.ruchome.push(g);
      const kolor = new THREE.Color();
      g.drzewa.forEach((d, i) => {
        const j = 1 + (los(d.x, d.y, 3) * 2 - 1) * DRZEWA_3D.rozrzutJasnosci;
        const h = (los(d.x, d.y, 4) * 2 - 1) * DRZEWA_3D.rozrzutOdcienia;   // + cieplej, − chłodniej
        g.mesh.setColorAt(i, kolor.setRGB(j * (1 + h), j * (1 + h * 0.25), j * (1 - h * 1.1)));
      });
      this.scena.add(g.mesh);
      this.grupy.push(g);
    }
    this.cienie = this.zbudujCienie(this.cienieDrzew.length);
    this.skala = 0;
    this.gotowe = true;
    this.aktualizuj(0);
    this.gdyPrzejete(przejete);
    console.info(`[drzewa3d] ${stempli}/${drzewa.length} stempli, ${zKafli}/${kaflowe.length} drzew z kafli, ${rek}/${rekwizyty.length} rekwizytów jako modele, ${this.grupy.length} grup`);
  }

  /**
   * Zioło do narysowania modelem — `true`, gdy jest model gatunku (wtedy
   * duszek zostaje do tapnięcia, ale nic nie rysuje). Przed wczytaniem pliku
   * `false`: zioło jest wtedy billboardem, a `WorldView3D` przepina je po
   * wczytaniu.
   */
  dodajZiolo(o: Ziolo): boolean {
    if (!this.gotowe || this.ziola.has(o)) return this.ziola.has(o);
    const lista = this.ksztalty.get(`ziolo_${o.herb}`);
    if (!lista) return false;
    const w = this.warianty.get(lista[Math.floor(los(o.x, o.y, 5) * lista.length) % lista.length])!;
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });
    mat.emissive.setHex(GATHER.nearGlow.color);
    mat.emissiveIntensity = 0;
    const mesh = new THREE.Mesh(w.geo, mat);
    mesh.rotation.order = "YXZ";
    mesh.rotation.y = los(o.x, o.y, 2) * Math.PI * 2;
    this.scena.add(mesh);
    this.ziola.set(o, { mesh, mat });
    this.przejete.add(o);
    (o as unknown as Record<string, unknown>).renderWebGL = NIC;
    return true;
  }

  private zbudujCienie(n: number): THREE.InstancedMesh {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(0,0,0,1)");
    gr.addColorStop(0.55, "rgba(0,0,0,0.75)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: DRZEWA_3D.cien.alfa, depthWrite: false });
    const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 2), mat, n);
    m.renderOrder = 1;
    this.scena.add(m);
    return m;
  }

  /**
   * ⭐ Rekwizyty ruchome (`REKWIZYTY_3D.animacje`) — macierze CO KLATKĘ, ale tylko
   * ich grup (koło młyńskie, płomień ogniska: pojedyncze sztuki na mapę).
   * Koło obraca się wokół własnej osi (model ma środek NA OSI, podniesiony
   * o `uniesienie` j.), płomień migocze skalą.
   */
  private animuj(s: number, t: number): void {
    const m = this._m, q = this._q, p = this._p, sk = this._sk;
    for (const g of this.ruchome) {
      const a = REKWIZYTY_3D.animacje[g.wariant.replace(/_\d+$/, "") as keyof typeof REKWIZYTY_3D.animacje];
      g.drzewa.forEach((d, i) => {
        const sg = s * g.skala;
        if ("uniesienie" in a) {
          // ⭐ Oś koła biegnie w ścianę młyna (wschód), skręcona o `skretDeg`
          // wokół pionu jak model (2026-10-14). Blender +X obrócony o θ
          // przeciwnie do wskazówek → glTF (cos θ, 0, −sin θ). Dodatni kąt
          // niesie wierzch z nurtem, na południe.
          const th = (a.skretDeg * Math.PI) / 180;
          this._osX.set(Math.cos(th), 0, -Math.sin(th));
          q.setFromAxisAngle(this._osX, (t * Math.PI * 2) / (WATERWHEEL.revolutionMs / 1000));
          m.compose(p.set(d.x, a.uniesienie * sg, d.y), q, sk.set(sg, sg, sg));
        } else {
          const f = d.x * 0.01;
          const mig = 1 + a.migotanie * (0.6 * Math.sin(t * 11 + f) + 0.4 * Math.sin(t * 17.3 + f * 2));
          q.setFromAxisAngle(this._osY, 0.25 * Math.sin(t * 2.3 + f));
          m.compose(p.set(d.x, 0, d.y), q, sk.set(sg * (2 - mig) ** 0.5, sg * mig, sg * (2 - mig) ** 0.5));
        }
        g.mesh.setMatrixAt(i, m);
      });
      g.mesh.instanceMatrix.needsUpdate = true;
    }
  }
  private readonly _m = new THREE.Matrix4();
  private readonly _q = new THREE.Quaternion();
  private readonly _p = new THREE.Vector3();
  private readonly _sk = new THREE.Vector3();
  private readonly _osX = new THREE.Vector3(1, 0, 0);
  private readonly _osY = new THREE.Vector3(0, 1, 0);
  /** Grupy z `REKWIZYTY_3D.animacje` (ustawiane przy budowie). */
  private ruchome: Grupa[] = [];

  /** Co klatkę: czas wiatru; macierze tylko, gdy zmieniła się skala świata. */
  aktualizuj(czasS: number): void {
    this.czas.value = czasS;
    const baza = pikseliNaJednostke();
    this.aktualizujZiola(baza, czasS);
    this.animuj(baza, czasS);
    const s = baza;
    if (!this.grupy.length || Math.abs(s - this.skala) < 1e-4) return;
    this.skala = s;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sk = new THREE.Vector3();
    const osY = new THREE.Vector3(0, 1, 0);
    for (const g of this.grupy) {
      const w = this.warianty.get(g.wariant)!;
      g.drzewa.forEach((d, i) => {
        const r = g.dokladny ? 1 : 1 + (los(d.x, d.y, 1) * 2 - 1) * DRZEWA_3D.rozrzutSkali;
        q.setFromAxisAngle(osY, d.obrot !== undefined ? (d.obrot * Math.PI) / 180
          : g.dokladny ? 0 : g.staly ? (los(d.x, d.y, 2) * 2 - 1) * 0.12 : los(d.x, d.y, 2) * Math.PI * 2);
        const [wx, wy] = g.dokladny ? [1, 1] : rozciag(d);
        const sg = s * g.skala * r;
        m.compose(p.set(d.x, 0, d.y), q, sk.set(sg * wx, sg * wy, sg * wx));
        g.wysPx[i] = w.wys * sg * wy;
        // dom z obrysem: zasłona z PROSTOKĄTA obiektu (niezależnie od obrotu modelu)
        g.polPx[i] = d.obrys ? d.obrys.w / 2 : (jestDomem(g.wariant) ? w.polSzer : w.promienKorony) * sg * wx;
        g.tylPx[i] = d.obrys ? d.obrys.h : jestDomem(g.wariant) ? w.tyl * sg * wx : 0;
        g.mesh.setMatrixAt(i, m);
      });
      g.mesh.instanceMatrix.needsUpdate = true;
      g.mesh.computeBoundingSphere();
    }
    if (this.cienie) {
      const plasko = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
      const [ox, oz] = DRZEWA_3D.cien.przesuniecie;
      this.cienieDrzew.forEach(({ d, w, skala }, i) => {
        const r = w.promienKorony * DRZEWA_3D.cien.promien * s * skala * 2 * rozciag(d)[0];
        m.compose(p.set(d.x + ox * r, 0.4, d.y + oz * r), plasko, sk.set(r * 1.15, r * 0.9, 1));
        this.cienie!.setMatrixAt(i, m);
      });
      this.cienie.instanceMatrix.needsUpdate = true;
      this.cienie.computeBoundingSphere();
    }
  }

  /**
   * Zasłony: egzemplarz, który zasłania tułów gracza, płynnie blednie cały.
   * `gX`, `gZ` — stopy gracza (px świata), `tanK` — tangens pochylenia kamery.
   * ⚠ Grupy niższe niż `ZASLONY_3D.minWysokosc` wzrostu pomijane w całości —
   * krzak czy zioło nie zasłonią postaci, a test na nich to czysty koszt.
   */
  zaslony(gX: number, gZ: number, wzrostPx: number, tanK: number, dtS: number): void {
    const krok = Math.min(1, (dtS * 1000) / ZASLONY_3D.czasMs);
    const tulow = wzrostPx * ZASLONY_3D.tulow;
    const minWys = wzrostPx * ZASLONY_3D.minWysokosc;
    for (const g of this.grupy) {
      const z = g.zanik.array as Float32Array;
      let zmiana = false;
      for (let i = 0; i < g.drzewa.length; i++) {
        const d = g.drzewa[i];
        const zx = d.obrys ? d.obrys.x + d.obrys.w / 2 : d.x;
        const zz = d.obrys ? d.obrys.y + d.obrys.h : d.y;
        const cel = g.wysPx[i] >= minWys && zaslania(gX, gZ, tulow, tanK, zx, zz, g.polPx[i], g.wysPx[i], g.tylPx[i]) ? 1 : 0;
        if (z[i] === cel) continue;
        z[i] = cel > z[i] ? Math.min(cel, z[i] + krok) : Math.max(cel, z[i] - krok);
        zmiana = true;
      }
      if (zmiana) g.zanik.needsUpdate = true;
    }
  }

  private aktualizujZiola(baza: number, czasS: number): void {
    const { min, max, okresMs } = REKWIZYTY_3D.poswiata;
    const puls = min + (max - min) * (0.5 + 0.5 * Math.sin((czasS * 1000 / okresMs) * Math.PI * 2));
    for (const [o, z] of this.ziola) {
      if (!o.active) {
        this.scena.remove(z.mesh);
        z.mat.dispose();
        this.ziola.delete(o);
        this.przejete.delete(o);
        continue;
      }
      // pojawia się/znika z ALFĄ duszka (zanik przy zbiorze, wejście po odroście)
      const k = baza * REKWIZYTY_3D.skalaZiol * (0.3 + 0.7 * o.alpha);
      z.mesh.position.set(o.x, 0, o.y);
      z.mesh.scale.set(k, k * o.scaleY, k);
      z.mesh.rotation.z = -o.angle * Math.PI / 180;   // kołysanie z tweenu duszka
      z.mesh.visible = o.alpha > 0.02;
      z.mat.emissiveIntensity = o.blisko ? puls : 0;
    }
  }

  destroy(): void {
    this.zywy = false;
    for (const z of this.ziola.values()) { this.scena.remove(z.mesh); z.mat.dispose(); }
    this.ziola.clear();
    for (const g of this.grupy) this.scena.remove(g.mesh);
    if (this.cienie) this.scena.remove(this.cienie);
    for (const w of this.warianty.values()) w.geo.dispose();
    this.material.dispose();
    this.materialSztywny.dispose();
    this.materialSwiecacy.dispose();
  }
}
