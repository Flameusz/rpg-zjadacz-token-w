import * as THREE from "three";

/**
 * ⭐⭐ **JEDEN renderer three.js na całą grę** (2026-10-03, `OI-161`).
 *
 * Do tej daty `Character3D` tworzył WŁASNY `WebGLRenderer` — czyli własny
 * kontekst WebGL — a przeglądarka daje ich kilkanaście na kartę (telefon
 * mniej). Druga postać 3D (dzik) oznaczała drugi kontekst, sfora wilków pięć,
 * a do tego stały klucz tekstury: druga instancja przejęłaby obraz pierwszej.
 *
 * Dziś wszystkie postacie 3D rysują się przez TEN SAM renderer, po kolei,
 * każda do swojego wycinka bufora, i każda od razu kopiuje wynik do własnego
 * canvasa 2D (most do Phasera). ⚠ Kolejność „render → natychmiast blit" jest
 * warunkiem poprawności: bufor WebGL nie jest zachowywany między klatkami
 * (`preserveDrawingBuffer: false`), a następna postać go nadpisze.
 *
 * ⚠ Renderer NIE ginie z sceną — żyje do końca strony. To jest odwrotność
 * dawnej reguły („renderer MUSI ginąć razem ze sceną"), i świadomie: tamta
 * reguła istniała, bo każdy restart sceny (portal) tworzył NOWY kontekst;
 * jeden współdzielony kontekst nie ma czego wyczerpać.
 */
let renderer: THREE.WebGLRenderer | null = null;

export function wspolnyRenderer(szer: number, wys: number): THREE.WebGLRenderer {
  if (!renderer) {
    const canvas = document.createElement("canvas");
    canvas.width = szer;
    canvas.height = wys;
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(1);
    renderer.setSize(szer, wys, false);
    renderer.setClearAlpha(0);
  }
  return renderer;
}

/**
 * Render sceny do LEWEGO-DOLNEGO wycinka bufora `w×h` i kopia do `ctx`.
 *
 * ⚠ GL liczy od lewego DOLNEGO rogu, canvas 2D od lewego GÓRNEGO — wycinek
 * leży więc w canvasie WebGL na wysokości `H − h`.
 */
export function renderujDo(
  ctx: CanvasRenderingContext2D, scena: THREE.Scene, kamera: THREE.Camera, w: number, h: number,
): void {
  const r = renderer!;
  const H = r.domElement.height;
  r.setViewport(0, 0, w, h);
  r.setScissor(0, 0, w, h);
  r.setScissorTest(true);
  r.render(scena, kamera);
  r.setScissorTest(false);
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(r.domElement, 0, H - h, w, h, 0, 0, w, h);
}

/**
 * Światło bryły — WSPÓLNE dla gracza i stworzeń, żeby wszystko w świecie
 * było oświetlone z tej samej strony co namalowane cienie sprite'ów.
 * Uzasadnienie i A/B: `Character3D` (komentarz „ŚWIATŁO BRYŁY").
 */
export function dodajSwiatlo(scena: THREE.Scene): void {
  scena.add(new THREE.HemisphereLight(0xffffff, 0x4c5636, 1.0));
  const slonce = new THREE.DirectionalLight(0xffffff, 3.2);
  slonce.position.set(-1.0, 0.9, 0.25);
  scena.add(slonce);
  const kontra = new THREE.DirectionalLight(0xfff2dc, 1.0);
  kontra.position.set(0.8, 0.4, -0.8);
  scena.add(kontra);
}

let licznik = 0;
/** Unikalny klucz tekstury Phasera dla jednej postaci 3D. */
export function nowyKlucz(przedrostek: string): string {
  licznik += 1;
  return `${przedrostek}-${licznik}`;
}

/**
 * ⭐ Skala obrazu (piksel ekranu na piksel bufora) — USTALA JĄ GRACZ.
 *
 * Gracz dociąga swój model do wysokości sprite'a (`Character3D`), a stworzenia
 * dostają TĘ SAMĄ skalę, więc w świecie obowiązuje jedna gęstość: dzik ma
 * tyle pikseli na metr co gracz. Bez tego każdy gatunek trzeba by stroić
 * osobno „na oko" — i rozjechałby się z graczem przy pierwszej zmianie
 * `PLAYER.scale`.
 */
