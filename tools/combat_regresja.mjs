/**
 * Faza 1A.0 przebudowy walki (`docs/systemy/combat.md`) — UPRZĄŻ REGRESYJNA.
 *
 * ⚠ **To jest BRAMKA, a nie przymiar.** Kryterium wyjścia z Fazy 1A brzmi:
 * „identyczne trafienia, identyczne pudła, identyczne wyniki rozstrzygnięcia".
 * Bez tego pliku takiego zdania **nie da się sprawdzić** — a niesprawdzalne
 * kryterium jest gorsze niż żadne, bo daje fałszywe poczucie kontroli.
 *
 * ── Dlaczego to musi powstać PRZED refaktorem ────────────────────────────
 * Baseline zapisany po refaktorze niczego nie chroni: zamraża stan już
 * zmieniony. Kolejność jest wiążąca:
 *
 *   1. ten plik + `--zapisz-baseline`   (na NIETKNIĘTYM kodzie)
 *   2. refaktor 1A.1 … 1A.6
 *   3. `node tools/combat_regresja.mjs --nowy`  → musi zgadzać się CO DO BITU
 *
 * ── Losowość: dlaczego bez tego uprząż byłaby dekoracją ──────────────────
 * ⚠ `Defense.rollDodge`/`rollParry` wołają `Math.random()`, więc porównanie
 * „stary vs nowy" zwracałoby różnicę **przy każdym uruchomieniu, także gdy kod
 * jest identyczny**. Dlatego `Math.random` jest tu podmieniony na mulberry32 z
 * ustalonym ziarnem, przywracany po przebiegu.
 *
 * ⚠ **`Defense` niesie STAN MIĘDZY RZUTAMI** (`streak` w `PrdCounter` — PRD to
 * „bad luck protection", jego cały sens polega na pamiętaniu porażek). Bez
 * `Defense.reset()` przed każdym przypadkiem N-ty test zależałby od poprzednich
 * N−1, a przestawienie kolejności w tabeli zmieniałoby wyniki. Reset jest
 * wołany jawnie, nie „na wszelki wypadek".
 *
 * ── Co ten plik uruchamia NAPRAWDĘ, a co transkrybuje ────────────────────
 * • **PRAWDZIWE** (bundlowane przez esbuild): `core/Protection.ts`,
 *   `core/Defense.ts`, `config/GameConfig.ts`.
 * • **TRANSKRYBOWANE** z cytatem linii: predykaty geometrii z `GameScene.ts`.
 *   Powód jest wymuszony: żyją jako METODY PRYWATNE sceny Phasera, splecione z
 *   grupami, kamerą, `Sfx` i popupami — nie da się ich zaimportować pod Node.
 *   **To jest nazwane ryzyko:** jeśli transkrypcja jest zła, baseline zamraża
 *   złą liczbę. Dlatego §„KONTROLA KRZYŻOWA" niżej liczy trzy przypadki
 *   RĘCZNIE, z arytmetyki wypisanej wprost, i porównuje z transkrypcją.
 *
 * ⚠ **Kontekst wchodzi jako DANE, nie przez `Progression`.** Nie dlatego, że
 * `Progression` ciągnie `Equipment` → `Inventory`/`Save` (choć ciągnie — patrz
 * `attack_resolver_weryfikacja.mjs`), tylko dlatego, że **to jest dokładnie ta
 * granica, którą Faza 1A wycina**: `DamageResolver` ma dostawać szanse i
 * redukcje, a nie sięgać po singletony. Kształt tej uprzęży jest więc
 * jednocześnie testem projektu API.
 *
 *   node tools/combat_regresja.mjs                    (porównaj z baseline)
 *   node tools/combat_regresja.mjs --zapisz-baseline  (zamroź stan obecny)
 *   node tools/combat_regresja.mjs --nowy             (po 1A: nowe moduły)
 *
 * Kod wyjścia ≠ 0 przy JAKIEJKOLWIEK różnicy wobec baseline'u.
 */

