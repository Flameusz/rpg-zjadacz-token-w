/**
 * Weryfikacja arytmetyki „Cofnij" w sklepie (`ShopPanel.undoLastTransaction`).
 *
 * ⚠ **Pyta PRAWDZIWY `Inventory` o to, ile realnie pobrał i ile wypłacił** —
 * nie przelicza wzoru obok niego. To jest cały sens tego pliku: błąd, który
 * naprawia, polegał właśnie na tym, że kasa i zwrot liczyły z dwóch różnych
 * miejsc (`buyPriceOf(id, jakość)` vs `def.buyPrice`) i nikt ich nigdy nie
 * porównał. Drugi wzór wpisany tutaj powtórzyłby tę pomyłkę o jeden poziom
 * wyżej.
 *
 * ⚠ **§3 i §4 potrafią zaświecić na CZERWONO na starym kodzie** i to jest ich
 * warunek istnienia (reguła projektu: asercja, która nie umie zgłosić błędu,
 * jest dekoracją). §3 pokazuje, ile złota dawał stary wzór na cykl kup→cofnij;
 * §4 — że stare cofnięcie sprzedaży oddawało przedmiot w innej jakości, niż
 * zabrało.
 *
 * Świadomie NIE dotyka `ShopPanel.stockQuality`: mapowanie kupiec → jakość
 * półki jest osobnym pytaniem, a niezmiennik „zwrot == pobranie" musi
 * obowiązywać dla KAŻDEJ jakości, więc test przechodzi po całej drabince 1-7
 * zamiast zgadywać, którą wystawia dany kupiec.
 *
 * Kod wyjścia ≠ 0, gdy którakolwiek asercja padnie.
 *
 *   node tools/sklep_cofniecie.mjs
 */

