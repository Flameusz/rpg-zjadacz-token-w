import * as THREE from "three";
import Phaser from "phaser";
import { DEPTH, DRZEWA_3D, GRUNT_3D, KAMERA_3D, REKWIZYTY_3D, WODA_3D, ZASLONY_3D } from "../config/GameConfig";
import { ySortedWorldFor } from "../core/YSortedWorld";
import { TREE_STAMP_TRUNK_SLICE } from "../world/TreeStampManifest";
import { pikseliNaJednostke, swiat3d } from "./Shared3D";
import { BAYER_GLSL, Trees3D, ZANIK_DISCARD, zaslania, type DrzewoZKafli } from "./Trees3D";
import { propInstancesFor } from "../world/PropInstances";
import { buildingsFor, kotwicaFrontu, type BuildingObject } from "../world/Buildings";

/**
 * ⭐⭐ **PROTOTYP „ŚWIAT W 3D"** (2026-10-04, decyzja autora: „zobaczmy, co
 * z tego wyjdzie"). Odpowiada na jedno pytanie: czy rozgrywka 2D z obrazem
 * w JEDNEJ scenie 3D (kamera pochylona jak w LoL / Metinie) wygląda i chodzi
 * lepiej niż dzisiejsza mieszanka „ziemia z góry + postacie z boku".
 *
 * ⛔ **Nic z logiki się nie zmienia.** AI, fizyka Arcade, NavGrid, walka,
 * HUD — wszystko zostaje w Phaserze. Ten obiekt wyłącznie RYSUJE świat:
 *  - grunt: warstwy kafli Tiled wypieczone w tekstury na płaskiej płaszczyźnie
 *    (ten sam pixel-art), plus płaskie rekwizyty tła;
 *  - drzewa i rekwizyty stojące: BILLBOARDY z tych samych arkuszy, równoległe
 *    do płaszczyzny obrazu, instancjonowane (jedno wywołanie rysowania na
 *    arkusz), sortowane buforem głębi PER PIKSEL z postaciami;
 *  - postacie i stworzenia: ich własne animowane modele, przeniesione do tej
 *    sceny (`swiat3d` w `Shared3D`).
 *
 * ⭐ **Kamera Phasera jest ściśnięta w pionie o sin(pochylenia)**
 * (`setZoom(z, z·sinθ)`) — wtedy wszystko, co leży NA GRUNCIE (pierścień celu,
 * tap → pozycja w świecie, kafel pod stopą), trafia w to samo miejsce ekranu co
 * w scenie 3D. Pasek HP i liczby lecą tą samą drogą, więc są „mniej więcej"
 * nad głową, nie dokładnie — znany koszt prototypu.
 *
 * Włączony DOMYŚLNIE (od 2026-10-06); 2D: `?widok2d` / build `VITE_WIDOK3D=0`
 * (płótno Phasera musi być przezroczyste od startu). Strojenie:
 * `dev.widok3d.kat(35|40|45)`, `dev.widok3d.zoom(x)`.
 */

const NIC = (): void => {};
/**
 * Nakładka nad głową: napis albo prostokąt (pasek HP) w paśmie encji, albo
 * obrazek wiszący WYSOKO nad własnym punktem sortowania (sakiewka kupca —
 * głębokość właściciela, położenie 40+ px wyżej). Rekwizyt stoi w swoim
 * punkcie sortowania albo poniżej (kamień, pień).
 */
const jestNakladka = (o: unknown): boolean => {
  if (o instanceof Phaser.GameObjects.Text || o instanceof Phaser.GameObjects.Rectangle) return true;
  if (!(o instanceof Phaser.GameObjects.Image) || o.body || o.depth >= DEPTH.overhead) return false;
  const dol = o.y - o.displayOriginY * o.scaleY + o.displayHeight;
  return o.depth - DEPTH.entities - dol > 12;
};
/** `Gatherable` (zioło) — rozpoznane po kształcie, bez importu encji. */
const jestZiolem = (o: unknown): o is Phaser.GameObjects.Sprite & { herb: string; blisko?: boolean } =>
  o instanceof Phaser.GameObjects.Sprite && typeof (o as { herb?: unknown }).herb === "string"
  && (o as { interactKind?: unknown }).interactKind === "gather";
const jestObrazem = (o: unknown): o is Phaser.GameObjects.Image | Phaser.GameObjects.Sprite =>
  (o instanceof Phaser.GameObjects.Image || o instanceof Phaser.GameObjects.Sprite) && !(o instanceof Phaser.GameObjects.Text);
const CHUNK = 1024;

type Wpis = {
  obj: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
  partia: Partia;
  i: number;
  /** Ostatnio wpisany stan — przepisujemy macierz tylko przy zmianie. */
  sig: string;
  /** Kotwica w gruncie i przesunięcie w górę (korona drzewa nad pniem). */
  wDol: number;
  /** Drzewo: nie rusza się nigdy — macierz liczona raz (i przy zmianie kąta). */
  staly: boolean;
  /** Leży płasko na gruncie (`REKWIZYTY_3D.plaskie`), zamiast stać. */
  plaski?: boolean;
  /** Prostokąt w świecie z ostatniego ustawienia (do testu zasłony) i zanik 0…1. */
  lewo: number; dol: number; wPx: number; hPx: number; zanik: number;
  /** Ostatni stan (x, y, klatka, lustro, widoczność, skala) — bez sklejania napisów. */
  ox: number; oy: number; of: unknown; ofl: boolean; ow: boolean; osx: number; osy: number;
  /** Ostatni tint Phasera (mnożony kolor) — patrz `aktualizujBillboardy`. */
  otn: number;
};

/** Wzrost modelu gracza (j.) — punkt odniesienia testu zasłony. */
const WZROST_GRACZA_J = 12.8;

/**
 * Rodziny warstw, które w 3D STAJĄ, a nie leżą. `baza` = warstwy niosące
 * podstawę (ścianę, pień): kotwica obiektu to najniższy ich wiersz.
 */
const PIONOWE = [
  { nazwa: "budynki", warstwy: ["buildings", "buildings-detale", "wyposazenie", "znaki", "buildings-over"], baza: ["buildings", "wyposazenie", "znaki"], perPien: false },
  { nazwa: "drzewa", warstwy: ["trees-base", "trees-over"], baza: ["trees-base"], perPien: true },
] as const;
type Rodzina = (typeof PIONOWE)[number];

type Kom = { x: number; y: number };
type Obiekt = {
  x0: number; x1: number; y0: number;
  /** Wiersz podstawy (kafle) — billboard stoi na dolnej krawędzi tego wiersza. */
  kotwica: number;
  kafle: { x: number; y: number; t: Phaser.Tilemaps.Tile }[];
  /** Kafle PONIŻEJ podstawy (próg, schodek) — idą płasko w grunt. */
  rozlane: Kom[];
};

function warstwaMa(l: Phaser.Tilemaps.TilemapLayer, x: number, y: number): boolean {
  const t = l.getTileAt(x, y);
  return !!t && t.index >= 0;
}

/**
 * Budynek = spójna (4-sąsiedztwo) grupa kafli rodziny. Drzewa: ta sama grupa
 * rozbita na PNIE — każdy kafel korony idzie do najbliższego pnia pod nim
 * (⚠ cała gęstwina jako jeden billboard stałaby na najniższym pniu i chowała
 * wszystko, co jest w środku lasu).
 */
