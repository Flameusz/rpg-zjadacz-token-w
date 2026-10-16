/**
 * Rozstrzygnięcie akcji bojowej jako DANE + to, co ma z niego zagrać.
 *
 * Faza 5A Combat Feel. Dwa typy i jedna czysta funkcja między nimi.
 *
 * ── ⚠ Dlaczego MISS jest tu PIERWSZORZĘDNYM wynikiem ─────────────────────
 * Do 2026-08-23 chybiony cios przeciwnika kończył się **cichym `return`** w
 * pięciu klasach naraz. To była sytuacja stworzona przez Combat v2 — wcześniej
 * wrogowie nie mogli spudłować, bo `overlap` albo zachodził, albo nie, i nie
 * istniał „moment ataku". Skutek: **cofnięcie się przed kłem dzika i to, że
 * dzik w ogóle nie zaatakował, wyglądały identycznie.**
 *
 * ⚠ **Naprawą NIE jest dorzucenie efektu przed te pięć `return`-ów.** To by
 * odtworzyło dokładnie ten dług, którego pozbyła się Faza 2: pięć kopii jednej
 * decyzji. Zamiast tego system akcji **produkuje semantyczne rozstrzygnięcie**,
 * a prezentacja jest jego konsumentem — jednym z kilku możliwych. Ten sam
 * `ActionResolution` da się później podać logowi, AI („mój ostatni cios
 * chybił, zmień dystans") i sieci, bez dotykania niczego tutaj.
 *
 * ⚠ **Ten plik jest Phaser-free i to jest egzekwowane** przez strażnika w
 * `tools/combat_regresja.mjs`. Wykonaniem zajmuje się `core/CombatFx.ts`.
 */

import { COMBAT_FEEDBACK } from "../config/GameConfig";
import type { AttackerRecoil } from "./CombatAction";

/**
 * Co się stało z WYKONANYM atakiem.
 *
 * ⚠ Brak wpisu „nie zaatakowałem" jest zamierzony: `ActionResolution` powstaje
 * wyłącznie wtedy, gdy akcja doszła do rozstrzygnięcia. Odróżnienie „atak nie
 * nastąpił" od „atak nastąpił i chybił" polega właśnie na tym, że w pierwszym
 * przypadku nie ma tego obiektu.
 */
export type ActionOutcome = "miss" | "immune" | "dodge" | "parry" | "block" | "hit";

/**
 * **Jak dobrze atak został WYKONANY — warstwa 2, prostopadła do `ActionOutcome`.**
 *
 * ⚠ **To MUSI być druga oś, a nie nowe człony w `ActionOutcome`** — i decyduje
 * o tym jeden stan: **ześlizg, który został zablokowany tarczą**. Jest
 * jednocześnie `graze` (warstwa 2: napastnik wyprowadził cios nieczysto)
 * i `block` (warstwa 3: obrońca zdążył podstawić tarczę). To są pytania
 * o DWÓCH RÓŻNYCH aktorów; wciśnięcie ich w jeden enum zmusza do wyboru,
 * który z nich zgubić.
 *
 * ⚠ **Dzięki temu siedem istniejących wywołań `reportAttack(…, "miss", …)`
 * nie zmienia znaczenia** — dostają `whiff` i nie wymagają przeglądu.
 *
 * | wartość | znaczenie |
 * |---|---|
 * | `whiff` | warstwa 2 się nie odbyła — atak nie przeszedł GEOMETRII (warstwa 1) |
 * | `fumble` | cel był osiągalny, ale wykonanie było tak złe, że nic nie wyszło |
 * | `graze` | **kontakt nastąpił**, cios był nieczysty (`PROFICIENCY.slipMultiplier`) |
 * | `clean` | normalne wykonanie — i **domyślna, poprawna** wartość dla kanałów spoza warstwy 2 |
 *
 * ⚠ **`clean` przy pocisku i przy kontakcie przez `overlap` to DECYZJA, nie
 * brak.** Tamte kanały nie mają dyskretnej chwili rozstrzygnięcia, więc nie
 * mają jak ogłosić kategorii; dostają wyłącznie skalar `m(P)`.
 */
export type Execution = "whiff" | "fumble" | "graze" | "clean";

/** Ciężar trafienia. ⚠ Wartości pochodzą z `Stamina.impactTier`, nie z osobnej
 *  skali — patrz `COMBAT_FEEDBACK.tiers`. */
export type ImpactTier = "light" | "medium" | "heavy";

