import Phaser from "phaser";
import { GameEvents, EVENT } from "../core/EventBus";
import { PROFICIENCY, WEAPON_FAMILY } from "../config/GameConfig";
import { floatingText } from "../core/Fx";
import { NPCS } from "../core/Npcs";
import { UI } from "../core/theme";
import type { WeaponFamily } from "../core/Equipment";

/**
 * **„+1 Władanie bronią: Miecz" — feedback za zdobyty punkt biegłości**, oraz
 * **powiadomienie o suficie `P`**, przy którym praktyka przepada.
 *
 * ⚠ **To drugie jest OBOWIĄZKOWE, nie ozdobne** (`bieglosc_checkpoint.md`
 * §34.3/§34.7, kontrakt §34.10 poz. 12): praktyka zdobyta na suficie **nie jest
 * bankowana**, więc trening bez wizyty u trenera jest czasem straconym — a bez
 * tego napisu jedynym nośnikiem tej informacji są trzy panele, które gracz
 * musiałby otworzyć z własnej inicjatywy, nie mając powodu.
 *
 * ⚠ **Dławienie mieszka TUTAJ, nie w `WeaponProficiency`** — zdarzenie
 * `weaponCapReached` leci z każdego zmarnowanego ciosu, bo tamten singleton wie
 * tylko „ten zamach przepadł". „Jak dawno mówiliśmy o tym ostatnio" to pytanie
 * o czas SCENY i odpowiada na nie odbiorca, który ten czas ma.
 *
 * ⚠ **Napis „+1" odpala się WYŁĄCZNIE przy realnym punkcie** — nasłuchuje
 * `weaponPracticeGained`, a nie `weaponProficiencyChanged`. To drugie leci
 * także przy wczytaniu zapisu, przy „Nowej grze" i przy ustawieniu wartości
 * narzędziem playtestowym; komunikat o zdobyciu byłby wtedy nieprawdą.
 * Praktyka, która nie starczyła na punkt, **nie mówi nic** — punkt jest atomem
 * tego systemu (§19), więc jest też jedyną rzeczą, którą warto ogłaszać.
 *
 * ⚠ **Nazwa rodziny idzie z `WEAPON_FAMILY[…].label`, nie z własnego słownika**
 * — tego samego napisu używają panel BROŃ i panel trenera, więc gracz widzi
 * wszędzie jedno słowo. Drugi słownik rozjechałby się przy pierwszej nowej
 * rodzinie i nikt by tego nie zauważył.
 *
 * ⚠ **Jedzie na istniejącym `Fx.floatingText`** — tym samym, którym mówią
 * obrażenia, złoto i zioła. Zanikanie, unoszenie się i styl tekstu UI są więc
 * z definicji takie same jak w reszcie gry; ten plik dokłada wyłącznie UKŁAD.
 *
 * ── Układ ────────────────────────────────────────────────────────────────
 * Kolumna pod blokiem HP / XP / wysiłku, w tej samej osi co paski.
 *
 * ⚠ **Stałe `y`, nie „pod ostatnim widocznym elementem".** Nad tym miejscem
 * stoją rzeczy, które ZNIKAJĄ i się przesuwają: złoto, ukrywany licznik
 * punktów rozwoju i śledzone zadanie o zmiennej wysokości. Kotwica do nich
 * sprawiałaby, że komunikat skacze — ta sama decyzja i ten sam powód, co
 * w `QuestTracker`.
 *
 * ⚠ **Komunikaty nie nakładają się:** każdy dostaje SLOT w krótkim stosie
 * i zwalnia go dopiero, gdy zniknie (`floatingText.onDone`). Przy pełnym stosie
 * najstarszy slot jest przejmowany — jego napis dokańcza własne zanikanie
 * o piętro wyżej. Przy tempie manekina (punkt co kilkadziesiąt zamachów) to
 * sytuacja awaryjna, ale narzędzie deweloperskie potrafi wysypać serię.
 *
 * ⚠ **Nic tu nie jest interaktywne i nic nie pauzuje gry.** To zwykłe napisy
 * na warstwie HUD-u, bez pola dotykowego — walka i sterowanie idą pod spodem
 * bez zmian.
 */
