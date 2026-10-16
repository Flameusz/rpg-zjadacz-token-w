import Phaser from "phaser";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { BackHandler } from "./core/BackHandler";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { GameScene } from "./scenes/GameScene";
// ⚠ STATYCZNIE: dynamiczny `import()` dałby drugi graf modułów — inny rejestr
// stworzeń, inna `skalaSwiata` (zero) i pomiar z kopii, której nikt nie rysuje.
import { Creature3D } from "./render3d/Creature3D";
import { MODELE_3D } from "./config/GameConfig";
import { UIScene } from "./scenes/UIScene";
import { Progression } from "./core/Progression";
import { Inventory } from "./core/Inventory";
import { Equipment } from "./core/Equipment";
import { Quests } from "./core/Quests";
import { Skills } from "./core/Skills";
import { ArmorTraining } from "./core/ArmorTraining";
import { ShieldSkill } from "./core/ShieldSkill";
import { Dialogue } from "./core/Dialogue";
import { Gathering } from "./core/Gathering";
import { Exploration } from "./core/Exploration";
import { NPCS } from "./core/Npcs";
import { Buffs } from "./core/Buffs";
import { Abilities } from "./core/Abilities";
import { Stamina } from "./core/Stamina";
import { Defense } from "./core/Defense";
import { WeaponProficiency } from "./core/WeaponProficiency";
import { pixelRatio, cssSize } from "./core/Viewport";
import { installTextFiltering } from "./core/theme";
import { Perf } from "./core/Perf";
import { GuardStats } from "./core/GuardStats";
import { auditBodies, listBodies } from "./core/movement/BodySpec";
import { missingAssets, bootLoadFailures } from "./core/Assets";
import { mapWarnings } from "./world/TiledMap";
import { ySortedWorldFor } from "./core/YSortedWorld";
import { renderCullerFor } from "./core/RenderCuller";
import { WorldView3D } from "./render3d/WorldView3D";


/**
 * Rozmiar płótna liczony w pikselach URZĄDZENIA, nie CSS — patrz `core/Viewport.ts`
 * po całe uzasadnienie.
 *
 * ⚠ **`Scale.NONE`, a nie `RESIZE`, i to jest wymuszone, nie stylistyczne.**
 * Gałąź `RESIZE` w `ScaleManager.updateScale` **ignoruje `zoom`** i twardo
 * ustawia `canvas.width` na szerokość rodzica w pikselach CSS, więc przy niej
 * nie da się dostać płótna o rozdzielczości urządzenia. `NONE` robi dokładnie
 * to, czego trzeba: bufor = `gameSize`, rozmiar w CSS = `gameSize × zoom`.
 * Ceną jest ręczne dopięcie do okna (`fitToWindow` niżej) — w `RESIZE` robił
 * to Phaser sam.
 */
const dpr = pixelRatio();
const startSize = cssSize();

// Przed utworzeniem gry: łata prototyp `Text`, więc musi obowiązywać od
// pierwszego napisu, jaki powstanie. Patrz `installTextFiltering`.
installTextFiltering();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#2d5a27",
  // ⭐ Widok 3D (domyślny od 2026-10-06; 2D: `?widok2d`): Phaser przezroczysty,
  // pod nim płótno three.js ze światem (`render3d/WorldView3D.ts`).
  transparent: WorldView3D.wlaczony,
  pixelArt: true, // crisp nearest-neighbour scaling for pixel-art
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: Math.round(startSize.width * dpr),
    height: Math.round(startSize.height * dpr),
    zoom: 1 / dpr,
  },
  /**
   * ⚠ **DWA pointery dotykowe. Phaser domyślnie daje JEDEN, i to była realna
   * wada, nie przygotowanie na przyszłość** (2026-08-23).
   *
   * `Config.js` ustawia `input.activePointers` na 1, a `InputManager` tworzy
   * `pointers[0]` = mysz + tyle pointerów dotyku, ile wynosi ta liczba.
   * `onTouchStart` szuka pierwszego NIEAKTYWNEGO pointera i **po cichu
   * wyrzuca dotknięcie, gdy żadnego nie ma** — bez zdarzenia, bez błędu.
   *
   * Skutek przy jedynce: trzymając joystick lewym kciukiem, gracz **nie mógł
   * nacisnąć ani przycisku ataku, ani żadnej umiejętności** — drugi palec nie
   * istniał dla silnika. Na desktopie problem był niewidoczny, bo ruch idzie
   * z WASD, a klik z `mousePointer`, i dlatego przeżył do dziś.
   *
   * Dwójka pokrywa układ, na którym stoi całe sterowanie dotykowe: **lewy
   * kciuk prowadzi, prawy działa** (atak albo celowanie umiejętnością).
   * Podnoszenie wyżej wymaga powodu — trzeci równoczesny palec nie ma dziś
   * czego robić.
   */
  input: { activePointers: 2 },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 }, // top-down: no gravity
      debug: false, // set true to see collision bodies
    },
  },
  scene: [BootScene, TitleScene, GameScene, UIScene],
};

