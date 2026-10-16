/**
 * Stamina jako zasób SERII STARĆ — przymiar ilościowy (2026-08-20).
 *
 * ⚠ **TYLKO RAPORT. Nic nie zapisuje, nic nie jest zaimplementowane.**
 *
 * ── Czym to się różni od `stamina_przymiar.mjs` ────────────────────────────
 * Tamten sprawdzał hipotezę „stamina wyczerpuje się w JEDNEJ walce" i ją
 * obalił: walka trwa 0,6–3,8 s, więc zasób nigdy nie wiązał. Ten liczy
 * hipotezę odwrotną i **znacznie mocniejszą**: stamina jako miara zdolności do
 * utrzymania intensywnego wysiłku przez **serię starć**, gdzie autoatak jest
 * niemal darmowy, a płaci się za działania intensywne.
 *
 * ⚠ **Kluczowa liczba, której nikt wcześniej nie zmierzył:** las ma
 * **19 spawnów wroga**, mediana odległości do najbliższego sąsiada **233 px
 * (~1,6 s marszu)**. To znaczy, że „jedno przejście mapy" ma konkretną,
 * policzalną długość — 19 walk — i dopiero względem niej da się powiedzieć,
 * czy pasek staminy ma sensowny horyzont.
 *
 * Wszystko o dzisiejszej grze czytane z `GameConfig.ts` przez esbuild.
 * Wszystko o proponowanej staminie stoi w bloku `P` i jest PROPOZYCJĄ.
 *
 *   node tools/stamina_horyzont.mjs
 */

import { build } from "esbuild";
import { unlink } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(KORZEN, "node_modules", ".stamina-horyzont.mjs");
await build({
  entryPoints: [join(KORZEN, "src", "config", "GameConfig.ts")],
  outfile: tmp, format: "esm", bundle: false, logLevel: "silent",
});
const C = await import(pathToFileURL(tmp).href);
await unlink(tmp).catch(() => {});

const { ITEMS, PLAYER, ATTRIBUTES, WEAPON_FAMILY, ABILITIES,
        RABBIT, BOAR, WOLF, GREY_WOLF, BEAR, SPIDER, VENOM_SPIDER } = C;

// ── PROPOZYCJA (przedmiot decyzji, nie config) ─────────────────────────────
const P = {
  base: 120,
  conStamina: 10,
  autoatak: [1, 2],          // dwa warianty do porównania
  dodge: 15,
  skill: 20,                 // typowa umiejętność
  sprintNaSek: 10,
  blokNaSek: 5,
  blokZaCios: 4,             // ⚠ za ZABLOKOWANY CIOS, nie za sekundę
  // ⚠ **PROGI SĄ BEZWZGLĘDNE, NIE PROCENTOWE — i to jest wynik pomiaru, nie
  // gust.** Przy progu procentowym (20% puli) symulacja pokazała absurd:
  // CON 10 wyczerpywał się w 7. walce, a CON 0 nie wyczerpywał się wcale.
  // Powód: pula rośnie, więc próg rośnie razem z nią, a stan ustalony jest
  // dla obu ten sam (~25). Czyli **inwestycja w wytrzymałość KARAŁA**.
  // Wartość bezwzględna daje to, czego się oczekuje: większa pula = większy
  // zapas NAD progiem.
  progTired: 45,             // poniżej tylu punktów — Zmęczony
  progExhausted: 25,         // poniżej tylu punktów — Wyczerpany
  // ── Miękkie zejście zamiast bramki (decyzja autora 2026-08-20) ──────────
  // ⚠ Przy wyczerpaniu gracz NIE traci możliwości ataku — atakuje wolniej.
  // Analogia bokserska: zmęczony bokser dalej uderza, tylko wolno.
  karaTempaPrzyWyczerpaniu: 0.35,
  // Regeneracja schodkowa: martwa przez `regenDelaySek` od ostatniego
  // WYSIŁKU, potem stała. Ten sam kształt, co reguła 5 sekund dla HP.
  regenDelaySek: 5,
  regenPoDelay: 5,
};