/** Jeden rozstrzygnięty atak. Czyste dane — bez sprite'ów, scen i encji. */
export interface ActionResolution {
  /** `id` akcji z `CombatAction`, albo `"player_swing"` dla zamachu gracza. */
  readonly actionId: string;
  readonly outcome: ActionOutcome;
  /**
   * Warstwa 2 — patrz `Execution`. **Pole WYMAGANE**, z tego samego powodu co
   * `attackerRecoil` niżej: opcjonalne sprawiłoby, że „ten kanał świadomie nie
   * ma warstwy 2" i „ktoś nie pomyślał" wyglądają w źródle identycznie.
   */
  readonly execution: Execution;
  /** Obrażenia PO wszystkich redukcjach. 0 dla wszystkiego poza `hit`/`block`. */
  readonly mitigated: number;
  readonly tier: ImpactTier;
  readonly crit: boolean;
  /** Czy celem był gracz. Decyduje o kanałach (kamera trzęsie się tylko jemu). */
  readonly againstPlayer: boolean;
  /**
   * Czy to rozstrzygnięcie ma kopnąć NAPASTNIKIEM — decyzja, nie wniosek.
   *
   * ⚠ **Zastąpiło `attackerOwnsBody` (2026-08-23) i to nie jest zmiana
   * nazwy.** Tamto pole odpowiadało na pytanie o CIAŁO („czy akcja już nim
   * steruje"), a `effectsFor` czytało je jako odpowiedź na pytanie
   * o FEEDBACK („czy kopnąć") — dwie różne własności zwinięte w jeden bit.
   * `spider_web` je rozdzielił: ciałem nie steruje, a kopnięcia w chwili
   * trafienia POCISKU mieć nie może. Własność ciała została po stronie akcji
   * (`CombatAction.ownsBody`) i **do rozstrzygnięcia już nie wchodzi**, bo
   * jedyny konsument, który ją tu czytał, czyta teraz to pole.
   *
   * ⚠ **Pole WYMAGANE, nie opcjonalne, i to jest ta sama decyzja co przy
   * `EnemyConfig.touchDamageType`.** Opcjonalne sprawiłoby, że „ta akcja
   * świadomie nie kopie" i „ktoś nie pomyślał" wyglądają w źródle identycznie
   * — a ten projekt ma już zapisane, ile kosztowała ta pomyłka przy
   * `damageType`.
   *
   * Źródłem jest `CombatAction.attackerRecoil`, nie lista nazw w kodzie.
   */
  readonly attackerRecoil: AttackerRecoil;
  /** Gdzie cios się rozstrzygnął, w świecie. */
  readonly at: { readonly x: number; readonly y: number };
  /** Jednostkowy kierunek ciosu, albo `null` gdy nie ma kierunku. */
  readonly dir: { readonly x: number; readonly y: number } | null;
}

/**
 * Dźwięk jako OPIS, nie jako klucz.
 *
 * ⚠ Rozszerzone z gołego `string` (2026-08-23), bo jeden plik zaczął znaczyć
 * dwie rzeczy: `swing` jest i zamachem gracza, i świstem chybionego ciosu
 * wroga. Rozróżnienie mieszka tutaj, w danych, a nie w wołającym — inaczej
 * każde miejsce grające ten dźwięk musiałoby pamiętać, którym z dwóch jest.
 */
export interface CueSound {
  readonly key: string;
  /** Centy. Ujemne = niżej. */
  readonly detune?: number;
  readonly volumeMul?: number;
  /** Osobny kubełek przepustnicy — patrz `Sfx.PlayOptions`. */
  readonly throttleKey?: string;
}

/**
 * Błysk na trafionym sprisie — OPIS, nie wywołanie.
 *
 * ⚠ **Nie ma tu `restoreTint` i nie może go być.** Ten parametr `flashHit`
 * bywa **funkcją**, czytaną dopiero na końcu błysku — bo cel może w tym czasie
 * zmienić stan (dzik kończący zamach, wściekający się Szary), a wrócić ma
 * tint prawdziwy WTEDY, nie ten sprzed ciosu. Funkcja domykająca się nad encją
 * jest wszystkim, czym ten plik nie jest: nieczysta, niesieciowalna,
 * nieporównywalna. Zostaje po stronie wykonania, jako argument `playCues`.
 */
export interface CueFlash {
  /** `undefined` = domyślna czerwień „oberwałeś" (`COMBAT_FEEDBACK.hitTint`). */
  readonly tint?: number;
  /** `undefined` = `COMBAT_FEEDBACK.hitFlashMs`. */
  readonly ms?: number;
  /** `false` dla celów, które same sterują skalą co klatkę (proceduralny ruch
   *  przeciwników) — konkurencyjny tween byłby nadpisywany i leciał na nic. */
  readonly pop?: boolean;
  readonly popScale?: number;
}