const game = new Phaser.Game(config);

/**
 * Dopnij płótno do okna. `Scale.NONE` nie robi tego samo, a okno zmienia
 * rozmiar nie tylko przy obracaniu telefonu: na Androidzie chowanie i
 * pokazywanie pasków systemowych (patrz `MainActivity.hideSystemBars`) też
 * zmienia wysokość widoku, i to już po starcie gry.
 *
 * `scale.resize` emituje `Phaser.Scale.Events.RESIZE`, czyli wszystkie widżety
 * i obie kamery przeliczają się tą samą drogą co dotąd.
 */
function fitToWindow(): void {
  const { width, height } = cssSize();
  game.scale.resize(Math.round(width * dpr), Math.round(height * dpr));
}

window.addEventListener("resize", fitToWindow);
window.addEventListener("orientationchange", fitToWindow);

/**
 * ⚠ **Jedno dopasowanie po pierwszej klatce — druga połowa naprawy `B-1`.**
 *
 * `cssSize()` gwarantuje już, że Phaser nie dostanie `0×0` (patrz
 * `core/Viewport.ts`), ale gdy zejdzie na wartość awaryjną, gra startuje
 * **1×1 px** i czeka na `resize`. A `resize` jest zdarzeniem WEJŚCIA: nie ma
 * obietnicy, że przeglądarka je wyśle tylko dlatego, że dokument policzył
 * wreszcie layout.
 *
 * `requestAnimationFrame` odpala się po pierwszym rozłożeniu strony, czyli
 * dokładnie wtedy, gdy pomiar zaczyna być prawdziwy. Kosztuje jedno wywołanie
 * i zdejmuje zależność od zdarzenia, nad którym nie mamy kontroli.
 *
 * ⛔ To NIE jest pętla ani obserwator rozmiaru — jednorazowo, bo dalej
 * wystarczają oba `addEventListener` wyżej.
 */
requestAnimationFrame(fitToWindow);

/**
 * System Back (Android hardware key / gesture).
 *
 * ⚠ **Registering this listener REPLACES the platform's own default
 * handling** — Capacitor's own docs say so, and it is why the "nothing
 * consumed it" branch has to call `App.exitApp()` explicitly rather than
 * doing nothing: doing nothing here would leave Back completely dead instead
 * of falling back to today's behavior (exit).
 *
 * `BackHandler.consume` is the one bridge into whichever modal is open right
 * now (`NpcDialog`, today) — see its own header for why a callback rather
 * than an event. Guarded to native only: the web/dev build has no hardware
 * Back button, and `@capacitor/app`'s web shim would otherwise register a
 * listener that can never fire, for nothing.
 */
if (Capacitor.isNativePlatform()) {
  App.addListener("backButton", () => {
    if (BackHandler.consume?.()) return;
    App.exitApp();
  });
}

/**
 * Dev-only console handles.
 *
 * `window.game` is the Phaser instance. `window.dev` exposes the core
 * singletons, and it exists for a specific reason: reaching them with a
 * dynamic `import()` from the console does NOT give you the running instances —
 * the page ends up with a second module graph, so `Equipment.equip(...)` typed
 * at the console mutates a copy nothing is rendering, and every reading comes
 * back stale. That has cost real debugging time twice. These are the live ones.
 *
 * Stripped from production builds by the `import.meta.env.DEV` guard.
 */
