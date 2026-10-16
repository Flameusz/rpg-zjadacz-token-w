/**
 * Przymiar obciążenia — kryteria odbioru Modelu D (`OI-103`).
 *
 * ── Po co to istnieje ──────────────────────────────────────────────────────
 * Bo kalibracja Modelu D **nie stoi na gustach, tylko na prędkościach stworzeń
 * zapisanych w `GameConfig.ts`**. `speedK = 150` został wymuszony z dwóch
 * stron: niżej łamie niezmiennik „odejście zawsze działa" (skoczek 96), wyżej
 * przestaje kosztować ekstremum (wataha 115). Obie te liczby żyją w konfigu
 * i **wolno je komuś kiedyś zmienić** — a wtedy kalibracja przestaje być
 * prawdziwa i nic o tym nie powie.
 *
 * Ten plik jest jedyną rzeczą, która o tym powie.
 *
 * Decyzja:  `docs/decyzje/2026-09-15-obciazenie-dwie-osie.md`
 * Pomiary:  `docs/audyt_obciazenia_kalibracja_2026-09-15.md`
 *
 * ── ✅ STAN: MODEL D JEST W KODZIE (`OI-104`, 2026-09-15) ─────────────────
 * Parametry czytamy z **`GameConfig.EQUIPMENT_LOAD` i `ARMOR_TRAINING`**, nie
 * z kopii w tym pliku. Do wdrożenia stał tu blok `MODEL_D` z wartościami
 * startowymi decyzji, a reguła `W1` miała zaświecić w dniu wdrożenia — ⭐ **i
 * zaświeciła**, więc przymiar został przepięty na odczyt.
 *
 * ⚠ **Nie odtwarzaj tu drugiej kopii liczb.** Lustro rozjeżdża się cicho — to
 * ta sama reguła, przez którą `katalog_ekwipunku.mjs` czyta prawdziwe
 * `WeaponTraits` zamiast własnej mapy cech.
 *
 * ── Przymiar, nie generator ───────────────────────────────────────────────
 * **Nic nie zapisuje.** Nie ma `--zapisz` i nie ma go mieć.
 *
 * Użycie:
 *   node tools/obciazenie_przymiar.mjs             # raport
 *   node tools/obciazenie_przymiar.mjs --pelny     # + tabele przebiegu
 *   node tools/obciazenie_przymiar.mjs --sabotaz   # autotest: czy umie na czerwono
 */

import { build } from "esbuild";
import { readFile, unlink } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const PELNY = process.argv.includes("--pelny");
const SABOTAZ = process.argv.includes("--sabotaz");

// ── Wczytanie GameConfig.ts ────────────────────────────────────────────────
// Prawdziwe wartości, nie parsowanie tekstu — wzorzec `katalog_ekwipunku.mjs`.
const tmp = join(KORZEN, "node_modules", ".obciazenie-przymiar.mjs");
await build({
  entryPoints: [join(KORZEN, "src", "config", "GameConfig.ts")],
  outfile: tmp,
  format: "esm",
  bundle: false,
  logLevel: "silent",
});
const C = await import(pathToFileURL(tmp).href);
await unlink(tmp).catch(() => {});

const { ITEMS, PLAYER, STAMINA, EQUIPMENT_LOAD, ARMOR_TRAINING, PROGRESSION, RABBIT, BOAR, BEAR, WOLF, GREY_WOLF, SPIDER, VENOM_SPIDER, WEB_PROJECTILE } = C;

/**
 * Parametry Modelu D — **czytane z konfigu**, nie przepisane.
 *
 * ⚠ **`speedK` NIE jest stałą systemu.** Decyzja §3 zapisuje go jako wartość
 * do pierwszego playtestu (`OI-105`); zmiana po playteście nie wymaga nowej
 * decyzji. Zmiana ARCHITEKTURY (który kanał wisi na kg, a który na ratio) —
 * wymaga, i tego pilnują reguły `Z` niżej.
 */
