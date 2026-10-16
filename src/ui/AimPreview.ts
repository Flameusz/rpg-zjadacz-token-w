import Phaser from "phaser";
import { ABILITY_AIM, DEPTH } from "../config/GameConfig";
import type { Punkt } from "../core/CombatGeometry";
import { originFor, type AimFrame, type ResolvedHitShape, type SelectedTarget } from "../core/AbilitySpec";
import type { CombatBody } from "../core/CombatGeometry";

/**
 * Podgląd celowania umiejętności — rysowany w ŚWIECIE, nie w HUD-zie.
 *
 * ── ⚠ DWA JĘZYKI, bo archetypy odpowiadają na różne pytania ──────────────
 *
 * | kształt | co rysuje | na co odpowiada |
 * |---|---|---|
 * | `directionArc` | obrys koła + **wypełniony klin** | „gdzie zadam obrażenia" |
 * | `directionTarget` | zależnie od `aimPreview` — patrz niżej | „kto i którędy" |
 *
 * ⚠ **Od 2026-09-04 języki są TRZY, nie dwa**, i wybiera je DANA umiejętności
 * (`ABILITIES.*.aimPreview`), nigdy `if (id === …)`: `pathOnly` (sam pasek do
 * celu — Wypad), `reachAndCone` (Ciężkie uderzenie) i **`lane`** (Szarża: pasmo
 * MIN/MAX, tor szerokości ciała, kandydaci, cel, znak przecięcia toru). Pełny
 * projekt i uzasadnienie: `docs/systemy/abilities.md`
 *
 * **Obrys koła = ZASIĘG** (dokąd sięga ostrze). **Wycinek łuku = OBSZAR
 * OBRAŻEŃ** (kogo ten cios naprawdę bierze). Nie wolno im wyglądać tak samo:
 * dotychczasowy `expandingRing` był pełnym kołem i przy łuku 100° pół-łuku
 * **kłamał o kształcie** — obiecywał obrót dookoła tam, gdzie cios ma klin.
 *
 * ⚠⚠ **SPROSTOWANIE 2026-09-04.** Stało tu: „`directionTarget` nie rysuje
 * ŻADNEGO zasięgu… każdy zakrzywiony kształt wokół postaci czyta się jako
 * zasięg DZIAŁANIA". Reguła obowiązuje dalej **dla kształtów mocnych
 * i ciągłych** — i dlatego `pathOnly` dalej nie ma okręgu. Ale Szarża ma dziś
 * pasmo MIN/MAX (`lane`) i jest czytelne, bo okręgi są **cienkie (1 px),
 * kreskowane i mocno przezroczyste**, a pytanie „kto jest w zasięgu" niesie
 * przede wszystkim **stan kandydata** (szare łuki), nie okrąg. Odrzucony był
 * WARIANT, nie kształt — pełny wywód w `docs/systemy/abilities.md`
 *
 * ⚠ **Ten plik NIE ZNA geometrii.** Nie liczy zasięgu ani kąta — dostaje
 * gotowy `ResolvedHitShape` i gotową listę trafionych z `core/AbilitySpec.ts`,
 * czyli **te same dane, którymi rozstrzyga się cios**. Gdyby rysował z
 * własnych liczb, byłby lustrem resolvera i rozjechałby się cicho przy
 * pierwszej zmianie — a podgląd, który kłamie, jest gorszy niż jego brak, bo
 * gracz podejmuje na jego podstawie decyzję.
 *
 * ⚠ **Zasięg mierzy się do KRAWĘDZI hurtboxa celu**, więc duże zwierzę bywa
 * trafialne, mając środek poza narysowanym okręgiem. Dlatego znaczniki celów
 * są częścią podglądu, a nie ozdobą: to one domykają odpowiedź „kto oberwie",
 * której sam okrąg dać nie może.
 */
/** Język podglądu — DANA umiejętności (`ABILITIES.*.aimPreview`), nie gałąź po
 *  jej nazwie. */
export type PreviewStyle = "pathOnly" | "reachAndCone" | "lane" | "reach";

