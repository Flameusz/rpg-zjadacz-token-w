import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { clone as klonujSzkielet } from "three/addons/utils/SkeletonUtils.js";
import type Phaser from "phaser";
import { AKTYWNOSC_STWORZEN, DEPTH, type Model3DCfg } from "../config/GameConfig";
import { ySortedWorldFor } from "../core/YSortedWorld";
import { ELEV_DEG, J_NA_PX } from "./Character3D";
import { dodajSwiatlo, kosztyStworzen, nowyKlucz, renderujDo, skalaSwiata, swiat3d, wSwiecie, wspolnyRenderer, zapiszKoszt, zeSwiata } from "./Shared3D";
import { RENDER_H, RENDER_W } from "./Character3D";

/**
 * ⭐⭐ **STWORZENIE 3D** (2026-10-03, `OI-161`) — model zamiast arkusza 2D,
 * dla wroga, który zgłasza `stan3d()`.
 *
 * Ta sama droga co gracz (`Character3D`): three.js rysuje do canvasa, Phaser
 * dostaje z niego teksturę i rysuje ją jako `Image` w tej samej warstwie
 * Y-sortowanej, więc stworzenie wchodzi za drzewo jak każdy duszek.
 *
 * ⛔ **Logika encji się NIE zmienia.** AI, ciało, trafienia i pasek HP zostają
 * przy sprite'cie Phasera, a ten obiekt co klatkę kopiuje z niego pozycję,
 * przezroczystość i TINT (telegrafy są tintami — `src/entities/CLAUDE.md`).
 *
 * ⚠⚠ **Sprite NIE jest gaszony `setVisible(false)`** — Phaser 3.90 pomija
 * w trafieniu wskaźnikiem wszystko, co „nie wyrenderuje się" (`willRender`:
 * widoczność ORAZ alfa), a `input.alwaysEnabled` w tej wersji nie istnieje.
 * Niewidocznego dzika nie dałoby się wybrać palcem. Zamiast tego ta JEDNA
 * instancja dostaje puste `renderWebGL`/`renderCanvas`: dla Phasera dalej
 * jest widoczna (tap, alfa z tweenów, tint — wszystko działa), tylko nic nie
 * rysuje.
 *
 * ⚠ Arkusz 2D zostaje ścieżką awaryjną: sprite gaśnie dopiero, gdy model
 * naprawdę stanął w świecie (`gdyGotowy`).
 */

/** Bufor stworzenia: wycinek wspólnego bufora gracza — mniejszy = tańsza wysyłka. */
const BUF_W = 128;
const BUF_H = 96;
/** Środek kadru nad gruntem (j.) — dzik ma 5,9 j. w kłębie. */
const SRODEK_KADRU = 3.2;
/** Zapas poza kadrem kamery, w którym jeszcze rysujemy (px świata). */
const ZAPAS_WIDOKU = 96;
const TEMPO_OBROTU = 9.0;
const PRZENIKANIE_S = 0.15;
/** Skala, gdy gracz jeszcze nie zmierzył swojej (pierwsze klatki sceny). */
const SKALA_ZAPASOWA = 0.6;
const CIEN_ALFA = 0.30;
/** Ile ciało dogrywa śmierć PO zniszczeniu obiektu Phasera (s), potem znika. */
const ZANIK_PO_SMIERCI_S = 0.6;

/** Co encja chce pokazać w tej klatce. */
export type Stan3D = {
  klip: string;
  /** Odegraj raz i zatrzymaj na ostatniej klatce (śmierć, cios). */
  raz?: boolean;
  tempo?: number;
  /** Zwrot (rad, 0 = w dół ekranu, jak `Player.zwrotKat`); brak → z prędkości. */
  kat?: number | null;
  /**
   * Znacznik startu (czas sceny): zmiana = odegraj klip OD NOWA, także ten sam.
   * Królik: każde wybicie to nowy skok i klip musi zacząć się z ciałem, inaczej
   * łapy rozjadą się z ruchem w ciągu dwóch skoków (ta sama pułapka, którą
   * arkusz 2D ma w `Rabbit.updateAnimation`).
   */
  od?: number;
};
type Host = Phaser.Physics.Arcade.Sprite & { stan3d(): Stan3D; readonly isDead: boolean };

