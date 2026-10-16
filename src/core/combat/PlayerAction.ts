import { ABILITIES } from "../../config/GameConfig";
import type { AimableAbilityId } from "../AbilitySpec";

/**
 * **AKCJA GRACZA JAKO DANE — POC (P3.1, 2026-09-03).**
 *
 * Wprowadzone jako **pierwszy krok D4** z `docs/audyt_projektowy_fundamentow_2026-09-03.md`
 * (§3.4: *„gracz bez deklaratywnego modelu akcji"*). Do tej daty każda z ośmiu
 * umiejętności miała własny blok w `switch (p.id)` w `GameScene` — łącznie
 * ~460 linii, po jednym bespoke bloku na umiejętność.
 *
 * ── Co ten plik JEST, a czym NIE JEST ────────────────────────────────────
 * ⛔ **To nie jest wspólny model akcji dla gracza i wroga.** `CombatAction`
 * zostaje nietknięty i **nie wolno go rozszerzać o pola gracza**: niesie
 * obrażenia BEZWZGLĘDNE z `EnemyConfig`, a gracz nie ma własnych obrażeń —
 * losuje je z broni (`rollDamage`) i dokłada MNOŻNIK. Wciśnięcie obu w jeden
 * typ wymagałoby pól opcjonalnych czytanych `in`-guardem, czyli dokładnie tego
 * sufitu, który migracja `WeaponTraits` (D5) właśnie zlikwidowała.
 *
 * ⛔ **To nie jest `ActionRunner` dla gracza.** Mechanizmem zostaje
 * `GameScene.pendingSwing` — ta sama ścieżka, którą od C-01 jedzie każdy
 * zamach. Ten plik nie odmierza czasu i nie zna żadnej fazy.
 *
 * ⛔ **To nie jest właściciel kształtu ani celowania.** Zasięg, sektor, wybór
 * celów i podgląd zostają w `core/AbilitySpec.ts` i mają tam zostać — to jedyna
 * warstwa w tym obszarze, która od początku jest jednym źródłem dla podglądu
 * I dla commitu.
 *
 * ⛔ **Trzy wpisy, nie osiem.** `Record<AbilityId, …>` wymusiłby dopisanie
 * pięciu deklaracji, których nic nie wykonuje — czyli pięć martwych slotów.
 * Rejestr rośnie razem ze swoimi konsumentami, a po P3.5 **przestaje rosnąć**:
 * pozostałe pięć umiejętności nie jedzie `pendingSwing`iem.
 *
 * ── ⚠ Ani jednej nowej liczby ─────────────────────────────────────────────
 * Każda wartość niżej jest **odczytana z `ABILITIES.<akcji>`**, nie
 * przepisana. Przepisana liczba zawsze się rozjeżdża, a ten projekt ma na to
 * udokumentowane blizny. Zgodność deklaracji z configiem pilnują §R6a
 * (Ciężkie uderzenie), §T7 (Uderzenie tarczą) i §S6 (Wypad)
 * w `tools/combat_regresja.mjs`.
 *
 * ⚠ **Wypad dowiódł tej reguły od drugiej strony (P3.5):** nie ma w configu
 * `recoveryMs`, więc zamiast dopisać mu liczbę, kontrakt dostał `ActionRoot`
 * — politykę, która OPISUJE istniejące zachowanie, zamiast je zmieniać.
 *
 * ⚠ **Plik jest CZYSTY — żadnego Phasera, żadnej encji, żadnej sceny** —
 * i jest to egzekwowane przez strażnika czystości w `tools/combat_regresja.mjs`.
 */

