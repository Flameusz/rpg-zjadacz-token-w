/**
 * Przymiar OBRYSU ZASŁONIĘTEGO GRACZA (`core/PlayerSilhouette.ts`).
 *
 * ── Co da się tu udowodnić, a czego nie ───────────────────────────────────
 * ⚠ **To NIE jest test tego, jak obrys wygląda** — alfy i tintu nie zmierzy
 * skrypt. To jest test **kryterium zapalenia**: czy „gracz pod koroną" i
 * „gracz obok korony" rozstrzygają się tak, jak mają.
 *
 * Da się to zrobić, bo geometria mieszka w CZYSTYM module
 * (`src/world/OcclusionGrid.ts`, zero Phasera) — ta sama reguła i ten sam
 * powód co przy `RenderCulling` / `MoveIntent` / `CombatGeometry`.
 *
 * ── Dlaczego bierze PRAWDZIWE stemple drzew ───────────────────────────────
 * Najważniejszy przypadek tego zadania jest **danymi, nie logiką**: stempel
 * sadzonki ma 32 px rysunku w komórce 96 px. Zarejestrowanie komórki zamiast
 * rysunku daje obrys graczowi stojącemu 32 px OBOK drzewa — kod wygląda wtedy
 * poprawnie i nic nie świeci na czerwono. Dlatego §D jedzie po całym żywym
 * `TREE_STAMPS`, a nie po wymyślonym prostokącie.
 *
 *   node tools/occlusion_weryfikacja.mjs      # nic nie zapisuje
 */
import { build } from "esbuild";
import { readFile, unlink } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const bledy = [];
let sprawdzen = 0;

function ok(opis, warunek) {
  sprawdzen++;
  console.log(`  ${warunek ? "OK  " : "BŁĄD"} ${opis}`);
  if (!warunek) bledy.push(opis);
}

async function zaladuj(wzgledna, nazwa) {
  const out = join(KORZEN, "node_modules", `.occl-${nazwa}.mjs`);
  await build({
    entryPoints: [join(KORZEN, wzgledna)],
    outfile: out,
    format: "esm",
    platform: "node",
    bundle: true,
    logLevel: "silent",
  });
  const mod = await import(pathToFileURL(out).href);
  await unlink(out).catch(() => {});
  return mod;
}

const { OcclusionGrid } = await zaladuj("src/world/OcclusionGrid.ts", "grid");
const CFG = await zaladuj("src/config/GameConfig.ts", "cfg");
const MANIFEST = await zaladuj("src/world/TreeStampManifest.ts", "stamps");

/** Sylwetka gracza w px świata — prostokąt, którym pyta `PlayerSilhouette`. */
const GRACZ_W = CFG.ASSETS.character.frameWidth * CFG.PLAYER.scale;
const GRACZ_H = CFG.ASSETS.character.frameHeight * CFG.PLAYER.scale;
const gracz = (x, y) => ({ x: x - GRACZ_W / 2, y: y - GRACZ_H / 2, w: GRACZ_W, h: GRACZ_H });

/* ══════════════════════════════════════════════════════════════════════════
   §A. CZTERY SCENARIUSZE Z ZAMÓWIENIA
   ══════════════════════════════════════════════════════════════════════════ */
console.log("§A. Zapalanie i gaszenie obrysu:");
{
  const g = new OcclusionGrid();
  // Korona 96×64 zaczepiona w (400, 300).
  const korona = { x: 400, y: 300, w: 96, h: 64 };
  g.add(korona);

  const podKorona = gracz(korona.x + korona.w / 2, korona.y + korona.h / 2);
  ok("A1. gracz POD koroną → obrys ON", g.covers(podKorona) === true);

  // Daleko w lewo: prawa krawędź sylwetki wypada przed lewą krawędzią korony.
  const obok = gracz(korona.x - GRACZ_W, korona.y + korona.h / 2);
  ok("A2. gracz OBOK korony → obrys OFF", g.covers(obok) === false);

  // Częściowe zakrycie — sylwetka wchodzi pod koronę jednym pikselem.
  const skrajLewy = korona.x - GRACZ_W / 2 + 1;
  ok(
    "A3. gracz CZĘŚCIOWO zasłonięty (1 px) → obrys ON",
    g.covers(gracz(skrajLewy, korona.y + korona.h / 2)) === true,
  );

  // Sekwencja wejścia i wyjścia — stan MUSI wynikać z bieżącej klatki.
  const tor = [];
  for (let x = korona.x - 120; x <= korona.x + korona.w + 120; x += 8) {
    tor.push(g.covers(gracz(x, korona.y + korona.h / 2)) ? "1" : "0");
  }
  const s = tor.join("");
  ok("A4. wyjście zza korony GASI obrys (sekwencja 0…1…0)", /^0+1+0+$/.test(s));
  ok("A4. …i zapala się dokładnie RAZ (bez migotania)", (s.match(/1+/g) ?? []).length === 1);

  // ⚠ Styk krawędzią to NIE zasłonięcie — inaczej obrys zapalałby się o piksel
  //   za wcześnie po każdej stronie każdego drzewa w lesie.
  ok(
    "A5. dotknięcie krawędzią (zero pola wspólnego) → OFF",
    g.covers({ x: korona.x - 10, y: korona.y, w: 10, h: 10 }) === false,
  );
  ok("A6. pusta siatka nie zasłania nigdy", new OcclusionGrid().covers(podKorona) === false);
}