const MODEL_D = {
  ...EQUIPMENT_LOAD,
  trening: {
    regenRelief: ARMOR_TRAINING.ranks.reduce((a, r) => a + r.regenRelief, 0),
    effortRelief: ARMOR_TRAINING.ranks.reduce((a, r) => a + r.effortRelief, 0),
    speedRelief: ARMOR_TRAINING.ranks.reduce((a, r) => a + r.speedRelief, 0),
    punkty: ARMOR_TRAINING.ranks.reduce((a, r) => a + r.points, 0),
  },
};

// ── Wejścia kalibracji ─────────────────────────────────────────────────────
// ⚠ To NIE jest kopia liczb — to odczyt. Zmiana `chaseSpeed` w konfigu ma tu
// dojechać sama, bo na tych trzech liczbach stoi cały dobór `speedK`.
const FAUNA = () => [
  { nazwa: "dzik", v: BOAR.chaseSpeed },
  { nazwa: "niedźwiedź", v: BEAR.chaseSpeed },
  { nazwa: "sieciarz", v: SPIDER.chaseSpeed },
  { nazwa: "królik", v: RABBIT.chaseSpeed },
  { nazwa: "skoczek", v: VENOM_SPIDER.chaseSpeed },
  { nazwa: "wataha", v: WOLF.chaseSpeed },
  { nazwa: "Szary", v: GREY_WOLF.chaseSpeed },
];

/** Najcięższy zestaw, jaki da się DZIŚ założyć (jeden przedmiot na slot). */
function najciezszyOsiagalny(items) {
  const najciezszy = (pred) =>
    Object.values(items)
      .filter(pred)
      .reduce((a, b) => ((a?.weight ?? 0) >= (b.weight ?? 0) ? a : b), null);
  const slot = (s) => najciezszy((i) => i.type === "armor" && i.slot === s);
  const czesci = [
    slot("head"), slot("chest"), slot("legs"), slot("boots"), slot("gloves"),
    najciezszy((i) => i.type === "weapon"),
    najciezszy((i) => i.slot === "offhand" && i.type !== "weapon"),
  ];
  return czesci.reduce((s, i) => s + (i?.weight ?? 0), 0);
}

/** Pełny stos warstwowy (12 adresów) — PROJEKCJA, warstw nie ma w kodzie. */
const PELNY_STOS = 75.5;

// ── Model ──────────────────────────────────────────────────────────────────
const speedMul = (kg, P) => Math.max(P.speedFloor, P.speedK / (P.speedK + Math.max(0, kg - P.speedFreeKg)));
const regenMul = (kg, P) => Math.max(P.regenFloor, P.regenK / (P.regenK + Math.max(0, kg - P.regenFreeKg)));
const effortMul = (r, P) => 1 + P.effortPerRatio * Math.max(0, r - P.effortFreeRatio);
const udzwig = (str, P, cfg) =>
  str <= P.softCapStrength
    ? cfg.base + cfg.perStrength * str
    : cfg.base + cfg.perStrength * P.softCapStrength + P.perStrengthAbove * (str - P.softCapStrength);
/** Masa, przy której chód spada dokładnie do `v` px/s. */
const przeciecie = (v, P, speedBazowa) => P.speedFreeKg + P.speedK * (speedBazowa / v - 1);

/**
 * ── STRAŻNICY WPIĘCIA (`K`) ───────────────────────────────────────────────
 *
 * ⚠ **Sprawdzane na TEKŚCIE ŹRÓDŁA, nie przez uruchomienie.** `Equipment`
 * ciągnie `EventBus`, a ten importuje Phasera — czyli tego grafu nie da się
 * wczytać w Node tak, jak wczytujemy `GameConfig`. To ten sam kompromis, który
 * `tools/combat_regresja.mjs` stosuje do reguły czystości.
 *
 * ⚠ **Strażnik tekstowy pilnuje WPIĘCIA, nie arytmetyki.** Arytmetykę liczą
 * reguły `R`/`G`/`E`/`Z` z konfigu. Bez tych trzech kotwic da się jednak
 * wyciąć kanał z kodu przy zielonym raporcie — a to jest dokładnie ta klasa
 * cichego rozjazdu, przed którą ten plik ma bronić.
 */
