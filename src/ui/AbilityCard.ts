import { getAbility, type AbilityId } from "../core/Abilities";

/**
 * Treść karty umiejętności — **wyłącznie dane, zero rysowania**.
 *
 * ⚠ **Ten plik produkuje `Line[]` i na tym kończy się jego rola** (decyzja D-11
 * w `docs/gui_umiejetnosci_handoff.md`: jedna treść, jeden renderer). Od etapu F
 * (2026-10-13) rysuje ją `ListDetail` — Postać → Umiejętności i Szkolenie
 * u trenera (wiersze „etykieta: wartość" rozdzielane na dwie kolumny).
 * Wcześniej rysował `ItemTooltip.showLines`.
 *
 * ⚠ **Wiersz powstaje tylko wtedy, gdy pole istnieje I NIESIE ZNACZENIE dla
 * gracza** (D-6) — dla liczby znaczy to „różna od zera". Żadnych zer, żadnych
 * myślników, żadnego „—" w miejscu brakującej danej.
 *
 * ⚠ **Sama obecność pola NIE wystarcza jako warunek, i to był realny błąd**
 * (audyt 2026-08-26). `SHIELD_BASH.knockbackPx` wynosi `0` i **istnieje
 * celowo** — config mówi wprost: „pole istnieje, żeby decyzja była WIDOCZNA,
 * a nie domyślna przez nieobecność". Strażnik obecnościowy czytał tę deklarację
 * „ta umiejętność świadomie nie odrzuca" jako statystykę „Odrzut: 0", czyli
 * **odwracał sens danej**. Powód jest ten sam, dla którego `dodge` nie ma
 * `staminaCost`: zero i brak to dwie różne informacje, a żadnej z nich gracz
 * nie potrzebuje w karcie.
 *
 * ⚠ **Nie ocenia i nie porównuje.** Karta mówi, co umiejętność robi — nigdy
 * czy jest lepsza od innej. Każda jest narzędziem do innej sytuacji.
 */

/** Jedna linia treści karty — rysuje ją `ListDetail` (etap F). */
export interface Line {
  text: string;
  color: string;
  bold?: boolean;
  size?: number;
}

const GOLD = "#ffcc66";
const TEXT = "#c8d0e0";
const MUTED = "#8892a6";
const ACCENT = "#ffe680";

/** Sekundy z konfiguracji: `8` → „8 s", `0.5` → „0,5 s". Przecinek, bo cała
 *  reszta interfejsu jest po polsku. */
function sec(v: number): string {
  return `${String(Math.round(v * 10) / 10).replace(".", ",")} s`;
}

/** Mnożnik: `0.5` → „×0,5". */
function mul(v: number): string {
  return `×${String(Math.round(v * 100) / 100).replace(".", ",")}`;
}

/**
 * **Jedna linia „co to kosztuje" — podpis wiersza na liście umiejętności.**
 *
 * ⚠ **Mieszka TU, a nie w `PlayerPanel`**, bo to jest ta sama zasada, którą
 * niesie cały ten plik: wiersz powstaje tylko dla pola, które umiejętność
 * NAPRAWDĘ ma. `dodge` nie ma `staminaCost` (płaci go sam, przez obciążenie),
 * więc pokazuje samo odnowienie — a nie „0 wysiłku".
 *
 * ⚠ Skrót „odn." zamiast „odnowienie": podpis ma 10 px i dzieli wiersz
 * z nazwą umiejętności, a pełne słowo wyjeżdżało poza kolumnę listy.
 */
export function abilityCostLine(id: AbilityId): string {
  const def = getAbility(id);
  const czesci: string[] = [];
  if ("staminaCost" in def && def.staminaCost > 0) czesci.push(`${def.staminaCost} wysiłku`);
  if ("cooldown" in def && def.cooldown > 0) czesci.push(`odn. ${sec(def.cooldown)}`);
  return czesci.join("  ·  ");
}

/**
 * Klucz deduplikacji przebudowy karty.
 *
 * ⚠ **Musi opisywać WSZYSTKO, co karta rysuje.** Slot wchodzi do klucza, bo
 * wiersz „Na pasku — slot 2" jest częścią treści: bez niego przełożenie
 * umiejętności na inny slot zostawiłoby kartę z poprzednim numerem, a wyglądało
 * to jak zignorowane kliknięcie. Ta sama reguła, która kosztowała `AbilityBar`
 * zamrożony licznik cooldownu.
 */
