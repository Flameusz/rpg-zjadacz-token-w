/**
 * **`P1` — rozkład kątów nadchodzących ciosów.** Narzędzie DEWELOPERSKIE,
 * nie mechanika. Znika z buildu produkcyjnego (`import.meta.env.DEV`).
 *
 * ── Po co istnieje ────────────────────────────────────────────────────────
 * Dwie z sześciu projektowanych konstrukcji tarcz (**Okrągła** i **Pawęż**)
 * mają tożsamość na osi ŁUKU. Jedyny pomiar, jaki projekt ma —
 * `block 89,4% · parry 5,5% · dodge 5,2%` — pochodzi z `tools/combat_benchmark.mjs`,
 * czyli **z napastnika ustawionego na wprost**. ⛔ **Nikt nie wie, czy w grze
 * ciosy przychodzą pod różnymi kątami.** Jeśli nie przychodzą, łuk boczny jest
 * wart niewiele, a z nim spora część `T-1`.
 *
 * Pełny zapis etapu: `docs/tarcze_checkpoint.md` (`P1`, krok 0).
 *
 * ── Dlaczego SUROWY KĄT, a nie licznik stref ──────────────────────────────
 * ⭐ Checkpoint zapisał to jako „licznik `zone`", ale licznik pod DZISIEJSZYMI
 * progami (60/100) potrafi odpowiedzieć wyłącznie na pytanie o dzisiejsze progi.
 * `B3` pyta o **inne** — 45/90/135. Histogram kąta odpowiada na oba, kosztuje
 * tyle samo i pozwala policzyć dowolny wariant **bez powtarzania rozgrywki**,
 * czyli bez wydawania drugi raz jedynego zasobu, którego nie da się
 * zasymulować: czasu autora przy grze.
 *
 * ── ⚠ Dlaczego NIE czytamy `DamageResult.zone` ────────────────────────────
 * ⚠⚠ **`resolveIncoming` zwraca `zone: "back"` NA SZTYWNO w gałęziach `immune`
 * i `dodge`** — to nie jest geometria, tylko wypełniacz pola. Dodge to 5,2%
 * ciosów w benchmarku, a `immune` obejmuje klatki nietykalności uniku i łaskę
 * po odrodzeniu. Liczenie po werdykcie **systematycznie zawyżałoby „tył"**
 * i zaniżało wartość tarczy — czyli przymiar odpowiadałby na pytanie `P1`
 * błędem, a nie danymi.
 *
 * Dlatego kąt liczy się **niezależnie od werdyktu**, z `Protection.guardAngleDeg`
 * — tej samej funkcji, której używa `isFrontal`. ⚠ Nie licz go tu drugi raz:
 * druga kopia geometrii jest błędem, nie optymalizacją (N-25).
 *
 * ── ⚠ Dlaczego NIE wewnątrz `resolveIncoming` ─────────────────────────────
 * Nagłówek `DamageResolver.ts` stawia czystość tej funkcji jako warunek: ma dać
 * się odtworzyć w teście, w replayu i na serwerze bez stanu gry. Licznik modułowy
 * w środku dołożyłby jej drugą zależność ze stanem — a przy okazji zbierałby
 * śmieci z `tools/combat_regresja.mjs`, które woła prawdziwy resolver 121 razy.
 * Sonda siedzi więc w `Player.takeDamage`, czyli u JEDYNEGO wołającego, który
 * i tak ma już `guardDir` i `from` w ręku.
 *
 * Użycie z konsoli:
 *   dev.guard.start()     — zacznij zbierać (czyści poprzednią próbkę)
 *   dev.guard.raport()    — wypisz histogram + tabelę progów
 *   dev.guard.stop()      — przestań zbierać (próbka zostaje)
 *   dev.guard.n()         — ile ciosów zebrano
 *   dev.guard.wznow()     — ⭐ po F5 / przeładowaniu: podejmij poprzednią próbkę
 */

import { guardAngleDeg, type GuardFacing } from "./Protection";
import type { DamageOutcome } from "./DamageResolver";

/** Jeden przyjęty cios. ⚠ Zapisywany dla KAŻDEGO werdyktu, także `dodge`
 *  i `immune` — inaczej próbka jest skrzywiona (patrz nagłówek). */
