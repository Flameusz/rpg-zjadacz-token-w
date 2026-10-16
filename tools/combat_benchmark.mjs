/**
 * COMBAT BENCHMARK — porównanie trzech konfiguracji walki na PRAWDZIWYM kodzie.
 *
 *   node tools/combat_benchmark.mjs
 *   node tools/combat_benchmark.mjs --armor heavy
 *   node tools/combat_benchmark.mjs --iterations 50000 --seed 999
 *   node tools/combat_benchmark.mjs --armor all
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ZASADA NACZELNA: ten plik NIE MA WŁASNEJ ARYTMETYKI WALKI.
 * ══════════════════════════════════════════════════════════════════════════
 * Każda liczba pochodzi z modułu, którego używa gra:
 *
 *   obrażenia rzutu      → `core/combat/DamageRoll.rollWeaponDamage`  (ta sama
 *                          funkcja, którą woła `Player.rollDamage`)
 *   jakość wykonania     → `core/Proficiency.rollExecution` + `.scaleDamage`
 *   pancerz celu         → `core/Protection.mitigate`
 *   tempo, zasięg, koszt → gettery `core/Progression` (`attackCooldown`,
 *                          `swingStaminaCost`, `offhandNumbers`, …)
 *   sprzęt i sloty       → `core/Equipment.equip` (prawdziwa ścieżka zakładania)
 *   stamina              → `core/Stamina` (pula, regen, `spend`)
 *   obrona gracza        → `core/DamageResolver.resolveIncoming` + `Defense`
 *
 * ⚠ **Jedyne, co ten plik składa sam, to `StrikeProfile`** — bo budują go
 * `GameScene.currentStrike()/offhandStrike()`, a `GameScene` jest sceną
 * Phasera i nie da się jej uruchomić w Node. Dlatego §0 niżej **czyta źródło
 * `GameScene.ts` i sprawdza, że każde pole profilu bierze się tu z tego samego
 * gettera co w grze.** Bez tej asercji benchmark mógłby cicho zmierzyć inną
 * grę niż ta, w którą się gra.
 *
 * ⚠ Ten plik **niczego nie zapisuje** i nie jest bramką regresyjną — od tego
 * jest `tools/combat_regresja.mjs`. Tutaj chodzi o LICZBY do rozmowy o balansie.
 */

