import Phaser from "phaser";
import { GameEvents, EVENT } from "../core/EventBus";
import { Abilities, getAbility, abilityIconKey, type AbilityId } from "../core/Abilities";
import { isAimable } from "../core/AbilitySpec";
import { ABILITY_AIM } from "../config/GameConfig";
import { UI, textStyle, uiW, uiH, uiScale } from "../core/theme";
import { floatingText } from "../core/Fx";
import { Settings } from "../core/Settings";
import { CoachMark } from "./CoachMark";
import { hitCircle, slotOf, visualOf, warnIfOverflow } from "./ControlLayout";

/**
 * Trwająca sesja celowania. `null` = nikt nie celuje.
 *
 * ⚠ **`pointerId` jest tu po to samo, co w `VirtualJoystick`**: ruch i
 * puszczenie czyta się z listenerów SCENY, nie z obiektu przycisku, bo palec
 * niemal natychmiast z niego zjeżdża. Bez filtra po id drugi palec (joystick)
 * przestawiałby cudze celowanie.
 */
interface AimSession {
  id: AbilityId;
  pointerId: number;
  /** Środek przycisku w przestrzeni UI — kotwica, od której liczy się delta. */
  centre: { x: number; y: number };
  /**
   * Czy palec przekroczył już `deadzonePx`.
   *
   * ⚠ **Zatrzaskowe.** Po przekroczeniu kierunek zostaje analogowy nawet gdy
   * palec wróci do środka — powrót do zwrotu postaci w połowie gestu czytałby
   * się jak zerwanie celowania.
   */
  dragged: boolean;
  /** Ostatni wysłany kierunek, albo `null` dopóki to jeszcze tapnięcie. */
  dir: { x: number; y: number } | null;
  /** Czy palec stoi nad strefą anulowania (i już był przeciągnięty). */
  overCancel: boolean;
  /**
   * ⭐ **Sesja UZBROJONA** — tryb „dotknij, potem cel" (`Settings.aimMode =
   * "tap"`, 2026-10-14). Nie śledzi palca (`pointerId` = −1, więc ruch
   * i puszczenie jej nie dotyczą); czeka na dotknięcie świata (warstwa
   * `catcher`) albo na ponowne dotknięcie tego samego przycisku (anuluje).
   */
  armed: boolean;
}

interface AbilityWidget {
  id: AbilityId;
  /**
   * Ostatnio NARYSOWANY ułamek cooldownu, zaokrąglony do kroku widocznego na
   * ekranie.
   *
   * ⚠ Istnieje dla wydajności i to nie jest mikrooptymalizacja. `update()` leci
   * 60 razy na sekundę, a wycinka kołowa (`slice` + `fillPath`) jest za każdym
   * razem **tesselowana od nowa** — dla czterech przycisków, także wtedy, gdy
   * żaden nie stygnie i nie ma czego rysować. `-1` = „jeszcze nic nie
   * narysowano", żeby pierwsza klatka zawsze przeszła.
   */
  drawnRatio: number;
  /** Który SLOT paska, nie który z kolei przycisk — kąt na łuku wybiera się
   *  tym, więc pusty slot 0 nie może przesunąć slotu 1 pod kciukiem. */
  slot: number;
  container: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Arc;
  icon: Phaser.GameObjects.Image;
  /**
   * Ciemna wycinka kołowa, kurcząca się zgodnie z ruchem wskazówek zegara
   * w miarę ładowania.
   *
   * ⚠ **Promieniście, nie spływem w dół — i to jest wymuszone kształtem.**
   * Prostokątna zasłona wpisana w koło wystaje rogami (przy 76 j. cięciwa jest
   * węższa od boku prostokąta na większości wysokości), a maskowanie jej
   * `GeometryMask` oznaczałoby cztery maski żyjące w przestrzeni EKRANU, do
   * odświeżania przy każdej zmianie rozmiaru i do ręcznego niszczenia —
   * pułapka opisana w `src/ui/CLAUDE.md`. `Graphics` przerysowywany w `update`
   * nie ma żadnego z tych problemów.
   *
   * ⚠ Odstępstwo od `BuffBar`, świadome: tam kafle są kwadratowe i zostają,
   * bo to rząd INFORMACYJNY w prawym górnym rogu, a nie cel kciuka. Wspólne
   * zostaje to, co niesie znaczenie — ciemnienie, liczba sekund i wygaszenie
   * ikony.
   */
  cover: Phaser.GameObjects.Graphics;
  cdText: Phaser.GameObjects.Text;
  /**
   * Znak ✕ rysowany na przycisku PODCZAS celowania — „puść tutaj, żeby wyjść".
   *
   * ⚠ **Zapala się dopiero po przekroczeniu deadzone**, bo dopiero wtedy coś
   * znaczy: przed przeciągnięciem puszczenie w tym samym miejscu jest szybkim
   * tapnięciem, czyli ciosem. Pokazywanie ✕ od `pointerdown` obiecywałoby
   * anulowanie tam, gdzie naprawdę czeka cios.
   */
  cancelMark: Phaser.GameObjects.Graphics;
}

