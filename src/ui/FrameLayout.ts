import { HUD_LAYOUT } from "../config/GameConfig";

/**
 * ── RAMA INTERFEJSU — CZYSTA GEOMETRIA (etap B, 2026-10-13) ────────────────
 *
 * ⚠ **Zero Phasera, zero stanu.** Ten sam powód, co `ShopLayout.ts`,
 * `EquipLayout.ts` i `ControlLayout.ts`: układ, który liczy się bez sceny,
 * sprawdza się bez uruchamiania gry — `node tools/panel_fit.mjs` (`OI-68`).
 *
 * Co tu mieszka:
 * - **szyna** (`computeRailLayout`) — pionowa kolumna przy prawej krawędzi:
 *   tożsamość i sakiewka u góry, zakładki (ikona + podpis), wyjście NA DOLE
 *   (E5). Decyzje: `docs/ui_mobile_research.md` §8 (R2, R3, D13, E4, E5);
 * - **obszar usługi** (`serviceArea`) — to, co zostaje na lewo od szyny dla
 *   sklepu, zadań, szkolenia i Mistrzostwa w ramie rozmowy;
 * - **kolumna rozmowy** (`talkColumn`) — ta sama prawa kolumna w trybie
 *   „Rozmowa", szersza; przy wejściu w usługę zwęża się do szyny, PRAWA
 *   krawędź zostaje w miejscu (jeden składnik, dwie szerokości);
 * - **rozmiary paneli**, które do tej daty stały literałem w konstruktorach
 *   (`super(scene, 816, 470)`) — przymiar musi je znać bez sceny.
 *
 * ⚠⚠ **Liczby układu mają JEDEN dom.** Widżet pyta tutaj, nie liczy sam.
 */

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Strojone liczby ramy. Wszystko inne jest z nich WYPROWADZONE. */
export const FRAME = {
  /**
   * Prawa krawędź kolumny rozmowy i szyny — ten sam margines, co prawy skraj
   * klastra walki (`HUD_LAYOUT.edgeRight`), żeby kciuk trafiał w to samo pasmo.
   */
  edgeRight: HUD_LAYOUT.edgeRight,
  /** Margines góra/dół kolumny i szyny. */
  marginY: 16,
  /** Tło kolumny wystaje tyle w lewo poza wiersze — oddech przy krawędzi. */
  bgPad: 8,
  /** Kolumna odpowiedzi w trybie „Rozmowa" (od 2026-10-12, `ConversationSheet`). */
  talkColW: 400,
  rail: {
    /**
     * ⭐ Szerokość szyny: ikona 28 j. + podpis `TYPE.body` (18 j., najdłuższy
     * „Mistrzostwo" ≈ 115 j. pogrubionym krojem) + marginesy + znacznik.
     * Research §8: „szyna ~190 j." — szerokość jest na telefonie 20:9 tańsza
     * od wysokości (R2).
     */
    w: 196,
    /**
     * Szyna SAMYCH IKON — tylko dla okna węższego niż `compactBelow` (okno
     * przeglądarki w pionie; telefon ma orientację zablokowaną). Bez tego panel
     * 816 j. w obszarze usługi schodził do skali 0,43, czyli poniżej czytelności.
     */
    compactW: 84,
    compactBelow: 1000,
    // ⭐ Ta sama szyna samych ikon jest też trybem GĘSTEJ treści (autor
    //   2026-10-13: „w Handlu same ikony"): zakładka, której widok potrzebuje
    //   szerokości, prosi o nią (`dense`), a podpisy i imię się zwijają.
    //   Kafle zostają tej samej wysokości i w tej samej kolejności, prawa
    //   krawędź stoi — zmienia się tylko lewy brzeg.
    /** Tożsamość: imię rozmówcy (do dwóch wierszy) + sakiewka. */
    identityH: 74,
    /** Odstęp tożsamości od pierwszej zakładki. */
    sectionGap: 10,
    /** Kafel zakładki — próg dotyku 48 dp (`HUD_LAYOUT.minTouch`). */
    tabH: HUD_LAYOUT.minTouch,
    tabGap: 6,
    /** Wyjście („Do widzenia") — na DOLE (E5), ten sam próg. */
    exitH: HUD_LAYOUT.minTouch,
    /**
     * ⚠ **Przerwa nad wyjściem ≥ 16 j.** (research §4.2: „Żegnaj" sąsiaduje
     * z przyciskiem zatwierdzenia usługi). 18 = przerwa nad „Do widzenia"
     * w kolumnie rozmowy — oba tryby mają ją tę samą.
     */
    exitGap: 18,
    /** Rozmowa + cztery usługi (Handel, Zadania, Szkolenie, Mistrzostwo). */
    maxTabs: 5,
  },
  /**
   * Przerwa, którą panel usługi zostawia przy krawędziach swojego obszaru
   * (`PanelBase.fitScale`: 8 j. z każdej strony).
   */
  fitMargin: 8,
} as const;