/**
 * Napis nad celem — OPIS, nie wywołanie.
 *
 * ⚠ **Niesie gotowy tekst, nie klucz wyniku.** Wybór słowa należy do tej
 * warstwy, bo to ona zna `outcome`; wykonanie ma zostać głupie i tylko
 * narysować to, co dostało. Ta sama zasada, co przy `CueSound`, gdzie
 * rozróżnienie „zamach czy świst" mieszka w danych, a nie w wołającym.
 */
export interface CueLabel {
  readonly text: string;
  /** Kolor CSS — ten sam, co tint tego wyniku. Napis potwierdza błysk. */
  readonly color: string;
  readonly rise: number;
  readonly duration: number;
  readonly fontSize: number;
  /** Przesunięcie w pionie od punktu rozstrzygnięcia. */
  readonly offsetY: number;
}

/** Co ma zagrać. Opis, nie wykonanie. */
export interface PresentationCues {
  readonly sfx?: CueSound;
  readonly shake?: { readonly ms: number; readonly intensity: number };
  /** Ślad w miejscu, gdzie cios przeszedł — wyłącznie dla `miss`. */
  readonly whiff?: { readonly ms: number; readonly lengthPx: number; readonly color: number; readonly alpha: number };
  readonly flash?: CueFlash;
  readonly label?: CueLabel;
}

/**
 * Napis dla wyniku, który ZATRZYMAŁ cios — albo `undefined`, gdy dany wynik
 * napisu nie ma.
 *
 * ⚠ **Tylko dla gracza.** Wróg nie ma dziś łańcucha obronnego (`Enemy.takeDamage`
 * idzie prosto do pancerza), więc `dodge`/`parry`/`block` po jego stronie nie
 * powstają. Bramka `againstPlayer` jest tu po to, żeby napis nie pojawił się nad
 * stworzeniem, gdyby taki wynik kiedyś zaczął po tamtej stronie powstawać —
 * wtedy to jest DECYZJA do podjęcia, nie zachowanie do odziedziczenia.
 */
function labelFor(r: ActionResolution): CueLabel | undefined {
  if (!r.againstPlayer) return undefined;
  const cfg = COMBAT_FEEDBACK.outcomeLabel;
  const slowo = cfg.text[r.outcome];
  if (!slowo) return undefined;
  return {
    text: slowo.text,
    color: slowo.color,
    rise: cfg.rise,
    duration: cfg.duration,
    fontSize: cfg.fontSize,
    offsetY: cfg.offsetY,
  };
}

/**
 * Napis dla wyniku WARSTWY 2 — ta sama geometria co `labelFor`, inne źródło słowa.
 *
 * ⚠ **Dla dolnej połowy rostera cue NIE JEST prezentacją, tylko JEDYNYM
 * nośnikiem kategorii.** Zmierzone: przy atakach o rzucie ≤5 punktów ześlizg
 * i czyste trafienie dają po zaokrągleniu **tę samą liczbę** (podłoga
 * `Math.max(1, …)` w `DamageResolver`), a `impactTier` schodzi u obu do
 * `light`. Kanał liczby i kanał intensywności są zamknięte — zostaje dźwięk,
 * tint i to słowo.
 *
 * ⚠ **Bramki `againstPlayer` tu NIE MA — świadomie, od 2026-09-02** (warstwa 2
 * po stronie gracza). Stała tu dopóty, dopóki gracz nie mógł niczego wykonać
 * nieczysto, i sąsiedni `labelFor` ma ją nadal z INNEGO powodu: tam chodzi
 * o łańcuch obronny (`dodge`/`parry`/`block`), którego wróg dalej nie ma.
 * Tutaj chodzi o wykonanie ataku, a to potrafią obie strony — i po stronie
 * gracza napis jest wręcz WAŻNIEJSZY, bo bez niego jego własna fuszerka jest
 * nieodróżnialna od pudła geometrycznego (§7).
 */
function executionLabelFor(r: ActionResolution): CueLabel | undefined {
  const cfg = COMBAT_FEEDBACK.outcomeLabel;
  const slowo = COMBAT_FEEDBACK.execution.text[r.execution];
  if (!slowo) return undefined;
  return {
    text: slowo.text,
    color: slowo.color,
    rise: cfg.rise,
    duration: cfg.duration,
    fontSize: cfg.fontSize,
    offsetY: cfg.offsetY,
  };
}