interface Probka {
  /** Kąt guardDir → napastnik, 0…180. `NaN` = cios bez kierunku. */
  readonly kat: number;
  readonly outcome: DamageOutcome;
  /** Czy gracz stał w pozie ataku, czyli czy osłona szła za ciosem (`guardKat` = `attackRad`).
   *  ⭐ To testuje zapisaną tezę „tarcza jest odpowiedzią na twój własny root". */
  readonly wPozie: boolean;
  /** Czy gracz szedł (strefa MARSZU drążka). Obrót w miejscu daje `false`. */
  readonly wRuchu: boolean;
}

/**
 * **Minimalna próbka, poniżej której raport jest orientacyjny.**
 *
 * ⚠ **To nie jest liczba z sufitu — to jest próg, poniżej którego różnica
 * kilku punktów procentowych między progami 45/90/135 przestaje być
 * odróżnialna od szumu losowania.** Przy 100 ciosach jeden cios to 1 pp;
 * przy 30 ciosach jeden cios to 3,3 pp, czyli cała spodziewana różnica między
 * dwoma sąsiednimi progami mieści się w jednej próbce.
 *
 * ⚠⚠ **Mianownikiem `P1` są ciosy KLASYFIKOWALNE do rozkładu FRONT/BOK/TYŁ**
 * (decyzja metodologiczna autora, 2026-09-15). Cios bez kierunku nie ma kąta;
 * unik i `immune` mają kąt, ale nie są starciem z gardą. ⛔ **Żadne z nich nie
 * wchodzi do `n`** — ani do progu, ani do procentów w rozkładzie.
 * ⚠ **Ale ZOSTAJĄ W PRÓBCE**: `record` zapisuje każdy cios, żeby dane dało się
 * przeliczyć według innej reguły bez powtarzania rozgrywki.
 */
const PROG_PROBKI = 100;

/**
 * Ile próbek trzymamy. 20 000 ciosów to wielokrotność tego, co da się przyjąć
 * w jednej sesji grania, a pamięć przy tym jest bez znaczenia (~4 pola × 20k).
 * Po przepełnieniu zbieranie STAJE, zamiast nadpisywać od początku: nadpisanie
 * po cichu zmieniłoby okno pomiaru w środku sesji.
 */
const LIMIT = 20_000;

/**
 * Kandydaci na progi `fullArcDeg / sideArcDeg` do przeliczenia kontrfaktycznego.
 *
 * ⚠ **Wartości nie są propozycją balansu** — to są progi wynikające
 * z CZTEROKIEROWEGO zwrotu postaci (`FACING_VECTOR` ma cztery wektory, więc
 * maksymalny rozjazd „celuję w niego" ↔ jego realny kąt wynosi 45°):
 *
 *   45°  — dolna granica „kryję własną ćwiartkę"
 *   90°  — ⛔ sufit `fullArcDeg`, współdzielony z parowaniem (`FRONT_ARC_DEG`)
 *   135° — „cała sąsiednia ćwiartka"
 *
 * Pierwszy wiersz to stan dzisiejszy, żeby raport dało się czytać jako różnicę.
 */
const PROGI: readonly (readonly [pelny: number, zewnetrzny: number])[] = [
  [60, 100], // dziś
  [45, 90],
  [45, 135],
  [60, 135],
  [90, 135],
  [90, 150],
];

/** Klucz odkładania próbki. ⚠ Poza przestrzenią `rpg-save*` — to jest pomiar
 *  deweloperski, nie stan postaci, i nie ma prawa trafić do żadnego slotu zapisu. */
const KLUCZ = "rpg-guard-p1";

class GuardStatsProbe {
  private probki: Probka[] = [];
  private zbiera = false;
  private przepelnione = false;

  /** Zacznij zbierać od zera. ⚠ Kasuje też próbkę odlożoną w `localStorage`. */
  start(): void {
    this.probki = [];
    this.przepelnione = false;
    this.zbiera = true;
    this.odlozNatychmiast();
    console.log("[guard] zbieram. `dev.guard.raport()` po kilku walkach.");
  }