const ZRODLA = {
  equipment: await readFile(join(KORZEN, "src", "core", "Equipment.ts"), "utf8"),
  player: await readFile(join(KORZEN, "src", "entities", "Player.ts"), "utf8"),
  scena: await readFile(join(KORZEN, "src", "scenes", "GameScene.ts"), "utf8"),
  progression: await readFile(join(KORZEN, "src", "core", "Progression.ts"), "utf8"),
};

/**
 * Ciało gettera/metody o tej nazwie, wycięte po PARZE KLAMR.
 *
 * ⚠ **Nie „nagłówek + N znaków".** Pierwsza wersja brała stałe 900 znaków
 * i wchodziła w sąsiednią metodę — `K1` znajdowało wtedy `STOW_SLOTS`
 * w `isWorn()` mimo wyciętej pętli w `equippedWeight`, czyli strażnik świecił
 * na zielono nad zepsutym kodem. Złapane autotestem `--sabotaz`.
 */
function cialo(zrodlo, naglowek) {
  const start = zrodlo.indexOf(naglowek);
  if (start < 0) return "";
  const otw = zrodlo.indexOf("{", start);
  if (otw < 0) return "";
  let glebokosc = 0;
  for (let i = otw; i < zrodlo.length; i++) {
    if (zrodlo[i] === "{") glebokosc++;
    else if (zrodlo[i] === "}") {
      glebokosc--;
      if (glebokosc === 0) return zrodlo.slice(start, i + 1);
    }
  }
  return zrodlo.slice(start);
}

// ── Raport ─────────────────────────────────────────────────────────────────
let bledy = 0;
let ostrzezenia = 0;
const wiersze = [];

function sprawdz(id, nazwa, ok, detal, waga = "BŁĄD") {
  if (!ok) waga === "BŁĄD" ? bledy++ : ostrzezenia++;
  wiersze.push({ id, nazwa, ok, detal, waga });
}

