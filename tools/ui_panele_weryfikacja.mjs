/**
 * WERYFIKACJA PANELI UI — pierwszy przemalunek z żywego stanu.
 *
 * §2 ikony malowane z żywego stanu (`PlayerPanel`).
 *
 * ⚠⚠ **§1 (viewport plecaka w `ShopPanel`) PRZENIESIONE 2026-09-16 do
 * `tools/sklep_uklad.mjs` — i to nie jest przeprowadzka dla porządku.**
 * Tamta sekcja czytała literały ZE ŹRÓDŁA `ShopPanel.ts` wyrażeniem
 * regularnym (`private readonly gridTop = …`). W dniu, w którym te liczby
 * przeniosły się do `src/ui/ShopLayout.ts`, parser przestał je znajdować
 * i skrypt **wywalił się wyjątkiem `Cannot read properties of null`** —
 * czyli asercja nie zaświeciła na czerwono, tylko przestała istnieć.
 * Nowy przymiar uruchamia PRAWDZIWY moduł układu i nie ma jak się rozjechać.
 *
 * ⛔ Nie odtwarzaj tu sekcji §1. Cztery jej własności (dolna krawędź okna nad
 * nagłówkiem ZAŁOŻONE, całkowita liczba rzędów, brak paska przy bazowych
 * 16 slotach, ostatni rząd cały widoczny po przewinięciu) żyją jako
 * §S2/§S4/§S5/§S6 w `tools/sklep_uklad.mjs`.
 */
import { readFile } from "node:fs/promises";

const ok = [];
const spr = (n, w) => { console.log(`  ${w ? "OK  " : "BŁĄD"} ${n}`); ok.push(w); };

/* ══════════════════════════════════════════════════════════════════════════
   §2. PIERWSZY PRZEMALUNEK Z ŻYWEGO STANU (`PlayerPanel`)
   ══════════════════════════════════════════════════════════════════════════
   ⚠⚠ **Powstało po błędzie z playtestu (2026-09-05): założony plecak pokazywał
   „białą kreskę".** To była tekstura `__MISSING` Phasera — ikony slotów na
   torby powstają z pustym kluczem (`add.image(x, y, "")`) i dostają teksturę
   dopiero w obsłudze zdarzenia `bagsChanged`. Konstruktor panelu malował
   z żywego stanu KAŻDĄ inną grupę (postać, plecak, `EQUIP_SLOTS`, zadania,
   mapa) — tylko nie torby. Panel zbudowany, gdy torba już była założona
   (wczytany zapis, restart `UIScene`), zostawał więc z pustą ikoną na zawsze.

   ⚠ Reguła jest ogólna, nie o plecaku: **grupa ikon, której jedynym malarzem
   jest handler zdarzenia, MUSI dostać jednorazowy przemalunek przy budowie.**
   Ten strażnik pilnuje, że blok startowy wymienia wszystkie grupy.
   ══════════════════════════════════════════════════════════════════════════ */
{
  const pp = await readFile("src/ui/PlayerPanel.ts", "utf8");
  const bezKom = pp
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n");
  const i = bezKom.indexOf("this.refreshCharacter();");
  const blok = i < 0 ? "" : bezKom.slice(i, i + 500);

  console.log("\n§2. PlayerPanel — pierwszy przemalunek z żywego stanu:");
  const grupy = [
    ["postać", /this\.refreshCharacter\(\);/],
    ["plecak (siatka)", /this\.refreshInventory\(\{ slots: Inventory\.slots/],
    ["EQUIP_SLOTS", /this\.refreshEquipIcons\(Equipment\);/],
    ["⭐ BAG_SLOTS (torby)", /this\.onBagsChanged\(Equipment\);/],
    ["zadania", /this\.refreshQuests\(\);/],
    ["mapa", /this\.refreshMap\(\);/],
  ];
  for (const [nazwa, re] of grupy) {
    const jest = re.test(blok);
    console.log(`  ${jest ? "OK  " : "BŁĄD"} ${nazwa} malowana przy budowie panelu`);
    ok.push(jest);
  }
  console.log(
    `\n${ok.every(Boolean) ? "WSZYSTKO OK" : "SĄ BŁĘDY"}`,
  );
  process.exit(ok.every(Boolean) ? 0 : 1);
}