/**
 * Action bar for unlocked combat abilities.
 *
 * ── Łuk, nie kolumna ──────────────────────────────────────────────────────
 * `VirtualJoystick` zgłasza się po każde dotknięcie LEWEJ połowy ekranu, więc
 * każda kontrolka bojowa musi mieszkać po prawej. Do 2026-08-21 pasek stał
 * pionową kolumną nad quick slotem; przy czwartym i piątym slocie kolumna
 * wychodziła poza zasięg kciuka (**60 mm dla piątego**, przy zasięgu
 * funkcjonalnym ~55 mm) i nachodziła na pasek buffów. Teraz sloty leżą na
 * łuku o stałym promieniu wokół przycisku ataku — **wszystkie 40–44 mm** —
 * bo łuk jest jedynym kształtem, w którym przyciski są RÓWNO oddalone od
 * kciuka. Pomiar i pełne uzasadnienie: `HUD_LAYOUT` w `GameConfig.ts`.
 *
 * ⚠ **Slot ma STAŁY kąt.** Umiejętność w slocie 2 stoi w tym samym miejscu,
 * gdy nosisz dwie i gdy nosisz cztery — nauka trzeciej nie przestawia dwóch
 * pierwszych pod kciukiem. Dlatego układ NIE centruje zajętych slotów na łuku.
 *
 * ⚠ **Kółka, nie kafle.** Świat jest z kwadratowych kafli, więc kwadratowa
 * ramka HUD-u konkuruje z nim kształtem zamiast się odcinać. Kwadraty zostają
 * tam, gdzie znaczą „kafel siatki" — w plecaku i na manekinie.
 *
 * Odliczanie: ciemna wycinka kołowa + sekundy + wygaszenie ikony. Z `BuffBar`
 * wspólne zostaje to, co niesie ZNACZENIE (ciemnienie, liczba, wygaszenie);
 * kształt zasłony się rozjechał i powód stoi przy polu `cover`.
 */
export class AbilityBar {
  private widgets: AbilityWidget[] = [];
  /** Jedna sesja naraz — dwa palce na dwóch umiejętnościach nie mają sensu,
   *  a przy dwóch aktywnych pointerach drugi należy do joysticka. */
  private aim: AimSession | null = null;

  /** Średnica rysowanego kółka; pole dotykowe bierze `hitCircle` z `cellOf`. */
  private readonly visual = visualOf("ability");
  /**
   * ⭐ **Łapacz dotknięcia świata dla sesji uzbrojonej** — przezroczysty
   * prostokąt na cały ekran, POD przyciskami HUD-u (głębokość 999 < 1000).
   *
   * ⚠⚠ **To jest rozwiązanie pułapki (a) z `docs/odlozone.md` §3**: drugie
   * dotknięcie na LEWEJ połowie trafiałoby w drążek, bo `VirtualJoystick`
   * bierze każde dotknięcie lewej połowy. Łapacz jest obiektem interaktywnym
   * nakładki, więc lokalny test trafienia drążka go widzi i drążek nie
   * startuje — a świat nie zobaczy tego wskaźnika wcale (sito 1, `input.md`
   * §4), więc tapnięcie we wroga nie przestawia blokady celu. Trzymany już
   * drążek prowadzi dalej (jego sesja żyje na listenerach sceny).
   */
  private readonly catcher: Phaser.GameObjects.Rectangle;