/**
 * **JEDNA konsekwencja trafienia — poza obrażeniami.** Akcja niesie ich LISTĘ
 * (`PlayerAction.onHit`), bo Wypad potrzebuje dwóch naraz.
 *
 * ⚠ **Unia po `kind`, nie worek pól opcjonalnych** — ta sama decyzja i ten
 * sam powód co przy `WeaponTrait` (D5): nowy rodzaj nagrody dokłada wariant,
 * a kompilator wskazuje każde miejsce, które musi się do niego odnieść.
 * `onHit?: { control?: … }` dałoby dwa poziomy opcjonalności i pytanie
 * „brak czy zapomniane" bez odpowiedzi.
 *
 * ⚠ **LISTA, a nie drugie pole obok (P3.5, decyzja OD-1 z review P3.3).**
 * Wypad wypłaca zwrot cooldownu **i** utrzymane natarcie pod tą samą bramką
 * `anyHit`. Kuszący podział „to działa na CELU, tamto na GRACZU" dałby dwie osie
 * zapalane zawsze razem — czyli lustrzane odbicie błędu `ownsBody`/
 * `attackerRecoil`, tylko z drugiej strony. Wyzwalacz jest jeden, więc lista
 * jest jedna; adresata niesie nazwa wariantu.
 *
 * ⚠ **`[]` znaczy „świadomie nic" i to NIE jest to samo co brak pola.** Wariant
 * `"none"` zniknął razem z pojedynczą wartością (P3.5), bo lista
 * jednoelementowa z „niczym" jest sprzecznością. Reguła „ktoś zapomniał ≠
 * świadomie nic" trzyma się dziś na czym innym: **pole `onHit` jest WYMAGANE**,
 * więc pustej listy nie da się pominąć — trzeba ją napisać.
 */
export type ActionOnHit =
  /** Trafienie ogłusza cel. ⚠ Nakłada je `resolvePendingSwing` pod `anyHit` —
   *  kontrola wisi na TRAFIENIU, nie na użyciu (`docs/systemy/abilities.md`). */
  | { readonly kind: "control"; readonly stunMs: number }
  /**
   * Trafienie zwraca UŁAMEK cooldownu **tej** akcji (Wypad, `hitCooldownRefund`).
   *
   * ⚠ **Bez `id` — i to jest cała różnica wobec literału, który stał w gałęzi.**
   * Do P3.5 Wypad wpisywał `refund: { id: "lunge", … }` ręcznie, czyli trzymał
   * DRUGIE źródło prawdy o tym, czyj to cooldown, tuż obok `PLAYER_ACTIONS.lunge`.
   * Adres dokłada wykonawca z `action.id`.
   *
   * ⚠ Mechanika zwrotu jest NIETKNIĘTA: liczy go dalej `Abilities.refundCooldown`,
   * właściciel cooldownu się nie zmienia.
   */
  | { readonly kind: "refundCooldown"; readonly fraction: number }
  /**
   * Trafienie uzbraja autoatak na trafionym celu — „natarcie ma TRWAĆ".
   *
   * ⚠ Wariant bez ładunku i to jest poprawne: cała treść siedzi w nazwie.
   * ⚠ Bezpieczne mimo trwającego zamachu — `autoAttackArmed` jest flagą TRWAŁĄ,
   * a `resolveAttack` wychodzi wcześniej, dopóki `pendingSwing` leci.
   */
  | { readonly kind: "armAutoAttack" }
  /**
   * **Trafienie zużywa TARCZĘ** (`S10`, decyzja autora 2026-09-15). Piąty
   * wariant, dołożony razem ze swoim konsumentem — tak jak każe reguła
   * „ewolucja `onHit` tylko gdy wymaga tego rzeczywista mechanika".
   *
   * ⚠⚠ **Zużycie wisi na TRAFIENIU, nie na użyciu** — i to jest cała treść tej
   * decyzji. Bash wykonany w powietrze nie niszczy tarczy; bash, który
   * rzeczywiście w coś przywalił, niszczy. Gdyby zużycie stało przy
   * naciśnięciu (tam, gdzie stoi `wearsWeapon` dla zwykłego zamachu),
   * kosztowałoby tak samo za pudło i za trafienie.
   *
   * ⛔ **Wariant bez ładunku i to jest POPRAWNE.** Stawka, rzut i próg są
   * `EQUIPMENT.durability` — te same, co przy każdym innym zużyciu.
   * Osobnego `bashWear` NIE MA i nie ma powstać: drugi kanał zużycia
   * podwoiłby tempo, nie mówiąc o tym ani słowa (zamek `§D13`).
   *
   * ⚠ Dlaczego nie `wearsWeapon: true` — bo to NIE jest broń. `wearsWeapon`
   * zostaje `false` z niezmienionego powodu („zużywa się to, czym się
   * uderza"); ten wariant dopisuje drugą połowę tego samego zdania, której
   * do dziś po prostu nie było w kodzie.
   */
  | { readonly kind: "wearShield" }
  /**
   * **Trafienie nakłada na cel efekt obrażeń w czasie** (Rozcięcie → Krwawienie,
   * 2026-09-04). Czwarty wariant — dołożony RAZEM ze swoim konsumentem, zgodnie
   * z regułą „ewolucja `onHit` tylko gdy wymaga tego rzeczywista mechanika"
   * (checkpoint P3 §E).
   *
   * ── ⚠ Dlaczego to NIE MOGŁO pojechać istniejącym kanałem ─────────────────
   * Trzy próby, wszystkie odrzucone z powodu, nie z gustu:
   *
   *  • **`StrikeProfile`** (gdzie mieszkają `interrupts` i `staggerMs`) —
   *    tamto jest opisem „CZYM uderzam", czyli własnością BRONI dokładaną
   *    każdemu jej zamachowi. Krwawienie jest własnością AKCJI: ten sam miecz
   *    machnięty autoatakiem nie krwawi. Wpisanie go do profilu rozdałoby ranę
   *    każdemu ciosowi — dokładnie ten błąd, przed którym broni się komentarz
   *    przy `pendingSwing.onHit.control`.
   *  • **gałąź `case "rend"` w `GameScene`** — nagroda wisi na TRAFIENIU, a to
   *    rozstrzyga się dopiero w `resolvePendingSwing`. Nałożenie przy
   *    naciśnięciu nagradzałoby samo użycie.
   *  • **osobne pole obok `onHit`** — wyzwalacz jest ten sam (`anyHit`), więc
   *    lista jest jedna (OD-1 z review P3.3).
   *
   * ⚠ **Wiezie UMOWĘ, nie liczbę obrażeń.** `fractionOfDamage` jest ułamkiem,
   * bo obrażenia tiku znane są dopiero w chwili trafienia — zależą od rzutu,
   * biegłości i jakości wykonania TEGO ciosu. Wykonawca (`damageMatchingEnemies`)
   * liczy je raz i wpisuje do efektu jako liczbę stałą.
   *
   * ⛔ **Nie ma tu ikony ani `detail`.** To jest prezentacja, której ten plik
   * nie zna i znać nie ma — wykonawca dokłada ikonę z `action.id`. Nie ma tu
   * też ani jednego pola pod Rozdarcie/Rozszarpanie/konsumpcję Krwawienia:
   * wchodzą razem ze swoim kodem albo wcale.
   */
  | {
      readonly kind: "bleed";
      /** Klucz tożsamości efektu: dwa nałożenia z tym `id` to jedna rana. */
      readonly buffId: string;
      readonly name: string;
      /** Ułamek obrażeń ciosu (PRZED krytykiem) przypadający na jeden tik. */
      readonly fractionOfDamage: number;
      readonly durationMs: number;
      readonly tickMs: number;
      readonly maxStacks: number;
    };