/* ══ SZYNA ══════════════════════════════════════════════════════════════ */

export interface RailLayout {
  /** Szyna samych ikon (wąskie okno) — podpisy i tożsamość się nie rysują. */
  readonly compact: boolean;
  /** Lewa krawędź i szerokość WIERSZY szyny. */
  readonly x: number;
  readonly w: number;
  /** Tło: od `bgX` do prawej krawędzi ekranu, na całą wysokość. */
  readonly bgX: number;
  readonly bgW: number;
  readonly identity: Rect;
  readonly tabs: readonly Rect[];
  readonly exit: Rect;
  /** Opis kolizji, gdy zakładki nie mieszczą się nad wyjściem; `null` = OK. */
  readonly overflow: string | null;
}

/**
 * Czy szyna jest samymi ikonami: wąskie okno ALBO zakładka gęstej treści
 * (`dense` — dziś Handel).
 */
export function railCompact(screenW: number, dense = false): boolean {
  return dense || screenW < FRAME.rail.compactBelow;
}

/**
 * Policz szynę dla okna `screenW × screenH` (jednostki wirtualne UI)
 * i `tabCount` zakładek.
 *
 * ⚠ Zakładki stoją OD GÓRY (pod tożsamością), wyjście — przyklejone do dołu.
 * Kąt kciuka: na telefonie w poziomie prawy kciuk sięga dolnej połowy prawej
 * krawędzi najłatwiej, a górę i tak trzyma się dłużej wzrokiem niż palcem —
 * stąd usługi blisko środka wysokości, nie w samym rogu.
 */
export function computeRailLayout(screenW: number, screenH: number, tabCount: number, dense = false): RailLayout {
  const R = FRAME.rail;
  const compact = railCompact(screenW, dense);
  const w = compact ? R.compactW : R.w;
  const x = screenW - FRAME.edgeRight - w;
  const bgX = x - FRAME.bgPad;
  // ⚠ Szyna GĘSTA (Handel) zachowuje miejsce tożsamości, choć jej nie rysuje:
  //   kafle mają stać na TYCH SAMYCH wysokościach w każdej zakładce — inaczej
  //   przejście Handel ↔ Szkolenie przestawiało je pod kciukiem o 84 j.
  //   (złapane na renderze 1:1, 2026-10-13). Zwija ją tylko wąskie okno.
  const identityH = compact && !dense ? 0 : R.identityH;
  const identity: Rect = { x, y: FRAME.marginY, w, h: identityH };
  const firstTab = FRAME.marginY + identityH + (identityH > 0 ? R.sectionGap : 0);
  const tabs: Rect[] = [];
  for (let i = 0; i < tabCount; i++) {
    tabs.push({ x, y: firstTab + i * (R.tabH + R.tabGap), w, h: R.tabH });
  }
  const exit: Rect = { x, y: screenH - FRAME.marginY - R.exitH, w, h: R.exitH };
  const last = tabs[tabs.length - 1];
  let overflow: string | null = null;
  if (last && last.y + last.h + R.exitGap > exit.y + 0.5) {
    overflow = `ostatnia zakładka kończy się na ${Math.round(last.y + last.h)} j., wyjście zaczyna na ${Math.round(exit.y)} j. (przerwa < ${R.exitGap})`;
  }
  return { compact, x, w, bgX, bgW: screenW - bgX, identity, tabs, exit, overflow };
}