/* ══════════════════════════════════════════════════════════════════════════
   §B. SIATKA NIE GUBI ZASŁON — porównanie z przemiataniem liniowym
   ══════════════════════════════════════════════════════════════════════════
   ⚠ To jest jedyna asercja, która broni samego KUBEŁKOWANIA. Zasłona spinająca
   granicę kubełka musi trafić do obu — a taki błąd objawia się jako „obrys
   czasem nie działa w konkretnym miejscu mapy" i nie da się go znaleźć okiem.
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§B. Kubełkowanie nie gubi zasłon (los vs przemiatanie liniowe):");
{
  let ziarno = 20260907;
  const los = () => ((ziarno = (ziarno * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const nachodzi = (a, b) => a.x + a.w > b.x && a.x < b.x + b.w && a.y + a.h > b.y && a.y < b.y + b.h;

  const g = new OcclusionGrid();
  const wszystkie = [];
  for (let i = 0; i < 800; i++) {
    // Rozmiary z prawdziwego zakresu koron (32…96 px), pozycje w skali mapy lasu.
    const r = { x: los() * 5120, y: los() * 1920, w: 32 + los() * 64, h: 32 + los() * 64 };
    wszystkie.push(r);
    g.add(r);
  }
  let rozjazdow = 0;
  let trafien = 0;
  for (let i = 0; i < 4000; i++) {
    const q = gracz(los() * 5120, los() * 1920);
    const liniowo = wszystkie.some((r) => nachodzi(r, q));
    if (liniowo) trafien++;
    if (g.covers(q) !== liniowo) rozjazdow++;
  }
  ok(`B1. ⭐ 4000 zapytań: siatka == przemiatanie liniowe (rozjazdów: ${rozjazdow})`, rozjazdow === 0);
  // ⚠ Test bez ANI JEDNEGO trafienia przechodziłby trywialnie — sprawdź, że
  //   próbka w ogóle dotyka zasłon (asercja, która nie umie zaświecić…).
  ok(`B1. …a próbka naprawdę trafia w zasłony (${trafien} z 4000)`, trafien > 200);
  ok("B2. zasłona bez powierzchni jest odrzucana", (() => {
    const z = new OcclusionGrid();
    z.add({ x: 0, y: 0, w: 0, h: 50 });
    z.add({ x: 0, y: 0, w: 50, h: 0 });
    return z.size === 0;
  })());
}

/* ══════════════════════════════════════════════════════════════════════════
   §C. PIĘTRO RYSOWANIA — nowe, WSTAWIONE, nie przestawione
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§C. Kolejność rysowania:");
{
  const D = CFG.DEPTH;
  ok("C1. obrys NAD zasłonami (`overhead`)", D.playerSilhouette > D.overhead);
  ok("C2. obrys POD podglądem celowania (`aimPreview`)", D.playerSilhouette < D.aimPreview);
  // ⛔ Istniejące piętra muszą zostać dokładnie tam, gdzie były — to jest
  //    bramka na „przy okazji przestawiłem porządek świata".
  const OCZEK = { ground: 0, overlay: 10, entities: 1000, overhead: 20000, aimPreview: 25000 };
  for (const [k, v] of Object.entries(OCZEK)) {
    ok(`C3. ⛔ DEPTH.${k} = ${v} (bez zmian)`, D[k] === v);
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   §D. PROSTOKĄT RYSUNKU, NIE KOMÓRKI — na całym żywym rosterze stempli
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§D. Zasłoną jest RYSUNEK drzewa, nie komórka arkusza:");
{
  const C = MANIFEST.TREE_STAMP_CELL;
  const SLICE = MANIFEST.TREE_STAMP_TRUNK_SLICE;
  // Ten sam wzór, którym `TreeLayer` rejestruje koronę (drzewo dosunięte do
  // DOŁU komórki i wyśrodkowane w poziomie).
  const koronaZ = (def, ax, anchorY) => ({
    x: ax + (C - def.w) / 2,
    y: anchorY - def.h,
    w: def.w,
    h: Math.max(0, def.h - SLICE),
  });

  const waskie = MANIFEST.TREE_STAMPS.filter((d) => d.w < C);
  ok(`D1. roster ma stemple WĘŻSZE od komórki (${waskie.length} z ${MANIFEST.TREE_STAMPS.length})`, waskie.length > 0);

  /**
   * Sylwetka postawiona w PUSTYM marginesie komórki — tuż obok rysunku, ale
   * poza nim.
   *
   * ⚠ **Nie na ŚRODKU marginesu, tylko dosunięta do rysunku.** Środek wymagał,
   * żeby cała sylwetka zmieściła się w marginesie (`GRACZ_W < margines`), a to
   * przestało być możliwe 2026-09-20: `PLAYER.scale` poszedł 1 → 1,15, więc
   * gracz ma 35,65 px, a najszerszy pusty margines w rosterze to 32 px. Pętle
   * §D2 i §D4 wykonywały od tego dnia ZERO obiegów — D2 przechodziło
   * trywialnie, a D4 (kontrola negatywna) świeciło na czerwono i to ono
   * pokazało, że D2 zgasło. Dosunięcie do krawędzi rysunku bada dokładnie tę
   * samą własność i nie zależy od tego, czy gracz mieści się w marginesie:
   * sylwetka wystaje wtedy poza komórkę w lewo, co jest bez znaczenia, bo
   * pytanie brzmi „czy zasłoną jest RYSUNEK, czy KOMÓRKA".
   */
  const probaObokRysunku = (def, ax, anchorY) => {
    const margines = (C - def.w) / 2;
    // Prawa krawędź sylwetki 1 px PRZED lewą krawędzią rysunku.
    const srodek = ax + margines - 1 - GRACZ_W / 2;
    return gracz(srodek, anchorY - def.h / 2);
  };
  // Próbka ma sens tylko wtedy, gdy sylwetka nadal nachodzi na KOMÓRKĘ
  // w poziomie — inaczej §D4 nie miałoby czego zgłosić i kontrola negatywna
  // padłaby z powodu geometrii próbki, a nie z powodu kodu.
  const badalne = waskie.filter((def) => (C - def.w) / 2 >= 2);

  let falszywe = 0;
  for (const def of badalne) {
    const g = new OcclusionGrid();
    g.add(koronaZ(def, 1000, 1000));
    if (g.covers(probaObokRysunku(def, 1000, 1000))) falszywe++;
  }
  ok(`D2. ⭐ gracz w PUSTYM marginesie komórki NIE dostaje obrysu (fałszywych: ${falszywe})`, falszywe === 0);
  // ⚠ Asercja, która nie potrafi zaświecić na czerwono, jest dekoracją —
  //   dokładnie ten wypadek zdarzył się tutaj. Bez tej linii D2 przechodzi
  //   na pustej pętli i nikt się o tym nie dowie.
  ok(`D2. …a próbka naprawdę coś sprawdza (${badalne.length} stempli)`, badalne.length > 0);
  // …oraz w PIONIE naprawdę nachodzi na koronę: gdyby nie nachodziła, D2
  // przechodziłoby dlatego, że sylwetka mija drzewo górą, a nie dlatego, że
  // rejestrowany jest rysunek.
  let bezPionu = 0;
  for (const def of badalne) {
    const k = koronaZ(def, 1000, 1000);
    const r = probaObokRysunku(def, 1000, 1000);
    if (!(r.y + r.h > k.y && r.y < k.y + k.h)) bezPionu++;
  }
  ok(`D2. …i robi to NA WYSOKOŚCI korony (mijających górą: ${bezPionu})`, bezPionu === 0);

  // I odwrotnie: pod samym rysunkiem obrys musi być, dla KAŻDEGO stempla.
  let brakow = 0;
  for (const def of MANIFEST.TREE_STAMPS) {
    const g = new OcclusionGrid();
    g.add(koronaZ(def, 1000, 1000));
    if (!g.covers(gracz(1000 + C / 2, 1000 - def.h / 2 - SLICE / 2))) brakow++;
  }
  ok(`D3. ⭐ pod rysunkiem obrys jest dla KAŻDEGO stempla (braków: ${brakow})`, brakow === 0);

  // ⛔ Gdyby ktoś wrócił do rejestrowania całej komórki, D2 przestaje trzymać.
  //    Ta sama próbka, inna zasłona — i MUSI zapalić obrys dla KAŻDEGO
  //    badanego stempla, nie tylko dla jednego.
  let komorkaFalszywych = 0;
  for (const def of badalne) {
    const g = new OcclusionGrid();
    g.add({ x: 1000, y: 1000 - C, w: C, h: C - SLICE }); // CAŁA komórka
    if (g.covers(probaObokRysunku(def, 1000, 1000))) komorkaFalszywych++;
  }
  ok(
    `D4. ⛔ rejestracja CAŁEJ komórki dałaby fałszywe obrysy (${komorkaFalszywych}/${badalne.length}) — dowód, że D2 coś pilnuje`,
    badalne.length > 0 && komorkaFalszywych === badalne.length,
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   §E. GRANICE — obrys jest prezentacją i niczym więcej
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§E. Granice modułu:");
{
  const sil = await readFile(join(KORZEN, "src/core/PlayerSilhouette.ts"), "utf8");
  const grid = await readFile(join(KORZEN, "src/world/OcclusionGrid.ts"), "utf8");
  const occ = await readFile(join(KORZEN, "src/core/Occluders.ts"), "utf8");
  const bezK = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  const silK = bezK(sil);
  const occK = bezK(occ);

  ok("E1. `OcclusionGrid` jest CZYSTY (zero Phasera)", !/from "phaser"/.test(bezK(grid)));
  ok(
    "E2. obrys nie dotyka walki, ruchu ani ekwipunku",
    !/Progression|Equipment|Stamina|combat\/|movement\/|Enemy/.test(silK),
  );
  ok("E3. obrys nie rusza depth NICZEGO poza sobą", (silK.match(/setDepth\(/g) ?? []).length === 1);
  ok("E4. ⛔ obrys nie wchodzi do warstwy Y-sortowanej", !/ySortedWorld/.test(silK));
  ok("E5. ⛔ obrys nie jest rejestrowany w cullerze (nie jest statyczny)", !/renderCuller/i.test(silK));
  ok(
    "E6. stan liczony z BIEŻĄCEJ klatki (brak timerów/tweenów w module)",
    !/setTimeout|delayedCall|tweens\.|time\.now/.test(silK),
  );
  ok("E7. rejestr zasłon nie dotyka kolizji ani nawigacji", !/NavGrid|solids|physics/.test(occK));
  /* ⚠⚠ **E9 domyka lukę, którą §D samo miałoby.** §D sprawdza WZÓR przepisany
     w tym skrypcie, a nie kod, który naprawdę rejestruje korony — czyli
     dokładnie lustro, przed którym ten projekt ostrzega. Bez E9 zamiana
     `def.w`/`def.h` na komórkę w `TreeLayer` przeszłaby na zielono. */
  const tl = bezK(await readFile(join(KORZEN, "src/world/TreeLayer.ts"), "utf8"));
  ok(
    "E9. ⭐ `TreeLayer` rejestruje ZMIERZONY rysunek (`def.w`/`def.h`), nie komórkę",
    /registerRect\(\{[\s\S]{0,220}?w: def\.w,[\s\S]{0,120}?def\.h - TREE_STAMP_TRUNK_SLICE/.test(tl) &&
      /x: ax \+ \(C - def\.w\) \/ 2/.test(tl),
  );
  ok(
    "E9. ⛔ …i nie rejestruje pełnej komórki `C`",
    !/registerRect\(\{[\s\S]{0,200}?w: C,/.test(tl),
  );
  ok(
    "E8. ⭐ jedna reguła nazwy `-over` rządzi i głębią, i zasłoną",
    /nadEncjami \? DEPTH\.overhead/.test(await readFile(join(KORZEN, "src/world/TiledMap.ts"), "utf8")) &&
      /if \(nadEncjami\) occludersFor\(scene\)\?\.registerTileLayer\(layer\)/.test(
        await readFile(join(KORZEN, "src/world/TiledMap.ts"), "utf8"),
      ),
  );
}

console.log(`\nSprawdzeń: ${sprawdzen}.`);
if (bledy.length) {
  console.error(`NIE PRZESZŁO: ${bledy.length}`);
  for (const b of bledy) console.error("  ✗ " + b);
  process.exit(1);
}
console.log("OK — kryterium zapalenia obrysu zachowuje się zgodnie z zamówieniem.");