export const skalaSwiata = { obrazu: 0 };

/** Koszt mostu (ms/klatkę) wszystkich żywych stworzeń 3D — do `dev.char3d.koszt`. */
export const kosztyStworzen: number[] = [];
export function zapiszKoszt(ms: number): void {
  kosztyStworzen.push(ms);
  if (kosztyStworzen.length > 3000) kosztyStworzen.splice(0, kosztyStworzen.length - 3000);
}

/**
 * ⭐ **PROTOTYP „ŚWIAT W 3D"** (2026-10-04, `WorldView3D`): gdy `scena` jest
 * ustawiona, postacie i stworzenia NIE rysują się do własnych buforów, tylko
 * przenoszą swój animowany model do tej jednej sceny świata. Logika, AI
 * i `stan3d()` zostają nietknięte — zmienia się wyłącznie, GDZIE model jest
 * rysowany. `null` = dzisiejsza droga (bufor → tekstura Phasera).
 */
export const swiat3d: { scena: THREE.Scene | null } = { scena: null };

/** Ile pikseli świata ma jednostka modelu (ta sama skala co w buforach). */
export function pikseliNaJednostke(zapasowa = 0.6): number {
  return (skalaSwiata.obrazu || zapasowa) / (15.5 / 128);
}

/**
 * Przenieś model do sceny świata (raz) i ustaw go u stóp hosta. Materiały
 * klonowane przy pierwszym wejściu: `SkeletonUtils.clone` je DZIELI, a tint
 * telegrafu ma barwić jedno stworzenie, nie cały gatunek.
 */
const _tint = new THREE.Color();
/**
 * ⭐ ŚWIATŁO KRAWĘDZIOWE (rim, test A 2026-10-09 — „ludzik Michelin"): ciepła
 * poświata tam, gdzie powierzchnia odwraca się od kamery — odcina sylwetkę od
 * trawy i drogi tak, jak robią to Diablo Immortal / Eternium. Dopisek do
 * shadera materiału (po oświetleniu, przed wyjściem), bez nowej lampy.
 * ⚠ Po `clone()` — `onBeforeCompile` nie przechodzi przez kopię materiału.
 */
export function dodajKrawedz(mat: THREE.Material, sila: number, nasycenie = 1): void {
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      "#include <opaque_fragment>",
      `{ float rimK = pow(1.0 - saturate(dot(normal, geometryViewDir)), 4.5);
         outgoingLight += vec3(1.0, 0.93, 0.80) * rimK * ${sila.toFixed(3)};
         float lum = dot(outgoingLight, vec3(0.299, 0.587, 0.114));
         outgoingLight = max(vec3(0.0), mix(vec3(lum), outgoingLight, ${nasycenie.toFixed(3)})); }
       #include <opaque_fragment>`,
    );
  };
  mat.customProgramCacheKey = () => `krawedz-${sila}-${nasycenie}`;
  mat.needsUpdate = true;
}

/**
 * ⭐ STYLIZACJA MIESZKAŃCÓW (2026-10-10, autor: „patyczaki bez wyrazu, każdy
 * taki sam" — największa regresja względem pixel-artu). Pixel-art wygrywał
 * KONTUREM, mocnym cieniowaniem i nasyconą barwą; gładki PBR z kamery z góry
 * zlewał postać z gruntem. Dwie rzeczy w silniku, bez ponownego eksportu:
 * - cieniowanie TONOWE (`MeshToonMaterial`, `tony` stopni),
 * - KONTUR: odwrócona powłoka liczona na żywo, idąca za szkieletem, odsunięta
 *   w przestrzeni WIDOKU o `kontur` px gry — stała grubość na ekranie
 *   niezależnie od skali modelu. Kierunek z WYGŁADZONYCH normalnych
 *   (`konturN`): model ma fasety, ostre normalne rozrywałyby obrys na krawędziach.
 */