/**
 * **Skąd bierze się UKORZENIENIE tej akcji.**
 *
 * ⚠ **Powstało w P3.5 i nie jest ujednoliceniem dla samego ujednolicenia.**
 * Wypad ujawnił, że projekt ma DWIE żywe polityki ukorzenienia — i obie
 * istniały w kodzie na długo przed tym plikiem:
 *
 *  • Ciężkie uderzenie i Uderzenie tarczą podają `triggerAttack` własny
 *    `rootMs` (`windupMs + recoveryMs`) — cios ma własny rytm;
 *  • pchnięcie Wypadu **nie podaje żadnego**, więc `Player.triggerAttack`
 *    bierze `Progression.rootDurationMs`, czyli tempo BRONI.
 *
 * ⚠ **`ABILITIES.lunge` nie ma `recoveryMs` i nie wolno mu go wymyślić.**
 * Nowa liczba w polu, którego żaden wykonawca by nie przeczytał, byłaby
 * zmyśleniem balansu, a nie migracją. Unia opisuje to, co JEST, zamiast
 * dorabiać wartość do kształtu — i zostawia obie polityki jawnymi, zamiast
 * chować różnicę w tym, który wykonawca akurat składa cios.
 *
 * ⛔ Odrzucone: `recoveryMs?: number` (opcjonalność zaciera „nie ma" i „ktoś
 * zapomniał") oraz `recoveryMs: number | "weaponTempo"` (miesza wartość
 * z polityką w jednym polu, wbrew idiomowi `kind` z `WeaponTrait`).
 */