export class PracticeToast {
  /** Oś pionowa pasków HUD-u: `pad 16 + barWidth 200 / 2`. */
  private readonly x = 116;
  /** Pod śledzonym zadaniem (`QuestTracker` stoi na 116 i rośnie w dół). */
  private readonly y = 196;
  private readonly lineH = 18;
  /** Ile komunikatów naraz. Czwarty i dalsze przejmują najstarszy slot. */
  private readonly slotCount = 4;

  /**
   * Znacznik zajętości slotu. `0` = wolny; inaczej numer napisu, który go
   * trzyma.
   *
   * ⚠ **Numer, nie `boolean`, i to nie jest ozdoba.** Slot przejęty przez nowy
   * komunikat dostaje nowy numer, więc `onDone` STAREGO napisu (który zniknie
   * chwilę później) nie zwolni cudzego miejsca. Z flagą logiczną ten wyścig
   * kończyłby się dwoma napisami w jednym wierszu.
   */
  private held: number[] = [];
  /** Sloty w kolejności zajmowania — pierwszy jest najstarszy. */
  private order: number[] = [];
  private nextToken = 1;

  /**
   * Jak rzadko przypominać, że praktyka przepada (ms).
   *
   * ⚠ **To jest próg CZYTELNOŚCI, nie parametr balansu** — nie ma go w
   * checkpointcie i nie ma czego stroić: sam moment dojścia do sufitu
   * (`reached`) przechodzi ZAWSZE, a to dotyczy wyłącznie przypominania komuś,
   * kto bije dalej. Dwadzieścia sekund to kilkanaście–kilkadziesiąt zamachów,
   * czyli rzadziej niż raz na walkę.
   */
  private readonly capReminderMs = 20_000;
  /** Czas sceny ostatniego komunikatu o suficie, per rodzina. */
  private lastCapNoticeAt = new Map<WeaponFamily, number>();