// ── Model walki (przepisany z Progression) ─────────────────────────────────
const asb = (dex) => Math.min(dex * ATTRIBUTES.attackSpeedPerAgility, ATTRIBUTES.maxAttackSpeedBonus);
function profilBroni(id, str, dex) {
  const w = ITEMS[id];
  const f = w.family ? WEAPON_FAMILY[w.family] : null;
  const zRodziny = f && "critMultiplierBonus" in f ? f.critMultiplierBonus : 0;
  const cm = PLAYER.critMultiplier + (w.melee?.critMultiplierBonus ?? 0) + zRodziny;
  const cc = Math.min(PLAYER.critChance + (w.melee?.critChanceBonus ?? 0), ATTRIBUTES.maxCritChance);
  const avg = ((w.damageMin + w.damageMax) / 2) * (1 + str * w.strScale + dex * w.dexScale);
  const naZamach = avg * (1 + cc * (cm - 1));
  const cykl = w.attackCooldown / (1 + asb(dex));
  return { nazwa: w.name, naZamach, cykl, dps: naZamach / cykl };
}

// Roster lasu — POLICZONY Z MAPY (public/assets/maps/forrest.tmj, 19 spawnów)
const LAS = [
  { n: "Królik", hp: RABBIT.hp, ile: 5 },
  { n: "Sieciarz", hp: SPIDER.hp, ile: 3 },
  { n: "Wilk", hp: WOLF.hp, ile: 4 },
  { n: "Skoczek", hp: VENOM_SPIDER.hp, ile: 3 },
  { n: "Dzik", hp: BOAR.hp, ile: 2 },
  { n: "Niedźwiedź", hp: BEAR.hp, ile: 1 },
  { n: "Szary (elita)", hp: GREY_WOLF.hp, ile: 1 },
];
const WALK_NA_PRZEJSCIE = LAS.reduce((s, e) => s + e.ile, 0);

const f1 = (n) => n.toFixed(1);
const pad = (s, n) => String(s).padStart(n);
const padr = (s, n) => String(s).padEnd(n);

// ── 1. Ile zamachów trwa walka ─────────────────────────────────────────────
console.log("== 1. Zamachy na walkę (to jest podstawa całego rachunku autoataku) ==");
const BUILDY = [
  { n: "ciężki (SIŁ 10, młot)", id: "hammer", str: 10, dex: 0 },
  { n: "lekki (ZRĘ 10, sztylet)", id: "dagger", str: 0, dex: 10 },
  { n: "startowy (0 pkt, miecz)", id: "sword", str: 0, dex: 0 },
];
for (const b of BUILDY) {
  const p = profilBroni(b.id, b.str, b.dex);
  const zam = LAS.map((e) => Math.ceil(e.hp / p.naZamach));
  const suma = LAS.reduce((s, e, i) => s + zam[i] * e.ile, 0);
  console.log(`\n  ${b.n}  —  ${f1(p.naZamach)} obr./zamach, cykl ${Math.round(p.cykl * 1000)} ms`);
  console.log("    " + LAS.map((e) => pad(e.n.slice(0, 9), 11)).join(""));
  console.log("    " + zam.map((z) => pad(z, 11)).join(""));
  console.log(`    → CAŁE PRZEJŚCIE LASU (${WALK_NA_PRZEJSCIE} walk): **${suma} zamachów**`);
  b.zamachy = zam; b.sumaZamachow = suma; b.profil = p;
}

// ── 2. Autoatak 1 vs 2 ─────────────────────────────────────────────────────
console.log("\n== 2. Autoatak: 1 vs 2 staminy ==");
console.log("  ⚠ Uwaga strukturalna: build SZYBKI wykonuje WIĘCEJ zamachów na tę samą walkę,");
console.log("    więc koszt za zamach jest podatkiem od Zręczności. To decyduje o wyborze.\n");
console.log("  build                     zamachów/przejście   koszt @1   koszt @2");
for (const b of BUILDY) {
  console.log("  " + padr(b.n, 26) + pad(b.sumaZamachow, 18) + pad(b.sumaZamachow * 1, 11) + pad(b.sumaZamachow * 2, 11));
}
console.log("\n  Koszt samego autoataku dla serii walk (build lekki — najgorszy przypadek):");
const lekki = BUILDY[1];
const srZamachow = lekki.sumaZamachow / WALK_NA_PRZEJSCIE;
console.log(`  (średnio ${f1(srZamachow)} zamachu na walkę)`);
console.log("  walk        @1 stamina   @2 stamina   % puli CON0 @1   % puli CON0 @2");
for (const n of [1, 5, 10, 15, 20]) {
  const k1 = Math.round(n * srZamachow * 1), k2 = Math.round(n * srZamachow * 2);
  console.log("  " + pad(n, 4) + pad(k1, 14) + pad(k2, 13) + pad(Math.round(100 * k1 / P.base) + "%", 17) + pad(Math.round(100 * k2 / P.base) + "%", 17));
}

