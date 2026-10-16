/**
 * Przymiar KARTY PRZEDMIOTU (`src/ui/ItemCard.ts`).
 *
 * ⚠ **Uruchamia PRAWDZIWY model karty na PRAWDZIWYM katalogu** — buduje kartę
 * dla **każdego przedmiotu w grze** i sprawdza jej kształt. Nie parsuje tekstu
 * i nie odtwarza wzorów: gdyby liczył cokolwiek sam, byłby drugim rachunkiem
 * tej samej rzeczy (reguła z `tools/CLAUDE.md`).
 *
 * ⚠⚠ **Po co powstał (2026-09-19).** Karta przestała być płaską listą linijek
 * i stała się **modelem z sekcjami**, z którego rysują DWA widoki (kolumna
 * szczegółów w sklepie i dymek w panelu postaci). Model, który dla jednego
 * przedmiotu zwróci pustą sekcję albo statystykę bez wartości, psuje oba naraz
 * — i to w miejscu, którego nikt nie ogląda, bo przedmiot stoi na półce
 * kupca, do którego akurat się nie zagląda.
 *
 * **Czego NIE sprawdza:** czy liczby są DOBRE (to balans) i czy karta ładnie
 * wygląda (to render).
 *
 *   node tools/karta_przedmiotu.mjs
 */