  constructor(private readonly scene: Phaser.Scene) {
    this.held = new Array(this.slotCount).fill(0);

    GameEvents.on(EVENT.weaponPracticeGained, this.onGained, this);
    GameEvents.on(EVENT.weaponCapReached, this.onCapReached, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.weaponPracticeGained, this.onGained, this);
      GameEvents.off(EVENT.weaponCapReached, this.onCapReached, this);
    });
  }

  private onGained(p: { family: WeaponFamily; points: number }): void {
    const rodzina = WEAPON_FAMILY[p.family];
    if (!rodzina || !(p.points > 0)) return;

    const { slot, token } = this.claimSlot();

    floatingText(this.scene, {
      x: this.x,
      y: this.y + slot * this.lineH,
      text: `+${p.points} Władanie bronią: ${rodzina.label}`,
      color: UI.gold,
      fontSize: 12,
      bold: true,
      // Krótkie zatrzymanie, bo to jest napis DO PRZECZYTANIA, nie liczba do
      // zerknięcia — ten sam powód, dla którego `hold` w ogóle powstało.
      // ⚠⚠ **Wydłużone 2026-09-05 po playteście: „+1 P miga i znika".**
      //   Było `hold 500 + duration 900` = **1,4 s** łącznie, z czego pełna
      //   krycie tylko przez pierwsze pół sekundy — komunikat przepadał
      //   w środku walki. Jest **2,5 s**: 1,4 s w pełnej kryciu, potem
      //   1,1 s wznoszenia z wygaszaniem.
      // ⛔ Zmienia się WYŁĄCZNIE czas i `pulse`. Pozycja, kolor, rozmiar,
      //   pogrubienie, wysokość wiersza i głębokość zostają — to jest
      //   poprawka czytelności, nie restyling.
      // ⚠ `pulse` to istniejąca opcja `floatingText` (110 ms skoku skali),
      //   nie nowa animacja i nie drugi system komunikatów.
      hold: 1400,
      rise: 14,
      duration: 1100,
      pulse: true,
      // Nad paskami HUD-u (900), pod panelami — komunikat nie ma prawa
      // przykryć otwartego ekwipunku ani rozmowy.
      depth: 905,
      onDone: () => this.release(slot, token),
    });
  }

  /**
   * **Sufit `P` — praktyka w tej rodzinie przepada** (§34.3).
   *
   * `reached` (chwila dojścia do sufitu) przechodzi ZAWSZE i mówi pełne zdanie;
   * kolejne zmarnowane ciosy dostają krótsze przypomnienie **nie częściej niż
   * raz na `capReminderMs`**, osobno dla każdej rodziny.
   */
  private onCapReached(p: { family: WeaponFamily; cap: number; reached: boolean }): void {
    const rodzina = WEAPON_FAMILY[p.family];
    if (!rodzina) return;
    const teraz = this.scene.time.now;
    if (!p.reached) {
      const ostatnio = this.lastCapNoticeAt.get(p.family);
      if (ostatnio !== undefined && teraz - ostatnio < this.capReminderMs) return;
    }
    this.lastCapNoticeAt.set(p.family, teraz);

    // ⚠ Nazwa trenera z JEDNEJ stałej (`PROFICIENCY.mastery.trainer`), nie
    // wpisana w tekst — panel trenera i wiersz „Mistrzostwo broni" czytają tę
    // samą, więc przeniesienie zakupu do innego NPC-a nie zostawi tu kłamstwa.
    const trener = NPCS[PROFICIENCY.mastery.trainer].name;
    const tekst = p.reached
      ? `${rodzina.label}: sufit biegłości ${p.cap}. Dalsza praktyka PRZEPADA — rangę kupisz u: ${trener}`
      : `${rodzina.label}: praktyka przepada — sufit ${p.cap}, ranga u: ${trener}`;

    floatingText(this.scene, {
      x: this.x,
      // ⚠ **Poza stosem „+1", pod nim — bez `claimSlot`.** Ten komunikat zawija
      // się na kilka wierszy, więc nie mieści się w jednym slocie 18 px,
      // a wpuszczony do stosu nakładałby się na napis o zdobytym punkcie —
      // który przy dojściu do sufitu leci dokładnie chwilę wcześniej.
      y: this.y + this.slotCount * this.lineH + 8,
      text: tekst,
      // Szerokość kolumny HUD-u (pasek 200 px), żeby zdanie zawinęło się
      // w tej samej osi, w której stoją paski, zamiast wyjść poza ekran.
      wrapWidth: 200,
      // ⚠ **Kolor ostrzeżenia, nie złoto.** Złoto w tej kolumnie znaczy „coś
      // przybyło"; ten komunikat mówi dokładnie odwrotną rzecz.
      color: UI.danger,
      fontSize: 12,
      bold: true,
      // Dłużej niż „+1", bo to jest instrukcja do wykonania, a nie liczba.
      hold: 1400,
      rise: 10,
      duration: 2200,
      depth: 905,
    });
  }

  /** Pierwszy wolny slot, a przy pełnym stosie — najstarszy zajęty. */
  private claimSlot(): { slot: number; token: number } {
    const wolny = this.held.indexOf(0);
    const slot = wolny >= 0 ? wolny : (this.order.shift() ?? 0);
    const token = this.nextToken++;
    this.held[slot] = token;
    this.order.push(slot);
    return { slot, token };
  }

  /** Zwolnij slot — ale tylko, jeśli nadal należy do TEGO napisu. */
  private release(slot: number, token: number): void {
    if (this.held[slot] !== token) return;
    this.held[slot] = 0;
    const i = this.order.indexOf(slot);
    if (i >= 0) this.order.splice(i, 1);
  }
}