// ── 3. Scenariusze A–D: koszt typowej walki ────────────────────────────────
console.log("\n== 3. Koszt walki wg stylu gry (build lekki, autoatak = 1) ==");
const SCEN = [
  { n: "A. spokojna (0 unik, 0 skill)", dodge: 0, skill: 0, sprint: 0, blok: 0 },
  { n: "B. ostrożna (1 unik)",          dodge: 1, skill: 0, sprint: 0, blok: 0 },
  { n: "C. aktywna (2 uniki, 1 skill)", dodge: 2, skill: 1, sprint: 0, blok: 0 },
  { n: "D. intensywna (3 uniki, 1 skill, 2 s sprintu, 2 s bloku)", dodge: 3, skill: 1, sprint: 2, blok: 2 },
];
for (const s of SCEN) {
  const koszt = srZamachow * 1 + s.dodge * P.dodge + s.skill * P.skill + s.sprint * P.sprintNaSek + s.blok * P.blokNaSek;
  s.koszt = koszt;
  const udzialAuto = 100 * (srZamachow * 1) / koszt;
  console.log(`  ${padr(s.n, 58)} ${pad(Math.round(koszt), 4)} staminy   (autoatak = ${Math.round(udzialAuto)}% wydatku)`);
}

// ── 4. Symulacja wyprawy: miękkie zejście zamiast bramki ───────────────────
//
// ⚠ Model zmieniony 2026-08-20 na wniosek autora. Poprzednia wersja pytała
// „ile walk zanim zabraknie" i traktowała brak staminy jako BRAMKĘ. Teraz:
//
//  • autoatak KOSZTUJE (bo atakowanie męczy — analogia bokserska),
//  • blok kosztuje ZA ZABLOKOWANY CIOS (przyjęcie ciosu na tarczę to wysiłek),
//  • poniżej progu wyczerpania gracz **nie traci możliwości ataku** — atakuje
//    WOLNIEJ, a autoatak przestaje kosztować (nie da się zejść poniżej zera
//    w sposób blokujący podstawową czynność),
//  • regeneracja jest SCHODKOWA: martwa przez 5 s od ostatniego wysiłku,
//    potem stała — ten sam kształt, co reguła 5 sekund dla HP.
//
// ⚠ Prawdziwą karą za wyczerpanie NIE jest brak ataku, tylko to, że walka
// trwa dłużej → przeciwnik dostaje więcej okien na cios. To jest liczone niżej.

const STYLE = [
  { n: "A. spokojny",   dodge: 0, skill: 0, blok: 0, sprint: 0 },
  { n: "B. ostrożny",   dodge: 1, skill: 0, blok: 1, sprint: 0 },
  { n: "C. aktywny",    dodge: 2, skill: 1, blok: 2, sprint: 0 },
  { n: "D. intensywny", dodge: 3, skill: 1, blok: 3, sprint: 2 },
];

function kosztWalki(st, zamachow, wyczerpany, mnoznikObc = 1) {
  const auto = wyczerpany ? 0 : zamachow * 1;
  return auto + st.dodge * P.dodge * mnoznikObc + st.skill * P.skill
       + st.blok * P.blokZaCios + st.sprint * P.sprintNaSek * mnoznikObc;
}