import { build } from "esbuild";
import { unlink, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const stubEvent = join(KORZEN, "node_modules", ".sklep-eventbus-stub.ts");
const stubVitals = join(KORZEN, "node_modules", ".sklep-vitals-stub.ts");
const tmpInv = join(KORZEN, "node_modules", ".sklep-inventory.mjs");
const tmpQual = join(KORZEN, "node_modules", ".sklep-quality.mjs");
const tmpCfg = join(KORZEN, "node_modules", ".sklep-config.mjs");

await writeFile(
  stubEvent,
  `export const GameEvents = { emit() {}, on() {}, off() {} };
   export const EVENT = new Proxy({}, { get: (_t, k) => String(k) });\n`,
);
// `Inventory.useItem` dotyka HP; test nic nie leczy, ale bundler i tak musi
// czymś rozwiązać ten import.
await writeFile(stubVitals, `export const Vitals = { hp: 100, maxHp: 100 };\n`);

const stuby = {
  name: "stuby",
  setup(b) {
    b.onResolve({ filter: /^\.\/EventBus$/ }, () => ({ path: stubEvent }));
    b.onResolve({ filter: /^\.\/Vitals$/ }, () => ({ path: stubVitals }));
  },
};
const wspolne = { format: "esm", bundle: true, logLevel: "silent", plugins: [stuby] };

await build({ entryPoints: [join(KORZEN, "src", "core", "Inventory.ts")], outfile: tmpInv, ...wspolne });
await build({ entryPoints: [join(KORZEN, "src", "core", "Quality.ts")], outfile: tmpQual, ...wspolne });
await build({
  entryPoints: [join(KORZEN, "src", "config", "GameConfig.ts")],
  outfile: tmpCfg,
  format: "esm",
  bundle: false,
  logLevel: "silent",
});

const { Inventory } = await import(pathToFileURL(tmpInv).href);
const { buyPriceOf, sellPriceOf, qualityOf } = await import(pathToFileURL(tmpQual).href);
const { ITEMS, QUALITY } = await import(pathToFileURL(tmpCfg).href);
await Promise.all(
  [stubEvent, stubVitals, tmpInv, tmpQual, tmpCfg].map((p) => unlink(p).catch(() => {})),
);

let bledy = 0;
const pad = (s, n) => String(s).padEnd(n);
function ok(nazwa, warunek, detal = "") {
  if (!warunek) bledy++;
  console.log(`${warunek ? "  ok  " : " BŁĄD "} ${pad(nazwa, 52)} ${detal}`);
}

const JAKOSCI = [1, 2, 3, 4, 5, 6, 7];
const kupowalne = Object.keys(ITEMS).filter((id) => "buyPrice" in ITEMS[id]);
/** Broń, pancerz i amulet nie stakują się — kupujemy je po sztuce, jak sklep. */
const poSztuce = (id) => ["weapon", "armor", "amulet", "container"].includes(ITEMS[id].type);

function czysto(zloto = 100000) {
  Inventory.reset();
  Inventory.gold = zloto;
}

console.log(`\nSKLEP — arytmetyka cofnięcia (${kupowalne.length} towarów × ${JAKOSCI.length} jakości)\n`);

/* ── §1 Zwrot za zakup == kwota POBRANA przez kasę ─────────────────────── */

let zleZakupy = 0;
let sprawdzone = 0;
for (const id of kupowalne) {
  for (const q of JAKOSCI) {
    const qty = poSztuce(id) ? 1 : 3;
    czysto();
    const przed = Inventory.gold;
    if (!Inventory.buy(id, qty, q)) continue;
    const pobrane = przed - Inventory.gold;
    // Ten sam wzór, którym `undoLastTransaction` wypłaca zwrot.
    const zwrot = buyPriceOf(id, q) * qty;
    if (pobrane !== zwrot) {
      zleZakupy++;
      if (zleZakupy <= 3) console.log(`        ${id} q${q}: pobrane ${pobrane}, zwrot ${zwrot}`);
    }
    sprawdzone++;
  }
}
ok("§1 zwrot za zakup == kwota pobrana", zleZakupy === 0, `${sprawdzone} przypadków`);

/* ── §2 Wypłata za sprzedaż == kwota, którą odda cofnięcie ─────────────── */

let zleSprzedaze = 0;
for (const id of Object.keys(ITEMS)) {
  for (const q of JAKOSCI) {
    const qty = poSztuce(id) ? 1 : 3;
    czysto(0);
    if (Inventory.addItem(id, qty, q) > 0) continue;
    const index = Inventory.slots.findIndex((s) => s && s.itemId === id);
    if (index < 0) continue;
    if (!Inventory.sellAt(index, qty)) continue;
    const wyplacone = Inventory.gold;
    const koszt = sellPriceOf(id, q) * qty; // tym płaci cofnięcie
    if (wyplacone !== koszt) {
      zleSprzedaze++;
      if (zleSprzedaze <= 3) console.log(`        ${id} q${q}: wypłacone ${wyplacone}, koszt ${koszt}`);
    }
  }
}
ok("§2 cofnięcie sprzedaży płaci tyle, ile dostał", zleSprzedaze === 0);

/* ── §3 Stary wzór (cena BAZOWA) — ile dawał na cykl kup→cofnij ────────── */

let najgorszy = { id: null, q: null, zysk: 0 };
let wadliwe = 0;
// ⚠ Tylko 1-4, czyli **jakości W OBIEGU** (`CLAUDE.md`). Pełna drabinka
// pokazałaby −1400 g na torbie w jakości 7, której nikt nigdy nie zobaczy —
// liczba prawdziwa arytmetycznie i bezużyteczna jako miara szkody.
for (const id of kupowalne) {
  for (const q of [1, 2, 3, 4]) {
    if (QUALITY.priceMul[q] === 1) continue; // jakość 3 — stary wzór trafiał przypadkiem
    const zysk = ITEMS[id].buyPrice - buyPriceOf(id, q); // stary zwrot − realne pobranie
    if (zysk !== 0) wadliwe++;
    if (Math.abs(zysk) > Math.abs(najgorszy.zysk)) najgorszy = { id, q, zysk };
  }
}
ok(
  "§3 stary wzór BYŁ wadliwy (jakości w obiegu)",
  wadliwe > 0,
  `${wadliwe} par; najgorsza: ${najgorszy.id} q${najgorszy.q} = ${najgorszy.zysk > 0 ? "+" : ""}${najgorszy.zysk}g na cykl`,
);

/* ── §4 Cofnięcie sprzedaży oddaje TĘ SAMĄ jakość ──────────────────────── */

let zgubioneJakosci = 0;
let staraStrata = 0;
for (const id of Object.keys(ITEMS)) {
  for (const q of JAKOSCI) {
    czysto(0);
    // Nowa droga: `addItem(id, qty, jakość)`.
    if (Inventory.addItem(id, 1, q) > 0) continue;
    const slot = Inventory.slots.find((s) => s && s.itemId === id);
    if (!slot) continue;
    if (qualityOf(slot) !== q) zgubioneJakosci++;

    // Stara droga: `addItem(id, qty)` bez jakości — ile sztuk zmieniłoby stan.
    czysto(0);
    Inventory.addItem(id, 1);
    const staryslot = Inventory.slots.find((s) => s && s.itemId === id);
    if (staryslot && qualityOf(staryslot) !== q) staraStrata++;
  }
}
ok("§4 cofnięcie oddaje tę samą jakość", zgubioneJakosci === 0);
ok(
  "§4b stara droga jakość GUBIŁA (test umie świecić)",
  staraStrata > 0,
  `${staraStrata} przypadków zmiany wykonania`,
);



/* ══════════════════════════════════════════════════════════════════════════
   §5. COFNIĘCIE JEST ATOMOWE — kontrakt `OI-133` (ZAMKNIĘTE 2026-09-21)
   ══════════════════════════════════════════════════════════════════════════
   Decyzja autora: cofnięcie albo wykonuje się W CAŁOŚCI (przedmiot wraca,
   złoto się zgadza, cofnięcie zostaje ZUŻYTE), albo **nie rusza niczego** —
   transakcja zostaje do ponowienia, a gracz dostaje konkretny powód.
   Dotyczy wszystkich trzech ścieżek: brak miejsca · brak złota · nieudane
   `takeBackBought`.

   ⚠ **Dlaczego część asercji czyta ŹRÓDŁO, a nie uruchamia kodu:**
   `undoLastTransaction` mieszka w `ShopPanel`, który ciągnie całego Phasera
   i do działania potrzebuje sceny. Przepisanie jego logiki tutaj dałoby DRUGI
   WZÓR obok pierwszego — dokładnie ten błąd, przed którym ostrzega nagłówek
   tego pliku. Dlatego: wszystko, co jest czystym `Inventory`, jest URUCHAMIANE
   naprawdę (§5a–§5e), a kształt samej procedury sprawdzany strukturalnie
   (§5f–§5j).
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\nOI-133 — cofnięcie jest operacją atomową:");
{
  // ── (a) Gabaryt: „ile wolnych pól" NIE wystarczy ────────────────────────
  const duzy = Object.keys(ITEMS).find((id) => {
    const d = ITEMS[id];
    const fp = "inventoryFootprint" in d ? d.inventoryFootprint : null;
    return fp && (fp.h ?? 1) === 2;
  });
  const drobiazg = Object.keys(ITEMS).find(
    (id) => !("inventoryFootprint" in ITEMS[id]) && ITEMS[id].type === "material",
  );
  ok("§5a w katalogu JEST przedmiot o gabarycie 1×2", Boolean(duzy), duzy ?? "—");

  if (duzy && drobiazg) {
    const cols = Inventory.cols;
    /** Zostaw wolne DOKŁADNIE te kafle, resztę zapchaj drobiazgiem. */
    const ustaw = (wolne) => {
      Inventory.reset();
      const zbior = new Set(wolne);
      for (let i = 0; i < Inventory.slots.length; i++) {
        if (!zbior.has(i)) Inventory.slots[i] = { itemId: drobiazg, qty: 1, quality: 3 };
      }
      return zbior;
    };

    // Cztery wolne kafle po przekątnej — ŻADNE dwa nie są jeden nad drugim.
    const rozproszone = ustaw([0, 5, 10, 15]);
    const parPionowych = [...rozproszone].filter((i) => rozproszone.has(i + cols)).length;
    ok(
      "§5b plecak ma 4 wolne pola, ale ŻADNYCH dwóch sąsiadujących pionowo",
      Inventory.slots.filter((s) => s === null).length === 4 && parPionowych === 0,
    );
    ok(
      "§5c ⭐⭐ `hasRoomFor` MÓWI NIE dla 1×2 (pyta o gabaryt, nie o licznik)",
      Inventory.hasRoomFor(duzy, 1, 3) === false,
    );

    // …a gdy pionowa para istnieje, ta sama rzecz wchodzi.
    ustaw([0, 4]);
    ok(
      "§5d ⭐ …i MÓWI TAK, gdy pionowa para istnieje (asercja umie świecić)",
      Inventory.hasRoomFor(duzy, 1, 3) === true,
    );

    /* ── (e) SEDNO ATOMOWOŚCI ────────────────────────────────────────────
       Cofnięcie sprzedaży pyta `hasRoomFor` PRZED `addItem`. Jeśli te dwie
       funkcje kiedykolwiek się rozjadą, wróci częściowe dodanie — czyli
       dokładnie stan, którego `OI-133` zakazuje. Zamiatamy więc oba po
       całym katalogu i po kilku układach plecaka. */
    let rozjazdow = 0;
    let bylOdmow = 0;
    let bylZgod = 0;
    const uklady = [[], [0], [0, 4], [0, 5, 10, 15], [1, 2, 3], [0, 1, 4, 5], [12, 13, 14, 15]];
    for (const uklad of uklady) {
      for (const id of Object.keys(ITEMS)) {
        for (const q of [1, 4, 7]) {
          ustaw(uklad);
          const obiecane = Inventory.hasRoomFor(id, 1, q);
          const reszta = Inventory.addItem(id, 1, q);
          const faktyczne = reszta === 0;
          if (obiecane !== faktyczne) rozjazdow++;
          if (obiecane) bylZgod++;
          else bylOdmow++;
        }
      }
    }
    ok(
      "§5e ⭐⭐ `hasRoomFor` zgadza się z `addItem` (zero częściowych dodań)",
      rozjazdow === 0,
      `${bylZgod + bylOdmow} prób, rozjazdów: ${rozjazdow}`,
    );
    // ⚠ Zamiatanie, w którym wszystko przechodzi albo wszystko odmawia, nie
    //   badałoby niczego — sprawdź, że próbka dotknęła OBU odpowiedzi.
    ok(
      "§5e …a próbka trafiła w OBIE odpowiedzi (nie jest trywialna)",
      bylZgod > 0 && bylOdmow > 0,
      `mieści się: ${bylZgod} · nie mieści: ${bylOdmow}`,
    );
  }

  // ── (f–j) KSZTAŁT PROCEDURY — czytany ze źródła ─────────────────────────
  const zrodlo = readFileSync(join(KORZEN, "src", "ui", "ShopPanel.ts"), "utf8")
    .split("\r\n")
    .join("\n");
  const cialo = /  private undoLastTransaction\(\): void \{[\s\S]*?\n  \}/.exec(zrodlo);
  ok("§5f ciało `undoLastTransaction` dało się wyciąć ze źródła", Boolean(cialo));

  if (cialo) {
    const t = cialo[0];
    const iKasacja = t.indexOf("this.lastTransaction = null");
    const iMutacja = Math.min(
      ...["Inventory.addGold", "Inventory.spendGold", "Inventory.addItem"]
        .map((s) => t.indexOf(s))
        .filter((i) => i >= 0),
    );
    ok(
      "§5g ⭐⭐ transakcja kasowana DOPIERO po udanej operacji (nie w pierwszej linii)",
      iKasacja > iMutacja,
    );

    /* Trzy ścieżki odmowy, każda z konkretnym powodem.
       ⚠ **Okno LINII, nie `[\s\S]*?`.** Pierwsza wersja szukała `refuseUndo`
       dowolnie daleko za warunkiem — po usunięciu komunikatu z JEDNEJ ścieżki
       trafiała w komunikat NASTĘPNEJ i przechodziła na zielono. Czyli była
       dekoracją. Złapane sabotażem przy zamykaniu `OI-133` (2026-09-21):
       §5i zapalało się poprawnie, a §5h milczało. */
    const linieCiala = t.split("\n");
    const odmawiaWOknie = (wzorzec) => {
      for (let i = 0; i < linieCiala.length; i++) {
        if (!wzorzec.test(linieCiala[i])) continue;
        // Komunikat musi paść ZANIM blok się zamknie.
        for (let j = i + 1; j < Math.min(i + 5, linieCiala.length); j++) {
          if (/this\.refuseUndo\(/.test(linieCiala[j])) return true;
          if (/^\s*\}/.test(linieCiala[j])) break;
        }
      }
      return false;
    };
    const sciezki = [
      ["brak miejsca", odmawiaWOknie(/!Inventory\.hasRoomFor\(/)],
      ["brak złota", odmawiaWOknie(/Inventory\.gold < cost/)],
      ["nie ma czego zwrócić", odmawiaWOknie(/!this\.canTakeBack\(/)],
    ];
    ok(
      "§5h ⭐ wszystkie TRZY ścieżki odmowy nazywają powód",
      sciezki.every(([, jest]) => jest),
      sciezki.filter(([, j]) => !j).map(([n]) => "BRAK: " + n).join(", ") || "wszystkie trzy",
    );

    // ⭐⭐ Kontrakt wprost: ŻADEN wczesny `return` nie wychodzi bez komunikatu.
    //    To jest ta asercja, która pilnuje `OI-133` na przyszłość — dołożenie
    //    czwartej cichej ścieżki zapali ją natychmiast.
    const linie = t.split("\n");
    const cicheWyjscia = [];
    for (let i = 0; i < linie.length; i++) {
      if (!/^\s+return;\s*$/.test(linie[i])) continue;
      const poprzednie = linie.slice(Math.max(0, i - 3), i).join(" ");
      // `if (!t) return;` na samym wejściu to nie odmowa — nie ma czego cofać.
      if (/if \(!t\) return/.test(linie[i]) || /const t = this\.lastTransaction/.test(poprzednie)) continue;
      if (!/this\.refuseUndo\(/.test(poprzednie)) cicheWyjscia.push(i + 1);
    }
    ok(
      "§5i ⭐⭐ ŻADEN wczesny `return` nie wychodzi bez komunikatu",
      cicheWyjscia.length === 0,
      cicheWyjscia.length ? `linie ciała: ${cicheWyjscia.join(", ")}` : "zero cichych wyjść",
    );

    // Pre-check przed mutacją, nie po niej — to jest cała atomowość.
    ok(
      "§5j ⭐ `hasRoomFor` stoi PRZED `addItem`, `canTakeBack` przed `takeBackBought`",
      t.indexOf("hasRoomFor") < t.indexOf("Inventory.addItem") &&
        t.indexOf("canTakeBack") < t.indexOf("this.takeBackBought"),
    );
  }
}

console.log(`\n${bledy === 0 ? "Wszystko zielone." : `${bledy} asercji padło.`}\n`);
process.exit(bledy === 0 ? 0 : 1);