/* ══ OBSZAR USŁUGI I KOLUMNA ROZMOWY ═══════════════════════════════════ */

/**
 * Obszar dla panelu usługi w ramie rozmowy: cała wysokość, od lewej krawędzi
 * do tła szyny. Panel centruje się w nim i dopasowuje skalą (`panelFitScale`).
 * `dense` = obok szyny samych ikon (zakładka gęstej treści, dziś Handel).
 */
export function serviceArea(screenW: number, screenH: number, dense = false): Rect {
  const rail = computeRailLayout(screenW, screenH, 0, dense);
  return { x: 0, y: 0, w: rail.bgX, h: screenH };
}

/** Cały ekran — obszar panelu, który nie stoi w ramie (panel gracza). */
export function screenArea(screenW: number, screenH: number): Rect {
  return { x: 0, y: 0, w: screenW, h: screenH };
}

/**
 * Kolumna odpowiedzi w trybie „Rozmowa". Prawa krawędź = prawa krawędź szyny,
 * więc zwężenie do szyny przesuwa tylko lewy brzeg.
 */
export function talkColumn(screenW: number, screenH: number): { x: number; w: number; bgX: number; bgW: number; h: number } {
  const x = screenW - FRAME.edgeRight - FRAME.talkColW;
  const bgX = x - FRAME.bgPad;
  return { x, w: FRAME.talkColW, bgX, bgW: screenW - bgX, h: screenH };
}

/**
 * Ile trzeba zmniejszyć panel `panelW × panelH`, żeby zmieścił się w `area`.
 * 1 = mieści się. Jedyna kopia tej reguły — woła ją `PanelBase.reposition`
 * i przymiar.
 */
export function panelFitScale(panelW: number, panelH: number, area: Rect): number {
  const m = FRAME.fitMargin * 2;
  return Math.min(1, (area.w - m) / panelW, (area.h - m) / panelH);
}

/* ══ ROZMIARY PANELI ════════════════════════════════════════════════════ */

/**
 * Panel gracza (`PlayerPanel`) — rozmiar liczony z okna. Przeniesione
 * z `PlayerPanel.ts` 2026-10-13 bez zmiany liczb, żeby przymiar znał je bez
 * sceny. Powody liczb: komentarz przy `PANEL` w historii `PlayerPanel.ts`
 * (podłoga 816×530 = rozmiar, pod który wymierzono zakładki).
 */
export const PLAYER_PANEL = {
  minW: 816,
  maxW: 1280,
  minH: 530,
  maxH: 860,
  marginX: 16,
  marginY: 12,
} as const;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function playerPanelSize(screenW: number, screenH: number): { w: number; h: number } {
  const P = PLAYER_PANEL;
  return {
    w: Math.round(clamp(screenW - 2 * P.marginX, P.minW, P.maxW)),
    h: Math.round(clamp(screenH - 2 * P.marginY, P.minH, P.maxH)),
  };
}

/**
 * ⭐ **Widoki „lista + karta" rozmowy (zadania, szkolenie, Mistrzostwo) biorą
 * CAŁY obszar usługi** (etap F, 2026-10-13; research §8 R6). Do tej daty stały
 * okna 816×440–470 wyśrodkowane w obszarze 1029×580 — z pasem pustki dookoła
 * i tekstem 11–14 j. Ta sama reguła rozmiaru co sklep (`shopPanelW/H`) i panel
 * gracza: obszar minus margines, w klamrach podłogi i sufitu.
 */
export const SUBVIEW = {
  minW: 816,
  maxW: 1280,
  minH: 480,
  maxH: 860,
  marginX: 16,
  marginY: 12,
} as const;

export function subviewSize(areaW: number, areaH: number): { w: number; h: number } {
  const S = SUBVIEW;
  return {
    w: Math.round(clamp(areaW - 2 * S.marginX, S.minW, S.maxW)),
    h: Math.round(clamp(areaH - 2 * S.marginY, S.minH, S.maxH)),
  };
}