/**
 * Dane podglądu policzone przez SCENĘ — wspólne dla `lane` (Szarża) i `reach`
 * (Wypad).
 *
 * ⚠ **Ten plik nie ma prawa policzyć ich sam.** Kandydaci muszą przejść przez
 * `coversTarget` — TEN SAM predykat, którym rozstrzyga cios — a przeszkoda
 * przez `NavGrid`, czyli tę samą siatkę, z której korzysta ruch wrogów. Podgląd
 * liczący to u siebie byłby lustrem obu i rozjechałby się cicho.
 *
 * ⚠ **Jedna struktura na dwa języki, a nie dwie bliźniacze** — kandydaci są
 * dokładnie tym samym pytaniem u obu umiejętności. Pola, których dany język nie
 * używa, są `null`; to jest tańsze niż drugi typ różniący się jednym polem.
 */
export interface AimExtras {
  /** Ciała kandydatów BEZ wybranego — szare łuki. */
  readonly candidateBodies: readonly CombatBody[];
  /** Dystans od gracza do pierwszej przeszkody na osi toru, albo `null`.
   *  ⚠ Znaczy „tor jest PRZECIĘTY", nie „ciało zatrzyma się dokładnie tu" —
   *  patrz `NavGrid.firstBlockedOn`. Tylko `lane`. */
  readonly blockAtPx: number | null;
  /** Promień ciała gracza (px), albo `null`. Potrzebny tam, gdzie kształt mierzy
   *  PRZEŚWIT — patrz `drawReach`. */
  readonly originRadiusPx: number | null;
}