  stop(): void {
    this.zbiera = false;
    this.odlozNatychmiast();
    console.log(`[guard] stop. Próbek: ${this.probki.length}.`);
  }

  /**
   * ⭐ **Wznowienie po przeładowaniu strony.** Próbka `P1` kosztuje jedyny zasób,
   * którego nie da się zasymulować — czas autora przy grze — a 150–200 ciosom
   * odpowiada kilkadziesiąt minut walki. ⚠ **Pojedyncze F5, przeładowanie z HMR
   * po edycji kodu albo zwykły crash kasowały całą tę sesję**, bez ostrzeżenia.
   *
   * ⛔ **Wznowienie jest JAWNE i nigdy nie dzieje się samo.** Cicha sklejka dwóch
   * sesji grania to dokładnie ten błąd, przed którym broni się `LIMIT` (patrz
   * wyżej): okno pomiaru zmieniłoby się w środku, a raport nadal wyglądałby
   * poprawnie. Autor ma powiedzieć „to ta sama sesja", nie domyślić się tego kod.
   */
  wznow(): void {
    const zapis = this.odczytaj();
    if (zapis === null) {
      console.log("[guard] nic nie odlożono. `dev.guard.start()`, żeby zacząć od zera.");
      return;
    }
    this.probki = zapis;
    this.przepelnione = false;
    this.zbiera = true;
    console.log(`[guard] wznowione: ${zapis.length} próbek z poprzedniej sesji. Zbieram dalej.`);
  }

  /** ⚠ Zapis jest DŁAWIONY — `record` leci przy każdym ciosie, a serializacja
   *  całej tablicy przy każdym z nich dałaby koszt O(n²) w pętli walki. */
  private odloz(): void {
    if (this.probki.length % 10 !== 0) return;
    this.odlozNatychmiast();
  }

  private odlozNatychmiast(): void {
    // ⚠ `localStorage` potrafi rzucić (tryb prywatny, zapełniony quota). Sonda
    //   deweloperska NIE MOŻE wywalić walki — utrata trwałości jest do przeżycia,
    //   wyjątek w `takeDamage` nie jest.
    try {
      if (this.probki.length === 0) localStorage.removeItem(KLUCZ);
      else localStorage.setItem(KLUCZ, JSON.stringify(this.probki));
    } catch {
      /* pusto — pomiar działa dalej, tylko bez odkładania */
    }
  }

  private odczytaj(): Probka[] | null {
    try {
      const surowe = localStorage.getItem(KLUCZ);
      if (!surowe) return null;
      const dane = JSON.parse(surowe);
      return Array.isArray(dane) && dane.length > 0 ? (dane as Probka[]) : null;
    } catch {
      return null;
    }
  }

  n(): number {
    return this.probki.length;
  }

  /**
   * Zapisz jeden przyjęty cios.
   *
   * ⚠ **Wołane z `Player.takeDamage` dla KAŻDEGO ciosu, także odbitego
   * i unikniętego.** Wyjście przed `resolveIncoming` (przy `dead`/`invulnerable`)
   * świadomie NIE jest tu liczone: tam nie ma zdarzenia bojowego, tylko brak
   * celu.
   */
  record(facing: GuardFacing, from: { x: number; y: number } | null, outcome: DamageOutcome,
         wPozie: boolean, wRuchu: boolean): void {
    if (!this.zbiera) return;
    if (this.probki.length >= LIMIT) {
      if (!this.przepelnione) {
        this.przepelnione = true;
        this.zbiera = false;
        console.warn(`[guard] limit ${LIMIT} próbek — zbieranie zatrzymane, próbka zachowana.`);
      }
      return;
    }
    // ⚠ Kąt z `Protection`, nie liczony tutaj — jedna konwencja granicy (N-25).
    this.probki.push({ kat: guardAngleDeg(facing, from), outcome, wPozie, wRuchu });
    this.odloz();
  }