if (import.meta.env.DEV) {
  /** Uchwyt na spike postaci 3D (`dev.char3d`). Import jest DYNAMICZNY, więc
   *  three.js nie wchodzi do bundla, dopóki ktoś tego nie włączy. */
  /**
   * Żywa instancja modelu z `GameScene`.
   *
   * ⚠ Sięgamy po NIĄ, a nie tworzymy własnej — dokładnie z tego samego powodu,
   * dla którego istnieje całe `window.dev`: druga instancja to drugi model,
   * którego nikt nie rysuje, i każdy odczyt z niej byłby nieprawdziwy.
   */
  type Model3D = {
    destroy(): void;
    koszt(): unknown;
    zagrajAtak(kat?: number): void;
    ustawSlot(slot: string, w: string | false): string;
    ustawBronRecznie(w: string | false | "auto"): string;
    ustawTarczeRecznie(w: string | false | "auto"): string;
    ustawPancerzRecznie(w: string | string[] | false | "auto"): string;
    dostepne(): Record<string, string[]>;
  };
  const uchwyt3d = (): Model3D | null =>
    (game.scene.getScene("Game") as unknown as { model3d?: Model3D } | null)?.model3d ?? null;
  (window as unknown as { game: Phaser.Game }).game = game;
  (window as unknown as { dev: unknown }).dev = {
    Progression,
    Inventory,
    Equipment,
    Quests,
    Skills,
    /**
     * Trening ciężkiego pancerza (Model D, `OI-103`).
     *
     * `dev.ArmorTraining.learn()` kupuje NASTĘPNĄ rangę za punkty umiejętności
     * (1 → 2 → 3); `dev.ArmorTraining.rank` mówi, ile ich jest.
     *
     * ⚠ **Trener jeszcze go nie sprzedaje i to jest świadome** — cena w złocie
     * należy do otwartego `OI-46`, a decyzja o obciążeniu jawnie jej nie
     * zamykała. Do czasu jej rozstrzygnięcia to jest jedyna droga do rang.
     */
    ArmorTraining,
    /**
     * **Umiejętność władania tarczą** (`T-7`) — `core/ShieldSkill.ts`.
     *
     * `dev.ShieldSkill.proficiency` — ile `P` gracz ma;
     * `dev.ShieldSkill.relief` — jaki ułamek kosztu bloku zdejmuje;
     * `dev.ShieldSkill.practice(20, "solid")` — dolewa naukę jednego
     * zablokowanego ciosu o podanym ciężarze;
     * `dev.ShieldSkill.reset()` — z powrotem na `P = 0`.
     *
     * ⚠ **Rośnie z UŻYCIA, nie z punktów rozwoju** — nie ma czego kupić
     * u trenera i to jest świadome: rangi tarczy nie są tym zakresem otwierane.
     *
     * ⚠ Do zmierzenia ciężaru bloku w locie służą trzy odczyty razem:
     * `dev.Equipment.blockCapacity` (udźwig tej tarczy),
     * `dev.Equipment.blockStaminaCostFor(pkt, "solid")` (koszt za cios)
     * i `dev.ShieldSkill.relief`.
     */
    ShieldSkill,
    Dialogue,
    Gathering,
    /**
     * Odkryty teren (mgła na mapie) — `core/Exploration.ts`.
     * `dev.Exploration.fraction("forest")` — ile lasu odkryto (0–1);
     * `dev.Exploration.revealAll("forest", 7680, 2880)` — odkryj cały obszar
     * (rozmiar w px świata); `dev.Exploration.reset()` — wszystko we mgle.
     * Kartografia: `dev.Skills.learn("cartography_1")` / `"cartography_2"`.
     */
    Exploration,
    Buffs,
    Abilities,
    Stamina,
    Defense,
    /**
     * Biegłość gracza — `dev.WeaponProficiency.set("sword", 50)`. Ta sama
     * instancja, którą czyta rozstrzygnięcie ciosu i panel rozwoju.
     *
     * ⚠ **`set` zaciska `P` do SUFITU wykupionej rangi** (§34.3), więc
     * `set("sword", 350)` bez rangi da 50 i to nie jest usterka. Kolejność:
     * `setMastery("sword", 4)`, potem `set("sword", 350)`. Zakup z kosztem
     * (złoto + punkty) idzie przez `unlockMastery`, a stan oferty pokazuje
     * `masteryOffer("sword")`.
     */
    WeaponProficiency,
    /** Not a singleton — the NPC registry, so a console session can ask
     *  `dev.Dialogue.available(dev.NPCS.miller)` without a second import. */
    NPCS,
    /**
     * ⚠ **Dwa uchwyty, których `CLAUDE.md` żądał od 2026-08-14, a których do
     * 2026-09-08 NIE BYŁO.** Niezmiennik globalny („nietrafiona ścieżka NIE
     * wywala buildu") kończy się instrukcją: *po każdej przeprowadzce plików
     * sprawdź w silniku, że `window.dev.missing` jest puste i `load.totalFailed`
     * wynosi zero*. Obie rzeczy zwracały `undefined`, co w konsoli czyta się
     * jak „pusto, czyli w porządku" — czyli asercja, która nie potrafi
     * zaświecić na czerwono, a takie ten projekt nazywa dekoracją.
     *
     * ⚠ **Trzeba czytać OBIE.** `missing` zna tylko klucze wymienione
     * w `finalizeTextures`; `failed` liczy każde 404 loadera — dźwięki, mapy,
     * ikony, portrety. Zerowa pierwsza liczba przy niezerowej drugiej znaczy
     * „placeholdery są na miejscu, ale coś jeszcze nie doszło".
     *
     * `dev.missing()` → tablica kluczy tekstur zastąpionych placeholderem.
     * `dev.failed()` → liczba plików, których loader nie dowiózł w `BootScene`.
     */
    missing: () => [...missingAssets],
    failed: () => bootLoadFailures(),
    /**
     * ⭐ Ostrzeżenia ostatnio zbudowanej mapy (`OI-76`/`OI-78`, 2026-10-11):
     * nieznany tileset, nierozpoznana nazwa obiektu, brama bez celu, pusta
     * warstwa. Po każdej zmianie mapy w Tiled — trzecia liczba obok
     * `missing()` i `failed()`, ma być pusta.
     */
    mapWarnings: () => [...mapWarnings],
    /**
     * Pomiar klatek — `dev.perf.overlay()`, `dev.perf.watch(10)`,
     * `dev.perf.scene()`.
     *
     * ⚠ Istnieje, bo „trochę tnie" nie jest danymi: niskie stałe FPS i
     * pojedyncze zacięcia po 40 ms wyglądają dla gracza tak samo, a wymagają
     * zupełnie innych napraw. Raport podaje **percentyle i licznik zacięć**,
     * nie samo FPS — średnia 58 FPS potrafi ukryć dwadzieścia szarpnięć.
     */
    perf: Perf,
    /**
     * **`P1` — rozkład kątów nadchodzących ciosów.** `dev.guard.start()`,
     * pograj kilka walk, `dev.guard.raport()`.
     *
     * ⚠ Istnieje, bo tożsamość dwóch projektowanych konstrukcji tarcz
     * (Okrągła, Pawęż) stoi na ŁUKU, a jedyny pomiar, jaki projekt ma, pochodzi
     * z benchmarku atakującego **na wprost**. Raport podaje histogram kąta
     * i **tabelę progów** (45/90/135), więc odpowiada też na `B3` — czego
     * licznik stref pod dzisiejszymi 60/100 nie potrafi.
     *
     * ⚠ Raport ma sens po **kilkudziesięciu** przyjętych ciosach i po walkach
     * RÓŻNEGO typu — sfora wilków krąży, dzik szarżuje na wprost. Jedna walka
     * z królikiem nie jest próbką.
     */
    guard: GuardStats,
    /**
     * ⚠ **Ciała FIZYCZNE stworzeń w pikselach ŚWIATA** — czyli to, co naprawdę
     * zderza się z drzewami. `GameConfig` na to pytanie NIE ODPOWIADA: liczba
     * `bodyWidth` jest w pikselach klatki i Arcade mnoży ją przez skalę duszka
     * (dzik: 22 × 2,1 = **46 px**). Pomyłka na tym mnożniku już raz przewróciła
     * całą analizę prześwitów w lesie.
     *
     * `dev.bodies()` — pełna tabela; `dev.bodies().niezadeklarowane` — ciała,
     * których nikt nie ustawił przez `applyBody`, czyli odziedziczone po
     * rozmiarze obrazka. **Ta druga lista ma zawierać wyłącznie zwierzęta
     * gospodarskie** (nie mają jeszcze kolizji z terenem); cokolwiek innego
     * w niej jest błędem tej samej klasy co ciało sarny 79×57 px.
     */
    bodies: () => {
      const scene = game.scene.getScene("Game");
      if (!scene) return "Scena `Game` nie działa — wejdź do gry.";
      return { wszystkie: listBodies(scene), niezadeklarowane: auditBodies(scene) };
    },
    /**
     * Rendering architecture ETAP 1B/culling (2026-08-31) — jedna diagnostyka,
     * rozszerzana etapami zamiast dublowana (patrz `docs/dziennik.md` o dwóch
     * streszczeniach, które się rozjeżdżają).
     *
     * `sceneDisplayList` — wszystko w WŁASNEJ liście sceny (kafle, korony,
     * decor `"background"`, plus sam Layer jako jeden wpis) — to, czego
     * `depthSort()` sceny dotyka; po 1B ma zostawać nietknięte klatka po
     * klatce.
     * `ySortedWorld` — wszystko, co faktycznie wymaga coroklatkowego resortu:
     * gracz, każdy enemy/critter/NPC/projectile (+ paski HP/etykiety/znaczniki),
     * każdy pień, decor `"ysorted"`.
     * `culling` — `core/RenderCuller.ts`: `total` to WSZYSCY kandydaci
     * (korony+pnie+cały decor, oba layoty), `visible`/`hidden` to bieżący
     * podział wg `CAMERA.cullMarginFactor`. Culling NIE dotyka pierwszych
     * dwóch liczb — zmienia tylko `.visible`, nigdy przynależność do listy.
     * `dynamicEntities` — gracz + żywi Enemy/FarmAnimal (przybliżone:
     * Bird/Projectile nie są liczone osobno, populacja rzędu pojedynczych
     * sztuk, pomijalna dla tego pomiaru).
     */
    /**
     * SPIKE postaci 3D — `dev.char3d.on()` / `dev.char3d.off()`.
     *
     * ⚠ **Nie jest to docelowa architektura, tylko przyrząd pomiarowy.**
     * Odpowiada na pytanie „czy zamiast pre-renderowanych arkuszy da się
     * trzymać w grze model 3D", i odpowiada je LICZBĄ: włącz, potem
     * `dev.perf.watch(15)` i porównaj z tym samym pomiarem po `off()`.
     * Średnie FPS tu nie wystarczą — wysyłka tekstury co klatkę objawia się
     * zacięciami, a te widać dopiero w percentylach.
     *
     * Postać obraca się PŁYNNIE pod kąt ruchu, nie skokowo do jednego z
     * czterech kierunków — to jest ta różnica, której arkusz nie umie.
     */
    /**
     * ⭐ Prototyp „świat w 3D" (2026-10-04). Działa tylko pod adresem z
     * Domyślny od 2026-10-06. `wylacz()` przeładowuje stronę z `?widok2d`
     * (ścieżka awaryjna 2D), `wlacz()` zdejmuje ten parametr.
     */
    widok3d: {
      wlacz: () => { const u = new URL(location.href); u.searchParams.delete("widok2d"); location.href = u.toString(); },
      wylacz: () => { const u = new URL(location.href); u.searchParams.set("widok2d", "1"); location.href = u.toString(); },
      /** Pochylenie kamery nad gruntem w stopniach (35 / 40 / 45…). */
      kat: (deg: number) => { WorldView3D.kat = deg; return `kąt ${deg}°`; },
      /** Dodatkowy mnożnik przybliżenia (1 = jak w 2D). */
      zoom: (m: number) => { WorldView3D.mnoznik = m; return `przybliżenie ×${m}`; },
      stan: () => ({ wlaczony: WorldView3D.wlaczony, kat: WorldView3D.kat, mnoznik: WorldView3D.mnoznik }),
      /** Płaty gruntu w pamięci (okno wokół kadru — `GRUNT_3D`). */
      grunt: () => (window as unknown as { __widok3dObiekt?: WorldView3D }).__widok3dObiekt?.stanGruntu() ?? null,
    },
    char3d: {
      /**
       * ⚠ **Model 3D jest teraz POSTACIĄ DOMYŚLNĄ** — tworzy go `GameScene`,
       * nie ta konsola. `on()` został wyłącznie po to, żeby powiedzieć, gdzie
       * naprawdę żyje, bo stara nazwa sugerowałaby, że bez niej modelu nie ma.
       */
      on: () => "Model 3D jest domyślny — tworzy go GameScene. `off()` wraca do arkusza 2D.",
      /** Wróć na arkusz 2D — do porównania jednego z drugim na żywo. */
      off: () => {
        const s = uchwyt3d();
        if (!s) return "Model nie działa (albo się nie wczytał).";
        s.destroy();
        return "Zdjęty — wrócił arkusz 2D. Odśwież stronę, żeby wrócić do modelu.";
      },
      /**
       * Koszt SAMEGO mostu 3D w ms/klatkę.
       *
       * ⚠ Osobno od `dev.perf`, bo na desktopie gra ma taki zapas, że po
       * włączeniu 3D licznik klatek nie drgnie — i wychodzi fałszywy wniosek
       * „nic nie kosztuje". Ta liczba mówi, ile z budżetu klatki zjada jedna
       * postać, więc da się ją zestawić z budżetem telefonu.
       */
      koszt: () =>
        uchwyt3d()?.koszt() ?? "Model nie działa — wejdź do gry.",
      /**
       * Odegraj cios: `dev.char3d.cios()` (w bieżący zwrot modelu) albo
       * `dev.char3d.cios(90)` — stopnie jak na KOMPASIE ekranu: 0 = w górę,
       * 90 = w prawo, 180 = w dół. ⚠ Do 2026-09-27 przyjmował `"left"` itp.;
       * cztery kierunki gracza zostały wycofane.
       *
       * ⚠ Osobno od walki, bo atak w grze wymaga WYBRANEGO CELU — bez niego
       * `GameScene` odmawia („Brak celu”). Oceny samej animacji nie może
       * blokować to, czy akurat stoi obok kto do bicia.
       */
      /**
       * Pancerz na modelu: `dev.char3d.pancerz("gambeson")`,
       * `dev.char3d.pancerz(["linen_shirt", "mail_hauberk"])`, `(false)`,
       * `("auto")` — wraca do tego, co gracz ma NA SOBIE (domyślnie).
       *
       * ⚠ To jest test rozstrzygający spór „arkusz 2D czy model 3D": gra ma
       * 11 broni, 4 materiały pancerza i 10 slotów, więc widoczny ekwipunek
       * w sprite'ach jest kombinatorycznie nie do wyrenderowania. Tutaj to
       * jeden `visible` na meshu, który dziedziczy wagi kości po ciele.
       */
      pancerz: (wariant: string | string[] | false | "auto" = "auto") =>
        uchwyt3d()?.ustawPancerzRecznie(wariant) ?? "Model nie działa — wejdź do gry.",
      /**
       * Broń w dłoni: `dev.char3d.bron("sword")`, `dev.char3d.bron(false)`.
       *
       * ⚠ Domyślnie model pokazuje to, co gracz ma NAPRAWDĘ założone
       * (`Equipment.weaponId`). Ta komenda nadpisuje wybór ręcznie;
       * `dev.char3d.bron("auto")` wraca do śledzenia ekwipunku.
       * ⚠ Nazwy są TE SAME, co `id` przedmiotu w `GameConfig` (`sword`, `axe`,
       * `spear`…), żeby dało się je zestawiać bez tłumaczenia w głowie.
       * ⚠ Dwuręczność jest na razie ETYKIETĄ: `hands: 2` znaczy „druga ręka
       * pusta", ale lewa dłoń modelu nie trzyma drzewca — poprawny chwyt
       * oburęczny wymaga osobnej pozy, nie przełącznika.
       */
      bron: (wariant: string | false | "auto" = "sword") =>
        uchwyt3d()?.ustawBronRecznie(wariant) ?? "Model nie działa — wejdź do gry.",
      /**
       * Tarcza w DRUGIEJ ręce: `dev.char3d.tarcza("ironbound_shield")`.
       *
       * ⚠ Domyślnie idzie za tym, co gracz ma w `offhand`, a `"auto"` wraca do
       * śledzenia ekwipunku — dokładnie jak `bron`.
       * ⚠ **Tarcza gaśnie sama przy broni dwuręcznej**, bo `Equipment` odkłada
       * wtedy zawartość drugiej ręki do plecaka. Ręcznie wymuszona zostanie
       * jednak widoczna — to jest przyrząd, nie symulacja zasad.
       */
      tarcza: (wariant: string | false | "auto" = "ironbound_shield") =>
        uchwyt3d()?.ustawTarczeRecznie(wariant) ?? "Model nie działa — wejdź do gry.",
      /**
       * ⭐ Stworzenia 3D (`OI-161`): `dev.char3d.manekiny(8)` stawia 8 dzików
       * 3D w kłusie wokół gracza (bez AI), `manekiny(0)` sprząta;
       * `dev.char3d.stworzenia()` — koszt mostu na JEDNO stworzenie-klatkę.
       * Pomiar na telefonie: manekiny(N) → `dev.perf.watch(15)` + stworzenia().
       */
      manekiny: (n = 8, rodzaj = "boar") => {
        const scene = game.scene.getScene("Game") as Phaser.Scene & { player?: { x: number; y: number } };
        if (!scene?.player) return "Wejdź do gry.";
        const m = MODELE_3D[rodzaj];
        if (!m) return `Brak modelu 3D: ${rodzaj}. Są: ${Object.keys(MODELE_3D).join(", ")}`;
        return `manekinów: ${Creature3D.manekiny(scene, n, scene.player.x, scene.player.y, m)}`;
      },
      stworzenia: () => Creature3D.koszt(),
      /** Co w ogóle da się założyć — `dev.char3d.dostepne()`. */
      dostepne: () => uchwyt3d()?.dostepne() ?? "Model nie działa — wejdź do gry.",
      cios: (stopnie?: number) => {
        const s = uchwyt3d();
        if (!s) return "Model nie działa — wejdź do gry.";
        // Kompas → konwencja modelu (radiany, 0 = w dół, ku prawej rośnie).
        s.zagrajAtak(stopnie === undefined ? undefined : Math.PI - (stopnie * Math.PI) / 180);
        return stopnie === undefined ? "cios: bieżący zwrot" : `cios: ${stopnie}°`;
      },
    },
    worldStats: () => {
      const scene = game.scene.getScene("Game");
      if (!scene) return "Scena `Game` nie działa — wejdź do gry.";
      const layer = ySortedWorldFor(scene);
      const culler = renderCullerFor(scene);
      const gs = scene as unknown as {
        enemies?: Phaser.Physics.Arcade.Group;
        critters?: unknown[];
        farmAnimals?: unknown[];
      };
      return {
        sceneDisplayList: scene.children.list.length,
        ySortedWorld: layer ? layer.list.length : 0,
        culling: culler
          ? culler.stats
          : "RenderCuller nie zarejestrowany dla tej sceny",
        dynamicEntities: {
          player: 1,
          enemies: gs.enemies?.getLength() ?? 0,
          critters: gs.critters?.length ?? 0,
          farmAnimals: gs.farmAnimals?.length ?? 0,
        },
      };
    },
    /**
     * Instancje drzew (Tile Object → sprite). `src/world/TreeLayer.ts`,
     * `docs/tree_instances.md`. Las jest już zmigrowany na ten model —
     * `treeProto.load()` ładuje małą mapę testową do sprawdzania workflow.
     */
    treeProto: {
      /**
       * Ładuje mapę prototypu instancji drzew (`tree_proto.tmj`, mapId
       * "treeproto") — kilkanaście nachodzących na siebie drzew + gracz.
       */
      load: () => {
        const scene = game.scene.getScene("Game") as Phaser.Scene | null;
        if (!scene) return "Scena `Game` nie działa — wejdź do gry (Nowa gra).";
        scene.scene.restart({ mapId: "treeproto" });
        return "ładuję mapę prototypu drzew…";
      },
      /**
       * Test 6 wariantów wierzby (`willow_test.tmj`, mapId "willowtest"):
       * rząd „obok siebie" + kępa z nakładaniem koron + para wierzba×dąb.
       */
      willows: () => {
        const scene = game.scene.getScene("Game") as Phaser.Scene | null;
        if (!scene) return "Scena `Game` nie działa — wejdź do gry (Nowa gra).";
        scene.scene.restart({ mapId: "willowtest" });
        return "ładuję test wierzb…";
      },
      /** Skok do lasu (już zmigrowany). */
      forest: () => {
        const scene = game.scene.getScene("Game") as Phaser.Scene | null;
        if (!scene) return "Scena `Game` nie działa.";
        scene.scene.restart({ mapId: "forest" });
        return "ładuję las…";
      },
      /** Powrót do wsi. */
      back: () => {
        const scene = game.scene.getScene("Game") as Phaser.Scene | null;
        if (!scene) return "Scena `Game` nie działa.";
        scene.scene.restart({ mapId: "village" });
        return "wracam do Zagajów…";
      },
    },
  };
  Perf.attach(game);
}