export class AimPreview {
  private readonly g: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.g = scene.add
      .graphics()
      // ⚠ **NAD światem — patrz `DEPTH.aimPreview`.** Stało tu
      // `DEPTH.entities - 1` (999) z uzasadnieniem „wskaźnik leży na ziemi";
      // przy warstwie Y-sortowanej na 1000 znaczyło to, że podgląd chował się
      // pod pniami, graczem, wrogami i koronami. Subtelność niesie ALFA, nie
      // kolejność rysowania.
      .setDepth(DEPTH.aimPreview)
      .setVisible(false);
  }

  hide(): void {
    this.g.clear();
    this.g.setVisible(false);
  }

  destroy(): void {
    this.g.destroy();
  }

  /**
   * Przerysuj podgląd. Wołane co klatkę w trakcie celowania — gracz może
   * w tym czasie chodzić, więc wierzchołek klina musi jechać za nim.
   *
   * `aim` jest wektorem JEDNOSTKOWYM i **analogowym** (360°), w odróżnieniu od
   * czterokierunkowego zwrotu sprite'a.
   */
  draw<T>(
    frame: AimFrame,
    aim: Punkt,
    shape: ResolvedHitShape,
    selected: readonly SelectedTarget<T>[],
    bodyOf: (t: SelectedTarget<T>) => CombatBody,
    cancelling = false,
    /** Język podglądu dla `directionTarget` — patrz `ABILITIES.*.aimPreview`. */
    styl: PreviewStyle = "pathOnly",
    /** Wymagane przez `styl: "lane"` i `"reach"`. */
    extras?: AimExtras,
  ): void {
    const cfg = ABILITY_AIM.preview;
    const g = this.g;
    g.clear();
    g.setVisible(true);
    // ⚠ **Gdy palec stoi nad ✕, podgląd musi mówić TO SAMO, co przycisk.**
    // Klin w pełnej mocy nad zapalonym znakiem anulowania niósłby dwa
    // sprzeczne komunikaty naraz.
    const a = cancelling ? cfg.cancelAlphaMul : 1;
    // ⚠ Punkt odniesienia bierze się z KSZTAŁTU, nie z gustu rysującego:
    // łuk mierzy od ciała, wskazanie celu od duszka (patrz `AimFrame`).
    // Podgląd rysowany z innego punktu niż resolver kłamałby o kilkanaście px.
    const origin = originFor(shape, frame);

    if (shape.kind === "directionTarget") {
      if (styl === "lane" && extras) this.drawLane(origin, aim, shape, selected, bodyOf, a, cancelling, extras);
      else if (styl === "reach" && extras) this.drawReach(origin, aim, shape, selected, bodyOf, a, cancelling, extras);
      else this.drawTarget(origin, aim, shape, selected, bodyOf, a, cancelling, styl);
      return;
    }

    // ── Zasięg: cienki, subtelny obrys. Informacja, nie zagrożenie. ──
    g.lineStyle(cfg.reachWidth, cfg.reachColor, cfg.reachAlpha * a);
    g.strokeCircle(origin.x, origin.y, shape.reachPx);

    // ── Obszar obrażeń: wypełniony wycinek. To jest ten kształt, który bije. ──
    const srodek = Math.atan2(aim.y, aim.x);
    const pol = Phaser.Math.DegToRad(shape.halfArcDeg);
    const od = srodek - pol;
    const doK = srodek + pol;

    // ⚠ Pół-łuk ≥ 180° to PEŁNE koło i `slice` narysowałby wtedy klin odwrotny
    // do zamierzonego (kąt owija się). Żadna dzisiejsza broń tam nie sięga
    // (najszersza to topór, 100°), ale liczba jest w configu i wpisanie 180
    // dałoby wykres kłamiący w drugą stronę niż wszystko powyżej.
    const pelne = shape.halfArcDeg >= 180;
    g.fillStyle(cfg.arcColor, cfg.arcFillAlpha * a);
    if (pelne) {
      g.fillCircle(origin.x, origin.y, shape.reachPx);
    } else {
      g.slice(origin.x, origin.y, shape.reachPx, od, doK, false);
      g.fillPath();
    }

    g.lineStyle(cfg.arcWidth, cfg.arcColor, cfg.arcLineAlpha * a);
    g.beginPath();
    g.arc(origin.x, origin.y, shape.reachPx, od, doK, false);
    if (!pelne) {
      // Dwa promienie klina domykają kształt — bez nich łuk czyta się jako
      // fragment okręgu zasięgu, czyli jako to samo, od czego ma się różnić.
      g.lineTo(origin.x, origin.y);
      g.closePath();
    }
    g.strokePath();

    // ── Kto NAPRAWDĘ oberwie. Bez tego `maxTargets` jest regułą niewidzialną. ──
    // ⚠ Przy anulowaniu NIE zaznaczamy nikogo: żaden z tych celów nie oberwie,
    // więc obwódka na nich byłaby wprost nieprawdziwa.
    if (cancelling) return;
    for (const t of selected) {
      const body = bodyOf(t);
      const kolor = t.role === "primary" ? cfg.primaryColor : cfg.secondaryColor;
      g.lineStyle(cfg.markerWidth, kolor, cfg.markerAlpha);
      g.strokeCircle(body.x, body.y, body.radius + cfg.markerPadPx);
    }
  }

  /**
   * Podgląd `directionTarget` — **wyłącznie pasek do celu**.
   *
   * ⚠ **Dwie wcześniejsze wersje rysowały zasięg i obie myliły.** Najpierw
   * dwa pełne okręgi (`minRange`/`maxRange`) — czytały się jak obszar dookoła
   * postaci, czyli jak AoE. Potem korytarz przycięty sektorem — kierunek
   * wrócił, ale **łuk dalej czytał się jako „zakres działania"**, bo każdy
   * zakrzywiony kształt wokół postaci tak się czyta, niezależnie od tego, czy
   * jest wypełniony.
   *
   * Ocena autora po ręce: **sam pasek do celu, i tyle.** Pasek odpowiada na
   * jedyne dwa pytania, jakie Szarża stawia — **KTO** (koniec paska) i
   * **KTÓRĘDY** (jego przebieg) — i nie sugeruje żadnej powierzchni, bo jej
   * nie ma.
   *
   * ⚠ **Ta metoda obsługuje dziś WYPAD i Ciężkie uderzenie — nie Szarżę.**
   * Szarża przeszła 2026-09-04 na `drawLane`; poniższy akapit o zniknięciu
   * `minRange` dotyczy więc umiejętności, które progu dolnego i tak nie mają
   * (`minRangePx: 0`), i został zachowany jako zapis powodu.
   *
   * ⚠ **Świadomy koszt: `minRange` zniknął z obrazu.** Wiedza „za blisko"
   * została w słowach — tapnięcie dalej mówi „Za blisko na szarżę". Przy
   * przeciąganiu cel bliższy niż `minRange` po prostu **nie dostaje paska**,
   * czyli reguła jest widoczna przez BRAK, nie przez rysunek. To była
   * świadoma wymiana: jeden kształt mniej wart pomyłki niż jedna informacja
   * mniej.
   */
  private drawTarget<T>(
    origin: Punkt,
    aim: Punkt,
    shape: { maxRangePx: number; acquisitionHalfDeg: number },
    selected: readonly SelectedTarget<T>[],
    bodyOf: (t: SelectedTarget<T>) => CombatBody,
    a: number,
    cancelling: boolean,
    styl: PreviewStyle,
  ): void {
    const cfg = ABILITY_AIM.preview;
    const t = cfg.target;
    const g = this.g;

    // ── `reachAndCone`: cienki zasięg + granice sektora, ZERO wypełnień ──
    // ⚠ Wypełnienie odtworzyłoby klin Cleave'a, czyli komunikat „wszyscy w tym
    // obszarze oberwą" — dokładnie odwrotny do zamierzonego.
    if (styl === "reachAndCone") {
      g.lineStyle(t.reachWidth, t.reachColor, t.reachAlpha * a);
      g.strokeCircle(origin.x, origin.y, shape.maxRangePx);
      const srodek = Math.atan2(aim.y, aim.x);
      const pol = Phaser.Math.DegToRad(shape.acquisitionHalfDeg);
      g.lineStyle(t.reachWidth, t.reachColor, t.coneAlpha * a);
      for (const kat of [srodek - pol, srodek + pol]) {
        g.beginPath();
        g.moveTo(origin.x, origin.y);
        g.lineTo(origin.x + Math.cos(kat) * shape.maxRangePx, origin.y + Math.sin(kat) * shape.maxRangePx);
        g.strokePath();
      }
    }

    const cel = selected[0];
    // Brak legalnego celu → **pusto**. Pasek jest jedynym elementem tego
    // podglądu, więc jego brak jest komunikatem: „nie ma kogo szarżować".
    if (!cel) return;

    const body = bodyOf(cel);
    g.lineStyle(t.pathWidth, cfg.primaryColor, t.pathAlpha * a);
    g.beginPath();
    g.moveTo(origin.x, origin.y);
    g.lineTo(body.x, body.y);
    g.strokePath();

    // Obwódka mówi, na KIM pasek się kończy — przy dwóch wrogach stojących
    // jeden za drugim sam koniec linii bywa niejednoznaczny. Znika przy
    // anulowaniu, bo wtedy nikt nie zostanie celem.
    if (cancelling) return;
    g.lineStyle(cfg.markerWidth, cfg.primaryColor, cfg.markerAlpha);
    g.strokeCircle(body.x, body.y, body.radius + cfg.markerPadPx);
  }

  /* ══════════════════════════════════════════════════════════════════════
     JĘZYK „PASA" — podgląd Szarży (2026-09-04)
     ══════════════════════════════════════════════════════════════════════
     ⚠ **Jedna reguła niesie cztery stany: WYPEŁNIENIE znaczy „to się
     wydarzy".** Pas pusty = Szarża tędy nie pobiegnie, pas wypełniony =
     pobiegnie. Dzięki temu „brak celu", „za blisko" i „przeszkoda" nie
     potrzebują trzech osobnych elementów — są trzema wynikami tej samej
     reguły. Pełne uzasadnienie: `ABILITY_AIM.preview.target.lane`.

     ⛔ **Dwie linie NIE są hitboxem ani obszarem obrażeń.** Szarża sama nie
     zadaje obrażeń (uzbraja autoatak na końcu), a między krawędziami nic nie
     obrywa — nie ma nawet collidera `player × enemies`. Pas ma szerokość
     CIAŁA, bo opisuje tor ciała; dlatego jego szerokość jest tą samą liczbą,
     którą pyta się `NavGrid` o przejezdność.

     ⚠ **Podgląd jest MIGAWKĄ.** `stepRush` przelicza kurs co klatkę za
     ruchomym celem, więc faktyczny tor bywa łukiem. Rysujemy prostą, bo
     odpowiada na pytanie „do kogo i którędy", a nie „jaki dokładnie kształt
     ma trajektoria". */
  private drawLane<T>(
    origin: Punkt,
    aim: Punkt,
    shape: { minRangePx: number; maxRangePx: number },
    selected: readonly SelectedTarget<T>[],
    bodyOf: (t: SelectedTarget<T>) => CombatBody,
    a: number,
    cancelling: boolean,
    info: AimExtras,
  ): void {
    const L = ABILITY_AIM.preview.target.lane;

    // ── Granice pasma: oba okręgi przerywane, oba drugorzędne ─────────────
    this.dashedCircle(origin, shape.maxRangePx, L.maxColor, L.maxAlpha * a, L.maxWidth, L.maxDashDeg, L.maxGapDeg);
    this.dashedCircle(origin, shape.minRangePx, L.minColor, L.minAlpha * a, L.minWidth, L.minDashDeg, L.minGapDeg);

    // ── Oś toru: DO CELU, gdy jakiś jest; inaczej w kierunku palca ────────
    // ⚠ Nie wzdłuż palca, gdy cel istnieje — lot leci do CELU (`stepRush`),
    // a palec tylko go wskazuje w sektorze ±`acquisitionHalfDeg`.
    const cel = cancelling ? undefined : selected[0];
    const celBody = cel ? bodyOf(cel) : null;
    let osX = aim.x;
    let osY = aim.y;
    let dlugosc = shape.maxRangePx;
    if (celBody) {
      const dx = celBody.x - origin.x;
      const dy = celBody.y - origin.y;
      const d = Math.hypot(dx, dy);
      if (d > 0.001) {
        osX = dx / d;
        osY = dy / d;
        // Do KRAWĘDZI ciała, nie do środka — pas kończy się na stworzeniu,
        // a nie w nim.
        dlugosc = Math.max(0, d - celBody.radius);
      }
    }

    // ── Trzy odcinki na jednej osi ────────────────────────────────────────
    // rozbieg: 0 → minRange (pusty, czerwony) · właściwy tor: minRange → koniec
    // (wypełniony) · dalej: pusty, a przy przeszkodzie mocno czerwony ze ✕.
    const rozbieg = Math.min(shape.minRangePx, dlugosc);
    const blok = info.blockAtPx !== null ? Math.min(info.blockAtPx, dlugosc) : null;
    // ⚠ Wypełnienie znaczy „to się wydarzy" — więc tylko gdy JEST cel i tylko
    // do przeszkody. Bez celu naciśnięcie nic nie robi („Szarża potrzebuje
    // celu"), więc pas zostaje pusty na całej długości.
    const koniecWypelnienia = celBody ? (blok !== null ? Math.max(rozbieg, blok) : dlugosc) : rozbieg;

    // 1. Rozbieg — same krawędzie, czerwone, BEZ szewronów (patrz config).
    if (rozbieg > 0) {
      this.laneEdges(origin, osX, osY, 0, rozbieg, L.runupColor, L.runupAlpha * a, L.edgeWidth);
    }
    // 2. Właściwy tor — krawędzie + subtelne wypełnienie + szewrony.
    if (koniecWypelnienia > rozbieg) {
      this.laneFill(origin, osX, osY, rozbieg, koniecWypelnienia, L.fillColor, L.fillAlpha * a);
      this.laneEdges(origin, osX, osY, rozbieg, koniecWypelnienia, L.edgeColor, L.edgeAlpha * a, L.edgeWidth);
      this.chevrons(origin, osX, osY, rozbieg, koniecWypelnienia, L.chevronColor, L.chevronAlpha * a);
    }
    // 3. Odcinek dalszy — pusty. Czerwony i ze znakiem ✕ tylko wtedy, gdy
    //    powodem jest PRZESZKODA; przy zwykłym braku celu to po prostu pas,
    //    którym nikt nie pobiegnie.
    if (dlugosc > koniecWypelnienia) {
      const czerwony = blok !== null;
      this.laneEdges(
        origin,
        osX,
        osY,
        koniecWypelnienia,
        dlugosc,
        czerwony ? L.blockColor : L.edgeColor,
        (czerwony ? L.blockAlpha : L.edgeAlpha) * a,
        L.edgeWidth,
      );
    }
    if (blok !== null) {
      this.blockMark(origin, osX, osY, blok, L.blockColor, L.blockAlpha * a, L.blockWidth, L.blockMarkPx);
    }

    // ── Kandydaci: DWA ŁUKI, nie pierścień (odróżnienie od markera manekina) ─
    if (!cancelling) {
      for (const b of info.candidateBodies) {
        this.candidateArcs(b, L.candidateColor, L.candidateAlpha * a, L.candidateWidth, L.candidateArcDeg, L.candidatePadPx);
      }
    }

    // ── Wybrany cel: jasny, półprzezroczysty żółty ────────────────────────
    if (celBody) this.selectedMark(celBody, a);
  }

  /* ══════════════════════════════════════════════════════════════════════
     JĘZYK „REACH" — podgląd Wypadu / „Kroku i Ciosu" (2026-09-04)
     ══════════════════════════════════════════════════════════════════════
     ⚠ **Bierze z języka Szarży dokładnie te elementy, których wymaga JEGO
     mechanika, i ani jednego więcej** (`docs/systemy/abilities.md`). Nie ma
     tu MIN (`minRangePx: 0` z decyzji — „za blisko" jest pojęciem Szarży), nie
     ma rozbiegu (nie ma czego rozbiegać) i nie ma znaku przecięcia toru.

     ⚠⚠ **Reguła wypełnienia z Szarży NIE PRZENOSI SIĘ WPROST i to jest cała
     różnica między tymi dwoma podglądami.** Tam pusty pas znaczył „naciśnięcie
     nic nie zrobi"; tutaj **brak celu jest DRUGIM, pełnoprawnym użyciem** —
     skokiem kierunkowym za pełny cooldown (`GameScene`, gałąź `case "lunge"`).
     Skok naprawdę następuje, więc jego tor jest **wypełniony**. Pusty pas
     byłby tu wprost nieprawdą. */
  private drawReach<T>(
    origin: Punkt,
    aim: Punkt,
    shape: { maxRangePx: number },
    selected: readonly SelectedTarget<T>[],
    bodyOf: (t: SelectedTarget<T>) => CombatBody,
    a: number,
    cancelling: boolean,
    info: AimExtras,
  ): void {
    const L = ABILITY_AIM.preview.target.lane;

    /* ── Zasięg: okrąg POWIĘKSZONY o promień ciała gracza ─────────────────
       ⚠⚠ **To nie jest margines estetyczny — bez niego okrąg KŁAMIE.** Wypad
       mierzy `metric: "surfaceGap"`, czyli **prześwit między krawędziami ciał**
       (`AbilitySpec`), a nie dystans środków. Skoro
       `gap = dystans_środków − r_gracza − r_celu`, to warunek `gap ≤ zasięg`
       znaczy: **najbliższy punkt SYLWETKI celu** ma leżeć nie dalej niż
       `zasięg + r_gracza` od środka ciała gracza. Okrąg o takim promieniu jest
       więc ŚCISŁY, a czyta się naturalnie: „dotyka cię okrąg — dosięgniesz".
       Naiwny okrąg o promieniu `maxRangePx` pokazywałby duże zwierzę jako poza
       zasięgiem, choć jest trafialne. */
    const r = shape.maxRangePx + (info.originRadiusPx ?? 0);
    this.dashedCircle(origin, r, L.maxColor, L.maxAlpha * a, L.maxWidth, L.maxDashDeg, L.maxGapDeg);

    const cel = cancelling ? undefined : selected[0];
    const celBody = cel ? bodyOf(cel) : null;

    /* ── Tor skoku — ZAWSZE, tylko z inną osią ────────────────────────────
       ⚠ **Poprawka z runtime'u 2026-09-04: wcześniej tor znikał po wybraniu
       celu i to był błąd.** Rozumowanie „marker już mówi »tu wyląduję«, więc
       pas jest powtórzeniem" nie broni się na ekranie: Wypad jest RUCHEM, a po
       wskazaniu celu znikał jedyny element, który ten ruch pokazywał — podgląd
       tracił połowę odpowiedzi dokładnie w chwili, gdy gracz podjął decyzję.

       ⚠ **Oś idzie DO CELU, gdy cel jest** — ta sama reguła co w `drawLane`
       i z tego samego powodu: lot leci do celu (`stepRush`), a palec tylko
       wskazuje go w sektorze. Bez celu — wzdłuż palca.

       ⚠ Długość bez celu = `maxRangePx`, bo tyle właśnie przelatuje skok
       (gałąź `dash` liczy czas jako `zasięg / prędkość`). Z celem — do
       KRAWĘDZI jego ciała, żeby pas kończył się na stworzeniu, a nie w nim.

       ⚠ Przy anulowaniu nie rysujemy nic: puszczenie nad ✕ nie wykona skoku,
       a wypełniony pas znaczy „to się wydarzy". */
    let osX = aim.x;
    let osY = aim.y;
    let dlugosc = shape.maxRangePx;
    if (celBody) {
      const dx = celBody.x - origin.x;
      const dy = celBody.y - origin.y;
      const d = Math.hypot(dx, dy);
      if (d > 0.001) {
        osX = dx / d;
        osY = dy / d;
        dlugosc = Math.max(0, d - celBody.radius);
      }
    }
    /* ⚠⚠ **Pas kończy się na PRZESZKODZIE — poprawka 2026-09-05.** Wcześniej
       biegł do pełnego zasięgu przez pnie, czyli **obiecywał krok, którego nie
       da się zrobić** — i to wbrew własnemu wykonaniu, które skok w tym miejscu
       skraca (`GameScene`, gałąź `dash`). Wypełnienie znaczy „to się wydarzy",
       więc nie ma prawa leżeć za drzewem.

       ⚠ **Za punktem przecięcia nie rysujemy NIC** — ani czerwieni, ani ✕.
       To jest świadoma różnica wobec Szarży: Wypad nie dostał w tej rundzie
       języka blokady (decyzja autora), a sam skrócony pas mówi już wszystko,
       co potrzebne — „dojdę dotąd". Dokładanie tu ✕ byłoby nowym elementem UI,
       nie poprawką. */
    const doPrzeszkody = info.blockAtPx !== null ? Math.min(dlugosc, info.blockAtPx) : dlugosc;
    if (!cancelling && doPrzeszkody > 0) {
      this.laneFill(origin, osX, osY, 0, doPrzeszkody, L.fillColor, L.fillAlpha * a);
      this.laneEdges(origin, osX, osY, 0, doPrzeszkody, L.edgeColor, L.edgeAlpha * a, L.edgeWidth);
      this.chevrons(origin, osX, osY, 0, doPrzeszkody, L.chevronColor, L.chevronAlpha * a);
    }

    // ── Kandydaci i wybrany — dokładnie te same znaczniki co przy Szarży ──
    if (!cancelling) {
      for (const b of info.candidateBodies) {
        this.candidateArcs(b, L.candidateColor, L.candidateAlpha * a, L.candidateWidth, L.candidateArcDeg, L.candidatePadPx);
      }
    }
    if (celBody) this.selectedMark(celBody, a);
  }

  /** Wybrany cel — jasny, półprzezroczysty żółty. Wspólny dla `lane` i `reach`:
   *  „TEN przeciwnik" ma wyglądać identycznie w każdej umiejętności. */
  private selectedMark(body: CombatBody, a: number): void {
    const L = ABILITY_AIM.preview.target.lane;
    const g = this.g;
    const kolor = ABILITY_AIM.preview.primaryColor;
    const r = body.radius + L.selectedPadPx;
    g.fillStyle(kolor, L.selectedFillAlpha * a);
    g.fillCircle(body.x, body.y, r);
    g.lineStyle(L.selectedWidth, kolor, L.selectedLineAlpha * a);
    g.strokeCircle(body.x, body.y, r);
  }

  /**
   * Okrąg kreskowany — Phaser nie zna stylu przerywanego.
   *
   * ⚠ **Każda kreska to ŁAMANA (`moveTo`/`lineTo`), nie `arc`, i to jest
   * poprawka z 2026-09-04, nie stylistyka.** `Graphics.arc` dokłada łuk do
   * BIEŻĄCEJ ścieżki i sam decyduje o teselacji; przy krótkim wycinku łatwo
   * o ścieżkę, która nie ma czego obrysować. Łamana rysuje dokładnie tyle
   * odcinków, ile każemy, więc kreska albo jest, albo jest błąd w liczbach —
   * nie ma trzeciej możliwości do diagnozowania na ekranie telefonu.
   *
   * Koszt: przy `minRange` 100 px i kresce 14° wychodzi ~19 kresek po 7
   * odcinków. Rysowane wyłącznie w trakcie trzymania palca.
   */
  private dashedCircle(
    c: Punkt,
    r: number,
    color: number,
    alpha: number,
    width: number,
    dashDeg: number,
    gapDeg: number,
  ): void {
    if (r <= 0 || alpha <= 0) return;
    const g = this.g;
    const krok = dashDeg + gapDeg;
    // Gęstość teselacji: odcinek co ~2°, minimum dwa punkty na kreskę.
    const odcinki = Math.max(2, Math.ceil(dashDeg / 2));
    g.lineStyle(width, color, alpha);
    for (let kat = 0; kat < 360; kat += krok) {
      g.beginPath();
      for (let i = 0; i <= odcinki; i++) {
        const rad = Phaser.Math.DegToRad(kat + (dashDeg * i) / odcinki);
        const x = c.x + Math.cos(rad) * r;
        const y = c.y + Math.sin(rad) * r;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.strokePath();
    }
  }

  /** Dwie krawędzie pasa na odcinku `od`–`doK` (dystans wzdłuż osi). */
  private laneEdges(
    o: Punkt,
    ax: number,
    ay: number,
    od: number,
    doK: number,
    color: number,
    alpha: number,
    width: number,
  ): void {
    if (doK <= od || alpha <= 0) return;
    const g = this.g;
    const pol = ABILITY_AIM.preview.target.lane.widthPx / 2;
    // Normalna do osi — pas biegnie równolegle do kierunku ruchu.
    const nx = -ay * pol;
    const ny = ax * pol;
    g.lineStyle(width, color, alpha);
    for (const znak of [1, -1]) {
      g.beginPath();
      g.moveTo(o.x + ax * od + nx * znak, o.y + ay * od + ny * znak);
      g.lineTo(o.x + ax * doK + nx * znak, o.y + ay * doK + ny * znak);
      g.strokePath();
    }
  }

  /** Wypełnienie pasa — „tędy naprawdę pobiegnę". */
  private laneFill(o: Punkt, ax: number, ay: number, od: number, doK: number, color: number, alpha: number): void {
    if (doK <= od || alpha <= 0) return;
    const pol = ABILITY_AIM.preview.target.lane.widthPx / 2;
    const nx = -ay * pol;
    const ny = ax * pol;
    this.g.fillStyle(color, alpha);
    this.g.fillPoints(
      [
        new Phaser.Geom.Point(o.x + ax * od + nx, o.y + ay * od + ny),
        new Phaser.Geom.Point(o.x + ax * doK + nx, o.y + ay * doK + ny),
        new Phaser.Geom.Point(o.x + ax * doK - nx, o.y + ay * doK - ny),
        new Phaser.Geom.Point(o.x + ax * od - nx, o.y + ay * od - ny),
      ],
      true,
    );
  }

  /** Szewrony kierunku — czysta geometria, nigdy `Text`. */
  private chevrons(o: Punkt, ax: number, ay: number, od: number, doK: number, color: number, alpha: number): void {
    const L = ABILITY_AIM.preview.target.lane;
    if (doK - od < L.chevronSpacingPx || alpha <= 0) return;
    const g = this.g;
    const s = L.chevronSizePx;
    const nx = -ay;
    const ny = ax;
    g.lineStyle(L.edgeWidth, color, alpha);
    // Pierwszy szewron o pół odstępu za początkiem — inaczej sklejałby się
    // z krawędzią rozbiegu i czytał jak jej zdobienie.
    for (let d = od + L.chevronSpacingPx / 2; d <= doK - s; d += L.chevronSpacingPx) {
      const cx = o.x + ax * d;
      const cy = o.y + ay * d;
      g.beginPath();
      g.moveTo(cx - ax * s * 0.5 + nx * s * 0.6, cy - ay * s * 0.5 + ny * s * 0.6);
      g.lineTo(cx + ax * s * 0.5, cy + ay * s * 0.5);
      g.lineTo(cx - ax * s * 0.5 - nx * s * 0.6, cy - ay * s * 0.5 - ny * s * 0.6);
      g.strokePath();
    }
  }

  /** Znak ✕ w miejscu przecięcia toru. */
  private blockMark(
    o: Punkt,
    ax: number,
    ay: number,
    d: number,
    color: number,
    alpha: number,
    width: number,
    size: number,
  ): void {
    const g = this.g;
    const cx = o.x + ax * d;
    const cy = o.y + ay * d;
    g.lineStyle(width, color, alpha);
    for (const znak of [1, -1]) {
      g.beginPath();
      g.moveTo(cx - size, cy - size * znak);
      g.lineTo(cx + size, cy + size * znak);
      g.strokePath();
    }
  }

  /** Kandydat: dwa łuki po bokach, nie pełny pierścień. */
  private candidateArcs(b: CombatBody, color: number, alpha: number, width: number, arcDeg: number, pad: number): void {
    const g = this.g;
    const r = b.radius + pad;
    const pol = Phaser.Math.DegToRad(arcDeg / 2);
    g.lineStyle(width, color, alpha);
    for (const srodek of [-Math.PI / 2, Math.PI / 2]) {
      g.beginPath();
      g.arc(b.x, b.y, r, srodek - pol, srodek + pol, false);
      g.strokePath();
    }
  }
}