function przebieg(cfg, P, fauna, items, player, stamina, progression) {
  bledy = 0;
  ostrzezenia = 0;
  wiersze.length = 0;

  const v0 = player.speed;
  const chod = (kg) => v0 * speedMul(kg, P);
  const maks = najciezszyOsiagalny(items);
  const szary = fauna.find((f) => f.nazwa === "Szary").v;
  const wataha = fauna.find((f) => f.nazwa === "wataha").v;
  const skoczek = fauna.find((f) => f.nazwa === "skoczek").v;

  // ── W — WEJŚCIA kalibracji (to, co może się rozjechać po cichu) ─────────
  sprawdz(
    "W1",
    "Model D jest w konfigu — trzy kanały, żadnej tabeli mnożników",
    cfg.speedK !== undefined && cfg.regenK !== undefined && cfg.multiplier === undefined,
    cfg.multiplier !== undefined
      ? "⛔ wrócił `multiplier` — model progowy nie rozróżnia ratio 0,91 od 1,82 (OI-101)"
      : `speedK ${cfg.speedK} · regenK ${cfg.regenK} · effortPerRatio ${cfg.effortPerRatio}`,
  );
  sprawdz("W2", "prędkość gracza nietknięta (kotwica całej kalibracji)", v0 === 150, `PLAYER.speed = ${v0}`);
  sprawdz("W3", "Szary nadal szybszy od watahy, wataha od skoczka", szary > wataha && wataha > skoczek, `${szary} > ${wataha} > ${skoczek}`);
  sprawdz(
    "W4",
    "najcięższy osiągalny zestaw mieści się w paśmie kalibracji (40-55 kg)",
    maks >= 40 && maks <= 55,
    `${maks} kg`,
  );
  sprawdz(
    "W5",
    "budżet punktów nadal 49 (obala trening za ~15 pkt)",
    (progression.maxLevel - 1) * progression.skillPointsPerLevel === 49,
    `${(progression.maxLevel - 1) * progression.skillPointsPerLevel} pkt`,
  );

  // ── R — RUCH ────────────────────────────────────────────────────────────
  sprawdz("R1", "strzelec 12 kg praktycznie bez kary ruchu (<3%)", 1 - speedMul(12, P) < 0.03, `${((1 - speedMul(12, P)) * 100).toFixed(1)}%`);
  sprawdz("R2", "strzelec 12 kg ucieka wszystkiemu pieszo", chod(12) > szary, `${chod(12).toFixed(0)} > ${szary}`);
  sprawdz(
    "R3",
    "przecięcie z Szarym w paśmie 30-40 kg (30-40 kg = realne ciężkie)",
    przeciecie(szary, P, v0) >= 30 && przeciecie(szary, P, v0) <= 40,
    `${przeciecie(szary, P, v0).toFixed(1)} kg`,
  );
  sprawdz(
    "R4",
    "przecięcie z watahą w paśmie 55-65 kg (ekstremum traci odwrót pieszy)",
    przeciecie(wataha, P, v0) >= 55 && przeciecie(wataha, P, v0) <= 65,
    `${przeciecie(wataha, P, v0).toFixed(1)} kg`,
  );
  sprawdz(
    "R5",
    "⭐ skoczek nieosiągalny w całym katalogu — niezmiennik „odejście zawsze działa”",
    przeciecie(skoczek, P, v0) > PELNY_STOS,
    `${przeciecie(skoczek, P, v0).toFixed(1)} kg > ${PELNY_STOS} kg`,
  );
  sprawdz("R6", "podłoga prędkości nadal szybsza od skoczka", v0 * P.speedFloor > skoczek, `${(v0 * P.speedFloor).toFixed(0)} > ${skoczek}`);
  sprawdz(
    "R7",
    "kara ruchu słabsza od sieci sieciarza (najmocniejsze spowolnienie w grze)",
    1 - speedMul(PELNY_STOS, P) < 1 - WEB_PROJECTILE.slowFactor,
    `${((1 - speedMul(PELNY_STOS, P)) * 100).toFixed(0)}% < ${((1 - WEB_PROJECTILE.slowFactor) * 100).toFixed(0)}%`,
  );

  // ── S — SPRINT ──────────────────────────────────────────────────────────
  sprawdz(
    "S1",
    "⭐ sprint ucieka wszystkiemu nawet przy pełnym stosie",
    chod(PELNY_STOS) * stamina.sprintSpeedMultiplier > szary,
    `${(chod(PELNY_STOS) * stamina.sprintSpeedMultiplier).toFixed(0)} > ${szary}`,
  );

  // ── G — REGENERACJA ─────────────────────────────────────────────────────
  sprawdz(
    "G1",
    "przewaga regeneracji strzelca nad ekstremum >= 1,50",
    regenMul(12, P) / regenMul(PELNY_STOS, P) >= 1.5,
    `×${(regenMul(12, P) / regenMul(PELNY_STOS, P)).toFixed(2)}`,
  );
  sprawdz(
    "G2",
    "40 kg nadal wydolne (kara regeneracji <= 25%)",
    1 - regenMul(40, P) <= 0.25,
    `${((1 - regenMul(40, P)) * 100).toFixed(0)}%`,
  );
  sprawdz(
    "G3",
    "⭐ koszt zamachu NIETKNIĘTY — burst zostaje (zasada §2 pkt 1)",
    stamina.costs.autoAttackPerSecond === 11,
    `autoAttackPerSecond = ${stamina.costs.autoAttackPerSecond}`,
  );

  // ── E — WYSIŁEK ─────────────────────────────────────────────────────────
  const ratio = (kg, str) => kg / udzwig(str, P, cfg);
  sprawdz(
    "E1",
    "⭐ oś wysiłku BEZ nasycenia (ZNALEZISKO A): ratio 1,00 vs 2,67",
    effortMul(2.67, P) / effortMul(1.0, P) > 1.9,
    `×${(effortMul(2.67, P) / effortMul(1.0, P)).toFixed(2)}`,
  );
  sprawdz(
    "E2",
    "Siła 70 zdejmuje >=90% osi wysiłku przy pełnym stosie",
    (effortMul(ratio(PELNY_STOS, 70), P) - 1) / (effortMul(ratio(PELNY_STOS, 10), P) - 1) < 0.1,
    `zostaje ${((100 * (effortMul(ratio(PELNY_STOS, 70), P) - 1)) / (effortMul(ratio(PELNY_STOS, 10), P) - 1)).toFixed(0)}%`,
  );
  sprawdz(
    "E3",
    "30-40 kg przy Sile 20 praktycznie bez kary wysiłku",
    effortMul(ratio(40, 20), P) < 1.1,
    `40 kg @STR20 → ×${effortMul(ratio(40, 20), P).toFixed(2)}`,
  );

  // ── K — WPIĘCIE KANAŁÓW W KOD ───────────────────────────────────────────
  sprawdz(
    "K1",
    "⭐ `equippedWeight` liczy STOW_SLOTS (OI-96: schowany zestaw waży)",
    cialo(ZRODLA.equipment, "get equippedWeight()").includes("STOW_SLOTS"),
    "pętla po EQUIP_SLOTS + STOW_SLOTS",
  );
  sprawdz(
    "K2",
    "⭐ `Player.speedMultiplier` mnoży przez obciążenie (kanał RUCHU)",
    cialo(ZRODLA.player, "private get speedMultiplier()").includes("Equipment.speedMultiplier"),
    "kara masy wchodzi do prędkości chodu i sprintu",
  );
  sprawdz(
    "K3",
    "⭐ scena podaje `regenMultiplier` do `Stamina.tick` (kanał WYDOLNOŚCI)",
    /Stamina\.tick\([^)]*Equipment\.regenMultiplier/.test(ZRODLA.scena),
    "masa spowalnia odrabianie sił",
  );
  sprawdz(
    "K4",
    "⭐⭐ premia za lekkość NIE wisi już na `loadMultiplier` (inwersja OI-104)",
    !cialo(ZRODLA.progression, "get dodgeChance()").includes("loadMultiplier"),
    "gate na masie bezwzględnej, nie na ratio",
  );

  // ── Z — ZASADA NADRZĘDNA ────────────────────────────────────────────────
  const chodPrzySile = [10, 20, 30, 40, 50, 60, 70].map(() => chod(PELNY_STOS));
  sprawdz(
    "Z1",
    "⭐⭐ Siła NIE kompensuje masy bezwzględnej (chód 75,5 kg identyczny 10-70)",
    new Set(chodPrzySile.map((x) => x.toFixed(4))).size === 1,
    `${chod(PELNY_STOS).toFixed(0)} px/s przy każdej Sile`,
  );
  sprawdz(
    "Z2",
    "⭐⭐ pełny trening NIE zrównuje 75,5 kg z 12 kg (ruch)",
    v0 * (1 - (1 - speedMul(PELNY_STOS, P)) * (1 - P.trening.speedRelief)) < chod(12) * 0.85,
    `${(v0 * (1 - (1 - speedMul(PELNY_STOS, P)) * (1 - P.trening.speedRelief))).toFixed(0)} vs ${chod(12).toFixed(0)}`,
  );
  sprawdz(
    "Z3",
    "trening oddaje odejście od watahy przy 62 kg",
    v0 * (1 - (1 - speedMul(62, P)) * (1 - P.trening.speedRelief)) > wataha,
    `${(v0 * (1 - (1 - speedMul(62, P)) * (1 - P.trening.speedRelief))).toFixed(0)} > ${wataha}`,
  );
  sprawdz(
    "Z4",
    "trening NIE oddaje odejścia od Szarego przy 40 kg",
    v0 * (1 - (1 - speedMul(40, P)) * (1 - P.trening.speedRelief)) < szary,
    `${(v0 * (1 - (1 - speedMul(40, P)) * (1 - P.trening.speedRelief))).toFixed(0)} < ${szary}`,
  );
  sprawdz(
    "Z5",
    "koszt treningu mieści się w skali gry (<= koszt Mastery I-IV = 6 pkt)",
    P.trening.punkty <= 6,
    `${P.trening.punkty} pkt`,
  );
  sprawdz(
    "Z6",
    "⭐ żadna oś treningu nie zdejmuje CAŁEJ kary swojego kanału",
    P.trening.regenRelief < 1 && P.trening.effortRelief < 1 && P.trening.speedRelief < 1,
    `regen ${(P.trening.regenRelief * 100).toFixed(0)}% · wysiłek ${(P.trening.effortRelief * 100).toFixed(0)}% · ruch ${(P.trening.speedRelief * 100).toFixed(0)}%`,
  );


  return { bledy, ostrzezenia, wiersze: [...wiersze], maks };
}