import { build } from "esbuild";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ── CLI ─────────────────────────────────────────────────────────────────── */
const arg = (nazwa, domyslna) => {
  const i = process.argv.indexOf(`--${nazwa}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : domyslna;
};
const ITERACJE = Number(arg("iterations", 10000));
const ZIARNO = Number(arg("seed", 12345));
const PANCERZ_ARG = String(arg("armor", "light")).toLowerCase();

/**
 * **Siła gracza w benchmarku. Domyślnie 5 i to nie jest liczba z sufitu.**
 *
 * ⚠ Wymagania Siły są egzekwowane przez `Equipment.equip` (nie przez pole
 * `requires` w configu — liczą się z wagi). Zmierzone: miecz **2**, włócznia 3,
 * **topór bojowy 5**, młot 6. Przy Sile 0 konfiguracji „2H" **nie da się
 * założyć**, więc benchmark nie miałby czego porównać.
 *
 * ⚠ **5 to minimum, przy którym wszystkie trzy konfiguracje są legalne** —
 * najmniejsze możliwe odejście od czystej bazy. Wszystkie inne atrybuty
 * zostają na 0, a wszystkie trzy konfiguracje dostają DOKŁADNIE te same.
 * ⚠ Siła wchodzi przez `strScale` KAŻDEJ broni osobno, więc ta liczba wpływa na
 * wynik — dlatego jest wypisana w nagłówku raportu, a nie ukryta.
 */
const SILA = Number(arg("str", 5));

const TRYB_ALL = process.argv.includes("--all");
const TRYB_MATRIX = process.argv.includes("--matrix");
const TRYB_P = process.argv.includes("--proficiency");
const TRYB_SUSTAIN = process.argv.includes("--sustain") || arg("sustain", null) !== null;
/** Ile sekund trwa symulacja wytrzymałościowa (§SUSTAIN). */
const SUSTAIN_S = Number(arg("sustain", 60));

/**
 * **Cel benchmarkowy = dwie liczby: punkty pancerza i materiał.** Nic więcej,
 * bo `Protection.mitigate` niczego więcej nie potrzebuje — to jest dokładnie
 * kształt `ArmorSpec`, którym gra opisuje pancerz **obu stron walki**.
 * ⛔ Świadomie NIE ma tu klasy `Enemy` ani drugiego systemu walki: HP, AI,
 *   telegrafy i kanały obrażeń nie wpływają na żadną mierzoną liczbę.
 *
 * ⚠ **Materiały są WYŁĄCZNIE kluczami z `ARMOR_PROFILE`** (`leather`, `padded`,
 *   `mail`, `metal`) — żadnej nowej macierzy. Punkty dobrane tak, żeby pokryć
 *   krzywą `reductionFromPoints` od zera po okolice sufitu (`maxDefenseReduction`),
 *   a nie żeby odwzorować konkretnego wroga z gry.
 * ⚠ `very_heavy` istnieje po to, żeby zobaczyć **zachowanie przy sufitowej
 *   redukcji** — tam różnice między konfiguracjami zwykle się zlewają.
 *
 * Dodanie scenariusza = jeden wiersz; walidacja niżej pilnuje materiału.
 */
const SCENARIUSZE = {
  no_armor: { nazwa: "NO ARMOR", armor: null },
  light: { nazwa: "LIGHT", armor: { type: "leather", points: 20 } },
  medium: { nazwa: "MEDIUM", armor: { type: "padded", points: 35 } },
  heavy: { nazwa: "HEAVY", armor: { type: "mail", points: 50 } },
  very_heavy: { nazwa: "VERY HEAVY", armor: { type: "metal", points: 90 } },
};

/** Aliasy z poprzedniej wersji CLI, żeby stare polecenia nie zaczęły kłamać. */
const ALIASY = { none: "no_armor" };

/* ── Deterministyczny RNG (ten sam generator, co w regresji) ─────────────── */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const PRAWDZIWY_RANDOM = Math.random;

/* ── Prawdziwe moduły ────────────────────────────────────────────────────── */
const stub = join(KORZEN, "node_modules", ".phaser-stub-benchmark.ts");
await writeFile(
  stub,
  `const Phaser = {
     Math: {
       Clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)),
       RadToDeg: (r) => (r * 180) / Math.PI,
       DegToRad: (d) => (d * Math.PI) / 180,
     },
     // UWAGA core/EventBus.ts tworzy new Phaser.Events.EventEmitter() na starcie
     //   modulu, a Equipment go importuje - bez tego stub wywala sie przy samym
     //   IMPORCIE. Minimalny emitter: benchmark zdarzen nie slucha.
     //   (zadnych znakow odwrotnego apostrofu tutaj - to wnetrze template literala)
     Events: {
       EventEmitter: class {
         on() {}
         once() {}
         off() {}
         emit() {}
         removeAllListeners() {}
       },
     },
   };
   export default Phaser;\n`,
);
/**
 * ⚠⚠ **JEDEN bundle na wszystko — i to jest warunek poprawności, nie wygoda.**
 *
 * Każde osobne `esbuild` tworzy **osobny graf modułów**, więc `Equipment`
 * z jednego bundla widziałby INNY singleton `Progression` niż ten, któremu
 * benchmark ustawia atrybuty. Objaw: `Equipment.equip("sword")` odrzuca broń
 * na wymaganie Siły, mimo że Siła została ustawiona linijkę wyżej — bo została
 * ustawiona w drugiej kopii.
 *
 * ⚠ To jest **dokładnie ta sama pułapka**, którą `CLAUDE.md` opisuje przy
 * `window.dev`: „dynamiczny import daje DRUGI graf modułów, więc
 * `Equipment.equip(...)` z konsoli mutuje kopię, której nic nie renderuje".
 * Kosztowała już realne debugowanie dwa razy — tutaj kosztowała trzeci.
 *
 * Rozwiązanie: jeden tymczasowy plik-baryłka re-eksportujący wszystko, jeden
 * `build`, jeden `import`. Singletony są wtedy te same, co w grze.
 */
const barylka = join(KORZEN, "node_modules", ".benchmark-barylka.ts");
await writeFile(
  barylka,
  [
    'export * as CFG from "../src/config/GameConfig";',
    'export { Equipment } from "../src/core/Equipment";',
    'export { Inventory } from "../src/core/Inventory";',
    'export { Progression } from "../src/core/Progression";',
    'export { Stamina } from "../src/core/Stamina";',
    'export { Defense } from "../src/core/Defense";',
    'export { rollExecution, scaleDamage, missChance, slipChance, qualityMultiplier } from "../src/core/Proficiency";',
    'export { WeaponProficiency } from "../src/core/WeaponProficiency";',
    'export { mitigate, reductionFromPoints, armorPointsAgainst } from "../src/core/Protection";',
    'export { rollWeaponDamage } from "../src/core/combat/DamageRoll";',
    'export { resolveIncoming } from "../src/core/DamageResolver";',
    "",
  ].join("\n"),
);
const wyjscie = join(KORZEN, "node_modules", ".benchmark-bundle.mjs");
await build({
  entryPoints: [barylka],
  outfile: wyjscie,
  bundle: true,
  format: "esm",
  platform: "node",
  logLevel: "silent",
  alias: { phaser: stub },
});
const M = await import(pathToFileURL(wyjscie).href);
await unlink(wyjscie).catch(() => {});
await unlink(barylka).catch(() => {});
await unlink(stub).catch(() => {});

const {
  CFG,
  Equipment,
  Inventory,
  Progression,
  Stamina,
  Defense,
  WeaponProficiency,
  rollWeaponDamage,
  resolveIncoming,
} = M;
const PROF = { rollExecution: M.rollExecution, scaleDamage: M.scaleDamage };
// ⚠ Krzywe biegłości — te same funkcje, którymi gra liczy fumble/graze/m(P).
const PROF_M = { missChance: M.missChance, slipChance: M.slipChance, qualityMultiplier: M.qualityMultiplier };
const PROT = { mitigate: M.mitigate, reductionFromPoints: M.reductionFromPoints, armorPointsAgainst: M.armorPointsAgainst };
const DR = { rollWeaponDamage };
const RES = { resolveIncoming };

/* ── Postać: te same atrybuty dla KAŻDEJ konfiguracji ────────────────────── */
Progression.strength = SILA;
Progression.vitality = 0;
Progression.conditioning = 0;
Progression.agility = 0;

/* ══════════════════════════════════════════════════════════════════════════
   §0. ZAMEK ANTY-ROZJAZDOWY
   ══════════════════════════════════════════════════════════════════════════
   `StrikeProfile` składa `GameScene`, której nie da się tu uruchomić. Ta
   sekcja czyta jej ŹRÓDŁO i sprawdza, że pola, na których stoi benchmark,
   biorą się w grze z tych samych getterów. Rozjazd = benchmark mierzy inną
   grę niż ta, w którą się gra — cicho i wiarygodnie.
   ══════════════════════════════════════════════════════════════════════════ */
{
  const gs = await readFile(join(KORZEN, "src/scenes/GameScene.ts"), "utf8");
  const ciało = (naglowek) => {
    const a = gs.indexOf(naglowek);
    const dalej = gs.slice(a);
    return dalej.slice(0, dalej.indexOf("\n  }"));
  };
  const mh = ciało("  private currentStrike()");
  const oh = ciało("  private offhandStrike()");
  const pary = [
    ["MH damageMin", mh, /damageMin: Progression\.meleeDamageMin/],
    ["MH damageMax", mh, /damageMax: Progression\.meleeDamageMax/],
    ["MH critMultiplier", mh, /critMultiplier: Progression\.critMultiplier/],
    ["MH critChance", mh, /critChance: Progression\.critChance/],
    ["MH staminaCost", mh, /staminaCost: Progression\.swingStaminaCost/],
    ["MH cooldownMs", mh, /cooldownMs: Progression\.attackCooldown \* 1000/],
    ["MH proficiency", mh, /proficiency: WeaponProficiency\.get\(Equipment\.weaponFamily\)/],
    ["OH z `offhandNumbers`", oh, /const n = Progression\.offhandNumbers/],
    ["OH damageMin/Max", oh, /damageMin: n\.damageMin[\s\S]*damageMax: n\.damageMax/],
    ["OH critChance", oh, /critChance: n\.critChance/],
    ["OH staminaCost", oh, /staminaCost: n\.staminaCost/],
    ["OH cooldownMs", oh, /cooldownMs: Progression\.offhandAttackCooldown \* 1000/],
  ];
  const złe = pary.filter(([, src, re]) => !re.test(src)).map(([n]) => n);
  if (złe.length) {
    console.error("BŁĄD: benchmark rozjechał się z `GameScene.StrikeProfile`:");
    for (const n of złe) console.error("  • " + n);
    console.error("Napraw budowę profilu w tym pliku, ZANIM zaufasz liczbom.");
    process.exit(2);
  }
}

/* ── Profile ciosu — te same gettery, co w `GameScene` (patrz §0) ────────── */
const profilMH = () => ({
  hand: "MH",
  damageMin: Progression.meleeDamageMin,
  damageMax: Progression.meleeDamageMax,
  critMultiplier: Progression.critMultiplier,
  critLowCut: Progression.critLowCut,
  critChance: Progression.critChance,
  staminaCost: Progression.swingStaminaCost,
  cooldownMs: Progression.attackCooldown * 1000,
  proficiency: WeaponProficiency.get(Equipment.weaponFamily),
  damageType: Progression.damageType,
});
const profilOH = () => {
  const n = Progression.offhandNumbers;
  if (!n) return null;
  return {
    hand: "OH",
    damageMin: n.damageMin,
    damageMax: n.damageMax,
    critMultiplier: n.critMultiplier,
    critLowCut: n.critLowCut,
    critChance: n.critChance,
    staminaCost: n.staminaCost,
    cooldownMs: Progression.offhandAttackCooldown * 1000,
    proficiency: n.proficiency,
    damageType: Equipment.offhandDamageType ?? Progression.damageType,
  };
};

/* ══════════════════════════════════════════════════════════════════════════
   POZIOMY BIEGŁOŚCI (`P`)
   ══════════════════════════════════════════════════════════════════════════
   ⚠⚠ **Ani jedna z tych liczb nie jest wymyślona** — wszystkie pochodzą
   z `PROFICIENCY` w `GameConfig.ts`:

     `neutral: 100`               → `x = P / 100`, czyli P100 to punkt, w którym
                                    `missChance`/`slipChance` schodzą do zera,
                                    a `qualityMultiplier` mija 1,0;
     `masteryThresholds`          → 50 · 100 · 200 · 350, czyli **sufity `P`
                                    kolejnych rang** (`WeaponProficiency.capFor`).

   ⚠⚠ **`P` NIE DA SIĘ MIERZYĆ W ODERWANIU OD MASTERY powyżej 50 — i to jest
   własność systemu, nie benchmarku.** `WeaponProficiency.set()` **przycina
   wartość do `capFor(family)`**, a ten zależy od wykupionej rangi. Żeby
   w ogóle osiągnąć P200, trzeba mieć rangę II — a ranga niesie własny ładunek
   (`effortReduction`, `traitMultiplier`, `critLowCut`). Dlatego kolumna „ranga"
   jest w raporcie widoczna: **wyniki dla P200/P350 zawierają też efekty rang**
   i nie wolno ich czytać jako „czysty wpływ P".

   `Pmax` = **350**, ostatni SKOŃCZONY próg. Po wykupieniu rangi IV `capFor`
   zwraca `Infinity`, więc górnej granicy `P` w systemie po prostu nie ma.
   ══════════════════════════════════════════════════════════════════════════ */
const PROG = CFG.PROFICIENCY.masteryThresholds;
/** Najniższa ranga, przy której `capFor` dopuszcza dane `P`. Liczona, nie wpisana. */
const rangaDla = (P) => {
  const i = PROG.findIndex((t) => t >= P);
  return i < 0 ? PROG.length : i;
};
const POZIOMY_P = [
  { id: "P0", P: 0, opis: "świeży start" },
  { id: "P50", P: PROG[0], opis: "sufit rangi 0" },
  { id: "P100", P: CFG.PROFICIENCY.neutral, opis: "neutral · sufit M-I" },
  { id: "P200", P: PROG[2], opis: "sufit M-II" },
  { id: "P350", P: PROG[3], opis: "Pmax · sufit M-III" },
].map((x) => ({ ...x, rank: rangaDla(x.P) }));

/**
 * Ustawia `P` **dla wszystkich rodzin broni naraz** prawdziwym API
 * (`setMastery` → `set`), więc obowiązują te same sufity co w grze.
 * ⚠ Dla Dual Wieldu obie ręce dostają tę samą wartość — inaczej porównanie
 *   mierzyłoby różnicę biegłości, a nie różnicę konfiguracji.
 */
function ustawP(poziom) {
  WeaponProficiency.reset();
  for (const fam of Object.keys(CFG.WEAPON_FAMILY)) {
    WeaponProficiency.setMastery(fam, poziom.rank);
    WeaponProficiency.set(fam, poziom.P);
    const realne = WeaponProficiency.get(fam);
    if (realne !== poziom.P) {
      console.error(`BŁĄD: ${poziom.id} dla rodziny "${fam}" przycięte do ${realne} (cap rangi ${poziom.rank}).`);
      console.error("  Benchmark mierzyłby inne `P`, niż deklaruje w nagłówku.");
      process.exit(2);
    }
  }
}

/* ── Konfiguracje ────────────────────────────────────────────────────────── */
const KONFIGI = [
  { nazwa: "1H + Shield", weapon: "sword", offhand: "buckler" },
  { nazwa: "2H", weapon: "battle_axe", offhand: null },
  { nazwa: "Dual Wield", weapon: "sword", offhand: "dagger" },
];

/**
 * Założenie sprzętu **prawdziwą ścieżką gry**: przedmiot ląduje w plecaku
 * (`Inventory.addItem`), a potem idzie przez `Equipment.equip`, czyli przez tę
 * samą walidację slotów, która decyduje o `hands: 2` i o tym, co wolno włożyć
 * do drugiej ręki. ⛔ Podstawienie slotów wprost ominęłoby tę walidację i
 * benchmark mierzyłby konfiguracje, których gra by nie pozwoliła założyć.
 */
function ubierz(k) {
  Equipment.reset();
  Inventory.reset?.();
  const wloz = (id, slot) => {
    // ⚠ `addItem` zwraca RESZTĘ (0 = wszystko weszło), nie liczbę dodanych.
    if (Inventory.addItem(id, 1) !== 0) {
      console.error(`BŁĄD: nie udało się dodać ${id} do plecaka.`);
      process.exit(2);
    }
    if (!Equipment.equip(id, slot)) {
      console.error(`BŁĄD: \`Equipment.equip\` odrzuciło ${id}${slot ? " → " + slot : ""}.`);
      process.exit(2);
    }
  };
  wloz(k.weapon, "weapon");
  if (k.offhand) wloz(k.offhand, "offhand");

  const ok = Equipment.weapon?.itemId === k.weapon && (!k.offhand || Equipment.offhand?.itemId === k.offhand);
  if (!ok) {
    console.error(`BŁĄD: po założeniu stan slotów nie zgadza się z konfiguracją ${k.nazwa}.`);
    console.error(`  weapon=${Equipment.weapon?.itemId ?? "—"}  offhand=${Equipment.offhand?.itemId ?? "—"}`);
    process.exit(2);
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   OFENSYWA
   ══════════════════════════════════════════════════════════════════════════ */
function benchOfensywa(k, scenariusz) {
  ubierz(k);
  Math.random = mulberry32(ZIARNO);
  Stamina.reset?.();
  Stamina.syncMax?.(Progression.conditioning ?? 0);

  const dw = Equipment.dualWielding;
  const mh = profilMH();
  const oh = dw ? profilOH() : null;

  const st = {
    trafienia: [],
    krytyki: 0,
    wykonania: { whiff: 0, fumble: 0, graze: 0, clean: 0 },
    czasMs: 0,
    stamina: 0,
    perReka: {
      MH: { n: 0, dmg: 0, stam: 0, czasMs: 0, kryt: 0, trafien: 0 },
      OH: { n: 0, dmg: 0, stam: 0, czasMs: 0, kryt: 0, trafien: 0 },
    },
  };

  let reka = "MH";
  for (let i = 0; i < ITERACJE; i++) {
    const p = reka === "OH" && oh ? oh : mh;

    // 1. Jakość wykonania — PRAWDZIWY `rollExecution`.
    const wyk = PROF.rollExecution(p.proficiency, true);
    st.wykonania[wyk] = (st.wykonania[wyk] ?? 0) + 1;

    // 2. Rzut — PRAWDZIWA funkcja, ta sama, którą woła `Player.rollDamage`.
    //    ⚠ Mnożnik efektów = 1: benchmark nie symuluje Okrzyku bojowego.
    let zadane = 0;
    if (wyk !== "fumble" && wyk !== "whiff") {
      const rzut = DR.rollWeaponDamage(p, 1);
      if (rzut.crit) {
        st.krytyki++;
        st.perReka[p.hand].kryt++;
      }
      st.perReka[p.hand].trafien++;
      // 3. `m(P)` / Ześlizg — PRAWDZIWY `scaleDamage`.
      const surowe = Math.max(1, Math.round(PROF.scaleDamage(rzut.amount, p.proficiency, wyk)));
      // 4. Pancerz celu — PRAWDZIWY `Protection.mitigate`.
      zadane = PROT.mitigate(surowe, scenariusz.armor ?? undefined, p.damageType);
      st.trafienia.push(zadane);
    }

    st.czasMs += p.cooldownMs;
    st.stamina += p.staminaCost;
    const r = st.perReka[p.hand];
    r.n++;
    r.dmg += zadane;
    r.stam += p.staminaCost;
    r.czasMs += p.cooldownMs;

    if (dw && oh) reka = reka === "MH" ? "OH" : "MH";
  }
  Math.random = PRAWDZIWY_RANDOM;

  const sek = st.czasMs / 1000;
  const suma = st.trafienia.reduce((a, b) => a + b, 0);
  const posort = [...st.trafienia].sort((a, b) => a - b);
  const mediana = posort.length ? posort[Math.floor(posort.length / 2)] : 0;

  // Wyczerpanie: pula / (koszt na sekundę − regen przy wysiłku).
  const pula = Stamina.max ?? CFG.STAMINA.base;
  const stamNaS = st.stamina / sek;
  const netto = stamNaS - CFG.STAMINA.regenPerSecond;
  const doWyczerpania = netto > 0 ? pula / netto : Infinity;

  return {
    nazwa: k.nazwa,
    dw,
    ataki: ITERACJE,
    sumaObrazen: suma,
    trafien: posort.length,
    attPerS: ITERACJE / sek,
    avgHit: posort.length ? suma / posort.length : 0,
    medHit: mediana,
    minHit: posort.length ? posort[0] : 0,
    maxHit: posort.length ? posort[posort.length - 1] : 0,
    critPct: (100 * st.krytyki) / ITERACJE,
    wyk: st.wykonania,
    dps: suma / sek,
    stamPerS: stamNaS,
    dmgPerStam: suma / st.stamina,
    doWyczerpaniaS: doWyczerpania,
    atakowDoWyczerpania: doWyczerpania === Infinity ? Infinity : doWyczerpania * (ITERACJE / sek),
    perReka: st.perReka,
    sek,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   SUSTAIN — dłuższa walka na PRAWDZIWEJ staminie i PRAWDZIWEJ regeneracji
   ══════════════════════════════════════════════════════════════════════════
   ⚠⚠ **To NIE jest burst przeliczony na 60 s.** Pętla wyżej zakłada stałe
   tempo; tutaj zegar płynie, `Stamina.tick` regeneruje dokładnie tak, jak
   w grze, a `Stamina.spend` zdejmuje koszt każdego zamachu.

   ⚠⚠ **I to zmienia wynik, bo istnieje SPRZĘŻENIE ZWROTNE, którego burst nie
   widzi:** `Progression.attackCooldown` dzieli przez
   `Stamina.attackSpeedMultiplier`, a ten spada wraz ze stanem (`tired`,
   `exhausted`). Zmęczony gracz **bije wolniej**, więc wydaje mniej staminy na
   sekundę — układ sam się stabilizuje. Dlatego profil ciosu jest tu
   **przeliczany przed KAŻDYM zamachem**, a nie zamrożony raz.

   ⛔ Zero nowego modelu regeneracji: `STAMINA.regenPerSecond` przy wysiłku,
   `regenRestedPerSecond` po `restedAfterMs` — decyduje `Stamina.tick`.
   ══════════════════════════════════════════════════════════════════════════ */
function benchSustain(k, scenariusz, sekund) {
  ubierz(k);
  Math.random = mulberry32(ZIARNO);
  Stamina.refill();
  Stamina.syncMax(Progression.conditioning ?? 0);

  const dw = Equipment.dualWielding;
  const KROK_MS = 16; // ~jedna klatka; `tick` jest liniowy, więc krok tylko rozdrabnia regen
  const KONIEC = sekund * 1000;

  let teraz = 0;
  let nastepnyCios = 0;
  let reka = "MH";
  const st = {
    ataki: 0,
    obrazenia: 0,
    stamina: 0,
    pierwszeZero: null,
    atakowDoZera: null,
    minStamina: Infinity,
    perReka: { MH: 0, OH: 0 },
  };

  while (teraz < KONIEC) {
    Stamina.tick(KROK_MS, teraz);
    if (teraz >= nastepnyCios) {
      // ⚠ Profil PRZELICZANY — bo `attackCooldown` i `swingStaminaCost` zależą
      //   od bieżącego stanu staminy. To jest cały sens tej pętli.
      const p = reka === "OH" && dw ? profilOH() : profilMH();
      const wyk = PROF.rollExecution(p.proficiency, true);
      if (wyk !== "fumble" && wyk !== "whiff") {
        const rzut = DR.rollWeaponDamage(p, 1);
        const surowe = Math.max(1, Math.round(PROF.scaleDamage(rzut.amount, p.proficiency, wyk)));
        st.obrazenia += PROT.mitigate(surowe, scenariusz.armor ?? undefined, p.damageType);
      }
      Stamina.spend(p.staminaCost, "autoAttack", teraz);
      st.stamina += p.staminaCost;
      st.ataki++;
      st.perReka[p.hand]++;
      nastepnyCios = teraz + p.cooldownMs;
      if (dw) reka = reka === "MH" ? "OH" : "MH";

      if (Stamina.current <= 0 && st.pierwszeZero === null) {
        st.pierwszeZero = teraz / 1000;
        st.atakowDoZera = st.ataki;
      }
      st.minStamina = Math.min(st.minStamina, Stamina.current);
    }
    teraz += KROK_MS;
  }
  Math.random = PRAWDZIWY_RANDOM;

  return {
    nazwa: k.nazwa,
    dw,
    sekund,
    ...st,
    dps: st.obrazenia / sekund,
    stamPerS: st.stamina / sekund,
    stanKoncowy: Stamina.state,
    staminaKoncowa: Stamina.current,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   OBRONA — istniejący łańcuch, ZERO nowych mechanik
   ══════════════════════════════════════════════════════════════════════════
   ⚠ Woła `DamageResolver.resolveIncoming`, czyli dokładnie to, co
   `Player.takeDamage`. Wróg nie ma bloku ani parowania (patrz §Y w regresji),
   więc mierzalna jest wyłącznie obrona GRACZA.
   ══════════════════════════════════════════════════════════════════════════ */
function benchObrona(k, ciosow) {
  ubierz(k);
  Math.random = mulberry32(ZIARNO);
  Defense.reset?.();

  const wynik = { block: 0, parry: 0, dodge: 0, hit: 0, suma: 0 };
  const OD_PRZODU = { x: 0, y: 1 };
  for (let i = 0; i < ciosow; i++) {
    const r = RES.resolveIncoming({
      amount: 20,
      damageType: "slash",
      from: OD_PRZODU,
      guardDir: 0, // w dół — kąt, nie ćwiartka (GuardFacing = number od 2026-09-27)
      invulnerable: false,
      dodgeChance: Progression.dodgeChance,
      parryChance: Progression.parryChance,
      armorReduction: Equipment.reductionAgainst("slash"),
      blockReduction: Equipment.blockSpec?.reduction ?? 0,
      blockSideMul: CFG.SHIELD.sideZoneMul,
    });
    wynik[r.outcome] = (wynik[r.outcome] ?? 0) + 1;
    wynik.suma += r.mitigated;
  }
  Math.random = PRAWDZIWY_RANDOM;
  return { nazwa: k.nazwa, ...wynik, ciosow };
}

/* ── Raport ──────────────────────────────────────────────────────────────── */
const f1 = (n) => (Number.isFinite(n) ? n.toFixed(1) : "∞");
const f2 = (n) => (Number.isFinite(n) ? n.toFixed(2) : "∞");
const pad = (v, n) => String(v).padStart(n);
const padR = (v, n) => String(v).padEnd(n);
const pct = (n, z) => ((100 * n) / z).toFixed(1) + "%";

console.log("\n=== COMBAT BENCHMARK ===\n");

/* ══════════════════════════════════════════════════════════════════════════
   VALIDATION — czy benchmark mierzy to, co gra
   ══════════════════════════════════════════════════════════════════════════
   ⚠ Nie sprawdza „czy liczba jest ładna", tylko **czy zachodzą zależności,
   które mają zachodzić z budowy systemu**. Każda z nich zapaliłaby się na
   czerwono, gdyby benchmark czytał zły getter albo gdyby ktoś cofnął jedną
   z decyzji z tej sesji.
   ══════════════════════════════════════════════════════════════════════════ */
{
  const bledy = [];
  const spr = (opis, ok, detal = "") => {
    console.log(`  ${ok ? "OK  " : "BŁĄD"} ${opis}${detal ? "   " + detal : ""}`);
    if (!ok) bledy.push(opis);
  };
  console.log("VALIDATION:");

  const bezPancerza = SCENARIUSZE.no_armor;
  const solo1H = benchOfensywa({ nazwa: "solo 1H", weapon: "sword", offhand: null }, bezPancerza);
  const tarcza = benchOfensywa(KONFIGI[0], bezPancerza);
  const dwureczna = benchOfensywa(KONFIGI[1], bezPancerza);
  const dw = benchOfensywa(KONFIGI[2], bezPancerza);

  // 1. `offhandSwingMul` działa DOKŁADNIE tam, gdzie ma.
  ubierz({ nazwa: "solo 1H", weapon: "sword", offhand: null });
  spr("`offhandSwingMul` = 1 przy samej broni (nic nie modyfikuje tempa)", Equipment.offhandSwingMul === 1);
  ubierz(KONFIGI[0]);
  const zTarcza = Equipment.offhandSwingMul;
  spr("…tarcza SPOWALNIA (mnożnik > 1 albo z `blockSpec`)", zTarcza !== 1 && !Equipment.dualWielding, `= ${zTarcza}`);
  ubierz(KONFIGI[2]);
  spr("…Dual Wield PRZYSPIESZA i bierze `DUAL_WIELD.swingMul`", Equipment.offhandSwingMul === CFG.DUAL_WIELD.swingMul, `= ${Equipment.offhandSwingMul}`);
  spr("…a `dualWieldSwingMul` jest 1 poza DW", (ubierz({ nazwa: "x", weapon: "sword", offhand: null }), Equipment.dualWieldSwingMul === 1));

  // 2. Tempo: 2H najwolniejsze, DW najszybsze — inaczej tożsamości nie zachodzą.
  spr("2H jest wolniejsze od 1H i od DW", dwureczna.attPerS < solo1H.attPerS && dwureczna.attPerS < dw.attPerS,
    `2H ${dwureczna.attPerS.toFixed(2)} < 1H ${solo1H.attPerS.toFixed(2)} < DW ${dw.attPerS.toFixed(2)}`);
  spr("tarcza spowalnia względem samej broni", tarcza.attPerS < solo1H.attPerS);

  // 3. 2H bije mocniej na cios — druga połowa tożsamości.
  spr("2H ma wyższy średni cios niż 1H i DW", dwureczna.avgHit > solo1H.avgHit && dwureczna.avgHit > dw.avgHit,
    `${dwureczna.avgHit.toFixed(1)} vs ${solo1H.avgHit.toFixed(1)} / ${dw.avgHit.toFixed(1)}`);

  // 4. Krytyk z WŁAŚCIWEJ ręki (naprawa 2026-09-05).
  //    Miecz MH = PLAYER.critChance, sztylet OH = +critChanceBonus. Jeśli DW
  //    czytałby rękę główną dla obu, jego krytyk byłby RÓWNY 1H.
  spr("krytyk DW leży MIĘDZY ręką główną a drugą (czyli liczy się per ręka)",
    dw.critPct > solo1H.critPct + 1, `DW ${dw.critPct.toFixed(1)}% > 1H ${solo1H.critPct.toFixed(1)}%`);

  // 5. Stamina DW (naprawa 2026-09-05): wyższy event rate MUSI kosztować.
  spr("DW kosztuje WIĘCEJ staminy na sekundę niż sama broń główna",
    dw.stamPerS > solo1H.stamPerS, `${dw.stamPerS.toFixed(2)} > ${solo1H.stamPerS.toFixed(2)}`);

  // 6. Obie ręce naprawdę uderzają.
  spr("obie ręce mają po 50% ciosów", dw.perReka.MH.n === dw.perReka.OH.n);
  spr("obie ręce zadają obrażenia", dw.perReka.MH.dmg > 0 && dw.perReka.OH.dmg > 0);

  // 7. Ta sama biegłość i ten sam cel dla wszystkich — inaczej porównanie kłamie.
  spr("jakość wykonania identyczna dla 1H i 2H (ta sama biegłość startowa)",
    tarcza.wyk.clean === dwureczna.wyk.clean && tarcza.wyk.fumble === dwureczna.wyk.fumble);

  if (bledy.length) {
    console.error(`\n${bledy.length} zależności nie zachodzi — NIE UFAJ liczbom niżej.\n`);
    process.exit(1);
  }
  console.log();
}

// ⚠⚠ **Zamek na literówkę w materiale, sprawdzany PRZY STARCIE dla WSZYSTKICH
//   scenariuszy** — nie tylko dla tego, który akurat uruchomiono. Pierwsza
//   wersja miała `"steel"`, którego w `ARMOR_PROFILE` nie ma, i wywalała się
//   dopiero po `--armor heavy`. Materiały pochodzą z gry i tylko z gry.
{
  const zle = Object.entries(SCENARIUSZE).filter(([, sc]) => sc.armor && !(sc.armor.type in CFG.ARMOR_PROFILE));
  if (zle.length) {
    console.error("BŁĄD: scenariusze odwołują się do materiałów spoza `ARMOR_PROFILE`:");
    for (const [id, sc] of zle) console.error(`  • ${id} → "${sc.armor.type}"`);
    console.error(`  dostępne: ${Object.keys(CFG.ARMOR_PROFILE).join(", ")}`);
    process.exit(2);
  }
}

const wybrany = ALIASY[PANCERZ_ARG] ?? PANCERZ_ARG;
const doPrzejscia =
  TRYB_ALL || TRYB_MATRIX ? Object.keys(SCENARIUSZE) : [wybrany in SCENARIUSZE ? wybrany : "light"];
if (!(wybrany in SCENARIUSZE) && !TRYB_ALL && !TRYB_MATRIX) {
  console.log(`⚠ Nieznany scenariusz "${PANCERZ_ARG}" — użyto "light". Dostępne: ${Object.keys(SCENARIUSZE).join(", ")}\n`);
}

/* ══════════════════════════════════════════════════════════════════════════
   TYP OBRAŻEŃ × MATERIAŁ — wprost z `ARMOR_PROFILE`, przez `Protection`
   ══════════════════════════════════════════════════════════════════════════
   ⚠ Ta tabela **nie ma ani jednego własnego mnożnika**. Liczy się tak:
       punkty efektywne = `armorPointsAgainst(points, materiał, typ)`
       redukcja         = `reductionFromPoints(punkty efektywne)`
   czyli dokładnie tym, czym liczy je `Protection.mitigate` w grze.
   ⚠ Wiersz „×" to sam mnożnik z `ARMOR_PROFILE` — pokazany osobno, bo to on
     jest własnością pary (typ × materiał), a redukcja zależy jeszcze od
     punktów i od krzywej z sufitem `maxDefenseReduction`.
   ══════════════════════════════════════════════════════════════════════════ */
function tabelaTypow(punkty) {
  const materialy = Object.keys(CFG.ARMOR_PROFILE);
  const typy = Object.keys(CFG.ARMOR_PROFILE[materialy[0]]);
  console.log(`\nDamage Type × Armor Material  (${punkty} pkt pancerza, redukcja końcowa)`);
  console.log(padR("", 9) + materialy.map((m) => pad(m, 10)).join(""));
  console.log("-".repeat(9 + 10 * materialy.length));
  for (const t of typy) {
    const kom = materialy.map((m) => {
      const pkt = PROT.armorPointsAgainst(punkty, m, t);
      return pad((100 * PROT.reductionFromPoints(pkt)).toFixed(1) + "%", 10);
    });
    console.log(padR(t, 9) + kom.join(""));
  }
  // ⚠ Surowy mnożnik z `ARMOR_PROFILE` — to ON jest własnością pary
  //   (typ × materiał). Redukcja wyżej zależy jeszcze od punktów i od krzywej
  //   z sufitem `maxDefenseReduction`, więc same procenty potrafią zmylić.
  console.log(`
Mnożnik `.trimEnd() + " ARMOR_PROFILE (surowy, bez punktów i krzywej)");
  console.log(padR("", 9) + materialy.map((m) => pad(m, 10)).join(""));
  console.log("-".repeat(9 + 10 * materialy.length));
  for (const t of typy) {
    console.log(padR(t, 9) + materialy.map((m) => pad("×" + CFG.ARMOR_PROFILE[m][t].toFixed(2), 10)).join(""));
  }
}


/** Zebrane wyniki wszystkich scenariuszy — do macierzy na końcu. */
const MACIERZ = [];

for (const klucz of doPrzejscia) {
  const sc = SCENARIUSZE[klucz];
  const wyniki = KONFIGI.map((k) => benchOfensywa(k, sc));
  MACIERZ.push({ klucz, sc, wyniki });

  // ⚠ W trybie `--matrix` pomijamy raporty szczegółowe — chodzi o jedną tabelę
  //   przekrojową, nie o pięć pełnych wydruków.
  if (TRYB_MATRIX) continue;

  console.log(`Scenario: ${sc.nazwa}`);
  console.log(`Iterations: ${ITERACJE}`);
  console.log(`Seed: ${ZIARNO}`);
  console.log(`Attributes: SIŁ ${SILA} · WIT 0 · KON 0 · ZRĘ 0   (SIŁ ${SILA} = minimum, przy którym Topór bojowy da się założyć)`);
  console.log(`Stamina pool: ${Stamina.max} · regen ${CFG.STAMINA.regenPerSecond}/s`);
  console.log(
    `Target: ${sc.armor ? `${sc.armor.points} pkt ${sc.armor.type}` : "bez pancerza"}` +
      (sc.armor
        ? ` → redukcja slash ${(100 * PROT.reductionFromPoints(PROT.armorPointsAgainst(sc.armor.points, sc.armor.type, "slash"))).toFixed(1)}%`
        : ""),
  );
  console.log();

  console.log(
    padR("Config", 16) + pad("Att/s", 7) + pad("AvgHit", 8) + pad("Med", 6) + pad("Min", 5) + pad("Max", 6) +
      pad("DPS", 8) + pad("Stam/s", 8) + pad("DPS/Stam", 10) + pad("Ataki", 8) + pad("Suma obr.", 11),
  );
  console.log("-".repeat(93));
  for (const w of wyniki) {
    console.log(
      padR(w.nazwa, 16) + pad(f2(w.attPerS), 7) + pad(f1(w.avgHit), 8) + pad(w.medHit, 6) + pad(w.minHit, 5) +
        pad(w.maxHit, 6) + pad(f1(w.dps), 8) + pad(f2(w.stamPerS), 8) + pad(f2(w.dmgPerStam), 10) +
        pad(w.ataki, 8) + pad(w.sumaObrazen, 11),
    );
  }

  console.log("\nExecution:");
  console.log(padR("Config", 16) + pad("Whiff", 8) + pad("Fumble", 8) + pad("Graze", 8) + pad("Clean", 8) + pad("Crit", 8));
  console.log("-".repeat(58));
  for (const w of wyniki) {
    console.log(
      padR(w.nazwa, 16) + pad(pct(w.wyk.whiff ?? 0, ITERACJE), 8) + pad(pct(w.wyk.fumble ?? 0, ITERACJE), 8) +
        pad(pct(w.wyk.graze ?? 0, ITERACJE), 8) + pad(pct(w.wyk.clean ?? 0, ITERACJE), 8) + pad(f1(w.critPct) + "%", 8),
    );
  }

  const dw = wyniki.find((w) => w.dw);
  if (dw) {
    const { MH, OH } = dw.perReka;
    const wiersz = (etykieta, a, b) => console.log("  " + padR(etykieta, 14) + pad(a, 10) + pad(b, 10));
    console.log("\nDual Wield — rozbicie na ręce:");
    console.log("  " + padR("", 14) + pad("MH", 10) + pad("OH", 10));
    console.log("  " + "-".repeat(34));
    wiersz("udział ciosów", pct(MH.n, MH.n + OH.n), pct(OH.n, MH.n + OH.n));
    wiersz("Att/s", f2(MH.n / dw.sek), f2(OH.n / dw.sek));
    wiersz("AvgHit", MH.trafien ? f1(MH.dmg / MH.trafien) : "—", OH.trafien ? f1(OH.dmg / OH.trafien) : "—");
    wiersz("DPS", f1(MH.dmg / dw.sek), f1(OH.dmg / dw.sek));
    wiersz("udział obrażeń", pct(MH.dmg, MH.dmg + OH.dmg), pct(OH.dmg, MH.dmg + OH.dmg));
    wiersz("Stam/s", f2(MH.stam / dw.sek), f2(OH.stam / dw.sek));
    wiersz("crit %", MH.trafien ? f1((100 * MH.kryt) / MH.trafien) + "%" : "—", OH.trafien ? f1((100 * OH.kryt) / OH.trafien) + "%" : "—");
  }

  /* ── SUSTAIN ─────────────────────────────────────────────────────────── */
  console.log(`\nSustain (${SUSTAIN_S} s ciągłej walki, prawdziwy \`Stamina.tick\`):`);
  console.log(
    padR("Config", 16) + pad("Obrażenia", 11) + pad("DPS", 8) + pad("Stamina", 9) + pad("Stam/s", 8) +
      pad("Ataki", 7) + pad("Zero w", 9) + pad("Stan koniec", 13),
  );
  console.log("-".repeat(84));
  for (const k of KONFIGI) {
    const su = benchSustain(k, sc, SUSTAIN_S);
    console.log(
      padR(su.nazwa, 16) + pad(Math.round(su.obrazenia), 11) + pad(f1(su.dps), 8) + pad(f1(su.stamina), 9) +
        pad(f2(su.stamPerS), 8) + pad(su.ataki, 7) +
        pad(su.pierwszeZero === null ? "nie" : f1(su.pierwszeZero) + " s", 10) +
        pad(`${su.stanKoncowy} (${Math.round(su.staminaKoncowa)})`, 15),
    );
  }
  console.log("  ⚠ Tempo SPADA wraz ze zmęczeniem (`Stamina.attackSpeedMultiplier`), więc sustain nie jest bursty × czas.");

  /* ── OBRONA ──────────────────────────────────────────────────────────── */
  console.log("\nDefense (łańcuch `DamageResolver.resolveIncoming`, cios 20 slash od przodu):");
  console.log(padR("Config", 16) + pad("Block", 8) + pad("Parry", 8) + pad("Dodge", 8) + pad("Hit", 8) + pad("AvgTaken", 10));
  console.log("-".repeat(58));
  for (const k of KONFIGI) {
    const o = benchObrona(k, ITERACJE);
    console.log(
      padR(o.nazwa, 16) + pad(pct(o.block, o.ciosow), 8) + pad(pct(o.parry, o.ciosow), 8) +
        pad(pct(o.dodge, o.ciosow), 8) + pad(pct(o.hit, o.ciosow), 8) + pad(f2(o.suma / o.ciosow), 10),
    );
  }
  console.log("  ⚠ Pancerz gracza = brak (mierzymy tarczę/parowanie/unik, nie sprzęt). Tempo wroga NIE jest symulowane.");
  console.log();
}

/* ══════════════════════════════════════════════════════════════════════════
   MACIERZ PRZEKROJOWA
   ══════════════════════════════════════════════════════════════════════════ */
if (TRYB_ALL || TRYB_MATRIX) {
  console.log("=== MATRIX: DPS wg pancerza celu ===\n");
  console.log(padR("Config", 16) + MACIERZ.map((m) => pad(m.sc.nazwa, 12)).join(""));
  console.log("-".repeat(16 + 12 * MACIERZ.length));
  for (let i = 0; i < KONFIGI.length; i++) {
    console.log(padR(KONFIGI[i].nazwa, 16) + MACIERZ.map((m) => pad(f1(m.wyniki[i].dps), 12)).join(""));
  }

  console.log("\n" + padR("Config", 16) + MACIERZ.map((m) => pad(m.sc.nazwa, 12)).join("") + "   (DPS/Stam)");
  console.log("-".repeat(16 + 12 * MACIERZ.length));
  for (let i = 0; i < KONFIGI.length; i++) {
    console.log(padR(KONFIGI[i].nazwa, 16) + MACIERZ.map((m) => pad(f2(m.wyniki[i].dmgPerStam), 12)).join(""));
  }

  // ⚠ Pytanie A z zadania: czy DW traci przewagę wraz ze wzrostem pancerza?
  //   Liczone, nie zakładane — porównanie do 1H + tarcza w każdym scenariuszu.
  console.log("\nΔ względem `1H + Shield` (pytanie A: czy przewaga zależy od pancerza?)");
  console.log(padR("Config", 16) + MACIERZ.map((m) => pad(m.sc.nazwa, 12)).join(""));
  console.log("-".repeat(16 + 12 * MACIERZ.length));
  for (let i = 1; i < KONFIGI.length; i++) {
    console.log(
      padR(KONFIGI[i].nazwa, 16) +
        MACIERZ.map((m) => {
          const d = (m.wyniki[i].dps / m.wyniki[0].dps - 1) * 100;
          return pad((d >= 0 ? "+" : "") + d.toFixed(1) + "%", 12);
        }).join(""),
    );
  }

  tabelaTypow(50);
  console.log();
}

/* ══════════════════════════════════════════════════════════════════════════
   WYMIAR BIEGŁOŚCI — `--proficiency`
   ══════════════════════════════════════════════════════════════════════════
   ⚠ Ustawia `P` prawdziwym API i mierzy TE SAME funkcje co reszta pliku.
     Biegłość wchodzi do wyniku czterema kanałami, wszystkie istniejące:
       `missChance`  → fumble          `slipChance` → graze
       `qualityMultiplier m(P)`        → mnożnik obrażeń czystego ciosu
       `effortReduction` (ranga)       → koszt staminy zamachu
   ══════════════════════════════════════════════════════════════════════════ */
if (TRYB_P) {
  console.log("=== PROFICIENCY DIMENSION ===\n");
  console.log(padR("Poziom", 8) + pad("P", 6) + pad("ranga", 7) + pad("fumble", 9) + pad("graze", 8) + pad("m(P)", 8) + pad("efort", 8) + "  opis");
  console.log("-".repeat(70));
  for (const lv of POZIOMY_P) {
    ustawP(lv);
    const fam = "sword";
    console.log(
      padR(lv.id, 8) + pad(lv.P, 6) + pad("M-" + lv.rank, 7) +
        pad((100 * PROF_M.missChance(lv.P)).toFixed(1) + "%", 9) +
        pad((100 * PROF_M.slipChance(lv.P)).toFixed(1) + "%", 8) +
        pad(PROF_M.qualityMultiplier(lv.P).toFixed(3), 8) +
        pad((100 * WeaponProficiency.effortReduction(fam)).toFixed(0) + "%", 8) + "  " + lv.opis,
    );
  }
  console.log("  ⚠ P200/P350 wymagają rangi M-II/M-III, więc NIOSĄ TEŻ ładunek rangi (efort, cecha rodziny, `φ`).");
  console.log("    To nie jest czysty wplyw samego P - tak dziala system i nie da sie tego rozdzielic pomiarem.\n");

  const scenariuszeP = TRYB_MATRIX || TRYB_ALL ? Object.keys(SCENARIUSZE) : [wybrany in SCENARIUSZE ? wybrany : "light"];

  /* ── Pełna macierz Config × P × Armor ──────────────────────────────── */
  console.log("=== MATRIX: Configuration × P × Armor (DPS) ===\n");
  console.log(padR("Config", 16) + padR("P", 7) + scenariuszeP.map((k) => pad(SCENARIUSZE[k].nazwa, 12)).join("") + pad("P0→Pmax", 11));
  console.log("-".repeat(23 + 12 * scenariuszeP.length + 11));
  const zebrane = {};
  for (const k of KONFIGI) {
    zebrane[k.nazwa] = {};
    for (const lv of POZIOMY_P) {
      ustawP(lv);
      zebrane[k.nazwa][lv.id] = scenariuszeP.map((klucz) => benchOfensywa(k, SCENARIUSZE[klucz]));
    }
    for (const lv of POZIOMY_P) {
      const w = zebrane[k.nazwa][lv.id];
      const baza = zebrane[k.nazwa]["P0"];
      const wzrost = lv.id === "P0" ? "—" : "+" + ((w[0].dps / baza[0].dps - 1) * 100).toFixed(0) + "%";
      console.log(
        padR(lv.id === "P0" ? k.nazwa : "", 16) + padR(lv.id, 7) +
          w.map((x) => pad(f1(x.dps), 12)).join("") + pad(wzrost, 11),
      );
    }
    console.log();
  }

  /* ── DPS / Stamina ─────────────────────────────────────────────────── */
  console.log("=== DPS / Stamina ===\n");
  console.log(padR("Config", 16) + padR("P", 7) + scenariuszeP.map((k) => pad(SCENARIUSZE[k].nazwa, 12)).join(""));
  console.log("-".repeat(23 + 12 * scenariuszeP.length));
  for (const k of KONFIGI) {
    for (const lv of POZIOMY_P) {
      const w = zebrane[k.nazwa][lv.id];
      console.log(padR(lv.id === "P0" ? k.nazwa : "", 16) + padR(lv.id, 7) + w.map((x) => pad(f2(x.dmgPerStam), 12)).join(""));
    }
    console.log();
  }

  /* ── Szczegóły dla scenariusza pierwszego z listy ───────────────────── */
  const scRef = SCENARIUSZE[scenariuszeP[0]];
  console.log(`=== SZCZEGÓŁY (${scRef.nazwa}) ===\n`);
  console.log(
    padR("Config", 16) + padR("P", 7) + pad("Att/s", 7) + pad("AvgHit", 8) + pad("Med", 5) + pad("Min", 5) +
      pad("Max", 5) + pad("DPS", 7) + pad("Stam/s", 8) + pad("Crit", 7) + pad("Whiff", 7) + pad("Fumble", 8) +
      pad("Graze", 7) + pad("Clean", 7) + pad("Ataki", 7) + pad("Suma", 10),
  );
  console.log("-".repeat(114));
  for (const k of KONFIGI) {
    for (const lv of POZIOMY_P) {
      const x = zebrane[k.nazwa][lv.id][0];
      console.log(
        padR(lv.id === "P0" ? k.nazwa : "", 16) + padR(lv.id, 7) + pad(f2(x.attPerS), 7) + pad(f1(x.avgHit), 8) +
          pad(x.medHit, 5) + pad(x.minHit, 5) + pad(x.maxHit, 5) + pad(f1(x.dps), 7) + pad(f2(x.stamPerS), 8) +
          pad(f1(x.critPct) + "%", 7) + pad(pct(x.wyk.whiff ?? 0, ITERACJE), 7) + pad(pct(x.wyk.fumble ?? 0, ITERACJE), 8) +
          pad(pct(x.wyk.graze ?? 0, ITERACJE), 7) + pad(pct(x.wyk.clean ?? 0, ITERACJE), 7) + pad(x.ataki, 7) + pad(x.sumaObrazen, 10),
      );
    }
    console.log();
  }

  /* ── DW: MH / OH przez wszystkie P ──────────────────────────────────── */
  console.log(`=== DUAL WIELD — MH / OH wg P (${scRef.nazwa}) ===\n`);
  console.log(padR("P", 7) + pad("MH att/s", 10) + pad("OH att/s", 10) + pad("MH avg", 9) + pad("OH avg", 9) +
    pad("MH DPS", 9) + pad("OH DPS", 9) + pad("MH stam/s", 11) + pad("OH stam/s", 11) + pad("MH crit", 9) + pad("OH crit", 9));
  console.log("-".repeat(103));
  for (const lv of POZIOMY_P) {
    const d = zebrane["Dual Wield"][lv.id][0];
    const { MH, OH } = d.perReka;
    console.log(
      padR(lv.id, 7) + pad(f2(MH.n / d.sek), 10) + pad(f2(OH.n / d.sek), 10) +
        pad(MH.trafien ? f1(MH.dmg / MH.trafien) : "—", 9) + pad(OH.trafien ? f1(OH.dmg / OH.trafien) : "—", 9) +
        pad(f1(MH.dmg / d.sek), 9) + pad(f1(OH.dmg / d.sek), 9) +
        pad(f2(MH.stam / d.sek), 11) + pad(f2(OH.stam / d.sek), 11) +
        pad(MH.trafien ? f1((100 * MH.kryt) / MH.trafien) + "%" : "—", 9) +
        pad(OH.trafien ? f1((100 * OH.kryt) / OH.trafien) + "%" : "—", 9),
    );
  }
  console.log();

  /* ── SUSTAIN wg P ───────────────────────────────────────────────────── */
  if (TRYB_SUSTAIN) {
    const poziomySus = POZIOMY_P.filter((lv) => ["P0", "P100", "P350"].includes(lv.id));
    console.log(`=== SUSTAIN ${SUSTAIN_S} s wg P (${scRef.nazwa}) ===\n`);
    console.log(padR("Config", 16) + padR("P", 7) + pad("Obrażenia", 11) + pad("DPS", 8) + pad("Stamina", 9) +
      pad("Stam/s", 8) + pad("Ataki", 7) + pad("Zero w", 10) + pad("Stan koniec", 15));
    console.log("-".repeat(91));
    for (const k of KONFIGI) {
      for (const lv of poziomySus) {
        ustawP(lv);
        const su = benchSustain(k, scRef, SUSTAIN_S);
        console.log(
          padR(lv.id === "P0" ? k.nazwa : "", 16) + padR(lv.id, 7) + pad(Math.round(su.obrazenia), 11) +
            pad(f1(su.dps), 8) + pad(f1(su.stamina), 9) + pad(f2(su.stamPerS), 8) + pad(su.ataki, 7) +
            pad(su.pierwszeZero === null ? "nie" : f1(su.pierwszeZero) + " s", 10) +
            pad(`${su.stanKoncowy} (${Math.round(su.staminaKoncowa)})`, 15),
        );
      }
      console.log();
    }
  }

  // ⚠ Sprzątanie: reszta pliku (i ewentualne kolejne uruchomienia) ma widzieć
  //   biegłość startową, a nie tę z ostatniego wiersza tabeli.
  WeaponProficiency.reset();
}

console.log("⚠ Wszystkie liczby pochodzą z modułów gry (patrz nagłówek pliku).");
console.log(`⚠ SIŁ ${SILA}, reszta atrybutów 0, jakość Zwykła, biegłość startowa, zero buffów — to jest PUNKT ODNIESIENIA, nie stan gracza w grze.`);
console.log("⚠ Okrzyk bojowy, warianty ataku, jakość wykonania sprzętu i umiejętności NIE są symulowane.\n");