function wyodrebnij(ws: Phaser.Tilemaps.TilemapLayer[], r: Rodzina, MW: number, MH: number,
  bierz: (t: Phaser.Tilemaps.Tile) => boolean = () => true): Obiekt[] {
  const jest = new Uint8Array(MW * MH);
  const baza = new Uint8Array(MW * MH);
  const ma = (l: Phaser.Tilemaps.TilemapLayer, x: number, y: number) => warstwaMa(l, x, y) && bierz(l.getTileAt(x, y)!);
  for (const l of ws) {
    const czyBaza = (r.baza as readonly string[]).includes(l.layer.name);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (!ma(l, x, y)) continue;
      jest[y * MW + x] = 1;
      if (czyBaza) baza[y * MW + x] = 1;
    }
  }
  const kafleW = (x: number, y: number) => ws.map((l) => l.getTileAt(x, y)).filter((t): t is Phaser.Tilemaps.Tile => !!t && t.index >= 0 && bierz(t));
  const spojne = (maska: Uint8Array, dozwolone?: Set<number>): Kom[][] => {
    const widz = new Uint8Array(MW * MH);
    const out: Kom[][] = [];
    for (let i = 0; i < MW * MH; i++) {
      if (!maska[i] || widz[i] || (dozwolone && !dozwolone.has(i))) continue;
      const grupa: Kom[] = [];
      const stos = [i];
      widz[i] = 1;
      while (stos.length) {
        const k = stos.pop()!;
        const x = k % MW, y = (k / MW) | 0;
        grupa.push({ x, y });
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
          const n = ny * MW + nx;
          if (maska[n] && !widz[n] && (!dozwolone || dozwolone.has(n))) { widz[n] = 1; stos.push(n); }
        }
      }
      out.push(grupa);
    }
    return out;
  };
  const zbuduj = (komorki: Kom[], kotwica: number): Obiekt => {
    const o: Obiekt = { x0: 1e9, x1: -1, y0: 1e9, kotwica, kafle: [], rozlane: [] };
    for (const c of komorki) {
      if (c.y > kotwica) { o.rozlane.push(c); continue; }
      o.x0 = Math.min(o.x0, c.x); o.x1 = Math.max(o.x1, c.x); o.y0 = Math.min(o.y0, c.y);
      for (const t of kafleW(c.x, c.y)) o.kafle.push({ x: c.x, y: c.y, t });
    }
    return o;
  };
  const wynik: Obiekt[] = [];
  for (const grupa of spojne(jest)) {
    const indeksy = new Set(grupa.map((c) => c.y * MW + c.x));
    const bazy = grupa.filter((c) => baza[c.y * MW + c.x]);
    if (!r.perPien || bazy.length === 0) {
      const kotwica = (bazy.length ? bazy : grupa).reduce((m, c) => Math.max(m, c.y), -1);
      const o = zbuduj(grupa, kotwica);
      if (o.kafle.length) wynik.push(o);
      continue;
    }
    // drzewa: pnie = spójne grupy kafli bazy; reszta do najbliższego pnia pod spodem
    const bazaMaska = new Uint8Array(MW * MH);
    for (const c of bazy) bazaMaska[c.y * MW + c.x] = 1;
    const pnie = spojne(bazaMaska, indeksy).map((kom) => ({
      kom: [...kom], x0: Math.min(...kom.map((c) => c.x)), x1: Math.max(...kom.map((c) => c.x)),
      y0: Math.min(...kom.map((c) => c.y)), y1: Math.max(...kom.map((c) => c.y)),
    }));
    for (const c of grupa) {
      if (baza[c.y * MW + c.x]) continue;
      let naj = pnie[0], koszt = 1e9;
      for (const p of pnie) {
        const dx = c.x < p.x0 ? p.x0 - c.x : c.x > p.x1 ? c.x - p.x1 : 0;
        const dy = p.y1 >= c.y ? p.y1 - c.y : 100 + (c.y - p.y1);   // korona NAD pniem tańsza
        const k = dx * 4 + dy;
        if (k < koszt) { koszt = k; naj = p; }
      }
      naj.kom.push(c);
    }
    for (const p of pnie) {
      const o = zbuduj(p.kom, p.y1);
      if (o.kafle.length) wynik.push(o);
    }
  }
  return wynik;
}

/** Kafle `Nature` w dolnym rzędzie obiektu — po nich rozpoznaje się gatunek drzewa. */
function pienNature(o: Obiekt): Obiekt["kafle"] {
  return o.kafle.filter((k) => k.y === o.kotwica && k.t.tileset?.name === "Nature");
}

/** Instancjonowane billboardy jednego źródła obrazka (arkusza). */
class Partia {
  readonly mesh: THREE.InstancedMesh;
  readonly uv: THREE.InstancedBufferAttribute;
  /** Zanik per egzemplarz (zasłona gracza) — patrz `ZASLONY_3D`. */
  readonly zanik: THREE.InstancedBufferAttribute;
  wolne = 0;
  constructor(readonly zrodlo: CanvasImageSource & { width: number; height: number }, readonly pojemnosc: number) {
    const tex = new THREE.Texture(zrodlo as HTMLImageElement);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    const geo = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
    this.uv = new THREE.InstancedBufferAttribute(new Float32Array(pojemnosc * 4), 4);
    geo.setAttribute("aUvRect", this.uv);
    this.zanik = new THREE.InstancedBufferAttribute(new Float32Array(pojemnosc), 1);
    this.zanik.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("aZanik", this.zanik);
    const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute vec4 aUvRect;\nattribute float aZanik;\nvarying float vZanik;")
        .replace("#include <uv_vertex>", "#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = uv * aUvRect.zw + aUvRect.xy;\n#endif\nvZanik = aZanik;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vZanik;\n" + BAYER_GLSL)
        .replace("#include <alphatest_fragment>", "#include <alphatest_fragment>\n" + ZANIK_DISCARD);
    };
    this.mesh = new THREE.InstancedMesh(geo, mat, pojemnosc);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
  }
}