import { build } from "esbuild";
import { readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = join(KORZEN, "tools", "combat_regresja_baseline.json");
const stubPhaser = join(KORZEN, "node_modules", ".phaser-stub-regresja.ts");
const tmpProt = join(KORZEN, "node_modules", ".protection-real.mjs");
const tmpDef = join(KORZEN, "node_modules", ".defense-real2.mjs");
const tmpCfg = join(KORZEN, "node_modules", ".config-regresja.mjs");

const ZAPISZ = process.argv.includes("--zapisz-baseline");
/**
 * ⚠ **Od Fazy 1B-b prawdziwe moduły są DOMYŚLNE.** Wcześniej trzeba było
 * `--nowy`, bo trwał refaktor i chodziło o porównanie starego z nowym. Teraz
 * `legacy` (transkrypcja) opisuje kod, którego już nie ma — zostawienie go jako
 * domyślnej ścieżki znaczyłoby, że bramka świeci na zielono, testując martwy
 * kod. `--legacy` zostaje wyłącznie dla kontroli krzyżowej arytmetyki.
 */
const NOWY = !process.argv.includes("--legacy");

/* ── Ziarno ─────────────────────────────────────────────────────────────── */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const PRAWDZIWY_RANDOM = Math.random;
const ZIARNO = 20260822;

/* ── Prawdziwe moduły ───────────────────────────────────────────────────── */
// Protection.ts importuje phaser w całości (Math.Clamp/RadToDeg). Zwykły import
// Phasera pod Node rzuca `ReferenceError: window is not defined` — sprawdzone
// wprost w `attack_resolver_weryfikacja.mjs`. Tamten plik uciekł od tego przez
// kontrolę krzyżową; tutaj podstawiamy stub z dokładnie tymi dwiema funkcjami,
// dzięki czemu uruchamia się PRAWDZIWY `isFrontal`, a nie jego kopia.
await writeFile(
  stubPhaser,
  `const Phaser = {
     Math: {
       Clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)),
       RadToDeg: (r) => (r * 180) / Math.PI,
       DegToRad: (d) => (d * Math.PI) / 180,
     },
   };
   export default Phaser;\n`,
);
const wspolne = { bundle: true, format: "esm", platform: "node", logLevel: "silent" };
await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/Protection.ts")], outfile: tmpProt, alias: { phaser: stubPhaser } });
await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/Defense.ts")], outfile: tmpDef });
await build({ ...wspolne, entryPoints: [join(KORZEN, "src/config/GameConfig.ts")], outfile: tmpCfg, alias: { phaser: stubPhaser } });

const PROT = await import(pathToFileURL(tmpProt).href);
const { Defense } = await import(pathToFileURL(tmpDef).href);
const CFG = await import(pathToFileURL(tmpCfg).href);
const { ASSETS, PLAYER, WOLF, GREY_WOLF, BOAR, BEAR, VENOM_SPIDER, RABBIT, ITEMS } = CFG;

/* ══════════════════════════════════════════════════════════════════════════
   IMPLEMENTACJA STARA — transkrypcja z GameScene.ts, z cytatem
   ══════════════════════════════════════════════════════════════════════════ */

const legacy = {
  nazwa: "legacy (transkrypcja GameScene.ts)",

  /** GameScene.ts:2382 — `damageMatchingEnemies`, dosłownie. */
  allowance: (e) => Math.max(e.displayWidth, e.displayHeight) * 0.35,

  /** GameScene.ts:2264 — `targetInReach`, dosłownie. */
  wZasiegu(gracz, e, reach) {
    const allowance = this.allowance(e);
    const dist = Math.hypot(e.x - gracz.x, e.y - gracz.y);
    return dist - allowance <= reach;
  },

  /** GameScene.ts:2325 — `damageEnemiesInArc`, dosłownie (stożek + bąbel). */
  wLuku(gracz, e, dirX, dirY, reach, arcDeg) {
    const allowance = this.allowance(e);
    // ⚠ Stała PREKOMPUTOWANA, jak `Phaser.Math.DEG_TO_RAD`. `(arcDeg*Math.PI)/180`
    // różni się na ostatnim bicie, a to porównanie jest przy progu nieostre.
    const cosHalfArc = Math.cos(arcDeg * (Math.PI / 180));
    const dx = e.x - gracz.x;
    const dy = e.y - gracz.y;
    const dist = Math.hypot(dx, dy);
    if (dist - allowance > reach) return false;
    if (dist <= PLAYER.pointBlankRadius + allowance) return true;
    return (dx / dist) * dirX + (dy / dist) * dirY >= cosHalfArc;
  },

  /** GameScene.ts:2356 — `damageEnemiesInCircle`, dosłownie. */
  wKole(x, y, e, radius) {
    // ⚠ `sqrt(dx²+dy²)`, nie `Math.hypot` — oryginał woła
    // `Phaser.Math.Distance.Between`, które liczy właśnie tak. Zmierzone: obie
    // formy różnią się w 38% losowych par.
    const dx = x - e.x, dy = y - e.y;
    return Math.sqrt(dx * dx + dy * dy) <= radius + this.allowance(e);
  },

  /** Enemy.ts:604 — `damageAfterArmor`. PRAWDZIWE `Protection.mitigate`. */
  obrazeniaWroga: (amount, armor, damageType) => PROT.mitigate(amount, armor, damageType),

  /** ⚠ Stan PRD należy do KONKRETNEJ instancji `Defense`. Implementacja musi
   *  wystawić własne wejście do niego, bo `--nowy` bundluje swój graf modułów
   *  i miałby DRUGI licznik — `reset()` z zewnątrz nie ruszyłby tego, który
   *  naprawdę rzuca. To jest ta sama pułapka co `import()` w konsoli. */
  resetObrony: () => Defense.reset(),
  rzutUniku: (p) => Defense.rollDodge(p),

  /**
   * Player.ts:1061 — `takeDamage`, łańcuch Combat v1.
   *
   * ⚠ KOLEJNOŚĆ jest treścią tej funkcji, nie szczegółem: Dodge (wszechkierunkowy)
   * → Parry (frontalny) → Block (frontalny, deterministyczny) → Pancerz, i
   * **JEDNO zaokrąglenie na końcu**. Dla wielu wejść zła kolejność daje ten sam
   * wynik, więc tabela przypadków musi zawierać takie, które ją rozróżniają.
   */
  przyjmijCios(ctx) {
    if (ctx.invulnerable) return { outcome: "immune", mitigated: 0, killed: false };
    if (Defense.rollDodge(ctx.dodgeChance)) return { outcome: "dodge", mitigated: 0, killed: false };
    // ⚠ Parowanie ZOSTAJE na `isFrontal` (półkula 90°) — nie na strefach.
    //   Napisanie tu `zone !== "back"` poszerzyłoby parowanie o pas boczny
    //   przy okazji strojenia tarczy; §X pilnuje, żeby nikt tego nie zrobił.
    const frontal = PROT.isFrontal(ctx.guardDir, ctx.from);
    if (frontal && Defense.rollParry(ctx.parryChance)) {
      return { outcome: "parry", mitigated: 0, killed: false };
    }
    // ⚠ Blok w TRZECH strefach (2026-09-05). Strefa zmienia MNOŻNIK — nie
    //   szansę i nie liczbę zaokrągleń, których nadal jest dokładnie jedno.
    const zone = PROT.guardZone(ctx.guardDir, ctx.from);
    const afterArmor = 1 - ctx.armorReduction;
    const blocked =
      zone === "front" ? ctx.blockReduction : zone === "side" ? ctx.blockReduction * ctx.blockSideMul : 0;
    const mitigated = Math.max(1, Math.round(ctx.amount * afterArmor * (1 - blocked)));
    const hp = Math.max(0, ctx.hp - mitigated);
    return { outcome: blocked > 0 ? "block" : "hit", mitigated, killed: hp <= 0 };
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   IMPLEMENTACJA NOWA — dopiero powstanie w 1A.1…1A.6
   ══════════════════════════════════════════════════════════════════════════ */

async function zaladujNowa() {
  const tmpHR = join(KORZEN, "node_modules", ".hitresolver-real.mjs");
  const brak = [];
  const podpiete = [];
  const fallback = [];

  let HR = null;
  if (existsSync(join(KORZEN, "src/core/HitResolver.ts"))) {
    await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/HitResolver.ts")], outfile: tmpHR, alias: { phaser: stubPhaser } });
    HR = await import(pathToFileURL(tmpHR).href);
    podpiete.push("HitResolver (allowance, zasięg, łuk, koło)");
  } else brak.push("src/core/HitResolver.ts");

  // ⚠ JEDEN wpis dla `DamageResolver` i `Defense` — muszą wyjść z TEGO SAMEGO
  // grafu modułów, inaczej uprząż resetowałaby inny licznik PRD niż ten, który
  // rzuca. Dokładnie ta pułapka, którą `CLAUDE.md` opisuje przy `window.dev`.
  let DR = null;
  if (existsSync(join(KORZEN, "src/core/DamageResolver.ts"))) {
    const wejscie = join(KORZEN, "node_modules", ".dr-entry.ts");
    const naSlashe = (f) => join(KORZEN, f).split('\\').join("/");
    await writeFile(wejscie,
      `export { resolveIncoming } from "${naSlashe("src/core/DamageResolver")}";
       export { Defense } from "${naSlashe("src/core/Defense")}";`);
    const tmpDR = join(KORZEN, "node_modules", ".damageresolver-real.mjs");
    await build({ ...wspolne, entryPoints: [wejscie], outfile: tmpDR, alias: { phaser: stubPhaser } });
    DR = await import(pathToFileURL(tmpDR).href);
    podpiete.push("DamageResolver + Defense (jeden graf)");
  } else fallback.push("łańcuch obrony → dalej transkrypcja");

  if (brak.length) {
    console.error("--nowy: brak modułów Fazy 1A: " + brak.join(", "));
    process.exit(3);
  }
  console.log("--nowy — PRAWDZIWE moduły:");
  for (const x of podpiete) console.log("  ✓ " + x);
  for (const x of fallback) console.log("  … " + x + "  (jeszcze nie wyciągnięty)");
  console.log();

  /**
   * ⚠ **Ciało bojowe celu — od Fazy 1B-b to ono, a nie `displayWidth`.**
   *
   * Oś kapsuły ustawiona NA GRACZA. To jest konwencja tej uprzęży i odpowiada
   * przypadkowi bojowemu: zwierzę nacierające na gracza jest do niego zwrócone.
   * Przypadek boczny (zwierzę przemykające obok) ma inne liczby i jest opisany
   * w `tools/combat_geometry.mjs`, sekcja I.
   */
  const cialo = (e) => {
    const dl = e.hurtLength;
    const gl = e.hurtDepth;
    return {
      x: e.x, y: e.y,
      radius: gl / 2,
      length: dl > gl ? dl : undefined,
      axis: Math.atan2(GRACZ.y - e.y, GRACZ.x - e.x),
    };
  };

  return {
    nazwa: "legacy (transkrypcja GameScene.ts)", // ⚠ NIE zmieniamy: baseline
    // porównuje się po treści, a nagłówek jest jego częścią. Etykieta „co
    // naprawdę biegło" idzie na ekran wyżej, nie do zamrożonego pliku.
    // ⚠ `allowance` przestało istnieć w 1B-b. Zostaje w raporcie jako
    // pół-głębokość hurtboxa, żeby kolumna nie zniknęła bez śladu.
    allowance: (e) => e.hurtDepth / 2,
    wZasiegu: (gracz, e, reach) => HR.withinReach(gracz, cialo(e), reach),
    wLuku: (gracz, e, dirX, dirY, reach, arcDeg) =>
      // ⚠ **Bąbel zwarcia podawany WPROST, bo od 2026-08-23 jest parametrem.**
      // Baseline zamraża geometrię z LEGACY parametrami i taki ma zostać —
      // gałąź porównawcza dowodzi, że silnik się nie zmienił. Zmieniła się
      // WARTOŚĆ, którą wybiera `Szerokie cięcie` (0, brak furtki), i to jest
      // osobna delta, pilnowana przez §O5. Zejście tego na `0` tutaj zlałoby
      // obie rzeczy w jedną i baseline przestałby cokolwiek dowodzić.
      HR.withinArc(gracz, { x: dirX, y: dirY }, cialo(e), reach, arcDeg, CFG.PLAYER.pointBlankRadius),
    wKole: (x, y, e, radius) => HR.withinCircle({ x, y }, cialo(e), radius),
    obrazeniaWroga: legacy.obrazeniaWroga,
    resetObrony: () => (DR ? DR.Defense.reset() : Defense.reset()),
    rzutUniku: (p) => (DR ? DR.Defense.rollDodge(p) : Defense.rollDodge(p)),
    przyjmijCios: DR
      ? (ctx) => {
          const w = DR.resolveIncoming(ctx);
          // Uprząż porównuje `killed`, którego resolver świadomie NIE liczy —
          // HP to stan encji, nie rozstrzygnięcie ciosu (§5.6). Wołający
          // (`Player.takeDamage`) robi dokładnie to samo odjęcie.
          const hp = Math.max(0, ctx.hp - w.mitigated);
          return { outcome: w.outcome, mitigated: w.mitigated, killed: w.outcome !== "immune" && w.outcome !== "dodge" && w.outcome !== "parry" && hp <= 0 };
        }
      : legacy.przyjmijCios.bind(legacy),
  };
}

const IMPL = NOWY ? await zaladujNowa() : legacy;

/* ══════════════════════════════════════════════════════════════════════════
   Stworzenia jako dane widziane przez resolver
   ══════════════════════════════════════════════════════════════════════════ */

const wrog = (id, cfg, ark, x, y) => ({
  id, x, y,
  displayWidth: (ark.w ?? ark.frameWidth) * cfg.scale,
  displayHeight: (ark.h ?? ark.frameHeight) * cfg.scale,
  // Ślad stopy w px ŚWIATA (config trzyma teksturę) — Faza 1B-b.
  hurtLength: cfg.hurt.length * cfg.scale,
  hurtDepth: cfg.hurt.depth * cfg.scale,
  armor: cfg.armor,
});
const A = {
  wilk: [WOLF, ASSETS.wolf], szary: [GREY_WOLF, ASSETS.greyWolf],
  dzik: [BOAR, ASSETS.boar], niedzwiedz: [BEAR, ASSETS.bear],
  krolik: [RABBIT, ASSETS.rabbit], skoczek: [VENOM_SPIDER, ASSETS.venomSpider.face],
};
const nowyWrog = (k, x, y) => wrog(k, A[k][0], A[k][1], x, y);

const GRACZ = { x: 0, y: 0 };
const MIECZ = ITEMS.sword?.melee?.reach ?? 68;
/* ⚠⚠ **Kotwice łuku przestały być BRONIĄ 2026-09-18.**
   Do tej daty ta para wybierała z rosteru „najszerszą" i „najwęższą" broń po
   `melee.arcDeg`. Pole zniknęło — łuk należy dziś do umiejętności — więc
   selektor po cichu spadałby na fallback i **harness testowałby dwie liczby
   wpisane obok niego zamiast czegokolwiek z gry**. Dokładnie ta klasa awarii,
   przed którą ostrzega `HitResolver` przy kształtach `legacy*`.
   ⭐ Kotwicą jest teraz JEDYNY żywy łuk w grze — `ABILITIES.cleave.halfArcDeg`
   — zestawiony z zasięgiem realnej broni szerokiej i wąskiej. Sekcja 2 bada
   geometrię `withinArc`, a ta ma dziś dokładnie jednego konsumenta. */
const LUK_CLEAVE = CFG.ABILITIES.cleave.halfArcDeg;
const TOPOR = { reach: ITEMS.axe?.melee?.reach ?? 70, arcDeg: LUK_CLEAVE };
const SZTYLET = { reach: ITEMS.dagger?.melee?.reach ?? 56, arcDeg: LUK_CLEAVE };

/* ══════════════════════════════════════════════════════════════════════════
   Tabela przypadków
   ══════════════════════════════════════════════════════════════════════════ */

console.log("Broń użyta w przypadkach (musi pochodzić z ITEMS, nie z fallbacku):");
console.log(`  miecz  reach ${MIECZ}`);
console.log(`  szeroka  reach ${TOPOR.reach}  arc ${TOPOR.arcDeg} (łuk umiejętności)`);
console.log(`  wąska    reach ${SZTYLET.reach}  arc ${SZTYLET.arcDeg} (łuk umiejętności)
`);

const wyniki = [];
const zapisz = (grupa, nazwa, dane) => wyniki.push({ grupa, nazwa, ...dane });

// ── 1. Cel pojedynczy: 5 pozycji × 4 gatunki ────────────────────────────
// Pozycje dobrane tak, żeby OTACZAŁY próg — przypadek daleko od granicy nie
// wykryje przesunięcia progu o kilka pikseli, czyli dokładnie tego, czego się
// tu boimy.
for (const gat of ["wilk", "niedzwiedz", "dzik", "skoczek"]) {
  const probny = nowyWrog(gat, 0, 0);
  const prog = MIECZ + legacy.allowance(probny); // dystans, przy którym legacy przełącza się
  const pozycje = [
    ["wschód, tuż w zasięgu", prog - 1, 0],
    ["wschód, tuż poza", prog + 1, 0],
    ["północ, tuż w zasięgu", 0, -(prog - 1)],
    ["południe, tuż poza", 0, prog + 1],
    ["ukośnie 45°", (prog - 1) / Math.SQRT2, (prog - 1) / Math.SQRT2],
  ];
  for (const [opis, x, y] of pozycje) {
    const e = nowyWrog(gat, x, y);
    zapisz("cel", `${gat} — ${opis}`, {
      trafienie: IMPL.wZasiegu(GRACZ, e, MIECZ),
      dystans: +Math.hypot(x, y).toFixed(4),
      allowance: +IMPL.allowance(e).toFixed(4),
    });
  }
}

// ── 2. Łuk: topór (szeroki) i sztylet (wąski), ten sam układ celów ───────
const grupa = [
  ["przed", 40, 0], ["skos-prawo", 30, 30], ["skos-lewo", 30, -30],
  ["bok", 0, 45], ["za plecami", -40, 0], ["daleko przed", 100, 0],
  ["na graczu", 3, 2],
];
for (const [bron, m] of [["szeroka", TOPOR], ["wąska", SZTYLET]]) {
  for (const [opis, x, y] of grupa) {
    const e = nowyWrog("wilk", x, y);
    zapisz("łuk", `${bron} → wilk ${opis}`, {
      trafienie: IMPL.wLuku(GRACZ, e, 1, 0, m.reach, m.arcDeg),
      reach: m.reach, arcDeg: m.arcDeg,
    });
  }
}

// ── 2b. Łuk: kąt DOKŁADNIE równy arcDeg ─────────────────────────────────
// Bez tego uprząż nie rozróżniłaby porównania przez cosinusy od porównania
// przez stopnie — a te dwie formy są równoważne matematycznie, nie bitowo.
// Przypadek na granicy to jedyny, w którym mogą się rozejść.
for (const arc of [22, 38, 45, 50, 60, 90, 100]) {
  const r = 60;
  const rad = arc * (Math.PI / 180);
  for (const [opis, mnoznik] of [["dokładnie na granicy", 1], ["tuż wewnątrz", 0.999], ["tuż na zewnątrz", 1.001]]) {
    const a = rad * mnoznik;
    const e = nowyWrog("wilk", Math.cos(a) * r, Math.sin(a) * r);
    zapisz("łuk-granica", `arc=${arc}° ${opis}`, {
      trafienie: IMPL.wLuku(GRACZ, e, 1, 0, 200, arc),
    });
  }
}

// ── 3. Koło (Wir ostrzy) ────────────────────────────────────────────────
for (const r of [40, 80, 120]) {
  for (const [opis, x, y] of grupa) {
    const e = nowyWrog("krolik", x, y);
    zapisz("koło", `r=${r} → królik ${opis}`, { trafienie: IMPL.wKole(0, 0, e, r) });
  }
}

// ── 4. Pancerz wroga: dzik (leather 22) vs trzy typy + bez typu ─────────
// Jedyny wróg z pancerzem w grze — więc jedyny, na którym ta ścieżka żyje.
for (const typ of ["slash", "pierce", "blunt", null]) {
  for (const amount of [1, 7, 18, 45]) {
    zapisz("pancerz", `dzik ${typ ?? "bez typu"} ${amount}`, {
      po: IMPL.obrazeniaWroga(amount, BOAR.armor, typ ?? undefined),
      skutecznosc: PROT.effectiveness(BOAR.armor, typ ?? undefined),
    });
  }
  zapisz("pancerz", `wilk (bez pancerza) ${typ ?? "bez typu"} 18`, {
    po: IMPL.obrazeniaWroga(18, WOLF.armor, typ ?? undefined),
  });
}

// ── 5. Łańcuch obrony gracza ────────────────────────────────────────────
// ⚠ Każdy przypadek dostaje świeży `Defense.reset()` + świeże ziarno, bo PRD
//   pamięta serię porażek. Bez tego kolejność w tej tabeli zmieniałaby wyniki.
const OD_PRZODU = { x: 0, y: 1 };   // gracz patrzy w dół (kąt 0) → cios z przodu
const Z_BOKU = { x: 1, y: 0 };      // dokładnie 90° — kąt WYCHODZI ROWNO (mierzone)
const Z_TYLU = { x: 0, y: -1 };     // dokładnie 180°
const ZEROWY = { x: 0, y: 0 };      // kontakt „na graczu" → angleBetweenDeg = NaN
/**
 * Wektor do napastnika pod zadanym kątem od zwrotu „down".
 *
 * ⚠⚠ **Nie wolno tym testować granicy DOKŁADNIE.** `kier(60)` wychodzi
 * 59.99999999999999, więc wypadłoby po stronie `front` — i byłby to artefakt
 * WEKTORA TESTOWEGO, nie kodu. Granice sprawdzane są tu marginesami (59/61,
 * 99/101), a sama konwencja ostrego `<` — na kącie, który ma reprezentację
 * dokładną: `Z_BOKU` to równo 90°. To ta sama pułapka zmiennoprzecinkowa,
 * którą opisuje komentarz w `Protection.isFrontal`.
 */
const kier = (deg) => ({ x: Math.sin((deg * Math.PI) / 180), y: Math.cos((deg * Math.PI) / 180) });
const przypadkiObrony = [
  ["czysty cios, bez niczego", { amount: 20, dodgeChance: 0, parryChance: 0, armorReduction: 0, blockReduction: 0, from: OD_PRZODU }],
  ["sam pancerz 30%", { amount: 20, dodgeChance: 0, parryChance: 0, armorReduction: 0.3, blockReduction: 0, from: OD_PRZODU }],
  ["pancerz + blok frontalny", { amount: 20, dodgeChance: 0, parryChance: 0, armorReduction: 0.3, blockReduction: 0.35, from: OD_PRZODU }],
  // ── TRZY STREFY OSŁONY (2026-09-05) ────────────────────────────────────
  // ⚠⚠ Ten przypadek ZMIENIŁ WYNIK i to jest cała zmiana zachowania: 90° było
  //   „tarcza nie działa" (hit 14), jest „blok osłabiony" (block 12).
  ["blok DOKŁADNIE Z BOKU (90° → strefa side, połowa)", { amount: 20, dodgeChance: 0, parryChance: 0, armorReduction: 0.3, blockReduction: 0.35, from: Z_BOKU }],
  ["blok 45° (środek frontu → pełny)", { amount: 20, dodgeChance: 0, parryChance: 0, armorReduction: 0.3, blockReduction: 0.35, from: kier(45) }],
  ["blok 59° (tuż przed granicą pełnego → pełny)", { amount: 20, dodgeChance: 0, parryChance: 0, armorReduction: 0.3, blockReduction: 0.35, from: kier(59) }],
  ["blok 61° (tuż za granicą pełnego → side)", { amount: 20, dodgeChance: 0, parryChance: 0, armorReduction: 0.3, blockReduction: 0.35, from: kier(61) }],
  ["blok 99° (tuż przed granicą tarczy → side)", { amount: 20, dodgeChance: 0, parryChance: 0, armorReduction: 0.3, blockReduction: 0.35, from: kier(99) }],
  ["blok 101° (tuż za granicą tarczy → BRAK)", { amount: 20, dodgeChance: 0, parryChance: 0, armorReduction: 0.3, blockReduction: 0.35, from: kier(101) }],
  ["blok Z TYŁU 180° (BRAK)", { amount: 20, dodgeChance: 0, parryChance: 0, armorReduction: 0.3, blockReduction: 0.35, from: Z_TYLU }],
  ["blok przy wektorze ZEROWYM (NaN → BRAK)", { amount: 20, dodgeChance: 0, parryChance: 0, armorReduction: 0.3, blockReduction: 0.35, from: ZEROWY }],
  // ⚠ Blok boczny na MAŁYCH liczbach — rozróżnia, czy mnożnik strefy nie
  //   wjechał przed zaokrąglenie pancerza: 9 × 0,55 × (1 − 0,5×0,5) = 3,7125 → 4.
  ["blok boczny, małe liczby (9 × 0,55 × 0,75)", { amount: 9, dodgeChance: 0, parryChance: 0, armorReduction: 0.45, blockReduction: 0.5, from: Z_BOKU }],
  // ── PAROWANIE: NIETKNIĘTE przez strefy (punkt 7 zlecenia) ──────────────
  ["parry pewny, 89° (nadal w półkuli → PARUJE)", { amount: 20, dodgeChance: 0, parryChance: 1, armorReduction: 0, blockReduction: 0, from: kier(89) }],
  ["parry pewny, 95° (strefa side, ale POZA półkulą → NIE paruje)", { amount: 20, dodgeChance: 0, parryChance: 1, armorReduction: 0, blockReduction: 0, from: kier(95) }],
  ["cios bez kierunku (from=null)", { amount: 20, dodgeChance: 0, parryChance: 0, armorReduction: 0.3, blockReduction: 0.35, from: null }],
  ["dodge pewny", { amount: 20, dodgeChance: 1, parryChance: 0, armorReduction: 0, blockReduction: 0, from: OD_PRZODU }],
  ["parry pewny, frontalny", { amount: 20, dodgeChance: 0, parryChance: 1, armorReduction: 0, blockReduction: 0, from: OD_PRZODU }],
  ["parry pewny, ale Z BOKU", { amount: 20, dodgeChance: 0, parryChance: 1, armorReduction: 0, blockReduction: 0, from: Z_BOKU }],
  ["nietykalność", { amount: 20, invulnerable: true, dodgeChance: 0, parryChance: 0, armorReduction: 0, blockReduction: 0, from: OD_PRZODU }],
  // ⚠ Rozróżnia KOLEJNOŚĆ i JEDNO zaokrąglenie: 7 × 0,7 × 0,65 = 3,185 → 3.
  //   Podwójne zaokrąglenie dałoby round(round(7×0,7)×0,65) = round(5×0,65) = 3
  //   — tu zgodne, więc dokładany jest przypadek, w którym się rozjeżdża.
  ["małe obrażenia, dwie redukcje", { amount: 7, dodgeChance: 0, parryChance: 0, armorReduction: 0.3, blockReduction: 0.35, from: OD_PRZODU }],
  ["rozjazd zaokrągleń: 9 × 0,55 × 0,5", { amount: 9, dodgeChance: 0, parryChance: 0, armorReduction: 0.45, blockReduction: 0.5, from: OD_PRZODU }],
  ["podłoga na 1 pkt", { amount: 2, dodgeChance: 0, parryChance: 0, armorReduction: 0.9, blockReduction: 0.6, from: OD_PRZODU }],
  ["cios zabójczy", { amount: 40, hp: 12, dodgeChance: 0, parryChance: 0, armorReduction: 0, blockReduction: 0, from: OD_PRZODU }],
  ["nie zabija o 1 pkt", { amount: 11, hp: 12, dodgeChance: 0, parryChance: 0, armorReduction: 0, blockReduction: 0, from: OD_PRZODU }],
];
for (const [nazwa, ctx] of przypadkiObrony) {
  IMPL.resetObrony();
  Math.random = mulberry32(ZIARNO);
  const pelny = { hp: 100, guardDir: 0 /* w dół */, invulnerable: false, blockSideMul: CFG.SHIELD.sideZoneMul, ...ctx };
  zapisz("obrona", nazwa, IMPL.przyjmijCios(pelny));
}

// ── 6. PRD ze STANEM: seria rzutów przy rzadkim p ───────────────────────
// Ten blok istnieje po to, żeby uprząż złapała zgubienie stanu PRD przy
// przenoszeniu łańcucha — pojedynczy rzut tego nie pokaże.
IMPL.resetObrony();
Math.random = mulberry32(ZIARNO);
const seria = [];
for (let i = 0; i < 40; i++) {
  seria.push(IMPL.rzutUniku(0.05) ? 1 : 0);
}
zapisz("prd", "40 rzutów dodge p=0,05 (ziarno stałe)", { seria: seria.join("") });

Math.random = PRAWDZIWY_RANDOM;

/* ══════════════════════════════════════════════════════════════════════════
   KONTROLA KRZYŻOWA — czy transkrypcja geometrii w ogóle jest prawdziwa
   ══════════════════════════════════════════════════════════════════════════
   Transkrypcja może być zła, a baseline wtedy zamraża złą liczbę i uprząż
   świeci na zielono w nieskończoność. Trzy przypadki policzone RĘCZNIE, z
   arytmetyki wypisanej wprost, przeciw tej samej transkrypcji. */

const bledy = [];
function krzyz(nazwa, oczekiwane, faktyczne, tol = 1e-9) {
  const ok = Math.abs(oczekiwane - faktyczne) <= tol;
  console.log(`  ${ok ? "OK  " : "BŁĄD"} ${nazwa.padEnd(52)} ręcznie ${oczekiwane}  kod ${faktyczne}`);
  if (!ok) bledy.push(`kontrola krzyżowa: ${nazwa} — ręcznie ${oczekiwane}, kod ${faktyczne}`);
}
/* ══════════════════════════════════════════════════════════════════════════
   CZYSTOŚĆ RESOLVERÓW — reguła §5.1 audytu, egzekwowana, nie deklarowana
   ══════════════════════════════════════════════════════════════════════════
   „DamageResolver zwraca dane i nie woła niczego z Phasera" to warunek
   testowalności i warunek uruchomienia tego kiedykolwiek na serwerze. Reguła
   zapisana w komentarzu rozpada się przy pierwszym `Sfx.play`, którego nikt nie
   zauważy w review. Ta asercja rozpada się GŁOŚNO. */
/* ══════════════════════════════════════════════════════════════════════════
   KAŻDY GATUNEK MUSI JAWNIE ROZSTRZYGNĄĆ KANAŁ KONTAKTOWY
   ══════════════════════════════════════════════════════════════════════════
   ⚠ Powstało po REGRESJI: skrypt migracyjny Fazy 2 zjadł `Wolf`owi getter
   `contactDamageEnabled`, przez co wilk **znów ranił dotykiem** — czyli wracał
   kanał, którego usunięcie było celem całej przebudowy.

   ⚠ **Audyt metod porównujący z `HEAD` tego NIE ZŁAPAŁ i nie mógł**: getter
   powstał w tej samej, niezacommitowanej sesji, więc w `HEAD` go nie było.
   Porównanie z gitem chroni tylko przed utratą rzeczy JUŻ ZAPISANYCH.

   Stąd asercja niezależna od historii: brak jawnej decyzji = BŁĄD. To ta sama
   zasada, co przy `touchDamageType` — „nie zdecydowaliśmy" i „zapomnieliśmy"
   nie mogą wyglądać w źródle identycznie. */
{
  const gatunki = ["Rabbit", "Wolf", "GreyWolf", "Boar", "Bear", "Spider", "VenomSpider"];
  console.log("KANAŁ KONTAKTOWY — jawna decyzja per gatunek:");
  for (const g of gatunki) {
    const f = join(KORZEN, "src/entities/" + g + ".ts");
    const kod = existsSync(f) ? await readFile(f, "utf8") : "";
    const ma = kod.includes("get contactDamageEnabled(): boolean");
    console.log("  " + (ma ? "OK  " : "BŁĄD") + " " + g);
    if (!ma) {
      bledy.push(
        g + ": brak jawnego `contactDamageEnabled`. Dziedziczy `true` po bazie, " +
        "czyli rani przez nakładanie ciał — a to może być przeoczenie, nie decyzja.",
      );
    }
  }
  console.log("");
}

{
  // ⚠ Zwykłe `includes`, ŻADNYCH wyrażeń regularnych z escape;ami. Pierwsza
  // wersja używała granic słowa i CICHO nie działała: w pliku wylądował znak
  // 0x08 zamiast dwuznaku, więc strażnik szukał BACKSPACE-u i zawsze świecił na
  // zielono. Złapane wyłącznie dlatego, że po dołożeniu asercji sprawdzono, czy
  // POTRAFI paść (reguła `tools/CLAUDE.md`). Substring w zupełności wystarcza.
  const zakazane = [
    ["from " + String.fromCharCode(34) + "phaser", "import phasera"],
    ["from " + String.fromCharCode(39) + "phaser", "import phasera"],
    ["Sfx.", "Sfx (dzwiek)"],
    ["flashHit(", "flashHit (migniecie)"],
    ["GameEvents.", "GameEvents (emisja zdarzen)"],
    ["cameras", "kamera"],
    ["this.scene", "scena"],
    ["../scenes/", "import ze scen"],
    ["../entities/", "import z encji"],
  ];
  // ⚠ **Lista uzupełniona 2026-09-03 (D7).** `Protection` i `Practice` spełniały
  // warunek czystości od początku, ale nie były pilnowane — czyli pierwszy
  // `Sfx.play` albo `GameEvents.emit` wszedłby tam bez słowa. `Combat*` niżej
  // to kontrakty walki (§P1) i podlegają tej samej regule.
  const pliki = [
    "src/core/CombatGeometry.ts",
    "src/core/HitResolver.ts",
    "src/core/DamageResolver.ts",
    "src/core/CombatAction.ts",
    "src/core/CombatCues.ts",
    "src/core/Proficiency.ts",
    "src/core/GameplayEffects.ts",
    "src/core/AbilitySpec.ts",
    "src/core/Protection.ts",
    "src/core/Practice.ts",
    "src/core/combat/Contracts.ts",
    "src/core/combat/DamagePacket.ts",
    "src/core/combat/StatusEffects.ts",
    "src/core/combat/EffectKinds.ts",
    "src/core/combat/PlayerAction.ts",
  ];
  console.log("CZYSTOŚĆ RESOLVERÓW (żadnego Phasera, FX ani encji):");
  for (const f of pliki) {
    const pelna = join(KORZEN, f);
    if (!existsSync(pelna)) continue;
    // Komentarze wycięte — wolno o `Sfx` PISAĆ, nie wolno go WOŁAĆ.
    const kod = (await readFile(pelna, "utf8"))
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
    const trafienia = zakazane.filter(([igla]) => kod.includes(igla)).map(([, opis]) => opis);
    console.log(`  ${trafienia.length ? "BŁĄD" : "OK  "} ${f.padEnd(34)}${trafienia.join(", ")}`);
    for (const t of trafienia) bledy.push(`czystość: ${f} sięga po ${t}`);
  }
  console.log();
}

/* ══════════════════════════════════════════════════════════════════════════
   §K. WYNIK `Player.takeDamage()` NIGDY JAKO BOOLEAN
   ══════════════════════════════════════════════════════════════════════════
   ⚠ Powstało po realnym, cichym zepsuciu. Faza 5A zmieniła zwrot z `boolean`
   na `{ outcome, mitigated, killed }`. `VenomSpider` czytał go dalej jako
   `const killed = ...; if (!killed && …)` — a obiekt jest ZAWSZE prawdziwy,
   więc **jad przestałby działać całkowicie**. `tsc` przeszedł na zielono, bo
   `!obiekt` jest legalnym TypeScriptem. Złapane wyłącznie ręcznym przeglądem.

   Reguła daje się wyegzekwować, bo jest prosta: wynik `player.takeDamage` albo
   jest ODRZUCONY (wywołanie w pozycji instrukcji), albo CZYTANY PO POLU. Nigdy
   w pozycji logicznej.

   ⚠ Zawężone do odbiorcy `player`. `Enemy.takeDamage` to INNA metoda i nadal
   zwraca `boolean` (`GameScene: const killed = e.takeDamage(...)`) — strażnik,
   który nie odróżnia tych dwóch, świeciłby na czerwono na poprawnym kodzie,
   a taki po tygodniu zostaje wyciszony. */
{
  console.log("§K. Wynik `Player.takeDamage()` czytany po polach, nie jako boolean:");
  const pliki = [];
  const chodz = async (kat) => {
    for (const e of await readdir(kat, { withFileTypes: true })) {
      const pe = join(kat, e.name);
      if (e.isDirectory()) await chodz(pe);
      else if (e.name.endsWith(".ts")) pliki.push(pe);
    }
  };
  await chodz(join(KORZEN, "src"));

  let zbadane = 0;
  for (const f of pliki) {
    const kod = (await readFile(f, "utf8"))
      // Komentarze precz — wolno o tej pułapce PISAĆ, nie wolno w nią wpaść.
      .replace(/\/\*[\s\S]*?\*\//g, "")
      // ⚠ Ucinane KAZDE `//`, takze w linii z kodem: zmienna nazywa sie `w`,
      // a polskie komentarze sa pelne slowa „w". Pierwsza wersja dala przez to
      // dwa falszywe alarmy — a straznik swiecacy na czerwono na POPRAWNYM
      // kodzie zostaje po tygodniu wyciszony i przestaje chronic cokolwiek.
      .split("\n").map((l) => l.replace(/([^:"'`])\/\/.*$/, "$1").replace(/^\s*\/\/.*$/, "")).join("\n");
    const linie = kod.split("\n");
    for (let i = 0; i < linie.length; i++) {
      const L = linie[i];
      if (!/(^|[^.\w])(this\.)?player\.takeDamage\s*\(/.test(L)) continue;
      zbadane++;
      const gdzie = `${f.slice(KORZEN.length + 1).replace(/\\/g, "/")}:${i + 1}`;
      const przypisanie = L.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:this\.)?player\.takeDamage\s*\(/);
      if (przypisanie) {
        const zmienna = przypisanie[1];
        // Każde DALSZE wystąpienie tej nazwy musi być odczytem pola.
        // ⚠ Szukane WYLACZNIE do konca bloku, w ktorym zmienna zyje. Skan
        // „do konca pliku" dal falszywy alarm na `Boar.ts`: drugi, calkiem
        // poprawny `const w = …` w innej metodzie wygladal jak uzycie pierwszego.
        let glebokosc = 0;
        let koniec = linie.length;
        for (let q = i; q < linie.length; q++) {
          for (const ch of linie[q]) {
            if (ch === "{") glebokosc++;
            else if (ch === "}") glebokosc--;
          }
          if (glebokosc < 0) { koniec = q; break; }
        }
        const reszta = linie.slice(i + 1, koniec).join("\n");
        // ⚠ Sprawdzana jest JAWNA LISTA niebezpiecznych ksztaltow, a nie
        // regula „kazde uzycie musi miec kropke". Ta druga brzmi mocniej, ale
        // lapala `w` w naglowkach petli i w szablonach — a straznik z falszywymi
        // alarmami jest gorszy niz jego brak, bo uczy ignorowac raport.
        //
        // Lista pokrywa dokladnie to, co zrobil `VenomSpider`: `if (!wynik && …)`.
        const pulapki = [
          [new RegExp(`[!(]\\s*\\b${zmienna}\\b(?!\\s*\\.)`), "w pozycji logicznej (!x, (x)"],
          [new RegExp(`\\b${zmienna}\\s*(?:&&|\\|\\||\\?)`), "jako operand &&/||/?:"],
          [new RegExp(`\\breturn\\s+${zmienna}\\s*;`), "zwracany zamiast pola"],
          [new RegExp(`\\b${zmienna}\\s*[=!]==?\\s*(?:true|false)`), "porownywany z true/false"],
        ];
        const zle = pulapki.filter(([re]) => re.test(reszta)).map(([, opis]) => opis);
        if (zle.length) {
          console.log(`  BLAD ${gdzie.padEnd(36)} \`${zmienna}\` ${zle.join(", ")}`);
          bledy.push(
            `§K ${gdzie}: wynik \`player.takeDamage()\` przypisany do \`${zmienna}\` i uzyty ${zle.join(", ")}. ` +
            `Obiekt jest ZAWSZE prawdziwy — to cicha awaria, nie blad typow.`,
          );
        } else {
          console.log(`  OK   ${gdzie.padEnd(36)} \`${zmienna}\` czytane po polach`);
        }
        continue;
      }
      if (/^\s*(this\.)?player\.takeDamage\s*\(/.test(L)) {
        console.log(`  OK   ${gdzie.padEnd(36)} wynik świadomie odrzucony`);
      } else {
        console.log(`  BŁĄD ${gdzie.padEnd(36)} wynik w pozycji wyrażenia`);
        bledy.push(`§K ${gdzie}: \`player.takeDamage()\` w pozycji wyrażenia (np. w \`if\`). Zwraca OBIEKT — warunek zawsze prawdziwy.`);
      }
    }
  }
  // ⚠ Strażnik, który nic nie znalazł, niczego nie broni: gdyby ktoś zmienił
  // nazwę odbiornika, pętla przeszłaby w ciszy przez zero przypadków.
  if (zbadane === 0) {
    console.log("  BŁĄD (zero wywołań — strażnik stracił cel)");
    bledy.push("§K: nie znaleziono ANI JEDNEGO wywołania `player.takeDamage(` — to znaczy, że strażnik stracił cel, a nie że kod się naprawił.");
  }
  console.log(`  zbadanych wywołań: ${zbadane}\n`);
}

/* ══════════════════════════════════════════════════════════════════════════
   §M. IMPULS — MACIERZE I WŁASNOŚCI PRZEBIEGU
   ══════════════════════════════════════════════════════════════════════════
   ⚠ Faza 5B przesunęła feedback na drugą stronę granicy: impuls rusza
   PRAWDZIWYM ciałem, więc zmienia dystans, a przez dystans warunek następnego
   trafienia. `combat_regresja` nie złapie tego sama z siebie — porównuje
   rozstrzygnięcia czystych funkcji, nie pozycje w czasie. Stąd ta sekcja.

   ⚠ **Wszystko poniżej uruchamia PRAWDZIWY `effectsFor` i PRAWDZIWY
   `impulseProgressAt`** (esbuild, `GameplayEffects.ts` jest Phaser-free), nie
   ich transkrypcję. Ten projekt zmierzył już, że lustra rozjeżdżają się cicho.

   Cztery bloki, każdy broni innej decyzji:

   M1. **Macierz WYNIK → IMPULS.** MISS i DODGE nie mają prawa przesunąć nic;
       BLOCK, PARRY i IMMUNE nie dostają efektów pozycyjnych bez jawnej decyzji
       projektowej (tabela przy `effectsFor`). HIT dostaje — i tylko on.
   M2. **TRZY NIEZALEŻNE własności akcji.** (a) `ownsBody` — czy ciałem
       steruje sama akcja (szarża, wypad, odskok): niezmiennik chroniący przed
       dwoma systemami ruchu w jednej klatce. (b) `attackerRecoil` — czy
       TRAFIENIE kopie napastnikiem w TYŁ: jawna decyzja feedbacku.
       (c) `attackerLunge` — czy ATAK wypycha napastnika w PRZÓD, niezależnie
       od wyniku (gra także przy pudle). **Żadna nie wynika z pozostałych**
       i ta gałąź pilnuje każdej osobno oraz kierunków, w których się wiążą
       (`ownsBody` wyklucza obie pozostałe).
   M3. **Własności przebiegu.** Zaczyna od zera, wraca do zera, szczyt równy
       amplitudzie, poza zakresem zero.
   M4. **Impuls kontra ODRZUT.** Recoil ma zostać sygnałem masy, nie stać się
       globalnym odrzutem, który raz już z tej gry usunięto. */
{
  console.log("§M. Impuls — macierze wynik→impuls i akcja→kopnięcie, własności przebiegu:");
  const tmpGE = join(KORZEN, ".tmp_gameplayeffects.mjs");
  await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/GameplayEffects.ts")], outfile: tmpGE, alias: { phaser: stubPhaser } });
  const GE = await import(pathToFileURL(tmpGE).href);
  await unlink(tmpGE).catch(() => {});
  const { effectsFor, lungeImpulse, impulseProgressAt, impulseOffsetAt, impulseDurationMs } = GE;

  const roz = (over) => ({
    actionId: "t", outcome: "hit", mitigated: 10, tier: "medium", crit: false,
    againstPlayer: true, at: { x: 0, y: 0 }, dir: { x: 1, y: 0 },
    attackerRecoil: "onHit", ...over,
  });

  /* ── M1. WYNIK → IMPULS ────────────────────────────────────────────────
     Oczekiwane wprost, nie wyprowadzone z kodu — inaczej test przyklepywałby
     to, co zastanie. */
  console.log("  M1. wynik → impuls (oczekiwanie wpisane wprost):");
  const OCZEKIWANE = {
    miss:   { cel: false, napastnik: false },
    dodge:  { cel: false, napastnik: false },
    parry:  { cel: false, napastnik: false },
    block:  { cel: false, napastnik: false },
    immune: { cel: false, napastnik: false },
    hit:    { cel: true,  napastnik: true  },
  };
  for (const [outcome, chc] of Object.entries(OCZEKIWANE)) {
    const e = effectsFor(roz({ outcome }));
    const cel = !!e.targetImpulse, nap = !!e.attackerImpulse;
    const ok = cel === chc.cel && nap === chc.napastnik;
    console.log(`    ${ok ? "OK  " : "BŁĄD"} ${outcome.padEnd(7)} cel=${cel ? "TAK" : "—  "} napastnik=${nap ? "TAK" : "—"}`);
    if (!ok) bledy.push(`§M1: "${outcome}" → cel=${cel}/napastnik=${nap}, oczekiwano ${chc.cel}/${chc.napastnik}`);
  }
  // Bez kierunku nie ma osi, wzdłuż której cokolwiek miałoby się ruszyć.
  {
    const e = effectsFor(roz({ dir: null }));
    const cichy = !e.targetImpulse && !e.attackerImpulse;
    console.log(`    ${cichy ? "OK  " : "BŁĄD"} hit bez kierunku (dir=null) → bez impulsu`);
    if (!cichy) bledy.push("§M1: trafienie bez kierunku produkuje impuls — kierunek zostałby zmyślony");
  }

  /* ── M2. DWIE NIEZALEŻNE WŁASNOŚCI AKCJI ───────────────────────────────
     ⚠ **Do 2026-08-23 ta gałąź pilnowała JEDNEJ kolumny i to była wada
     modelu, nie testu.** `ownsBody` znaczyło naraz „akcja rusza ciałem"
     i „akcja nie dostaje kopnięcia od trafienia", a `spider_web` pokazał, że
     to dwie rzeczy: sieciarz ciałem nie steruje (`ownsBody: false`), ale
     trafienie POCISKU — osobne w czasie i przestrzeni — nie ma prawa nim
     szarpnąć. Rozdzielone na dwa pola; ta gałąź sprawdza je OSOBNO, plus
     jeden kierunek, w którym się wiążą.

     Tabela oczekiwań stoi TUTAJ i jest niezależna od configu; rozjazd między
     nią a `AKCJE[*]` jest tym, co ta gałąź ma pokazać. */
  console.log("  M2. akcja → ciało (`ownsBody`) i akcja → kopnięcie (`attackerRecoil`):");
  const AKCJE_OCZEKIWANE = {
    // ciało akcji                       kopnięcie od trafienia    wypad przy ataku
    grey_bite:   { ciało: true,  recoil: "none",  wypad: "none"     }, // enterBackstep zaraz po rozstrzygnięciu
    wolf_lunge:  { ciało: true,  recoil: "none",  wypad: "none"     }, // prędkość co klatkę przez cały active
    boar_charge: { ciało: true,  recoil: "none",  wypad: "none"     }, // j.w.
    boar_gore:   { ciało: false, recoil: "onHit", wypad: "onAttack" }, // kieł w zwarciu, bez lotu
    bear_swipe:  { ciało: false, recoil: "onHit", wypad: "onAttack" }, // zamach w miejscu
    // Bandyci (OI-171) — ten sam kształt co zamach niedźwiedzia: w miejscu, kopie przy trafieniu.
    bandit_club_swing:  { ciało: false, recoil: "onHit", wypad: "onAttack" },
    bandit_axe_swing:   { ciało: false, recoil: "onHit", wypad: "onAttack" },
    bandit_chief_swing: { ciało: false, recoil: "onHit", wypad: "onAttack" },
    rabbit_bite: { ciało: false, recoil: "onHit", wypad: "onAttack" }, // kęs wymaga zatrzymania się
    fox_bite:    { ciało: false, recoil: "onHit", wypad: "onAttack" }, // kęs odwróconego lisa — wzór królika
    deer_ram:    { ciało: false, recoil: "onHit", wypad: "onAttack" }, // cios porożem w miejscu, bez lotu
    venom_bite:  { ciało: false, recoil: "onHit", wypad: "onAttack" }, // skoczek staje, żeby ugryźć
    // ⚠ JEDYNY wiersz, w którym WSZYSTKIE TRZY kolumny się różnią — i cały
    // powód, dla którego są trzy. Ciało stoi (`ownsBody: false`), ale trafia
    // pocisk kilka kafli dalej, więc ani nie kopie, ani nie ma dokąd wypaść.
    spider_web:  { ciało: false, recoil: "none",  wypad: "none"     },
  };
  const wszystkieAkcje = { ...CFG.AKCJE, venom_bite: CFG.VENOM_SPIDER_BITE_ACTION, spider_web: CFG.SPIDER.web };
  const poId = new Map();
  for (const a of Object.values(wszystkieAkcje)) if (a && a.id) poId.set(a.id, a);
  for (const [id, chc] of Object.entries(AKCJE_OCZEKIWANE)) {
    const akcja = poId.get(id);
    if (!akcja) {
      console.log(`    BŁĄD ${id.padEnd(12)} — nie ma takiej akcji w configu`);
      bledy.push(`§M2: tabela wymienia akcję "${id}", której config nie zna`);
      continue;
    }
    // (a) własność CIAŁA — chroni przed dwoma systemami ruchu w jednej klatce.
    const ciałoOk = akcja.ownsBody === chc.ciało;
    // (b) decyzja o KOPNIĘCIU — jawna dana, nie wniosek z (a).
    const recoilOk = akcja.attackerRecoil === chc.recoil;
    // (c) niezmiennik wiążący, JEDNOKIERUNKOWY: akcja sterująca ciałem nie
    //     może dodatkowo kopać. Odwrotnie NIE — patrz `spider_web`.
    const niezmiennikOk = !(akcja.ownsBody && akcja.attackerRecoil !== "none");
    // (d) wykonanie: `effectsFor` ma czytać (b), i tylko (b).
    const kopnie = !!effectsFor(roz({ attackerRecoil: akcja.attackerRecoil })).attackerImpulse;
    const wykonanieOk = kopnie === (chc.recoil === "onHit");
    // (e) TRZECIA własność: `attackerLunge` — czy ATAK wypycha do przodu.
    //     Osobna od (b), bo tamta pyta o TRAFIENIE i o kierunek W TYŁ.
    const lungeOk = akcja.attackerLunge === chc.wypad;
    // (f) niezmiennik, ten sam kierunek co przy (c): akcja prowadząca ciało
    //     nie ma prawa dostać drugiego przesunięcia w tej samej klatce.
    const lungeNiezmiennikOk = !(akcja.ownsBody && akcja.attackerLunge !== "none");
    // (g) wykonanie: `lungeImpulse` ma czytać (e), i tylko (e).
    const wypada = !!lungeImpulse(akcja.attackerLunge, { x: 1, y: 0 });
    const lungeWykonanieOk = wypada === (chc.wypad === "onAttack");
    const ok = ciałoOk && recoilOk && niezmiennikOk && wykonanieOk
      && lungeOk && lungeNiezmiennikOk && lungeWykonanieOk;
    console.log(
      `    ${ok ? "OK  " : "BŁĄD"} ${id.padEnd(12)} ownsBody=${String(akcja.ownsBody).padEnd(5)} ` +
      `attackerRecoil=${String(akcja.attackerRecoil).padEnd(5)} kopnięcie=${(kopnie ? "TAK" : "—").padEnd(3)} ` +
      `attackerLunge=${String(akcja.attackerLunge).padEnd(8)} wypad=${wypada ? "TAK" : "—"}`,
    );
    if (!ciałoOk) bledy.push(`§M2: "${id}" ma ownsBody=${akcja.ownsBody}, a tabela mówi ${chc.ciało}`);
    if (!recoilOk) bledy.push(`§M2: "${id}" ma attackerRecoil="${akcja.attackerRecoil}", a tabela mówi "${chc.recoil}"`);
    if (!niezmiennikOk) bledy.push(`§M2: "${id}" steruje ciałem (ownsBody) i mimo to deklaruje kopnięcie — dwa systemy ruchu w jednej klatce`);
    if (!wykonanieOk) bledy.push(`§M2: "${id}" deklaruje "${akcja.attackerRecoil}", a effectsFor dało kopnięcie=${kopnie}`);
    if (!lungeOk) bledy.push(`§M2: "${id}" ma attackerLunge="${akcja.attackerLunge}", a tabela mówi "${chc.wypad}"`);
    if (!lungeNiezmiennikOk) bledy.push(`§M2: "${id}" steruje ciałem (ownsBody) i mimo to deklaruje wypad — dwa systemy ruchu w jednej klatce`);
    if (!lungeWykonanieOk) bledy.push(`§M2: "${id}" deklaruje wypad "${akcja.attackerLunge}", a lungeImpulse dało ${wypada}`);
  }
  // ⚠ Strażnik, który nie widzi nowej akcji, po cichu jej nie broni.
  const nieznane = [...poId.keys()].filter((id) => !(id in AKCJE_OCZEKIWANE));
  if (nieznane.length) {
    console.log(`    BŁĄD akcje spoza tabeli: ${nieznane.join(", ")}`);
    bledy.push(`§M2: akcje ${nieznane.join(", ")} nie są w tabelce — dopisz je razem z TRZEMA decyzjami (ownsBody, attackerRecoil, attackerLunge)`);
  }
  /* ⚠ **Dowód, że kolumna wypadu też jest osobna, a nie przepisanym recoilem.**
     Dziś `attackerRecoil === "onHit"` wybiera dokładnie ten sam zbiór akcji co
     `attackerLunge === "onAttack"` — i właśnie dlatego ten strażnik istnieje.
     To jest ZBIEŻNOŚĆ OBECNEGO ROSTERU, nie reguła: pierwsza akcja, która
     zechce wypadu bez kopnięcia (albo odwrotnie), rozjedzie te kolumny. Gdyby
     ktoś „uprościł" wypad z powrotem do wyrażenia z recoilu, ta gałąź nie
     zapali się od razu — ale zapali się w chwili, w której taka akcja powstanie,
     bo wtedy tabela i kod powiedzą co innego. Ten sam mechanizm, który złapał
     `spider_web` przy poprzednim rozdzieleniu. */
  const wypadNiezalezny = Object.values(AKCJE_OCZEKIWANE).some((c) => c.wypad === "none" && !c.ciało);
  console.log(`    ${wypadNiezalezny ? "OK  " : "BŁĄD"} wypad nie jest wyprowadzony z ownsBody (jest akcja bez ownsBody, która NIE wypada)`);
  if (!wypadNiezalezny) bledy.push("§M2: każdy wiersz ma wypad === !ownsBody — trzecia kolumna zwinęła się do pierwszej");
  /* ⚠ **Dowód, że to naprawdę DWIE kolumny, a nie jedna przepisana dwa razy.**
     Bez tego ktoś „upraszczający" `spider_web` z powrotem na `"onHit"` dostałby
     tabelę, w której `recoil === !ownsBody` wszędzie — czyli dokładnie stary,
     wadliwy model, tyle że rozpisany w dwóch polach. */
  const rozdzielne = Object.values(AKCJE_OCZEKIWANE).some((c) => !c.ciało && c.recoil === "none");
  console.log(`    ${rozdzielne ? "OK  " : "BŁĄD"} kolumny są niezależne (istnieje akcja bez ownsBody, która NIE kopie)`);
  if (!rozdzielne) bledy.push("§M2: każdy wiersz ma recoil === !ownsBody — model zwinął się z powrotem do jednego bitu");
  /* ⚠ **`effectsFor` nie ma prawa wrócić do wyprowadzania kopnięcia z ciała.**
     Pole `attackerOwnsBody` już nie istnieje w `ActionResolution`; ten
     przypadek pilnuje, że dorzucone z boku nic nie zmienia — czyli że nikt nie
     wskrzesił starego warunku. */
  const zGnatem = !!effectsFor(roz({ attackerRecoil: "onHit", attackerOwnsBody: true })).attackerImpulse;
  const bezGnata = !!effectsFor(roz({ attackerRecoil: "none", attackerOwnsBody: false })).attackerImpulse;
  const niezalezne = zGnatem && !bezGnata;
  console.log(`    ${niezalezne ? "OK  " : "BŁĄD"} decyzja NIE jest wyprowadzana z ownsBody (obce pole nic nie zmienia)`);
  if (!niezalezne) bledy.push("§M2: effectsFor reaguje na ownsBody — kopnięcie znów jest wnioskiem, nie deklaracją");

  /* ── M3. WŁASNOŚCI PRZEBIEGU ───────────────────────────────────────────
     ⚠ To jest miejsce, w którym „wraca do zera" przestało być sprawdzane na
     TEKŚCIE (`yoyo: true`), a zaczęło na LICZBACH. Zmiana wynikła z tego, że
     kształt ruchu wyszedł z tweena do danych — i to jest cały zysk z tamtej
     przeprowadzki: własność da się teraz policzyć, a nie tylko wygrepować. */
  console.log("  M3. własności przebiegu (liczone, nie grepowane):");
  const imp = { dirX: 1, dirY: 0, distancePx: 6, outMs: 65, backMs: 65, curve: "quadOut" };
  const total = impulseDurationMs(imp);
  const probki = [];
  for (let t = 0; t <= total; t += 1) probki.push(impulseProgressAt(imp, t));
  const szczyt = Math.max(...probki);
  const przypadki = [
    ["start w zerze", impulseProgressAt(imp, 0) === 0],
    ["koniec w zerze", impulseProgressAt(imp, total) === 0],
    ["po czasie w zerze", impulseProgressAt(imp, total * 5) === 0],
    ["przed czasem w zerze", impulseProgressAt(imp, -50) === 0],
    ["szczyt = 1 (pełna amplituda)", Math.abs(szczyt - 1) < 1e-9],
    ["przesunięcie w szczycie = distancePx", Math.abs(impulseOffsetAt(imp, imp.outMs).x - imp.distancePx) < 1e-9],
    ["oś Y nietknięta przy dirY=0", probki.every((_, i) => impulseOffsetAt(imp, i).y === 0)],
    ["rośnie na wyjściu", probki.slice(0, imp.outMs).every((v, i, a) => i === 0 || v >= a[i - 1])],
    ["maleje na powrocie", probki.slice(imp.outMs + 1).every((v, i, a) => i === 0 || v <= a[i - 1])],
    // ⚠ **Monotoniczność NIE WYSTARCZA i to jest zmierzone.** Sabotaż
    // „powrót zwraca stałą 1" dawał ciąg 1,1,…,1,0 — niemalejący, więc gałąź
    // wyżej przepuszczała go bez słowa, a impuls stał w szczycie przez cały
    // powrót i znikał skokiem. Dopiero te dwie gałęzie to widzą: powrót ma być
    // STOPNIOWY (środek ściśle w środku) i ma być LUSTREM wyjścia.
    ["powrót stopniowy, bez płaskowyżu", (() => { const m = impulseProgressAt(imp, imp.outMs + imp.backMs / 2); return m > 0.001 && m < 0.999; })()],
    ["powrót jest lustrem wyjścia", [0.25, 0.5, 0.75].every((f) => Math.abs(impulseProgressAt(imp, imp.outMs * f) - impulseProgressAt(imp, imp.outMs + imp.backMs * (1 - f))) < 1e-9)],
  ];
  for (const [opis, ok] of przypadki) {
    console.log(`    ${ok ? "OK  " : "BŁĄD"} ${opis}`);
    if (!ok) bledy.push(`§M3: ${opis} — nie zachodzi`);
  }

  /* ── M4. IMPULS KONTRA ODRZUT ──────────────────────────────────────────
     `COMBAT_FEEDBACK.knockbackDurationMs` mówi wprost, czemu odrzut ma
     wyłącznie obuch: „to, że każda broń miała »trochę«, jest powodem, dla
     którego kategorie przestały cokolwiek znaczyć". Recoil wolno mieć każdemu
     TYLKO dopóki wraca do zera i jest wyraźnie mniejszy. */
  const px = ["light", "medium", "heavy"].map((tier) => effectsFor(roz({ tier })).targetImpulse?.distancePx ?? 0);
  const rosnie = px[0] > 0 && px[0] < px[1] && px[1] < px[2];
  console.log(`  M4. ${rosnie ? "OK  " : "BŁĄD"} szarpnięcie celu rośnie ostro z tierem: ${px.join(" < ")}`);
  if (!rosnie) bledy.push(`§M4: szarpnięcie celu nie rośnie ostro z tierem (${px.join(", ")})`);
  const mlot = Object.values(CFG.ITEMS).find((i) => i.melee && i.melee.knockback > 0);
  const drogaOdrzutu = (mlot.melee.knockback * CFG.COMBAT_FEEDBACK.knockbackDurationMs) / 1000;
  const bezpieczny = Math.max(...px) <= drogaOdrzutu / 4;
  console.log(`      ${bezpieczny ? "OK  " : "BŁĄD"} recoil ${Math.max(...px)} px kontra odrzut ${drogaOdrzutu.toFixed(1)} px (limit ${(drogaOdrzutu / 4).toFixed(1)})`);
  if (!bezpieczny) bledy.push(`§M4: recoil ${Math.max(...px)} px zbliżył się do odrzutu — przestaje być sygnałem, zaczyna być dystansem`);
  // Powrót jest własnością DANYCH, nie wykonania: `backMs` musi istnieć.
  const wracaja = ["light", "medium", "heavy"].every((tier) => {
    const i = effectsFor(roz({ tier })).targetImpulse;
    return !i || i.backMs > 0;
  });
  console.log(`      ${wracaja ? "OK  " : "BŁĄD"} każdy impuls recoilu ma powrót (backMs > 0)`);
  if (!wracaja) bledy.push("§M4: impuls recoilu bez `backMs` — to już nie recoil, tylko odrzut");

  /* ── M5. JEDNO ŹRÓDŁO PREZENTACJI NA WYNIK ─────────────────────────────
     ⚠ Powstało po TRZECIM znalezionym duplikacie tego samego dnia, i ten był
     najgorszy: niedźwiedź, dzik i Szary grały `Sfx.play("impact")`
     **bezwarunkowo, PRZED `takeDamage`** — czyli zanim wynik w ogóle istniał.
     Szarża brzmiała jak trafiona także wtedy, gdy gracz ją uskoczył, co
     wprost przewracało cel Fazy 5A („uskoczyłem" ma się różnić od „on nie
     zaatakował"). Do tego `impact` jest dźwiękiem tiera `heavy`, więc na
     ciężkim trafieniu leciał drugi raz z `cuesFor`.

     Reguła: **dźwięki należące do tierów są własnością `cuesFor`.** Encja
     wolno jej grać własne odgłosy (`growl`, `howl`, `spit`, `swing`), bo one
     opisują ZDARZENIE, nie WYNIK. */
  {
    const tiery = CFG.COMBAT_FEEDBACK.tiers;
    const dzwiekiTierow = new Set(Object.values(tiery).map((t) => t.sfx));
    dzwiekiTierow.add("block"); dzwiekiTierow.add("dodge"); dzwiekiTierow.add("parry");
    const encje = [];
    const chodzE = async (kat) => {
      for (const e of await readdir(kat, { withFileTypes: true })) {
        const pe = join(kat, e.name);
        if (e.isDirectory()) await chodzE(pe);
        else if (e.name.endsWith(".ts")) encje.push(pe);
      }
    };
    await chodzE(join(KORZEN, "src/entities"));
    encje.push(join(KORZEN, "src/scenes/GameScene.ts"));
    let winnych = 0;
    for (const pelna of encje) {
      const wzgl = pelna.slice(KORZEN.length + 1).replace(/\\/g, "/");
      const kod = (await readFile(pelna, "utf8"))
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
      for (const klucz of dzwiekiTierow) {
        const re = new RegExp("Sfx\\.play\\(\\s*['\"]" + klucz + "['\"]");
        if (re.test(kod)) {
          console.log(`  BŁĄD M5. ${wzgl} gra "${klucz}" wprost — to dźwięk WYNIKU, należy do cuesFor`);
          bledy.push(`§M5: ${wzgl} gra dźwięk wyniku "${klucz}" lokalnie, obok cuesFor`);
          winnych++;
        }
      }
    }
    console.log(`  M5. ${winnych === 0 ? "OK  " : "BŁĄD"} żadna encja nie gra dźwięku wyniku wprost (${[...dzwiekiTierow].join(", ")})`);
  }
  console.log();
}

/* ══════════════════════════════════════════════════════════════════════════
   §N. SKOK SKALI NIE MOŻE RUSZYĆ CIAŁEM ANI HURTBOKSEM  (dług 5A.5)
   ══════════════════════════════════════════════════════════════════════════
   ⚠ `docs/systemy/presentation.md` zgłosiło to jako napięcie i zaproponowało
   asercję; 5A jej nie dowiozło. `flashHit` zmienia `scaleX/scaleY`, a **Arcade
   `Body.setSize` MNOŻY przez skalę**. Dopóki nikt nie przelicza wymiarów po
   zmianie skali, skok jest czystą prezentacją. Gdyby przeliczył — trafienia
   zaczęłyby wypadać inaczej na granicy i **nic w liczbach by tego nie
   powiedziało**.

   Dwie niezależne drogi, którymi skala mogłaby wejść w kolizję:

   N1. **HURTBOX** (`Enemy.combatBody`) — gdyby liczył się z ŻYWEJ skali
       (`scaleX`, `displayWidth`), skok zmieniałby go co klatkę wprost.
       Dziś liczy się z `cfg.hurt × cfg.scale`, czyli ze STAŁYCH configu, i to
       jest ta własność, której ta gałąź pilnuje.
   N2. **CIAŁO FIZYCZNE** — wymiarowane raz, przy budowie. Linka napinająca:
       lista miejsc, którym wolno, i czerwone na każdym nowym. */
{
  console.log("§N. Skok skali nie rusza ciałem ani hurtboksem (dług 5A.5):");

  /* ── N1. Hurtbox nie czyta żywej skali ─────────────────────────────── */
  const zrodloEnemy = await readFile(join(KORZEN, "src/entities/Enemy.ts"), "utf8");
  const i0 = zrodloEnemy.indexOf("get combatBody()");
  const cialoGettera = i0 >= 0 ? zrodloEnemy.slice(i0, zrodloEnemy.indexOf("\n  }", i0)) : "";
  const ZYWA_SKALA = [/\bthis\s*\.\s*scaleX\b/, /\bthis\s*\.\s*scaleY\b/, /\bdisplayWidth\b/, /\bdisplayHeight\b/, /\bthis\s*\.\s*scale\b(?!\s*\))/];
  if (!cialoGettera) {
    console.log("  BŁĄD nie znalazłem `get combatBody()` — strażnik przestał cokolwiek widzieć");
    bledy.push("§N1: brak `get combatBody()` w Enemy.ts; igła się zestarzała");
  } else {
    const trafienia = ZYWA_SKALA.filter((r) => r.test(cialoGettera));
    const czysty = trafienia.length === 0;
    console.log(`  ${czysty ? "OK  " : "BŁĄD"} N1. hurtbox (\`combatBody\`) nie czyta żywej skali — liczy z cfg.hurt × cfg.scale`);
    if (!czysty) bledy.push("§N1: `combatBody` czyta żywą skalę, więc skok `flashHit` rusza hurtboksem");
  }

  /* ── N2. Wymiarowanie ciała tylko przy budowie ──────────────────────── */
  // ⚠ **Wyrażenia, nie substringi — bo `body?.setSize(` omijało substring.**
  // Złapane sabotażem przy przyjmowaniu tej sekcji: wstrzyknięte
  // `(target as any).body?.setSize(10, 10)` w `HitFlash.ts` przeszło przez
  // strażnika bez słowa. Opcjonalny łańcuch jest w tym kodzie normą.
  const IGLY = [/body\s*\??\.\s*setSize\(/, /setBodySize\(/, /refreshBody\(/];
  // ⚠ **Lista SKURCZYŁA SIĘ 2026-08-28 i to jest wzmocnienie, nie rozluźnienie.**
  // `Enemy.ts` i `Player.ts` zeszły z niej, bo przestały wymiarować ciało same —
  // obie wołają teraz `applyBody` z `src/core/movement/BodySpec.ts`, czyli
  // JEDYNE miejsce, w którym ciało stworzenia w ogóle powstaje. Powód tej zmiany
  // jest zmierzony: `Critter` nie wymiarował ciała WCALE i nikt tego nie
  // zauważył, bo brak wywołania nie zapala żadnego strażnika — sarna chodziła
  // z ciałem wielkości klatki arkusza (79×57 px), dopóki świat nie miał ścian.
  // Reszta listy to rekwizyty ze statycznym ciałem, każdy wymiaruje raz.
  const DOZWOLONE = new Set([
    "src/core/movement/BodySpec.ts",
    "src/entities/Campfire.ts",
    "src/entities/Merchant.ts",
    "src/entities/Well.ts",
    "src/world/MapBuilder.ts",
  ]);
  const ZAKAZANE_WPROST = ["src/core/HitFlash.ts", "src/core/CombatImpulse.ts"];

  const pliki = [];
  const chodzN = async (kat) => {
    for (const e of await readdir(kat, { withFileTypes: true })) {
      const pe = join(kat, e.name);
      if (e.isDirectory()) await chodzN(pe);
      else if (e.name.endsWith(".ts")) pliki.push(pe);
    }
  };
  await chodzN(join(KORZEN, "src"));

  let znalezione = 0;
  for (const pelna of pliki) {
    const wzgl = pelna.slice(KORZEN.length + 1).replace(/\\/g, "/");
    const kod = (await readFile(pelna, "utf8"))
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
    if (!IGLY.some((i) => i.test(kod))) continue;
    znalezione++;
    if (ZAKAZANE_WPROST.includes(wzgl)) {
      console.log(`  BŁĄD N2. ${wzgl} — właściciel skali/pozycji NIE MA PRAWA wymiarować ciała`);
      bledy.push(`§N2: ${wzgl} wymiaruje ciało, a jest właścicielem skali/pozycji`);
    } else if (!DOZWOLONE.has(wzgl)) {
      console.log(`  BŁĄD N2. ${wzgl} — nowe miejsce wymiarujące ciało, nie ma go na liście`);
      bledy.push(`§N2: ${wzgl} wymiaruje ciało; jeśli robi to RAZ przy budowie, dopisz go do listy w §N`);
    } else {
      console.log(`  OK   N2. ${wzgl}`);
    }
  }
  if (znalezione === 0) {
    console.log("  BŁĄD N2. zero wymiarowań ciała — strażnik przestał cokolwiek widzieć");
    bledy.push("§N2: zero wywołań wymiarujących ciało — igły się zestarzały, sekcja jest dekoracją");
  }
  console.log();
}

/* ══════════════════════════════════════════════════════════════════════════
   §L. PRZEDNIA PÓŁKULA — JEDNA LICZBA I JEDEN PREDYKAT
   ══════════════════════════════════════════════════════════════════════════
   Od 2026-08-23 bramka zwrotu autoataku (`GameScene.canStrikeFacing`) oraz Blok
   i Parowanie dzielą stałą `FRONT_ARC_DEG` ORAZ predykat `Protection.isFrontal`.

   ⚠ Sama wspólna stała nie wystarcza: nic nie przeszkodzi wpisać z powrotem
   `90` literałem „dla czytelności", a rozjechanie tych dwóch liczb daje regułę
   prawdziwą, powtarzalną i niewytłumaczalną — „widzę go, mogę go trafić, ale
   nie mogę zablokować". Ta sama klasa błędu, którą projekt złapał przy
   `attackArcDeg`. Konwencja granicy (`<` vs `<=`) jest przy tym równie nośna
   jak sama liczba, więc pilnowany jest też WSPÓLNY PREDYKAT, nie tylko stała. */
{
  console.log("§L. Przednia półkula — wspólna stała i wspólny predykat:");
  const par = [
    ["SHIELD.blockArcDeg", CFG.SHIELD.blockArcDeg],
    ["PLAYER.attackFrontArcDeg", CFG.PLAYER.attackFrontArcDeg],
    ["FRONT_ARC_DEG", CFG.FRONT_ARC_DEG],
  ];
  const zgodne = CFG.FRONT_ARC_DEG !== undefined && new Set(par.map(([, v]) => v)).size === 1;
  console.log(`  ${zgodne ? "OK  " : "BŁĄD"} ${par.map(([n, v]) => `${n}=${v}`).join("  ")}`);
  if (!zgodne) bledy.push(`§L: łuk ataku i łuk bloku rozjechane — ${par.map(([n, v]) => `${n}=${v}`).join(", ")}`);

  const gs = await readFile(join(KORZEN, "src/scenes/GameScene.ts"), "utf8");
  const ciało = gs.slice(gs.indexOf("private canStrikeFacing"), gs.indexOf("private targetInReach"));
  const wspolny = ciało.length > 0 && ciało.includes("isFrontal(");
  console.log(`  ${wspolny ? "OK  " : "BŁĄD"} canStrikeFacing woła wspólny predykat isFrontal`);
  if (!wspolny) bledy.push("§L: `canStrikeFacing` nie woła `isFrontal` — powstała druga kopia konwencji granicy łuku.");

  // ⚠ Zawór awaryjny NIE MOŻE być rzędu `pointBlankRadius` (28 px) — to
  // odtworzyłoby atak 360° w zwarciu, czyli dokładnie to, co bramka usuwa.
  // Zwarcie jest w tej walce stanem NORMALNYM, nie awarią.
  const zawor = CFG.PLAYER.attackFacingBypassGapPx;
  const okZawor = typeof zawor === "number" && zawor < 4 && zawor !== CFG.PLAYER.pointBlankRadius;
  console.log(`  ${okZawor ? "OK  " : "BŁĄD"} zawór bramki zwrotu = ${zawor} px (pointBlankRadius = ${CFG.PLAYER.pointBlankRadius})`);
  if (!okZawor) {
    bledy.push(
      `§L: \`attackFacingBypassGapPx\` = ${zawor}. Zawór ma łapać wyłącznie NACHODZĄCE ciała; ` +
      `wartość rzędu \`pointBlankRadius\` (${CFG.PLAYER.pointBlankRadius}) odtwarza atak 360° w zwarciu.`,
    );
  }
  console.log();
}

/* ⚠ `AbilitySpec` + `HitResolver` ładowane RAZ dla §O i §P — obie sekcje
   badają ten sam wspólny system celowania, więc muszą patrzeć na ten sam
   moduł. Osobne budowanie per sekcja dawałoby dwa grafy modułów i pytanie
   „czy to na pewno ten sam kod" wracałoby przy każdej różnicy. */
const tmpAS = join(KORZEN, ".tmp_abilityspec.mjs");
const tmpHR2 = join(KORZEN, ".tmp_hitresolver_o.mjs");
await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/AbilitySpec.ts")], outfile: tmpAS, alias: { phaser: stubPhaser } });
// ⚠ Osobno HitResolver: §O5 porównuje NOWY kształt (bez furtki) ze STARYM
// (z furtką) na tej samej funkcji, więc musi mieć ją pod ręką wprost.
await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/HitResolver.ts")], outfile: tmpHR2, alias: { phaser: stubPhaser } });
const AS = await import(pathToFileURL(tmpAS).href);
const HR = await import(pathToFileURL(tmpHR2).href);
await Promise.all([tmpAS, tmpHR2].map((f) => unlink(f).catch(() => {})));

/**
 * Ciało jednej metody klasy — od jej nagłówka do nagłówka NASTĘPNEJ.
 *
 * ⚠ **Powstało po cichym rozpadzie kotwicy w §S6 (znalezione 2026-08-26).**
 * Tamten wycinek kończył się na `private damageCurrentTarget`, a taka metoda
 * już nie istnieje — `indexOf` zwracał `-1`, więc `slice(a, -1)` brało **całą
 * resztę pliku** zamiast jednej metody. Test dalej świecił na zielono, tylko
 * przestał cokolwiek ograniczać: dowolny pasujący ciąg gdziekolwiek niżej
 * w `GameScene.ts` zaliczał asercję „to stoi w `resolvePendingSwing`".
 *
 * ⚠ Zwraca `""`, gdy metody nie ma — **i wołający MUSI to sprawdzić**.
 * Pusty wycinek sprawia, że każdy test „czegoś tu NIE MA" przechodzi
 * bezpodstawnie, a to jest dokładnie ta klasa pomyłki, której ten plik
 * pilnuje u innych.
 */
/**
 * Ciało jednej gałęzi `switch` — od jej `case` do **następnego `case` albo do
 * końca `switch`a**.
 *
 * ⚠ **Nie używaj tu okna o stałym rozmiarze.** Gałąź umiejętności w tym
 * projekcie ma więcej komentarza niż kodu, więc `slice(i, i + N)` mierzy
 * długość uzasadnień, a nie zachowanie — i tnie gałąź w losowym miejscu.
 * Złapane 2026-08-26: §T7 świecił na czerwono na poprawnym kodzie.
 *
 * ⚠ **Dwie zmiany z P3.4 i obie zamykają CICHE PRZEJŚCIE NA ZIELONO** — czyli
 * tryb awarii gorszy od fałszywej czerwieni, bo niewidoczny w raporcie:
 *
 *  1. **Granicą jest też zamknięcie `switch`a** (`\n    }`), nie tylko następny
 *     `case`. Gałąź OSTATNIA nie ma po sobie żadnego `case`, więc poprzednia
 *     wersja zwracała jej **cały ogon pliku**: asercja „gałąź deleguje"
 *     znajdowała wtedy `commitPlayerAction` w cudzej metodzie sto linii niżej
 *     i przechodziła, mimo że gałąź nie delegowała. Zmierzone na scenariuszu
 *     przestawienia `case`-ów: stare okno 233 znaki i ZIELONE mimo regresu,
 *     nowe 101 znaków i CZERWONE.
 *  2. **Brak obu granic zwraca `""`, a nie resztę pliku.** „Nie umiem ograniczyć
 *     tej gałęzi" znaczy „nie mam nic do powiedzenia" — a wtedy wołający ma
 *     zaświecić na czerwono (`if (!ciało) …`), zamiast oceniać przypadkowy
 *     fragment pliku.
 *
 * ⚠ Wcięcia są ZNACZĄCE i tak ma zostać: `case` stoi na 6 spacjach, `switch`
 * zamyka się na 4. Wewnątrz gałęzi (≥ 8 spacji) żaden z tych wzorców nie
 * wystąpi, więc granica nie da się przesunąć zagnieżdżonym literałem.
 */
function wycinekGalezi(src, naglowek) {
  const a = src.indexOf(naglowek);
  if (a === -1) return "";
  const dalej = src.slice(a + naglowek.length);
  const b = dalej.search(/\n      case "|\n    \}/);
  return b === -1 ? "" : dalej.slice(0, b);
}

/** Kod bez komentarzy — strażnik tekstowy ma mierzyć KOD, nie dokumentację.
 *  Ta sama reguła i ten sam powód co przy §V (patrz `bezKomentarzy` tamże). */
function bezKomentarzyP(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n");
}

function cialoMetody(src, naglowek) {
  const a = src.indexOf(naglowek);
  if (a === -1) return "";
  const dalej = src.slice(a + naglowek.length);
  const b = dalej.search(/\n  (private|protected|public|get|set|async|\/\*\*)/);
  return b === -1 ? dalej : dalej.slice(0, b);
}

/* ══════════════════════════════════════════════════════════════════════════
   §O. CELOWANIE KIERUNKOWE — `Szerokie cięcie` (prototyp 2026-08-23)
   ══════════════════════════════════════════════════════════════════════════
   Sześć własności, każda broniąca innej decyzji z zamówienia:

   O1. **Skład specyfikacji.** Kształt bierze się z broni; mnożniki ról MNOŻĄ
       się przez mnożnik umiejętności, nie zastępują go (cel główny ma zostać
       na dzisiejszych 0,9).
   O2. **Podgląd == resolver.** Selekcja nie ma prawa zwrócić celu, którego
       `coversTarget` nie pokrywa. To jest bramka na „drugi stożek UI".
   O3. **Cel główny = najmniejsze odchylenie od osi**, remis → mniejszy
       prześwit.
   O4. **Twardy sufit i DETERMINIZM.** Ta sama scena podana w innej kolejności
       musi dać tę samą trójkę — żadnej kolejności encji jako priorytetu.
   O5. **Brak trafień poza narysowanym łukiem.** Delta wobec stanu sprzed
       prototypu: furtka zwarcia (`pointBlankRadius`) była w tym miejscu i
       pozwalała trafić zza pleców. Ten blok pokazuje OBIE wartości obok
       siebie, żeby zmiana zachowania była widoczna, a nie domniemana.
   O6. **Kierunek jest CIĄGŁY.** Wektor po skosie musi dawać inny wynik niż
       ten sam wektor zaokrąglony do czterech stron — inaczej „celowanie 360°"
       byłoby kłamstwem zaokrąglonym do 90°. */
{
  console.log("§O. Celowanie kierunkowe — `Szerokie cięcie`:");
  const { resolveAbility, selectTargets, coversTarget, multiplierFor, isAimable } = AS;

  // Cel testowy: okrąg o promieniu 10 w punkcie (x, y). Świadomie NIE kapsuła —
  // ta gałąź bada wybór celów i kąty, a nie ślad stopy (od tego jest §A–§C).
  const cel = (id, x, y, r = 10) => ({ ref: id, body: { x, y, radius: r }, sprite: { x, y } });
  const O = { x: 0, y: 0 };
  // ⚠ Dwa punkty odniesienia napastnika — łuk mierzy w `body`, wskazanie celu
  // w `sprite` (patrz `AimFrame`). W tych testach oba leżą w tym samym miejscu,
  // bo badamy geometrię, a nie 19-pikselowy offset gracza.
  const FRAME = { body: O, sprite: O };
  const PRAWO = { x: 1, y: 0 };
  const strike = { reach: 68 };
  const spec = resolveAbility("cleave", strike);

  /* ── O1. SKŁAD SPECYFIKACJI ─────────────────────────────────────────── */
  const c = CFG.ABILITIES.cleave;
  const o1 = [
    ["kształt to broń (reach)", spec.shape.reachPx === strike.reach],
    // ⚠⚠ **Dwa źródła, nie jedno — i to jest cała treść migracji 2026-09-18.**
    //   Zasięg dalej bierze się z BRONI (długość oręża to jej cecha), kąt
    //   z UMIEJĘTNOŚCI (rozmach ramienia nie jest cechą konstrukcji).
    ["kształt to UMIEJĘTNOŚĆ (pół-łuk)", spec.shape.halfArcDeg === c.halfArcDeg],
    // ⛔ Zamek na powrót: gdyby ktoś odtworzył `arcDeg` na broni i wpiął go tu
    //   z powrotem, ta linijka nie zaświeci — więc pyta wprost o to, czego
    //   NIE MA. `AbilityStrikeInput` ma jedno pole i ma je zachować.
    ["⛔ wejście umiejętności nie niesie łuku broni", !("arcDeg" in strike)],
    ["brak furtki zwarcia", spec.shape.pointBlankBypassPx === 0],
    ["sufit celów z configu", spec.maxTargets === c.maxTargets],
    // ⚠ Liczby WPISANE WPROST, nie wyliczone z configu tym samym wzorem co kod
    // — inaczej test przyklepałby dowolną zmianę składu zamiast ją pokazać.
    ["cel główny = 0,9 (dzisiejsza wartość cleave)", Math.abs(multiplierFor(spec, "primary") - 0.9) < 1e-9],
    ["reszta = 0,675 (0,9 × 0,75)", Math.abs(multiplierFor(spec, "secondary") - 0.675) < 1e-9],
    ["`cleave` jest celowana", isAimable("cleave") === true],
    ["`whirlwind` NIE jest celowana", isAimable("whirlwind") === false],
    // ⚠ **Strefa anulowania MUSI być szersza od deadzone.** Gdyby była węższa,
    // powstałby pierścień, w którym gest jest już celowaniem (`dragged`), ale
    // powrót na przycisk niczego nie przerywa — czyli ✕ świeciłby, nie działając.
    // Równość też nie wystarcza: rozpoczęcie ma być trudniejsze niż przerwanie.
    [
      "strefa anulowania szersza niż deadzone",
      CFG.ABILITY_AIM.cancelRadiusPx > CFG.ABILITY_AIM.deadzonePx,
    ],
  ];
  for (const [opis, ok] of o1) {
    console.log(`  ${ok ? "OK  " : "BŁĄD"} O1. ${opis}`);
    if (!ok) bledy.push(`§O1: ${opis} — nie zachodzi`);
  }

  /* ── O2. PODGLĄD CZYTA TEN SAM KSZTAŁT, CO CIOS ─────────────────────── */
  {
    const kandydaci = [
      cel("przod", 40, 0), cel("skos", 30, 25), cel("bok", 5, 45),
      cel("tyl", -40, 0), cel("daleko", 200, 0),
    ];
    const wybrani = selectTargets(spec, FRAME, PRAWO, kandydaci);
    // Każdy wybrany MUSI być pokryty kształtem — to jest jedyna gwarancja,
    // że znacznik na ekranie oznacza cel, który naprawdę oberwie.
    const spojne = wybrani.every((w) => {
      const k = kandydaci.find((x) => x.ref === w.ref);
      return coversTarget(spec.shape, FRAME, PRAWO, k);
    });
    // I odwrotnie: nikt pokryty nie może zniknąć inaczej niż przez sufit.
    const pokryci = kandydaci.filter((k) => coversTarget(spec.shape, FRAME, PRAWO, k));
    const zgodnaLiczba = wybrani.length === Math.min(pokryci.length, spec.maxTargets);
    console.log(`  ${spojne ? "OK  " : "BŁĄD"} O2. każdy wybrany jest w kształcie (${wybrani.map((w) => w.ref).join(", ") || "—"})`);
    console.log(`  ${zgodnaLiczba ? "OK  " : "BŁĄD"} O2. liczba wybranych = min(pokryci ${pokryci.length}, sufit ${spec.maxTargets})`);
    if (!spojne) bledy.push("§O2: selekcja zwróciła cel spoza kształtu — podgląd pokazałby kogoś, kto nie oberwie");
    if (!zgodnaLiczba) bledy.push(`§O2: wybrano ${wybrani.length}, a pokrytych jest ${pokryci.length} przy suficie ${spec.maxTargets}`);
  }

  /* ── O3. CEL GŁÓWNY = NAJMNIEJSZE ODCHYLENIE OD OSI ─────────────────── */
  {
    // `bliski_skos` jest BLIŻEJ, ale bardziej z boku; `dalszy_wprost` leży na
    // osi. Wygrać ma oś, nie dystans — inaczej umiejętność premiowałaby
    // stanie w tłumie zamiast celowania.
    const wybrani = selectTargets(spec, FRAME, PRAWO, [
      cel("bliski_skos", 18, 16), cel("dalszy_wprost", 45, 0),
    ]);
    const ok = wybrani[0]?.ref === "dalszy_wprost" && wybrani[0]?.role === "primary";
    console.log(`  ${ok ? "OK  " : "BŁĄD"} O3. oś bije dystans przy wyborze celu głównego (główny: ${wybrani[0]?.ref})`);
    if (!ok) bledy.push(`§O3: celem głównym został "${wybrani[0]?.ref}", a powinien "dalszy_wprost"`);

    // Remis na osi → rozstrzyga prześwit.
    const remis = selectTargets(spec, FRAME, PRAWO, [cel("daleki", 50, 0), cel("bliski", 25, 0)]);
    const okRemis = remis[0]?.ref === "bliski";
    console.log(`  ${okRemis ? "OK  " : "BŁĄD"} O3. remis na osi rozstrzyga prześwit (główny: ${remis[0]?.ref})`);
    if (!okRemis) bledy.push(`§O3: przy równym odchyleniu głównym został "${remis[0]?.ref}", a powinien bliższy`);

    // Mnożniki ról trafiają tam, gdzie role.
    const role = selectTargets(spec, FRAME, PRAWO, [cel("a", 30, 0), cel("b", 30, 14)]);
    const okRole =
      role[0]?.role === "primary" && role[1]?.role === "secondary" &&
      multiplierFor(spec, role[0].role) === 0.9 && multiplierFor(spec, role[1].role) === 0.675;
    console.log(`  ${okRole ? "OK  " : "BŁĄD"} O3. role → mnożniki: ${role[0]?.role} ${multiplierFor(spec, role[0]?.role ?? "primary")}, ${role[1]?.role} ${multiplierFor(spec, role[1]?.role ?? "secondary")}`);
    if (!okRole) bledy.push("§O3: mnożniki ról nie trafiły do właściwych celów");
  }

  /* ── O4. SUFIT I DETERMINIZM ────────────────────────────────────────── */
  {
    const piatka = [
      cel("t0", 30, 0), cel("t1", 30, 8), cel("t2", 30, 16),
      cel("t3", 30, 24), cel("t4", 32, 30),
    ];
    const a = selectTargets(spec, FRAME, PRAWO, piatka).map((w) => w.ref);
    const okSufit = a.length === spec.maxTargets;
    console.log(`  ${okSufit ? "OK  " : "BŁĄD"} O4. sufit ${spec.maxTargets}: z pięciu kandydatów wybrano ${a.length} (${a.join(", ")})`);
    if (!okSufit) bledy.push(`§O4: sufit nie zadziałał — wybrano ${a.length} zamiast ${spec.maxTargets}`);

    // ⚠ **Kolejność wejścia NIE MOŻE mieć znaczenia.** Odwrócenie listy
    // odwzorowuje inną kolejność odradzania się wrogów w scenie.
    const b = selectTargets(spec, FRAME, PRAWO, [...piatka].reverse()).map((w) => w.ref);
    const okDet = a.join(",") === b.join(",");
    console.log(`  ${okDet ? "OK  " : "BŁĄD"} O4. odwrócona kolejność wejścia daje ten sam wynik (${b.join(", ")})`);
    if (!okDet) bledy.push(`§O4: selekcja zależy od kolejności wejścia: [${a}] vs [${b}]`);

    // ⚠ **IDEALNY remis**: para odbita względem osi celowania ma identyczne
    // odchylenie (39,8°) I identyczny prześwit, więc dwa pierwsze klucze
    // sortowania milczą. Rozstrzygnąć musi trzeci (x), a przy równym x —
    // czwarty (y). Bez nich decydowałaby stabilność `sort`, czyli kolejność
    // odradzania się wrogów: ten sam układ dawałby raz jeden wynik, raz drugi.
    const lustro = [cel("gora", 30, -25), cel("dol", 30, 25)];
    const l1 = selectTargets(spec, FRAME, PRAWO, lustro).map((w) => w.ref).join(",");
    const l2 = selectTargets(spec, FRAME, PRAWO, [...lustro].reverse()).map((w) => w.ref).join(",");
    // Oczekiwanie WPISANE WPROST: mniejszy y wygrywa remis.
    const okLustro = l1 === l2 && l1 === "gora,dol";
    console.log(`  ${okLustro ? "OK  " : "BŁĄD"} O4. idealny remis rozstrzyga się tak samo w obie strony (${l1} / ${l2})`);
    if (!okLustro) bledy.push(`§O4: idealny remis zależy od kolejności albo złamał regułę y: [${l1}] vs [${l2}], oczekiwano "gora,dol"`);
  }

  /* ── O5. ⚠ DELTA: KONIEC TRAFIEŃ POZA NARYSOWANYM ŁUKIEM ────────────── */
  {
    // Przeciwnik DOKŁADNIE ZA PLECAMI, w zwarciu: prześwit poniżej dawnej
    // furtki (28 px), kąt 180° — czyli poza każdym rysowanym klinem.
    const zaPlecami = cel("za_plecami", -20, 0); // prześwit = 20 − 10 = 10 px
    const teraz = coversTarget(spec.shape, FRAME, PRAWO, zaPlecami);
    const dawniej = HR.withinArc(O, PRAWO, zaPlecami.body, strike.reach, spec.shape.halfArcDeg, CFG.PLAYER.pointBlankRadius);
    const ok = teraz === false && dawniej === true;
    console.log(`  ${ok ? "OK  " : "BŁĄD"} O5. wróg w zwarciu ZA PLECAMI: dziś ${teraz ? "TRAFIONY" : "pudło"}, przed prototypem ${dawniej ? "TRAFIONY" : "pudło"}`);
    if (teraz) bledy.push("§O5: cios ląduje poza narysowanym łukiem — podgląd kłamie");
    if (!dawniej) bledy.push("§O5: przypadek kontrolny nie odtwarza dawnej furtki — ta gałąź przestała mierzyć deltę");

    // Kontrola siły testu: ten sam wróg PRZED graczem ma dalej obrywać,
    // inaczej „brak trafień poza łukiem" byłoby spełnione przez zepsucie łuku.
    const przed = coversTarget(spec.shape, FRAME, PRAWO, cel("przed", 20, 0));
    console.log(`  ${przed ? "OK  " : "BŁĄD"} O5. ten sam wróg PRZED graczem dalej obrywa`);
    if (!przed) bledy.push("§O5: zwarcie od frontu przestało trafiać — usunięto za dużo");

    // Cel dokładnie NA graczu nie ma osi; wierzchołek klina leży w tym punkcie,
    // więc ma trafiać — i nie może wywrócić sortowania na `NaN`.
    const naGraczu = selectTargets(spec, FRAME, PRAWO, [cel("na_mnie", 0, 0), cel("przod", 30, 0)]);
    const okNaN = naGraczu.length === 2 && naGraczu.every((w) => Number.isFinite(w.deviationDeg));
    console.log(`  ${okNaN ? "OK  " : "BŁĄD"} O5. cel stojący NA graczu: trafiony, odchylenie liczbowe (nie NaN)`);
    if (!okNaN) bledy.push("§O5: cel na graczu daje NaN w odchyleniu — sortowanie selekcji jest niestabilne");
  }

  /* ── O6. KIERUNEK JEST CIĄGŁY, NIE ZAOKRĄGLONY DO CZTERECH STRON ────── */
  {
    // ⚠ Cel leży ~110° od osi „prawo", czyli **poza** pół-łukiem 90°, ale tylko
    // ~65° od przekątnej — czyli wewnątrz łuku wycelowanego po skosie.
    // Dobrane celowo: punkt mieszczący się w OBU łukach byłby BEZUŻYTECZNY,
    // bo test przechodziłby, nic nie mierząc (pierwsza wersja tej gałęzi tak
    // właśnie wyglądała i świeciła na zielono).
    // ⚠⚠ **Przeliczony 2026-09-18.** Stary punkt (13, 48) leżał ~75° od osi —
    //   poza dawnym łukiem broni (55°), ale WEWNĄTRZ dzisiejszego łuku
    //   umiejętności (90°), więc po migracji przestawał cokolwiek rozróżniać.
    //   ⛔ Ten punkt trzeba przeliczyć przy KAŻDEJ zmianie `cleave.halfArcDeg`.
    const skos = cel("skos", -17, 47, 8);
    const wSkos = coversTarget(spec.shape, FRAME, { x: Math.SQRT1_2, y: Math.SQRT1_2 }, skos);
    const wOs = coversTarget(spec.shape, FRAME, PRAWO, skos);
    const ok = wSkos === true && wOs === false;
    console.log(`  ${ok ? "OK  " : "BŁĄD"} O6. cel po przekątnej: celowanie analogowe ${wSkos ? "trafia" : "pudłuje"}, oś 4-kier. ${wOs ? "trafia" : "pudłuje"}`);
    if (!ok) {
      bledy.push(
        `§O6: kierunek nie jest ciągły — analogowy=${wSkos}, osiowy=${wOs}. ` +
        `Gdyby geometria dostawała zwrot sprite'a, celowanie 360° byłoby zaokrąglone do 90°.`,
      );
    }
  }
  console.log();
}

/* ══════════════════════════════════════════════════════════════════════════
   §P. WSKAZANIE CELU — `Szarża` (prototyp 2026-08-23)
   ══════════════════════════════════════════════════════════════════════════
   Drugi archetyp celowania: aim wybiera PRZECIWNIKA, nie kierunek kształtu.
   Ten sam `AimSession`, ta sama `selectTargets` — inny `shape.kind`.

   P1. **Kształt z configu Szarży**: pasmo i sektor akwizycji jako dane.
   P2. **Sektor akwizycji odsiewa** — także wtedy, gdy odsiewany jest jedynym
       przeciwnikiem na mapie. To jest cała różnica między „wskaż cel"
       a „weź kogokolwiek".
   P3. **Pasmo działa w OBIE strony** (za blisko i za daleko) i mierzy
       dystansem środków, nie prześwitem.
   P4. **Determinizm** przy kilku kandydatach: oś, potem dystans, potem x/y.
   P5. **Podgląd == commit**, a cel, który stracił legalność, nie jest
       podmieniany na innego.
   P6. **Brak legalnego celu → pusta selekcja** (czyli brak castu i kosztu).
   P7. **Ręczne wskazanie bije blokadę celu.** */
{
  console.log("§P. Wskazanie celu — `Szarża`:");
  const { resolveAbility, selectTargets, coversTarget, isAimable } = AS;
  const specC = resolveAbility("charge", { reach: 68 });
  const sh = specC.shape;
  const cc = CFG.ABILITIES.charge;
  const Oc = { x: 0, y: 0 };
  const FRAMEc = { body: Oc, sprite: Oc };
  const PRAWOc = { x: 1, y: 0 };
  /** Cel w odległości `d` pod kątem `deg` od osi +x. */
  const celPod = (id, d, deg, r = 12) => {
    const rad = (deg * Math.PI) / 180;
    const x = Math.cos(rad) * d;
    const y = Math.sin(rad) * d;
    return { ref: id, body: { x, y, radius: r }, sprite: { x, y } };
  };
  /** Wektor jednostkowy pod kątem `deg`. */
  const osPod = (deg) => ({ x: Math.cos((deg * Math.PI) / 180), y: Math.sin((deg * Math.PI) / 180) });

  /* ── P1. KSZTAŁT ────────────────────────────────────────────────────── */
  const p1 = [
    ["rodzaj kształtu = directionTarget", sh.kind === "directionTarget"],
    // ⚠ Liczby MUSZĄ być dzisiejszymi liczbami Szarży — iteracja miała nie
    // ruszać pasma zasięgu, tylko sposób wyboru celu.
    ["minRange z configu, nietknięte", sh.minRangePx === cc.minRange],
    ["maxRange z configu, nietknięte", sh.maxRangePx === cc.maxRange],
    ["sektor akwizycji z configu", sh.acquisitionHalfDeg === cc.acquisitionHalfDeg],
    ["szarżuje się na JEDNEGO", specC.maxTargets === 1],
    // ⚠ Brak `damage` jest TWIERDZENIEM, nie przeoczeniem: Szarża nie zadaje
    // obrażeń (cios na końcu to zwykły autoatak). Mnożnik 1,0 „dla symetrii"
    // byłby martwym slotem — polem deklarującym mechanikę, której nie ma.
    ["brak bloku obrażeń (Szarża ich nie zadaje)", specC.damage === undefined],
    ["`charge` jest celowana", isAimable("charge") === true],
  ];
  for (const [opis, ok] of p1) {
    console.log(`  ${ok ? "OK  " : "BŁĄD"} P1. ${opis}`);
    if (!ok) bledy.push(`§P1: ${opis} — nie zachodzi`);
  }

  /* ── P2. SEKTOR AKWIZYCJI ───────────────────────────────────────────── */
  {
    const naOsi = coversTarget(sh, FRAMEc, PRAWOc, celPod("na_osi", 200, 0));
    const skraj = coversTarget(sh, FRAMEc, PRAWOc, celPod("skraj", 200, sh.acquisitionHalfDeg - 1));
    const poza = coversTarget(sh, FRAMEc, PRAWOc, celPod("poza", 200, sh.acquisitionHalfDeg + 10));
    const ok = naOsi && skraj && !poza;
    console.log(`  ${ok ? "OK  " : "BŁĄD"} P2. sektor ±${sh.acquisitionHalfDeg}°: oś=${naOsi}, skraj=${skraj}, poza=${poza}`);
    if (!ok) bledy.push(`§P2: sektor akwizycji nie odsiewa poprawnie (oś=${naOsi}, skraj=${skraj}, poza=${poza})`);

    // ⚠ **Przypadek wprost z zamówienia: celuję w GÓRĘ, jedyny wróg stoi
    // z PRAWEJ.** Bez sektora gra szarżowałaby w prawo, czyli manualne
    // celowanie nie znaczyłoby nic.
    const wybor = selectTargets(specC, FRAMEc, { x: 0, y: -1 }, [celPod("z_prawej", 200, 0)]);
    const cichy = wybor.length === 0;
    console.log(`  ${cichy ? "OK  " : "BŁĄD"} P2. aim w GÓRĘ + jedyny wróg z PRAWEJ → nikt nie wybrany`);
    if (!cichy) bledy.push("§P2: celowanie w górę wybrało wroga z prawej — sektor akwizycji nie działa");
  }

  /* ── P3. PASMO W OBIE STRONY ────────────────────────────────────────── */
  {
    const bliżej = coversTarget(sh, FRAMEc, PRAWOc, celPod("za_blisko", sh.minRangePx - 20, 0));
    const środek = coversTarget(sh, FRAMEc, PRAWOc, celPod("w_pasmie", (sh.minRangePx + sh.maxRangePx) / 2, 0));
    const dalej = coversTarget(sh, FRAMEc, PRAWOc, celPod("za_daleko", sh.maxRangePx + 20, 0));
    const ok = !bliżej && środek && !dalej;
    console.log(`  ${ok ? "OK  " : "BŁĄD"} P3. pasmo ${sh.minRangePx}–${sh.maxRangePx}: bliżej=${bliżej}, środek=${środek}, dalej=${dalej}`);
    if (!ok) bledy.push(`§P3: pasmo nie odsiewa w obie strony (bliżej=${bliżej}, środek=${środek}, dalej=${dalej})`);

    // ⚠ **Miara Szarży to dystans MIĘDZY ŚRODKAMI duszków, nie prześwit** —
    // i ten przypadek jest tak dobrany, żeby OBIE miary dawały PRZECIWNY
    // werdykt. Wielki cel o środku 10 px NAD `minRange`: przy progu 100
    // dystans środków 110 (legalny), prześwit 110 − 40 = 70 (nielegalny).
    // ⚠ Liczby biorą się z configu (`sh.minRangePx`), więc przestrojenie pasma
    // ich nie unieważnia — to jest ilustracja, nie stała. Pierwsza wersja tej
    // gałęzi stawiała cel POD progiem, gdzie obie miary odpowiadają „za
    // blisko" — przechodziła pod sabotażem, czyli była dekoracją.
    const duzy = { ref: "duzy", body: { x: sh.minRangePx + 10, y: 0, radius: 40 }, sprite: { x: sh.minRangePx + 10, y: 0 } };
    const legalnyDuzy = coversTarget(sh, FRAMEc, PRAWOc, duzy);
    console.log(`  ${legalnyDuzy ? "OK  " : "BŁĄD"} P3. wielki cel tuż NAD minRange jest legalny (miara = środki duszków, nie prześwit)`);
    if (!legalnyDuzy) bledy.push("§P3: promień celu wpłynął na próg Szarży — miara przestała być dystansem środków duszków");
  }

  /* ── P4. DETERMINIZM ────────────────────────────────────────────────── */
  {
    // „skos" jest bliżej niż „wprost_daleko", ale leży poza osią; oba „wprost"
    // mają odchylenie 0, więc między nimi rozstrzyga dystans.
    const kandydaci = [celPod("skos", 200, 20), celPod("wprost_daleko", 300, 0), celPod("wprost_blisko", 180, 0)];
    const a = selectTargets(specC, FRAMEc, PRAWOc, kandydaci);
    const b = selectTargets(specC, FRAMEc, PRAWOc, [...kandydaci].reverse());
    const ok = a.length === 1 && a[0].ref === "wprost_blisko" && b.length === 1 && b[0].ref === "wprost_blisko";
    console.log(`  ${ok ? "OK  " : "BŁĄD"} P4. wybór: ${a[0]?.ref}; po odwróceniu wejścia: ${b[0]?.ref} (sufit ${specC.maxTargets})`);
    if (!ok) bledy.push(`§P4: wybór niedeterministyczny albo zły: ${a[0]?.ref} vs ${b[0]?.ref}`);
  }

  /* ── P5. PODGLĄD == COMMIT ──────────────────────────────────────────── */
  {
    const kandydaci = [celPod("a", 200, 5), celPod("b", 220, 12), celPod("c", 260, 25)];
    const podglad = selectTargets(specC, FRAMEc, PRAWOc, kandydaci);
    const commit = selectTargets(specC, FRAMEc, PRAWOc, kandydaci);
    const zgodne = podglad[0]?.ref === commit[0]?.ref;
    const wskazany = kandydaci.find((k) => k.ref === podglad[0]?.ref);
    const legalny = !!wskazany && coversTarget(sh, FRAMEc, PRAWOc, wskazany);
    console.log(`  ${zgodne && legalny ? "OK  " : "BŁĄD"} P5. podgląd (${podglad[0]?.ref}) == commit (${commit[0]?.ref}), cel spełnia predykat`);
    if (!zgodne) bledy.push("§P5: podgląd i commit wybrały różne cele");
    if (!legalny) bledy.push("§P5: wskazany cel nie spełnia predykatu kształtu");

    // ⚠ Cel, który wyszedł z pasma między podglądem a puszczeniem palca,
    // przestaje być legalny — scena ma wtedy NIE szarżować i NIE podstawiać
    // nikogo innego.
    const uciekl = coversTarget(sh, FRAMEc, PRAWOc, celPod("uciekl", sh.maxRangePx + 50, 0));
    console.log(`  ${!uciekl ? "OK  " : "BŁĄD"} P5. cel, który wyszedł z pasma, przestaje być legalny`);
    if (uciekl) bledy.push("§P5: cel poza pasmem dalej przechodzi walidację commitu");
  }

  /* ── P6. BRAK LEGALNEGO CELU ────────────────────────────────────────── */
  {
    const pusto = selectTargets(specC, FRAMEc, PRAWOc, []);
    const nielegalni = selectTargets(specC, FRAMEc, PRAWOc, [
      celPod("za_blisko", 40, 0),
      celPod("za_daleko", 900, 0),
      celPod("poza_sektorem", 200, 80),
    ]);
    const ok = pusto.length === 0 && nielegalni.length === 0;
    console.log(`  ${ok ? "OK  " : "BŁĄD"} P6. brak legalnego celu → pusta selekcja (dostano ${nielegalni.length})`);
    if (!ok) bledy.push(`§P6: nielegalni kandydaci zostali wybrani (${nielegalni.length})`);
  }

  /* ── P9. BIAŁY TOR NIE OBIECUJE PRZEJAZDU PRZEZ DRZEWO ──────────────────
     ⚠ Zgłoszenie z rozgrywki 2026-09-05: „biała ścieżka jest rysowana przez
     pień". Przyczyną nie był brak zapytania — było, tylko **pytało o INNY
     odcinek, niż rysunek pokazywał**: zapytanie startowało z `frame.body`, a pas
     z `originFor(shape, frame)`, czyli dla Szarży ze środka duszka, 19 px wyżej.
     Pudełko pnia jest wysokie na 13–15 px, czyli **mniej niż ten rozjazd**, więc
     pień pod narysowanym pasem potrafił w ogóle nie trafić w linię zapytania.

     Ten strażnik pilnuje obu połówek: że siatka odróżnia tor przecięty od
     wolnego przy PRAWDZIWYCH wymiarach pnia, i że scena pyta o odcinek
     wyprowadzony z rysunku, a nie z osobnego punktu. */
  {
    const tmpNavP = join(KORZEN, ".tmp_navgrid_p9.mjs");
    await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/movement/NavGrid.ts")], outfile: tmpNavP, alias: { phaser: stubPhaser } });
    const NAVP = await import(pathToFileURL(tmpNavP).href);
    await unlink(tmpNavP).catch(() => {});

    // Pień w prawdziwych wymiarach z `TreeStampManifest` (16 × 15), 150 px na
    // wprost od gracza; mapa z zapasem, żeby krawędź świata nie mieszała.
    const pien = [{ x: 350, y: 292, w: 16, h: 15 }];
    const nav = NAVP.NavGrid.build(pien, 800, 800);
    const bodyW = CFG.PLAYER.bodyWidth;
    const G = { x: 200, y: 300 };

    // ⚠ **Cel ZA drzewem**: tor musi zostać PRZECIĘTY, a punkt przecięcia leżeć
    // przed pniem — inaczej biel byłaby malowana przez pień.
    const blok = nav.firstBlockedOn(G.x, G.y, G.x + 300, G.y, bodyW);
    const dBlok = blok ? Math.hypot(blok.x - G.x, blok.y - G.y) : -1;
    const przeciety = blok !== null;
    const przedPniem = dBlok > 0 && dBlok <= 350 - G.x;

    // ⚠ **Tor OBOK drzewa** — strażnik, który blokuje wszystko, jest dekoracją.
    // 60 px w bok to znacznie więcej niż półszerokość ciała (9 px) plus
    // półszerokość pnia (8 px), więc tędy MUSI być wolno.
    const obok = nav.firstBlockedOn(G.x, G.y - 60, G.x + 300, G.y - 60, bodyW) === null;

    // ⚠ **Otarcie krawędzią**: pas ma szerokość ciała, więc pień mijany o 12 px
    // od osi wciąż w niego wchodzi (9 + 8 = 17 > 12). To jest ta własność,
    // przez którą NIE trzeba zamiatać trzema liniami — `passable` porównuje
    // PRZEŚWIT z szerokością ciała, czyli pyta o całą przestrzeń między
    // krawędziami pasa.
    const otarcie = nav.firstBlockedOn(G.x, G.y - 12, G.x + 300, G.y - 12, bodyW) !== null;

    // ── Tekstowo: zapytanie wyprowadzone z RYSUNKU ────────────────────────
    const gsP = await readFile(join(KORZEN, "src/scenes/GameScene.ts"), "utf8");
    // ⚠ **Komentarze wycięte — strażnik ma mierzyć KOD, nie dokumentację.**
    // Pierwsza wersja tego bloku czytała ciało razem z komentarzami i po
    // celowym zepsuciu `rysOrigin` **dalej świeciła na zielono**, bo nazwę
    // `originFor(shape, frame)` znajdowała w akapicie tłumaczącym poprawę.
    // Ta sama lekcja co przy §V i §T7.
    const ciałoExtras = bezKomentarzyP(cialoMetody(gsP, "  private aimExtras("));
const zRysunku = /originFor\(shape, frame\)/.test(ciałoExtras);
    const naPlaszczyzneCiala = /frame\.body\.x - rysOrigin\.x/.test(ciałoExtras);
    const szerokoscCiala = /firstBlockedOn\([^)]*PLAYER\.bodyWidth\)/.test(ciałoExtras.replace(/\s+/g, " "));

    const par = [
      ["P9. cel ZA pniem: tor jest PRZECIĘTY", przeciety],
      [`P9. …a punkt przecięcia leży PRZED pniem (${dBlok.toFixed(0)} px, pień od 150)`, przedPniem],
      ["P9. ⭐ tor OBOK pnia (60 px w bok) zostaje WOLNY", obok],
      ["P9. otarcie krawędzią pasa (12 px w bok) też jest przecięciem — pas ma szerokość CIAŁA", otarcie],
      ["P9. zapytanie startuje z punktu RYSUNKU (`originFor(shape, frame)`)", zRysunku],
      ["P9. …przesuniętego na płaszczyznę ruchu ciała", naPlaszczyzneCiala],
      ["P9. …i pyta szerokością ciała, nie linią środkową", szerokoscCiala],
      /* ⚠ Zgłoszenie z rozgrywki 2026-09-05: „✕ i celowanie chowają się pod
         drzewa". Podgląd stał na `DEPTH.entities - 1` = 999, a cała warstwa
         Y-sortowana ma depth `entities` = 1000 — więc chował się nie tylko pod
         koronami (`overhead`), ale pod PNIAMI, GRACZEM i WROGAMI. Żółty marker
         celu potrafił zniknąć za własnym celem. Podgląd ma być subtelny ALFĄ,
         nie kolejnością rysowania. */
      ["P9. podgląd rysuje się NAD światem (`DEPTH.aimPreview`)", /setDepth\(DEPTH\.aimPreview\)/.test(await readFile(join(KORZEN, "src/ui/AimPreview.ts"), "utf8"))],
      ["P9. …a to piętro jest ponad koronami drzew", CFG.DEPTH.aimPreview > CFG.DEPTH.overhead],
      ["P9. …i ponad warstwą Y-sortowaną (pnie, gracz, wrogowie)", CFG.DEPTH.aimPreview > CFG.DEPTH.entities],
    ];
    for (const [opis, ok] of par) {
      console.log(`  ${ok ? "OK  " : "BŁĄD"} ${opis}`);
      if (!ok) bledy.push(`§P9: ${opis} — nie zachodzi`);
    }
  }

  /* ── P10. ZABLOKOWANY CEL ⇒ CELOWANA SZARŻA SIĘ NIE ODBYWA ──────────────
     ⚠⚠ **Szarża jest ATOMOWA i to jest cała treść tego strażnika.** Albo ma
     wolny cały tor do wybranego celu i jedzie, albo nie odbywa się wcale.
     Zakazane jest CZĘŚCIOWE wykonanie: ruszyć do celu, dojechać do drzewa,
     stanąć na nim i uznać to za poprawne — kosztuje pełne 14 s cooldownu za
     bieg w pień.

     Do 2026-09-05 gałąź `case "charge"` nie miała ŻADNEGO testu toru na
     żadnej z dwóch dróg wyboru celu. Wypad ma tu inną semantykę i **to jest
     zamierzone**: on ma drugie, pełnoprawne użycie (skok kierunkowy), więc
     zablokowany cel schodzi do niego (§S8). Szarża nie ma na co zejść.

     ⚠ **Asercja o BRAKU CZĘŚCIOWEGO WYKONANIA jest pozycyjna, nie słowna:**
     test toru musi stać PRZED pierwszym zapisem stanu wykonania
     (`selectTarget` / `pendingRush`). Gdyby stał po, Szarża zdążyłaby już
     zaznaczyć cel i zapisać lot, a „odmowa" byłaby sprzątaniem po starcie. */
  {
    const tmpNavC = join(KORZEN, ".tmp_navgrid_p10.mjs");
    await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/movement/NavGrid.ts")], outfile: tmpNavC, alias: { phaser: stubPhaser } });
    const NAVC = await import(pathToFileURL(tmpNavC).href);
    await unlink(tmpNavC).catch(() => {});

    // ── 1. TARGETOWANIE: cel za drzewem, w paśmie i w sektorze ───────────
    // ⚠ Bez tego przypadku strażnik nie dowodzi niczego: cel MUSI być legalny
    // pod każdym innym względem, żeby jedynym powodem odmowy był tor.
    const G = { x: 300, y: 300 };
    const celZa = { x: G.x + 250, y: G.y };
    const wPasmie = coversTarget(sh, FRAMEc, PRAWOc, celPod("za_drzewem", 250, 0));
    // Pień w prawdziwych wymiarach (`TreeStampManifest`), w połowie drogi.
    const nav = NAVC.NavGrid.build([{ x: G.x + 120, y: G.y - 8, w: 16, h: 15 }], 800, 800);
    const bodyW = CFG.PLAYER.bodyWidth;
    const torPrzeciety = !nav.hasClearLine(G.x, G.y, celZa.x, celZa.y, bodyW);

    // ── 3. SZARŻA W WOLNYM KIERUNKU ──────────────────────────────────────
    const torWolny = nav.hasClearLine(G.x, G.y - 90, celZa.x, celZa.y - 90, bodyW);

    // ── 2. WYKONANIE: obie drogi + BRAK częściowego wykonania ────────────
    const gsC = await readFile(join(KORZEN, "src/scenes/GameScene.ts"), "utf8");
    const ciałoC = bezKomentarzyP(wycinekGalezi(gsC, 'case "charge":'));
    // ⚠ **lastIndexOf, nie indexOf — poprawka z próby sabotażu.** Pierwsza
    // wersja pytała o PIERWSZE wystąpienie i przechodziła, gdy test toru
    // przeniesiono za `selectTarget` tylko na jednej z dwóch dróg. Asercja ma
    // brzmieć „KAŻDY test toru stoi przed zapisem stanu", nie „jakiś stoi".
    const iClear = ciałoC.lastIndexOf("pathClearTo(");
    const iSelect = ciałoC.indexOf("selectTarget(");
    const iRush = ciałoC.indexOf("pendingRush");
    const wolania = (ciałoC.match(/pathClearTo\(/g) ?? []).length;
    const przedStanem = iClear >= 0 && iSelect > iClear && iRush > iClear;
    // Szarża nie zna trybu kierunkowego — gdyby go dostała, „atomowa" przestaje
    // być prawdą i ten strażnik musi o tym powiedzieć.
    const bezFallbacku = !ciałoC.includes('kind: "dash"');
    const tapnięcieMówi = /pathClearTo\([\s\S]{0,120}?sayAtPlayer\(/.test(ciałoC);
    const flaga = CFG.ABILITIES.charge.requiresClearPath === true;

    const par = [
      ["P10. cel za drzewem jest legalny POD KAŻDYM innym względem (pasmo + sektor)", wPasmie],
      ["P10. …a mimo to jego tor jest PRZECIĘTY", torPrzeciety],
      ["P10. ⭐ Szarża w wolnym kierunku NIE jest blokowana", torWolny],
      ["P10. `ABILITIES.charge.requiresClearPath` włączone", flaga],
      ["P10. wykonanie pyta o tor na OBU drogach (przeciągnięcie i tapnięcie)", wolania >= 2],
      ["P10. ⭐⭐ BRAK CZĘŚCIOWEGO WYKONANIA: test toru PRZED `selectTarget` i `pendingRush`", przedStanem],
      ["P10. Szarża pozostaje ATOMOWA — zero trybu kierunkowego w gałęzi", bezFallbacku],
      ["P10. ścieżka tapnięcia MÓWI, dlaczego odmawia (cichy przycisk = zepsuty)", tapnięcieMówi],
    ];
    for (const [opis, ok] of par) {
      console.log(`  ${ok ? "OK  " : "BŁĄD"} ${opis}`);
      if (!ok) bledy.push(`§P10: ${opis} — nie zachodzi`);
    }
  }

  /* ── P7. RĘCZNE WSKAZANIE BIJE BLOKADĘ CELU ─────────────────────────── */
  {
    // ⚠ Dowód jest strukturalny: `selectTargets` **nie ma jak poznać**
    // `currentTarget`, więc nie ma jak mu ulec. Ta gałąź pilnuje drugiej
    // połowy — że przeciągnięcie w stronę B naprawdę wybiera B, choć A jest
    // bliżej i to A byłoby „zaznaczone".
    const A = celPod("A_zaznaczony_blizszy", 160, 0);
    const B = celPod("B_wskazany_dalszy", 240, 20);
    const wynik = selectTargets(specC, FRAMEc, osPod(20), [A, B]);
    const ok = wynik[0]?.ref === "B_wskazany_dalszy";
    console.log(`  ${ok ? "OK  " : "BŁĄD"} P7. przeciągnięcie w stronę B wybiera B, nie bliższego A (wybrano: ${wynik[0]?.ref})`);
    if (!ok) bledy.push(`§P7: wskazanie ręczne nie wygrało — wybrano "${wynik[0]?.ref}"`);
  }

  /* ── P8. SZARŻA MUSI ZAZNACZYĆ SWÓJ CEL ─────────────────────────────────
     ⚠ **Zgłoszone z rozgrywki (2026-08-23): po ręcznym wskazaniu postać
     dobiegała do wroga i NIE atakowała.** Szarża uzbraja na końcu lotu
     `autoAttackArmed`, ale uzbrojony autoatak strzela do `currentTarget` —
     a ręczne wskazanie nigdy blokady celu nie ruszało. Ścieżka tapnięcia
     działała, bo tam cel z definicji już był zaznaczony; dlatego wada
     dotyczyła WYŁĄCZNIE nowej ścieżki i nie było jej widać w testach
     czystych funkcji.

     ⚠ Drugi warunek jest równie nośny: `setTarget` PRZEŁĄCZA (ponowne
     tapnięcie odznacza), więc użyty tutaj odznaczyłby cel przy szarży na
     już wybranego wroga — czyli zepsułby ścieżkę, która działa. Stąd
     `selectTarget`, bez przełącznika. */
  {
    const gs = await readFile(join(KORZEN, "src/scenes/GameScene.ts"), "utf8");
    const i = gs.indexOf('case "charge":');
    const ciało = i === -1 ? "" : gs.slice(i, gs.indexOf("case \"whirlwind\":", i));
    const zaznacza = ciało.includes("this.selectTarget(");
    const przelacza = ciało.includes("this.setTarget(");
    console.log(`  ${zaznacza ? "OK  " : "BŁĄD"} P8. Szarża zaznacza swój cel (inaczej dobiega i nie atakuje)`);
    console.log(`  ${!przelacza ? "OK  " : "BŁĄD"} P8. i robi to BEZ przełącznika (\`setTarget\` odznaczyłby już wybranego)`);
    if (!ciało) bledy.push("§P8: nie znaleziono gałęzi `charge` w GameScene — strażnik przestał cokolwiek widzieć");
    if (!zaznacza) bledy.push("§P8: Szarża nie woła `selectTarget` — uzbrojony autoatak nie będzie miał w co uderzyć");
    if (przelacza) bledy.push("§P8: Szarża woła `setTarget`, który PRZEŁĄCZA — szarża na zaznaczonego wroga go odznaczy");
  }
  console.log();
}

/* ══════════════════════════════════════════════════════════════════════════
   §R. BURST NA JEDEN CEL — `Ciężkie uderzenie` (prototyp 2026-08-23)
   ══════════════════════════════════════════════════════════════════════════
   Trzeci prototyp na tym samym systemie celowania. Dzieli archetyp z Szarżą
   (`directionTarget`), ale mierzy INNĄ miarą i robi coś zupełnie innego.

   R1. **Kształt i pokrętła prototypowe** — w tym: miara zgodna z tym, co
       sprawdzi HIT, brak dolnej granicy, sufit 1.
   R2. **Zasięg i sektor odsiewają.**
   R3. **Determinizm** i przewaga wskazania ręcznego nad blokadą celu.
   R4. **Podgląd == commit.**
   R5. **Nie jest Cleave'em z jednym celem** — różnica ról zapisana w liczbach.
   R6. **Rytm ciosu**: commit ≠ trafienie. Strażnik tekstowy na to, że gałąź
       przechodzi przez `pendingSwing`, a nie zadaje obrażeń na miejscu. */
{
  console.log("§R. Burst na jeden cel — `Ciężkie uderzenie`:");
  const { resolveAbility, selectTargets, coversTarget, multiplierFor, isAimable } = AS;
  const STRIKE = { reach: 68 };
  const specH = resolveAbility("heavyStrike", STRIKE);
  const sh = specH.shape;
  const h = CFG.ABILITIES.heavyStrike;
  const O = { x: 0, y: 0 };
  const FRAME = { body: O, sprite: O };
  const PRAWO = { x: 1, y: 0 };
  /** Cel o promieniu `r`, którego KRAWĘDŹ leży `gap` px od gracza, pod kątem `deg`. */
  const celPrzy = (id, gap, deg, r = 10) => {
    const rad = (deg * Math.PI) / 180;
    const d = gap + r;
    const x = Math.cos(rad) * d;
    const y = Math.sin(rad) * d;
    return { ref: id, body: { x, y, radius: r }, sprite: { x, y } };
  };
  const osPod = (deg) => ({ x: Math.cos((deg * Math.PI) / 180), y: Math.sin((deg * Math.PI) / 180) });

  /* ── R1. KSZTAŁT I POKRĘTŁA ─────────────────────────────────────────── */
  const r1 = [
    ["archetyp dzielony z Szarżą", sh.kind === "directionTarget"],
    // ⚠ **Miara MUSI być tą, którą sprawdzi HIT** (`targetInReach` →
    // `withinReach` → prześwit od `combatOrigin`). Gdyby tu stało
    // `spriteCentres`, podgląd mówiłby „w zasięgu", a cios „za daleko".
    ["mierzy prześwitem, jak `targetInReach`", sh.metric === "surfaceGap"],
    ["zasięg = zasięg BRONI", sh.maxRangePx === STRIKE.reach],
    // ⚠ Melee nie zna stanu „za blisko" — to jest własność Szarży, nie ta.
    ["brak dolnej granicy", sh.minRangePx === 0],
    ["sufit celów = 1", specH.maxTargets === 1],
    ["sektor akwizycji z configu", sh.acquisitionHalfDeg === h.acquisitionHalfDeg],
    ["mnożnik obrażeń = pokrętło z configu", multiplierFor(specH, "primary") === h.damageMultiplier],
    ["`heavyStrike` jest celowana", isAimable("heavyStrike") === true],
  ];
  for (const [opis, ok] of r1) {
    console.log(`  ${ok ? "OK  " : "BŁĄD"} R1. ${opis}`);
    if (!ok) bledy.push(`§R1: ${opis} — nie zachodzi`);
  }

  /* ── R2. ZASIĘG I SEKTOR ────────────────────────────────────────────── */
  {
    const wZasiegu = coversTarget(sh, FRAME, PRAWO, celPrzy("w_zasiegu", STRIKE.reach - 10, 0));
    const zaDaleko = coversTarget(sh, FRAME, PRAWO, celPrzy("za_daleko", STRIKE.reach + 10, 0));
    const tuzPrzy = coversTarget(sh, FRAME, PRAWO, celPrzy("w_zwarciu", 1, 0));
    const pozaSektorem = coversTarget(sh, FRAME, PRAWO, celPrzy("z_boku", 20, sh.acquisitionHalfDeg + 15));
    const ok = wZasiegu && !zaDaleko && tuzPrzy && !pozaSektorem;
    console.log(`  ${ok ? "OK  " : "BŁĄD"} R2. zasięg ${sh.maxRangePx}: w=${wZasiegu}, za daleko=${zaDaleko}, w zwarciu=${tuzPrzy}, poza sektorem ±${sh.acquisitionHalfDeg}°=${pozaSektorem}`);
    if (!wZasiegu) bledy.push("§R2: cel w zasięgu nie został pokryty");
    if (zaDaleko) bledy.push("§R2: cel poza zasięgiem broni został pokryty");
    if (!tuzPrzy) bledy.push("§R2: cel w zwarciu odrzucony — melee nie ma stanu „za blisko\"");
    if (pozaSektorem) bledy.push("§R2: cel poza sektorem akwizycji został pokryty");
  }

  /* ── R3. DETERMINIZM I PRZEWAGA WSKAZANIA ───────────────────────────── */
  {
    const kandydaci = [celPrzy("skos", 15, 18), celPrzy("wprost", 30, 0), celPrzy("wprost_dalej", 50, 0)];
    const a = selectTargets(specH, FRAME, PRAWO, kandydaci).map((w) => w.ref);
    const b = selectTargets(specH, FRAME, PRAWO, [...kandydaci].reverse()).map((w) => w.ref);
    const ok = a.length === 1 && a[0] === "wprost" && a.join() === b.join();
    console.log(`  ${ok ? "OK  " : "BŁĄD"} R3. oś bije dystans, sufit 1: ${a.join()} / po odwróceniu: ${b.join()}`);
    if (!ok) bledy.push(`§R3: wybór zły albo zależny od kolejności: [${a}] vs [${b}]`);

    // ⚠ Ręczne wskazanie ma wygrać z blokadą celu. Dowód strukturalny:
    // `selectTargets` nie zna `currentTarget`. Tu druga połowa — przeciągnięcie
    // w stronę B wybiera B, choć A jest bliżej i to A byłoby zaznaczone.
    const wynik = selectTargets(specH, FRAME, osPod(18), [celPrzy("A_blizszy", 12, 0), celPrzy("B_wskazany", 40, 18)]);
    const okB = wynik[0]?.ref === "B_wskazany";
    console.log(`  ${okB ? "OK  " : "BŁĄD"} R3. wskazanie ręczne bije bliższego A (wybrano: ${wynik[0]?.ref})`);
    if (!okB) bledy.push(`§R3: wskazanie ręczne nie wygrało — wybrano "${wynik[0]?.ref}"`);
  }

  /* ── R4. PODGLĄD == COMMIT ──────────────────────────────────────────── */
  {
    const kandydaci = [celPrzy("a", 20, 5), celPrzy("b", 25, 12), celPrzy("c", 30, 20)];
    const podglad = selectTargets(specH, FRAME, PRAWO, kandydaci);
    const commit = selectTargets(specH, FRAME, PRAWO, kandydaci);
    const wskazany = kandydaci.find((k) => k.ref === podglad[0]?.ref);
    const ok = podglad[0]?.ref === commit[0]?.ref && !!wskazany && coversTarget(sh, FRAME, PRAWO, wskazany);
    console.log(`  ${ok ? "OK  " : "BŁĄD"} R4. podgląd (${podglad[0]?.ref}) == commit (${commit[0]?.ref}), cel spełnia predykat`);
    if (!ok) bledy.push("§R4: podgląd i commit rozjechały się albo wskazały cel spoza kształtu");

    const pusto = selectTargets(specH, FRAME, PRAWO, [celPrzy("daleko", 500, 0), celPrzy("z_tylu", 20, 170)]);
    console.log(`  ${pusto.length === 0 ? "OK  " : "BŁĄD"} R4. brak legalnego celu → pusta selekcja (${pusto.length})`);
    if (pusto.length) bledy.push(`§R4: nielegalni kandydaci zostali wybrani (${pusto.length})`);
  }

  /* ── R5. TO NIE JEST CLEAVE Z JEDNYM CELEM ──────────────────────────── */
  {
    // ⚠ Różnica ról musi być widoczna W LICZBACH, nie tylko w opisie. Gdyby
    // Ciężkie uderzenie przestało być wyraźnie mocniejsze i droższe, albo
    // gdyby dostało łuk czy drugi cel — traci rację bytu jako osobny slot.
    const cleave = CFG.ABILITIES.cleave;
    const par = [
      ["mocniejsze od Szerokiego cięcia", h.damageMultiplier > cleave.damageMultiplier * cleave.primaryMultiplier],
      ["droższe od Szerokiego cięcia", h.staminaCost > cleave.staminaCost],
      ["mocniejsze niż zwykły cios", h.damageMultiplier > 1],
      ["JEDEN cel, nie łuk", specH.maxTargets === 1 && sh.kind !== "directionArc"],
      // ⚠ Zamach musi być ZAUWAŻALNY, inaczej „commitment" jest tylko w opisie.
      ["zamach zauważalny (≥250 ms)", h.windupMs >= 250],
      ["ma bezbronność po ciosie", h.recoveryMs > 0],
    ];
    for (const [opis, ok] of par) {
      console.log(`  ${ok ? "OK  " : "BŁĄD"} R5. ${opis}`);
      if (!ok) bledy.push(`§R5: ${opis} — nie zachodzi, rola zlewa się z Szerokim cięciem`);
    }
    // ⚠ Bez dodatkowych efektów — pytanie tej iteracji brzmi „czy sama wymiana
    // czas+koszt → obrażenia jest warta slotu". Status zamazałby odpowiedź.
    const zakazane = ["bleed", "stun", "execute", "armorPen", "knockback", "interrupts", "staggerMs"];
    const dodane = zakazane.filter((k) => k in h);
    console.log(`  ${dodane.length === 0 ? "OK  " : "BŁĄD"} R5. zero dodatkowych efektów${dodane.length ? ": " + dodane.join(", ") : ""}`);
    if (dodane.length) bledy.push(`§R5: dołożono efekty (${dodane.join(", ")}) — prototyp miał mierzyć samą wymianę czas+koszt→obrażenia`);
  }

  /* ── R6. RYTM: COMMIT ≠ TRAFIENIE — PRZEKOTWICZONE NA DANE (P3.1) ────────
     ⚠ **Do 2026-09-03 ten strażnik czytał TEKST gałęzi `case "heavyStrike":`**
     w `GameScene` i sprawdzał, czy stoi w niej `this.pendingSwing = {`. Po
     migracji P3.1 gałąź już tego nie robi — czasy, koszt, mnożnik i
     `allowFumble` są DEKLARACJĄ w `core/combat/PlayerAction.ts`, a cios składa
     wspólny wykonawca. Strażnik pyta więc dziś o dwie rzeczy zamiast o jedną:

       (a) **czy DEKLARACJA odtwarza dzisiejsze liczby** — 420 / 260 / 7 s / 18 /
           ×2,0 / `allowFumble: false`, i czy nie rozjechała się z configiem ani
           z `AbilitySpec`;
       (b) **czy WYKONAWCA zachowuje rytm** — opóźnienie `windupMs`, zero
           obrażeń na commicie, zero płatności poza wspólnym ogonem.

     ⚠ Punkt (b) zostaje strażnikiem TEKSTOWYM, bo to jest własność SCENY, nie
     czystej funkcji — dokładnie z tego samego powodu, dla którego był nim
     wcześniej: podmiana wykonawcy na natychmiastowe `damageMatchingEnemies`
     przeszłaby wszystkie testy czystych funkcji, bo one o czasie nic nie wiedzą. */
  {
    const tmpPA = join(KORZEN, ".tmp_playeraction.mjs");
    await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/combat/PlayerAction.ts")], outfile: tmpPA, alias: { phaser: stubPhaser } });
    const PA = await import(pathToFileURL(tmpPA).href);
    await unlink(tmpPA).catch(() => {});
    const akcja = PA.PLAYER_ACTIONS?.heavyStrike;

    if (!akcja) {
      bledy.push("§R6: brak `PLAYER_ACTIONS.heavyStrike` — strażnik stracił cel, a nie kod się naprawił.");
      console.log("  BŁĄD R6. deklaracja `heavyStrike` nie istnieje");
    } else {
      /* (a) DEKLARACJA — wartości zamrożone, każda osobno, żeby raport mówił
             KTÓRA się ruszyła, a nie „coś się nie zgadza". */
      const oczekiwane = [
        ["windupMs", akcja.windupMs, 420],
        // ⚠ **PRZEKOTWICZONE (P3.5):** `recoveryMs` nie jest już płaskim polem,
        //    a ładunkiem wariantu `windupPlusRecovery` w `ActionRoot` (Wypad nie
        //    ma tej liczby i nie wolno mu jej wymyślić). Liczba się NIE ruszyła.
        ["root.recoveryMs", akcja.root?.recoveryMs, 260],
      ];
      for (const [pole, jest, chc] of oczekiwane) {
        const ok = Math.abs(jest - chc) < 1e-9;
        console.log(`  ${ok ? "OK  " : "BŁĄD"} R6a. deklaracja ${pole} = ${chc}${ok ? "" : ` (jest ${jest})`}`);
        if (!ok) bledy.push(`§R6a: \`PlayerAction.heavyStrike.${pole}\` = ${jest}, zamrożone ${chc}.`);
      }

      /* ⚠ **PRZEKOTWICZONE (P3.4).** Do tej zmiany cooldown, koszt i mnożnik
         były zamrożone przez KOPIĘ w `PlayerAction`. Kopie zniknęły (review
         P3.3, OD-2/OD-3), więc te trzy liczby są dziś asercjonowane WPROST na
         swoich właścicielach: cooldown i wysiłek na `ABILITIES.heavyStrike`
         (płaci je wspólny ogon `onAbilityRequested`), mnożnik na
         `AbilitySpec`. ⚠ Bez tego bloku P3.4 byłoby UTRATĄ pokrycia: przed nim
         jedyną drogą do tych liczb w tej uprzęży była deklaracja. */
      const zamrozoneWlascicieli = [
        ["`ABILITIES.heavyStrike.cooldown` = 7 s (7000 ms)", h.cooldown * 1000, 7000],
        ["`ABILITIES.heavyStrike.staminaCost` = 18", h.staminaCost, 18],
        ["`multiplierFor(resolveAbility(...))` = 2,0", multiplierFor(specH, "primary"), 2.0],
      ];
      for (const [opis, jest, chc] of zamrozoneWlascicieli) {
        const ok = Math.abs(jest - chc) < 1e-9;
        console.log(`  ${ok ? "OK  " : "BŁĄD"} R6a. ${opis}${ok ? "" : ` (jest ${jest})`}`);
        if (!ok) bledy.push(`§R6a: ${opis} — jest ${jest}. Liczba jest zamrożona u WŁAŚCICIELA, nie w deklaracji akcji.`);
      }

      /* ⚠ I asercja odwrotna: pola NIE MOGĄ wrócić do deklaracji „dla
         kompletności opisu". Wróciłyby jako drugie źródło prawdy — dokładnie
         to, co P3.4 odjęło. */
      const bezKopii = ["cooldownMs", "staminaCost", "damageMul"].filter((p) => p in akcja);
      console.log(`  ${bezKopii.length === 0 ? "OK  " : "BŁĄD"} R6a. deklaracja NIE kopiuje cooldownu, kosztu ani mnożnika${bezKopii.length ? ": " + bezKopii.join(", ") : ""}`);
      if (bezKopii.length) bledy.push(`§R6a: do \`PlayerAction\` wróciły pola bez konsumenta (${bezKopii.join(", ")}) — właścicielem cooldownu jest \`Abilities\`, kosztu wspólny ogon, mnożnika \`AbilitySpec\`.`);
      /* ⚠ Dwa pola weszły do kontraktu w P3.2 (`shieldBash` je ujawnił).
         Dla Ciężkiego uderzenia mają wartości przeciwne do jego, więc bez
         tych asercji migracja drugiej akcji mogłaby po cichu przestawić
         pierwszą. */
      const zuzywaBron = akcja.wearsWeapon === true;
      console.log(`  ${zuzywaBron ? "OK  " : "BŁĄD"} R6a. deklaracja wearsWeapon = true (bije BRONIĄ)`);
      if (!zuzywaBron) bledy.push("§R6a: Ciężkie uderzenie przestało zużywać broń — cios wyprowadza oręż, więc oręż ma się zużywać.");

      /* ⚠ **PRZEKOTWICZONE (P3.5):** `onHit` jest LISTĄ, a „nic" to lista pusta
         — wariant `"none"` zniknął razem z pojedynczą wartością (OD-1). Reguła
         „świadomie nic ≠ ktoś zapomniał" trzyma się na tym, że pole jest
         WYMAGANE, więc `[]` trzeba napisać. Asercja pyta więc o dwie rzeczy:
         czy to naprawdę lista i czy jest pusta. */
      const bezNagrody = Array.isArray(akcja.onHit) && akcja.onHit.length === 0;
      console.log(`  ${bezNagrody ? "OK  " : "BŁĄD"} R6a. deklaracja onHit = [] (cała treść to obrażenia)`);
      if (!bezNagrody) bledy.push(`§R6a: onHit = ${JSON.stringify(akcja.onHit)} — Ciężkie uderzenie nie ma nagrody poza obrażeniami (§R5: to nie jest Shield Bash), a lista musi być listą.`);

      /* ⚠ **Polityka ukorzenienia jest DEKLARACJĄ, nie domysłem wykonawcy.**
         Ciężkie uderzenie ma własny rytm (`windupPlusRecovery`); zejście na
         `weaponTempo` skróciłoby root do tempa broni bez zmiany ani jednej
         liczby w configu — czyli po cichu. */
      const wlasnyRytm = akcja.root?.kind === "windupPlusRecovery";
      console.log(`  ${wlasnyRytm ? "OK  " : "BŁĄD"} R6a. ukorzenienie z WŁASNEGO rytmu (\`windupPlusRecovery\`)`);
      if (!wlasnyRytm) bledy.push(`§R6a: \`root.kind\` = "${akcja.root?.kind}" — Ciężkie uderzenie ma ukorzenienie \`windupMs + recoveryMs\`, nie tempo broni.`);

      const bezFuszerki = akcja.allowFumble === false;
      console.log(`  ${bezFuszerki ? "OK  " : "BŁĄD"} R6a. deklaracja allowFumble = false`);
      if (!bezFuszerki) bledy.push("§R6a: Ciężkie uderzenie zaczęło fuszerować — to wyjątek EKONOMICZNY, jego odwrócenie jest decyzją, nie skutkiem ubocznym.");

      const adres = akcja.id === "heavyStrike";
      console.log(`  ${adres ? "OK  " : "BŁĄD"} R6a. deklaracja wskazuje na \`heavyStrike\` w \`Abilities\``);
      if (!adres) bledy.push(`§R6a: \`PlayerAction.heavyStrike.id\` = "${akcja.id}" — cooldown poszedłby pod inny adres.`);

      /* ⚠ Deklaracja ma być ODCZYTEM configu, nie jego KOPIĄ. Bez tego
         przestrojenie `ABILITIES.heavyStrike` zmieniłoby rytm ciosu, a
         deklarację zostawiło w tyle. ⚠ Po P3.4 dotyczy to już tylko czasów —
         reszta liczb nie ma tu kopii, którą trzeba by pilnować. */
      const zConfigu =
        akcja.windupMs === h.windupMs
        && akcja.root?.recoveryMs === h.recoveryMs;
      console.log(`  ${zConfigu ? "OK  " : "BŁĄD"} R6a. deklaracja jest ODCZYTEM \`ABILITIES.heavyStrike\`, nie kopią`);
      if (!zConfigu) bledy.push("§R6a: deklaracja `PlayerAction` rozjechała się z `ABILITIES.heavyStrike` — przestrojenie configu ominęłoby akcję.");
    }

    /* (b) WYKONAWCA — rytm ciosu. */
    const gs = await readFile(join(KORZEN, "src/scenes/GameScene.ts"), "utf8");
    const iw = gs.indexOf("private commitPlayerAction(");
    const wykonawca = iw === -1 ? "" : gs.slice(iw, gs.indexOf("private onAbilityRequested(", iw));
    const przezPending = wykonawca.includes("this.pendingSwing = {") && wykonawca.includes("resolveAt: now + action.windupMs");
    const natychmiast = wykonawca.includes("damageMatchingEnemies(") || wykonawca.includes("damageLockedTarget(");
    const placiSam = wykonawca.includes("Stamina.spend(") || wykonawca.includes("startCooldown(");
    /* ⚠ **Dołożone w P3.2 i znalezione CELOWYM ZEPSUCIEM, nie z lektury.**
       Bez tej asercji `wearsWeapon` było deklaracją, której nikt nie honoruje:
       wykonawca zużywający broń bezwarunkowo przechodził wszystkie pozostałe
       asercje, a Uderzenie tarczą po cichu zużywałoby oręż, którym nie bije. */
    const pytaOZuzycie = /if \(action\.wearsWeapon\) this\.wearWeapon\(\)/.test(wykonawca);
    console.log(`  ${przezPending ? "OK  " : "BŁĄD"} R6b. wykonawca odkłada cios w \`pendingSwing\` z opóźnieniem \`windupMs\``);
    console.log(`  ${!natychmiast ? "OK  " : "BŁĄD"} R6b. wykonawca NIE zadaje obrażeń w chwili puszczenia palca`);
    console.log(`  ${!placiSam ? "OK  " : "BŁĄD"} R6b. koszt i cooldown zostają we wspólnym ogonie (płacone na commit)`);
    if (!wykonawca) bledy.push("§R6b: nie znaleziono `commitPlayerAction` — strażnik przestał cokolwiek widzieć");
    if (!przezPending) bledy.push("§R6b: wykonawca nie odkłada ciosu w `pendingSwing` — znika cały commitment");
    if (natychmiast) bledy.push("§R6b: wykonawca zadaje obrażenia od razu — commit i trafienie zlały się w jedną klatkę");
    if (placiSam) bledy.push("§R6b: wykonawca płaci koszt sam — ominął wspólny ogon, więc odmowa mogłaby coś pobrać");
    console.log(`  ${pytaOZuzycie ? "OK  " : "BŁĄD"} R6b. wykonawca ZUŻYWA BROŃ tylko wtedy, gdy akcja to deklaruje`);
    if (!pytaOZuzycie) bledy.push("§R6b: wykonawca nie pyta o wearsWeapon — deklaracja o niezużywaniu broni przestaje cokolwiek znaczyć.");

    /* ⚠ **Dołożone w P3.4.** Mnożnik ma iść z resolvera, a nie z deklaracji —
       inaczej wraca druga droga do tej samej liczby, którą P3.4 właśnie
       zlikwidowało. Pytamy o ŹRÓDŁO, nie o wartość: obie drogi dają dziś 2,0,
       więc test liczbowy przespałby powrót kopii (ta sama lekcja co §T1b). */
    const zResolvera = /damageMul: multiplierFor\(resolveAbility\(action\.id, strike\), "primary"\)/.test(wykonawca);
    const zDeklaracji = wykonawca.includes("action.damageMul");
    console.log(`  ${zResolvera && !zDeklaracji ? "OK  " : "BŁĄD"} R6b. mnożnik pochodzi z \`AbilitySpec\`, nie z deklaracji`);
    if (!zResolvera) bledy.push("§R6b: wykonawca nie liczy mnożnika przez `multiplierFor(resolveAbility(action.id, strike))` — właścicielem tej liczby jest `AbilitySpec`.");
    if (zDeklaracji) bledy.push("§R6b: wykonawca znów czyta `action.damageMul` — kopia mnożnika wróciła do deklaracji (P3.4 cofnięte).");

    /* ⚠ Gałąź ma DELEGOWAĆ, a nie składać ciosu obok wykonawcy. Bez tego
       migracja mogłaby zostać cofnięta po cichu, jedną wklejką.

       ⚠ **Wycinek przez `wycinekGalezi` (P3.4), a nie przez `indexOf` następnej
       gałęzi.** Poprzednia wersja szukała `case "shieldBash":` PO gałęzi
       Ciężkiego uderzenia; przestawienie kolejności `case`-ów dawało `-1`,
       czyli `slice(ig, -1)` — cały ogon pliku zamiast jednej gałęzi. Asercja
       przechodziła wtedy na zielono nad złym oknem, bo po tym miejscu nie ma
       już w pliku żadnego `this.pendingSwing = {`. Strażnik, który nie potrafi
       zaświecić na czerwono, jest dekoracją; helper tnie do NASTĘPNEGO `case`
       bez względu na to, który to case. */
    const galaz = wycinekGalezi(gs, 'case "heavyStrike":');
    const deleguje = galaz !== "" && galaz.includes("this.commitPlayerAction(") && !galaz.includes("this.pendingSwing = {");
    console.log(`  ${deleguje ? "OK  " : "BŁĄD"} R6b. gałąź DELEGUJE do wykonawcy, nie składa ciosu sama`);
    if (!galaz) bledy.push('§R6b: nie znaleziono gałęzi `heavyStrike` — strażnik stracił cel');
    if (galaz && !deleguje) bledy.push("§R6b: gałąź `heavyStrike` znów składa `pendingSwing` sama — P3.1 zostało cofnięte");

    // ⚠ Ta sama ścieżka daje ZA DARMO test zasięgu w chwili trafienia:
    // `damageLockedTarget` sprawdza `targetInReach` PONOWNIE, więc cel, który
    // odejdzie w trakcie zamachu, nie dostaje nic.
    const dlt = gs.slice(gs.indexOf("private damageLockedTarget"), gs.indexOf("private damageEnemiesInCircle"));
    const sprawdzaPonownie = dlt.includes("this.targetInReach(");
    console.log(`  ${sprawdzaPonownie ? "OK  " : "BŁĄD"} R6b. zasięg sprawdzany PONOWNIE w chwili trafienia (cel może odejść)`);
    if (!sprawdzaPonownie) bledy.push("§R6b: `damageLockedTarget` przestał sprawdzać zasięg — cel nie może już uciec przed ciosem");

    // ⚠ I zabezpieczenie, bez którego długi zamach ginie: autoatak nie może
    // nadpisać ciosu, który jeszcze nie wylądował.
    const ra = gs.slice(gs.indexOf("private resolveAttack"), gs.indexOf("private currentStrike"));
    const chroni = ra.includes("if (this.pendingSwing) return;");
    console.log(`  ${chroni ? "OK  " : "BŁĄD"} R6b. autoatak nie nadpisuje zamachu w locie`);
    if (!chroni) bledy.push("§R6b: `resolveAttack` może nadpisać `pendingSwing` — długi zamach zniknąłby po cichu, z opłaconym kosztem");
  }
  console.log();
}

/* ══════════════════════════════════════════════════════════════════════════
   §S. PCHNIĘCIE Z KROKIEM — `Wypad` (2026-08-25)
   ══════════════════════════════════════════════════════════════════════════
   Czwarta umiejętność na tym samym systemie celowania, wzorowana na Fiora Q.
   Dzieli archetyp z Szarżą i Ciężkim uderzeniem (`directionTarget`), ale ma
   dwie własności, których nie ma żadna z nich, i obie są tu pilnowane.

   S1. **Kształt** — miara zgodna z HIT-em, BRAK dolnej granicy, sufit 1.
   S2. **Styka się z Szarżą przy KAŻDEJ broni** — to jest racja bytu Wypadu:
       wypełnia martwą strefę 0–`charge.minRange`. Przejeżdża cały roster.
   S3. **Zasięg SKALUJE SIĘ z bronią** — inaczej `rangeReachMul` jest martwe.
   S4. **Typ obrażeń DZIEDZICZONY** — żadnej własnej broni w configu.
   S5. **Zwrot cooldownu** jest ułamkiem, a baza pozostaje wysoka. To jest
       mechanizm odgradzający od zaparkowanego auto-podchodzenia (`odlozone.md`
       §5), więc obniżenie bazy musi zapalić lampkę.
   S6. **Strażnik tekstowy: zwrot wisi na TRAFIENIU, nie na użyciu.** */
{
  console.log("§S. Pchnięcie z krokiem — `Wypad`:");
  const { resolveAbility, selectTargets, coversTarget, multiplierFor, isAimable } = AS;
  const l = CFG.ABILITIES.lunge;
  const charge = CFG.ABILITIES.charge;
  const STRIKE = { reach: 68 };
  const specL = resolveAbility("lunge", STRIKE);
  const sl = specL.shape;
  const O = { x: 0, y: 0 };
  const FRAME = { body: O, sprite: O };
  const PRAWO = { x: 1, y: 0 };
  const celPrzy = (id, gap, deg, r = 10) => {
    const rad = (deg * Math.PI) / 180;
    const d = gap + r;
    return { ref: id, body: { x: Math.cos(rad) * d, y: Math.sin(rad) * d, radius: r }, sprite: { x: Math.cos(rad) * d, y: Math.sin(rad) * d } };
  };

  /* ── S1. KSZTAŁT ────────────────────────────────────────────────────── */
  const s1 = [
    ["archetyp `directionTarget`", sl.kind === "directionTarget"],
    ["mierzy prześwitem, jak `targetInReach`", sl.metric === "surfaceGap"],
    // ⚠ To jest CAŁA treść tej umiejętności — patrz S2.
    ["BRAK dolnej granicy", sl.minRangePx === 0],
    ["sufit celów = 1", specL.maxTargets === 1],
    ["sektor akwizycji z configu", sl.acquisitionHalfDeg === l.acquisitionHalfDeg],
    ["mnożnik obrażeń = pokrętło z configu", multiplierFor(specL, "primary") === l.damageMultiplier],
    ["zadaje WŁASNE obrażenia (to nie jest krótka Szarża)", l.damageMultiplier > 1],
    ["`lunge` jest celowana", isAimable("lunge") === true],
  ];
  for (const [opis, ok] of s1) {
    console.log(`  ${ok ? "OK  " : "BŁĄD"} S1. ${opis}`);
    if (!ok) bledy.push(`§S1: ${opis} — nie zachodzi`);
  }

  /* ── S2. STYKA SIĘ Z SZARŻĄ PRZY KAŻDEJ BRONI ───────────────────────── */
  {
    // ⚠ **To jest racja bytu Wypadu, nie kosmetyka.** Jeśli przy jakiejkolwiek
    // broni jego zasięg nie sięga `charge.minRange`, zostaje pas, w którym nie
    // działa ANI Wypad, ANI Szarża — czyli dokładnie ta martwa strefa,
    // po zgłoszeniu której ta umiejętność powstała. Pierwsza wersja (`×2`)
    // zostawiała ją dla czterech broni z dziewięciu.
    const bronie = Object.entries(ITEMS)
      .map(([k, it]) => [k, it?.melee?.reach ?? it?.reach])
      .filter(([, r]) => typeof r === "number");
    const dziury = bronie.filter(([, r]) => r * l.rangeReachMul < charge.minRange);
    const ok = bronie.length > 0 && dziury.length === 0;
    const najkrotsza = bronie.reduce((a, b) => (b[1] < a[1] ? b : a));
    console.log(
      `  ${ok ? "OK  " : "BŁĄD"} S2. styka się z Szarżą przy ${bronie.length} broniach (najkrótsza: ${najkrotsza[0]} ${najkrotsza[1]} → ${(najkrotsza[1] * l.rangeReachMul).toFixed(0)} vs próg ${charge.minRange})`,
    );
    if (!bronie.length) bledy.push("§S2: nie znaleziono ani jednej broni z `reach` — strażnik przestał cokolwiek widzieć");
    for (const [k, r] of dziury) {
      bledy.push(`§S2: "${k}" (reach ${r}) daje Wypadowi ${(r * l.rangeReachMul).toFixed(0)} px przy progu Szarży ${charge.minRange} — zostaje martwa strefa, w której nie działa żadna z nich`);
    }
  }

  /* ── S3. ZASIĘG SKALUJE SIĘ Z BRONIĄ ─────────────────────────────────── */
  {
    const krotka = resolveAbility("lunge", { reach: 40 }).shape.maxRangePx;
    const dluga = resolveAbility("lunge", { reach: 98 }).shape.maxRangePx;
    const zgodny = sl.maxRangePx === STRIKE.reach * l.rangeReachMul;
    const ok = dluga > krotka && zgodny;
    console.log(`  ${ok ? "OK  " : "BŁĄD"} S3. zasięg z BRONI: reach 40 → ${krotka}, reach 98 → ${dluga}`);
    if (!zgodny) bledy.push("§S3: zasięg przestał być iloczynem `reach × rangeReachMul` — mnożnik jest martwy");
    if (dluga <= krotka) bledy.push("§S3: dłuższa broń nie daje dłuższego Wypadu — zniknęła cała różnica wobec Szarży");
  }

  /* ── S4. TYP OBRAŻEŃ DZIEDZICZONY ───────────────────────────────────── */
  {
    // ⚠ Wypad młotem musi być obuchem. Własny `damageType` w configu
    // odciąłby go od tożsamości rodzin broni — ta sama reguła, przez którą
    // Wir ostrzy nie tnie młotem. `knockback`/`interrupts`/`staggerMs` z tego
    // samego powodu: reguła zawężania mówi, że umiejętność może zdolność
    // odebrać, nigdy przyznać.
    const zakazane = ["damageType", "knockback", "interrupts", "staggerMs", "armorPen"];
    const dodane = zakazane.filter((k) => k in l);
    console.log(`  ${dodane.length === 0 ? "OK  " : "BŁĄD"} S4. typ obrażeń dziedziczony po broni${dodane.length ? " — dopisano: " + dodane.join(", ") : ""}`);
    if (dodane.length) bledy.push(`§S4: Wypad dostał własne (${dodane.join(", ")}) — przestał dziedziczyć po aktywnym wariancie broni`);
  }

  /* ── S5. ZWROT COOLDOWNU ────────────────────────────────────────────── */
  {
    const f = l.hitCooldownRefund;
    const par = [
      ["zwrot jest UŁAMKIEM w (0,1)", typeof f === "number" && f > 0 && f < 1],
      // ⚠ Baza jest jedyną rzeczą trzymającą Wypad po właściwej stronie
      // barierki „auto-podchodzenie do celu" (`docs/odlozone.md` §5): chybiony
      // kosztuje pełne `cooldown`. Zejście do rzędu sekund kasuje pościg jako
      // rozgrywkę — i to jest decyzja autora, nie strojenie przy okazji.
      ["baza NIE zeszła do rzędu sekund (≥10 s)", l.cooldown >= 10],
      ["po zwrocie zostaje realny cooldown (≥2 s)", l.cooldown * (1 - f) >= 2],
    ];
    for (const [opis, ok] of par) {
      console.log(`  ${ok ? "OK  " : "BŁĄD"} S5. ${opis}`);
      if (!ok) bledy.push(`§S5: ${opis} — nie zachodzi (cooldown ${l.cooldown} s, zwrot ${f})`);
    }
    console.log(`       (efektywnie po trafieniu: ${(l.cooldown * (1 - f)).toFixed(1)} s)`);
  }

  /* ── S6. ZWROT WISI NA TRAFIENIU ────────────────────────────────────── */
  {
    // ⚠ Własność SCENY, więc strażnik tekstowy — jak §P8 i §R6. Zwrot
    // naliczony przy naciśnięciu przeszedłby wszystkie testy czystych funkcji
    // i skasował całą różnicę między celnym wyprowadzeniem a machnięciem
    // w powietrze, czyli jedyną rzecz odgradzającą od §5 `odlozone.md`.

    /* ── DEKLARACJA PCHNIĘCIA (P3.5) ────────────────────────────────────
       Od migracji trzecia akcja tej klasy stoi w `PLAYER_ACTIONS.lunge`, więc
       §S6 czyta ją tak samo, jak §R6a czyta Ciężkie uderzenie: liczby MUSZĄ być
       odczytem `ABILITIES.lunge`, nie kopią. ⚠ Wypad jest jedynym wpisem
       z polityką `weaponTempo` i to jest cała treść jego odrębności — patrz
       `ActionRoot`. */
    const tmpPAL = join(KORZEN, ".tmp_playeraction_s6.mjs");
    await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/combat/PlayerAction.ts")], outfile: tmpPAL, alias: { phaser: stubPhaser } });
    const PAL = await import(pathToFileURL(tmpPAL).href);
    await unlink(tmpPAL).catch(() => {});
    const akcjaL = PAL.PLAYER_ACTIONS?.lunge;
    if (!akcjaL) bledy.push("§S6: brak `PLAYER_ACTIONS.lunge` — strażnik stracił cel, a nie kod się naprawił.");
    const deklaracja = [
      ["deklaracja `lunge` istnieje", !!akcjaL],
      ["adres wskazuje na `lunge`", akcjaL?.id === "lunge"],
      [`windup = ${l.windupMs} ms, ODCZYTANY z \`ABILITIES.lunge\``, akcjaL?.windupMs === l.windupMs],
      // ⚠ Właścicielem mnożnika jest `AbilitySpec` (P3.4) — deklaracja go NIE kopiuje.
      ["deklaracja NIE kopiuje mnożnika ani kosztów", !!akcjaL && !("damageMul" in akcjaL) && !("cooldownMs" in akcjaL) && !("staminaCost" in akcjaL)],
      [`mnożnik ×${l.damageMultiplier} zamrożony w \`AbilitySpec\` (resolver)`, Math.abs(multiplierFor(specL, "primary") - l.damageMultiplier) < 1e-9],
      // ⚠ Jeden rzut rozstrzyga o OBU nagrodach, więc fuszerka kasowałaby obie.
      ["NIE fuszeruje (`allowFumble: false`)", akcjaL?.allowFumble === false],
      // ⚠ Pchnięcie wyprowadza oręż — inaczej niż Uderzenie tarczą.
      ["ZUŻYWA broń (cios wyprowadza oręż)", akcjaL?.wearsWeapon === true],
      /* ⚠ **`weaponTempo`, i to jest asercja przeciw WYMYŚLONEJ LICZBIE.**
         `ABILITIES.lunge` nie ma `recoveryMs`; zejście na `windupPlusRecovery`
         znaczyłoby, że ktoś tę liczbę dopisał — czyli zmienił ukorzenienie
         pchnięcia, nie migrację. */
      ["ukorzenienie z TEMPA BRONI (`weaponTempo`, zero nowych liczb)", akcjaL?.root?.kind === "weaponTempo"],
      ["deklaracja NIE ma płaskiego `recoveryMs`", !!akcjaL && !("recoveryMs" in akcjaL)],
      /* ⚠ **Zwrot cooldownu bez `id` — patrz `ActionOnHit`.** Do P3.5 gałąź
         wpisywała `id: "lunge"` ręcznie; adres dokłada dziś wykonawca
         z `action.id`, więc drugie źródło prawdy o właścicielu cooldownu
         zniknęło i nie ma prawa wrócić. */
      [
        "zwrot cooldownu NIE nosi własnego `id` (adres dokłada wykonawca)",
        Array.isArray(akcjaL?.onHit) && akcjaL.onHit.every((e) => e?.kind !== "refundCooldown" || !("id" in e)),
      ],
    ];
    for (const [opis, ok] of deklaracja) {
      console.log(`  ${ok ? "OK  " : "BŁĄD"} S6. ${opis}`);
      if (!ok) bledy.push(`§S6: ${opis} — nie zachodzi`);
    }

    const gs = await readFile(join(KORZEN, "src/scenes/GameScene.ts"), "utf8");
    /* ⚠ **Wycinek przez `wycinekGalezi` (P3.5), nie `indexOf('case "charge":')`.**
       Ta sama poprawka i ten sam powód co w §R6b: kotwica na KONKRETNEJ
       następnej gałęzi znaczy, że przestawienie `case`-ów daje `-1`, a wtedy
       `slice(i, -1)` obejmuje cały ogon pliku i strażnik ocenia cudzy kod. */
    const ciało = wycinekGalezi(gs, 'case "lunge":');
    /* ⚠ **PRZEKOTWICZONE (P3.5).** Do migracji gałąź trzymała cały plan ciosu
       (`windupMs`, mnożnik, `onHit`) literałem i strażnik szukał w niej słowa
       `onHit:`. Dziś gałąź ma ODDAĆ deklarację, a nagrody stoją
       w `PLAYER_ACTIONS.lunge` — pytanie rozpada się więc na dwa: czy gałąź
       nadal odkłada cios na koniec lotu i czy oddaje go DEKLARACJĄ, a nie
       przepisanymi liczbami. */
    const odklada = ciało.includes("arrival: \"strike\"") && /action: PLAYER_ACTIONS\.lunge/.test(ciało);
    const bezPrzepisanychLiczb = !/windupMs:\s*l\./.test(ciało) && !/damageMul:/.test(ciało);
    const natychmiast = ciało.includes("damageMatchingEnemies(") || ciało.includes("damageLockedTarget(");
    const zwracaWGalezi = ciało.includes("refundCooldown(") || ciało.includes("this.autoAttackArmed = true");
    /* ⚠ Obie nagrody czytamy dziś z DEKLARACJI (zmienna `akcjaL` niżej), bo tam
       się przeniosły. Zmienna jest ustawiana przed tym blokiem. */
    const obieNagrody =
      Array.isArray(akcjaL?.onHit)
      && akcjaL.onHit.some((e) => e?.kind === "refundCooldown" && e.fraction === l.hitCooldownRefund)
      && akcjaL.onHit.some((e) => e?.kind === "armAutoAttack");
    // ⚠ Kotwica na `private damageCurrentTarget` ROZPADŁA SIĘ — ta metoda już
    // nie istnieje, więc wycinek obejmował całą resztę pliku (patrz
    // `cialoMetody`). Zakres liczy się teraz do następnego nagłówka.
    const rps = cialoMetody(gs, "private resolvePendingSwing");
    if (!rps) bledy.push("§S6: nie znaleziono `resolvePendingSwing` — strażnik przestał cokolwiek widzieć");
    // ⚠ Oba efekty muszą siedzieć POD `anyHit`, nie obok niego. Wyciągnięcie
    // któregokolwiek przed ten warunek jest zmianą, której nie widać w niczym
    // poza rozgrywką: nagroda przestaje zależeć od tego, czy cios wszedł.
    const podAnyHit = /if \(swing\.onHit && anyHit\)/.test(rps);
    const zwrotNaTrafieniu = rps.includes("refundCooldown(") && podAnyHit;
    const natarcieNaTrafieniu = rps.includes("this.autoAttackArmed = true") && podAnyHit;

    /* ── WYKONAWCA NA DOBIEGNIĘCIU (P3.5) ───────────────────────────────
       ⚠ Wypad ma DRUGIEGO wykonawcę deklaracji — `landRushStrike`, składający
       cios na dobiegnięciu, a nie na naciśnięciu. Strażnik pyta o to samo, co
       §R6b pyta o `commitPlayerAction`: czy honoruje deklarację, zamiast mieć
       własne liczby. ⚠ Bez asercji o `rootMs` polityka `weaponTempo` byłaby
       deklaracją, której nikt nie czyta — dokładnie ta pułapka, w którą wpadło
       `wearsWeapon` w P3.2 i którą wykryło CELOWE ZEPSUCIE, nie lektura. */
    const lrs = cialoMetody(gs, "private landRushStrike(");
    const bierzeAkcje = /action: PlayerAction/.test(lrs);
    const zDeklaracjiWindup = /resolveAt: now \+ action\.windupMs/.test(lrs);
    const pytaOZuzycieL = /if \(action\.wearsWeapon\) this\.wearWeapon\(\)/.test(lrs);
    const politykaRoot = /rootMs: rootMsDlaAkcji\(action\)/.test(lrs);
    const mnoznikZResolvera = /damageMul: multiplierFor\(resolveAbility\(action\.id, strike\), "primary"\)/.test(lrs);
    const nagrodyZDeklaracji = /onHit: onHitDlaSwingu\(action\)/.test(lrs);
    const wykonawca = [
      ["`landRushStrike` bierze DEKLARACJĘ (`PlayerAction`), nie doraźny plan", bierzeAkcje],
      ["opóźnienie z `action.windupMs`", zDeklaracjiWindup],
      ["ZUŻYWA BROŃ tylko wtedy, gdy akcja to deklaruje", pytaOZuzycieL],
      ["ukorzenienie przez `rootMsDlaAkcji(action)` (polityka, nie stała)", politykaRoot],
      ["mnożnik z `AbilitySpec`, nie z deklaracji", mnoznikZResolvera],
      ["nagrody przez `onHitDlaSwingu(action)` (adres z `action.id`)", nagrodyZDeklaracji],
      /* ⚠ **Domknięcie pętli po adresie cooldownu.** Deklaracja go NIE nosi
         (asercja wyżej), więc gdyby tłumacz brał `id` skądkolwiek indziej —
         albo z pierwszej lepszej stałej — zwrot poszedłby pod cudzy cooldown
         i żadna z pozostałych asercji by tego nie zobaczyła. */
      [
        "tłumacz nagród bierze adres zwrotu z `action.id`",
        /skutki\.refund = \{ id: action\.id, fraction: efekt\.fraction \}/.test(gs),
      ],
    ];
    if (!lrs) bledy.push("§S6: nie znaleziono `landRushStrike` — strażnik przestał cokolwiek widzieć");
    for (const [opis, ok] of wykonawca) {
      console.log(`  ${ok ? "OK  " : "BŁĄD"} S6. ${opis}`);
      if (!ok) bledy.push(`§S6: ${opis} — nie zachodzi`);
    }

    console.log(`  ${odklada ? "OK  " : "BŁĄD"} S6. gałąź odkłada pchnięcie na koniec lotu (\`arrival: "strike"\` + oddana deklaracja)`);
    console.log(`  ${bezPrzepisanychLiczb ? "OK  " : "BŁĄD"} S6. gałąź NIE przepisuje liczb ciosu (czasy i mnożnik są w deklaracji)`);
    if (!bezPrzepisanychLiczb) bledy.push("§S6: gałąź `lunge` znów trzyma liczby ciosu — wróciło drugie źródło prawdy obok `PLAYER_ACTIONS.lunge` (P3.5 cofnięte)");
    console.log(`  ${!natychmiast ? "OK  " : "BŁĄD"} S6. gałąź NIE zadaje obrażeń w chwili puszczenia palca`);
    console.log(`  ${!zwracaWGalezi ? "OK  " : "BŁĄD"} S6. gałąź NIE nagradza sama (nagroda należy do trafienia)`);
    console.log(`  ${obieNagrody ? "OK  " : "BŁĄD"} S6. trafienie daje OBIE nagrody: zwrot cooldownu i utrzymane natarcie`);
    console.log(`  ${zwrotNaTrafieniu ? "OK  " : "BŁĄD"} S6. zwrot naliczany w \`resolvePendingSwing\`, pod warunkiem \`anyHit\``);
    console.log(`  ${natarcieNaTrafieniu ? "OK  " : "BŁĄD"} S6. autoatak uzbrajany tamże, pod tym samym warunkiem`);
    if (!ciało) bledy.push("§S6: nie znaleziono gałęzi `lunge` w GameScene — strażnik przestał cokolwiek widzieć");
    if (!odklada) bledy.push("§S6: Wypad nie odkłada pchnięcia na koniec lotu — zniknął cały rytm skok→cios");
    if (natychmiast) bledy.push("§S6: gałąź zadaje obrażenia od razu — cios oderwał się od dobiegnięcia");
    if (zwracaWGalezi) bledy.push("§S6: gałąź nagradza przy UŻYCIU — chybiony Wypad przestał kosztować pełne 14 s, czyli wpadliśmy w §5 `odlozone.md`");
    if (!obieNagrody) bledy.push("§S6: trafienie przestało dawać obie nagrody naraz — umiejętność rozmyła się na dwa osobne rozstrzygnięcia");
    if (!zwrotNaTrafieniu) bledy.push("§S6: `resolvePendingSwing` nie wiąże zwrotu z `anyHit` — nagroda przestała zależeć od trafienia");
    if (!natarcieNaTrafieniu) bledy.push("§S6: autoatak nie jest uzbrajany pod `anyHit` — Wypad znów kończy się jednym pchnięciem i postoju przy wrogu");

    /* ── S7. DWA UŻYCIA: wymiana i PRZEMIESZCZENIE ─────────────────────── */
    // ⚠ **Brak celu nie może być odmową.** Skok w pustkę jest drugim
    // pełnoprawnym użyciem (unik, ucieczka, repozycja) i JEDYNĄ rzeczą, która
    // nadaje sens bazie `cooldown`: przy bramce celu gałąź walidowała zasięg,
    // lot dolatywał niemal zawsze, a cel miał tylko `windupMs` na ucieczkę —
    // czyli zwrot 60% był w praktyce bezwarunkowy i baza była ozdobą.
    // Bramka „Wypad potrzebuje celu" istniała naprawdę i została zdjęta
    // 2026-08-25; ten strażnik pilnuje, żeby nie wróciła po cichu.
    const odmawiaBezCelu = /sayAtPlayer\(\s*"[^"]*potrzebuje celu/.test(ciało);
    const maPrzemieszczenie = ciało.includes('kind: "dash"');
    // Wariant przemieszczenia nie może nieść nagród — gdyby niósł, obie drogi
    // kosztowałyby tyle samo i cała wycena by zniknęła.
    const i2 = ciało.indexOf('kind: "dash"');
    const wariantDash = i2 === -1 ? "" : ciało.slice(i2);
    const dashNagradza = wariantDash.includes("onHit") || wariantDash.includes("refund");

    console.log(`  ${!odmawiaBezCelu ? "OK  " : "BŁĄD"} S7. brak celu NIE jest odmową`);
    console.log(`  ${maPrzemieszczenie ? "OK  " : "BŁĄD"} S7. istnieje wariant przemieszczenia (\`kind: "dash"\`)`);
    console.log(`  ${!dashNagradza ? "OK  " : "BŁĄD"} S7. przemieszczenie NIE dostaje nagród — płaci pełny cooldown`);
    if (odmawiaBezCelu) bledy.push("§S7: Wypad znów odmawia bez celu — wraca bramka celu, przez którą zwrot 60% jest bezwarunkowy, a baza `cooldown` ozdobą");
    if (!maPrzemieszczenie) bledy.push("§S7: zniknął wariant przemieszczenia — Wypad przestał być czymkolwiek poza dojściem do wroga");
    if (dashNagradza) bledy.push("§S7: skok bez celu dostaje nagrodę za trafienie — obie drogi kosztują tyle samo, wycena mobilności znika");

    /* ── S8. NIE PRZENIKA PRZEZ PRZESZKODY ──────────────────────────────────
       ⚠⚠ **Zgłoszenie z rozgrywki 2026-09-04: „Wypad przenika przez
       przeszkody".** Przyczyna była ILOŚCIOWA, nie logiczna: gracz ma collider
       ze `solids`, ale Arcade nie ma kolizji ciągłej, a ten skok leci
       **900 px/s = 15 px na krok fizyki 60 Hz** przy pudełku pnia głębokim na
       **13–15 px** (`TreeStampManifest`). Ciało startowało przed pniem
       i lądowało za nim, **nie nakładając się na niego w żadnej klatce** —
       fizyka nie miała czego wykryć.

       Dlatego warunek musi paść PRZY WYBORZE CELU, i dlatego ten strażnik pyta
       o dwie rzeczy naraz: czy siatka faktycznie odróżnia tor przecięty od
       wolnego (funkcjonalnie) **i** czy wykonanie z niej korzysta na OBU
       drogach wyboru celu (tekstowo — jak §S6 i §P8).

       ⚠ Sam podgląd NIE WYSTARCZA i to jest treść tego wpisu: gracz może
       nacisnąć umiejętność bez przeciągnięcia, więc ścieżka tapnięcia musi mieć
       ten sam warunek co przeciągnięcie. */
    {
      // ── Funkcjonalnie: PRAWDZIWY `NavGrid`, prawdziwa szerokość ciała ────
      const sciana = [{ x: 200, y: 100, w: 16, h: 200 }];
      const tmpNav = join(KORZEN, '.tmp_navgrid_s8.mjs');
      await build({ ...wspolne, entryPoints: [join(KORZEN, 'src/core/movement/NavGrid.ts')], outfile: tmpNav, alias: { phaser: stubPhaser } });
      const NAVG = await import(pathToFileURL(tmpNav).href);
      await unlink(tmpNav).catch(() => {});
      const nav = NAVG.NavGrid.build(sciana, 600, 600);
      const bodyW = CFG.PLAYER.bodyWidth;
      const zaScianą = !nav.hasClearLine(120, 200, 320, 200, bodyW);
      const obokSciany = nav.hasClearLine(120, 40, 320, 40, bodyW);
      // ⚠ Głębokość ściany (16 px) jest MNIEJSZA niż krok fizyki skoku
      // (900 px/s / 60 Hz = 15 px)… i to jest właśnie ten przypadek, którego
      // Arcade nie łapie. Siatka musi go łapać niezależnie od głębokości.
      const krokPx = CFG.ABILITIES.lunge.speedPxPerSec / 60;
      const tunelowanieMozliwe = krokPx >= sciana[0].w - 1;

      // ── Tekstowo: wykonanie pyta o tor na OBU drogach ────────────────────
      const flaga = CFG.ABILITIES.lunge.requiresClearPath === true;
      const maPredykat = /private pathClearTo\(/.test(gs);
      const predykatPytaSiatke = /pathClearTo\([\s\S]{0,700}?hasClearLine\(/.test(gs);
      // ⚠ Liczone w GAŁĘZI `case "lunge"`, nie w całym pliku: dwie drogi wyboru
      // celu (przeciągnięcie i tapnięcie) muszą mieć ten warunek OSOBNO.
      const wolaniaWGalezi = (ciało.match(/pathClearTo\(/g) ?? []).length;
      const podgladFiltruje = /aimCandidatesFor\(/.test(gs) && /requiresClearPath/.test(gs);
      const bezNazwyUmiejetnosci = !/requiresClearPath[\s\S]{0,200}?id === "lunge"/.test(gs);

      const par = [
        ["S8. cel ZA ścianą: siatka mówi „tor przecięty\"", zaScianą],
        ["S8. tor obok ściany: siatka mówi „wolne\" (strażnik nie blokuje wszystkiego)", obokSciany],
        [`S8. …i ściana jest CIEŃSZA niż krok fizyki skoku (${krokPx.toFixed(1)} px) — czyli Arcade by ją przepuścił`, tunelowanieMozliwe],
        ["S8. `CFG.ABILITIES.lunge.requiresClearPath` włączone", flaga],
        ["S8. istnieje predykat `pathClearTo`", maPredykat],
        ["S8. …i pyta `NavGrid.hasClearLine`, a nie własnej kolizji", predykatPytaSiatke],
        ["S8. ⭐ WYKONANIE pyta o tor na OBU drogach (przeciągnięcie i tapnięcie)", wolaniaWGalezi >= 2],
        ["S8. podgląd odsiewa TYM SAMYM warunkiem (`aimCandidatesFor` + flaga)", podgladFiltruje],
        ["S8. rozgałęzienie po DANEJ, nie po nazwie umiejętności", bezNazwyUmiejetnosci],
      ];
      for (const [opis, ok] of par) {
        console.log(`  ${ok ? "OK  " : "BŁĄD"} ${opis}`);
        if (!ok) bledy.push(`§S8: ${opis} — nie zachodzi`);
      }
    }

    /* ── S9. SKOK KIERUNKOWY TEŻ NIE PRZENIKA ───────────────────────────────
       ⚠⚠ **Zgłoszenie z rozgrywki: „Krok i Cios przenika przez trzy drzewa" —
       JUŻ PO wdrożeniu §S8.** §S8 zabezpieczył wyłącznie POŚCIG, a zablokowany
       cel schodzi u Wypadu do **skoku kierunkowego** — i tamta gałąź nie pytała
       o teren w ogóle. Poprawka §S8 zwiększyła więc częstość objawu, zamiast go
       usunąć: cel za drzewem przestał być legalny, więc zawsze lądowaliśmy
       w gałęzi, która tuneluje.

       ⚠ To jest ta sama klasa błędu co §S8 (brak CCD przy 15 px na krok), tylko
       druga gałąź. Strażnik pilnuje, żeby **obie** drogi lotu pytały o teren. */
    {
      const bezKom = bezKomentarzyP(ciało);
      const i2 = bezKom.indexOf('kind: "dash"');
      // Okno OD początku gałęzi DO zapisu skoku: skrócenie lotu musi być
      // policzone przed nim, nie po.
      const przedDashem = i2 === -1 ? "" : bezKom.slice(0, i2);
      const pytaTeren = /firstBlockedOn\(/.test(przedDashem);
      // ⚠ **Sprawdzamy POŁĄCZENIE, nie nazwę — poprawka z próby sabotażu.**
      // Pierwsza wersja pytała tylko o `Math.min(lotDoPrzeszkody` i przeszła,
      // gdy tę zmienną podmieniono na pełny `lotMs`. Nazwa nic nie dowodzi;
      // dowodzi łańcuch: wynik zapytania → dystans → czas lotu → `endsAt`.
      const dystansZBloku = /dystans = Math\.min\(zasieg, Math\.hypot\(blok/.test(bezKom);
      const czasZDystansu = /lotDoPrzeszkody = \(dystans \/ l\.speedPxPerSec\)/.test(bezKom);
      const skracaLot = dystansZBloku && czasZDystansu && /endsAt: now \+ Math\.min\(lotDoPrzeszkody/.test(bezKom);
      // ⚠ Prędkość i kierunek mają zostać NIETKNIĘTE — naprawa jest w CZASIE.
      // Gdyby ktoś „naprawił" to zwolnieniem skoku, ten strażnik ma milczeć,
      // a §S3/§S1 zapalić się na zmianie liczb; tutaj pilnujemy tylko, że
      // gałąź nie przestała używać prędkości z configu.
      const prędkośćZConfigu = /speed: l\.speedPxPerSec/.test(bezKom);

      const par9 = [
        ["S9. ⭐ gałąź skoku kierunkowego PYTA o teren przed startem", pytaTeren],
        ["S9. …i skraca LOT do punktu przecięcia (naprawa w czasie, nie w mechanice)", skracaLot],
        ["S9. prędkość skoku dalej z configu — nic nie „naprawiono\" zwolnieniem", prędkośćZConfigu],
      ];
      for (const [opis, ok] of par9) {
        console.log(`  ${ok ? "OK  " : "BŁĄD"} ${opis}`);
        if (!ok) bledy.push(`§S9: ${opis} — nie zachodzi`);
      }

      /* ── S10. PODGLĄD WYPADU NIE OBIECUJE KROKU ZA DRZEWO ────────────────
         ⚠ Zgłoszenie z rozgrywki: „pokazujesz ścieżkę za drzewem, jakby tam
         krok był możliwy". Wykonanie skracało już skok (§S9), ale PODGLĄD
         rysował biały pas do pełnego zasięgu — bo `blockAtPx` liczyło się
         tylko dla języka Szarży (`lane`), pod bramką „tylko `lane` ma czym
         pokazać ✕". Błąd w rozumowaniu: przeszkoda ogranicza nie tylko ✕, ale
         przede wszystkim DŁUGOŚĆ PASA. Podgląd kłamał wobec własnego kodu. */
      const ap = await readFile(join(KORZEN, "src/ui/AimPreview.ts"), "utf8");
      const reach = bezKomentarzyP(cialoMetody(ap, "  private drawReach<T>("));
      const extras = bezKomentarzyP(cialoMetody(gs, "  private aimExtras("));
      // Łańcuch, nie nazwa: blokada → skrócona długość → rysunek.
      const skracaPas = /doPrzeszkody = info\.blockAtPx !== null \? Math\.min\(dlugosc, info\.blockAtPx\)/.test(reach);
      const rysujeSkrocony = /laneFill\([^)]*doPrzeszkody/.test(reach.replace(/\s+/g, " "));
      const bezBramkiStylu = !/zPrzeszkoda/.test(extras);

      const par10 = [
        ["S10. ⭐ pas Wypadu SKRACA się do punktu przecięcia", skracaPas],
        ["S10. …i to skrócona długość trafia do rysunku, nie pełny zasięg", rysujeSkrocony],
        ["S10. przeszkoda liczona dla OBU języków (zniknęła bramka „tylko lane\")", bezBramkiStylu],
      ];
      for (const [opis, ok] of par10) {
        console.log(`  ${ok ? "OK  " : "BŁĄD"} ${opis}`);
        if (!ok) bledy.push(`§S10: ${opis} — nie zachodzi`);
      }
    }
  }
  console.log();
}

/* ══════════════════════════════════════════════════════════════════════════
   §T. UDERZENIE TARCZĄ — `Shield Bash`  (projekt: `docs/systemy/abilities.md`)
   ══════════════════════════════════════════════════════════════════════════
   ⚠ **TA SEKCJA POWSTAŁA PRZED IMPLEMENTACJĄ I MA ŚWIECIĆ NA CZERWONO.**
   Kolejność uzgodniona 2026-08-26: test → implementacja → zielono → playtest.
   Dopóki umiejętności nie ma, §T zgłasza BŁĄD — i to jest jej stan poprawny.

   ⚠ **Każda sonda jest ostrożna (`?.`, `try`, testy istnienia).** Sekcja
   pisana pod nieistniejący kod nie może rzucić wyjątkiem, bo zabrałaby ze sobą
   §A–§S. Brak rzeczy ma być RAPORTEM, nie stack trace'em — to jest ta sama
   reguła, co „asercja, która nie potrafi zaświecić na czerwono, jest
   dekoracją", tylko z drugiej strony.

   T0. **Umiejętność istnieje** i jest celowana.
   T1. **Kształt** — `directionTarget` + `surfaceGap`, sufit 1, BRAK dolnej
       granicy. Ta sama rodzina co Wypad i Ciężkie uderzenie.
   T2. **Walutą jest CZAS, nie obrażenia.** Mnożnik musi zostać poniżej
       autoataku — powyżej 1,0 umiejętność zjada niszę Ciężkiego uderzenia
       i przestaje mieć rację bytu (`docs/systemy/abilities.md`).
   T3. **Wymaga tarczy.** To NIE jest smaczek fabularny: bramka jest jedyną
       rzeczą utrzymującą regułę zawężania (przerwanie przychodzi z NARZĘDZIA,
       a nie z umiejętności — §1.3 R8). Bez niej trzeba wrócić do projektu.
   T4. **Ogłuszenie jest OSOBNYM stanem**, nie przedłużonym `knockedBackUntil`.
       Trzy systemy na jednym ciele mają mieć jawny priorytet (§1.3 R3).
   T5. **ANTY-CATCH-UP — najważniejsza asercja tej sekcji (§1.3 R1).**
       `knockedBackUntil` nie zatrzymuje `ActionRunner`a: runner tyka wewnątrz
       `updateChase`, a jego terminy są BEZWZGLĘDNE. Zawieszenie stworzenia nie
       pauzuje jego akcji — pierwszy tik po oknie odpala zaległe przejścia
       naraz. Dzik ogłuszony w telegraf bodzie w klatce, w której ogłuszenie
       mija. **Test pokazuje OBIE ścieżki obok siebie** (jak §O5): samo
       zawieszenie → `active`; kasowanie → `idle`.
   T6. **Okno ogłuszenia nie stoi na KLIFIE.** Zmierzone na żywym rosterze:
       przy 900 ms najbliższe trafienie wypada 5 ms od końca ogłuszenia, więc
       liczba darmowych ciosów zależy od tego, którą broń niesiesz, i przewraca
       się na pojedynczych milisekundach. Taka liczba nie nadaje się do
       strojenia ręką — ten projekt zna tę pułapkę z `SHIELD.blockArcDeg`
       i z `hud_uklad.mjs` („dwie liczby, które mają być równe, nie nadają się
       na próg”). ⚠ **Ten test NIE mówi, ile ma trwać ogłuszenie** — mówi
       tylko, że wybrana wartość jest MIERZALNA. 700 i 1000 przechodzą,
       800/900/1100 nie.
   T7. **Kontrola wisi na TRAFIENIU, nie na użyciu** — i nie odpala się na
       trupie. Strażnik tekstowy, jak §S6 i §R6. */
{
  console.log("§T. Uderzenie tarczą — `Shield Bash`:");
  const { resolveAbility, isAimable, multiplierFor } = AS;
  const sb = CFG.ABILITIES?.shieldBash;

  /* ── T0. ISTNIENIE ──────────────────────────────────────────────────── */
  {
    const par = [
      ["`ABILITIES.shieldBash` istnieje", !!sb],
      ["jest celowana (`isAimable`)", isAimable("shieldBash") === true],
    ];
    for (const [opis, ok] of par) {
      console.log(`  ${ok ? "OK  " : "BŁĄD"} T0. ${opis}`);
      if (!ok) bledy.push(`§T0: ${opis} — nie zachodzi (umiejętność jeszcze nie istnieje: to jest oczekiwany stan czerwony przed implementacją)`);
    }
  }

  /* ── T1/T2. KSZTAŁT I TOŻSAMOŚĆ ─────────────────────────────────────── */
  {
    let spec = null;
    try {
      spec = resolveAbility("shieldBash", { reach: 68 }) ?? null;
    } catch {
      spec = null; // brak `case` w `resolveAbility` — łapiemy, nie wywalamy uprzęży
    }
    const sh = spec?.shape ?? null;
    const par = [
      ["`resolveAbility` zna `shieldBash`", !!spec],
      ["archetyp `directionTarget`", sh?.kind === "directionTarget"],
      // ⚠ NIEGOCJOWALNE: `targetInReach` mierzy prześwitem, więc podgląd musi
      // mierzyć tak samo. Inna miara = podgląd mówi „w zasięgu", a cios
      // odpowiada „za daleko" (`AbilitySpec.ts`, `metric`).
      ["mierzy prześwitem (`surfaceGap`), jak HIT", sh?.metric === "surfaceGap"],
      ["BRAK dolnej granicy (melee nie zna „za blisko”)", sh?.minRangePx === 0],
      ["sufit celów = 1 (to nie jest AoE hard CC)", spec?.maxTargets === 1],
      // ⚠ `typeof` jest konieczne: `undefined === undefined` przechodziło,
      // gdy NIE BYŁO ani umiejętności, ani kształtu. Asercja spełniona
      // pustką jest gorsza niż czerwona — nie zapala się, gdy powinna.
      [
        "sektor akwizycji z configu",
        typeof sb?.acquisitionHalfDeg === "number" && sh?.acquisitionHalfDeg === sb.acquisitionHalfDeg,
      ],
      // ⚠ Zasięg TARCZY, nie broni: włócznik nie ma prawa uderzać tarczą
      // z 98 px. Dlatego liczba jest własna, a nie `strike.reach`.
      // ⚠ **ODWRÓCONE 2026-08-26 — poprzednio stało tu „zasięg WŁASNY,
      // krótszy niż zasięg broni".** Ta asercja pilnowała decyzji, którą
      // rozgrywka obaliła: krótszy zasięg nie był kosztem, tylko martwym
      // pasmem 8–50 px (51% zasięgu włóczni), w którym autoatak trafia,
      // a umiejętność odmawia. **Zasada autora: jeśli trafiasz kogoś
      // autoatakiem, trafiasz go też umiejętnością na tym celu.**
      ["zasięg RÓWNY zasięgowi broni (§T1a niżej sprawdza to na całym rosterze)", sh?.maxRangePx === 68],
      // ── T2. waluta ────────────────────────────────────────────────────
      ["mnożnik obrażeń PONIŻEJ autoataku (waluta = czas, nie DPS)", typeof sb?.damageMultiplier === "number" && sb.damageMultiplier < 1],
    ];
    for (const [opis, ok] of par) {
      console.log(`  ${ok ? "OK  " : "BŁĄD"} T1. ${opis}`);
      if (!ok) bledy.push(`§T1: ${opis} — nie zachodzi`);
    }
  }

  /* ── T1a. ZASIĘG NADĄŻA ZA BRONIĄ — CAŁY ROSTER ─────────────────────── */
  {
    // ⚠ **To jest zasada ogólna, nie liczba Shield Basha.** Zgłoszona
    // z rozgrywki 2026-08-26: *„jeśli biję kogoś autoatakiem, powinienem go
    // trafić skillami, które są na domyślnie wybranym celu"*. Umiejętność
    // jednocelowa, która odmawia w stanie, gdzie zwykły cios trafia, czyta się
    // jak zepsuty przycisk — a nie jak koszt.
    //
    // Przemiata CAŁY roster broni, więc **nowa broń o nietypowym zasięgu
    // zaświeci tu sama** — dokładnie jak §S2 pilnuje styku Wypadu z Szarżą.
    const bronie = Object.entries(ITEMS)
      .map(([k, it]) => [k, it?.melee?.reach])
      .filter(([, r]) => typeof r === "number");
    const krotsze = [];
    for (const [k, r] of bronie) {
      const zasieg = resolveAbility("shieldBash", { reach: r })?.shape?.maxRangePx;
      if (!(typeof zasieg === "number") || zasieg < r) krotsze.push(`${k} (broń ${r} → skill ${zasieg})`);
    }
    const ok = bronie.length > 0 && krotsze.length === 0;
    console.log(`  ${ok ? "OK  " : "BŁĄD"} T1a. zasięg nadąża za bronią przy ${bronie.length} broniach`);
    if (!bronie.length) bledy.push("§T1a: nie znaleziono ani jednej broni z `reach` — strażnik przestał cokolwiek widzieć");
    for (const w of krotsze) {
      bledy.push(
        `§T1a: ${w} — umiejętność sięga KRÓCEJ niż autoatak, czyli powstaje martwe pasmo, ` +
        `w którym zwykły cios trafia, a skill na tym samym celu odmawia. Zmierzone przy pierwszej wersji ` +
        `(48 px na sztywno): 8–50 px, aż 51% zasięgu włóczni.`,
      );
    }
  }

  /* ── T1b. PODGLĄD I COMMIT MIERZĄ TYM SAMYM ─────────────────────────── */
  {
    // ⚠ **Strażnik napisany PO fakcie — ta wada była żywa i nikt jej nie
    // widział (2026-08-26).** `updateAimPreview` rozstrzyga KAŻDĄ umiejętność
    // przez `currentStrike()`, czyli zasięg BRONI. Gdy gałąź umiejętności
    // liczy zasięg inaczej (Shield Bash miał własne 48 px), przy
    // przeciągnięciu palcem podgląd podświetla cel jako legalny, a commit
    // odrzuca go **cichym `return`** — bez komunikatu, bez cooldownu.
    // Na dotyku martwy przycisk jest nieodróżnialny od zepsutego.
    //
    // ⚠ Testy czystych funkcji tego NIE złapią: obie strony wołają ten sam
    // `resolveAbility`, tylko karmią go innym `strike`. Dlatego strażnik jest
    // tekstowy i pyta o ŹRÓDŁO liczby.
    const gs = await readFile(join(KORZEN, "src/scenes/GameScene.ts"), "utf8");
    const podglad = cialoMetody(gs, "private updateAimPreview");
    const profil = cialoMetody(gs, "private shieldStrike");
    const podgladMierzyBronia = /resolveAbility\(a\.id, this\.currentStrike\(\)\)/.test(podglad);
    // Ta sama liczba co `currentStrike().reach`, a nie stała z configu.
    const profilZBroni = /reach:\s*Progression\.attackReach/.test(profil);
    const bezStalej = !/reach:\s*[A-Za-z]*\.?reachPx/.test(profil);

    console.log(`  ${podgladMierzyBronia ? "OK  " : "BŁĄD"} T1b. podgląd rozstrzyga przez \`currentStrike()\``);
    console.log(`  ${profilZBroni && bezStalej ? "OK  " : "BŁĄD"} T1b. \`shieldStrike()\` bierze zasięg z \`Progression.attackReach\``);
    if (!podglad) bledy.push("§T1b: nie znaleziono `updateAimPreview` — strażnik przestał cokolwiek widzieć");
    if (!profil) bledy.push("§T1b: nie znaleziono `shieldStrike` — strażnik przestał cokolwiek widzieć");
    if (podglad && !podgladMierzyBronia) {
      bledy.push("§T1b: podgląd przestał mierzyć `currentStrike()` — jeśli to zamierzone, ta sekcja musi zmienić się RAZEM z nim, bo inaczej przestaje pilnować czegokolwiek");
    }
    if (profil && !(profilZBroni && bezStalej)) {
      bledy.push(
        "§T1b: `shieldStrike()` liczy zasięg inaczej niż `currentStrike()` — podgląd podświetli cel, " +
        "którego commit odrzuci CICHYM `return` (bez komunikatu i bez cooldownu). Ta wada była żywa 2026-08-26.",
      );
    }
  }

  /* ── T3. WYMAGA TARCZY ──────────────────────────────────────────────── */
  {
    const gs = await readFile(join(KORZEN, "src/scenes/GameScene.ts"), "utf8");
    // ⚠ Zakres do NASTĘPNEGO `case`, nie stała liczba znaków. Pierwsza wersja
    // brała 4000 znaków i ucinała gałąź w połowie — test świecił na czerwono
    // na kodzie, który był poprawny, bo szukanej linii po prostu nie obejmował.
    // Okno o stałym rozmiarze mierzy długość komentarzy, a nie zachowanie.
    const ciało = wycinekGalezi(gs, 'case "shieldBash":');
    const deklaruje = sb?.requiresShield === true;
    // Bramka musi patrzeć na DRUGĄ RĘKĘ, nie na nazwę przedmiotu.
    const pyta = /Equipment\.(offhand|blockSpec)/.test(ciało);
    const mowiDlaczego = /(sayAtPlayer|announceAttackRefusal)\(/.test(ciało);
    const par = [
      ["config deklaruje `requiresShield: true`", deklaruje],
      ["gałąź pyta o drugą rękę (`Equipment.offhand`/`blockSpec`)", pyta],
      ["odmowa MÓWI dlaczego (cichy przycisk = zepsuty przycisk)", mowiDlaczego],
    ];
    for (const [opis, ok] of par) {
      console.log(`  ${ok ? "OK  " : "BŁĄD"} T3. ${opis}`);
      if (!ok) bledy.push(`§T3: ${opis} — nie zachodzi. ⚠ Bez bramki tarczy łamiemy REGUŁĘ ZAWĘŻANIA: przerwanie przestaje pochodzić z narzędzia i zaczyna pochodzić z umiejętności (docs/systemy/abilities.md §1.3 R8)`);
    }
  }

  /* ── T4. OGŁUSZENIE JAKO OSOBNY STAN ────────────────────────────────── */
  {
    const en = await readFile(join(KORZEN, "src/entities/Enemy.ts"), "utf8");
    const maStun = /\bstun\s*\(\s*ms\s*:\s*number\s*\)/.test(en);
    const maPole = /stunnedUntil/.test(en);
    const maHook = /protected\s+onStunned\s*\(/.test(en);
    // ⚠ Sedno §1.3 R3: ogłuszenie NIE MOŻE przedłużać `knockedBackUntil`.
    // To są dwa różne pojęcia o jednym ciele — przy odrzucie ciało MA jechać
    // impulsem, przy ogłuszeniu MA stać. Zlanie ich sprawia, że ogłuszony
    // wróg albo dryfuje, albo zjada odrzut, a to wygląda jak drgnięcie
    // kamery, nie jak usterka.
    const ciałoStun = (() => {
      const i = en.search(/\bstun\s*\(\s*ms\s*:\s*number\s*\)/);
      return i === -1 ? "" : en.slice(i, i + 700);
    })();
    const nieZlewa = ciałoStun !== "" && !/knockedBackUntil/.test(ciałoStun);
    const par = [
      ["`Enemy.stun(ms)` istnieje", maStun],
      ["osobne pole `stunnedUntil`", maPole],
      ["hook `onStunned()` (wzorem `interrupt()`)", maHook],
      ["`stun()` NIE przedłuża `knockedBackUntil` — dwa pojęcia, dwa pola", nieZlewa],
    ];
    for (const [opis, ok] of par) {
      console.log(`  ${ok ? "OK  " : "BŁĄD"} T4. ${opis}`);
      if (!ok) bledy.push(`§T4: ${opis} — nie zachodzi`);
    }
  }

  /* ── T5. ANTY-CATCH-UP: ogłuszenie KASUJE akcję, nie zawiesza ───────── */
  {
    // ⚠ Test BEHAWIORALNY na prawdziwym `ActionRunner`ze, nie tekstowy —
    // pytanie brzmi „co robi maszyna", a nie „co jest napisane w pliku".
    const tmpCA = join(KORZEN, ".tmp_combataction_t.mjs");
    let CA = null;
    try {
      await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/CombatAction.ts")], outfile: tmpCA, alias: { phaser: stubPhaser } });
      CA = await import(pathToFileURL(tmpCA).href);
    } catch {
      CA = null;
    }
    await unlink(tmpCA).catch(() => {});

    const AKCJA = {
      id: "test_telegraf", windupMs: 560, activeMs: 0, recoveryMs: 300, cooldownMs: 2000,
      interruptible: true, oncePerActive: true, damageMin: 1, damageMax: 1, damageType: null,
      ownsBody: false, attackerRecoil: "onHit", attackerLunge: "onAttack",
    };

    // ── Ścieżka A: SAMO ZAWIESZENIE (dzisiejsze `stagger`) ──────────────
    // Odtwarza dokładnie to, co robi `updateAI`: przez okno zawieszenia nikt
    // nie woła `tick`, bo `updateChase` jest pominięte. Terminy runnera są
    // bezwzględne, więc mijają w tle.
    let doAktywnej = null;
    if (CA) {
      const r = new CA.ActionRunner();
      r.request(AKCJA, 0);                 // start telegrafu w t=0
      const przejscia = r.tick(1000);      // pierwszy tik PO 900 ms „ogłuszenia"
      doAktywnej = przejscia.some((p) => p.to === "active");
    }

    // ── Ścieżka B: KASOWANIE (projektowane `stun`) ──────────────────────
    let poKasowaniu = null;
    let maCancel = false;
    if (CA) {
      const r = new CA.ActionRunner();
      r.request(AKCJA, 0);
      maCancel = typeof r.cancel === "function";
      if (maCancel) {
        r.cancel(100);                     // ogłuszenie w 100 ms telegrafu
        const przejscia = r.tick(1000);
        poKasowaniu = r.phase === "idle" && !przejscia.some((p) => p.to === "active");
      }
    }

    console.log(`  ${CA ? "OK  " : "BŁĄD"} T5. moduł \`CombatAction\` daje się zbudować`);
    if (!CA) bledy.push("§T5: nie udało się zbudować `src/core/CombatAction.ts` — strażnik przestał cokolwiek widzieć");
    // ⚠ Ta linia ma pokazywać `true` i to NIE jest usterka — to jest
    // ZMIERZONA WŁASNOŚĆ dzisiejszego kodu, dla której cała ta sekcja
    // powstała. Gdyby kiedyś pokazała `false`, znaczy to, że ktoś dołożył
    // runnerowi pauzę — czego robić nie wolno (patrz nagłówek §T).
    console.log(`       delta R1: samo zawieszenie → wejście w \`active\` po oknie = ${doAktywnej} (tak działa dziś \`stagger\`)`);
    console.log(`  ${maCancel ? "OK  " : "BŁĄD"} T5. \`ActionRunner.cancel()\` istnieje`);
    console.log(`  ${poKasowaniu === true ? "OK  " : "BŁĄD"} T5. po skasowaniu akcja NIE wchodzi w \`active\` (phase = idle)`);
    if (CA && doAktywnej === false) {
      bledy.push("§T5: przypadek kontrolny przestał odtwarzać catch-up — albo runner dostał pauzę (zakazane), albo ta gałąź przestała mierzyć deltę");
    }
    if (!maCancel) bledy.push("§T5: brak `ActionRunner.cancel()` — ogłuszenie mogłoby tylko ZAWIESIĆ akcję, a wtedy wróg wykonuje ją w klatce, w której ogłuszenie mija (docs/systemy/abilities.md §1.3 R1)");
    if (maCancel && poKasowaniu !== true) bledy.push("§T5: `cancel()` nie sprowadza maszyny do `idle` z fazy `windup` — catch-up wraca");
  }

  /* ── T6. OKNO OGŁUSZENIA NIE STOI NA KLIFIE ─────────────────────────── */
  {
    // ⚠ Mierzy na ŻYWYM rosterze broni, nie na tabelce w dokumencie.
    // Model: naciśnięcie w t=0 → trafienie basha w `windupMs` → root do
    // `windupMs + recoveryMs`; autoatak jest gotowy po `attackCooldown`
    // (ustawiane w `triggerAttack` w chwili naciśnięcia) i ląduje po
    // `swingDurationMs × swingHitFraction`.
    const PROG_MS = 50;
    const bronie = Object.entries(ITEMS)
      .filter(([, it]) => it?.melee && typeof it.attackCooldown === "number" && typeof it.swingDurationMs === "number");
    const gotowe = typeof sb?.stunMs === "number" && typeof sb?.windupMs === "number" && typeof sb?.recoveryMs === "number";
    if (!gotowe || !bronie.length) {
      console.log("  BŁĄD T6. brak liczb (`stunMs`/`windupMs`/`recoveryMs`) albo pustego rosteru — pomiar niemożliwy");
      if (!bronie.length) bledy.push("§T6: nie znaleziono ani jednej broni z tempem — strażnik przestał cokolwiek widzieć");
      if (!gotowe) bledy.push("§T6: `ABILITIES.shieldBash` nie podaje `stunMs`/`windupMs`/`recoveryMs`");
    } else {
      const koniec = sb.windupMs + sb.stunMs;
      const hitF = CFG.PLAYER.swingHitFraction;
      let najciasniej = Infinity;
      let winowajca = "";
      const liczby = new Set();
      for (const [id, it] of bronie) {
        const cd = it.attackCooldown * 1000;
        let t = Math.max(sb.windupMs + sb.recoveryMs, cd);
        let ile = 0;
        for (let i = 0; i < 3; i++) {
          const trafienie = t + it.swingDurationMs * hitF;
          if (trafienie <= koniec) ile++;
          const margines = Math.abs(trafienie - koniec);
          if (margines < najciasniej) { najciasniej = margines; winowajca = `${id}@${Math.round(trafienie)}`; }
          t += cd;
        }
        liczby.add(ile);
      }
      const ok = najciasniej >= PROG_MS;
      console.log(
        `  ${ok ? "OK  " : "BŁĄD"} T6. ogłuszenie ${sb.stunMs} ms kończy się w t=${koniec}; darmowych ciosów: {${[...liczby].sort().join(",")}}; najciaśniejszy margines ${Math.round(najciasniej)} ms (${winowajca})`,
      );
      if (!ok) {
        bledy.push(
          `§T6: przy \`stunMs\` = ${sb.stunMs} najbliższe trafienie wypada ${Math.round(najciasniej)} ms od końca ogłuszenia (${winowajca}). ` +
          `Poniżej ${PROG_MS} ms o liczbie darmowych ciosów decyduje szum, a nie projekt — i zależy ona od tego, KTÓRĄ BROŃ gracz niesie. ` +
          `Takiej liczby nie da się stroić ręką (ta sama pułapka co \`SHIELD.blockArcDeg\`). Zmierzone czyste wartości: 700 i 1000.`,
        );
      }
      if (liczby.size > 1) {
        console.log(`       ⚠ liczba darmowych ciosów RÓŻNI SIĘ między broniami — to jest wybór projektowy, nie usterka (patrz D-2 w docs/systemy/abilities.md)`);
      }
    }
  }

  /* ── T7. KONTROLA WISI NA TRAFIENIU ─────────────────────────────────── */
  {
    // Własność SCENY, więc strażnik tekstowy — jak §P8, §R6 i §S6.
    // Ogłuszenie naliczone przy naciśnięciu przeszłoby wszystkie testy
    // czystych funkcji i skasowało różnicę między celnym wyprowadzeniem
    // a machnięciem w powietrze.
    const gs = await readFile(join(KORZEN, "src/scenes/GameScene.ts"), "utf8");
    // ⚠ Zakres do NASTĘPNEGO `case`, nie stała liczba znaków. Pierwsza wersja
    // brała 4000 znaków i ucinała gałąź w połowie — test świecił na czerwono
    // na kodzie, który był poprawny, bo szukanej linii po prostu nie obejmował.
    // Okno o stałym rozmiarze mierzy długość komentarzy, a nie zachowanie.
    const ciało = wycinekGalezi(gs, 'case "shieldBash":');
    const rps = cialoMetody(gs, "private resolvePendingSwing");
    const podAnyHit = /if \(swing\.onHit && anyHit\)/.test(rps);
    // ⚠ **Wymaga istnienia gałęzi.** Bez tego warunku test „gałąź NIE ogłusza"
    // przechodził dlatego, że gałęzi w ogóle nie było — czyli świecił na
    // zielono dokładnie wtedy, gdy nie miał czego pilnować.
    const galazNieOglusza = ciało !== "" && !/\.stun\(/.test(ciało);
    /* ⚠ **PRZEKOTWICZONE (P3.2).** Do migracji kontrola stała LITERAŁEM
       w gałęzi `case "shieldBash":` i strażnik szukał tam słów
       `control`/`stunMs`. Dziś jest DEKLARACJĄ akcji, więc pytanie rozpada
       się na dwa: czy deklaracja niesie kontrolę z liczbą z configu i czy
       wykonawca podaje ją dalej do `pendingSwing`. Reszta §T7 — nakładanie
       pod `anyHit`, `isDead`, brak zachwiania i odrzutu — jest NIETKNIĘTA,
       bo tamte źródła prawdy się nie ruszyły. */
    const tmpPA7 = join(KORZEN, ".tmp_playeraction_t7.mjs");
    await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/combat/PlayerAction.ts")], outfile: tmpPA7, alias: { phaser: stubPhaser } });
    const PA7 = await import(pathToFileURL(tmpPA7).href);
    await unlink(tmpPA7).catch(() => {});
    const akcjaSB = PA7.PLAYER_ACTIONS?.shieldBash;
    /* ⚠ **PRZEKOTWICZONE (P3.5):** `onHit` jest listą, więc pytanie brzmi
       „czy na liście stoi DOKŁADNIE kontrola i czy z liczbą z configu".
       ⚠ Sufit długości jest tu nośny: Uderzenie tarczą ma JEDNĄ nagrodę.
       Dołożenie drugiej (np. zwrotu cooldownu) jest decyzją projektową i ma
       zapalić ten strażnik, a nie przejść jako „lista i tak przyjmuje więcej". */
    const kontrolaSB = Array.isArray(akcjaSB?.onHit)
      ? akcjaSB.onHit.filter((e) => e?.kind === "control")
      : [];
    // ⚠⚠ **PRZEKOTWICZONE 2026-09-15 razem z `S10` — i ten zamek ZAŚWIECIŁ NA
    //    CZERWONO, zanim to zrobiłem.** Do tej daty pytał o `onHit.length === 1`,
    //    czyli o DŁUGOŚĆ listy, a chciał pytać o „dokładnie jedna kontrola,
    //    `stunMs` z configu". Długość była proxy: trzymała się, dopóki bash
    //    miał tylko jeden efekt on-hit. `S10` dołożyło drugi (zużycie tarczy
    //    po trafieniu) i proxy padło na poprawnym kodzie.
    //    ⛔ Pytanie zostaje TO SAMO i nie jest rozluźnione: druga kontrola albo
    //    `stunMs` spoza configu nadal świecą na czerwono. Zmieniło się tylko to,
    //    że lista może nieść INNE rodzaje efektów.
    const deklarujeKontrole =
      Array.isArray(akcjaSB?.onHit)
      && kontrolaSB.length === 1
      && typeof sb?.stunMs === "number"
      && kontrolaSB[0].stunMs === sb.stunMs;
    /* ── `S10`: zużycie tarczy wisi na TRAFIENIU ────────────────────────────
       ⚠ Deklaracja, nie reguła wykonawcy (P3.2) — i musi być DOKŁADNIE jedna,
       bo dwie znaczyłyby dwa rzuty na zużycie z jednego ciosu. */
    const zuzywaTarcze = (akcjaSB?.onHit ?? []).filter((e) => e.kind === "wearShield");
    const wykonawcaPodaje = /onHit: onHitDlaSwingu\(action\)/.test(cialoMetody(gs, "private commitPlayerAction"));
    const oglusaNaTrafieniu = /\.stun\(/.test(rps) && podAnyHit;
    // ⚠ „Trupem się nie szarpie" — ta sama reguła, którą stosują dziś
    // `interrupts` i `staggerMs` w `damageMatchingEnemies`.
    const nieNaTrupie = /isDead/.test(rps);
    // ⚠ Zachwianie i ogłuszenie liczą to samo pojęcie; nakładanie ich to dwa
    // mechanizmy na jedno zjawisko (wzorzec błędu `ownsBody`/`attackerRecoil`).
    const bezZachwiania = sb ? sb.staggerMs === 0 || !("staggerMs" in sb) : false;
    const bezWlasnegoOdrzutu = sb ? (sb.knockbackPx ?? 0) === 0 : false;

    const par = [
      ["gałąź NIE ogłusza w chwili puszczenia palca", galazNieOglusza],
      ["deklaracja akcji niesie DOKŁADNIE kontrolę (`onHit` = [`control`], `stunMs` z configu)", deklarujeKontrole],
      ["wykonawca podaje kontrolę do `pendingSwing`", wykonawcaPodaje],
      // ⚠ Zużywa się to, czym się uderza. Pancerz nie ma dziś trwałości,
      //    więc zużycie BRONI przy ciosie tarczą byłoby karą z powietrza.
      ["deklaracja NIE zużywa broni (uderza tarcza, nie oręż)", akcjaSB?.wearsWeapon === false],
      // ── `S10` (2026-09-15): druga połowa zdania wyżej ────────────────────
      // ⚠ Do tej daty „zużywa się to, czym się uderza" było zamiarem w komentarzu,
      //   a tarcza nie zużywała się przy bashu ANI RAZU.
      ["⭐ `S10`: deklaracja zużywa TARCZĘ, dokładnie raz", zuzywaTarcze.length === 1],
      // ⛔ Zużycie NIE może przenieść się na naciśnięcie: tam kosztuje też za pudło.
      ["⛔ `S10`: zużycie tarczy wisi POD `anyHit`, nie przy zamachu", /wearShield\) this\.wearShieldOnHit\(\)/.test(rps) && podAnyHit],
      // ⛔ Jeden kanał zużycia — bez osobnego `bashWear`.
      [
        "⛔ `S10`: idzie istniejącym `Equipment.wearShield()`, bez `bashWear`",
        /Equipment\.wearShield\(\)/.test(cialoMetody(gs, "private wearShieldOnHit"))
          && !/bashWear/.test(gs),
      ],
      // ⚠ **PRZEKOTWICZONE (P3.4), bliźniak §R6a.** Do tej zmiany deklaracja
      //    niosła KOPIĘ mnożnika, a asercja pilnowała równości obu dróg. Kopia
      //    zniknęła (review P3.3, OD-3), więc pytanie rozpada się na dwa: czy
      //    ×0,5 stoi u WŁAŚCICIELA i czy deklaracja go nie odtwarza z powrotem.
      //    ⚠ Uderzenie tarczą jest jedyną akcją pytającą resolvera profilem
      //    TARCZY, więc rozejście się tych dwóch dróg byłoby tu widoczne
      //    najpóźniej ze wszystkich miejsc w grze.
      [
        "mnożnik ×0,5 zamrożony w `AbilitySpec` (resolver, nie deklaracja)",
        Math.abs(multiplierFor(resolveAbility("shieldBash", { reach: 68 }), "primary") - 0.5) < 1e-9,
      ],
      [
        "deklaracja NIE kopiuje mnożnika ani kosztów (właściciele: `AbilitySpec`, `Abilities`, wspólny ogon)",
        !!akcjaSB && !("damageMul" in akcjaSB) && !("cooldownMs" in akcjaSB) && !("staminaCost" in akcjaSB),
      ],
      ["ogłuszenie nakładane w `resolvePendingSwing`, pod `anyHit`", oglusaNaTrafieniu],
      ["rozstrzygnięcie sprawdza `isDead` (trupem się nie szarpie)", nieNaTrupie],
      ["brak własnego `staggerMs` (ogłuszenie ZASTĘPUJE zachwianie)", bezZachwiania],
      ["odrzut = 0 (nie wypychamy celu z okna, które właśnie kupiliśmy)", bezWlasnegoOdrzutu],
    ];
    for (const [opis, ok] of par) {
      console.log(`  ${ok ? "OK  " : "BŁĄD"} T7. ${opis}`);
      if (!ok) bledy.push(`§T7: ${opis} — nie zachodzi`);
    }
    if (!ciało) bledy.push('§T7: nie znaleziono gałęzi `case "shieldBash":` w GameScene — umiejętność jeszcze nie istnieje');
  }
  console.log();
}

/* ══════════════════════════════════════════════════════════════════════════
   §V. ROZCIĘCIE — deklaracja, adres i ŚCIEŻKA KRWAWIENIA (2026-09-04)
   ══════════════════════════════════════════════════════════════════════════
   Czwarty wpis w `PLAYER_ACTIONS` i pierwszy, który zostawia coś NA CELU.
   Strażnik czyta go tak samo jak §R6a Ciężkie uderzenie i §T7 Uderzenie
   tarczą: liczby MUSZĄ pochodzić z configu, adres MUSI być własny, a nagroda
   MUSI wisieć na trafieniu.

   ⚠ **Cztery pytania, których nie zadaje żaden inny strażnik:**
     V4 — czy Krwawienie NIE jest nakładane przy naciśnięciu (gałąź `case`);
     V5 — czy jedzie do `damageMatchingEnemies`, a NIE do bloku `onHit`
          w `resolvePendingSwing` (tam nie ma rzutu, więc nie ma z czego
          policzyć snapshotu);
     V6 — czy snapshot idzie od `preCrit`, a nie od `roll.amount` (krytyk
          podnosi wyłącznie cios bezpośredni — decyzja autora);
     V7 — czy tik przechodzi przez warstwę 2 (`scaleDamage`), czyli czy rana
          dziedziczy biegłość ciosu, który ją zadał.

   ⚠ **`Enemy` musi ZADEKLAROWAĆ oba kontrakty efektów** (V8). Strukturalnie
   działałoby i bez `implements`, ale wtedy zmiana nazwy metody zapalałaby się
   dopiero w wywołaniu — dokładnie ten argument, którym `Targetable` trafiło
   na tę klasę w 2026-09-03.
   ══════════════════════════════════════════════════════════════════════════ */
{
  console.log("§V. Rozcięcie — deklaracja i ścieżka Krwawienia:");
  const gs = await readFile(join(KORZEN, "src/scenes/GameScene.ts"), "utf8");
  const enemySrc = await readFile(join(KORZEN, "src/entities/Enemy.ts"), "utf8");
  // ⚠ Komentarze wycięte — V11 liczy WYWOŁANIA `Math.random()`, a nie wzmianki
  // o nim; bez tego strażnik mierzyłby długość dokumentacji.
  // ⚠⚠ **Arytmetyka rzutu przeniosła się 2026-09-05 do `core/combat/DamageRoll.ts`**
  //   (`Player.rollDamage` jest dziś cienką nakładką dodającą mnożnik z efektów).
  //   V11–V13 pilnują TEJ SAMEJ własności co przedtem — dwa `Math.random()`,
  //   `preCrit` z `basePrzedKrytykiem`, ten sam `u` na oba odwzorowania —
  //   tylko w pliku, w którym ta arytmetyka teraz mieszka. **Guard nie został
  //   osłabiony: zmieniła się jego kotwica, nie pytanie.** Powód przeprowadzki:
  //   `Player` jest sprite'em Phasera, więc jedyna funkcja licząca obrażenia
  //   ciosu była nieosiągalna dla `tools/combat_benchmark.mjs`.
  const rollBody = (await readFile(join(KORZEN, "src/core/combat/DamageRoll.ts"), "utf8"))
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  const r = CFG.ABILITIES?.rend;
  // ⚠ Ten sam `AS`, którego używają §O/§R/§T — resolver jest JEDNYM źródłem
  // mnożnika i strażnik ma go pytać, a nie czytać deklaracji.
  const { resolveAbility, multiplierFor } = AS;

  const tmpPAV = join(KORZEN, ".tmp_playeraction_v.mjs");
  await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/combat/PlayerAction.ts")], outfile: tmpPAV, alias: { phaser: stubPhaser } });
  const PAV = await import(pathToFileURL(tmpPAV).href);
  await unlink(tmpPAV).catch(() => {});
  const akcjaR = PAV.PLAYER_ACTIONS?.rend;

  if (!akcjaR) {
    console.log("  BŁĄD V. brak `PLAYER_ACTIONS.rend` — strażnik stracił cel, a nie kod się naprawił.");
    bledy.push("§V: brak `PLAYER_ACTIONS.rend`.");
  } else if (!r) {
    console.log("  BŁĄD V. brak `ABILITIES.rend` — nie ma z czym porównywać deklaracji.");
    bledy.push("§V: brak `ABILITIES.rend`.");
  } else {
    const bleedy = Array.isArray(akcjaR.onHit) ? akcjaR.onHit.filter((e) => e?.kind === "bleed") : [];
    const b = bleedy[0];
    // ⚠ Sufit długości listy jest nośny, jak przy Uderzeniu tarczą: Rozcięcie
    // ma JEDNĄ nagrodę. Dołożenie drugiej jest decyzją i ma zapalić strażnika.
    const jednaNagroda = Array.isArray(akcjaR.onHit) && akcjaR.onHit.length === 1 && bleedy.length === 1;

    const galaz = wycinekGalezi(gs, 'case "rend":');
    // ⚠ **Komentarze wycięte — wolno o Krwawieniu PISAĆ, nie wolno go tu
    // LICZYĆ.** Ta sama reguła i ten sam powód co przy strażniku czystości
    // wyżej; bez tego V4 świecił na czerwono na poprawnej gałęzi, bo jej
    // komentarz tłumaczy, dlaczego rany tu nie ma.
    const galazKod = galaz
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
    // ⚠ **Komentarze wycięte też tutaj, i to jest POPRAWKA, nie kosmetyka.**
    // Do finalnego audytu 2026-09-04 §V czytało `damageMatchingEnemies` razem
    // z komentarzami — więc dopisanie JEDNEJ linijki komentarza przy
    // `iconKey` wypchnęło `{ kind: "player" }` poza okno V10 i strażnik
    // zaświecił na czerwono na poprawnym kodzie. Strażnik ma mierzyć KOD, nie
    // długość dokumentacji (ta sama lekcja co przy §T7, wpis 2026-08-26).
    const bezKomentarzy = (s) =>
      s.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
    // ⚠ Komentarze wycięte tą samą regułą co niżej: §V15 pyta o KOD nosiciela,
    // a ten katalog dokumentuje się obszernie (wzmianka o ikonie w komentarzu
    // nie jest ikoną).
    const enemyKod = bezKomentarzy(enemySrc);
    const dme = bezKomentarzy(cialoMetody(gs, "private damageMatchingEnemies"));
    const rps = bezKomentarzy(cialoMetody(gs, "private resolvePendingSwing"));

    const par = [
      // ── V1. Deklaracja czyta config, nie przepisuje go ──────────────────
      ["V1. `windupMs` z configu", akcjaR.windupMs === r.windupMs],
      ["V1. root = `windupMs + recoveryMs` z configu", akcjaR.root?.kind === "windupPlusRecovery" && akcjaR.root.recoveryMs === r.recoveryMs],
      ["V1. adres własny (`id === \"rend\"`)", akcjaR.id === "rend"],
      // ── V2. Deklaracja Krwawienia: wszystkie liczby z `ABILITIES.rend.bleed` ─
      ["V2. `onHit` niesie DOKŁADNIE Krwawienie", jednaNagroda],
      ["V2. `buffId` z configu", b?.buffId === r.bleed.buffId],
      ["V2. `fractionOfDamage` z configu (0,10)", b?.fractionOfDamage === r.bleed.fractionOfDamage],
      ["V2. `durationMs` z configu (6000)", b?.durationMs === r.bleed.durationMs],
      ["V2. `tickMs` z configu (1000)", b?.tickMs === r.bleed.tickMs],
      ["V2. `maxStacks` z configu (1)", b?.maxStacks === r.bleed.maxStacks],
      // ── V3. Reguły wspólne z resztą rejestru ────────────────────────────
      ["V3. mnożnik ×1,1 z `AbilitySpec` (resolver, nie deklaracja)", Math.abs(multiplierFor(resolveAbility("rend", { reach: 68 }), "primary") - 1.1) < 1e-9],
      ["V3. deklaracja NIE kopiuje mnożnika ani kosztów", !("damageMul" in akcjaR) && !("cooldownMs" in akcjaR) && !("staminaCost" in akcjaR)],
      ["V3. zużywa broń (cios wyprowadza oręż)", akcjaR.wearsWeapon === true],
      ["V3. nie fuszeruje (fuszerka kasowałaby też ranę)", akcjaR.allowFumble === false],
      // ── V4. Gałąź NIE nakłada Krwawienia przy naciśnięciu ───────────────
      // ⚠ Wymaga istnienia gałęzi — inaczej test przeszedłby dlatego, że nie
      // ma czego pilnować (ta sama pułapka, którą złapało §T7).
      ["V4. gałąź `case \"rend\"` istnieje", galaz !== ""],
      ["V4. gałąź NIE nakłada efektu przy naciśnięciu", galaz !== "" && !/applyEffect/.test(galazKod)],
      ["V4. gałąź nie zna ani jednej liczby Krwawienia", galaz !== "" && !/bleed|durationMs|tickMs|fractionOfDamage/i.test(galazKod)],
      // ── V5. Nakładanie jest tam, gdzie żyje rzut ────────────────────────
      ["V5. Krwawienie nakładane w `damageMatchingEnemies`", /applyEffect\(/.test(dme)],
      ["V5. …i NIE w bloku `onHit` (`resolvePendingSwing`)", !/applyEffect\(/.test(rps)],
      ["V5. nie na trupie (ten sam warunek co `interrupt`/`stagger`)", /!killed && bleed/.test(dme)],
      // ── V6/V7. Arytmetyka snapshotu ─────────────────────────────────────
      ["V6. snapshot od `roll.preCrit` (krytyk NIE mnoży rany)", /roll\.preCrit \* bleed\.fractionOfDamage/.test(dme)],
      ["V6. …i `preCrit` NIE jest przeliczany z `amount`", !/critMultiplier/.test(dme)],
      ["V7. tik przechodzi przez warstwę 2 (`scaleDamage` + biegłość ciosu)", /scaleDamage\(roll\.preCrit[\s\S]{0,80}strike\.proficiency[\s\S]{0,20}wykonanie\)/.test(dme)],
      ["V7. podłoga 1 pkt (tik zaokrąglony do zera czytałby się jak usterka)", /Math\.max\(\s*1,\s*Math\.round\(scaleDamage\(roll\.preCrit/.test(dme.replace(/\s+/g, " "))],
      // ── V8. `Enemy` jest nosicielem, a księgowość zabójstwa jest wspólna ─
      ["V8. `Enemy implements … EffectTarget, EffectHost`", /class Enemy[\s\S]{0,200}?implements[^\{]*EffectTarget[^\{]*EffectHost/.test(enemySrc)],
      ["V8. tik ma CICHĄ ścieżkę (nie przechodzi przez `takeDamage`)", /private takeEffectTick\(/.test(enemySrc) && !/takeEffectTick[\s\S]{0,400}?this\.takeDamage\(/.test(enemySrc)],
      ["V8. tik NIE liczy pancerza (`ARMOR_PROFILE.metal.slash` = 1,4 wzmacniałby ranę)", !/takeEffectTick\([\s\S]{0,400}?damageAfterArmor/.test(enemySrc)],
      ["V8. `updateEffects` zwraca „tik zabił\"", /updateEffects\(deltaMs: number\): boolean/.test(enemySrc)],
      ["V8. scena kredytuje zabójstwo tikiem (`creditKill`)", /e\.updateEffects\(delta\)[\s\S]{0,80}creditKill\(e\)/.test(gs)],
      ["V8. `creditKill` jest JEDNYM miejscem księgowości (cios też przez nie idzie)", /if \(killed\) this\.creditKill\(e\);/.test(dme)],
      // ⚠ Okno 200 znaków przerósł blok „sen daleko od gracza" (AKTYWNOSC_STWORZEN,
      // 2026-10) wstawiony MIĘDZY oba wywołania — kolejność była poprawna, asercja
      // świeciła fałszywie. Dziś: ta sama pętla (bez `});` po drodze), do 800 zn.
      ["V8. efekty przewijane POZA bramkami AI (ogłuszony ma krwawić)", /updateEffects\(delta\)(?:(?!\}\);)[\s\S]){0,800}e\.updateAI/.test(gs)],
      // ── V9. Krwawienie NIE dorabia się drugiego licznika czasu ──────────
      // ⚠ Wprost z briefu: „nie implementuj własnego timera Bleed poza EffectSet".
      ["V9. `Enemy` nie ma własnego licznika Krwawienia", !/bleedUntil|nextBleedAt|bleedTicks/.test(enemySrc)],
      ["V9. …ani nie ma go `GameScene`", !/bleedUntil|nextBleedAt|bleedTicks/.test(gs)],
      // ── V10. Źródło efektu jest USTAWIANE ───────────────────────────────
      // ⚠ Dziś nikt go nie czyta i to jest w porządku — pole ma być USTAWIONE,
      // żeby atrybucja DoT miała o co się oprzeć, gdy pojawi się drugi sprawca.
      ["V10. `applyEffect` podaje `EffectSource`", /applyEffect\([\s\S]{0,900}?\{ kind: "player" \}/.test(dme)],
      /* ── V11–V13. `φ` NIE PRZECIEKA DO KRWAWIENIA (poprawka 2026-09-04) ───
         ⚠ **To jest strażnik na regułę „krytyk rusza WYŁĄCZNIE cios
         bezpośredni".** `critLowCut` (cecha rodziny topora i sztyletu na
         M-II/M-IV) podnosi PODŁOGĘ losowania przy krytyku — czyli krytyk
         zmienia nie tylko mnożnik, ale i sam rzut. Pierwsza wersja liczyła
         `preCrit` z tego podniesionego rzutu, więc krytyk podnosił Krwawienie
         POŚREDNIO (+12,5% na M-II/M-III, +25% na M-IV) — bez mnożnika, bez
         śladu i bez sposobu, w jaki gracz mógłby to wytłumaczyć.

         Naprawa: JEDEN rzut `u`, DWA odwzorowania. Strażnik pilnuje obu
         własności naraz, bo złamanie którejkolwiek przywraca przeciek.
         ⚠ Tekstowy, bo `Player.rollDamage` żyje za Phaserem — ale pyta
         o ŹRÓDŁO liczby, nie o jej wartość (ta sama reguła co §T1b). */
      ["V11. `rollDamage` robi DOKŁADNIE dwa `Math.random()` (krytyk + JEDEN rzut obrażeń)", (rollBody.match(/Math\.random\(\)/g) ?? []).length === 2],
      ["V12. `preCrit` liczone z `basePrzedKrytykiem`, NIE z `base` (φ nie przecieka)", /const preCrit = basePrzedKrytykiem \* damageMultiplier;/.test(rollBody)],
      ["V13. `basePrzedKrytykiem` odwzorowuje ten sam `u` na PEŁEN zakres", /const basePrzedKrytykiem = u \* \(max - min\) \+ min;/.test(rollBody) && /const base = u \* \(max - dolna\) \+ dolna;/.test(rollBody)],
      /* ── V14. WYKONAWCA NIE ZNA TOŻSAMOŚCI UMIEJĘTNOŚCI ───────────────────
         ⚠ Pierwsza wersja wpisywała `abilityIconKey("rend")` wprost
         w `damageMatchingEnemies`, czyli nazwę umiejętności do warstwy
         OGÓLNEJ — wbrew regule „archetyp opisuje `kind`, nigdy `if (id === …)`
         we wspólnej warstwie" (`src/core/CLAUDE.md`). Druga umiejętność
         z Krwawieniem dostałaby cudzą ikonę i nikt by tego nie zauważył.
         Ikonę dokłada dziś tłumacz z `action.id` — tak samo jak `refund.id`. */
      ["V14. wykonawca czyta ikonę z deklaracji, nie z literału", /iconKey: bleed\.iconKey/.test(dme) && !/abilityIconKey\(/.test(dme)],
      ["V14. …a tłumacz dokłada ją z `action.id` (jak przy `refund`)", /skutki\.bleed = \{ \.\.\.efekt, iconKey: abilityIconKey\(action\.id\) \}/.test(gs)],
      /* ── V15. ZNACZNIK KRWAWIENIA NAD WROGIEM (2026-09-04, druga runda) ───
         ⚠ **Strażnik jest tekstowy, bo znacznik żyje za Phaserem — ale pyta
         o ŹRÓDŁO i o LICZBĘ MECHANIZMÓW, nie o piksele.** Trzy rzeczy, które
         psują się cicho:
          1. ikona wpisana literałem („`ability-icon-rend`" w `Enemy`) —
             druga zdolność z raną pokazałaby cudzą ikonę (ta sama pułapka co
             V14 po stronie wykonawcy, tylko od strony nosiciela);
          2. drugie pole znacznika obok pierwszego — ogłuszenie i rana
             WYSTĘPUJĄ NARAZ, więc dwa znaczniki liczone z jednego `offsetY`
             stanęłyby dokładnie na sobie;
          3. własne chowanie po czasie — wygaśnięcie ogłasza `EffectSet`,
             a każdy drugi licznik rozjeżdża się z pierwszym (to jest V9
             zadane jeszcze raz, tym razem o prezentację). */
      ["V15. ikona pytana o RODZAJ (`BLEED.find`), nie o `id`", /onEffectsChanged\(\): void \{[\s\S]{0,200}?BLEED\.find\(this\.effects\)/.test(enemyKod)],
      ["V15. …i brana z `spec.iconKey` (nie z literału)", /showIconMark\(BLEED\.tag, \w+\.spec\.iconKey\)/.test(enemyKod)],
      ["V15. `Enemy` nie zna tożsamości umiejętności (`abilityIconKey`)", !/abilityIconKey/.test(enemySrc)],
      ["V15. brak efektu = znacznik SCHOWANY (wygaszenie idzie z warstwy)", /else this\.hideStatusMark\(BLEED\.tag\)/.test(enemyKod)],
      ["V15. JEDEN rząd znaczników, nie pole na stan (ogłuszenie + rana naraz)", /statusMarks = new Map/.test(enemyKod) && !/stunMarker/.test(enemyKod)],
      ["V15. śmierć sprząta cały rząd", /for \(const mark of this\.statusMarks\.values\(\)\) mark\.destroy\(\);/.test(enemyKod)],
    ];
    for (const [opis, ok] of par) {
      console.log(`  ${ok ? "OK  " : "BŁĄD"} ${opis}`);
      if (!ok) bledy.push(`§V: ${opis} — nie zachodzi`);
    }
  }
  console.log();
}

/* ══════════════════════════════════════════════════════════════════════════
   §W. DUAL WIELD — PROTOTYP MECHANIKI (2026-09-05)
   ══════════════════════════════════════════════════════════════════════════
   ⚠ **Strażnik pilnuje MECHANIKI, nie balansu** — bo balansu tu jeszcze nie
   ma i celowo. Prototyp odpowiada na jedno pytanie: czy dwie bronie jako dwa
   niezależne profile ciosu współpracują z istniejącym systemem.

   Cztery niezmienniki, każdy łatwy do złamania po cichu:
     W1 — autoatak bierze profil Z RĘKI NA KOLEI, nie zawsze z głównej;
     W2 — ręka przełącza się przy ZATWIERDZENIU zamachu (pudło nie blokuje);
     W3 — liczby rzutu są ZAMROŻONE w profilu (naprawa istniejącej dziury:
          `rollDamage` czytał `Progression` na żywo, więc obrażenia jako
          jedyne nie były mrożone razem z zasięgiem i biegłością);
     W4 — off-hand rozwiązuje się w `Progression`, nie w scenie.
   ══════════════════════════════════════════════════════════════════════════ */
{
  console.log("§W. Dual Wield — prototyp mechaniki:");
  const gsW = bezKomentarzyP(await readFile(join(KORZEN, "src/scenes/GameScene.ts"), "utf8"));
  const plW = bezKomentarzyP(await readFile(join(KORZEN, "src/entities/Player.ts"), "utf8"));
  const eqW = bezKomentarzyP(await readFile(join(KORZEN, "src/core/Equipment.ts"), "utf8"));
  const prW = bezKomentarzyP(await readFile(join(KORZEN, "src/core/Progression.ts"), "utf8"));
  // ⚠ Arytmetyka rzutu mieszka od 2026-09-05 w `core/combat/DamageRoll.ts`.
  const drW = bezKomentarzyP(await readFile(join(KORZEN, "src/core/combat/DamageRoll.ts"), "utf8"));
  const atak = cialoMetody(gsW, "  private resolveAttack()");

  /* ── W10. Część ŻYWA: cykl rąk na PRAWDZIWYM rosterze (2026-09-07) ───────
     ⚠ **To NIE jest transkrypcja `GameScene`** — to model samej REGUŁY, dwa
     razy po cztery linijki, karmiony zasięgami z `CFG.ITEMS`. Asercje
     tekstowe niżej odpowiadają osobno na pytanie, czy scena tę regułę
     implementuje. Podział jest ten sam co w §Z: liczby żywe, okablowanie
     tekstem. */

  /** REGUŁA DZISIEJSZA: bramką jest zasięg POSTACI, ręka tylko wybiera cios. */
  function cyklNowy(zasiegPostaci, dystans, prob) {
    let reka = "weapon";
    let seq = "";
    for (let i = 0; i < prob; i++) {
      if (dystans > zasiegPostaci) { seq += "-"; continue; }
      seq += reka === "weapon" ? "M" : "O";
      reka = reka === "weapon" ? "offhand" : "weapon";
    }
    return seq;
  }
  /** REGUŁA SPRZED NAPRAWY: bramką był zasięg RĘKI NA KOLEI. Zostaje w pliku,
   *  bo bez niej nie widać, że guard pilnuje czegoś, co naprawdę się psuło. */
  function cyklStary(mainReach, offReach, dystans, prob) {
    let reka = "weapon";
    let seq = "";
    for (let i = 0; i < prob; i++) {
      const zasieg = reka === "weapon" ? mainReach : offReach;
      if (dystans > zasieg) { seq += "-"; continue; }
      seq += reka === "weapon" ? "M" : "O";
      reka = reka === "weapon" ? "offhand" : "weapon";
    }
    return seq;
  }

  // Legalne pary Dual Wieldu: obie ręce trzymają broń JEDNORĘCZNĄ (`W6`).
  const jednoreczne = Object.values(CFG.ITEMS).filter(
    (i) => i.type === "weapon" && (i.hands ?? 1) === 1 && i.melee,
  );
  /** Pary, w których off-hand sięga KRÓCEJ — czyli te, które się zacinały. */
  const paryKrotszy = [];
  for (const mh of jednoreczne) {
    for (const oh of jednoreczne) {
      if (oh.melee.reach < mh.melee.reach) paryKrotszy.push([mh, oh]);
    }
  }
  // Dystans w MARTWYM PASMIE: dalej niż sięga off-hand, bliżej niż ręka główna.
  const wPasmie = paryKrotszy.map(([mh, oh]) => [mh, oh, (mh.melee.reach + oh.melee.reach) / 2]);

  const dwWszystkieRotujaWPasmie = wPasmie.every(
    ([mh, , d]) => cyklNowy(mh.melee.reach, d, 6) === "MOMOMO",
  );
  const dwStaryZacinalSieWPasmie = wPasmie.every(
    ([mh, oh, d]) => cyklStary(mh.melee.reach, oh.melee.reach, d, 6) === "M-----",
  );
  const dwPozaZasiegiemCisza = wPasmie.every(
    ([mh, , ]) => cyklNowy(mh.melee.reach, mh.melee.reach + 1, 6) === "------",
  );
  const dwWZasieguMainStartuje = wPasmie.every(
    ([mh, , d]) => cyklNowy(mh.melee.reach, d, 1) === "M",
  );
  const dwWZasieguOffTakze = wPasmie.every(
    ([mh, , d]) => cyklNowy(mh.melee.reach, d, 2) === "MO",
  );

  const par = [
    // ── W1/W2. Naprzemienność ──────────────────────────────────────────
    ["W1. autoatak bierze profil z ręki NA KOLEI (`nextStrike`)", /const strike = this\.nextStrike\(\)/.test(bezKomentarzyP(atak))],
    ["W1. istnieje profil ciosu drugiej ręki (`offhandStrike`)", /private offhandStrike\(\): StrikeProfile \| null/.test(gsW)],
    ["W2. ręka przełącza się przy ZATWIERDZENIU zamachu, nie przy trafieniu", /pendingSwing = \{[\s\S]{0,600}?nextHand = strike\.hand === "weapon"/.test(gsW)],
    ["W2. …i cykl sam wraca na rękę główną, gdy druga przestaje być bronią", /if \(!Equipment\.dualWielding\)[\s\S]{0,80}?nextHand = "weapon"/.test(gsW)],
    // ── W3. Zamrożenie liczb rzutu ─────────────────────────────────────
    ["W3. ⭐ `rollDamage` bierze liczby z PROFILU, nie z żywego `Progression`", /rollDamage\(liczby: DamageRollInput\)/.test(plW) && /rollWeaponDamage\(liczby, this\.damageMultiplier\)/.test(plW)],
    /* ⚠ Do 2026-09-05 pytało „czy ciało `rollDamage` nie czyta żywego
       `Progression`". Ciało przeniosło się do `DamageRoll.ts` (W3 niżej
       pilnuje, że tamten plik nie zna `Progression` W OGÓLE), więc tutaj
       zostaje mocniejsze pytanie: **czy nakładka jest cienka.** Gdyby ktoś
       dopisał do niej choć jeden odczyt stanu, arytmetyka rzutu przestałaby
       być w całości osiągalna dla `tools/combat_benchmark.mjs`. */
    ["W3. …a nakładka w `Player` jest CIENKA (sama delegacja + mnożnik efektów)",
      cialoMetody(plW, "  rollDamage(").replace(/\s+/g, " ").trim() ===
        "liczby: DamageRollInput): DamageRollResult { return rollWeaponDamage(liczby, this.damageMultiplier); }"],
    /* ⚠⚠ **ZMIENIONE 2026-09-05 — dawna asercja brzmiała „`critChance`
       ZOSTAJE żywy (własność postaci, nie ręki)" i była NIEPRAWDĄ
       o kodzie, którego pilnowała.** `Progression.critChance` to
       `PLAYER.critChance + Equipment.bonusCritChance +
        Equipment.weaponMelee.critChanceBonus` — dwa pierwsze składniki
       należą do postaci, TRZECI do broni z ręki GŁÓWNEJ. W Dual Wieldzie
       cios off-handem losował więc krytyka szansą cudzej broni.
       Zmierzone na żywym configu: `Sztylet + Miecz` dawał +24,1% dps
       zamiast +19,5%, `Miecz + Sztylet` +11,7% zamiast +16,0% — układ
       nagradzał trzymanie broni o wysokim krytyku w ręce głównej.
       Guard nie został OSŁABIONY: pilnuje teraz mocniejszej własności
       (żaden parametr rzutu nie jest czytany na żywo). */
    ["W3. ⭐ szansa krytyka jest w PROFILU, czyli z ręki, która uderza",
      /critChance: number;/.test(gsW) && /critChance: n\.critChance/.test(gsW)],
    ["W3. ⛔ `rollDamage` NIE czyta już żywego `Progression.critChance`",
      /const crit = Math\.random\(\) < liczby\.critChance;/.test(drW) &&
        !/Progression/.test(drW)],
    ["W3. premia POSTACI (pierścienie) wchodzi do OBU rąk tak samo",
      /critChance: Math\.min\(\s*PLAYER\.critChance \+ Equipment\.bonusCritChance/.test(prW)],
    ["W3. wykonawca podaje profil (`rollDamage(strike)`)", /rollDamage\(strike\)/.test(gsW)],
    // ── W4. Jeden dom rozwiązywania broni ──────────────────────────────
    ["W4. off-hand rozwiązuje `Progression.offhandNumbers`", /get offhandNumbers\(\)/.test(prW)],
    ["W4. …a scena tylko składa profil (zero `getItem` w `offhandStrike`)", !/getItem\(/.test(cialoMetody(gsW, "  private offhandStrike()"))],
    ["W4. ukorzenienie off-handa z JEGO czasu zamachu (jedna arytmetyka)", /rootDurationForSwing\(/.test(prW) && /rootDurationForSwing\(strike\.swingDurationMs\)/.test(gsW)],
    // ── Koszt i zużycie idą za ręką ────────────────────────────────────
    ["W5. koszt staminy z PROFILU, nie z ręki głównej", /Stamina\.spend\(strike\.staminaCost/.test(gsW)],
    ["W5. zużywa się ta broń, która uderzyła", /wearWeapon\(strike\.hand\)/.test(gsW)],
    // ── Ograniczenia ekwipunku ─────────────────────────────────────────
    /* ⚠ Kształt tej reguły zmienił się 2026-09-11 razem z drugim ZESTAWEM broni
       (`STOW_SLOTS`): pytanie „czy to druga ręka" przestało być porównaniem
       z jednym stringiem, bo drugie ręce są od tej daty DWIE (`offhand`
       i `offhand2`). Sama reguła się nie zmieniła — zwęziła się o zestaw,
       którego dotyczy. Guard musiał pójść za nią, inaczej świeciłby na czerwono
       przy nienaruszonej własności; to jest ten sam powód, dla którego pilnuje
       ŹRÓDŁA liczby, a nie jej wartości. */
    ["W6. w drugiej ręce tylko broń JEDNORĘCZNA",
      /isOffHand\(slot\)\) return itemHands\(itemId\) === 1/.test(eqW)],
    ["W6. reguła obowiązuje w OBU zestawach (pytanie o zestaw slotu, nie o nazwę)",
      /usesBothHandsIn\(set\)\) return false/.test(eqW)],
    ["W6. tempo DW idzie ISTNIEJĄCYM kanałem `offhandSwingMul`", /dualWielding\) return DUAL_WIELD\.swingMul/.test(eqW)],
    // ── Czego prototyp NIE ma ──────────────────────────────────────────
    // ⚠ To nie jest ozdoba: brak kar jest DECYZJĄ (balans jest osobnym etapem),
    // więc ciche dołożenie mnożnika ma zapalić lampkę, a nie przejść.
    ["W7. ⛔ prototyp NIE ma mnożników kary MH/OH (balans = osobny etap)", !/offhandDamageMul|mainHandMul|dwPenalty/.test(gsW + eqW + prW)],

    /* ── W9. WYSIŁEK NIE SKRACA SIĘ RAZEM Z ZAMACHEM (2026-09-05) ───────
       ⚠⚠ Tożsamość DW brzmi „wysoki event rate, WIĘKSZE obciążenie
       staminy". Przed tą zmianą druga połowa nie zachodziła w ogóle:
       `swingStaminaCost` jest proporcjonalny do długości zamachu, a
       `DUAL_WIELD.swingMul` skraca zamach i cooldown TYM SAMYM mnożnikiem,
       więc mnożnik skracał się w rachunku. Zmierzone: DW miecz+sztylet
       kosztował **3,71 staminy/s wobec 3,96/s samego miecza** — czyli DW
       dostawał +24% ciosów TANIEJ niż jedna broń.
       Reguła: **szybciej machać wolno, machać taniej nie.**
       ⛔ To NIE jest kara MH/OH ani nowy stat — to wybór, którą długość
       zamachu wpuszcza się do ISTNIEJĄCEGO wzoru na wysiłek. W7 wyżej
       nadal pilnuje, że mnożnik kary nie istnieje. */
    ["W9. ⭐ wysiłek ręki głównej liczy się z zamachu BEZ przyspieszenia DW",
      /const dlugoscWysilku = this\.swingDurationMs \/ Equipment\.dualWieldSwingMul;/.test(prW)],
    ["W9. …to samo dla off-handa (jedna reguła, nie dwie)",
      /this\.offhandSwingDurationMs \/ Equipment\.dualWieldSwingMul \/ 1000/.test(prW)],
    ["W9. `dualWieldSwingMul` jest 1, gdy nie ma drugiej broni (zero wpływu na 1H)",
      /get dualWieldSwingMul\(\): number \{\s*return this\.dualWielding \? DUAL_WIELD\.swingMul : 1;/.test(eqW)],
    ["W9. ⛔ tarcza NIETKNIĘTA — `blockSpec.swingMul` nadal jedzie przez `offhandSwingMul`",
      /return this\.blockSpec\?\.swingMul \?\? 1;/.test(eqW)],    /* ── W8. KADENCJA PER-RĘKA (2026-09-05) ─────────────────────────────
       ⚠⚠ Do tej daty bramka po KAŻDYM ciosie brała `Progression.attackCooldown`,
       czyli tempo ręki GŁÓWNEJ — więc broń off-handa nie uczestniczyła
       w wyznaczaniu tempa w ogóle. Model „per-ręka": bramka należy do ręki,
       która uderzyła. Nadal JEDEN timer i jedna sekwencja, nie dwa niezależne.

       ⚠ **Umiejętności i finisher Wypadu MUSZĄ zostać na ręce głównej** — czyli
       nie podają `cooldownMs`. Gdyby zaczęły, Wypad kończyłby się ciosem
       bramkowanym cudzym tempem. */
    ["W8. `StrikeProfile` niesie kadencję tej ręki", /cooldownMs: number;/.test(gsW)],
    ["W8. bramka czyta kadencję CIOSU, z zejściem na broń główną", /attackReadyAt = nowMs \+ \(opts\.cooldownMs \?\? Progression\.attackCooldown \* 1000\)/.test(plW)],
    ["W8. ⭐ autoatak podaje kadencję ręki, która uderzyła", /cooldownMs: strike\.cooldownMs/.test(gsW)],
    ["W8. off-hand liczy kadencję TYM SAMYM wzorem (`swingMulPublic`, zero nowych mnożników)", /get offhandAttackCooldown\(\)[\s\S]{0,400}?swingMulPublic[\s\S]{0,120}?attackSpeedBonus/.test(prW)],
    ["W8. ⛔ finisher Wypadu NIE podaje kadencji (zostaje MH)", !/cooldownMs/.test(cialoMetody(gsW, "  private landRushStrike("))],
    ["W8. ⛔ i nie robi tego żadna umiejętność (jedyne podanie to autoatak)", (gsW.match(/cooldownMs: strike\.cooldownMs/g) ?? []).length === 1],

    /* ── W10. ZASIĘG AUTOATAKU NALEŻY DO POSTACI, NIE DO RĘKI (2026-09-07) ──
       ⚠⚠ **Naprawa CICHEGO ZASTOJU, nie strojenie.** Do tej daty profil
       off-handa niósł zasięg WŁASNEJ broni, a bramka przed zamachem odrzuca
       cios poza zasięgiem **zanim** `nextHand` zdąży się przełączyć (przełącza
       się przy zatwierdzeniu zamachu — W2). Przy mieczu 68 i sztylecie 56
       gracz w prześwicie 60 px zostawał więc z off-handem na kolei, który
       nigdy nie mógł wystrzelić, i **cykl zatrzymywał się na stałe**.
       Bez komunikatu: „Za daleko" pyta `currentStrike()`, czyli rękę główną,
       dla której cel BYŁ w zasięgu.

       ⚠ Kanon: *jeżeli postać jest w zasięgu swojego autoataku, ręka na kolei
       wykonuje swój normalny cios.* Autoatak jest abstrakcją, nie symulacją
       dwóch ramion.

       ⛔ **To nie rusza osłabienia off-handa** — pilnują tego W10f i W4/W5/W7. */
    ["W10a. ⭐ profil off-handa bierze zasięg POSTACI (`Progression.attackReach`)",
      /reach: Progression\.attackReach,/.test(cialoMetody(gsW, "  private offhandStrike()"))],
    ["W10a. ⛔ …i NIGDZIE nie pyta o własny zasięg broni z drugiej ręki",
      !/reach: def\.melee\?\.reach/.test(gsW)],
    // ⚠ Od 2026-09-16 bramka niesie OBIE granice (`minReach` — martwa strefa piki
    //   i halabardy). Reguła jest ta sama i tak samo pilnowana: **jedna bramka
    //   przed zamachem, ta sama para liczb przy trafieniu.**
    ["W10b. bramka PRZED zamachem pyta `strike.reach` + `strike.minReach` — i jest dokładnie JEDNA",
      /if \(!this\.targetInReach\(target!, strike\.reach, strike\.minReach\)\) return;/.test(bezKomentarzyP(atak)) &&
        (bezKomentarzyP(atak).match(/targetInReach\(/g) ?? []).length === 1],
    ["W10b. bramka PRZY TRAFIENIU pyta TĘ SAMĄ parę liczb (`damageLockedTarget`)",
      /targetInReach\(target, strike\.reach, strike\.minReach\)/.test(cialoMetody(gsW, "  private damageLockedTarget("))],
    ["W10c. przełączenie ręki nie ma innego warunku niż Dual Wield",
      /if \(Equipment\.dualWielding\) this\.nextHand = strike\.hand === "weapon" \? "offhand" : "weapon";/.test(gsW)],
    // ── Część ŻYWA, na całym rosterze jednoręcznym ──────────────────────
    ["W10d. istnieją pary DW z KRÓTSZYM off-handem (guard ma czego pilnować)",
      paryKrotszy.length > 0],
    ["W10d. ⭐ (1) w zasięgu postaci — MAIN atakuje", dwWZasieguMainStartuje],
    ["W10d. ⭐ (2) …a OFF-HAND atakuje również, mimo krótszej broni", dwWZasieguOffTakze],
    ["W10d. ⭐ (3) poza zasięgiem POSTACI — żadna ręka nie atakuje", dwPozaZasiegiemCisza],
    ["W10d. ⭐ (4) rotacja MAIN → OFF → MAIN → OFF bez pominięć", dwWszystkieRotujaWPasmie],
    ["W10e. ⛔ stara reguła (zasięg RĘKI) zacinała cykl na pierwszym ciosie",
      dwStaryZacinalSieWPasmie],
    /* ── W10f. (5) OSŁABIENIE OFF-HANDA BEZ ZMIAN ────────────────────────
       ⚠ Off-hand jest osłabiony CZTERMA istniejącymi kanałami i żaden z nich
       nie został tknięty. Gdyby naprawa zasięgu przy okazji podniosła
       którykolwiek, ta linia ma zapalić się na czerwono. */
    ["W10f. …obrażenia dalej z `offhandNumbers` (własna broń, nie ręki głównej)",
      /damageMin: n\.damageMin,/.test(cialoMetody(gsW, "  private offhandStrike()")) &&
        /damageMax: n\.damageMax,/.test(cialoMetody(gsW, "  private offhandStrike()"))],
    ["W10f. …Władanie i ranga dalej z off-handa",
      /proficiency: n\.proficiency,/.test(cialoMetody(gsW, "  private offhandStrike()")) &&
        /family: n\.family,/.test(cialoMetody(gsW, "  private offhandStrike()"))],
    ["W10f. …koszt wysiłku dalej własny", /staminaCost: n\.staminaCost,/.test(cialoMetody(gsW, "  private offhandStrike()"))],
    ["W10f. ⛔ `DUAL_WIELD.swingMul` = 0,85 (kadencja nietknięta)", CFG.DUAL_WIELD.swingMul === 0.85],

    /* ── W11. MARTWA STREFA (`melee.minReach`, 2026-09-16) ────────────────
       ⚠ Sekcja ŻYWA: woła prawdziwy `HitResolver.withinReach` na prawdziwym
       ciele wilka, a nie sprawdza tekstu źródła. Dwie własności, obie zdolne
       zaświecić na czerwono:
         • broń Z martwą strefą odmawia w zwarciu i trafia w paśmie,
         • broń BEZ niej zachowuje się dokładnie jak przed zmianą.
       ⛔ Druga jest ważniejsza od pierwszej — to ona pilnuje, że parametr
       nie ruszył 18 pozostałych konstrukcji. */
    ...(() => {
      const wilk = { hurtDepth: 18, hurtWidth: 18 };
      const cialoWilka = { x: 0, y: 0, radius: 9 };
      const gapDo = (odl) => HR.withinReach({ x: -odl - 9, y: 0 }, cialoWilka, 9999) ? odl : odl;
      // Prześwit = odległość środków − promień ciała. Stawiamy gracza tak, żeby
      // prześwit wyszedł dokładnie taki, jaki chcemy zbadać.
      const wPrzeswicie = (g, reach, minReach) =>
        HR.withinReach({ x: -(g + cialoWilka.radius), y: 0 }, cialoWilka, reach, minReach);
      const pika = CFG.ITEMS.pike.melee;
      const miecz = CFG.ITEMS.sword.melee;
      const bezStrefy = Object.values(CFG.ITEMS).filter(
        (i) => i.type === "weapon" && !(i.melee && "minReach" in i.melee),
      );
      const bronieW = Object.entries(CFG.ITEMS).filter(([, i]) => i.type === "weapon");
      const zeStrefa = bronieW.filter(([, i]) => i.melee && "minReach" in i.melee);
      // ⚠⚠ **Rodziny, które martwą strefę MAJĄ, muszą mieć też konstrukcję
      //   BEZ niej** — to jest cała treść `W11d` uogólniona na cały katalog
      //   i jedyny sposób, żeby powiedzieć „to własność KONSTRUKCJI"
      //   bez wymieniania konstrukcji z nazwy.
      const rodzinyZeStrefa = [...new Set(zeStrefa.map(([, i]) => i.family ?? "—"))];
      const rodzinaMaTezBezStrefy = (f) =>
        bronieW.some(([, i]) => (i.family ?? "—") === f && !(i.melee && "minReach" in i.melee));
      return [
        ["W11a. ⭐ pika NIE trafia w zwarciu (prześwit 20 < minReach 62)",
          !wPrzeswicie(20, pika.reach, pika.minReach)],
        ["W11a. ⭐ …ani tuż pod progiem (61)", !wPrzeswicie(61, pika.reach, pika.minReach)],
        ["W11b. pika TRAFIA dokładnie na progu (62) — `>=`, nie `>`",
          wPrzeswicie(62, pika.reach, pika.minReach)],
        ["W11b. …i w całym paśmie roboczym (62–128)",
          wPrzeswicie(90, pika.reach, pika.minReach) && wPrzeswicie(128, pika.reach, pika.minReach)],
        ["W11b. ⛔ …a poza zasięgiem górnym dalej nie trafia (129)",
          !wPrzeswicie(129, pika.reach, pika.minReach)],
        ["W11c. ⛔ MIECZ trafia w zwarciu — brak `minReach` nic nie zmienił",
          wPrzeswicie(0, miecz.reach, 0) && wPrzeswicie(20, miecz.reach, 0)],
        ["W11c. ⛔ …a martwa strefa zostaje MNIEJSZOŚCIĄ i nie spływa po rodzinie",
          // ⚠⚠ **Dwa razy w jednym dniu stał tu licznik, który zestarzał się
          //   przy następnej broni.** Najpierw `bezStrefy.length === 18`, potem
          //   lista `glaive,halberd,pike` — tę drugą przewrócił **wielki miecz**,
          //   czyli pierwsza martwa strefa POZA rodziną drzewcową, i przewrócił
          //   ją słusznie: lista nie była niezmiennikiem, tylko migawką rosteru.
          //   ⭐ Poniżej stoi wreszcie REGUŁA, a nie spis treści.
          zeStrefa.length > 0 && zeStrefa.length * 3 <= bronieW.length &&
            rodzinyZeStrefa.every(rodzinaMaTezBezStrefy),
        ],
        ["W11d. martwa strefa jest własnością KONSTRUKCJI, nie rodziny",
          CFG.ITEMS.spear.family === "polearm" && !("minReach" in CFG.ITEMS.spear.melee) &&
            CFG.ITEMS.pike.family === "polearm" && CFG.ITEMS.pike.melee.minReach > 0],
        ["W11e. każda martwa strefa jest WĘŻSZA od swojego zasięgu (pasmo > 0)",
          Object.values(CFG.ITEMS).every((i) =>
            i.type !== "weapon" || !i.melee?.minReach || i.melee.minReach < i.melee.reach)],
      ];
    })(),
  ];
  for (const [opis, ok] of par) {
    console.log(`  ${ok ? "OK  " : "BŁĄD"} ${opis}`);
    if (!ok) bledy.push(`§W: ${opis} — nie zachodzi`);
  }
  console.log();
}

/* ══════════════════════════════════════════════════════════════════════════
   §X. TRZY STREFY OSŁONY TARCZĄ (2026-09-05)
   ══════════════════════════════════════════════════════════════════════════
   Blok przestał być binarny: pełny z przodu, osłabiony z boku, żaden z tyłu.
   Sześć rzeczy, z których każdą da się złamać po cichu i żadnej nie złapie
   `tsc`:

     X1 — niezmiennik `fullArcDeg ≤ sideArcDeg ≤ 180`;
     X2 — `guardZone` NIE ma własnej geometrii (dwa `isFrontal`, zero acos) —
          druga kopia konwencji granicy to błąd, który ten projekt już raz
          zapłacił (patrz komentarz o cosinusach w `isFrontal`);
     X3 — **PAROWANIE zostaje na półkuli 90°**. Najbardziej kusząca cicha
          zmiana w całej tej robocie: `zone !== "back"` czyta się jak sprzątanie,
          a poszerza parowanie o pas boczny;
     X4 — mnożnik strefy wchodzi do resolvera PARAMETREM, nie importem `SHIELD`
          (warunek uruchomienia resolvera poza Phaserem — patrz jego nagłówek);
     X5 — `Player` nie ODTWARZA redukcji z `outcome`;
     X6 — martwe `blockFraction` nie wraca.

   ⚠ X7 jest FUNKCJONALNE, na żywym module: klasyfikacja kątów. Asercja
   tekstowa mówi tylko, że ktoś napisał właściwe słowa.
   ══════════════════════════════════════════════════════════════════════════ */
{
  console.log("§X. Trzy strefy osłony tarczą:");
  const protX = await readFile(join(KORZEN, "src/core/Protection.ts"), "utf8");
  const resX = await readFile(join(KORZEN, "src/core/DamageResolver.ts"), "utf8");
  const plX = bezKomentarzyP(await readFile(join(KORZEN, "src/entities/Player.ts"), "utf8"));
  const zoneBody = bezKomentarzyP(
    protX.slice(protX.indexOf("export function guardZone"), protX.indexOf("export function isFrontal")),
  );
  const resBody = bezKomentarzyP(resX.slice(resX.indexOf("export function resolveIncoming")));
  const S = CFG.SHIELD;

  const plikiX = [];
  const zejdzX = async (kat) => {
    for (const wpis of await readdir(kat, { withFileTypes: true })) {
      const pelna = join(kat, wpis.name);
      if (wpis.isDirectory()) await zejdzX(pelna);
      else if (wpis.name.endsWith(".ts")) plikiX.push(pelna);
    }
  };
  await zejdzX(join(KORZEN, "src"));
  const martwe = [];
  for (const f of plikiX) {
    if (/\bblockFraction\b/.test(bezKomentarzyP(await readFile(f, "utf8")))) martwe.push(f.replace(KORZEN + "\\", ""));
  }

  const par = [
    ["X1. niezmiennik fullArcDeg ≤ sideArcDeg ≤ 180", S.fullArcDeg > 0 && S.fullArcDeg <= S.sideArcDeg && S.sideArcDeg <= 180],
    ["X1. niezmiennik fullArcDeg ≤ blockArcDeg (półkula parowania)", S.fullArcDeg <= S.blockArcDeg],
    ["X2. `guardZone` woła isFrontal DWA razy (zewnętrzna + pełna)", (zoneBody.match(/isFrontal\(/g) ?? []).length === 2],
    // ⚠ Przepisane 2026-09-16 (`T-1`): granice przychodzą PARAMETREM `geo`, ale
    //   nadal nie wolno im być literałem w ciele funkcji. Fallback
    //   `defaultGuardGeometry()` jest jedynym miejscem czytającym `SHIELD`.
    ["X2. `guardZone` bierze granice z profilu `geo`, nie z literałów", /isFrontal\(facing, from, geo\.sideArcDeg\)[\s\S]{0,200}isFrontal\(facing, from, geo\.fullArcDeg\)/.test(zoneBody)],
    ["X2. ⛔ `guardZone` nie zawiera liczby stopni na sztywno", !/[^\w.](45|60|90|100|135|180)\b/.test(zoneBody)],
    ["X2. ⭐ fallback czyta `SHIELD` — globalne 60°/100° nadal jedynym źródłem", /function defaultGuardGeometry\(\)[\s\S]{0,240}SHIELD\.fullArcDeg[\s\S]{0,120}SHIELD\.sideArcDeg/.test(protX)],
    ["X2. ⭐ niepełny profil konstrukcji SPADA na fallback (zero cichego `NaN`)", /Number\.isFinite\(wpis\.fullArcDeg\)[\s\S]{0,120}Number\.isFinite\(wpis\.sideArcDeg\)/.test(protX)],
    ["X2. ⛔ `guardZone` NIE ma własnej geometrii (acos / angleBetweenDeg / RAD_TO_DEG)", !/acos|angleBetweenDeg|RAD_TO_DEG/.test(zoneBody)],
    ["X3. ⭐ PAROWANIE nadal na `isFrontal(ctx.guardDir, ctx.from)`", /const frontal = isFrontal\(ctx\.guardDir, ctx\.from\);\s*\n\s*if \(frontal && Defense\.rollParry/.test(resBody)],
    ["X3. ⛔ parowanie NIE zostało przepięte na strefy", !/zone !== "back" && Defense\.rollParry|frontal = zone !== "back"/.test(resBody)],
    ["X4. blok czyta STREFĘ i mnoży bok przez `ctx.blockSideMul`", /zone === "front" \? ctx\.blockReduction : zone === "side" \? ctx\.blockReduction \* ctx\.blockSideMul : 0/.test(resBody)],
    ["X4. ⛔ resolver nie czyta `SHIELD` (mnożnik wchodzi parametrem)", !bezKomentarzyP(resX).includes("SHIELD")],
    ["X5. `Player` czyta werdykt, nie odtwarza redukcji", /const zablokowano = wynik\.outcome === "block";/.test(plX)],
    ["X5. ⛔ nie ma odtwarzania `blockSpec.reduction` z `outcome`", !/outcome === "block" \? Equipment\.blockSpec/.test(plX)],
    ["X5. `Player` podaje mnożnik strefy do resolvera", /blockSideMul: SHIELD\.sideZoneMul/.test(plX)],
    ["X6. ⛔ martwe `blockFraction` nie wróciło do `src/`", martwe.length === 0],
  ];

  // ── X7. KLASYFIKACJA KĄTÓW — na ŻYWYM module, nie na tekście ───────────
  // ⚠ Granice sprawdzane MARGINESAMI (59/61, 99/101), bo `kier(60)` wychodzi
  //   59.99999999999999 i wypadłby po stronie `front` — artefakt wektora
  //   testowego, nie kodu. Konwencję ostrego `<` dowodzi wiersz 90°, bo ten
  //   kąt ma reprezentację dokładną (zmierzone).
  const strefy = [
    [0, "front"], [45, "front"], [59, "front"],
    [61, "side"], [90, "side"], [99, "side"],
    [101, "back"], [135, "back"], [180, "back"],
  ];
  for (const [deg, oczek] of strefy) {
    const r = (deg * Math.PI) / 180;
    const got = PROT.guardZone(0, { x: Math.sin(r), y: Math.cos(r) });
    par.push([`X7. ${String(deg).padStart(3)}° → ${oczek}`, got === oczek]);
  }
  par.push(["X7. from = null → back (cios bez kierunku)", PROT.guardZone(0, null) === "back"]);
  par.push(["X7. wektor zerowy (NaN) → back", PROT.guardZone(0, { x: 0, y: 0 }) === "back"]);

  for (const [opis, ok] of par) {
    console.log(`  ${ok ? "OK  " : "BŁĄD"} ${opis}`);
    if (!ok) bledy.push(`§X: ${opis} — nie zachodzi`);
  }
  console.log();
}

/* ══════════════════════════════════════════════════════════════════════════
   §Y. TOŻSAMOŚĆ 2H — CO WYNIKA Z LICZB, A CO NIE (2026-09-05)
   ══════════════════════════════════════════════════════════════════════════
   Pięć cech tożsamości 2H: wolniejsza · większy zasięg · duże obrażenia ·
   trudniejsza do zablokowania · trudniejsza do sparowania.

   ⚠⚠ **Trzy pierwsze NIE MAJĄ własnego mechanizmu i mieć nie mają** — wynikają
   wprost z liczb broni (`attackCooldown`, `swingDurationMs`, `reach`,
   `damageMin/Max`). Ten strażnik pilnuje, żeby wynikały NAPRAWDĘ, bo cecha
   tożsamości oparta na danych rozpada się cicho przy pierwszym nowym
   przedmiocie — i dokładnie tak się stało z `war_hammer` (reach 74, czyli tyle
   co starterowy kij).

   ⚠⚠ **Dwie ostatnie są NIEOSIĄGALNE i to jest USTALENIE, nie brak.** Wrogowie
   nie mają bloku ani parowania — `Protection.guardZone` i `DamageResolver`
   obsługują wyłącznie ciosy PRZYCHODZĄCE DO GRACZA. Y5 pilnuje, żeby nikt nie
   dołożył 2H „premii przeciw blokowi", która nie miałaby na co działać.

   ⚠⚠ **`hammer` (Młot) to UDOKUMENTOWANA ANOMALIA.** Jest `hands: 1`, ale ma
   parametry 2H (14–20 obr., cd 0,65, swing 240, reach 78) i **łamie wszystkie
   trzy cechy od strony jednoręcznej**. Dlatego asercje niżej porównują się do
   „najlepszej 1H **poza Młotem**", a Y4 trzyma tę anomalię jawnie: gdyby ktoś
   naprawił Młota, Y4 zaświeci i każe usunąć wyjątek zamiast go dziedziczyć.
   ⛔ Nie „naprawiaj" tego przesuwaniem liczb — to rebalans rosteru, osobna
   decyzja (`docs/konfiguracje_broni_checkpoint.md` §2 pkt 4).
   ══════════════════════════════════════════════════════════════════════════ */
{
  console.log("§Y. Tożsamość 2H — co wynika z liczb:");
  const bronie = Object.entries(CFG.ITEMS).filter(([, i]) => i.type === "weapon");
  const dwureczne = bronie.filter(([, i]) => i.hands === 2);
  const ANOMALIA = "hammer";
  const jednoreczne = bronie.filter(([id, i]) => i.hands !== 2 && id !== ANOMALIA);
  const anomalia = CFG.ITEMS[ANOMALIA];

  const avg = (i) => (i.damageMin + i.damageMax) / 2;
  const najlepsza1H = (f) => Math.max(...jednoreczne.map(([, i]) => f(i)));
  const najgorsza2H = (f) => Math.min(...dwureczne.map(([, i]) => f(i)));

  const par = [
    ["Y0. roster ma broń `hands: 2`", dwureczne.length >= 3],
    // ── Y1–Y3: trzy cechy wynikające z danych ──────────────────────────
    [`Y1. WOLNIEJSZA — każda 2H ma dłuższy cooldown niż każda 1H (poza ${ANOMALIA})`,
      najgorsza2H((i) => i.attackCooldown) > najlepsza1H((i) => i.attackCooldown)],
    ["Y1. WOLNIEJSZA — to samo dla `swingDurationMs` (root idzie za zamachem)",
      najgorsza2H((i) => i.swingDurationMs) > najlepsza1H((i) => i.swingDurationMs)],
    [`Y2. ⭐ WIĘKSZY ZASIĘG — każda 2H sięga dalej niż każda 1H (poza ${ANOMALIA})`,
      najgorsza2H((i) => i.melee.reach) > najlepsza1H((i) => i.melee.reach)],
    ["Y3. DUŻE OBRAŻENIA — najsłabsza 2H bije mocniej niż najmocniejsza 1H",
      najgorsza2H(avg) > najlepsza1H(avg)],
    // ── Y4: anomalia trzymana JAWNIE ───────────────────────────────────
    [`Y4. \`${ANOMALIA}\` nadal jest \`hands: 1\` (jeśli nie — USUŃ wyjątek z Y1–Y3)`,
      anomalia !== undefined && anomalia.hands !== 2],
    ["Y4. …i nadal łamie tożsamość od strony 1H (dlatego wyjątek istnieje)",
      anomalia.melee.reach > najgorsza2H((i) => i.melee.reach) ||
        anomalia.attackCooldown > najgorsza2H((i) => i.attackCooldown) ||
        avg(anomalia) > najgorsza2H(avg)],
    // ── Y5: dwie cechy NIEOSIĄGALNE — zamek na placebo ─────────────────
    // ⚠ Bez `\b` z przodu: `_blockReduction`, `enemyBlockReduction` i każda inna
    //   ozdobna przedrostka MA zostać złapana. Ta asercja PRZESZłA sabotaż, zanim
    //   to poprawiono — reguła „asercja, która nie potrafi zaświecić na czerwono,
    //   jest dekoracją" z `CLAUDE.md`.
    ["Y5. ⛔ wróg nadal NIE ma bloku ani parowania (więc 2H nie ma czego przebijać)",
      !/blockReduction|parryChance|blockSpec|guardZone|isFrontal/.test(bezKomentarzyP(await readFile(join(KORZEN, "src/entities/Enemy.ts"), "utf8")))],
    // ⚠⚠ **`Progression` nie ma prawa PYTAĆ o liczbę rąk.** Nie „nie mnoży przez
    //   to niczego" — nie pyta w ogóle. Słabsza wersja (szukanie mnożnika obok
    //   `hands === 2`) PRZESZŁA sabotaż, bo wystarczyło nazwać zmienną inaczej.
    //   Liczba rąk rozstrzyga się w `Equipment`; warstwa licząca cios o nią nie
    //   pyta. To jest zamek na „+X% bo dwuręczna".
    //   ⚠ **Bez `\b`**: `Equipment.itemHands === 2` MA zostać złapane. Wersja
    //   z granicą słowa przeszła sabotaż, bo `itemHands` nie zaczyna się od
    //   `hands`. Sprawdzone: po odjęciu komentarzy `Progression.ts` nie ma
    //   dziś ani jednego wystąpienia „hands" w kodzie, więc próg jest zerowy.
    ["Y5. ⛔ `Progression` w ogóle nie rozgałęzia się po liczbie rąk",
      !/[Hh]ands/.test(bezKomentarzyP(await readFile(join(KORZEN, "src/core/Progression.ts"), "utf8")))],
  ];

  for (const [opis, ok] of par) {
    console.log(`  ${ok ? "OK  " : "BŁĄD"} ${opis}`);
    if (!ok) bledy.push(`§Y: ${opis} — nie zachodzi`);
  }
  console.log(
    `  info  2H: ${dwureczne.map(([id, i]) => `${id} r${i.melee.reach}/cd${i.attackCooldown}/d${avg(i)}`).join("  ")}`,
  );
  console.log(
    `  info  najlepsza 1H poza ${ANOMALIA}: reach ${najlepsza1H((i) => i.melee.reach)}, cd ${najlepsza1H((i) => i.attackCooldown)}, dmg ${najlepsza1H(avg)}` +
      `  |  ${ANOMALIA}: reach ${anomalia.melee.reach}, cd ${anomalia.attackCooldown}, dmg ${avg(anomalia)}`,
  );
  console.log();
}

/* ══════════════════════════════════════════════════════════════════════════
   §Z. DZIK — KIEDY WOLNO ZACZĄĆ SZARŻĘ (2026-09-05, po playteście)
   ══════════════════════════════════════════════════════════════════════════
   Zgłoszone z gry: dzik szarżował **stojąc przy graczu** (czytało się to jak
   „mam tylko jeden atak") oraz **przez drzewo** — zaczynał lot, zapierał się
   o kolizję i tracił całą akcję.

   ⚠⚠ **Ten strażnik pilnuje WYŁĄCZNIE warunków wejścia.** Wszystkie liczby
   szarży (obrażenia, cooldown, prędkość, czas, zasięg wyzwalania, knockback)
   mają zostać nietknięte i Z4 sprawdza to wprost — inaczej „poprawka warunków"
   byłaby wygodnym miejscem na cichy balans.

   Z1 — jest próg BLISKI i bierze się z istniejącego `gore.range`;
   Z2 — jest test toru i pyta `NavGrid`, nie własnej kopii kolizji;
   Z3 — oba warunki stoją PRZED `request`, więc zablokowana szarża nie
        zostawia dzika w stanie akcji (wymaganie „brak nieskończonej szarży");
   Z4 — ⛔ żadna liczba szarży się nie zmieniła;
   Z5 — FUNKCJONALNIE, na żywym `NavGrid`: czysta linia przechodzi, linia przez
        nieprzejezdną komórkę nie. Asercja tekstowa mówi tylko, że ktoś napisał
        właściwe słowa.
   ══════════════════════════════════════════════════════════════════════════ */
{
  console.log("§Z. Dzik — warunki wejścia w szarżę:");
  const boarSrc = await readFile(join(KORZEN, "src/entities/Boar.ts"), "utf8");
  const boar = bezKomentarzyP(boarSrc);
  const warunek = boar.slice(boar.indexOf("if (dist <= c.triggerRange"), boar.indexOf("if (dist <= c.triggerRange") + 260);

  const par = [
    // ⚠ **Pytamy o WYWOŁANIE W BRAMCE, nie o istnienie metody.** Pierwsza wersja
    //   sprawdzała `/chargeOdlegloscOk/.test(boar)` i przechodziła sabotaż:
    //   wystarczyło wyjąć wywołanie z `if`, zostawiając martwą metodę w pliku.
    ["Z1. próg BLISKI stoi w BRAMCE szarży", /this\.chargeOdlegloscOk\(player\)/.test(warunek)],
    ["Z1. …i bierze się z istniejącego `BOAR.gore.range` (zero nowych liczb)",
      /chargeOdlegloscOk\([\s\S]{0,120}?gapBetween\(this\.combatBody, player\.combatBody\) > BOAR\.gore\.range/.test(boar)],
    ["Z1. …mierzy PRZEŚWIT, tą samą miarą co gałąź kła", (boar.match(/gapBetween\(this\.combatBody, player\.combatBody\)/g) ?? []).length >= 2],
    ["Z2. test toru stoi w BRAMCE szarży (ten sam powód co przy Z1)", /this\.chargeTorWolny\(player\)/.test(warunek)],
    // ⚠ **Wzorzec ROZLUŹNIONY 2026-09-07 — asercja pinowała ŹRÓDŁO WSPÓŁRZĘDNYCH,
    //   a nazywa się „pyta siatkę, nie własnej kolizji".** Ujednolicenie
    //   przestrzeni ruchu przestawiło argumenty z duszków na `combatOrigin`
    //   i ta bramka zapaliła się na czerwono — poprawnie, bo różnica JEST
    //   sygnałem. Ale sygnał dotyczył czegoś, czego ta asercja nie pilnowała.
    //   Rozdzielone więc na dwa pytania, oba nadal umiejące zaświecić:
    //   pierwsze pada, gdy dzik dorobi się własnej kolizji; drugie — gdy tor
    //   wróci do przestrzeni duszków.
    ["Z2. …i pyta `NavGrid.hasClearLine`, nie własnej kolizji",
      /chargeTorWolny\([\s\S]{0,400}?nav\.hasClearLine\(/.test(boar)],
    ["Z2. …a tor trasuje w przestrzeni CIAŁ (ta sama, w której leci szarża)",
      /chargeTorWolny\([\s\S]{0,400}?player\.combatOrigin[\s\S]{0,200}?nav\.hasClearLine\(/.test(boar)
        && !/nav\.hasClearLine\(this\.x, this\.y/.test(boar)],
    ["Z2. ⛔ Boar NIE dostał własnego omijania przeszkód (zero pathfindingu w encji)",
      !/PathSolver|findPath|astar|A\*/i.test(boar)],
    ["Z3. ⭐ oba warunki stoją PRZED `request` (zablokowana szarża nie startuje akcji)",
      /dist <= c\.triggerRange && this\.chargeOdlegloscOk\(player\) && this\.chargeTorWolny\(player\) && this\.akcje\.request\(AKCJE\.boarCharge/.test(warunek)],
  ];

  // ── Z4. ⛔ ANI JEDNA LICZBA SZARŻY SIĘ NIE ZMIENIŁA ───────────────────
  const OCZEK_CHARGE = {
    triggerRange: 175, telegraphMs: 560, speed: 300, durationMs: 420,
    hitReach: 20, cooldownMs: 2200, recoverMs: 750, damageMin: 16, damageMax: 24,
  };
  for (const [pole, wart] of Object.entries(OCZEK_CHARGE)) {
    par.push([`Z4. ⛔ BOAR.charge.${pole} = ${wart} (bez zmian)`, CFG.BOAR.charge[pole] === wart]);
  }
  par.push(["Z4. ⛔ BOAR.gore.range = 18 (próg bliski nie został przestrojony)", CFG.BOAR.gore.range === 18]);

  // ── Z5. FUNKCJONALNIE, na żywym NavGrid ──────────────────────────────
  const tmpNav = join(KORZEN, "node_modules", ".navgrid-regresja.mjs");
  await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/movement/NavGrid.ts")], outfile: tmpNav, alias: { phaser: stubPhaser } });
  const NAV = await import(pathToFileURL(tmpNav).href);
  await unlink(tmpNav).catch(() => {});

  if (typeof NAV.NavGrid?.build !== "function") {
    par.push(["Z5. `NavGrid.build` nie daje się uruchomić w Node — strażnik stracił cel", false]);
  } else {
    // ⚠ **Prawdziwa fabryka `NavGrid.build(boxes, widthPx, heightPx)`** — ta
    //   sama, którą woła gra. Jedna przeszkoda: pionowy słup pośrodku planszy.
    // ⚠ Linie prowadzone są DALEKO od krawędzi, bo `passable` porównuje
    //   PRZEŚWIT (`clearanceAt >= bodyW`), a przy brzegu siatki prześwit z
    //   natury spada — linia tuż przy krawędzi byłaby zablokowana przez samą
    //   ramę mapy i test mierzyłby nie to, co trzeba.
    const W = 480;
    const H = 480;
    // ⚠ `NavBox` ma pola `w`/`h`, nie `width`/`height` — pierwsza wersja tego
    //   strażnika użyła złych nazw i przeszkoda po prostu nie powstawała, więc
    //   asercja „linia przez przeszkodę" świeciła na zielono z niewłaściwego powodu.
    const slup = [{ x: 220, y: 200, w: 40, h: 80 }];
    const nav = NAV.NavGrid.build(slup, W, H);
    const BODY = 8;
    const przezSlup = nav.hasClearLine(120, 240, 360, 240, BODY);
    const obok = nav.hasClearLine(120, 400, 360, 400, BODY);
    par.push(["Z5. ⭐ linia PRZEZ przeszkodę → brak czystego toru", przezSlup === false]);
    par.push(["Z5. ⭐ ta sama długość obok przeszkody → tor czysty", obok === true]);
    par.push([
      "Z5. `firstBlockedOn` wskazuje punkt NA przeszkodzie, nie byle gdzie",
      (() => {
        const t = nav.firstBlockedOn(120, 240, 360, 240, BODY);
        return t !== null && t.x > 120 && t.x < 360;
      })(),
    ]);
  }

  for (const [opis, ok] of par) {
    console.log(`  ${ok ? "OK  " : "BŁĄD"} ${opis}`);
    if (!ok) bledy.push(`§Z: ${opis} — nie zachodzi`);
  }
  console.log();
}

console.log("KONTROLA KRZYŻOWA transkrypcji (ręczna arytmetyka vs kod):\n");
// niedźwiedź: klatka 64×33, skala 1,6 → display 102,4 × 52,8 → max × 0,35
krzyz("allowance niedźwiedzia = max(102,4; 52,8) × 0,35", 102.4 * 0.35, legacy.allowance(nowyWrog("niedzwiedz", 0, 0)));
// wilk: 28×28 × 1,8 = 50,4 → 50,4 × 0,35 = 17,64
krzyz("allowance wilka = 50,4 × 0,35", 17.64, legacy.allowance(nowyWrog("wilk", 0, 0)));
// dzik leather 22 vs pierce: mnożnik z ARMOR_PROFILE, potem d/(d+K), potem round
{
  const mul = CFG.ARMOR_PROFILE.leather.pierce;
  const pkt = 22 * mul;
  const red = Math.min(pkt / (pkt + CFG.EQUIPMENT.defenseK), CFG.EQUIPMENT.maxDefenseReduction);
  krzyz("dzik: 45 pierce przez leather 22", Math.max(1, Math.round(45 * (1 - red))), legacy.obrazeniaWroga(45, BOAR.armor, "pierce"));
}
console.log();

/* ══════════════════════════════════════════════════════════════════════════
   Porównanie z baseline'em
   ══════════════════════════════════════════════════════════════════════════ */

await Promise.all([stubPhaser, tmpProt, tmpDef, tmpCfg].map((p) => unlink(p).catch(() => {})));

// Rozkład — tabela, w której wszystko trafia albo wszystko pudłuje, niczego nie
// broni. To jest asercja o SILE testu, nie o kodzie produkcyjnym.
{
  const geo = wyniki.filter((r) => "trafienie" in r);
  const traf = geo.filter((r) => r.trafienie).length;
  console.log(`Rozkład geometrii: ${traf} trafień / ${geo.length - traf} pudeł (z ${geo.length}).`);
  const outc = {};
  for (const r of wyniki.filter((x) => x.outcome)) outc[r.outcome] = (outc[r.outcome] ?? 0) + 1;
  console.log("Rozstrzygnięcia:", JSON.stringify(outc));
  if (traf === 0 || traf === geo.length) {
    bledy.push("BŁĄD: wszystkie przypadki geometrii dają ten sam wynik — tabela niczego nie rozróżnia.");
  }
  for (const w of ["dodge", "parry", "block", "hit", "immune"]) {
    if (!outc[w]) bledy.push(`BŁĄD: żaden przypadek nie kończy się wynikiem "${w}" — łańcuch obrony nie jest pokryty.`);
  }
  console.log();
}

/* ══════════════════════════════════════════════════════════════════════════
   §U. PAKIET OBRAŻEŃ JEST JEDNOSKŁADNIKOWY — zamek pod `primaryType()`

   ⚠ **To nie jest test arytmetyki, tylko ZAMEK NA NIEROZSTRZYGNIĘTEJ
   DECYZJI.** `DamagePacket` wprowadzono 2026-09-03 jako kontrakt, ale
   mitygacja pakietu WIELOSKŁADNIKOWEGO została świadomie nierozstrzygnięta
   (podłoga `Math.max(1, …)` per komponent czy na sumie; jeden mnożnik bloku
   i pancerza czy redukcja per komponent). Do czasu tej decyzji warstwa 3
   pracuje na SUMIE, a `primaryType()` zwraca typ PIERWSZEGO komponentu.

   `primaryType()` jest poprawne dokładnie dopóty, dopóki komponent jest
   JEDEN. Drugi czyni z niego pytanie bez dobrej odpowiedzi — i wtedy ta
   sekcja ma **zaświecić na czerwono**, zamiast pozwolić, żeby decyzja
   o mitygacji zapadła przez przypadek implementacji.

   U1. Fabryka `physicalDamage` produkuje DOKŁADNIE jeden komponent.
   U2. `mapAmounts` NIE zmienia ich liczby (skaluje, nie rozszczepia).
   U3. **Nośna asercja:** `physicalDamage` jest JEDYNYM konstruktorem pakietu
       w całym `src/`. Dopiero razem z U1 znaczy to, że każdy pakiet w grze ma
       jeden komponent — bez U3 pierwsza asercja dowodziłaby samej siebie. */
{
  console.log("§U. Pakiet obrażeń — jednoskładnikowy (zamek pod `primaryType`):");
  const tmpDP = join(KORZEN, ".tmp_damagepacket.mjs");
  await build({ ...wspolne, entryPoints: [join(KORZEN, "src/core/combat/DamagePacket.ts")], outfile: tmpDP, alias: { phaser: stubPhaser } });
  const DP = await import(pathToFileURL(tmpDP).href);
  await unlink(tmpDP).catch(() => {});
  const { physicalDamage, mapAmounts, totalAmount, primaryType } = DP;

  const pakiet = physicalDamage(12, "slash");
  const u1 = pakiet.components.length === 1 && totalAmount(pakiet) === 12 && primaryType(pakiet) === "slash";
  console.log(`  ${u1 ? "OK  " : "BŁĄD"} U1. physicalDamage → 1 komponent, suma 12, typ "slash"`);
  if (!u1) bledy.push("§U1: `physicalDamage` nie produkuje pojedynczego komponentu — `primaryType` przestaje być poprawne.");

  const podwojony = mapAmounts(pakiet, (a) => a * 2);
  const u2 = podwojony.components.length === 1 && totalAmount(podwojony) === 24;
  console.log(`  ${u2 ? "OK  " : "BŁĄD"} U2. mapAmounts skaluje, nie rozszczepia (${podwojony.components.length} komponent)`);
  if (!u2) bledy.push("§U2: `mapAmounts` zmienia liczbę komponentów — mnożnik nie ma prawa tworzyć składowych.");

  /* U3. Skan źródeł: kto składa pakiet z pominięciem fabryki.
     ⚠ Zwykłe `includes`, bez wyrażeń regularnych — ta sama reguła i ten sam
     powód co przy strażniku czystości wyżej. */
  const NOWA_LINIA = String.fromCharCode(10);
  const plikiTs = [];
  const zejdz = async (kat) => {
    for (const wpis of await readdir(kat, { withFileTypes: true })) {
      const pelna = join(kat, wpis.name);
      if (wpis.isDirectory()) await zejdz(pelna);
      else if (wpis.name.endsWith(".ts")) plikiTs.push(pelna);
    }
  };
  await zejdz(join(KORZEN, "src"));
  const WLASCICIEL = join("src", "core", "combat", "DamagePacket.ts");
  const obcy = [];
  for (const plik of plikiTs) {
    if (plik.endsWith(WLASCICIEL)) continue;
    // Linie komentarza odpadają — wolno o pakiecie PISAĆ, nie wolno go składać.
    const kod = (await readFile(plik, "utf8"))
      .split(NOWA_LINIA)
      .filter((l) => {
        const t = l.trim();
        return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
      })
      .join(NOWA_LINIA);
    if (kod.includes("components:")) obcy.push(plik.slice(KORZEN.length + 1));
  }
  const u3 = obcy.length === 0;
  console.log(`  ${u3 ? "OK  " : "BŁĄD"} U3. physicalDamage jedynym konstruktorem pakietu w src/ (${plikiTs.length} plików przejrzanych)`);
  for (const f of obcy) {
    bledy.push(`§U3: ${f} składa \`components:\` ręcznie — jeśli to pakiet WIELOSKŁADNIKOWY, najpierw rozstrzygnij mitygację per komponent i zastąp \`primaryType()\`.`);
  }
  console.log();
}

const naglowek = { ziarno: ZIARNO, implementacja: IMPL.nazwa, przypadkow: wyniki.length };
const teraz = { naglowek, wyniki };

if (ZAPISZ) {
  if (NOWY && !process.argv.includes("--migracja")) {
    console.error("BŁĄD: przemrożenie baseline'u na ŻYWYCH modułach wymaga jawnego --migracja.");
    console.error("      Baseline jest kryterium, nie zapisem stanu. Różnica po zmianie kodu to");
    console.error("      SYGNAŁ — przemrażaj tylko wtedy, gdy zmiana zachowania jest ZAMIERZONA");
    console.error("      i opisana w docs/systemy/combat.md.");
    process.exit(2);
  }
  if (bledy.length) {
    console.error("BŁĄD: kontrola krzyżowa nie przeszła — nie zamrażam baseline'u z błędnej transkrypcji.");
    for (const b of bledy) console.error("  " + b);
    process.exit(1);
  }
  await writeFile(BASELINE, JSON.stringify(teraz, null, 2) + "\n", "utf8");
  console.log(`Zamrożono ${wyniki.length} przypadków → ${BASELINE.replace(KORZEN + "\\", "")}`);
  console.log("\n⚠ Ten plik JEST kryterium wyjścia z Fazy 1A. Nie edytuj go ręcznie:");
  console.log("  różnica po refaktorze to sygnał, że coś się zmieniło — nie usterka baseline'u.");
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error("Brak baseline'u. Uruchom najpierw:  node tools/combat_regresja.mjs --zapisz-baseline");
  process.exit(2);
}
const stary = JSON.parse(await readFile(BASELINE, "utf8"));

let roznic = 0;
const klucz = (r) => `${r.grupa}//${r.nazwa}`;
const mapaStara = new Map(stary.wyniki.map((r) => [klucz(r), r]));
const mapaNowa = new Map(wyniki.map((r) => [klucz(r), r]));

for (const [k, a] of mapaStara) {
  const b = mapaNowa.get(k);
  if (!b) { console.error(`ZNIKŁ przypadek: ${k}`); roznic++; continue; }
  const ja = JSON.stringify(a), jb = JSON.stringify(b);
  if (ja !== jb) {
    console.error(`RÓŻNICA  ${k}`);
    console.error(`   było: ${ja}`);
    console.error(`   jest: ${jb}`);
    roznic++;
  }
}
for (const k of mapaNowa.keys()) {
  if (!mapaStara.has(k)) { console.error(`NOWY przypadek (nie ma go w baseline): ${k}`); roznic++; }
}

/* ══════════════════════════════════════════════════════════════════════════
   §ZB. SPÓJNOŚĆ KATALOGU BRONI (2026-09-16)
   ══════════════════════════════════════════════════════════════════════════
   ⚠⚠ **Powstało przy przejściu z 11 na 21 konstrukcji i pilnuje jednej
   rzeczy: żeby katalog rósł SZEROKO, a nie GĘSTO.** Dwie konstrukcje w tej
   samej rodzinie i tej samej liczbie rąk mają się różnić czymś, co gracz
   potrafi nazwać — inaczej druga jest tylko droższą pierwszą.

   ⚠ Sekcja jest ŻYWA: liczy na prawdziwym `ITEMS`, więc nowa broń wchodzi do
   niej sama. ⛔ Nie „naprawiaj" jej wyjątkiem na `id` — jeśli zapala się na
   nowej konstrukcji, to konstrukcja nie ma tożsamości, a nie strażnik ma błąd.
   ══════════════════════════════════════════════════════════════════════════ */
{
  console.log("§ZB. Spójność katalogu broni:");
  // ⚠ Własny odczyt sceny — `gsW` z §W żyje w swoim bloku.
  const gsZB = bezKomentarzyP(await readFile(join(KORZEN, "src/scenes/GameScene.ts"), "utf8"));
  const bronie = Object.entries(CFG.ITEMS).filter(([, i]) => i.type === "weapon");
  const m = (i) => i.melee ?? {};
  /**
   * ⚠⚠ **Gatunek materiału MUSI wejść do porównania — inaczej strażnik
   * porównuje liczby, których gracz nigdy nie zobaczy.** `WEAPON_MATERIAL`
   * mnoży obrażenia i cenę w `Quality.instanceDamage` / `Quality.buyPriceOf`,
   * więc żelazny cep zapisany jako 5–27 / 75 g działa w grze jak 4–21,6 / 45 g.
   * Dominacja liczona na surowych polach oceniłaby go o 25% za mocno
   * i o 67% za drogo naraz — czyli **w obie strony, które decydują o wyniku**.
   * ⚠ Broń bez pola `material` jest STALOWA (×1,00), więc dla całej reszty
   * katalogu ta linijka nie zmienia ani jednej liczby.
   */
  const GAT = (i) => CFG.WEAPON_MATERIAL[i.material ?? "steel"] ?? { damageMul: 1, priceMul: 1 };
  const srednia = (i) => ((i.damageMin + i.damageMax) / 2) * GAT(i).damageMul;
  const rozstrzal = (i) => (i.damageMax - i.damageMin) * GAT(i).damageMul;
  const cechy = (i) => ({
    dps: srednia(i) / i.attackCooldown,
    reach: m(i).reach ?? 0,
    minReach: m(i).minReach ?? 0,
    // ⚠⚠ **`arc` wypadł stąd 2026-09-18 razem z `melee.arcDeg`.** Na jego
    //   miejsce wchodzi ROZSTRZAŁ — i to nie jest zamiana jeden do jednego,
    //   tylko naprawa starszej luki: `docs/systemy/weapons.md` §5 czyni
    //   rozstrzał **osią tożsamości**, a Z1 nigdy o niego nie pytało.
    //   ⭐ Zapaliło się to natychmiast po usunięciu łuku: `sword > cleaver_sword`.
    //   Tasak i miecz mają tę samą średnią (12,0 vs 11,5) i różnią się właśnie
    //   rozstrzałem (10 vs 5) — czyli jedyną rzeczą, której strażnik nie widział.
    rozstrzal: rozstrzal(i),
    war: (i.attacks ?? []).length,
    parry: m(i).parryBonus ?? 0,
    critCh: m(i).critChanceBonus ?? 0,
    critMul: m(i).critMultiplierBonus ?? 0,
    knock: m(i).knockback ?? 0,
    interr: m(i).interrupts === true ? 1 : 0,
    cena: (i.buyPrice ?? 0) * GAT(i).priceMul,
    sila: i.requires?.strength ?? 0,
    masa: i.weight ?? 0,
  });

  /* ── Z1. DOMINACJA ────────────────────────────────────────────────────
     A dominuje B, gdy w tej samej rodzinie i przy tej samej liczbie rąk jest
     nie gorsze w KAŻDYM kanale mocy, nie droższe, nie cięższe, nie wymaga
     więcej Siły — i choć w jednym miejscu jest ostro lepsze. ⚠ Ta sama
     definicja, którą katalog tarcz i pancerza już stosuje. */
  const dominacje = [];
  for (const [aId, A0] of bronie) {
    for (const [bId, B0] of bronie) {
      if (aId === bId) continue;
      if (A0.family !== B0.family || (A0.hands ?? 1) !== (B0.hands ?? 1)) continue;
      const A = cechy(A0), B = cechy(B0);
      const niegorszy =
        A.dps >= B.dps && A.reach >= B.reach && A.rozstrzal >= B.rozstrzal && A.war >= B.war &&
        A.parry >= B.parry && A.critCh >= B.critCh && A.critMul >= B.critMul &&
        A.knock >= B.knock && A.interr >= B.interr && A.minReach <= B.minReach;
      const tanszy = A.cena <= B.cena && A.sila <= B.sila && A.masa <= B.masa;
      const ostro = A.dps > B.dps || A.reach > B.reach || A.war > B.war || A.cena < B.cena;
      if (niegorszy && tanszy && ostro) dominacje.push(`${aId} > ${bId}`);
    }
  }

  /* ── Z2. BLIŹNIAKI ────────────────────────────────────────────────────
     ⚠ Dwie konstrukcje o tej samej ŚREDNIEJ obrażeń są legalne — pod
     warunkiem, że różni je ROZSTRZAŁ, bo `docs/systemy/weapons.md` §5 czyni
     go osią tożsamości. Tasak i szabla mają dziś 12,0 obie: rozstrzał 10
     i 4. ⛔ Ta sama średnia ORAZ ten sam rozstrzał to już duplikat. */
  const blizniaki = [];
  for (const [aId, A] of bronie) {
    for (const [bId, B] of bronie) {
      if (aId >= bId || A.family !== B.family || (A.hands ?? 1) !== (B.hands ?? 1)) continue;
      const srA = srednia(A), srB = srednia(B);
      const rozA = rozstrzal(A), rozB = rozstrzal(B);
      if (Math.abs(srA - srB) < 0.01 && Math.abs(rozA - rozB) < 0.01) blizniaki.push(`${aId} ≡ ${bId}`);
    }
  }

  /* ── Z3. DRZEWCOWE ────────────────────────────────────────────────────
     ⚠⚠ Zasięg NIE MOŻE ich różnicować (wszystkie muszą stanąć powyżej progu
     orbity 96 px), więc strażnik pyta o to, co je różnicuje NAPRAWDĘ:
     każda para musi różnić się co najmniej DWOMA z czterech osi. */
  const drzewcowe = bronie.filter(([, i]) => i.family === "polearm");
  const paryBezRoznicy = [];
  for (const [aId, A] of drzewcowe) {
    for (const [bId, B] of drzewcowe) {
      if (aId >= bId) continue;
      const a = cechy(A), b = cechy(B);
      let roznic = 0;
      if (Math.abs(a.minReach - b.minReach) >= 4) roznic++;
      // ⚠⚠ **Łuk przestał być osią 2026-09-18** (zniknął z broni). Zastępuje go
      //   ODRZUT — kanał, który drzewcowe naprawdę różnicuje: rohatyna ma 200,
      //   pozostałe trzy zero. ⭐ Bez tej podmiany `boar_spear ~ spear` i
      //   `boar_spear ~ glaive` spadały do jednej osi i Z3 zapalało się słusznie.
      if ((a.knock > 0) !== (b.knock > 0)) roznic++;
      if (a.war !== b.war) roznic++;
      if (Math.abs(a.dps - b.dps) >= 1.5) roznic++;
      if (roznic < 2) paryBezRoznicy.push(`${aId} ~ ${bId} (${roznic} osi)`);
    }
  }

  const par = [
    ["Z1. ⭐ ŻADNA konstrukcja nie dominuje innej w swojej rodzinie",
      dominacje.length === 0, dominacje.join(" · ")],
    ["Z1. …i strażnik ma czego pilnować (≥2 konstrukcje w ≥2 rodzinach)",
      new Set(bronie.filter(([, i]) => i.family).map(([, i]) => i.family)).size >= 2 && bronie.length >= 10],
    ["Z2. ⛔ żadna para nie ma tej samej średniej ORAZ tego samego rozstrzału",
      blizniaki.length === 0, blizniaki.join(" · ")],
    ["Z3. ⭐ każda para drzewcowych różni się ≥2 osiami (poza zasięgiem)",
      paryBezRoznicy.length === 0, paryBezRoznicy.join(" · ")],
    ["Z4. martwa strefa zawsze WĘŻSZA od zasięgu (pasmo robocze > 0)",
      bronie.every(([, i]) => !m(i).minReach || m(i).minReach < m(i).reach)],
    ["Z5. ⛔ `minReach` jest własnością KONSTRUKCJI — rodzina go nie narzuca",
      drzewcowe.some(([, i]) => !m(i).minReach) && drzewcowe.some(([, i]) => m(i).minReach > 0)],
    ["Z6. każda broń ma ≥1 wariant i deklaruje typ obrażeń",
      bronie.every(([, i]) => (i.attacks ?? []).length >= 1 && i.attacks.every((a) => a.damageType))],
    ["Z7. ⛔ `parryBonus` NIE spływa z rodziny — ma go mniejszość mieczy",
      (() => {
        const miecze = bronie.filter(([, i]) => i.family === "sword");
        const zParry = miecze.filter(([, i]) => (m(i).parryBonus ?? 0) > 0);
        return miecze.length >= 5 && zParry.length > 0 && zParry.length < miecze.length;
      })()],
    /* ── Z9. OBIETNICA RODZINY DRZEWCOWEJ ────────────────────────
       ⚠⚠ `WEAPON_FAMILY.polearm` nie ma pola mechanicznego — jej całą treścią
       jest zdanie *„wszystko, co drzewcowe, sięga dalej niż reszta"*. Zdanie
       w komentarzu nie jest niezmiennikiem; ten wiersz nim jest.
       ⚠ Powstał razem z **berdyszem** (2026-09-17), czyli pierwszą bronią spoza
       rodziny, która naprawdę kusiła długim drzewcem — gdyby dostał 95 zamiast
       84, rodzina straciłaby jedyną rzecz, którą ma. ⛔ Nie „naprawiaj" tego
       podnoszeniem zasięgu drzewcowych: próg orbity wilka (96 px) jest tam,
       gdzie jest, i każda taka zmiana przenosi model przez niego przypadkiem. */
    ["Z9. ⭐ KAŻDA drzewcowa sięga dalej niż KAŻDA niedrzewcowa",
      (() => {
        const dl = bronie.filter(([, i]) => i.family === "polearm").map(([, i]) => m(i).reach ?? 0);
        const reszta = bronie.filter(([, i]) => i.family !== "polearm").map(([, i]) => m(i).reach ?? 0);
        return dl.length >= 2 && reszta.length >= 2 && Math.min(...dl) > Math.max(...reszta);
      })(),
      `najkrótsza drzewcowa ${Math.min(...bronie.filter(([, i]) => i.family === "polearm").map(([, i]) => m(i).reach ?? 0))}` +
        ` vs najdłuższa reszta ${Math.max(...bronie.filter(([, i]) => i.family !== "polearm").map(([, i]) => m(i).reach ?? 0))}`],
    /* ── Z10. GATUNEK MA UŻYTKOWNIKA ────────────────────────────
       ⚠ Oś `WEAPON_MATERIAL` powstała 2026-09-16 i przez dobę nie korzystała
       z niej ani jedna broń. To był poprawny stan startowy, ale **ścieżka,
       której nikt nie przechodzi, psuje się po cichu**: dominacja i bliźniaki
       liczyły się wtedy na surowych polach i nikt by nie zauważył różnicy.
       Ten wiersz pilnuje, że **ktoś jest żelazny**, czyli że `GAT(…)` wyżej
       naprawdę coś mnoży. ⛔ Nie kasuj go „bo oczywiste". */
    ["Z10. ⭐ gatunek materiału ma co najmniej jedną broń, czyli ścieżka jest przechodzona",
      bronie.some(([, i]) => (i.material ?? "steel") !== "steel"),
      bronie.filter(([, i]) => (i.material ?? "steel") !== "steel").map(([id, i]) => `${id}:${i.material}`).join(" · ")],
    ["Z8. ⭐ cel ZA BLISKO i ZA DALEKO to DWA stany pierścienia",
      typeof CFG.COMBAT_FEEDBACK?.targetMarker?.states?.tooClose?.tint === "number" &&
        CFG.COMBAT_FEEDBACK.targetMarker.states.tooClose.tint !==
          CFG.COMBAT_FEEDBACK.targetMarker.states.outOfReach.tint],
    ["Z8. …i scena je ROZRÓŻNIA (nie tylko config je ma)",
      /tooClose/.test(cialoMetody(gsZB, "  private paintTargetMarker(")) &&
        /zaBlisko/.test(cialoMetody(gsZB, "  private paintTargetMarker("))],
  ];
  for (const [opis, ok, detal] of par) {
    console.log(`  ${ok ? "OK  " : "BŁĄD"} ${opis}${detal ? "   " + detal : ""}`);
    if (!ok) bledy.push(`§ZB: ${opis}${detal ? " — " + detal : ""}`);
  }
  console.log();
}

console.log(`Porównano ${wyniki.length} przypadków przeciw baseline'owi (${stary.naglowek.implementacja}).`);
if (bledy.length) { for (const b of bledy) console.error("  " + b); }
if (roznic || bledy.length) {
  console.error(`\n${roznic} RÓŻNIC + ${bledy.length} błędów kontroli krzyżowej.`);
  process.exit(1);
}
console.log("OK — zero różnic.");