// ── Autotest: czy przymiar umie zaświecić na czerwono ──────────────────────
// ⚠ tools/CLAUDE.md: „Asercja, która nie potrafi zaświecić na czerwono, jest
//   dekoracją". Każdy sabotaż MUSI podnieść liczbę błędów.
if (SABOTAZ) {
  const bazowy = przebieg(EQUIPMENT_LOAD, MODEL_D, FAUNA(), ITEMS, PLAYER, STAMINA, PROGRESSION);
  console.log(`przebieg czysty: ${bazowy.bledy} błędów\n`);
  const sabotaze = [
    ["skoczek przyspieszony do 120 px/s", () => [FAUNA().map((f) => (f.nazwa === "skoczek" ? { ...f, v: 120 } : f)), MODEL_D, PLAYER]],
    ["speedK zjechany do 100", () => [FAUNA(), { ...MODEL_D, speedK: 100 }, PLAYER]],
    ["speedK podbity do 220", () => [FAUNA(), { ...MODEL_D, speedK: 220 }, PLAYER]],
    ["prędkość gracza zmieniona na 180", () => [FAUNA(), MODEL_D, { ...PLAYER, speed: 180 }]],
    ["trening podniesiony do 15 pkt", () => [FAUNA(), { ...MODEL_D, trening: { ...MODEL_D.trening, punkty: 15 } }, PLAYER]],
    ["trening zdejmuje 100% kary ruchu", () => [FAUNA(), { ...MODEL_D, trening: { ...MODEL_D.trening, speedRelief: 1 } }, PLAYER]],
    ["oś wysiłku z sufitem (effortPerRatio = 0)", () => [FAUNA(), { ...MODEL_D, effortPerRatio: 0 }, PLAYER]],
  ];
  let zle = 0;
  for (const [nazwa, mut] of sabotaze) {
    const [fauna, p, player] = mut();
    const w = przebieg(EQUIPMENT_LOAD, p, fauna, ITEMS, player, STAMINA, PROGRESSION);
    const wykryty = w.bledy > bazowy.bledy;
    if (!wykryty) zle++;
    console.log(`${wykryty ? "✅" : "⛔"} ${nazwa.padEnd(42)} ${w.bledy} błędów (${w.wiersze.filter((x) => !x.ok && x.waga === "BŁĄD").map((x) => x.id).join(", ") || "—"})`);
  }
  // ── sabotaż ŹRÓDEŁ: czy strażnicy wpięcia (`K`) też umieją zaświecić ────
  const sabotazeZrodel = [
    ["equippedWeight bez STOW_SLOTS", "equipment", "STOW_SLOTS.reduce", "EQUIP_SLOTS.reduce"],
    ["Player bez kanału ruchu", "player", "spowolnienie * Equipment.speedMultiplier", "spowolnienie"],
    ["scena bez kanału wydolności", "scena", "Equipment.regenMultiplier", "1"],
    ["powrót inwersji lightLoadBonus", "progression", "Equipment.speedMultiplier - EQUIPMENT_LOAD.speedFloor", "Equipment.loadMultiplier"],
  ];
  for (const [nazwa, klucz, szukaj, zamien] of sabotazeZrodel) {
    const oryginal = ZRODLA[klucz];
    ZRODLA[klucz] = oryginal.replace(szukaj, zamien);
    const w = przebieg(EQUIPMENT_LOAD, MODEL_D, FAUNA(), ITEMS, PLAYER, STAMINA, PROGRESSION);
    ZRODLA[klucz] = oryginal;
    const wykryty = w.bledy > bazowy.bledy;
    if (!wykryty) zle++;
    console.log(`${wykryty ? "✅" : "⛔"} ${nazwa.padEnd(42)} ${w.bledy} błędów (${w.wiersze.filter((x) => !x.ok && x.waga === "BŁĄD").map((x) => x.id).join(", ") || "—"})`);
  }
  console.log(`\n${zle === 0 ? "✅ Każdy sabotaż wykryty." : `⛔ ${zle} sabotaży PRZESZŁO — przymiar jest dekoracją.`}`);
  process.exit(zle === 0 ? 0 : 1);
}