export function abilityCardKey(id: AbilityId, slot: number): string {
  return `ability|${id}|${slot}`;
}

/** Linie karty dla `id`. `slot` to indeks na pasku albo −1, gdy nie leży. */
export function abilityCardLines(id: AbilityId, slot: number): Line[] {
  const def = getAbility(id);
  const lines: Line[] = [{ text: def.name, color: GOLD, bold: true, size: 13 }];

  lines.push(
    slot >= 0
      ? { text: `Na pasku — slot ${slot + 1}`, color: ACCENT }
      : { text: "Poza paskiem", color: MUTED },
  );

  // ── Koszt i rytm ────────────────────────────────────────────────────────
  if ("staminaCost" in def && def.staminaCost > 0) {
    lines.push({ text: `Koszt: ${def.staminaCost} wysiłku`, color: TEXT });
  }
  if ("cooldown" in def && def.cooldown > 0) {
    lines.push({ text: `Odnowienie: ${sec(def.cooldown)}`, color: TEXT });
  }
  if ("windupMs" in def && def.windupMs > 0) {
    lines.push({ text: `Zamach: ${def.windupMs} ms`, color: TEXT });
  }
  if ("recoveryMs" in def && def.recoveryMs > 0) {
    lines.push({ text: `Odzyskanie: ${def.recoveryMs} ms`, color: TEXT });
  }

  // ── Co robi ─────────────────────────────────────────────────────────────
  if ("damageMultiplier" in def && def.damageMultiplier > 0) {
    lines.push({ text: `Obrażenia: ${mul(def.damageMultiplier)} ciosu`, color: TEXT });
  }
  if ("primaryMultiplier" in def && def.primaryMultiplier > 0) {
    lines.push({ text: `Cel główny: ${mul(def.primaryMultiplier)}`, color: TEXT });
  }
  if ("secondaryMultiplier" in def && def.secondaryMultiplier > 0) {
    lines.push({ text: `Pozostali: ${mul(def.secondaryMultiplier)}`, color: TEXT });
  }
  if ("maxTargets" in def && def.maxTargets > 0) {
    lines.push({ text: `Trafia do: ${def.maxTargets} celów`, color: TEXT });
  }
  if ("radius" in def && def.radius > 0) {
    lines.push({ text: `Promień: ${def.radius}`, color: TEXT });
  }
  if ("damageBonus" in def && def.damageBonus > 0) {
    lines.push({ text: `Premia do obrażeń: ${mul(1 + def.damageBonus)}`, color: TEXT });
  }
  if ("durationMs" in def && def.durationMs > 0) {
    lines.push({ text: `Trwa: ${sec(def.durationMs / 1000)}`, color: TEXT });
  }

  // ── Efekty szczególne ───────────────────────────────────────────────────
  if ("stunMs" in def && def.stunMs > 0) {
    lines.push({ text: `Ogłuszenie: ${def.stunMs} ms`, color: ACCENT });
  }
  if ("knockbackPx" in def && def.knockbackPx > 0) {
    lines.push({ text: `Odrzut: ${def.knockbackPx}`, color: TEXT });
  }
  if ("invulnerableMs" in def && def.invulnerableMs > 0) {
    lines.push({ text: `Nietykalność: ${def.invulnerableMs} ms`, color: ACCENT });
  }
  if ("dashPx" in def && def.dashPx > 0) {
    lines.push({ text: `Dystans: ${def.dashPx}`, color: TEXT });
  }
  if ("rangeReachMul" in def && def.rangeReachMul > 0) {
    lines.push({ text: `Zasięg: ${mul(def.rangeReachMul)} zasięgu broni`, color: TEXT });
  }
  if ("minRange" in def && "maxRange" in def && def.maxRange > 0) {
    lines.push({ text: `Pasmo: ${def.minRange}–${def.maxRange}`, color: TEXT });
  }
  if ("hitCooldownRefund" in def && def.hitCooldownRefund > 0) {
    const pct = Math.round(def.hitCooldownRefund * 100);
    lines.push({ text: `Trafienie zwraca ${pct}% odnowienia`, color: ACCENT });
  }
  if ("requiresShield" in def && def.requiresShield) {
    lines.push({ text: "Wymaga tarczy", color: ACCENT });
  }

  // ── Opis na końcu, jak w karcie przedmiotu ──────────────────────────────
  if ("description" in def && def.description) {
    lines.push({ text: def.description, color: TEXT });
  }

  return lines;
}