  /** Histogram + tabela progów + rozbicie na zobowiązanie własne. */
  raport(): void {
    const n = this.probki.length;
    if (n === 0) {
      console.log("[guard] zero próbek. `dev.guard.start()`, potem pograj.");
      return;
    }

    // ⚠⚠ **MIANOWNIK `P1` to ciosy KLASYFIKOWALNE do rozkładu FRONT/BOK/TYŁ**
    //    — decyzja metodologiczna autora (2026-09-15), zgodna z pierwotnym
    //    protokołem. Cios bez kierunku nie ma kąta; unik i `immune` mają kąt, ale
    //    nie są starciem z gardą — ⛔ **żadne z nich nie wchodzi do `n`**.
    //    ⚠ **Odrzucone z mianownika NIE znikają z próbki.** `record` zapisuje każdy
    //    cios i tak ma zostać: próbka niepełna nie da się przeliczyć według innej
    //    reguły bez powtórzenia rozgrywki, a rozgrywka jest tu jedynym zasobem,
    //    którego nie da się odtworzyć.
    const bezKierunku = this.probki.filter((p) => Number.isNaN(p.kat));
    const zKierunkiem = this.probki.filter((p) => !Number.isNaN(p.kat));
    const odsiane = zKierunkiem.filter((p) => p.outcome === "dodge" || p.outcome === "immune");
    const klas = zKierunkiem.filter((p) => p.outcome !== "dodge" && p.outcome !== "immune");
    const nk = klas.length;

    console.log(`=== P1 — rozkład kątów ciosów (${n} zapisanych ciosów) ===`);
    console.log(`⭐ n (KLASYFIKOWALNE — mianownik P1): ${nk}`);
    console.log(
      `  poza mianownikiem: ${bezKierunku.length} bez kierunku · ` +
        `${odsiane.length} unik/immune — zapisane w próbce, nieliczone`,
    );

    // ── Histogram w koszach wyznaczonych przez progi, nie co 10° ───────────
    // ⚠ Kosze są nierówne CELOWO: ich granice to punkty, w których zmienia się
    // odpowiedź na pytanie projektowe. Równe kosze co 10° wyglądałyby rzetelniej
    // i nie odpowiadałyby na nic.
    const granice = [0, 45, 60, 90, 100, 135, 180.0001];
    const etykiety = ["0–45", "45–60", "60–90", "90–100", "100–135", "135–180"];
    const kosze = etykiety.map((_, i) =>
      klas.filter((p) => p.kat >= granice[i] && p.kat < granice[i + 1]).length,
    );
    console.log("\nHistogram (tylko ciosy z kierunkiem, n=" + nk + "):");
    for (let i = 0; i < etykiety.length; i++) {
      const udzial = nk > 0 ? kosze[i] / nk : 0;
      console.log(
        `  ${etykiety[i].padStart(8)}°  ${String(kosze[i]).padStart(5)}  ${pct(kosze[i], nk).padStart(7)}  ` +
          "#".repeat(Math.round(udzial * 50)),
      );
    }

    // ── ⭐ Skumulowane — główny odczyt, żeby nie liczyć „na oko" ───────────
    // ⚠ **Granice są OSTRE (`<`), nie `≤`, i to nie jest literówka.** Taka jest
    // konwencja `isFrontal`: granica należy do strony NIEchronionej. Wypisujemy
    // ją wprost, bo mieszanie `≤` z `<` przy progach to dokładnie ta klasa
    // błędu, którą ten projekt zapłacił raz na cosinusie 90°.
    console.log("\nSkumulowane (n=" + nk + ", granice OSTRE jak w `isFrontal`):");
    for (const prog of [45, 90, 135]) {
      const ile = klas.filter((p) => p.kat < prog).length;
      console.log(`  < ${String(prog).padStart(3)}°   ${String(ile).padStart(5)}   ${pct(ile, nk).padStart(7)}`);
    }
    const poza135 = klas.filter((p) => p.kat >= 135).length;
    console.log(`  ≥ 135°   ${String(poza135).padStart(5)}   ${pct(poza135, nk).padStart(7)}`);
    console.log(`  mediana całości: ${mediana(klas)}°`);

    // ⚠ Próg mocy próbki — wypisany PRZED tabelą progów, bo to on decyduje,
    // czy tabelę wolno w ogóle czytać jako różnicę, czy tylko jako kierunek.
    if (nk < PROG_PROBKI) {
      console.warn(
        `⚠ n = ${nk} klasyfikowalnych, PONIŻEJ progu ${PROG_PROBKI}. ` +
          "Raport czytaj jako kierunek, nie jako liczby — jeden cios to " +
          `${(100 / Math.max(1, nk)).toFixed(1)} pp.`,
      );
    } else {
      console.log(`  ✅ n ≥ ${PROG_PROBKI} — jeden cios to ${(100 / nk).toFixed(2)} pp.`);
    }

    // ── ⭐ Tabela progów: to jest deliverable dla `B3` ─────────────────────
    console.log("\nCo by złapała tarcza przy różnych progach (pełny / zewnętrzny):");
    console.log("  pełny  zewn.  |  FRONT    BOK    TYŁ");
    for (const [pelny, zewnetrzny] of PROGI) {
      const front = klas.filter((p) => p.kat < pelny).length;
      const bok = klas.filter((p) => p.kat >= pelny && p.kat < zewnetrzny).length;
      const tyl = nk - front - bok;
      const dzis = pelny === 60 && zewnetrzny === 100 ? "  ← dziś" : "";
      console.log(
        `  ${String(pelny).padStart(5)}  ${String(zewnetrzny).padStart(5)}  |  ` +
          `${pct(front, nk).padStart(6)} ${pct(bok, nk).padStart(6)} ${pct(tyl, nk).padStart(6)}${dzis}`,
      );
    }
    console.log(
      "  ⚠ Liczone na ciosach Z KIERUNKIEM. Ciosy bez kierunku są nieblokowalne\n" +
        "    niezależnie od progów i stoją w linijce wyżej.",
    );

    // ── ⭐ Test zapisanej tezy o własnym zobowiązaniu ──────────────────────
    // `docs/systemy/shields.md` §2.2: „tarcza jest odpowiedzią na twój własny
    // root". Jeśli to prawda, ciosy przyjmowane W POZIE ATAKU powinny być
    // WYRAŹNIE bardziej czołowe niż pozostałe — bo wtedy `guardDir` patrzy
    // w cel. Jeśli różnicy nie ma, teza jest ozdobą, nie mechaniką.
    const wPozie = klas.filter((p) => p.wPozie);
    const poza = klas.filter((p) => !p.wPozie);
    console.log('\nZobowiązanie własne (teza: „tarcza jest odpowiedzią na twój root"):');
    console.log(`  w pozie ataku   n=${String(wPozie.length).padStart(5)}  mediana ${mediana(wPozie)}°`);
    console.log(`  poza pozą       n=${String(poza.length).padStart(5)}  mediana ${mediana(poza)}°`);

    const wRuchu = klas.filter((p) => p.wRuchu);
    const wMiejscu = klas.filter((p) => !p.wRuchu);
    console.log("\nRuch:");
    console.log(`  w marszu        n=${String(wRuchu.length).padStart(5)}  mediana ${mediana(wRuchu)}°`);
    console.log(`  w miejscu       n=${String(wMiejscu.length).padStart(5)}  mediana ${mediana(wMiejscu)}°`);

    // ── Werdykty, dla kontroli z benchmarkiem ─────────────────────────────
    const wg: Record<string, number> = {};
    for (const p of this.probki) wg[p.outcome] = (wg[p.outcome] ?? 0) + 1;
    console.log("\nWerdykty:", wg);

    console.log(
      "\n⚠ To jest POMIAR, nie decyzja. Wynik wchodzi do `docs/tarcze_checkpoint.md`\n" +
        "  jako materiał do `B3`, a nie jako wybór progów.",
    );
  }
}

function pct(ile: number, z: number): string {
  return z > 0 ? `${((ile / z) * 100).toFixed(1)}%` : "—";
}

function mediana(p: Probka[]): string {
  if (p.length === 0) return "—";
  const s = p.map((x) => x.kat).sort((a, b) => a - b);
  const m = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  return m.toFixed(1);
}

/** Singleton — musi przeżyć `Player` i restart sceny (portale przebudowują
 *  scenę, a pomiar ma trwać przez całą sesję grania). */
export const GuardStats = new GuardStatsProbe();