const BEZ_RYSOWANIA = (): void => {};

const cache = new Map<string, Promise<GLTF>>();
function wczytaj(sciezka: string): Promise<GLTF> {
  let p = cache.get(sciezka);
  if (!p) {
    p = new Promise((ok, zle) => new GLTFLoader().load(sciezka, ok, undefined, zle));
    cache.set(sciezka, p);
    p.catch(() => cache.delete(sciezka));
  }
  return p;
}

export class Creature3D {
  /** Wszystkie żywe — do pomiaru i do sprzątania przy końcu sceny. */
  static readonly wszystkie = new Set<Creature3D>();

  private readonly scena3d = new THREE.Scene();
  private readonly kamera: THREE.OrthographicCamera;
  private readonly most: HTMLCanvasElement;
  private readonly mostCtx: CanvasRenderingContext2D;
  private readonly klucz = nowyKlucz("creature3d");
  private tekstura: Phaser.Textures.CanvasTexture | null = null;
  private obraz: Phaser.GameObjects.Image | null = null;
  private cien: Phaser.GameObjects.Ellipse | null = null;
  private korzen: THREE.Object3D | null = null;
  private mikser: THREE.AnimationMixer | null = null;
  private readonly akcje = new Map<string, THREE.AnimationAction>();
  private biezacy: { klip: string; akcja: THREE.AnimationAction; od?: number } | null = null;
  private kat = 0;
  private czasMs = 0;
  /** Wiersz bufora ze stopami (dół treści) — kotwica obrazka w gruncie. */
  private wierszStop = BUF_H - 1;
  private readonly bufW: number;
  private readonly bufH: number;
  private readonly skalaModelu: number;
  private readonly krawedz: number;
  private readonly styl: Model3DCfg["styl"];
  private readonly bezTintu: boolean;
  private readonly predkosci: Record<string, number>;
  private zmierzony = false;
  private zywy = true;
  /** Obiekt Phasera zniknął (śmierć) — ciało dogrywa klip samo. */
  private porzucony = false;
  private zanikOd = 0;
  private ostatnio = { x: 0, y: 0, depth: 0 };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly cel: Host,
    cfg: Model3DCfg,
    private readonly gdyGotowy?: () => void,
    private readonly gdyBlad?: (e: unknown) => void,
  ) {
    wspolnyRenderer(RENDER_W, RENDER_H);
    [this.bufW, this.bufH] = cfg.bufor ?? [BUF_W, BUF_H];
    this.skalaModelu = cfg.skala ?? 1;
    this.krawedz = cfg.krawedz ?? 0;
    this.styl = cfg.styl;
    this.bezTintu = cfg.bezTintu ?? false;
    this.predkosci = cfg.predkosciKlipow;
    this.wierszStop = this.bufH - 1;
    const sciezka = cfg.sciezka;
    const srodek = cfg.srodek ?? SRODEK_KADRU;
    this.most = document.createElement("canvas");
    this.most.width = this.bufW;
    this.most.height = this.bufH;
    this.mostCtx = this.most.getContext("2d")!;
    this.mostCtx.imageSmoothingEnabled = false;
    const w = this.bufW * J_NA_PX;
    const h = this.bufH * J_NA_PX;
    this.kamera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 500);
    const e = THREE.MathUtils.degToRad(ELEV_DEG);
    this.kamera.position.set(0, srodek + Math.sin(e) * 100, Math.cos(e) * 100);
    this.kamera.lookAt(0, srodek, 0);
    dodajSwiatlo(this.scena3d);
    Creature3D.wszystkie.add(this);

    cel.once("destroy", () => {
      this.porzucony = true;
      this.zanikOd = 0;
    });

    wczytaj(sciezka).then((gltf) => this.wstaw(gltf), (e) => {
      console.warn(`[creature3d] nie wczytał się ${sciezka} — zostaje arkusz 2D`, e);
      this.gdyBlad?.(e);
      this.destroy();
    });
  }

  private wstaw(gltf: GLTF): void {
    if (!this.zywy || this.porzucony) { this.destroy(); return; }
    const model = klonujSzkielet(gltf.scene);
    model.scale.setScalar(this.skalaModelu);
    const obrot = new THREE.Object3D();
    if (this.krawedz) obrot.userData.krawedz = this.krawedz;
    if (this.styl) obrot.userData.styl = this.styl;
    obrot.add(model);
    this.scena3d.add(obrot);
    this.korzen = obrot;
    this.mikser = new THREE.AnimationMixer(model);
    for (const klip of gltf.animations) this.akcje.set(klip.name, this.mikser.clipAction(klip));

    this.tekstura = this.scene.textures.addCanvas(this.klucz, this.most);
    const img = this.scene.add.image(this.cel.x, this.cel.y, this.klucz);
    ySortedWorldFor(this.scene)?.add(img);
    this.obraz = img;
    const body = this.cel.body as Phaser.Physics.Arcade.Body | null;
    const szer = Math.max(28, (body?.width ?? 40) * 1.15);
    this.cien = this.scene.add.ellipse(this.cel.x, this.cel.y, szer, szer * 0.34, 0x000000, CIEN_ALFA)
      .setDepth(DEPTH.overlay + 5);

    // Sprite przestaje RYSOWAĆ dopiero teraz — i dalej przyjmuje tap.
    const s = this.cel as unknown as Record<string, unknown>;
    s.renderWebGL = BEZ_RYSOWANIA;
    s.renderCanvas = BEZ_RYSOWANIA;
    this.scene.events.on("update", this.krok, this);
    this.gdyGotowy?.();
  }

  private graj(st: Stan3D, predkoscPx = 0): void {
    const nazwa = this.akcje.has(st.klip) ? st.klip : "Idle";
    const akcja = this.akcje.get(nazwa);
    if (!akcja) return;
    // Tempo lokomocji z prędkości ciała: racice mają przesuwać się po gruncie
    // tyle, ile jedzie ciało (inaczej ślizg). Jawne `tempo` encji wygrywa.
    // Klip przesuwa łapy o `wzor` j./s w skali 1 — model w skali `s` o `wzor·s`.
    const wzor = (this.predkosci[nazwa] ?? 0) * this.skalaModelu;
    const pxNaJ = (skalaSwiata.obrazu || SKALA_ZAPASOWA) / J_NA_PX;
    akcja.timeScale = st.tempo ?? (wzor && predkoscPx > 1
      ? Math.min(2.5, Math.max(0.5, predkoscPx / pxNaJ / wzor)) : 1);
    if (this.biezacy?.klip === nazwa && this.biezacy.od === st.od) return;
    if (this.biezacy?.klip === nazwa) {
      // Ten sam klip, nowy start (`od`) — od nowa, bez przenikania z samym sobą.
      akcja.reset().play();
      this.biezacy.od = st.od;
      return;
    }
    akcja.reset();
    akcja.setLoop(st.raz ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    akcja.clampWhenFinished = !!st.raz;
    akcja.play();
    if (this.biezacy) this.biezacy.akcja.crossFadeTo(akcja, PRZENIKANIE_S, false);
    this.biezacy = { klip: nazwa, akcja, od: st.od };
  }

  /** Czas sceny (performance) początku upadku bez klipu; 0 = jeszcze żyje. */
  private upadekOd = 0;

  /** Postęp upadku 0…1 (start przy pierwszym wywołaniu po śmierci). */
  private upadek(): number {
    const teraz = performance.now();
    if (!this.upadekOd) this.upadekOd = teraz;
    return Math.min(1, (teraz - this.upadekOd) / 400);
  }

  private krok(): void {
    const img = this.obraz;
    if (!img || !this.korzen || !this.mikser) return;
    const teraz = performance.now();
    const dt = this.czasMs === 0 ? 0 : Math.min(0.1, (teraz - this.czasMs) / 1000);
    this.czasMs = teraz;

    if (!this.porzucony) {
      const st = this.cel.isDead ? { klip: "Death", raz: true } : this.cel.stan3d();
      const body = this.cel.body as Phaser.Physics.Arcade.Body | null;
      const vx = body?.velocity.x ?? 0;
      const vy = body?.velocity.y ?? 0;
      this.graj(st, Math.hypot(vx, vy));
      const cel = typeof st.kat === "number" ? st.kat : (vx * vx + vy * vy > 64 ? Math.atan2(vx, vy) : this.kat);
      let d = cel - this.kat;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      const maks = TEMPO_OBROTU * dt;
      this.kat += Math.abs(d) <= maks ? d : Math.sign(d) * maks;
      // Stopy w gruncie: dół ciała Arcade (ciało zakotwiczone u stóp).
      const stopyY = body ? body.bottom : this.cel.y + this.cel.displayHeight / 2;
      this.ostatnio = { x: this.cel.x, y: stopyY, depth: DEPTH.entities + this.cel.y };
      if (this.cel.isTinted && !this.bezTintu) img.setTint(this.cel.tintTopLeft); else img.clearTint();
      if (!this.cel.isDead) img.setAlpha(this.cel.alpha);
    } else {
      this.graj({ klip: "Death", raz: true });
      const a = this.biezacy?.akcja;
      // Bez klipu śmierci (humanoid, `tools/npc3d.py` tryb wroga) koniec
      // wyznacza UPADEK niżej — `Idle` w pętli nigdy by się nie skończył.
      const skonczony = this.akcje.has("Death") ? !a || !a.isRunning() : this.upadek() >= 1;
      if (skonczony) {
        this.zanikOd = this.zanikOd || teraz;
        const u = (teraz - this.zanikOd) / 1000 / ZANIK_PO_SMIERCI_S;
        img.setAlpha(Math.max(0, 1 - u));
        if (u >= 1) { this.destroy(); return; }
      }
    }
    this.korzen.rotation.y = this.kat;
    // ⭐ Śmierć bez klipu: model pada na bok (2026-10-11, humanoidalni wrogowie)
    //   — ten sam ruch, co gracz w `Character3D`: obrót wokół osi własnego
    //   zwrotu, 400 ms, ease-in. Zwierzęta mają `Death` i tu nie wchodzą.
    if ((this.cel.isDead || this.porzucony) && !this.akcje.has("Death")) {
      const p = this.upadek();
      this.korzen.rotation.z = p * p * (Math.PI / 2);
    }
    // ⭐ Daleko od kadru (`AKTYWNOSC_STWORZEN`) model nie odgrywa animacji i nie
    //   jest rysowany — szkielet ze skórą to koszt CPU co klatkę, także poza
    //   kadrem, gdzie three i tak by go nie narysował.
    const sr = this.scene.cameras.main.midPoint;
    const daleko = !this.porzucony
      && Math.hypot(this.ostatnio.x - sr.x, this.ostatnio.y - sr.y) > AKTYWNOSC_STWORZEN.promienPx;
    this.korzen.visible = !daleko;
    if (daleko) {
      if (swiat3d.scena) { img.setVisible(false); this.cien?.setVisible(false); }
      return;
    }
    this.mikser.update(dt);

    // ⭐ Prototyp „świat w 3D" (`WorldView3D`): model w scenie świata, bez bufora.
    if (swiat3d.scena) {
      img.setVisible(false);
      this.cien?.setVisible(false);
      wSwiecie(this.korzen, this.ostatnio.x, this.ostatnio.y, this.cel.isTinted && !this.bezTintu ? this.cel.tintTopLeft : null, img.alpha);
      return;
    }
    if (this.korzen.parent !== this.scena3d) {
      zeSwiata(this.korzen, this.scena3d);
      img.setVisible(true);
    }

    const s = skalaSwiata.obrazu || SKALA_ZAPASOWA;
    img.setScale(s);
    img.setOrigin(0.5, (this.wierszStop + 1) / this.bufH);
    img.setPosition(this.ostatnio.x, this.ostatnio.y);
    img.setDepth(this.ostatnio.depth);
    this.cien?.setPosition(this.ostatnio.x, this.ostatnio.y).setAlpha(CIEN_ALFA * img.alpha).setVisible(img.alpha > 0.02);

    // ⚠ Poza kadrem kamery NIE rysujemy — to jest główna oszczędność przy
    // kilkunastu stworzeniach na mapie. Obraz zostaje z ostatnią klatką.
    const v = this.scene.cameras.main.worldView;
    const r = this.bufW * s;
    if (this.ostatnio.x + r < v.x - ZAPAS_WIDOKU || this.ostatnio.x - r > v.right + ZAPAS_WIDOKU
        || this.ostatnio.y + r < v.y - ZAPAS_WIDOKU || this.ostatnio.y - r > v.bottom + ZAPAS_WIDOKU) return;

    const t0 = performance.now();
    renderujDo(this.mostCtx, this.scena3d, this.kamera, this.bufW, this.bufH);
    this.tekstura?.refresh();
    zapiszKoszt(performance.now() - t0);
    if (!this.zmierzony) this.zmierzStopy();
  }

  /** Raz: najniższy wiersz z treścią = stopy (kotwica obrazka w gruncie). */
  private zmierzStopy(): void {
    const W = this.bufW;
    const d = this.mostCtx.getImageData(0, 0, W, this.bufH).data;
    for (let y = this.bufH - 1; y >= 0; y--) {
      for (let x = 0; x < W; x++) {
        if (d[(y * W + x) * 4 + 3] > 8) {
          this.wierszStop = y;
          this.zmierzony = true;
          return;
        }
      }
    }
  }

  /**
   * PRZYRZĄD POMIAROWY: `n` dzików 3D wokół punktu, w kłusie, bez AI i bez
   * ciała walki (`dev.char3d.manekiny(n)`; `0` sprząta). Odpowiada LICZBĄ na
   * pytanie z `OI-3D-3`: ile stworzeń 3D telefon udźwignie naraz.
   */
  static manekiny(scene: Phaser.Scene, n: number, x: number, y: number, cfg: Model3DCfg): number {
    for (const c of [...Creature3D.wszystkie]) {
      if ((c.cel as unknown as { manekin?: boolean }).manekin) { c.cel.destroy(); c.destroy(); }
    }
    for (let i = 0; i < n; i++) {
      const a = (i / Math.max(1, n)) * Math.PI * 2;
      const r = 70 + 22 * (i % 3);
      const s = scene.physics.add.sprite(x + Math.cos(a) * r, y + Math.sin(a) * r, "boar", 0) as unknown as Host;
      Object.assign(s, { manekin: true, isDead: false, stan3d: (): Stan3D => ({ klip: "Trot", kat: a + Math.PI / 2 }) });
      ySortedWorldFor(scene)?.add(s);
      new Creature3D(scene, s, cfg);
    }
    return n;
  }

  /** Koszt mostu wszystkich stworzeń: percentyle ms na JEDNO stworzenie-klatkę. */
  static koszt(): Record<string, number | string> {
    const s = [...kosztyStworzen].sort((a, b) => a - b);
    if (s.length < 30) return { uwaga: "za mało klatek — poczekaj chwilę", stworzen: Creature3D.wszystkie.size };
    const p = (q: number) => +s[Math.floor(s.length * q)].toFixed(3);
    return { stworzen: Creature3D.wszystkie.size, probek: s.length, msP50: p(0.5), msP95: p(0.95),
             msP99: p(0.99), msMax: +s[s.length - 1].toFixed(3), buforDomyslny: `${BUF_W}x${BUF_H}` };
  }

  destroy(): void {
    if (!this.zywy) return;
    this.zywy = false;
    Creature3D.wszystkie.delete(this);
    this.scene.events.off("update", this.krok, this);
    this.obraz?.destroy();
    this.cien?.destroy();
    this.mikser?.stopAllAction();
    this.korzen?.removeFromParent();
    if (this.scene.textures.exists(this.klucz)) this.scene.textures.remove(this.klucz);
    // Sprite znowu rysuje (model zdjęty z konsoli albo się nie wczytał):
    // własne pola instancji znikają, wraca metoda z prototypu.
    const s = this.cel as unknown as Record<string, unknown>;
    if (s.renderWebGL === BEZ_RYSOWANIA) delete s.renderWebGL;
    if (s.renderCanvas === BEZ_RYSOWANIA) delete s.renderCanvas;
  }
}