export type ActionRoot =
  /** Ukorzenienie trwa `windupMs + recoveryMs` — cios z własnym rytmem. */
  | { readonly kind: "windupPlusRecovery"; readonly recoveryMs: number }
  /** Ukorzenienie z tempa BRONI (`Progression.rootDurationMs`) — wykonawca nie
   *  podaje `rootMs` i to jest dzisiejsze zachowanie pchnięcia Wypadu. */
  | { readonly kind: "weaponTempo" };

/** Wykonanie jednej akcji gracza, opisane danymi. */
export interface PlayerAction {
  /**
   * Adres tej akcji — w `core/Abilities` (cooldown) **oraz w `core/AbilitySpec`
   * (kształt i mnożnik)**.
   *
   * ⚠ **`Abilities` zostaje JEDYNYM właścicielem cooldownu** — trzyma `readyAt`,
   * zasila pasek umiejętności, obsługuje `refundCooldown` i zeruje się przy
   * śmierci. Ten plik cooldownu ani nie odlicza, ani go nie deklaruje (P3.4).
   *
   * ⚠ **Typ zawężony do `AimableAbilityId` w P3.4, i to jest ZAWĘŻENIE
   * TYPOWE, nie rzutowanie.** Wykonawca pyta resolvera o mnożnik
   * (`resolveAbility(action.id, strike)`), a resolver przyjmuje wyłącznie
   * umiejętności celowane. Rzut `as` przepuściłby tu `warcry`, dla którego
   * `resolveAbility` nie ma gałęzi — czyli błąd cichy zamiast błędu
   * kompilatora. Dziś każda akcja tej klasy jest celowana i to nie jest
   * przypadek: cios zatwierdzany na naciśnięciu potrzebuje kształtu.
   */
  readonly id: AimableAbilityId;
  /**
   * Ile ms od naciśnięcia do TRAFIENIA.
   *
   * ⚠ Jedna liczba, trzech odbiorców i to nie jest przypadek: opóźnienie
   * rozstrzygnięcia (`pendingSwing.resolveAt`), długość animacji (`× 2`, żeby
   * pełne wyprostowanie ostrza wypadło dokładnie w chwili trafienia — reguła
   * `PLAYER.swingHitFraction` z C-01) oraz pierwsza połowa ukorzenienia.
   */
  readonly windupMs: number;
  /**
   * Skąd bierze się ukorzenienie — patrz `ActionRoot`.
   *
   * ⚠ **Zastąpiło płaskie `recoveryMs` w P3.5** (Wypad go nie ma i nie wolno
   * mu go wymyślić). Dla Ciężkiego uderzenia i Uderzenia tarczą niesie tę samą
   * liczbę co przedtem, w wariancie `windupPlusRecovery` — zero zmiany czasu.
   */
  readonly root: ActionRoot;
  /* ── ⛔ CZEGO TU NIE MA I DLACZEGO (P3.4, review P3.3) ────────────────────
     Do 2026-09-03 stały tu jeszcze `cooldownMs`, `staminaCost` i `damageMul`.
     Wszystkie trzy zostały ODJĘTE, bo każda była **drugim odczytem tej samej
     liczby**, a nie własnością, której wykonawca używa:

     • `cooldownMs`  — płaci `Abilities.startCooldown` we wspólnym ogonie
       `onAbilityRequested`; deklaracja nie miała ani jednego konsumenta
       w runtime. Właściciel się nie zmienia, znika tylko kopia.
     • `staminaCost` — płaci ten sam ogon, PO wszystkich odmowach. ⚠ I nie jest
       to nawet reguła jednolita: Unik mnoży koszt przez obciążenie i płaci go
       sam, dlatego `ABILITIES.dodge` **celowo nie ma** `staminaCost`.
       Deklaracja udawałaby więc regułę, której nie ma.
     • `damageMul`   — właścicielem jest `AbilitySpec`; wykonawca woła dziś
       `multiplierFor(resolveAbility(action.id, strike), "primary")`. Płaskie
       pole nie umiało zresztą opisać klasy: `AbilitySpec` modeluje obrażenia
       jako `{primary, secondary}` × `maxTargets`, a przy Szerokim cięciu te
       role się NIE zlewają. Drugi wykonawca ciosu (`landRushStrike`) czytał
       resolver od początku.

     ⚠ **Zamrożenie tych liczb nie zniknęło — przeniosło się.** §R6a
     asercjonuje dziś `cooldown 7 s` i `staminaCost 18` **wprost na
     `ABILITIES.heavyStrike`**, czyli tam, gdzie te liczby naprawdę mieszkają;
     przed P3.4 jedyną drogą do nich była kopia w tym pliku.

     ⛔ **Nie dopisywać ich „dla kompletności opisu".** Reguła projektu: pole
     wchodzi RAZEM ze swoim konsumentem. Gdyby gracz kiedyś pojechał
     `ActionRunner`em (OD-6), cooldown wróci razem z tamtą decyzją — nie
     wcześniej i nie osobno. */
  /**
   * **Czy ten cios może spudłować WYKONANIEM** (Execution Miss, warstwa 2).
   *
   * ⚠ **Własność AKCJI, nie broni** — mechanicznie Ciężkie uderzenie jest
   * zamachem tą samą bronią, na tym samym `currentStrike()`. Powód `false` jest
   * EKONOMICZNY: umiejętność kosztuje cooldown i wysiłek, a fuszerka kasowałaby
   * cały ten wydatek rzutem, którego gracz nie kontroluje.
   *
   * ⚠ **Wymagane, nie opcjonalne** — ta sama decyzja co przy
   * `Proficiency.executionFor`: „ta akcja świadomie nie pudłuje" i „ktoś nie
   * dopisał pola" nie mogą wyglądać w źródle identycznie.
   */
  readonly allowFumble: boolean;
  /**
   * Czy ten cios ZUŻYWA broń (`wearWeapon`, rzut 15% na zamach).
   *
   * ⚠ **Ujawnione dopiero przez `shieldBash` (P3.2) i wymagane, nie
   * opcjonalne.** Uderzenie tarczą świadomie NIE zużywa broni: zużywa się to,
   * czym się uderza, a uderza tarcza — a pancerz nie ma dziś trwałości
   * (`docs/odlozone.md` §4), więc zużycie oręża przy ciosie, którego oręż nie
   * wykonał, byłoby karą wziętą z powietrza. Wartość domyślna sprawiłaby, że
   * ta decyzja i przeoczenie wyglądają identycznie.
   */
  readonly wearsWeapon: boolean;
  /**
   * Co daje trafienie poza obrażeniami — **lista, wymagana, pusta znaczy „nic"**.
   * Patrz `ActionOnHit`.
   *
   * ⛔ Ten plik NIE wykonuje nagród i nie wie, czym jest ogłuszenie ani zwrot
   * cooldownu. Wykonuje je `resolvePendingSwing`, dokładnie tam, gdzie robił to
   * przed migracją — z tą samą bramką `anyHit`.
   */
  readonly onHit: readonly ActionOnHit[];
  /**
   * **Którą ręką ten cios WYGLĄDA** — wyłącznie prezentacja (2026-10-11).
   * `"tarcza"`: model 3D gra klip uderzenia tarczą zamiast zamachu bronią.
   * Rozgrywka tego pola nie czyta. Brak = zwykły cios bronią.
   *
   * ⚠ Deklaracja, nie `if (id === "shieldBash")` w wykonawcy — ta sama reguła
   * co `wearsWeapon`: wykonawca nie zna umiejętności z nazwy.
   */
  readonly poza?: "tarcza";
}