export type Styl3D = { kontur: number; tony: number; nasycenie?: number; kolorKonturu?: number; glebiaKonturu?: number };

const _gradienty = new Map<number, THREE.DataTexture>();
function gradient(tony: number): THREE.DataTexture {
  let g = _gradienty.get(tony);
  if (!g) {
    const dane = new Uint8Array(tony * 4);
    for (let i = 0; i < tony; i++) {
      // najciemniejszy ton nie schodzi do czerni — cień ma kolor, nie dziurę
      const v = Math.round(255 * (0.42 + 0.58 * (i / Math.max(1, tony - 1))));
      dane.set([v, v, v, 255], i * 4);
    }
    g = new THREE.DataTexture(dane, tony, 1, THREE.RGBAFormat);
    g.minFilter = g.magFilter = THREE.NearestFilter;
    g.needsUpdate = true;
    _gradienty.set(tony, g);
  }
  return g;
}

function naToon(m: THREE.Material, tony: number): THREE.Material {
  const s = m as THREE.MeshStandardMaterial;
  if (!s.isMeshStandardMaterial) return m;
  const t = new THREE.MeshToonMaterial({
    color: s.color, map: s.map, vertexColors: s.vertexColors, side: s.side,
    transparent: s.transparent, opacity: s.opacity, alphaTest: s.alphaTest, gradientMap: gradient(tony),
  });
  t.name = s.name;
  return t;
}

/** Normalne uśrednione po POZYCJI (szwy faset sklejone) — kierunek konturu. */
function gladkieNormalne(g: THREE.BufferGeometry): THREE.BufferAttribute {
  const gotowe = g.getAttribute("konturN") as THREE.BufferAttribute | undefined;
  if (gotowe) return gotowe;
  const poz = g.getAttribute("position");
  const nor = g.getAttribute("normal");
  const suma = new Map<string, THREE.Vector3>();
  const klucz = (i: number) =>
    `${Math.round(poz.getX(i) * 1e4)},${Math.round(poz.getY(i) * 1e4)},${Math.round(poz.getZ(i) * 1e4)}`;
  for (let i = 0; i < poz.count; i++) {
    const k = klucz(i);
    const v = suma.get(k) ?? new THREE.Vector3();
    if (nor) v.x += nor.getX(i), v.y += nor.getY(i), v.z += nor.getZ(i);
    suma.set(k, v);
  }
  const out = new Float32Array(poz.count * 3);
  for (let i = 0; i < poz.count; i++) {
    const v = suma.get(klucz(i))!.clone().normalize();
    out.set([v.x, v.y, v.z], i * 3);
  }
  const a = new THREE.BufferAttribute(out, 3);
  g.setAttribute("konturN", a);
  return a;
}

const _konturMat = new Map<string, THREE.MeshBasicMaterial>();
function materialKonturu(px: number, kolor: number, glebia: number): THREE.MeshBasicMaterial {
  const k = `${px}-${kolor}-${glebia}`;
  let m = _konturMat.get(k);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color: kolor, side: THREE.BackSide });
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = "attribute vec3 konturN;\n" + sh.vertexShader.replace(
        "#include <project_vertex>",
        `#include <project_vertex>
         { vec3 kN = konturN;
           #ifdef USE_SKINNING
             kN = (skinMatrix * vec4(kN, 0.0)).xyz;
           #endif
           mvPosition.xyz += normalize(normalMatrix * kN) * ${px.toFixed(3)};
           // ⭐ W GŁĄB widoku (2026-10-10): postać to kilka warstw (ciało,
           //   koszula, spodnie), każda z własnym obrysem. Obrys ciała POD
           //   ciasną koszulą wychodził przez nią ciemnymi drzazgami (rękawy
           //   gracza, spodnie Ojca). Odsunięty od kamery chowa się za
           //   ubraniem; obrys sylwetki zostaje, bo za postacią jest tylko teren.
           mvPosition.z -= ${glebia.toFixed(3)};
           gl_Position = projectionMatrix * mvPosition; }`,
      );
    };
    m.customProgramCacheKey = () => `kontur-${k}`;
    m.userData.kontur = true;
    _konturMat.set(k, m);
  }
  return m;
}

