import { UI } from "../core/theme";
import { PROFICIENCY, PRACTICE, WEAPON_FAMILY } from "../config/GameConfig";
import { Equipment, type WeaponFamily } from "../core/Equipment";
import { Inventory } from "../core/Inventory";
import { Progression } from "../core/Progression";
import { WeaponProficiency } from "../core/WeaponProficiency";
import { missChance, qualityMultiplier, slipChance } from "../core/Proficiency";
import { masteryPayloadLine } from "./MasteryCard";
import { NPCS, type NpcId } from "../core/Npcs";
import type { CardLine, CardSection, ListRow } from "./ListDetail";

/**
 * ── RODZINA BRONI jako wiersz listy i sekcje karty (etap F, 2026-10-13) ────
 *
 * Wspólne dla Mistrzostwa u trenera (`MasteryPanel` — SPRZEDAJE rangę)
 * i strony Postać → Broń w panelu gracza (POKAZUJE ten sam stan, ⛔ nie
 * sprzedaje — decyzja D5, `docs/systemy/proficiency.md` §34.9). Do tej daty
 * oba widoki składały te same liczby osobno, każdy innym krojem.
 *
 * ⚠ **Nic tu nie liczy biegłości.** Cena, próg, sufit i powód odmowy
 * przychodzą z `WeaponProficiency.masteryOffer`; „W walce" — z tych samych
 * wzorów, którymi rozstrzyga się cios (`core/Proficiency`).
 */

export const MASTERY_LABEL = ["—", "M-I", "M-II", "M-III", "M-IV"] as const;

/** „12,5" — przecinek dziesiętny, jak w reszcie interfejsu. */
function dec(v: number, digits: number): string {
  return v.toFixed(digits).replace(".", ",");
}

/** Koszt rangi na przycisku i w notce: „50 g" / „600 g + 2 pkt". */
export function masteryCost(family: WeaponFamily): string {
  const o = WeaponProficiency.masteryOffer(family);
  return o.pointCost > 0 ? `${o.goldCost} g + ${o.pointCost} pkt` : `${o.goldCost} g`;
}

/** Jedno zdanie: czego brakuje do zakupu następnej rangi (`undefined` = nic). */
export function masteryRefusal(family: WeaponFamily): string | undefined {
  const o = WeaponProficiency.masteryOffer(family);
  if (o.ready || o.next === null) return undefined;
  const p = WeaponProficiency.get(family);
  if (o.blocked === "proficiency") {
    return `Brakuje ${Math.max(0, Math.ceil((o.requiredProficiency ?? 0) - p))} biegłości — to się ćwiczy, nie kupuje.`;
  }
  if (o.blocked === "gold") return `Brakuje ${o.goldCost - Inventory.gold} g.`;
  return `Brakuje ${o.pointCost - Progression.skillPoints} pkt rozwoju.`;
}

export function familyRow(family: WeaponFamily): ListRow {
  const p = WeaponProficiency.get(family);
  const oferta = WeaponProficiency.masteryOffer(family);
  const wRece = family === Equipment.weaponFamily;
  const sufit = Number.isFinite(oferta.cap) ? ` / ${oferta.cap}` : "";
  const stan = WeaponProficiency.has(family) ? `biegłość ${Math.round(p)}${sufit}` : "nierozpoczęta";
  // Zielony „+" = ranga do kupienia TERAZ — jedyny kolor, który niesie akcję.
  // Złoty „!" = ćwiczona broń stoi na suficie: praktyka przepada (§34.7).
  const naSuficie = oferta.atCap && WeaponProficiency.has(family);
  return {
    id: family,
    mark: oferta.ready ? "+" : naSuficie ? "!" : "•",
    markColor: oferta.ready ? UI.green : naSuficie ? UI.gold : UI.muted,
    name: WEAPON_FAMILY[family].label,
    nameColor: wRece ? UI.green : UI.white,
    note: wRece ? `${stan} · w ręku` : stan,
    noteColor: wRece ? UI.green : UI.muted,
    value: oferta.rank > 0 ? MASTERY_LABEL[oferta.rank] : "—",
    valueColor: oferta.rank > 0 ? UI.gold : UI.muted,
  };
}

/**
 * Sekcje karty rodziny. `where`:
 * - `"trainer"` — u trenera (zakup jest przyciskiem karty, tu tylko treść);
 * - `"panel"` — panel gracza: dokłada, GDZIE i ZA ILE kupuje się rangę,
 *   oraz stan kanału manekina (jedyne źródło praktyki poza walką, §14b).
 */
