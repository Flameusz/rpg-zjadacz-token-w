import { HUD_LAYOUT } from "../config/GameConfig";
import { TYPE } from "../core/theme";
import type { Rect } from "./FrameLayout";

/**
 * ── LISTA + KARTA — CZYSTA GEOMETRIA (etap F, 2026-10-13) ─────────────────
 *
 * Wspólny układ widoków rozmowy, w których gracz WYBIERA jedną pozycję
 * z krótkiej listy i decyduje o niej jednym przyciskiem: zadania u dawcy,
 * szkolenie u trenera, rangi Mistrzostwa (research §8 R6, wzór: strona
 * Postać → Broń). Do tej daty każdy z trzech widoków liczył własne kolumny
 * ze stałych (`colW = (w − 40 − 20) / 2`) pod tekst 11–14 j.
 *
 * ⚠ **Zero Phasera, zero stanu** — ten sam powód co `ShopLayout.ts`
 * i `EquipLayout.ts`: układ, który liczy się bez sceny, sprawdza się bez
 * uruchamiania gry (`node tools/panel_fit.mjs`, §F).
 *
 * Układ (współrzędne panelu, środek w 0,0):
 *
 *   ┌ lista ─────────┐│┌ karta ─────────────────────────────┐
 *   │ ! Nazwa     wart││ Tytuł                      ◉ 3 020 │
 *   │   dopisek       ││ dopisek stanu                      │
 *   │ ✓ Nazwa         ││ ─────────────────────────────────  │
 *   │ …  (przewija)   ││ SEKCJA                             │
 *   │                 ││ treść (przewija)                   │
 *   │                 ││               brakuje 40 g         │
 *   │                 ││                    [ Naucz · 120 g ]│
 *   └─────────────────┘│└────────────────────────────────────┘
 *
 * ⭐ Przycisk główny w PRAWYM DOLNYM rogu karty z kwotą na napisie —
 * to samo miejsce co „Kup · 340 g" w sklepie (kciuk ma jeden adres).
 */

export const LIST_DETAIL = {
  /** Margines wewnętrzny panelu. */
  pad: 18,
  /** Udział listy w szerokości treści, w klamrach `listMin`/`listMax`. */
  listShare: 0.4,
  listMin: 300,
  listMax: 430,
  /** Odstęp listy od karty — w środku stoi pionowa kreska. */
  gap: 24,
  /** ⭐ Wiersz listy = próg dotyku (68 j. = 48 dp). */
  rowH: HUD_LAYOUT.minTouch,
  rowGap: 6,
  /** Kolumna znacznika (`!` `?` `✓` `+`) przy lewej krawędzi wiersza. */
  markW: 40,
  /** Pasek przewijania listy i ciała karty. */
  scrollW: 6,
  /** Nagłówek karty: tytuł (`title`) + dopisek stanu (`small`) + odstęp. */
  headerH: TYPE.title + 6 + TYPE.small + 12,
  /** Przerwa pod kreską nagłówka. */
  headerGap: 12,
  /** Przycisk główny: próg dotyku w pionie, szerokość od napisu. */
  actionH: 64,
  actionMinW: 240,
  /** Miejsce na jednozdaniową odmowę nad przyciskiem („brakuje 40 g"). */
  refusalH: TYPE.small + 10,
  /** Przerwa między ciałem karty a pasem akcji. */
  actionGap: 12,
  /** Najmniejsza karta, przy której ciało jeszcze się czyta. */
  detailMin: 380,
} as const;

export interface ListDetailLayout {
  /** Okno listy (przewijane): wiersze stoją od `list.y` w dół. */
  readonly list: Rect;
  /** Ile wierszy mieści okno bez przewijania. */
  readonly rowsVisible: number;
  /** Pionowa kreska między kolumnami (x w panelu). */
  readonly dividerX: number;
  /** Cała kolumna karty. */
  readonly detail: Rect;
  /** Nagłówek karty (tytuł + dopisek) — `detail.y` … `headerBottom`. */
  readonly headerBottom: number;
  /** Ciało karty, gdy JEST przycisk akcji. */
  readonly body: Rect;
  /** Ciało karty bez pasa akcji (pozycja tylko do czytania). */
  readonly bodyFull: Rect;
  /** Prostokąt przycisku głównego — prawa dolna krawędź karty. */
  readonly action: Rect;
  /** Linia bazowa odmowy (dół tekstu, wyrównanie do PRAWEJ krawędzi karty). */
  readonly refusalY: number;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Policz układ dla panelu `panelW × panelH` (jednostki panelu).
 * ⚠ Lista ustępuje szerokości dopiero, gdy karta spadłaby pod `detailMin`.
 */
export function computeListDetailLayout(panelW: number, panelH: number): ListDetailLayout {
  const M = LIST_DETAIL;
  const left = -panelW / 2 + M.pad;
  const top = -panelH / 2 + M.pad;
  const contentW = panelW - 2 * M.pad;
  const contentH = panelH - 2 * M.pad;

  let listW = clamp(Math.round(contentW * M.listShare), M.listMin, M.listMax);
  if (contentW - listW - M.gap < M.detailMin) listW = Math.max(M.listMin, contentW - M.gap - M.detailMin);
  // ⚠ Okno listy ma CAŁKOWITĄ liczbę wierszy — przecięty wiersz u dołu czyta
  //   się jak błąd rysowania (render 1:1, 2026-10-13: skrawek ósmego wiersza).
  const rowsVisible = Math.max(1, Math.floor((contentH + M.rowGap) / (M.rowH + M.rowGap)));
  const list: Rect = { x: left, y: top, w: listW, h: rowsVisible * (M.rowH + M.rowGap) - M.rowGap };

  const detailX = left + listW + M.gap;
  const detail: Rect = { x: detailX, y: top, w: left + contentW - detailX, h: contentH };
  const headerBottom = top + M.headerH;
  const bodyTop = headerBottom + M.headerGap;
  const bottom = top + contentH;
  const action: Rect = { x: detail.x + detail.w - M.actionMinW, y: bottom - M.actionH, w: M.actionMinW, h: M.actionH };
  const refusalY = action.y - 6;
  const bodyBottom = action.y - M.refusalH - M.actionGap;

  return {
    list,
    rowsVisible,
    dividerX: left + listW + M.gap / 2,
    detail,
    headerBottom,
    body: { x: detail.x, y: bodyTop, w: detail.w, h: bodyBottom - bodyTop },
    bodyFull: { x: detail.x, y: bodyTop, w: detail.w, h: bottom - bodyTop },
    action,
    refusalY,
  };
}
