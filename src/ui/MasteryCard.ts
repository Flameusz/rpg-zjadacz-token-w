import { PROFICIENCY, WEAPON_FAMILY } from "../config/GameConfig";
import { familyHasTrait } from "../core/WeaponTraits";
import type { WeaponFamily } from "../core/Equipment";
import type { MasteryRank } from "../core/WeaponProficiency";

/**
 * **Co daje ranga — jednym zdaniem, dla panelu trenera i panelu BROŃ.**
 * `docs/systemy/proficiency.md` (drabina ładunków), D1/D2/D3 (nośniki cech
 * rodzin).
 *
 * ⚠ **Jedno miejsce dla obu paneli.** Gracz czyta ten sam opis, patrząc na
 * swoją rangę i kupując następną — dwie kopie rozjechałyby się przy pierwszej
 * zmianie drabiny, a to jest tekst, za który płaci się 1800 g.
 *
 * ⚠ **Opis JEST WYPROWADZANY z konfiguracji ładunków**, nie przepisany ręcznie:
 * mnożniki, `φ` i redukcje wysiłku biorą się z `PROFICIENCY.mastery.payload`,
 * a nośnik cechy rozpoznaje się tak samo jak w `Progression` — po polu, które
 * rodzina naprawdę ma. Zmiana liczby w configu zmienia napis.
 *
 * ⚠ **Włócznia świadomie nie ma czym wypełnić M-II i M-IV** (D3) i tak ma
 * zostać — funkcja mówi wtedy wprost, że ranga niesie ekonomię, zamiast
 * udawać cechę, której nie ma.
 */
export function masteryPayloadLine(family: WeaponFamily, rank: MasteryRank): string {
  if (rank <= 0) return "";
  const { effortReduction, traitMultiplier, critLowCut, minimumFromRank } = PROFICIENCY.mastery.payload;
  const czesci: string[] = [];

  const redukcja: readonly number[] = effortReduction;
  const r = redukcja[rank] ?? 0;
  if (r > 0) czesci.push(`wysiłek −${Math.round(r * 100)}%`);

  const f = WEAPON_FAMILY[family];
  const mnoznik: readonly number[] = traitMultiplier;
  const phi: readonly number[] = critLowCut;
  // ⚠ Pytamy o CECHĘ, nie o obecność pola (`core/WeaponTraits.ts`).
  if (familyHasTrait(f, "parry") && (mnoznik[rank] ?? 1) > 1) {
    czesci.push(`parada ×${String(mnoznik[rank]).replace(".", ",")}`);
  } else if (familyHasTrait(f, "staggerMs") && (mnoznik[rank] ?? 1) > 1) {
    czesci.push(`zachwianie ×${String(mnoznik[rank]).replace(".", ",")}`);
  } else if (familyHasTrait(f, "critMultiplierBonus") && (phi[rank] ?? 0) > 0) {
    czesci.push(`krytyk z górnych ${Math.round((1 - (phi[rank] ?? 0)) * 100)}% zakresu`);
  }

  if (rank >= minimumFromRank) czesci.push("wyższe minimum obrażeń");

  return czesci.join(" · ");
}