/** Przebieg całego przejścia lasu: 19 walk w kolejności rosnącej trudności. */
function wyprawa(styl, con, marszSek, profil, mnoznikObc = 1) {
  const pula = P.base + con * P.conStamina;
  const progWy = P.progExhausted;
  let s = pula, wyczerpanychWalk = 0, pierwszeWyczerpanie = null, pierwszyTired = null;
  let dodatkoweOkna = 0;
  const kolejnosc = [];
  for (const e of LAS) for (let i = 0; i < e.ile; i++) kolejnosc.push(e);
  kolejnosc.sort((a, b) => a.hp - b.hp);

  kolejnosc.forEach((e, idx) => {
    const zam = Math.ceil(e.hp / profil.naZamach);
    const wyczerpany = s < progWy;
    if (wyczerpany) {
      wyczerpanychWalk++;
      if (pierwszeWyczerpanie === null) pierwszeWyczerpanie = idx + 1;
      // Kara: walka trwa dłużej → więcej okien na cios przeciwnika.
      dodatkoweOkna += zam * profil.cykl * (1 / (1 - P.karaTempaPrzyWyczerpaniu) - 1);
    }
    s = Math.max(0, s - kosztWalki(styl, zam, wyczerpany, mnoznikObc));
    if (pierwszyTired === null && s < P.progTired) pierwszyTired = idx + 1;
    // Marsz: martwe `regenDelaySek`, potem stała regeneracja.
    const czasRegen = Math.max(0, marszSek - P.regenDelaySek);
    s = Math.min(pula, s + czasRegen * P.regenPoDelay);
  });
  return { koniec: Math.round(s), pula, wyczerpanychWalk, pierwszeWyczerpanie, pierwszyTired,
           dodatkoweOkna: dodatkoweOkna.toFixed(1) };
}

console.log("\n== 4. PRZEJŚCIE LASU (19 walk) — kiedy przychodzi wyczerpanie ==");
console.log(`   Pula ${P.base} + ${P.conStamina}×CON · autoatak 1 · unik ${P.dodge} · skill ${P.skill}`);
console.log(`   · blok ${P.blokZaCios}/cios · regen ${P.regenPoDelay}/s po ${P.regenDelaySek} s bez wysiłku`);
console.log(`   Wyczerpanie = poniżej ${P.progExhausted} pkt → tempo ataku −${Math.round(P.karaTempaPrzyWyczerpaniu * 100)}%, autoatak darmowy\n`);
for (const marsz of [10, 20]) {
  console.log(`  ── marsz między walkami: ${marsz} s ──`);
  console.log("  styl            CON   Tired po   Wyczerpany po   walk wyczerp.   stamina na końcu");
  for (const st of STYLE) {
    for (const con of [0, 10]) {
      const r = wyprawa(st, con, marsz, BUILDY[1].profil);
      console.log(
        "  " + padr(st.n, 15) + pad(con, 4) + pad(r.pierwszyTired ?? "—", 11) +
        pad(r.pierwszeWyczerpanie ?? "—", 16) + pad(r.wyczerpanychWalk, 16) +
        pad(`${r.koniec}/${r.pula}`, 18),
      );
    }
  }
  console.log("");
}

// ── 5. Realna kara za wyczerpanie ──────────────────────────────────────────
console.log("== 5. Co WYCZERPANIE realnie kosztuje (nie: brak ataku) ==");
console.log("  Tempo −35% → walka trwa ×1,54 dłużej → tyle sekund EKSTRA pod ciosami:\n");
console.log("  przeciwnik        zamachów   walka normalnie   wyczerpany   +sekund pod ciosami");
for (const e of LAS) {
  const p = BUILDY[1].profil;
  const zam = Math.ceil(e.hp / p.naZamach);
  const norm = zam * p.cykl;
  const wycz = norm / (1 - P.karaTempaPrzyWyczerpaniu);
  console.log("  " + padr(e.n, 17) + pad(zam, 9) + pad(f1(norm) + "s", 18) + pad(f1(wycz) + "s", 13) + pad("+" + f1(wycz - norm) + "s", 20));
}

// ── 6. Ogon: ile jeszcze zrobisz po wyczerpaniu ────────────────────────────
console.log("\n== 6. Ogon po wyczerpaniu — czy gracz może dokończyć wyprawę ==");
console.log("  Przy wyczerpaniu autoatak jest DARMOWY, więc ogon jest nieskończony,");
console.log("  ale wolny. Uniki i skille nadal kosztują — oto ile ich zostaje:\n");
console.log("  CON   pula   próg wyczerp.   uników poniżej progu   skilli poniżej progu");
for (const con of [0, 5, 10, 15]) {
  const pula = P.base + con * P.conStamina;
  const prog = P.progExhausted;
  console.log("  " + pad(con, 3) + pad(pula, 7) + pad(Math.round(prog), 15) +
    pad(Math.floor(prog / P.dodge), 23) + pad(Math.floor(prog / P.skill), 22));
}

console.log(`\n  (przejście lasu = ${WALK_NA_PRZEJSCIE} walk)`);
console.log("\n(przymiar — nic nie zapisano)");