export function familySections(family: WeaponFamily, where: "trainer" | "panel"): CardSection[] {
  const p = WeaponProficiency.get(family);
  const oferta = WeaponProficiency.masteryOffer(family);
  // Rozszerzone do `readonly number[]` — `as const` robi z progów krotkę.
  const progi: readonly number[] = PROFICIENCY.masteryThresholds;
  const sections: CardSection[] = [];

  // ── BIEGŁOŚĆ: ile umiesz, rośnie od używania ──────────────────────────
  const skonczony = Number.isFinite(oferta.cap);
  const bieglosc: CardLine[] = [
    {
      text: WeaponProficiency.has(family) ? "Obecna" : `Nierozpoczęta — start od ${WeaponProficiency.startValue()}`,
      value: `${Math.round(p)} / ${skonczony ? oferta.cap : "∞"}`,
      bar: { ratio: skonczony ? p / oferta.cap : 1, color: oferta.atCap ? UI.dangerNum : UI.goldNum },
    },
  ];
  // ⚠ Ostrzeżenie o suficie jest OBOWIĄZKOWE (§34.7): praktyka zdobyta na
  // suficie przepada, a bez tej linii gracz trenuje w próżni.
  if (oferta.atCap && oferta.next !== null) {
    bieglosc.push({ text: "Stoisz na suficie — praktyka PRZEPADA, dopóki nie kupisz rangi.", color: UI.danger });
  }
  if (where === "panel" && WeaponProficiency.has(family)) {
    // Liczone z ZAPISANEGO `P_start`, nie z bieżącego `P`.
    const zostalo = WeaponProficiency.startOf(family) + PRACTICE.dummy.limit - p;
    bieglosc.push({
      text: zostalo > 0
        ? `Manekin nauczy jeszcze ${Math.ceil(zostalo)} pkt (od ${Math.round(WeaponProficiency.startOf(family))}).`
        : "Manekin wyczerpany dla tej rodziny — dalej uczy tylko walka.",
      color: UI.muted,
      role: "small",
    });
  }
  sections.push({ title: "Biegłość", aside: "rośnie od używania broni", lines: bieglosc });

  // ── RANGA: kupowana, osobne pojęcie ──────────────────────────────────
  const posiadane = masteryPayloadLine(family, oferta.rank);
  sections.push({
    title: "Ranga",
    aside: "kupowana u trenera",
    lines: [
      { text: "Obecna", value: oferta.rank > 0 ? MASTERY_LABEL[oferta.rank] : "brak", valueColor: oferta.rank > 0 ? UI.gold : UI.muted },
      ...(posiadane ? [{ text: `Daje: ${posiadane}.`, color: UI.text }] : []),
    ],
  });

  if (oferta.next === null) {
    sections.push({ lines: [{ text: "Najwyższa ranga. Biegłość rośnie dalej bez sufitu.", color: UI.goldLight }] });
  } else {
    const nastepna: CardLine[] = [
      // ⚠ **„od", nie „próg"** — zakup otwiera się `unlockLead` punktów PRZED
      // sufitem (§34.2a), więc ta liczba (90) nie jest progiem Mastery (100).
      { text: "Zakup otwiera się od biegłości", value: `${oferta.requiredProficiency}` },
      { text: "Podnosi sufit biegłości do", value: `${progi[oferta.next] ?? "∞"}` },
      // ⚠ Co gracz KUPUJE, nie tylko ile to kosztuje.
      { text: `Daje: ${masteryPayloadLine(family, oferta.next)}.`, color: UI.white },
    ];
    if (where === "panel") {
      // ⚠ Panel mówi CO i ILE, nigdy nie sprzedaje (D5).
      nastepna.push({ text: "Koszt u trenera", value: masteryCost(family), valueColor: UI.goldLight });
      const brak = masteryRefusal(family);
      nastepna.push(brak
        ? { text: brak, color: UI.muted, role: "small" }
        : { text: `Możesz ją kupić — ${NPCS[PROFICIENCY.mastery.trainer as NpcId].name}, zakładka Mistrzostwo.`, color: UI.green, role: "small" });
    }
    sections.push({ title: `Następna: ${MASTERY_LABEL[oferta.next]}`, lines: nastepna });
  }

  // ── W WALCE: trzy liczby warstwy 2, tymi samymi wzorami co cios ───────
  sections.push({
    title: "W walce",
    aside: "przy tej biegłości",
    lines: [
      { text: "Siła ciosu", value: `${Math.round(qualityMultiplier(p) * 100)}% obrażeń` },
      { text: "Niezgrabnie", value: `${dec(missChance(p) * 100, 1)}% zamachów` },
      { text: "Ześlizg", value: `${dec(slipChance(p) * 100, 1)}% zamachów` },
    ],
  });
  return sections;
}