/**
 * Rozstrzygnięcie → co zagrać. Jedno miejsce, w którym ta decyzja zapada.
 *
 * ⚠ **Mignięcie weszło tu w 5B i to była CAŁA reszta Combat v1 w tym kanale.**
 * Do 2026-08-23 `Sfx.play("hurt"/"block"/"dodge"/"parry")` i `flashHit`
 * stały lokalnie w `Player.takeDamage`, `Sfx.play("hit"/"crit")`
 * w `GameScene.damageMatchingEnemies`, a `flashHit` wroga w `Enemy.takeDamage`
 * — czyli **jedna decyzja rozpisana w trzech plikach**, dokładnie ten dług,
 * którego pozbyła się Faza 2. Subtelność `restoreTint` przeżyła przeprowadzkę
 * w całości: nie ma jej w danych, jest argumentem `playCues` (patrz `CueFlash`).
 *
 * ⚠ **Popup obrażeń NIE wszedł i to jest decyzja.** Niesie liczbę, krytyk,
 * typ obrażeń i skuteczność wobec pancerza — czyli cztery pola, z których
 * `ActionResolution` ma dziś dwa. Dołożenie brakujących „bo pasuje" jest
 * dokładnie tym, czego zabrania reguła o martwych slotach (`src/core/CLAUDE.md`);
 * popup przeprowadza się razem ze swoim konsumentem albo wcale.
 *
 * ⚠ **Hit-stop krytyka też NIE — i to z mocniejszego powodu.** Woła
 * `physics.world.pause()`, więc jest STANEM GRY, nie prezentacją (audyt §5.6),
 * i wpisany tutaj trafiłby po złej stronie podziału. Zostaje
 * w `GameScene.critHitStop` do osobnej decyzji o dylatacji czasu na warstwie
 * renderu.
 *
 * ⚠ **`immune` celowo NIE gra niczym.** Nietykalność po uniku ma być cicha:
 * gracz właśnie dostał informację „przewrót zadziałał", a drugi sygnał w tym
 * samym miejscu tylko ją rozmydla.
 */