  constructor(private readonly scene: Phaser.Scene) {
    this.catcher = scene.add
      .rectangle(0, 0, 10, 10, 0x000000, 0)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(999)
      .setVisible(false)
      .setInteractive();
    this.catcher.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.pointAt(p);
    });
    // Zmiana trybu w ustawieniach w trakcie uzbrojenia — sesja ginie, bo
    // przestała pasować do tego, co gracz właśnie wybrał.
    GameEvents.on(EVENT.settingsChanged, this.cancelAim, this);
    GameEvents.on(EVENT.abilitiesChanged, this.rebuild, this);
    GameEvents.on(EVENT.abilitiesUnlocked, this.announce, this);
    GameEvents.on(EVENT.xpChanged, this.rebuild, this);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    // ⚠ Ruch i puszczenie ze SCENY, nie z przycisku — patrz `AimSession`.
    // `UP_OUTSIDE` osobno, bo puszczenie poza płótnem nie emituje `UP`
    // i sesja zostałaby otwarta na zawsze (ta sama para, co w joysticku).
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onAimMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onAimUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onAimUp, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.settingsChanged, this.cancelAim, this);
      GameEvents.off(EVENT.abilitiesChanged, this.rebuild, this);
      GameEvents.off(EVENT.abilitiesUnlocked, this.announce, this);
      GameEvents.off(EVENT.xpChanged, this.rebuild, this);
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
      scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onAimMove, this);
      scene.input.off(Phaser.Input.Events.POINTER_UP, this.onAimUp, this);
      scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onAimUp, this);
      // Scena znika w trakcie celowania — sesja musi umrzeć razem z nią,
      // inaczej `GameScene` zostaje z otwartym podglądem i bez commitu.
      this.cancelAim();
    });

    // Klawisze 1..N to SLOTY, nie kolejność odblokowania. Gracz przekłada
    // umiejętności między slotami, więc klawisz musi znaczyć „to, co widzę na
    // trzecim przycisku", a nie „trzecia rzecz, jakiej się nauczyłem".
    scene.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1) return;
      const id = Abilities.slotted()[n - 1];
      if (id) this.request(id);
    });

    this.rebuild();
  }

  /**
   * Jeden przycisk na ZAJĘTY slot.
   *
   * ⚠ Pasek pokazuje **układ**, a nie wszystko, co gracz umie: umiejętności
   * jest więcej niż slotów (`ABILITY_SLOTS`), a wybór, co nosić, robi się w
   * panelu postaci. Puste sloty nie rysują się wcale — pusty kafel obiecywałby,
   * że coś się tam samo pojawi.
   */
  private rebuild(): void {
    const slotted = Abilities.slotted();
    warnIfOverflow("ability", slotted.length);
    // Pary (slot, id) dla ZAJĘTYCH slotów. Indeks slotu jedzie dalej, bo to on
    // wybiera kąt na łuku — kolejność w tej tablicy nie znaczy nic.
    const live: { slot: number; id: AbilityId }[] = [];
    slotted.forEach((id, slot) => {
      if (id) live.push({ slot, id });
    });

    const same =
      live.length === this.widgets.length &&
      live.every((e, i) => this.widgets[i].id === e.id && this.widgets[i].slot === e.slot);
    if (same) {
      this.layout();
      return; // nothing structural changed; cooldowns are handled in update()
    }

    for (const w of this.widgets) w.container.destroy(true);
    this.widgets = [];

    for (const { slot, id } of live) {
      const def = getAbility(id);
      const c = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);

      // Trafienie osobnym, niewidzialnym kołem o PEŁNYM polu komórki: grafika
      // może zejść poniżej (patrz `HUD_LAYOUT.visual`), cel kciuka nigdy.
      const hit = hitCircle(this.scene, "ability", slot);
      const frame = this.scene.add
        .circle(0, 0, this.visual / 2, UI.slotBg, 0.8)
        .setStrokeStyle(2, def.color, 0.9);
      // Kwadratowa ikona wpisana w koło musi zejść poniżej średnicy, inaczej
      // jej rogi wychodzą poza obrys.
      const icon = this.scene.add
        .image(0, 0, abilityIconKey(id))
        .setDisplaySize(this.visual * 0.62, this.visual * 0.62);
      const cover = this.scene.add.graphics();
      const cancelMark = this.scene.add.graphics().setVisible(false);
      const cdText = this.scene.add
        .text(0, 0, "", textStyle({ fontSize: "15px", color: UI.white, fontStyle: "bold", stroke: "#000000", strokeThickness: 4 }))
        .setOrigin(0.5);

      hit.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation(); // don't let the joystick claim this touch
        // ⚠ Umiejętność CELOWANA nie odpala się na naciśnięciu — otwiera sesję.
        // Koszt i cooldown płaci dopiero commit, więc samo dotknięcie (i jego
        // porzucenie) jest darmowe. Reszta paska działa jak dotąd.
        if (!isAimable(id)) this.request(id);
        else if (Settings.aimMode === "tap") this.toggleArmed(id, c);
        else this.beginAim(id, p, c);
      });

      // ✕ na wierzchu wszystkiego — ma przykryć ikonę, nie chować się pod nią.
      c.add([hit, frame, icon, cover, cdText, cancelMark]);
      // -1 = jeszcze nic nie narysowano, wiec pierwsza klatka zawsze maluje.
      this.widgets.push({ id, slot, drawnRatio: -1, container: c, frame, icon, cover, cdText, cancelMark });
    }
    this.layout();
  }

  /** Ask gameplay to cast. The scene validates and owns the effect — the bar
   *  never decides whether something is allowed, only shows why not. */
  private request(id: AbilityId): void {
    if (!this.readyOrSay(id)) return;
    GameEvents.emit(EVENT.abilityRequested, { id });
    this.press(id);
  }

  /** Bramka cooldownu wspólna dla obu ścieżek. `false` = powiedziano graczowi,
   *  ile zostało, i nic więcej się nie dzieje. */
  private readyOrSay(id: AbilityId): boolean {
    const remaining = Abilities.cooldownRemaining(id, this.scene.time.now);
    if (remaining > 0) {
      this.say(`${getAbility(id).name}: ${Math.ceil(remaining / 1000)}s`);
      return false;
    }
    return true;
  }

  private press(id: AbilityId): void {
    const w = this.widgets.find((x) => x.id === id);
    if (w) {
      this.scene.tweens.add({ targets: w.container, scale: 0.87, duration: 70, yoyo: true, ease: "Quad.easeOut" });
    }
  }

  /**
   * Naciśnięcie przycisku umiejętności celowanej: otwórz sesję i **od razu**
   * pokaż podgląd.
   *
   * ⚠ **Bez progu czasowego.** Podgląd pojawia się na `pointerdown`, a o tym,
   * czy to było tapnięcie czy przeciągnięcie, rozstrzyga dopiero dystans przy
   * puszczeniu. Rozpoznawanie hold-a zegarem opóźniałoby każde szybkie użycie
   * o 200–300 ms — patrz `ABILITY_AIM`.
   */
  private beginAim(id: AbilityId, p: Phaser.Input.Pointer, container: Phaser.GameObjects.Container): void {
    if (this.aim) return; // jedna sesja naraz
    if (!this.readyOrSay(id)) return;
    this.aim = {
      id,
      pointerId: p.id,
      centre: { x: container.x, y: container.y },
      dragged: false,
      dir: null,
      overCancel: false,
      armed: false,
    };
    GameEvents.emit(EVENT.abilityAimStarted, { id });
  }

  /**
   * ⭐ **Tryb „dotknij, potem cel"**: dotknięcie przycisku UZBRAJA celowanie
   * (podgląd w świecie od razu, ✕ na przycisku), ponowne dotknięcie tego
   * samego przycisku je ZDEJMUJE, a dotknięcie innego celowanego —
   * przekłada uzbrojenie na tamten.
   * ⚠ Naciśnięcie dalej nic nie kosztuje — płaci dopiero wskazanie celu.
   */
  private toggleArmed(id: AbilityId, container: Phaser.GameObjects.Container): void {
    const a = this.aim;
    if (a && !a.armed) return; // trwa sesja przeciągania — jedna naraz
    if (a?.armed) {
      this.cancelAim();
      if (a.id === id) return;
    }
    if (!this.readyOrSay(id)) return;
    this.aim = {
      id,
      pointerId: -1,
      centre: { x: container.x, y: container.y },
      dragged: false,
      dir: null,
      overCancel: false,
      armed: true,
    };
    GameEvents.emit(EVENT.abilityAimStarted, { id });
    this.drawCancelMark(id, false);
    this.catcher.setSize(uiW(this.scene), uiH(this.scene)).setVisible(true);
    this.catcher.input?.hitArea.setTo(0, 0, uiW(this.scene), uiH(this.scene));
    CoachMark.once(
      "aim-tap",
      () => (this.aim?.armed ? { x: container.x, y: container.y } : null),
      "Dotknij wroga albo miejsca w świecie. Ten sam przycisk — anuluj.",
      "left",
    );
  }

  /** Dotknięcie świata przy sesji uzbrojonej — punkt jedzie do sceny gry. */
  private pointAt(p: Phaser.Input.Pointer): void {
    const a = this.aim;
    if (!a?.armed) return;
    this.aim = null;
    this.hideCancelMark(a.id);
    // ⚠⚠ Łapacz znika dopiero w NASTĘPNEJ klatce. Phaser podaje zdarzenie
    //   obiektu PRZED poziomem sceny, a drążek na poziomie sceny pyta
    //   `hitTestPointer` — schowany od razu łapacz nie zostałby trafiony i ten
    //   sam dotyk postawiłby jeszcze bazę drążka (lewa połowa ekranu).
    this.scene.time.delayedCall(0, () => {
      if (!this.aim?.armed) this.catcher.setVisible(false);
    });
    GameEvents.emit(EVENT.abilityAimPointed, { screenX: p.x, screenY: p.y });
    this.press(a.id);
  }

  /**
   * Przelicz pozycję wskaźnika na przestrzeń, w której leżą przyciski.
   * ⚠ To samo, co robi `VirtualJoystick.px` i z tego samego powodu:
   * `pointer.x/y` są w pikselach EKRANU, a kamera UI stoi na zoomie.
   */
  private px(v: number): number {
    return v / uiScale();
  }

  private onAimMove(p: Phaser.Input.Pointer): void {
    const a = this.aim;
    if (!a || p.id !== a.pointerId) return;
    const dx = this.px(p.x) - a.centre.x;
    const dy = this.px(p.y) - a.centre.y;
    const len = Math.hypot(dx, dy);
    if (!a.dragged) {
      if (len < ABILITY_AIM.deadzonePx) return; // wciąż tapnięcie
      a.dragged = true;
      this.drawCancelMark(a.id, false);
    }
    // ⚠ Strefa anulowania liczy się TYLKO po przeciągnięciu — inaczej zjadłaby
    // szybkie tapnięcie, które puszcza palec dokładnie tutaj.
    const nadAnuluj = len <= ABILITY_AIM.cancelRadiusPx;
    if (nadAnuluj !== a.overCancel) {
      a.overCancel = nadAnuluj;
      this.drawCancelMark(a.id, nadAnuluj);
    }
    // Zerowa długość po zatrzaśnięciu `dragged` (palec dokładnie na środku)
    // nie ma kierunku — zostawiamy ostatni, zamiast dzielić przez zero.
    if (len < 0.0001) {
      GameEvents.emit(EVENT.abilityAimMoved, { dirX: a.dir?.x ?? 0, dirY: a.dir?.y ?? 0, overCancel: a.overCancel });
      return;
    }
    a.dir = { x: dx / len, y: dy / len };
    GameEvents.emit(EVENT.abilityAimMoved, { dirX: a.dir.x, dirY: a.dir.y, overCancel: a.overCancel });
  }

  /**
   * Puszczenie palca — **commit albo ANULOWANIE**.
   *
   * ⚠ **O anulowaniu decyduje dopiero ten moment**, nie przejechanie przez
   * środek: palec wędrujący z lewej na prawą stronę przechodzi przez strefę
   * i nie ma prawa nic przerwać.
   *
   * `dir === null` (nigdy nie przeciągnięto) znaczy „tapnięcie", a scena czyta
   * to jako „w aktualny zwrot postaci".
   */
  private onAimUp(p: Phaser.Input.Pointer): void {
    const a = this.aim;
    if (!a || p.id !== a.pointerId) return;
    this.aim = null;
    this.hideCancelMark(a.id);
    if (a.dragged && a.overCancel) {
      // Wyjście z gestu: zero kosztu, zero cooldownu, bez błysku przycisku —
      // nic się nie stało i przycisk nie ma udawać, że się stało.
      GameEvents.emit(EVENT.abilityAimCancelled);
      return;
    }
    GameEvents.emit(EVENT.abilityAimCommitted, {
      dirX: a.dir ? a.dir.x : null,
      dirY: a.dir ? a.dir.y : null,
    });
    this.press(a.id);
  }

  /** Zerwij sesję bez kosztu i bez cooldownu. */
  private cancelAim(): void {
    if (!this.aim) return;
    const id = this.aim.id;
    this.aim = null;
    this.hideCancelMark(id);
    this.catcher.setVisible(false);
    GameEvents.emit(EVENT.abilityAimCancelled);
  }

  /**
   * Narysuj ✕ na przycisku. `hot` = palec jest nad nim, więc puszczenie
   * ANULUJE — i to jest jedyna różnica, jaką ten znak niesie.
   */
  private drawCancelMark(id: AbilityId, hot: boolean): void {
    const w = this.widgets.find((x) => x.id === id);
    if (!w) return;
    const cfg = ABILITY_AIM.preview;
    const r = this.visual * cfg.cancelArmFrac;
    const g = w.cancelMark;
    g.clear();
    g.setVisible(true);
    // Podkład przyciemniający: bez niego ✕ ginie na ikonie umiejętności,
    // a ma być czytelny pod kciukiem, czyli w połowie zasłonięty.
    g.fillStyle(0x000000, hot ? 0.55 : 0.35);
    g.fillCircle(0, 0, this.visual / 2);
    g.lineStyle(cfg.cancelWidth, hot ? cfg.cancelHotColor : cfg.cancelColor, hot ? 1 : 0.8);
    g.beginPath();
    g.moveTo(-r, -r); g.lineTo(r, r);
    g.moveTo(r, -r); g.lineTo(-r, r);
    g.strokePath();
  }

  private hideCancelMark(id: AbilityId): void {
    const w = this.widgets.find((x) => x.id === id);
    if (!w) return;
    w.cancelMark.clear();
    w.cancelMark.setVisible(false);
  }

  private say(text: string): void {
    const w = this.widgets[0];
    floatingText(this.scene, {
      x: w ? w.container.x : uiW(this.scene) - 84,
      y: (w ? w.container.y : uiH(this.scene) - 200) - 34,
      text,
      color: "#ff9d3b",
      rise: 16,
      duration: 700,
      depth: 1500,
    });
  }

  /** Centre banner + floater when a level-up grants something new. */
  private announce(p: { ids: AbilityId[] }): void {
    // ⚠ Każda w WŁASNYM wierszu: skok o kilka poziomów (oddanie zadania
    //   w rozmowie, `dev`) odblokowuje kilka naraz, a jeden punkt startu
    //   zlepiał napisy w nieczytelną plamę (render 1:1, 2026-10-13).
    p.ids.forEach((id, i) => {
      floatingText(this.scene, {
        x: uiW(this.scene) / 2,
        y: uiH(this.scene) / 2 + 40 + i * 30,
        text: `NOWA ZDOLNOŚĆ: ${getAbility(id).name}`,
        color: "#88ddff",
        fontSize: 18,
        bold: true,
        rise: 30,
        duration: 2200,
        depth: 1500,
      });
    });
  }

  /** Per-frame cooldown sweep, driven by UIScene like the buff bar. */
  update(): void {
    if (this.widgets.length === 0) return;
    const now = this.scene.time.now;
    for (const w of this.widgets) {
      const def = getAbility(w.id);
      const remaining = Abilities.cooldownRemaining(w.id, now);
      const ratio = Phaser.Math.Clamp(remaining / (def.cooldown * 1000), 0, 1);

      // ⚠ **Nic się nie zmieniło na EKRANIE → nie rysuj.**
      //
      // Zysk siedzi w stanie IDLE, nie w kwantyzacji: gdy nic nie stygnie —
      // czyli przez większość gry — cała pętla kosztuje jedno porównanie zamiast
      // czterech tesselacji łuku (`slice` + `fillPath`), czterech `setStrokeStyle`
      // i czterech `setText`, sześćdziesiąt razy na sekundę.
      //
      // ⚠ **Krok jest celowo DROBNY (0,5°), żeby nic nie kosztował na wyglądzie.**
      // Pierwsza wersja miała 1/120 obwodu i była błędem: promień to 38 j., czyli
      // obwód ~239 j., a kamera UI powiększa do 1,75× — krawędź skakałaby więc
      // o ~3,5 px co siedem klatek. Oszczędność w stanie, który i tak trwa
      // sekundy, nie jest warta widocznego skakania.
      // ⚠ **`Math.max(1, …)` przy stygnięciu — bez tego licznik ZAMARZA na
      // „1" (naprawione 2026-08-23, zgłoszone z rozgrywki).**
      //
      // Klucz deduplikacji musi opisywać WSZYSTKO, co ta pętla rysuje, a
      // rysuje też tekst, alfę ikony i jasność ramki. Goły `round(ratio*720)`
      // zlewał dwa stany, które wyglądają INACZEJ: „stygnie, zostały 3 ms"
      // i „gotowa" dają oba krok 0. Przebieg był taki: ostatnia klatka
      // stygnięcia trafiała w okno `ratio*720 < 0,5`, rysowała się z tekstem
      // `ceil(3/1000)` = **1** i wygaszoną ikoną, zapisywała `drawnRatio = 0`
      // — a klatka, w której cooldown faktycznie mijał, miała ten sam klucz
      // i wypadała na `continue`. Przycisk był już klikalny, ale wyglądał na
      // stygnący do następnego użycia.
      //
      // ⚠ Okno ma szerokość `0,000694 × cooldown`, więc wada ROSŁA z długością
      // cooldownu — zmierzone: Szerokie cięcie (5 s) 21% użyć, Wir ostrzy 38%,
      // Szarża 59%, **Okrzyk (24 s) 100%**. Dlatego wyglądała na losową przy
      // krótkich umiejętnościach i na trwałą przy długich.
      //
      // Podłoga dotyczy WYŁĄCZNIE klucza; łuk rysuje się dalej z prawdziwego
      // `ratio`, więc nic się nie zmienia na wyglądzie.
      const krok = remaining > 0 ? Math.max(1, Math.round(ratio * 720)) : 0;
      if (krok === w.drawnRatio) continue;
      w.drawnRatio = krok;

      // Wycinka od GÓRY zgodnie z ruchem wskazówek — kierunek jest ten sam, co
      // w każdej grze z cooldownami, więc niesie znaczenie bez tłumaczenia.
      w.cover.clear();
      if (ratio > 0) {
        const start = Phaser.Math.DegToRad(-90);
        w.cover.fillStyle(0x000000, 0.6);
        w.cover.slice(0, 0, this.visual / 2, start, start + Math.PI * 2 * ratio, false);
        w.cover.fillPath();
      }
      w.cdText.setText(remaining > 0 ? `${Math.ceil(remaining / 1000)}` : "");
      w.icon.setAlpha(remaining > 0 ? 0.45 : 1);
      w.frame.setStrokeStyle(2, def.color, remaining > 0 ? 0.4 : 0.9);
    }
  }

  /**
   * Każdy widżet na kąt SWOJEGO slotu — patrz nagłówek klasy i `ControlLayout`.
   * Slot bez kąta (pasek urósł, a pierścień nie) po prostu się nie rysuje;
   * ostrzeżenie o tym poszło już z `rebuild`, więc tu jest cicho, bo `layout`
   * leci także przy każdej zmianie rozmiaru okna.
   */
  private layout(): void {
    for (const w of this.widgets) {
      const p = slotOf(this.scene, "ability", w.slot);
      w.container.setVisible(!!p);
      if (p) w.container.setPosition(p.x, p.y);
    }
  }
}