export class WorldView3D {
  private static renderer: THREE.WebGLRenderer | null = null;
  private readonly scena = new THREE.Scene();
  private readonly kamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 12000);
  private readonly partie = new Map<unknown, Partia>();
  private readonly wpisy = new Map<Phaser.GameObjects.GameObject, Wpis>();
  private readonly cienie = new Map<Phaser.GameObjects.GameObject, THREE.Mesh>();
  private readonly cienGeo = new THREE.CircleGeometry(1, 20);
  private readonly cienMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false });
  private klatka = 0;
  private bazowyZoom = 1;
  private zywy = true;
  /** Pochylenie kamery nad gruntem (°) i dodatkowy mnożnik przybliżenia. */
  static kat = 40;
  static mnoznik: number = KAMERA_3D.przyblizenie;
  private macierze = true;
  private ostatniKat = NaN;
  /** Obiekty pionowe z kafli (budynki, drzewa) — stoją na stałe, przeliczane
   *  tylko przy zmianie kąta kamery. */
  private readonly stale: {
    p: Partia; i: number; lewo: number; dol: number; w: number; h: number; ukryty?: boolean; zanik: number;
    /** Alfa obrazka w punkcie (ułamki szerokości i wysokości od lewej-GÓRY). */
    alfa: (fx: number, fy: number) => number;
  }[] = [];
  /** Drzewa z kafli rozpoznane po dolnym kaflu — kandydaci na model 3D. */
  private readonly kafloweDrzewa: DrzewoZKafli[] = [];
  /**
   * ⭐ GRUNT DOCZYTYWANY W OKNIE (2026-10-09, etap 1 kawałków 64×64): płat
   * 1024 px (pół kawałka) wypieka się, gdy wchodzi w kadr z zapasem, i jest
   * zwalniany, gdy zostaje daleko za kadrem. ⚠ Do tej daty cała mapa była
   * pieczona z góry: las 240×90 = ~70 tekstur 1024², ~400 MB na karcie,
   * liniowo z powierzchnią — mapa 256² nie zmieściłaby się w telefonie.
   */
  private readonly plaszczyznyGruntu = new Map<string, { meshe: THREE.Mesh[]; cx: number; cy: number }>();
  private piecPlat: ((cx: number, cy: number) => THREE.Mesh[]) | null = null;
  private wymiaryGruntu = { W: 0, H: 0 };
  /** Kępki z kafli dostały modele — ich zapasowa płaszczyzna już niepotrzebna. */
  private kepkiZgaszone = false;
  /**
   * ⭐ NAKŁADKI NAD GŁOWĄ (imię, znaczniki zadań, pasek HP) → ich właściciel.
   * Zostają w Phaserze, ale w ściśniętej kamerze odstęp „nad stopami" kurczy
   * się o `sinθ`, a postać stoi w pełnej wysokości — podpis lądował na
   * twarzy (zrzut 2026-10-04). Tuż przed renderem Phasera są podnoszone,
   * po renderze wracają: logika gry nigdy nie widzi zmienionego `y`.
   */
  private readonly nakladki = new Map<Phaser.GameObjects.GameObject, Phaser.GameObjects.GameObject>();
  /** Czas wody (s) — wspólny uniform shaderów wody, przewijany w `rysuj`. */
  private readonly czasWody = { value: 0 };
  private readonly podniesione: { o: { y: number; scaleY: number }; y: number; sy: number }[] = [];
  /**
   * ⭐ Obszary trafienia (tap) rozciągnięte w górę o 1/sinθ — zapamiętany
   * oryginał i kąt, przy którym liczono (zmiana `dev.widok3d.kat` przelicza).
   * Kamera Phasera jest ściśnięta w pionie, więc prostokąt klatki duszka
   * pokrywał na ekranie ~64% tego, co widać: stuknięcie w głowę wilka czy NPC-a
   * trafiało w pustkę (`OI-164`, „tap w cel przybliżony").
   */
  private readonly trafienia = new Map<Phaser.GameObjects.GameObject, { y: number; h: number; kat: number }>();
  /** Drzewa-stemple jako modele 3D (pilot `tools/tree3d.py`). */
  private drzewa: Trees3D | null = null;

  /**
   * ⭐⭐ **Widok 3D jest DOMYŚLNY od 2026-10-06** (decyzja autora: las w 3D
   * „o niebo lepiej", dalej wieś). 2D zostaje ŚCIEŻKĄ AWARYJNĄ: adres
   * z `?widok2d` albo build `VITE_WIDOK3D=0`. Do tej daty było odwrotnie
   * (`?widok3d` / `VITE_WIDOK3D=1`) — stary parametr nic już nie zmienia.
   */
  static get wlaczony(): boolean {
    const env = (import.meta as unknown as { env?: Record<string, string> }).env;
    if (env?.VITE_WIDOK3D === "0") return false;
    return !(typeof location !== "undefined" && new URLSearchParams(location.search).has("widok2d"));
  }


  constructor(private readonly scene: Phaser.Scene) {
    const r = WorldView3D.plotno();
    // ⚠⚠ Płótno Phasera MUSI leżeć NAD płótnem świata (z-index), inaczej HUD,
    //   drążek i przyciski znikają pod światem 3D. Na pulpicie tego nie
    //   widać było, bo zrzuty składano ręcznie w dobrej kolejności — wyszło
    //   dopiero na S21 FE (2026-10-04): płótno `position: absolute` przykrywa
    //   statyczne niezależnie od kolejności w DOM.
    const pc = scene.game.canvas;
    pc.style.position = "relative";
    pc.style.zIndex = "1";
    this.scena.background = new THREE.Color(0x1b2a18);
    this.scena.add(new THREE.HemisphereLight(0xffffff, 0x4c5636, 1.0));
    const slonce = new THREE.DirectionalLight(0xffffff, 3.2);
    slonce.position.set(-1.0, 0.9, 0.25).multiplyScalar(1000);
    this.scena.add(slonce, slonce.target);
    const kontra = new THREE.DirectionalLight(0xfff2dc, 1.0);
    kontra.position.set(0.8, 0.4, -0.8).multiplyScalar(1000);
    this.scena.add(kontra, kontra.target);
    swiat3d.scena = this.scena;
    r.domElement.style.visibility = "visible";   // schowane przez `destroy` poprzedniej sceny

    this.upieczGrunt();
    this.drzewa = new Trees3D(this.scena, scene, (obiekty) => {
      for (const o of obiekty) {
        const w = this.wpisy.get(o);
        if (w) { this.ukryj(w); this.wpisy.delete(o); }
      }
      // zioła, które zdążyły dostać billboard przed wczytaniem modeli
      for (const [o, w] of this.wpisy) {
        if (jestZiolem(o) && this.drzewa?.dodajZiolo(o)) { this.ukryj(w); this.wpisy.delete(o); }
      }
    }, this.kafloweDrzewa);
    this.przeskanuj();
    const cam = scene.cameras.main;
    this.bazowyZoom = cam.zoomX;
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.poZmianie, this);
    scene.events.on("postupdate", this.przedKlatka, this);
    scene.game.events.on(Phaser.Core.Events.POST_RENDER, this.rysuj, this);
    scene.events.on(Phaser.Scenes.Events.PRE_RENDER, this.podniesNakladki, this);
    scene.events.on(Phaser.Scenes.Events.RENDER, this.opuscNakladki, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    (window as unknown as { __widok3dObiekt?: WorldView3D }).__widok3dObiekt = this;
  }

  /** Płótno three.js POD płótnem Phasera (Phaser przezroczysty od startu). */
  private static plotno(): THREE.WebGLRenderer {
    if (WorldView3D.renderer) return WorldView3D.renderer;
    const r = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    r.setPixelRatio(1);
    r.outputColorSpace = THREE.SRGBColorSpace;
    const host = document.getElementById("game")!;
    host.style.position = "relative";
    r.domElement.style.position = "absolute";
    r.domElement.style.left = "0";
    r.domElement.style.top = "0";
    r.domElement.style.zIndex = "0";
    r.domElement.style.pointerEvents = "none";
    host.insertBefore(r.domElement, host.firstChild);
    WorldView3D.renderer = r;
    return r;
  }

  private poZmianie(): void {
    // `GameScene.applyZoom` zarejestrowało się wcześniej — tu czytamy JEGO wynik.
    this.bazowyZoom = this.scene.cameras.main.zoomX;
    this.macierze = true;
  }

  /** Ustaw ściśnięcie kamery Phasera przed jej przeliczeniem w tej klatce. */
  private przedKlatka(): void {
    const cam = this.scene.cameras.main;
    const z = this.bazowyZoom * WorldView3D.mnoznik;
    const sin = Math.sin(THREE.MathUtils.degToRad(WorldView3D.kat));
    if (cam.zoomX !== z || Math.abs(cam.zoomY - z * sin) > 1e-6) cam.setZoom(z, z * sin);
    if (++this.klatka % 20 === 0) this.przeskanuj();
  }

  // ── grunt ────────────────────────────────────────────────────────────────
  /**
   * Grunt + obiekty PIONOWE z warstw kafli.
   *
   * ⚠⚠ **Widoczność warstwy (`visible`) jest tu IGNOROWANA.** `TiledMap` co
   * klatkę gasi warstwy, których treść leży poza kamerą (bramka zajętości),
   * a pieczenie dzieje się, zanim kamera stanie na graczu — pierwsza wersja
   * pomijała „niewidoczne" i w Zagajach wypiekła SAMĄ TRAWĘ: bez dróg, wody,
   * pól i domów (zrzut 2026-10-04).
   *
   * Warstwy z `PIONOWE` (budynki, drzewa z kafli — Zagaje, Gęstwina) nie idą
   * w grunt: każdy budynek i każde drzewo staje jako jeden billboard,
   * zakotwiczony u podstawy ściany / pnia, tak jak drzewa-stemple w lesie.
   */
  private upieczGrunt(): void {
    const lista = this.scene.children.list;
    const wszystkie = lista.filter((o): o is Phaser.Tilemaps.TilemapLayer => o instanceof Phaser.Tilemaps.TilemapLayer)
      .sort((a, b) => a.depth - b.depth);
    if (!wszystkie.length) return;
    const mapa = wszystkie[0].tilemap;
    const TW = mapa.tileWidth, TH = mapa.tileHeight;
    const W = mapa.widthInPixels, H = mapa.heightInPixels;
    const rodzinaWarstwy = (nazwa: string) => PIONOWE.find((r) => (r.warstwy as readonly string[]).includes(nazwa));
    const plaskie = wszystkie.filter((l) => !rodzinaWarstwy(l.layer.name) && !/-over$/i.test(l.layer.name));

    // ── obiekty pionowe ──
    const rozlane: { l: Phaser.Tilemaps.TilemapLayer; tx: number; ty: number }[] = [];
    const rozlaneDrzew: typeof rozlane = [];
    const obiekty: Obiekt[] = [];
    const wariantKafla = new Map<Obiekt, string>();
    // ⭐ Rekwizyty z kafli `Buildings` (ławki, beczki, koryta, płot): wycięte z
    //   billboardów budynków do WŁASNYCH obiektów — billboard rekwizytu gaśnie,
    //   gdy jego modele stanęły (`REKWIZYTY_3D.kafleBuildings`).
    //   Tak samo sprzęt kuźni z kafli `Kuznia` (`REKWIZYTY_3D.kafleKuznia`).
    const kafleRekwizytow: Record<string, Record<number, [string, number, number]>> =
      { Buildings: REKWIZYTY_3D.kafleBuildings, Kuznia: REKWIZYTY_3D.kafleKuznia };
    const rekwizytKafla = (t: Phaser.Tilemaps.Tile) => {
      const tab = t.tileset ? kafleRekwizytow[t.tileset.name] : undefined;
      return tab ? tab[t.index - t.tileset!.firstgid] : undefined;
    };
    const rekwizytyObiektu = new Map<Obiekt, { wariant: string; x: number; y: number }[]>();
    for (const r of PIONOWE) {
      const ws = wszystkie.filter((l) => (r.warstwy as readonly string[]).includes(l.layer.name));
      if (!ws.length) continue;
      if (!r.perPien) {
        for (const o of wyodrebnij(ws, r, mapa.width, mapa.height, (t) => !!rekwizytKafla(t))) {
          obiekty.push(o);
          const lista: { wariant: string; x: number; y: number }[] = [];
          for (const k of o.kafle) {
            const [wariant, dx, dyPx] = rekwizytKafla(k.t)!;
            if (wariant) lista.push({ wariant, x: (k.x + dx) * TW, y: (k.y + 1) * TH - dyPx });
          }
          rekwizytyObiektu.set(o, lista);
        }
      }
      for (const o of wyodrebnij(ws, r, mapa.width, mapa.height, r.perPien ? undefined : (t) => !rekwizytKafla(t))) {
        obiekty.push(o);
        if (r.perPien) {
          // dolny rząd pnia → gatunek i rozmiar (`DRZEWA_3D.kafleNature`)
          const w = pienNature(o).map((k) => DRZEWA_3D.kafleNature[k.t.index - k.t.tileset!.firstgid]).find(Boolean);
          if (w) wariantKafla.set(o, w);
        }
        // ⚠⚠ Drzewo z modelem: kafle korony PONIŻEJ jego pnia (gęste kępy — korona
        //   przypisana do pnia nad nią) nie mogą iść płasko w grunt jak próg
        //   domu — zostawały pod modelami jako pikselowe kawałki drzew (zrzut
        //   autora 2026-10-06, „drzewa są i 2D, i 3D"). Idą do płaszczyzny kępek,
        //   gaszonej, gdy modele stanęły.
        const doKepek = r.perPien && wariantKafla.has(o);
        for (const c of o.rozlane) for (const l of ws) if (warstwaMa(l, c.x, c.y)) (doKepek ? rozlaneDrzew : rozlane).push({ l, tx: c.x, ty: c.y });
      }
    }
    this.postawObiekty(obiekty, TW, TH, wariantKafla, rekwizytyObiektu);

    // Płaskie rekwizyty tła (lilie, brzeg stawu…) — leżą na gruncie.
    const tlo = lista.filter((o): o is Phaser.GameObjects.Image =>
      o instanceof Phaser.GameObjects.Image && !(o instanceof Phaser.GameObjects.Sprite)
      && o.depth < DEPTH.entities && !String(o.frame?.name).startsWith("tree_")
      && o.texture?.key !== "portal-marker");
    const kafel = (g: CanvasRenderingContext2D, t: Phaser.Tilemaps.Tile, dx: number, dy: number) => {
      const ts = t.tileset;
      if (!ts) return;
      const xy = ts.getTileTextureCoordinates(t.index) as { x: number; y: number } | null;
      const src = ts.image?.getSourceImage() as CanvasImageSource | undefined;
      if (xy && src) g.drawImage(src, xy.x, xy.y, ts.tileWidth, ts.tileHeight, dx, dy, TW, TH);
    };
    // ⭐ WODA ŻYJE (2026-10-05, `OI-164`): grunt pieczony w TRZECH płaszczyznach —
    //   spód (warstwy pod wodą), woda (własny shader: falowanie pikseli +
    //   refleksy) i wierzch (piasek, ścieżki, podszyt nad wodą, progi, płaskie
    //   rekwizyty). Jedna tekstura gruntu nie pozwalała ruszyć samej wody,
    //   bo piasek brzegu leży NAD nią w kolejności warstw.
    // ⭐ Kępki trawy i krzaczki z kafli `Nature` (`REKWIZYTY_3D.kafleNiskie`)
    //   pieką się do OSOBNEJ płaszczyzny, a w ich miejscu stają modele; płaszczyzna
    //   gaśnie dopiero, gdy modele stanęły (plik się nie wczytał → zostają płaskie).
    // ⭐ Tak samo uprawy z kafli `Pole` (warstwa `uprawy`, `REKWIZYTY_3D.kafleUprawy`)
    //   — model stoi w ŚRODKU kafla, nie u jego dolnej krawędzi.
    const NISKIE = /^(undergrowth|bushes|uprawy)$/i;
    const kafleNiskie: Record<string, Record<number, [string, number]>> =
      { Nature: REKWIZYTY_3D.kafleNiskie, Pole: REKWIZYTY_3D.kafleUprawy };
    const niskiWpis = (t: Phaser.Tilemaps.Tile) => {
      const tab = t.tileset ? kafleNiskie[t.tileset.name] : undefined;
      return tab ? tab[t.index - t.tileset!.firstgid] : undefined;
    };
    const niski = (t: Phaser.Tilemaps.Tile) => niskiWpis(t) !== undefined;
    // ⚠ Uprawy ZOSTAJĄ w płaskim gruncie pod modelami: same źdźbła nad gołą
    //   ziemią czytały się jak rzadki zagon, nie łan — płaski obrazek daje masę
    //   koloru, model daje wysokość. Do zgaszonej płaszczyzny idą tylko kępki.
    const pod3D = (t: Phaser.Tilemaps.Tile) => niski(t) && t.tileset!.name !== "Pole";
    const kepkiPl: THREE.Mesh[] = [];
    const ukryjKepki = () => { this.kepkiZgaszone = true; for (const m of kepkiPl) m.visible = false; };
    for (const l of plaskie) {
      if (!NISKIE.test(l.layer.name)) continue;
      l.forEachTile((t) => {
        if (t.index < 0 || !niski(t)) return;
        const [wariant, skala] = niskiWpis(t)!;
        const dol = t.tileset!.name === "Pole" ? TH / 2 : 3;
        this.kafloweDrzewa.push({ wariant, skala, rekwizyt: true, x: (t.x + 0.5) * TW, y: (t.y + 1) * TH - dol, ukryj: ukryjKepki });
      });
    }
    const iWody = plaskie.findIndex((l) => /^water/i.test(l.layer.name));
    const ostWody = plaskie.reduce((m, l, i) => (/^water/i.test(l.layer.name) ? i : m), -1);
    const spod = iWody < 0 ? plaskie : plaskie.slice(0, iWody);
    const woda = iWody < 0 ? [] : plaskie.slice(iWody, ostWody + 1);
    const wierzch = iWody < 0 ? [] : plaskie.slice(ostWody + 1);
    const tekstura = (c: HTMLCanvasElement) => {
      const tex = new THREE.CanvasTexture(c);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      // ⭐ Płótno (4 MB na płat) zwalniane PO wysłaniu tekstury na kartę —
      //   przedtem każdy płat trzymał drugą kopię w pamięci zwykłej.
      tex.onUpdate = () => { c.width = 0; c.height = 0; };
      return tex;
    };
    const materialWody = (tex: THREE.Texture) => {
      const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5 });
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uCzas = this.czasWody;
        sh.vertexShader = sh.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vPozW;")
          .replace("#include <project_vertex>", "#include <project_vertex>\nvPozW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
        sh.fragmentShader = sh.fragmentShader
          .replace("#include <common>", "#include <common>\nuniform float uCzas;\nvarying vec3 vPozW;")
          .replace("#include <map_fragment>", [
            // falowanie: przesunięcie próbki o ~1 px tekstury, z pozycji w ŚWIECIE
            // (ciągłe przez granice kawałków 1024 px)
            `vec2 uvW = vMapUv + vec2(sin(vPozW.z * 0.09 + uCzas * 1.6), cos(vPozW.x * 0.08 + uCzas * 1.3)) * ${(WODA_3D.falowaniePx / CHUNK).toFixed(5)};`,
            "vec4 sampledDiffuseColor = texture2D(map, uvW);",
            "diffuseColor *= sampledDiffuseColor;",
            // refleksy: wydłużone, porwane pasma (gęsta fala w poprzek × wolna
            // wzdłuż). ⚠ Iloczyn dwóch podobnych fal dawał okrągłe „groszki".
            "float fala = sin(vPozW.z * 0.16 + vPozW.x * 0.03 + uCzas * 1.6) * (0.5 + 0.5 * sin(vPozW.x * 0.021 - vPozW.z * 0.013 + uCzas * 0.45));",
            `diffuseColor.rgb += smoothstep(${WODA_3D.progRefleksu.toFixed(2)}, 1.0, fala) * ${WODA_3D.jasnoscRefleksu.toFixed(2)};`,
          ].join("\n"));
      };
      return mat;
    };
    const plaszczyzna = (c: HTMLCanvasElement, cx: number, cy: number, y: number, mat: THREE.Material): THREE.Mesh => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(c.width, c.height), mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(cx + c.width / 2, y, cy + c.height / 2);
      this.scena.add(m);
      return m;
    };
    /** Jeden płat 1024 px: spód (zawsze), woda, wierzch, zapasowe kępki. */
    this.piecPlat = (cx: number, cy: number): THREE.Mesh[] => {
      const out: THREE.Mesh[] = [];
      const w = Math.min(CHUNK, W - cx), h = Math.min(CHUNK, H - cy);
      const tx0 = Math.floor(cx / TW), ty0 = Math.floor(cy / TH);
      const tx1 = Math.ceil((cx + w) / TW), ty1 = Math.ceil((cy + h) / TH);
      const nowe = () => {
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const g = c.getContext("2d")!;
        g.imageSmoothingEnabled = false;
        return { c, g };
      };
      /** Wypiecz warstwy; `false`, gdy w tym kawałku nie było żadnego kafla.
       *  `kepki`: `true` = tylko kafle z modelem 3D, `false` = wszystko POZA nimi. */
      const piecz = (g: CanvasRenderingContext2D, ws: Phaser.Tilemaps.TilemapLayer[], kepki = false): boolean => {
        let cos = false;
        for (const l of ws) {
          const wNiskiej = NISKIE.test(l.layer.name);
          if (kepki && !wNiskiej) continue;
          for (let ty = ty0; ty < ty1; ty++) {
            for (let tx = tx0; tx < tx1; tx++) {
              const t = l.getTileAt(tx, ty);
              if (!t || t.index < 0) continue;
              if (wNiskiej && pod3D(t) !== kepki) continue;
              kafel(g, t, tx * TW - cx, ty * TH - cy); cos = true;
            }
          }
        }
        return cos;
      };
      const reszta = (g: CanvasRenderingContext2D): boolean => {
        let cos = false;
        for (const r of rozlane) {
          if (r.tx < tx0 || r.tx >= tx1 || r.ty < ty0 || r.ty >= ty1) continue;
          const t = r.l.getTileAt(r.tx, r.ty);
          if (t && t.index >= 0) { kafel(g, t, r.tx * TW - cx, r.ty * TH - cy); cos = true; }
        }
        for (const o of tlo) {
          const f = o.frame;
          const src = f.source.image as CanvasImageSource;
          const dx = o.x - o.displayOriginX * o.scaleX - cx, dy = o.y - o.displayOriginY * o.scaleY - cy;
          if (dx > w || dy > h || dx + o.displayWidth < 0 || dy + o.displayHeight < 0) continue;
          g.globalAlpha = o.alpha;
          g.drawImage(src, f.cutX, f.cutY, f.cutWidth, f.cutHeight, dx, dy, o.displayWidth, o.displayHeight);
          g.globalAlpha = 1;
          cos = true;
        }
        return cos;
      };
      // spód — zawsze, kryjący
      const a = nowe();
      piecz(a.g, spod);
      if (!woda.length) reszta(a.g);
      out.push(plaszczyzna(a.c, cx, cy, 0, new THREE.MeshBasicMaterial({ map: tekstura(a.c) })));
      if (woda.length) {
        const wd = nowe();
        if (piecz(wd.g, woda)) out.push(plaszczyzna(wd.c, cx, cy, 0.02, materialWody(tekstura(wd.c))));
        const nad = nowe();
        const jest = piecz(nad.g, wierzch);
        if (reszta(nad.g) || jest) {
          out.push(plaszczyzna(nad.c, cx, cy, 0.04, new THREE.MeshBasicMaterial({ map: tekstura(nad.c), alphaTest: 0.5 })));
        }
      }
      // płaszczyzna kępek (zapas na wypadek, gdyby modele się nie wczytały)
      if (!this.kepkiZgaszone) {
        const k = nowe();
        let cos = false;
        for (const l of plaskie) {
          if (!NISKIE.test(l.layer.name)) continue;
          for (let ty = ty0; ty < ty1; ty++) {
            for (let tx = tx0; tx < tx1; tx++) {
              const t = l.getTileAt(tx, ty);
              if (t && t.index >= 0 && pod3D(t)) { kafel(k.g, t, tx * TW - cx, ty * TH - cy); cos = true; }
            }
          }
        }
        for (const r of rozlaneDrzew) {
          if (r.tx < tx0 || r.tx >= tx1 || r.ty < ty0 || r.ty >= ty1) continue;
          const t = r.l.getTileAt(r.tx, r.ty);
          if (t && t.index >= 0) { kafel(k.g, t, r.tx * TW - cx, r.ty * TH - cy); cos = true; }
        }
        if (cos) {
          const m = plaszczyzna(k.c, cx, cy, 0.06, new THREE.MeshBasicMaterial({ map: tekstura(k.c), alphaTest: 0.5 }));
          m.userData.kepki = true;
          out.push(m);
          kepkiPl.push(m);
        }
      }
      return out;
    };
    this.wymiaryGruntu = { W, H };
    // Phaser nie rysuje już żadnej warstwy kafli ani płaskiego tła.
    for (const l of wszystkie) (l as unknown as Record<string, unknown>).renderWebGL = NIC;
    for (const o of tlo) (o as unknown as Record<string, unknown>).renderWebGL = NIC;
  }

  /** Obiekty pionowe → atlasy (pakowanie półkami) → instancje w partiach. */
  private postawObiekty(obiekty: Obiekt[], TW: number, TH: number, wariantKafla: Map<Obiekt, string>,
    rekwizytyObiektu: Map<Obiekt, { wariant: string; x: number; y: number }[]>): void {
    const S = 2048;
    let atlas: HTMLCanvasElement | null = null;
    let g: CanvasRenderingContext2D | null = null;
    let x = 0, y = 0, wiersz = 0;
    const doPartii: { atlas: HTMLCanvasElement; o: Obiekt; ax: number; ay: number; w: number; h: number }[] = [];
    const nowy = () => {
      atlas = document.createElement("canvas");
      atlas.width = S; atlas.height = S;
      // `willReadFrequently`: test zasłony czyta z atlasu alfę pojedynczych pikseli
      g = atlas.getContext("2d", { willReadFrequently: true })!;
      g.imageSmoothingEnabled = false;
      x = 0; y = 0; wiersz = 0;
    };
    for (const o of obiekty) {
      const w = (o.x1 - o.x0 + 1) * TW, h = (o.kotwica - o.y0 + 1) * TH;
      if (w > S || h > S) continue;
      if (!atlas || x + w > S) { x = 0; y += wiersz; wiersz = 0; }
      if (!atlas || y + h > S) nowy();
      for (const k of o.kafle) {
        const ts = k.t.tileset!;
        const xy = ts.getTileTextureCoordinates(k.t.index) as { x: number; y: number } | null;
        const src = ts.image?.getSourceImage() as CanvasImageSource | undefined;
        if (xy && src) g!.drawImage(src, xy.x, xy.y, ts.tileWidth, ts.tileHeight, x + (k.x - o.x0) * TW, y + (k.y - o.y0) * TH, TW, TH);
      }
      doPartii.push({ atlas: atlas!, o, ax: x, ay: y, w, h });
      x += w; wiersz = Math.max(wiersz, h);
    }
    const partie = new Map<HTMLCanvasElement, Partia>();
    for (const d of doPartii) {
      let p = partie.get(d.atlas);
      if (!p) {
        p = new Partia(d.atlas, 4096);
        partie.set(d.atlas, p);
        this.scena.add(p.mesh);
      }
      const i = p.wolne++;
      p.mesh.count = p.wolne;
      p.uv.setXYZW(i, d.ax / S, 1 - (d.ay + d.h) / S, d.w / S, d.h / S);
      const st = { p, i, lewo: d.o.x0 * TW, dol: (d.o.kotwica + 1) * TH, w: d.w, h: d.h, ukryty: false, zanik: 0,
        alfa: (fx: number, fy: number) =>
          d.atlas.getContext("2d")!.getImageData(d.ax + Math.min(d.w - 1, fx * d.w) | 0, d.ay + Math.min(d.h - 1, fy * d.h) | 0, 1, 1).data[3] };
      this.stale.push(st);
      const ukryjSt = () => { st.ukryty = true; this.macierze = true; };
      for (const r of rekwizytyObiektu.get(d.o) ?? []) {
        this.kafloweDrzewa.push({ wariant: r.wariant, x: r.x, y: r.y, rekwizyt: true, ukryj: ukryjSt });
      }
      // ⭐ Pod budynkiem-obiektem (warstwa `budynki`) billboard kafli gaśnie,
      //   gdy model obiektu stanął (`domyNad` niżej).
      if (!wariantKafla.has(d.o) && !pienNature(d.o).length) {
        for (const b of buildingsFor(this.scene)) {
          const bx0 = b.x / TW, bx1 = (b.x + b.w) / TW - 1, by0 = b.y / TH, by1 = (b.y + b.h) / TH - 1;
          if (d.o.x0 <= bx1 && d.o.x1 >= bx0 && d.o.y0 <= by1 && d.o.kotwica >= by0) {
            (this.podDomem.get(b) ?? this.podDomem.set(b, []).get(b)!).push(ukryjSt);
          }
        }
      }
      const wariant = wariantKafla.get(d.o);
      if (wariant) {
        const xs = pienNature(d.o).map((k) => k.x);
        const x = (Math.min(...xs) + Math.max(...xs) + 1) / 2 * TW;
        this.kafloweDrzewa.push({ wariant, x, y: st.dol, ukryj: () => { st.ukryty = true; this.macierze = true; } });
      }
    }
    for (const p of partie.values()) p.uv.needsUpdate = true;
    // ⭐ Domy z warstwy `budynki` (`src/world/Buildings.ts`): model
    //   `dom-<prefiks>-<id>` w środku krawędzi frontu, z obrotem; zasłona
    //   liczona z prostokąta obiektu. Brak modelu → zostają kafle i ostrzeżenie.
    for (const b of buildingsFor(this.scene)) {
      const k = kotwicaFrontu(b);
      const pod = this.podDomem.get(b) ?? [];
      this.kafloweDrzewa.push({ wariant: b.model, x: k.x, y: k.y, obrot: b.obrot, rekwizyt: true,
        obrys: { x: b.x, y: b.y, w: b.w, h: b.h }, ukryj: () => { for (const u of pod) u(); },
        brak: () => console.warn(`[budynki] brak modelu „${b.model}” w houses3d.glb — przepuść tools/houses3d.py --zapisz`) });
    }
  }
  /** Billboardy kafli leżące pod budynkiem-obiektem — gasną, gdy stanie jego model. */
  private readonly podDomem = new Map<BuildingObject, (() => void)[]>();

  // ── billboardy i stworzenia ──────────────────────────────────────────────
  /** Co 20 klatek: nowe obiekty (łup, odrodzenia) dostają billboard albo cień. */
  private przeskanuj(): void {
    const kandydaci: Phaser.GameObjects.GameObject[] = [];
    const ys = ySortedWorldFor(this.scene);
    if (ys) kandydaci.push(...ys.list);
    // ⚠⚠ Rekwizyty, które NIE są w warstwie y-sortowanej, tylko w korzeniu
    //   sceny z głębokością `entities + y` (kamienie, flora wodna, zioła,
    //   ognisko, kłody — 450+ sztuk w lesie). Pierwsza wersja ich nie brała:
    //   Phaser rysował je płasko NA światem 3D, więc pałka wodna za graczem
    //   zasłaniała mu tułów (zrzut 2026-10-04).
    for (const o of this.scene.children.list) {
      if (!jestObrazem(o)) continue;
      if (String(o.frame?.name).includes("_canopy_")
          || (o.depth >= DEPTH.entities && o.depth < DEPTH.overhead)) kandydaci.push(o);
    }
    const zywe = new Set(kandydaci);
    for (const [obj, w] of this.wpisy) {
      if (!zywe.has(obj) || !obj.active) { this.ukryj(w); this.wpisy.delete(obj); }
    }
    for (const [obj, m] of this.cienie) {
      if (!zywe.has(obj) || !obj.active) { this.scena.remove(m); this.cienie.delete(obj); }
    }
    for (const o of this.scene.children.list) {
      if (o instanceof Phaser.GameObjects.Text && o.depth >= DEPTH.entities && o.depth < DEPTH.overhead) kandydaci.push(o);
    }
    const nakladki: Phaser.GameObjects.GameObject[] = [];
    const przejete = this.drzewa?.przejete;
    const plaskie = new Set(propInstancesFor(this.scene)
      .filter((r) => REKWIZYTY_3D.plaskie.includes(r.name)).map((r) => r.image as Phaser.GameObjects.GameObject));
    for (const o of kandydaci) this.rozciagnijTrafienie(o);
    for (const o of kandydaci) {
      if (this.wpisy.has(o) || this.cienie.has(o) || this.nakladki.has(o) || przejete?.has(o)) continue;
      if (jestNakladka(o)) { nakladki.push(o); continue; }
      if (jestZiolem(o) && this.drzewa?.dodajZiolo(o)) continue;
      // ⚠ Bez `constructor.name` — build produkcyjny (APK) minifikuje nazwy klas.
      const ma3d = typeof (o as unknown as { stan3d?: unknown }).stan3d === "function" || "zwrotKat" in o;
      const klucz = (o as Phaser.GameObjects.Image).texture?.key ?? "";
      if (klucz.startsWith("creature3d") || klucz.startsWith("char3d")) {
        (o as unknown as Record<string, unknown>).renderWebGL = NIC;
        continue;
      }
      if (ma3d) {
        const m = new THREE.Mesh(this.cienGeo, this.cienMat);
        m.rotation.x = -Math.PI / 2;
        m.renderOrder = 1;
        this.scena.add(m);
        this.cienie.set(o, m);
        continue;
      }
      // ⚠⚠ `Sprite` NIE dziedziczy po `Image` (w Phaserze oba to osobne
      //   klasy z mixinami). Test `instanceof Image` odrzucał wszystkich
      //   pikselowych NPC-ów — rysowani przez Phasera, stali NA graczu i na
      //   domach niezależnie od tego, kto jest bliżej (zrzut 2026-10-04).
      if (!jestObrazem(o)) continue;   // tekst, grafika — zostają w Phaserze
      // Obrócony (pocisk, efekt) — billboard nie niesie obrotu, zostaje 2D.
      if (o.rotation !== 0) continue;
      const zr = o.frame?.source?.image as (CanvasImageSource & { width: number; height: number }) | undefined;
      if (!zr) continue;
      let p = this.partie.get(zr);
      if (!p || p.wolne >= p.pojemnosc) {
        p = new Partia(zr, 4096);
        this.partie.set(zr, p);
        this.scena.add(p.mesh);
      }
      const nazwaKl = String(o.frame.name);
      const wDol = nazwaKl.includes("_canopy_") ? TREE_STAMP_TRUNK_SLICE : 0;
      const w: Wpis = { obj: o, partia: p, i: p.wolne++, sig: "", wDol, staly: nazwaKl.startsWith("tree_"),
        plaski: plaskie.has(o), lewo: 0, dol: 0, wPx: 0, hPx: 0, zanik: 0,
        ox: NaN, oy: NaN, of: null, ofl: false, ow: false, osx: 0, osy: 0, otn: 0xffffff };
      p.mesh.count = p.wolne;
      this.wpisy.set(o, w);
      (o as unknown as Record<string, unknown>).renderWebGL = NIC;
    }
    for (const o of this.nakladki.keys()) if (!zywe.has(o) || !o.active) this.nakladki.delete(o);
    // Właściciel = obiekt świata o tej samej głębokości y-sortu (nakładki
    // dostają `entities + y + 0…7` właściciela — konwencja wszystkich encji)
    // i najbliższy w poziomie.
    if (nakladki.length) {
      const wlasciciele = [...this.wpisy.keys(), ...this.cienie.keys()] as unknown as { x: number; depth: number }[];
      for (const n of nakladki) {
        const nn = n as unknown as { x: number; depth: number };
        let naj: unknown = null, dx = 48;
        for (const w of wlasciciele) {
          const dd = nn.depth - w.depth;
          if (dd < -0.5 || dd > 8) continue;   // pasek HP wroga: +5…+7
          const d = Math.abs(w.x - nn.x);
          if (d < dx) { dx = d; naj = w; }
        }
        if (naj) this.nakladki.set(n, naj as Phaser.GameObjects.GameObject);
      }
    }
  }

  /** Obszar trafienia od stóp w górę × 1/sinθ (patrz pole `trafienia`). */
  private rozciagnijTrafienie(o: Phaser.GameObjects.GameObject): void {
    const r = o.input?.hitArea as Phaser.Geom.Rectangle | undefined;
    if (!(r instanceof Phaser.Geom.Rectangle)) return;
    let z = this.trafienia.get(o);
    if (z && z.kat === WorldView3D.kat) return;
    if (!z) { z = { y: r.y, h: r.height, kat: NaN }; this.trafienia.set(o, z); }
    // Billboard (NPC, ognisko) stoi równolegle do ekranu → pełna wysokość, 1/sinθ.
    // Model 3D stoi pionowo → cosθ/sinθ; klatka arkusza ma do tego marginesy,
    // więc 1/sinθ dawało wilkowi obszar dwa razy wyższy niż on sam i tap NAD
    // zwierzęciem (wskazanie miejsca) łapał je jako cel.
    const th = THREE.MathUtils.degToRad(WorldView3D.kat);
    const ma3d = typeof (o as unknown as { stan3d?: unknown }).stan3d === "function" || "zwrotKat" in o;
    const k = ma3d ? Math.cos(th) / Math.sin(th) : 1 / Math.sin(th);
    r.height = z.h * k;
    r.y = z.y + z.h - r.height;    // dół (stopy) zostaje na miejscu
    z.kat = WorldView3D.kat;
    // ⚠⚠ Bez tego Phaser przy KAŻDEJ zmianie klatki animacji przywraca
    //   wysokość z klatki (`setSizeToFrame`), zostawiając przesunięte `y` —
    //   obszar odjeżdżał nad stopy i dolne 20 px wroga przestawało trafiać.
    (o.input as unknown as { customHitArea: boolean }).customHitArea = true;
  }

  /** Podnieś nakładki nad pełnowymiarowe postacie (patrz pole `nakladki`). */
  private podniesNakladki(): void {
    const kat = THREE.MathUtils.degToRad(WorldView3D.kat);
    // Billboard stoi równolegle do ekranu (pełna wysokość); odstęp w ściśniętej
    // kamerze to odstęp × sinθ. ⚠ Bryły 3D NIE są podnoszone: ich paski liczą
    // się od `restHeight` arkusza 2D, który i tak zawyża wysokość modelu —
    // z podniesieniem (cotθ) pasek dzika wisiał ~50 px nad grzbietem (zrzut
    // 2026-10-04), bez niego leży tuż nad nim.
    const kBill = 1 / Math.sin(kat), k3d = 1;
    for (const [o, w] of this.nakladki) {
      const n = o as unknown as { y: number; visible: boolean };
      if (!n.visible) continue;
      let stopy: number, k: number;
      const b = (w as unknown as { body?: Phaser.Physics.Arcade.Body | null }).body;
      if (this.cienie.has(w) && b) { stopy = b.bottom; k = k3d; }
      else {
        const s = w as Phaser.GameObjects.Image;
        stopy = s.y - s.displayOriginY * s.scaleY + s.displayHeight;
        k = kBill;
      }
      this.podniesione.push({ o: n as unknown as { y: number; scaleY: number }, y: n.y, sy: (n as unknown as { scaleY: number }).scaleY });
      n.y = stopy - (stopy - n.y) * k;
    }
    // ⭐ NAPISY i PASKI świata rozciągnięte w pionie o 1/sinθ na czas rysowania:
    //   kamera ściska je jak grunt, więc liczba obrażeń i imię NPC-a były
    //   spłaszczone o 36% (`OI-164`, „napisy Phasera ściśnięte w pionie").
    //   Przywracane w `opuscNakladki` — logika i tweeny widzą zawsze swoje.
    const lista = [...this.scene.children.list, ...(ySortedWorldFor(this.scene)?.list ?? [])];
    for (const o of lista) {
      const t = o as unknown as { y: number; scaleY: number; depth: number; visible: boolean };
      if (!t.visible || t.depth < DEPTH.entities) continue;
      const tekst = o instanceof Phaser.GameObjects.Text
        || (o instanceof Phaser.GameObjects.Container && o.list.some((c) => c instanceof Phaser.GameObjects.Text));
      if (!tekst && !(o instanceof Phaser.GameObjects.Rectangle && this.nakladki.has(o))) continue;
      const juz = this.podniesione.find((p) => p.o === t);
      if (juz) { t.scaleY = juz.sy * kBill; continue; }
      this.podniesione.push({ o: t, y: t.y, sy: t.scaleY });
      t.scaleY *= kBill;
    }
  }

  private opuscNakladki(): void {
    for (const { o, y, sy } of this.podniesione) { o.y = y; o.scaleY = sy; }
    this.podniesione.length = 0;
  }

  private ukryj(w: Wpis): void {
    const m = new THREE.Matrix4().makeScale(0, 0, 0);
    w.partia.mesh.setMatrixAt(w.i, m);
    w.partia.mesh.instanceMatrix.needsUpdate = true;
  }

  private readonly _m = new THREE.Matrix4();
  private readonly _q = new THREE.Quaternion();
  private readonly _p = new THREE.Vector3();
  private readonly _s = new THREE.Vector3();
  private readonly _plasko = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

  private readonly _kol = new THREE.Color();

  private aktualizujBillboardy(): void {
    if (this.ostatniKat !== WorldView3D.kat) { this.ostatniKat = WorldView3D.kat; this.macierze = true; }
    const kat = THREE.MathUtils.degToRad(WorldView3D.kat);
    this._q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -kat);
    const upY = Math.cos(kat), upZ = -Math.sin(kat);
    const brudne = new Set<Partia>();
    for (const w of this.wpisy.values()) {
      // ⚠ Drzewa (3 tys. wpisów) pomijane bez żadnego porównania — pomiar
      //   2026-10-04: sklejanie napisu-sygnatury dla każdego obiektu co klatkę
      //   kosztowało większość różnicy 2D → 3D na CPU.
      if (w.staly && !this.macierze && w.of !== null) continue;
      const o = w.obj;
      const f = o.frame;
      // ⚠ Drzewo jest widoczne ZAWSZE: `visible` przełącza mu culler Phasera
      //   (`RenderCuller`) według kamery 2D, a o kadrze 3D decyduje three.js.
      //   Liczone raz przy pierwszej klatce, kiedy culler miał większość drzew
      //   zgaszonych — i las znikał na stałe (zrzut 2026-10-04).
      const widoczny = w.staly || (o.visible && o.alpha > 0.02);
      // ⚠ Tint (mnożony kolor) niesie m.in. NPC na wspólnym `NPC.png` — bez
      //   koloru instancji wszyscy tacy stali w 3D jako ta sama postać
      //   (karczmarz i czeladnik, 2026-10-09).
      const tint = (o as unknown as { tintTopLeft?: number }).tintTopLeft ?? 0xffffff;
      if (!this.macierze && w.ox === o.x && w.oy === o.y && w.of === f && w.ofl === o.flipX && w.ow === widoczny
          && w.osx === o.scaleX && w.osy === o.scaleY && w.otn === tint) continue;
      if (w.otn !== tint) {
        const p0 = w.partia;
        if (!p0.mesh.instanceColor) (p0.mesh.material as THREE.Material).needsUpdate = true;   // nowy define
        p0.mesh.setColorAt(w.i, this._kol.setHex(tint));
        p0.mesh.instanceColor!.needsUpdate = true;
        w.otn = tint;
      }
      w.ox = o.x; w.oy = o.y; w.of = f; w.ofl = o.flipX; w.ow = widoczny; w.osx = o.scaleX; w.osy = o.scaleY;
      const p = w.partia;
      if (!widoczny) { this.ukryj(w); w.hPx = 0; continue; }
      const lewo = o.x - o.displayOriginX * o.scaleX;
      const dol = o.y - o.displayOriginY * o.scaleY + o.displayHeight + w.wDol;   // kotwica w gruncie
      w.lewo = lewo; w.dol = dol; w.wPx = o.displayWidth; w.hPx = w.plaski ? 0 : o.displayHeight;
      this._s.set(o.displayWidth, o.displayHeight, 1);
      if (w.plaski) {
        // płasko: dół obrazka na swojej linii gruntu, góra na północ — jak w 2D
        this._m.compose(this._p.set(lewo, 0.25, dol), this._plasko, this._s);
      } else {
        this._p.set(lewo, w.wDol * upY, dol + w.wDol * upZ);
        this._m.compose(this._p, this._q, this._s);
      }
      p.mesh.setMatrixAt(w.i, this._m);
      const zw = p.zrodlo.width, zh = p.zrodlo.height;
      let u0 = f.cutX / zw, du = f.cutWidth / zw;
      if (o.flipX) { u0 += du; du = -du; }
      p.uv.setXYZW(w.i, u0, 1 - (f.cutY + f.cutHeight) / zh, du, f.cutHeight / zh);
      brudne.add(p);
    }
    if (this.macierze) {
      for (const s of this.stale) {
        this._p.set(s.lewo, 0, s.dol);
        this._s.set(s.ukryty ? 0 : s.w, s.ukryty ? 0 : s.h, 1);
        this._m.compose(this._p, this._q, this._s);
        s.p.mesh.setMatrixAt(s.i, this._m);
        brudne.add(s.p);
      }
    }
    // ⚠⚠ Wysyłka PO bloku statycznych: stała przed nim, więc zgaszenie billboardu
    //   drzewa z kafli (model 3D stanął) zmieniało macierz tylko w pamięci —
    //   GPU rysował dalej stary obrazek obok modelu (zrzut autora 2026-10-06,
    //   „drzewa są i 2D, i 3D"). Gasły tylko te, których partię przypadkiem
    //   odświeżyło w tej samej klatce coś innego.
    for (const p of brudne) {
      p.mesh.instanceMatrix.needsUpdate = true;
      p.uv.needsUpdate = true;
    }
    for (const [o, m] of this.cienie) {
      const s = o as Phaser.Physics.Arcade.Sprite;
      const b = s.body as Phaser.Physics.Arcade.Body | null;
      if (!b) continue;
      const szer = Math.max(28, b.width * 1.15) / 2;
      m.position.set(b.center.x, 0.5, b.bottom);
      m.scale.set(szer, szer * 0.55, 1);
      m.visible = s.visible && !(s as unknown as { isDead?: boolean }).isDead;
    }
    this.macierze = false;
  }

  private rysuj(): void {
    if (!this.zywy) return;
    const r = WorldView3D.plotno();
    const pc = this.scene.game.canvas;
    if (r.domElement.width !== pc.width || r.domElement.height !== pc.height) {
      r.setSize(pc.width, pc.height, false);
      this.macierze = true;
    }
    const rect = pc.getBoundingClientRect();
    const st = r.domElement.style;
    if (st.width !== `${rect.width}px`) { st.width = `${rect.width}px`; st.height = `${rect.height}px`; }
    st.left = `${pc.offsetLeft}px`; st.top = `${pc.offsetTop}px`;

    const cam = this.scene.cameras.main;
    const kat = THREE.MathUtils.degToRad(WorldView3D.kat);
    const pw = pc.width / cam.zoomX / 2, ph = pc.height / cam.zoomX / 2;
    const k = this.kamera;
    if (k.right !== pw || k.top !== ph) {
      k.left = -pw; k.right = pw; k.top = ph; k.bottom = -ph;
      k.updateProjectionMatrix();
    }
    const mx = cam.midPoint.x, my = cam.midPoint.y;
    k.position.set(mx, Math.sin(kat) * 4000, my + Math.cos(kat) * 4000);
    k.lookAt(mx, 0, my);
    this.oknoGruntu(mx, my, pw, ph, kat);
    this.aktualizujBillboardy();
    this.drzewa?.aktualizuj(this.scene.time.now / 1000);
    this.czasWody.value = this.scene.time.now / 1000;
    this.zaslony();
    r.render(this.scena, k);
  }

  /**
   * Okno gruntu: płaty w kadrze — wypiekane OD RAZU (dziura w gruncie jest gorsza
   * niż jedna wolniejsza klatka), płaty z zapasu — najwyżej jeden na klatkę,
   * płaty daleko za kadrem — zwalniane. Kadr na gruncie: ±pw w poziomie,
   * ±ph/sinθ w głąb (kamera ortograficzna pochylona o θ).
   */
  private oknoGruntu(mx: number, my: number, pw: number, ph: number, kat: number): void {
    const piec = this.piecPlat;
    if (!piec) return;
    const { W, H } = this.wymiaryGruntu;
    const gl = ph / Math.sin(kat);
    const { zapasPx, zwolnijPx } = GRUNT_3D;
    const plat = (x0: number, x1: number, y0: number, y1: number) => {
      const out: [number, number][] = [];
      for (let cy = Math.max(0, Math.floor(y0 / CHUNK) * CHUNK); cy < Math.min(H, y1); cy += CHUNK) {
        for (let cx = Math.max(0, Math.floor(x0 / CHUNK) * CHUNK); cx < Math.min(W, x1); cx += CHUNK) out.push([cx, cy]);
      }
      return out;
    };
    // kadr (+ wysokość drzew za górną krawędzią, które sięgają w kadr)
    for (const [cx, cy] of plat(mx - pw, mx + pw, my - gl - 256, my + gl)) {
      const k = `${cx},${cy}`;
      if (!this.plaszczyznyGruntu.has(k)) this.plaszczyznyGruntu.set(k, { meshe: piec(cx, cy), cx, cy });
    }
    // zapas: jeden płat na klatkę, najbliższy środka kadru
    let naj: [number, number] | null = null, d = Infinity;
    for (const [cx, cy] of plat(mx - pw - zapasPx, mx + pw + zapasPx, my - gl - zapasPx, my + gl + zapasPx)) {
      if (this.plaszczyznyGruntu.has(`${cx},${cy}`)) continue;
      const dd = Math.hypot(cx + CHUNK / 2 - mx, cy + CHUNK / 2 - my);
      if (dd < d) { d = dd; naj = [cx, cy]; }
    }
    if (naj) this.plaszczyznyGruntu.set(`${naj[0]},${naj[1]}`, { meshe: piec(naj[0], naj[1]), cx: naj[0], cy: naj[1] });
    // zwalnianie
    for (const [k, p] of this.plaszczyznyGruntu) {
      if (p.cx + CHUNK < mx - pw - zwolnijPx || p.cx > mx + pw + zwolnijPx
          || p.cy + CHUNK < my - gl - zwolnijPx || p.cy > my + gl + zwolnijPx) {
        for (const m of p.meshe) WorldView3D.zwolnij(m);
        this.plaszczyznyGruntu.delete(k);
      }
    }
  }

  private static zwolnij(m: THREE.Mesh): void {
    m.removeFromParent();
    m.geometry.dispose();
    const mat = m.material as THREE.MeshBasicMaterial;
    mat.map?.dispose();
    mat.dispose();
  }

  /** Dev: ile płatów gruntu i tekstur jest w pamięci (`dev.widok3d.grunt()`). */
  stanGruntu(): { platy: number; tekstury: number; mpx: number } {
    let tekstury = 0, px = 0;
    for (const p of this.plaszczyznyGruntu.values()) {
      for (const m of p.meshe) {
        const g = (m.geometry as THREE.PlaneGeometry).parameters;
        tekstury++; px += g.width * g.height;
      }
    }
    return { platy: this.plaszczyznyGruntu.size, tekstury, mpx: +(px / 1e6).toFixed(1) };
  }

  /**
   * ⭐ Zasłony gracza (`ZASLONY_3D`): to, co naprawdę przykrywa tułów, blednie
   * CAŁE i płynnie — modele w `Trees3D`, billboardy (domy, NPC-e) tutaj.
   */
  private zaslony(): void {
    const gracz = [...this.cienie.keys()].find((o) => "zwrotKat" in o) as Phaser.Physics.Arcade.Sprite | undefined;
    const b = gracz?.body as Phaser.Physics.Arcade.Body | undefined;
    if (!b) return;
    const tanK = Math.tan(THREE.MathUtils.degToRad(WorldView3D.kat));
    const dt = Math.min(0.1, this.scene.game.loop.delta / 1000);
    const wzrost = WZROST_GRACZA_J * pikseliNaJednostke();
    this.drzewa?.zaslony(b.center.x, b.bottom, wzrost, tanK, dt);
    const krok = Math.min(1, (dt * 1000) / ZASLONY_3D.czasMs);
    const tulow = wzrost * ZASLONY_3D.tulow, minWys = wzrost * ZASLONY_3D.minWysokosc;
    const sinK = Math.sin(THREE.MathUtils.degToRad(WorldView3D.kat));
    const brudne = new Set<Partia>();
    // Billboard stoi równolegle do ekranu, więc jego wysokość h przykrywa pas
    // gruntu h/sinθ (bryła 3D o wysokości H: H/tanθ). `zaslania` liczy pas jako
    // wys/tanθ — stąd wys = h·tanθ/sinθ.
    // ⭐ Drugi stopień dla billboardów: prostokąt to za mało — dom zrośnięty ze
    //   sprzętem kuźni ma prostokąt sięgający daleko poza ściany i bladł, gdy
    //   gracz stał obok (zrzut 2026-10-06). Liczy się, czy w miejscu tułowia
    //   albo głowy gracza obrazek jest NAPRAWDĘ narysowany (alfa piksela).
    const punkty = [ZASLONY_3D.tulow, 0.85].map((k) => b.bottom - (wzrost * k) / tanK);
    const narysowany = (lewo: number, w: number, dol: number, h: number, alfa: (fx: number, fy: number) => number) => {
      const fx = (b.center.x - lewo) / w;
      if (fx < 0 || fx >= 1) return false;
      return punkty.some((u) => {
        const fv = ((dol - u) * sinK) / h;            // od dołu billboardu
        return fv > 0 && fv < 1 && alfa(fx, 1 - fv) > 128;
      });
    };
    const zanik = (p: Partia, i: number, stary: number, x: number, dol: number, pol: number, h: number,
      piksel?: () => boolean): number => {
      const cel = h >= minWys && zaslania(b.center.x, b.bottom, tulow, tanK, x, dol, pol, (h / sinK) * tanK)
        && (!piksel || piksel()) ? 1 : 0;
      if (stary === cel) return stary;
      const nowy = cel > stary ? Math.min(cel, stary + krok) : Math.max(cel, stary - krok);
      p.zanik.setX(i, nowy);
      brudne.add(p);
      return nowy;
    };
    for (const w of this.wpisy.values()) {
      if (w.obj === gracz || !w.hPx) continue;
      const o = w.obj;
      w.zanik = zanik(w.partia, w.i, w.zanik, w.lewo + w.wPx / 2, w.dol, w.wPx / 2, w.hPx, () =>
        narysowany(w.lewo, w.wPx, w.dol, w.hPx, (fx, fy) => {
          const f = o.frame;
          const px = (o.flipX ? 1 - fx : fx) * f.cutWidth, py = fy * f.cutHeight;
          return (this.scene.textures.getPixelAlpha(px | 0, py | 0, o.texture.key, f.name) ?? 255);
        }));
    }
    for (const s of this.stale) {
      if (s.ukryty) continue;
      s.zanik = zanik(s.p, s.i, s.zanik, s.lewo + s.w / 2, s.dol, s.w / 2, s.h, () => narysowany(s.lewo, s.w, s.dol, s.h, s.alfa));
    }
    for (const p of brudne) p.zanik.needsUpdate = true;
  }

  /**
   * Zrzut do oceny (dev): świat 3D + Phaser (HUD, pierścienie) na wierzchu.
   * ⚠ Bufor three.js trzeba skopiować W TYM SAMYM zadaniu co `render` —
   * bez `preserveDrawingBuffer` przeglądarka czyści go po oddaniu klatki.
   */
  zrzut(): Promise<string> {
    const r = WorldView3D.plotno();
    this.rysuj();
    const c = document.createElement("canvas");
    c.width = r.domElement.width; c.height = r.domElement.height;
    const g = c.getContext("2d")!;
    g.drawImage(r.domElement, 0, 0);
    return new Promise((ok) => {
      (this.scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer).snapshot((img) => {
        g.drawImage(img as HTMLImageElement, 0, 0);
        ok(c.toDataURL("image/png"));
      });
    });
  }

  destroy(): void {
    if (!this.zywy) return;
    this.zywy = false;
    swiat3d.scena = null;
    // ⚠ Płótno three.js jest WSPÓLNE i nie wolno go niszczyć (`Shared3D`), ale
    //   po zamknięciu sceny trzyma ostatnią klatkę świata — a płótno Phasera nad
    //   nim jest przezroczyste. Bez schowania ekran tytułowy po „Zapisz i wyjdź
    //   do menu" stał na tle zamrożonej wsi (zrzut 2026-10-11).
    WorldView3D.renderer?.domElement.style.setProperty("visibility", "hidden");
    this.drzewa?.destroy();
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.poZmianie, this);
    this.scene.events.off("postupdate", this.przedKlatka, this);
    this.scene.game.events.off(Phaser.Core.Events.POST_RENDER, this.rysuj, this);
    this.scene.events.off(Phaser.Scenes.Events.PRE_RENDER, this.podniesNakladki, this);
    this.scene.events.off(Phaser.Scenes.Events.RENDER, this.opuscNakladki, this);
    this.scena.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const x of mats) { (x as THREE.MeshBasicMaterial).map?.dispose(); x.dispose(); }
    });
  }
}