function dodajKontur(korzen: THREE.Object3D, styl: Styl3D): void {
  const siatki: THREE.Mesh[] = [];
  korzen.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && !m.userData.kontur) siatki.push(m);
  });
  const mat = materialKonturu(styl.kontur, styl.kolorKonturu ?? 0x1c130d, styl.glebiaKonturu ?? 3);
  for (const m of siatki) {
    gladkieNormalne(m.geometry);
    const s = m as THREE.SkinnedMesh;
    if (s.isSkinnedMesh) {
      // DZIECKO z tożsamą transformacją: ten sam `matrixWorld` co siatka
      // (skinning „attached" liczy się względem niego) i — co ważne u gracza —
      // dziedziczy WIDOCZNOŚĆ: schowana część ekwipunku chowa swój obrys.
      const k = new THREE.SkinnedMesh(s.geometry, mat);
      k.bind(s.skeleton, s.bindMatrix);
      k.bindMode = s.bindMode;
      k.frustumCulled = s.frustumCulled;
      k.userData.kontur = true;
      s.add(k);
    } else {
      const k = new THREE.Mesh(m.geometry, mat);
      k.userData.kontur = true;
      m.add(k);
    }
  }
}

/** Raz, przy wejściu modelu do świata: toon + kontur (`Styl3D`). */
function stylizuj(korzen: THREE.Object3D, styl: Styl3D): void {
  korzen.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || m.userData.kontur) return;
    m.material = Array.isArray(m.material) ? m.material.map((x) => naToon(x, styl.tony)) : naToon(m.material, styl.tony);
  });
  if (styl.kontur > 0) dodajKontur(korzen, styl);
}

export function wSwiecie(korzen: THREE.Object3D, x: number, stopyY: number, tint: number | null, alfa: number): void {
  const scena = swiat3d.scena;
  if (!scena) return;
  if (korzen.parent !== scena) {
    scena.add(korzen);
    korzen.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.material = Array.isArray(m.material) ? m.material.map((x) => x.clone()) : m.material.clone();
    });
    const styl = korzen.userData.styl as Styl3D | undefined;
    if (styl) stylizuj(korzen, styl);
    korzen.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.userData.kontur) return;
      // ⚠ Kolor WŁASNY materiału (gracz ma barwy w materiałach, stworzenia
      // w kolorach wierzchołków) — tint MNOŻY się przez niego, nie zastępuje.
      for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
        const s = mat as THREE.MeshStandardMaterial;
        if (s.color) s.userData.kolor0 = s.color.clone();
        const krawedz = korzen.userData.krawedz as number | undefined;
        if (krawedz || styl?.nasycenie) dodajKrawedz(s, krawedz ?? 0, styl?.nasycenie ?? 1);
      }
    });
  }
  korzen.position.set(x, 0, stopyY);
  korzen.scale.setScalar(pikseliNaJednostke());
  const kolor = tint ?? 0xffffff;
  korzen.traverse((o) => {
    const m = o as THREE.Mesh;
    // kontur ma materiał WSPÓLNY dla wszystkich — przezroczystość jednej
    // postaci nie może gasić obrysów całej wsi
    if (!m.isMesh || m.userData.kontur) return;
    for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
      const s = mat as THREE.MeshStandardMaterial;
      const k0 = s.userData.kolor0 as THREE.Color | undefined;
      if (s.color && k0) s.color.copy(k0).multiply(_tint.setHex(kolor));
      const przezr = alfa < 0.999;
      if (s.transparent !== przezr) { s.transparent = przezr; s.needsUpdate = true; }
      s.opacity = alfa;
    }
  });
}

/** Wróć z modelem do własnej sceny bufora (prototyp wyłączony). */
export function zeSwiata(korzen: THREE.Object3D, wlasna: THREE.Scene): void {
  if (korzen.parent === wlasna) return;
  wlasna.add(korzen);
  korzen.position.set(0, 0, 0);
  korzen.scale.setScalar(1);
}