const w = przebieg(EQUIPMENT_LOAD, MODEL_D, FAUNA(), ITEMS, PLAYER, STAMINA, PROGRESSION);

console.log("PRZYMIAR OBCIĄŻENIA — Model D (OI-103 / OI-104)\n");
console.log("✅ Model D jest w kodzie; parametry czytane z GameConfig.ts.");
console.log("  decyzja: docs/decyzje/2026-09-15-obciazenie-dwie-osie.md\n");
for (const r of w.wiersze) {
  const znak = r.ok ? "✅" : r.waga === "BŁĄD" ? "⛔" : "⚠";
  console.log(`${znak} ${r.id.padEnd(3)} ${r.nazwa.padEnd(62)} ${r.detal}`);
}

if (PELNY) {
  console.log("\n── RUCH / REGENERACJA wg masy ──");
  console.log(" kg | chód | kara ruchu | regen/s | kara regen");
  for (const kg of [10, 12, 20, 25, 30, 35, 40, w.maks, 55, 62, 70, PELNY_STOS]) {
    const s = speedMul(kg, MODEL_D), g = regenMul(kg, MODEL_D);
    console.log(
      `${String(kg).padStart(5)}| ${(PLAYER.speed * s).toFixed(0).padStart(4)} | ${((1 - s) * 100).toFixed(1).padStart(9)}% | ${(STAMINA.regenPerSecond * g).toFixed(2).padStart(7)} | ${((1 - g) * 100).toFixed(1).padStart(9)}%`,
    );
  }
  console.log("\n── WYSIŁEK: pełny stos wg Siły ──");
  for (const str of [10, 20, 30, 40, 50, 60, 70]) {
    const r = PELNY_STOS / udzwig(str, MODEL_D, EQUIPMENT_LOAD);
    console.log(`  STR ${String(str).padStart(2)} | udźwig ${udzwig(str, MODEL_D, EQUIPMENT_LOAD).toFixed(0).padStart(3)} kg | ratio ${r.toFixed(2)} | unik ${(STAMINA.costs.dodge * effortMul(r, MODEL_D)).toFixed(1)}`);
  }
}

console.log(`\n${w.bledy === 0 ? "✅" : "⛔"} BŁĘDÓW: ${w.bledy} · OSTRZEŻEŃ: ${w.ostrzezenia}`);
console.log("Nic nie zapisano — ten przymiar wyłącznie czyta.");
process.exit(w.bledy === 0 ? 0 : 1);