const H = ABILITIES.heavyStrike;
const S = ABILITIES.shieldBash;
const L = ABILITIES.lunge;
const R = ABILITIES.rend;

/**
 * Rejestr akcji gracza tej klasy — **dziś cztery pozycje**.
 *
 * ⚠ **SPROSTOWANIE do checkpointu P3 §D (2026-09-04).** Do tego dnia stało tu
 * „trzy pozycje i to jest stan DOCELOWY". Zdanie było prawdziwe o tym, co
 * opisywało — **migracji istniejących umiejętności** — i zostaje w mocy:
 * pozostałe pięć umiejętności z 2026-09-03 dalej jedzie innymi mechanizmami
 * (`pendingRush` sam, natychmiastowy kształt AoE, efekt na sobie, przewrót)
 * i **nadal tu nie wchodzą**; pełny rozbiór w review P3.3.
 *
 * Nie było natomiast prawdziwe o **nowych** akcjach. Kryterium przynależności
 * jest w §C jednoznaczne: *akcja należy do `PlayerAction` wtedy i tylko wtedy,
 * gdy jej część bojowa kończy się wpisem do `pendingSwing`*. `Rozcięcie` je
 * spełnia co do słowa, więc dopisanie go **honoruje ten kontrakt, zamiast go
 * omijać** — a wpisanie mu bespoke bloku do `switch`a w `GameScene` byłoby
 * odtworzeniem dokładnie tego długu, który P3 usunęło.
 *
 * ⛔ **Reguła zostaje ta sama i jest jedyną, która tu obowiązuje:** wpis
 * powstaje razem ze swoim konsumentem i tylko dla akcji kończącej się
 * `pendingSwing`iem. Rejestr nie jest miejscem na „wszystkie umiejętności".
 */