export function cuesFor(r: ActionResolution): PresentationCues {
  switch (r.outcome) {
    case "immune":
      return {};

    case "miss": {
      const w = COMBAT_FEEDBACK.whiff;
      // ⚠ **`miss` niesie DWA różne zdarzenia i rozdziela je `execution`.**
      //  • `whiff`  — źle się ustawiłeś. Pozycja mówi sama, napisu nie ma.
      //  • `fumble` — stałeś dobrze, cios wyszedł źle. **Napis jest WYMAGANY**
      //    (§7): bez niego „uskoczyłem" i „on spudłował" wyglądają identycznie,
      //    a to jest największe ryzyko ODBIORCZE całej warstwy 2.
      //
      // ⚠ **Fumble świadomie zostaje przy TYM SAMYM świście.** Nowy wpis
      // w `SOUNDS` przesuwa strumień RNG generatora `tools/gen_audio.py`
      // i po cichu zmienia każdy plik poniżej (`combat_feel_5b.md` §9) —
      // to regeneracja audio, nie doklejka. Rozróżnienie niesie `detune`,
      // dokładnie tak, jak świst już dziś odróżnia się od zamachu.
      const f = COMBAT_FEEDBACK.execution.fumble;
      const fumble = r.execution === "fumble";
      return {
        sfx: {
          key: w.sfx,
          detune: w.sfxDetune + (fumble ? f.sfxDetuneShift : 0),
          volumeMul: w.sfxVolumeMul,
          throttleKey: w.sfxThrottleKey,
        },
        whiff: { ms: w.ms, lengthPx: w.lengthPx, color: fumble ? f.tint : w.color, alpha: w.alpha },
        label: fumble ? executionLabelFor(r) : undefined,
      };
    }

    // ⚠ Unik i parowanie NIE dostają czasu ani skoku z tiera — i to nie jest
    // przeoczenie. Tier mówi, ile cios WAŻYŁ; przy uniku i parowaniu nie
    // przeszło nic, więc jedyną informacją jest KOLOR. `flashHit` jest
    // jedynym błyskiem, jaki ta gra rysuje na graczu, więc jego barwa jest
    // całym słownikiem tego kanału.
    case "dodge":
      return { sfx: { key: "dodge" }, flash: { tint: COMBAT_FEEDBACK.dodgeTint }, label: labelFor(r) };

    case "parry":
      return { sfx: { key: "parry" }, flash: { tint: COMBAT_FEEDBACK.parryTint }, label: labelFor(r) };

    case "block": {
      // ⚠ Blok ogłasza się ZAMIAST zwykłego trafienia, nie obok niego — dwa
      // dźwięki naraz zlałyby się w jeden i gracz usłyszałby wyłącznie to, że
      // oberwał, czyli dokładnie tę informację, której tarcza ma zaprzeczyć.
      // Tier ma, bo przez tarczę COŚ przeszło i `mitigated` już to rozróżnia:
      // zatrzymanie szarży dzika i odbicie królika to dwa różne wydarzenia.
      const t = COMBAT_FEEDBACK.tiers[r.tier];
      return {
        sfx: { key: "block" },
        flash: { tint: COMBAT_FEEDBACK.blockTint, ms: t.flashMs, popScale: t.popScale },
        label: labelFor(r),
      };
    }

    case "hit": {
      const t = COMBAT_FEEDBACK.tiers[r.tier];
      // ⚠ Kamera trzęsie się WYŁĄCZNIE graczowi. Wróg oberwany nie jest
      // powodem, żeby ruszać widokiem — to jego mignięcie i popup niosą.
      if (!r.againstPlayer) {
        // ── Wróg oberwał ────────────────────────────────────────────────
        // ⚠ **Bez tiera, świadomie.** Skala `Stamina.impactTier` jest
        // kalibrowana progami z `STAMINA.heavyHit` pod obrażenia PRZYJMOWANE
        // przez gracza (light ≤9, medium 10–20, heavy ≥21). Postać na 1.
        // poziomie bije za 3–5, więc po tej stronie tier byłby stale `light`
        // i „różnicowałby" jednym poziomem. Wróg zostaje na stałym błysku,
        // jaki miał przed 5B — a druga skala, liczona z ułamka HP celu, jest
        // zakazana (patrz `COMBAT_FEEDBACK.tiers`).
        //
        // ⚠ `pop: false` — przeciwnicy sterują skalą co klatkę
        // (`updateMotionFx`), więc konkurencyjny tween byłby nadpisywany.
        //
        // ── Ześlizg GRACZA (warstwa 2, od 2026-09-02) ────────────────────
        // ⚠ **Barwa, przestrojenie i napis — ale `pop` zostaje WYŁĄCZONY.**
        // Po stronie gracza ześlizg ma dokładnie ten sam problem co po stronie
        // wroga (patrz niżej): różnica w liczbie bywa niewidoczna, więc cue
        // jest nośnikiem kategorii, nie jej ozdobą. Ale `popScale` z gałęzi
        // gracza tu NIE WCHODZI — skala przeciwnika jest przepisywana co
        // klatkę, więc tween i tak by przepadł, a `pop: false` jest jedyną
        // wartością, która o tym mówi prawdę.
        if (r.execution === "graze") {
          const g = COMBAT_FEEDBACK.execution.graze;
          return {
            sfx: { key: r.crit ? "crit" : "hit", detune: g.sfxDetuneShift, volumeMul: g.sfxVolumeMul },
            flash: { tint: g.tint, ms: g.flashMs, pop: false },
            label: executionLabelFor(r),
          };
        }
        return { sfx: { key: r.crit ? "crit" : "hit" }, flash: { pop: false } };
      }
      // ── Ześlizg: KONTAKT nastąpił, ale cios był nieczysty ────────────────
      // ⚠ **Ma własny tint i własne przestrojenie, bo dwa pozostałe kanały są
      // ZAMKNIĘTE.** Liczba: ześlizg i czyste trafienie schodzą po zaokrągleniu
      // do tej samej wartości dla każdego ataku o rzucie ≤5. Intensywność:
      // `impactTier` daje `light` w obu przypadkach na CAŁYM rosterze (próg
      // `STAMINA.heavyHit.thresholdDamage` = 9). Zostaje dźwięk, barwa i napis.
      //
      // ⚠ **Bez trzęsienia kamerą i bez skoku** — ześlizg jest z definicji
      // nie-zdarzeniem mechanicznym (`hitCost` = 0, zamach gracza leci dalej),
      // więc kanały zarezerwowane dla ciężaru ciosu muszą milczeć.
      if (r.execution === "graze") {
        const g = COMBAT_FEEDBACK.execution.graze;
        return {
          sfx: { key: t.sfx, detune: t.sfxDetune + g.sfxDetuneShift, volumeMul: g.sfxVolumeMul },
          flash: { tint: g.tint, ms: g.flashMs, popScale: g.popScale },
          label: executionLabelFor(r),
        };
      }
      const shake = t.shakeMs > 0 ? { ms: t.shakeMs, intensity: t.shakeIntensity } : undefined;
      return {
        sfx: { key: t.sfx, detune: t.sfxDetune },
        shake,
        flash: { ms: t.flashMs, popScale: t.popScale },
      };
    }
  }
}