import { build } from "esbuild";
import { unlink, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const stubPhaser = join(KORZEN, "node_modules", ".phaser-stub-card.ts");
const wejscie = join(KORZEN, "node_modules", ".card-entry.ts");
const tmp = join(KORZEN, "node_modules", ".card.mjs");

await writeFile(
  stubPhaser,
  `class E {
     on() { return this; } once() { return this; } off() { return this; }
     emit() { return false; } removeAllListeners() { return this; }
   }
   const Phaser = {
     Math: { Clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)) },
     Events: { EventEmitter: E },
     Input: { Events: {} },
     Scenes: { Events: {} },
   };
   export default Phaser;\n`,
);

await writeFile(
  wejscie,
  `export { buildItemCard, COMPARE_EPS, shieldReductionOf, shieldCapacityOf } from "../src/ui/ItemCard";
   export { makeInstance } from "../src/core/Quality";
   export { Equipment, LAYERED_AREAS } from "../src/core/Equipment";
   export { ARMOR_LAYER_LABEL, ARMOR_LAYER_PLAYER, ARMOR_LAYERS } from "../src/core/ArmorLayers";
   export { ITEMS } from "../src/config/GameConfig";\n`,
);

await build({
  entryPoints: [wejscie],
  outfile: tmp,
  format: "esm",
  bundle: true,
  logLevel: "silent",
  define: { "import.meta.env.DEV": "false" },
  plugins: [
    {
      name: "stuby",
      setup(b) {
        b.onResolve({ filter: /^phaser$/ }, () => ({ path: stubPhaser }));
      },
    },
  ],
});

const M = await import(pathToFileURL(tmp).href);
await unlink(tmp).catch(() => {});
await unlink(wejscie).catch(() => {});
await unlink(stubPhaser).catch(() => {});

const { buildItemCard, shieldReductionOf, makeInstance, Equipment, ITEMS } = M;
const { LAYERED_AREAS, ARMOR_LAYER_LABEL, ARMOR_LAYER_PLAYER, ARMOR_LAYERS } = M;

let bledy = 0;
const zle = (id, opis, dowod) => {
  bledy++;
  console.log(`⛔ ${id.padEnd(4)} ${opis.padEnd(58)} ${dowod}`);
};
const ok = (id, opis, dowod) => console.log(`✅ ${id.padEnd(4)} ${opis.padEnd(58)} ${dowod}`);
const sprawdz = (w, id, opis, dowod) => (w ? ok : zle)(id, opis, dowod);

const idki = Object.keys(ITEMS);
console.log("=== przymiar karty przedmiotu ===\n");
console.log(`przedmiotów w katalogu   ${idki.length}\n`);

/* ══ §K: KAŻDY PRZEDMIOT BUDUJE POPRAWNĄ KARTĘ ═════════════════════════ */

const karty = [];
let wyjatki = [];
for (const id of idki) {
  try {
    karty.push([id, buildItemCard(makeInstance(id, 1))]);
  } catch (e) {
    wyjatki.push(`${id}: ${e.message}`);
  }
}
sprawdz(
  wyjatki.length === 0,
  "K1",
  "karta buduje się dla KAŻDEGO przedmiotu w grze",
  wyjatki.length ? wyjatki.slice(0, 3).join(" · ") : `${karty.length} kart`,
);

const puste = karty.filter(([, c]) => c.sections.some((s) => s.stats.length === 0 && s.notes.length === 0));
sprawdz(
  puste.length === 0,
  "K2",
  "żadna karta nie ma PUSTEJ sekcji",
  puste.length ? puste.slice(0, 3).map(([id]) => id).join(", ") : "wymóg „nie pokazuj pustych sekcji”",
);

const bezNazwy = karty.filter(([, c]) => !c.name || !c.typeLine);
sprawdz(bezNazwy.length === 0, "K3", "każda karta ma nazwę i wiersz typu", bezNazwy.map(([id]) => id).join(", ") || "—");

const pustaWartosc = [];
for (const [id, c] of karty) {
  for (const s of c.sections) {
    for (const st of s.stats) {
      if (!st.label || st.value === undefined || st.value === null || `${st.value}`.trim() === "") {
        pustaWartosc.push(`${id}/${s.title}/${st.label}`);
      }
      if (/undefined|NaN/.test(`${st.value}`)) pustaWartosc.push(`${id}/${st.label}=${st.value}`);
    }
  }
}
// ⭐ „undefined" w wartości to dokładnie ta klasa błędu, którą złapano kiedyś
//   na zrzucie jako „Slot: undefined" — luźny `Record` przyjmował każdy klucz.
sprawdz(
  pustaWartosc.length === 0,
  "K4",
  "żadna statystyka nie ma pustej wartości ani `undefined`/`NaN`",
  pustaWartosc.slice(0, 3).join(", ") || `${karty.length} kart przejrzanych`,
);

/* ══ §C: CENY ══════════════════════════════════════════════════════════ */

console.log("");
const zlaCena = karty.filter(([id, c]) => ("buyPrice" in ITEMS[id]) !== (c.buyPrice !== null));
sprawdz(
  zlaCena.length === 0,
  "C1",
  "cena zakupu jest DOKŁADNIE tam, gdzie przedmiot ją ma",
  zlaCena.slice(0, 3).map(([id]) => id).join(", ") || "zgodne z katalogiem",
);
const zeroSprzedaz = karty.filter(([, c]) => !(c.sellPrice > 0));
sprawdz(
  zeroSprzedaz.length === 0,
  "C2",
  "każdy przedmiot ma dodatnią cenę sprzedaży",
  zeroSprzedaz.slice(0, 3).map(([id]) => id).join(", ") || "—",
);

/* ══ §P: PORÓWNANIE ════════════════════════════════════════════════════
 *
 * ⭐ D10 (etap E, 2026-10-13): karta trzyma LISTĘ bloków porównania
 * (`compares`) — broń i tarcza porównują się z OBOMA zestawami, pierścień
 * z OBOMA palcami. `P4`–`P7` pilnują tego, `P1`/`P3` — drugiej strony
 * (pusty ekwipunek, rzecz noszona).
 */

console.log("");
{
  const wyczysc = () => {
    Equipment.reset?.();
    for (const s of ["weapon", "offhand", "weapon2", "offhand2", "ring1", "ring2"]) Equipment[s] = null;
  };
  // Bez niczego na sobie NIE MA z czym porównywać — karta nie może wymyślać
  // odpowiednika. (Przymiar startuje z pustym `Equipment`.)
  wyczysc();
  const zPorownaniem = idki.filter((id) => buildItemCard(makeInstance(id, 1)).compares.length > 0);
  sprawdz(
    zPorownaniem.length === 0,
    "P1",
    "przy pustym ekwipunku ŻADNA karta nie pokazuje porównania",
    zPorownaniem.slice(0, 3).join(", ") || "0 kart z porównaniem",
  );

  // ⭐ Para POZYTYWNA: po założeniu tarczy inna tarcza MUSI się porównać —
  //   bez tego `P1` byłoby spełnione przez kartę, która porównania nie umie.
  const tarcze = idki.filter((id) => "block" in ITEMS[id]);
  if (tarcze.length >= 2) {
    const noszona = makeInstance(tarcze[0], 1);
    Equipment.offhand = noszona;
    const inna = buildItemCard(makeInstance(tarcze[1], 1));
    const blok = inna.compares.find((c) => c.wornName);
    sprawdz(
      !!blok && blok.rows.length > 0,
      "P2",
      "po założeniu tarczy inna tarcza POKAZUJE porównanie",
      blok ? `${blok.rows.length} wierszy vs ${blok.wornName} (${blok.target})` : "brak bloku",
    );
    const sama = buildItemCard(noszona);
    sprawdz(
      sama.compares.length === 0,
      "P3",
      "karta rzeczy NOSZONEJ nie porównuje się wcale",
      sama.compares.length ? `bloków: ${sama.compares.length}` : "brak porównania, poprawnie",
    );
    wyczysc();
  }

  // ── D10: broń z OBOMA zestawami ─────────────────────────────────────────
  const bronie = idki.filter((id) => ITEMS[id].type === "weapon" && "damageMin" in ITEMS[id]);
  if (bronie.length >= 3) {
    const [a, b, c] = bronie;
    Equipment.weapon = makeInstance(a, 1);
    Equipment.weapon2 = makeInstance(b, 1);
    const k = buildItemCard(makeInstance(c, 1));
    const cele = k.compares.map((x) => x.target).join(" / ");
    sprawdz(
      k.compares.length === 2 && k.compares.every((x) => x.wornName && x.rows.length > 0),
      "P4",
      "⭐ D10: broń porównuje się z OBOMA zestawami",
      `${k.compares.length} bloki: ${cele || "—"}`,
    );
    sprawdz(
      k.compares[0]?.target === "Zestaw I" && k.compares[1]?.target === "Zestaw II",
      "P5",
      "bloki nazywają miejsce: „Zestaw I”, potem „Zestaw II”",
      cele || "—",
    );
    // ⚠ Rzecz noszona w ZESTAWIE II też nie porównuje się z zestawem I —
    //   na renderze 2026-10-13 miecz z zestawu I pokazywał „zamiast: Siekiera".
    const schowana = buildItemCard(Equipment.weapon2);
    sprawdz(
      schowana.compares.length === 0,
      "P6",
      "broń z zestawu II (schowana) nie porównuje się z zestawem I",
      schowana.compares.length ? `bloków: ${schowana.compares.length}` : "brak porównania",
    );
    // Wolne miejsce obok zajętego: blok bez wierszy — „weszłoby bez zamiany".
    Equipment.weapon2 = null;
    const k2 = buildItemCard(makeInstance(c, 1));
    sprawdz(
      k2.compares.length === 2 && k2.compares[1].wornName === null && k2.compares[1].rows.length === 0,
      "P7",
      "pusty zestaw II obok zajętego I = blok „wolne”",
      k2.compares.map((x) => `${x.target}:${x.wornName ?? "wolne"}`).join(" / "),
    );
    // ⭐ Obciążenie po → teraz mieszka W BLOKU, a STAN go wtedy nie powtarza.
    const zBloku = k2.compares[0]?.rows.some((r) => r.label === "Obciążenie");
    const zeStanu = k2.sections.some((s) => s.stats.some((st) => st.label === "Obciążenie"));
    sprawdz(
      zBloku && !zeStanu,
      "P8",
      "obciążenie po → teraz stoi w bloku porównania, nie w STANIE",
      `w bloku: ${zBloku ? "tak" : "NIE"} · w STANIE: ${zeStanu ? "TAK" : "nie"}`,
    );
    wyczysc();
  }
}

/* ══ §L: (usunięte w etapie F, 2026-10-13) ═══════════════════════════
 * Sprawdzało spłaszczenie karty do linijek dymka (`cardToLines`). Dymek
 * zniknął — karta ma jeden renderer (`ShopDetails`), a tezę „procent bloku
 * z modelu, nie z drugiego wzoru" pilnuje `tarcze_przymiar` B2 na nim.
 */

/* ══ §T: WARSTWA TYLKO TAM, GDZIE ISTNIEJE ═════════════════════════════
 *
 * ⚠⚠ **Powstało po błędzie zobaczonym na renderze (2026-09-19):** dymek
 * drewnianej pawęży pisał „Pancerz · Druga ręka · L2 · ochrona zasadnicza".
 * Warstwa wychodziła z `armorType`, który u tarcz jest decyzją o PROFILU
 * OBRAŻEŃ („żadnego materiału »drewno«" — `docs/systemy/shields.md` §1),
 * a nie o miejscu w stosie. Warstwowane są **cztery obszary ciała**; tarcza,
 * rękawice i naramienniki nie leżą w żadnej warstwie.
 *
 * ⚠ Ten przymiar czyta wiersz tożsamości KARTY, czyli dokładnie to, co widzi
 * gracz — nie mapę materiałów i nie `itemLayer()`.
 */

console.log("");
{
  // ⚠ **Etykiety GRACZA, nie systemowe.** Karta mówi „wierzchnie
  //   wzmocnienie", a `L3` zostaje w modelu i w dokumentacji (decyzja autora
  //   2026-09-19: kod warstwy wygląda jak nazwa slotu).
  const etykiety = ARMOR_LAYERS.map((w) => ARMOR_LAYER_PLAYER[w]);
  const maWarstwe = (c) => etykiety.some((e) => c.typeLine.includes(e));

  const nieWarstwowane = karty.filter(
    ([id]) => ITEMS[id].type === "armor" && !LAYERED_AREAS.includes(ITEMS[id].slot),
  );
  const klamie = nieWarstwowane.filter(([, c]) => maWarstwe(c));
  sprawdz(
    klamie.length === 0,
    "T1",
    "pancerz spoza czterech obszarów NIE pokazuje warstwy",
    klamie.length
      ? `${klamie.length}: ${klamie.slice(0, 3).map(([id, c]) => `${id} → „${c.typeLine}”`).join(" · ")}`
      : `${nieWarstwowane.length} sztuk (tarcze, rękawice, naramienniki)`,
  );

  // ⭐ Kontrola POZYTYWNA — bez niej `T1` przechodziłoby także wtedy, gdyby
  //   karta przestała pokazywać warstwy w ogóle.
  const warstwowane = karty.filter(
    ([id]) => ITEMS[id].type === "armor" && LAYERED_AREAS.includes(ITEMS[id].slot),
  );
  const bezWarstwy = warstwowane.filter(([, c]) => !maWarstwe(c));
  sprawdz(
    bezWarstwy.length === 0,
    "T2",
    "KAŻDA sztuka z czterech obszarów warstwę pokazuje",
    bezWarstwy.length
      ? bezWarstwy.slice(0, 3).map(([id]) => id).join(", ")
      : `${warstwowane.length} sztuk`,
  );

  // ⛔⛔ **ŻADNA karta nie pokazuje kodu warstwy.** `L1`/`L2`/`L3` to adresy
  //   modelu; w interfejsie wyglądały jak nazwy slotów i dokładnie tak były
  //   czytane. Zamek łapie powrót kodu wszędzie: w wierszu tożsamości,
  //   w statystykach i w notach.
  const kodWarstwy = /L[123]/;
  const zKodem = karty.filter(([, c]) =>
    kodWarstwy.test(c.typeLine) ||
    c.sections.some((sek) =>
      kodWarstwy.test(sek.title) ||
      sek.stats.some((st) => kodWarstwy.test(`${st.label} ${st.value}`)) ||
      sek.notes.some((nt) => kodWarstwy.test(nt.text))),
  );
  sprawdz(
    zKodem.length === 0,
    "T4",
    "⛔ karta NIE pokazuje kodu warstwy (`L1`/`L2`/`L3`)",
    zKodem.length ? zKodem.slice(0, 3).map(([id, c]) => `${id} → „${c.typeLine}”`).join(" · ") : `${karty.length} kart`,
  );

  // ⭐ OPIS TYLKO BEZ STATYSTYK (decyzja autora 2026-10-12). Dwie połowy:
  // rzecz z liczbami NIE ma opisu na karcie, a zioło/mikstura z opisem w
  // katalogu MA go dalej — inaczej reguła „schowaj" schowałaby wszystko.
  const zOpisem = karty.filter(([id, c]) => !["material", "consumable"].includes(ITEMS[id].type) && c.description);
  sprawdz(
    zOpisem.length === 0,
    "T5",
    "karta rzeczy ze statystykami NIE pokazuje opisu",
    zOpisem.length ? zOpisem.slice(0, 3).map(([id]) => id).join(", ") : `${karty.length} kart`,
  );
  const proste = karty.filter(([id]) => ["material", "consumable"].includes(ITEMS[id].type) && ITEMS[id].description);
  const zgubiony = proste.filter(([, c]) => !c.description);
  sprawdz(
    proste.length > 0 && zgubiony.length === 0,
    "T6",
    "zioło/surowiec/mikstura z opisem w katalogu POKAZUJE go na karcie",
    zgubiony.length ? zgubiony.slice(0, 3).map(([id]) => id).join(", ") : `${proste.length} rzeczy z opisem`,
  );

  const tarczeK = karty.filter(([id]) => "block" in ITEMS[id]);
  const zlaNazwa = tarczeK.filter(([, c]) => !c.typeLine.startsWith("Tarcza"));
  sprawdz(
    zlaNazwa.length === 0,
    "T3",
    "tarcza przedstawia się jako TARCZA, nie jako pancerz",
    zlaNazwa.length
      ? zlaNazwa.slice(0, 3).map(([id, c]) => `${id} → „${c.typeLine}”`).join(" · ")
      : `${tarczeK.length} tarcz, np. „${tarczeK[0][1].typeLine}”`,
  );
}

console.log("");
console.log(`${bledy ? "⛔" : "✅"} BŁĘDÓW: ${bledy}`);
console.log("Nic nie zapisano — ten przymiar wyłącznie czyta.");
process.exit(bledy ? 1 : 0);