/**
 * ⚠ **Klucz rejestru MUSI zgadzać się z `id` wpisu — i pilnuje tego
 * KOMPILATOR** (`PlayerAction & { id: K }`, P3.4).
 *
 * Adnotacja z dwoma polami `PlayerAction` była pod trzema względami
 * wystarczająca i te trzy zostają bez zmian (sprawdzone `tsc`, nie z lektury):
 * łapała **pole zbędne** (`cooldownMs` po P3.4 → TS2353), **pole brakujące**
 * (→ TS2741) i **`id` spoza `AimableAbilityId`** (`warcry` → TS2322).
 *
 * ⛔ Nie łapała **jednego**: wpisu `shieldBash` deklarującego `id:
 * "heavyStrike"`. Do P3.4 było to nieszkodliwe, bo `id` nikomu nie służyło;
 * **od P3.4 jest nośne** — wykonawca pyta nim resolvera
 * (`resolveAbility(action.id, strike)`), więc podmieniony adres cicho oddałby
 * Uderzeniu tarczą kształt i mnożnik Ciężkiego uderzenia (×2,0 zamiast ×0,5).
 * §R6a pilnuje adresu tylko dla `heavyStrike`, a §T7 po przekotwiczeniu pyta
 * już resolvera, nie deklaracji — czyli nikt by tego nie zobaczył.
 *
 * ⛔ **`as const` NIE jest tu odpowiedzią i został sprawdzony pomiarem.** Bez
 * adnotacji brak wymaganego pola przestaje być błędem W TYM PLIKU i wypływa
 * dopiero w `GameScene` (zmierzone: TS2345 w miejscu wywołania) — a wpis
 * dopisany PRZED swoim konsumentem nie zapaliłby wtedy niczego. Adnotacja
 * zgłasza błąd tam, gdzie stoi pomyłka; `as const` tam, gdzie ktoś jej użyje.
 */
export const PLAYER_ACTIONS: {
  readonly [K in "heavyStrike" | "shieldBash" | "lunge" | "rend"]: PlayerAction & { readonly id: K };
} = {
  heavyStrike: {
    id: "heavyStrike",
    windupMs: H.windupMs,
    root: { kind: "windupPlusRecovery", recoveryMs: H.recoveryMs },
    allowFumble: false,
    wearsWeapon: true,
    // ⚠ Pusto, bo cała treść tego ciosu to obrażenia (§R5: to nie jest Shield Bash).
    onHit: [],
  },

  /**
   * **Uderzenie tarczą.** Drugi przypadek POC (P3.2) — wybrany właśnie dlatego,
   * że łamie założenia pierwszego: profil ciosu bierze z DRUGIEJ RĘKI, niesie
   * kontrolę na trafieniu i nie zużywa broni.
   *
   * ⚠ **Profil (`shieldStrike()`) NIE stoi tutaj i stać nie będzie** — jest
   * parametrem wykonawcy (decyzja z P3.1). Deklaracja opisuje AKCJĘ; to, czym
   * akcja uderza, zależy od sprzętu w tej klatce.
   *
   * ⛔ Bramka `requiresShield` też nie jest tutaj: to walidacja stanu świata,
   * a nie własność akcji, i zostaje w gałęzi razem z resztą odmów.
   */
  shieldBash: {
    id: "shieldBash",
    windupMs: S.windupMs,
    root: { kind: "windupPlusRecovery", recoveryMs: S.recoveryMs },
    // ⚠ **Nie fuszeruje, i tu powód jest STRUKTURALNY**, nie ekonomiczny jak
    // przy Ciężkim uderzeniu: nagroda tej umiejętności wisi na trafieniu
    // (ogłuszenie), a cios wyprowadza TARCZA — `P` opisuje rodzinę BRONI, więc
    // rzut na wykonanie pytałby o umiejętność, której ten cios nie używa.
    allowFumble: false,
    // ⚠ Zużywa się to, czym się uderza — a uderza tarcza.
    wearsWeapon: false,
    // ⭐ `S10`: druga połowa zdania wyżej. Do 2026-09-15 stało tam „zużywa się
    //    to, czym się uderza", a tarcza NIE zużywała się przy bashu ani razu —
    //    czyli komentarz opisywał zamiar, nie kod.
    onHit: [{ kind: "control", stunMs: S.stunMs }, { kind: "wearShield" }],
    poza: "tarcza",
  },

  /**
   * **Pchnięcie kończące Wypad.** Trzeci i OSTATNI przypadek tej klasy (P3.5).
   *
   * ⛔ **To jest deklaracja CIOSU, nie całego Wypadu.** Lot, kierunek, wybór
   * celu, dwa użycia (pościg / skok w pustkę) i cały `pendingRush` zostają
   * w gałęzi `case "lunge"` — bo to jest RUCH, a ta klasa opisuje cios.
   *
   * ⚠ **Wypad wypłaca się jednym pytaniem „czy weszło" i DWIEMA nagrodami
   * naraz** — to on wymusił listę `onHit` (OD-1). Rozbicie ich na dwa
   * rozstrzygnięcia zmieniłoby wycenę całej umiejętności: pudło ma nie dawać
   * ani jednej, a skok w pustkę płaci pełne 14 s.
   *
   * ⚠ **`allowFumble: false` z powodu, który jest tu WŁASNY**: umiejętność
   * rozstrzyga się jednym pytaniem i wypłaca za nie obie nagrody, więc Execution
   * Miss kasowałby obie rzutem, którego gracz nie ma jak przeczytać. `m(P)`
   * i Ześlizg działają normalnie.
   *
   * ⚠ **Jedyny wpis z `weaponTempo`** — patrz `ActionRoot`. Pchnięcie nie ma
   * własnego `recoveryMs` w configu i nie dostaje go tutaj.
   */
  lunge: {
    id: "lunge",
    windupMs: L.windupMs,
    root: { kind: "weaponTempo" },
    allowFumble: false,
    // ⚠ Cios wyprowadza broń, więc broń się zużywa — jak przy autoataku
    // i Ciężkim uderzeniu. Jeden rzut na zamach, nie na cel.
    wearsWeapon: true,
    onHit: [
      { kind: "refundCooldown", fraction: L.hitCooldownRefund },
      { kind: "armAutoAttack" },
    ],
  },

  /**
   * **Rozcięcie** — czwarta akcja tej klasy i pierwsza, która zostawia coś na
   * CELU po tym, jak cios się skończył (2026-09-04).
   *
   * ⚠ **`allowFumble: false` z tego samego, EKONOMICZNEGO powodu co Ciężkie
   * uderzenie**, wzmocnionego jednym: fuszerka kasowałaby nie tylko obrażenia,
   * ale i całą ranę — czyli cały powód, dla którego ta umiejętność zajmuje
   * slot. `m(P)` i Ześlizg działają normalnie i skalują OBIE połowy wyjścia.
   *
   * ⚠ **Cios wyprowadza broń, więc broń się zużywa** — jak autoatak, Ciężkie
   * uderzenie i pchnięcie Wypadu. (Uderzenie tarczą jest tu wyjątkiem, bo
   * uderza tarczą.)
   *
   * ⚠ **Ani jednej liczby z powietrza** — wszystkie pięć pochodzi z
   * `ABILITIES.rend.bleed`. Pilnuje tego §V w `tools/combat_regresja.mjs`.
   */
  rend: {
    id: "rend",
    windupMs: R.windupMs,
    root: { kind: "windupPlusRecovery", recoveryMs: R.recoveryMs },
    allowFumble: false,
    wearsWeapon: true,
    onHit: [
      {
        kind: "bleed",
        buffId: R.bleed.buffId,
        name: R.bleed.name,
        fractionOfDamage: R.bleed.fractionOfDamage,
        durationMs: R.bleed.durationMs,
        tickMs: R.bleed.tickMs,
        maxStacks: R.bleed.maxStacks,
      },
    ],
  },
};
