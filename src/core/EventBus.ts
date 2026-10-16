import Phaser from "phaser";

/**
 * A single global event emitter used to decouple gameplay (GameScene) from the
 * HUD (UIScene). Keeps UI logic out of entity code.
 */
export const GameEvents = new Phaser.Events.EventEmitter();

export const EVENT = {
  /** payload: { hp: number, maxHp: number } */
  playerHpChanged: "player-hp-changed",
  /** payload: none — player reached 0 hp */
  playerDied: "player-died",
  /** payload: none — player resurrected and is playable again */
  playerRespawned: "player-respawned",
  /** payload: none — player took a HEAVY impact (Stamina.impactTier === "heavy").
   *  GameScene cancels `pendingSwing` on this, same as Unik/Szarża abandoning
   *  a swing — a heavy telegraphed hit taken mid-commitment costs the blow. */
  playerHeavyHit: "player-heavy-hit",
  /** payload: { gold } — what dying cost, so the death screen can say it out loud */
  deathPenalty: "death-penalty",
  /** payload: { remaining: number } — an enemy died */
  enemyKilled: "enemy-killed",
  /** payload: { level, xp, xpToNext, skillPoints, totalXp } */
  xpChanged: "xp-changed",
  /** payload: { level, skillPoints, gained } — fired once per level gained */
  leveledUp: "leveled-up",
  /** payload: { strength, vitality, conditioning, agility, damage, maxHp, maxStamina, critChance, skillPoints } */
  attributesChanged: "attributes-changed",
  /** payload: { delta } — Witalność raised max HP; grant the player the headroom */
  maxHpGranted: "max-hp-granted",
  /**
   * payload: { stamina, maxStamina, state } — pasek wysiłku się ruszył.
   *
   * ⚠ **Emitowany PRZY ZMIANIE, nie co klatkę.** Regeneracja rusza pasek
   * w każdej klatce, więc `Stamina` sam dławi ten sygnał do zmian widocznych
   * (≥0,5 pkt) plus każdą zmianę STANU — inaczej HUD przerysowywałby się
   * 60 razy na sekundę przez całą grę.
   */
  staminaChanged: "stamina-changed",
  /** payload: { amount } — a potion or similar was used; restore player HP */
  healRequested: "heal-requested",
  /** payload: { amount, durationMs, itemId } — food was eaten; heal gradually, out of combat only */
  healOverTimeRequested: "heal-over-time-requested",
  /** payload: none — a timed effect appeared or expired; re-read the Buffs snapshot */
  buffsChanged: "buffs-changed",
  /** payload: { id } — the player asked to cast an ability (UI → gameplay) */
  abilityRequested: "ability-requested",
  /**
   * payload: none — gracz chce zamienić zestaw broni z HUD-u (UI → rozgrywka,
   * 2026-10-12). Rozstrzyga `GameScene` (cios w locie, odliczanie, śmierć),
   * bo przycisk nie wie, co dzieje się na scenie — patrz `WEAPON_SWAP`.
   */
  weaponSwapRequested: "weapon-swap-requested",
  /**
   * Celowanie kierunkowe umiejętności — cztery zdarzenia, jeden cykl życia
   * pointera (prototyp `Szerokiego cięcia`, 2026-08-23).
   *
   * ⚠ **Niosą wyłącznie KIERUNEK, nigdy punktu** — i to jest cały powód, dla
   * którego nie ma tu żadnej konwersji współrzędnych. Obie kamery (świata i UI)
   * skalują x i y jednakowo i nie obracają, więc znormalizowany wektor
   * przeciągnięcia liczony w przestrzeni UI jest **tym samym wektorem**
   * w świecie. Punkt wymagałby `getWorldPoint` i znajomości zoomu; kierunek
   * nie wymaga niczego.
   *
   * ⚠ **Sesja celowania NIC nie kosztuje.** Koszt i cooldown płaci dopiero
   * `abilityAimCommitted`, po stronie sceny — anulowana sesja ma być darmowa.
   *
   * payload: { id }
   */
  abilityAimStarted: "ability-aim-started",
  /**
   * payload: { dirX, dirY, overCancel } — palec przekroczył deadzone.
   *
   * `overCancel` = palec wrócił nad przycisk, więc PUSZCZENIE go anuluje.
   * Niesione osobno, bo podgląd w świecie musi mówić to samo, co znak ✕ na
   * przycisku — dwa niezależne odczyty tego samego stanu rozjechałyby się.
   */
  abilityAimMoved: "ability-aim-moved",
  /** payload: { dirX, dirY } — puszczenie palca. `null` = tapnięcie bez
   *  przeciągnięcia, czyli „w aktualny zwrot postaci". */
  abilityAimCommitted: "ability-aim-committed",
  /**
   * payload: { screenX, screenY } — tryb „dotknij, potem cel" (`Settings.aimMode
   * = "tap"`, 2026-10-14): gracz wskazał PUNKT na ekranie (piksele płótna,
   * prosto z `pointer.x/y`). ⚠ Tu, w odróżnieniu od przeciągnięcia, potrzebny
   * jest PUNKT, nie kierunek — więc przelicza go SCENA GRY swoją kamerą
   * (`getWorldPoint`, kamera ściśnięta o sin θ pod widok 3D — punkt na gruncie
   * trafia tam, gdzie widać go w 3D). UI nie zna kamery świata i nie ma poznać.
   * Zatwierdza sesję tak samo jak `abilityAimCommitted` z przeciągnięciem.
   */
  abilityAimPointed: "ability-aim-pointed",
  /** payload: none — sesja przerwana: **puszczenie nad ✕**, palec poza oknem,
   *  zamknięcie sceny, śmierć. Zero kosztu, zero cooldownu. */
  abilityAimCancelled: "ability-aim-cancelled",
  /** payload: none — an ability's cooldown or unlock state moved */
  abilitiesChanged: "abilities-changed",
  /**
   * Gracz przełożył coś na pasku umiejętności.
   *
   * ⚠ **Osobne od `abilitiesChanged` wyłącznie po to, żeby dało się na tym
   * autozapisywać.** `abilitiesChanged` leci także przy każdym starcie
   * cooldownu, więc podpięcie zapisu pod nie znaczyłoby zapis przy każdym
   * użyciu umiejętności. Układ paska zmienia się rzadko i jest decyzją, więc
   * zasługuje na własny sygnał.
   */
  abilityLoadoutChanged: "ability-loadout-changed",
  /** payload: { ids } — a level-up granted these abilities */
  abilitiesUnlocked: "abilities-unlocked",
  /**
   * payload: { kind: InteractKind | null, key: string | null, label: string,
   * enabled: boolean } — what the player is standing next to changed.
   *
   * ONE event for every kind of `E`-interaction, not one per kind. It used to
   * be `merchantNearby` and `campfireNearby`, decided by two independent
   * proximity loops, and nothing but hand-measured map geometry stopped both
   * from being true at once — see `core/Interactables.ts` for why that stopped
   * scaling. `null` means "nothing in range".
   *
   * `label`/`enabled` are GameScene's answer to "what would this DO and could
   * it succeed right now" (e.g. "Upiecz Surowe mięso (3)" vs "Ognisko —
   * brak: Surowe mięso"), computed once here rather than re-derived by
   * whatever draws the button — see `ContextAction`, the sole consumer.
   * Meaningless when `kind` is null.
   */
  interactableNearby: "interactable-nearby",
  /**
   * payload: { id: NpcId } — the player TAPPED this villager directly and is
   * close enough to talk.
   *
   * Separate from `interactableNearby`, which only reports what you happen to
   * be standing beside: this one is an intent, already range-checked against
   * that specific NPC by GameScene. It exists because the conversation window
   * lives in UIScene while the tapped sprite lives in GameScene, and the two
   * only ever speak through this bus.
   */
  npcTalkRequested: "npc-talk-requested",
  /**
   * payload: none — activate whatever `interactableNearby` last reported
   * (the ContextAction button, or the `E` key — both fire this and nothing
   * else). GameScene resolves it against its own `nearby`, the same object
   * the label was computed from, so the two can never disagree about what
   * "activate" means right now.
   */
  contextActionRequested: "context-action-requested",
  /** payload: none — herb regrowth bookmarks moved (`core/Gathering`); exists
   *  so the autosave hangs off it like every other persisted singleton's */
  gatheringChanged: "gathering-changed",
  /** payload: none — ustawienia urządzenia (`core/Settings`) się zmieniły.
   *  ⚠ Celowo NIE podpięte pod autozapis: ustawienia nie należą do postaci. */
  settingsChanged: "settings-changed",
  /** payload: { slots: (InventorySlot | null)[], gold: number } */
  inventoryChanged: "inventory-changed",
  /** payload: { weapon, head, chest, legs, boots } (each ItemId | null) */
  equipmentChanged: "equipment-changed",
  /**
   * payload: { bag1, bag2, bag3, bag4 } (each ItemInstance | null) — a
   * container was worn/removed in one of the four bag slots.
   *
   * Its own event rather than riding `equipmentChanged`, for the same reason
   * `attackVariantChanged` is separate: the listeners differ (only the bag
   * row redraws), and folding it in would mean every equipment-changed
   * listener re-deriving "did a BAG change, or just a ring" for no reason.
   * The capacity change itself rides on `inventoryChanged`, already fired by
   * `Inventory.setCapacity` — this event is only about the four cells' icons.
   */
  bagsChanged: "bags-changed",
  /**
   * payload: { index: number } — the player picked a different way of using
   * the equipped weapon (cięcie ↔ pchnięcie).
   *
   * Its own event rather than riding `equipmentChanged`: nothing about the
   * EQUIPMENT changed, and the listeners are different (only the variant bar
   * cares, while every panel in the game redraws on an equipment change).
   */
  attackVariantChanged: "attack-variant-changed",
  /** payload: { status: Record<QuestId, QuestStatus> } — a quest was accepted/completed */
  questsChanged: "quests-changed",
  /**
   * payload: { id: QuestId | null } — which quest the HUD tracker follows
   * changed (accepted a new one, finished the tracked one, or picked one by
   * hand in the journal). See `core/TrackedQuest`.
   *
   * ⚠ **Its own event rather than riding `questsChanged`, for the same reason
   * `abilityLoadoutChanged` is separate from `abilitiesChanged`**:
   * `questsChanged` fires on every pickup and every kill, so hanging the
   * tracker's redraw on it alone would be fine, but hanging the AUTOSAVE on
   * it would mean writing the save file for a preference that changes maybe
   * a dozen times a run.
   */
  trackedQuestChanged: "tracked-quest-changed",
  /**
   * payload: none — something asked for the quest journal (today: tapping the
   * HUD tracker). An event because the tracker widget and `PlayerPanel` are
   * siblings in `UIScene` with no reference to each other, exactly like
   * `loadGameRequested`.
   */
  questJournalRequested: "quest-journal-requested",
  /**
   * payload: { tab: "character" | "inventory" | "quests" | "map" | "save" } —
   * coś z HUD-u prosi o panel gracza na konkretnej zakładce (dziś: tapnięcie
   * odznaki poziomu → POSTAĆ). Zdarzenie z tego samego powodu co
   * `questJournalRequested`: `HUD` i `PlayerPanel` są rodzeństwem w `UIScene`.
   */
  playerPanelRequested: "player-panel-requested",
  /** payload: { learned: SkillId[] } — the player learned a skill */
  skillsChanged: "skills-changed",
  /**
   * payload: { region: string; cells: number[] | null } — odkrył się teren
   * (`Exploration`, 2026-10-14). `cells` = indeksy NOWYCH komórek obszaru;
   * `null` = obszar zmienił się cały (wczytanie zapisu, `reset`, `revealAll`)
   * i rysunek trzeba odbudować od zera.
   *
   * ⚠ Leci kilka razy na sekundę marszu przez nieznany teren — słuchacz
   * dorysowuje tylko podane komórki, ⛔ nie przebudowuje całej mapy.
   */
  explorationChanged: "exploration-changed",
  /**
   * payload: { step: string | null; text: string } — krok samouczka walki
   * u Patryczka (`COMBAT_TUTORIAL`, 2026-10-15). Liczy go `GameScene` z żywego
   * stanu (dystans, zwrot, trafienia); UI tylko pokazuje tekst i podświetla
   * przycisk ataku. `null` = samouczek nieczynny. Leci wyłącznie przy ZMIANIE.
   */
  tutorialStep: "tutorial-step",
  /**
   * payload: { rank: number } — gracz wykupił rangę treningu ciężkiego
   * pancerza (`ArmorTraining`, Model D / `OI-103`).
   *
   * ⚠ Niesie LICZBĘ rang, nie listę — rangi są liniowe (II wymaga I), więc
   * licznik jest pełnym stanem.
   */
  armorTrainingChanged: "armor-training-changed",
  /**
   * payload: `{ proficiency: number; relief: number }` — gracz zdobył PUNKT
   * umiejętności władania tarczą (`core/ShieldSkill.ts`, `T-7`).
   *
   * ⚠ **Leci wyłącznie przy zdobyciu punktu, nie przy każdym bloku.** Praktyka
   * dolewa się do bufora kilka razy na walkę; zdarzenie na każdy blok
   * ciągnęłoby za sobą HUD, panele i autozapis w środku wymiany ciosów. Ta
   * sama zasada, co przy `Equipment.wearShield` (emisja tylko przy ROZBICIU).
   */
  shieldSkillChanged: "shield-skill-changed",
  /**
   * payload: { proficiency: Partial<Record<WeaponFamily, number>> } — biegłość
   * gracza w którejś rodzinie broni się zmieniła (§14, warstwa 2 po stronie
   * gracza).
   *
   * ⚠ Niesie CAŁĄ migawkę, nie deltę — panel rozwoju i tak rysuje wszystkie
   * rodziny naraz, a zapis potrzebuje kompletu.
   */
  weaponProficiencyChanged: "weapon-proficiency-changed",
  /**
   * payload: `{ family: WeaponFamily; points: number }` — gracz zdobył PUNKT
   * biegłości (nie: praktykę) w tej rodzinie broni.
   *
   * ⚠ **Osobne zdarzenie od `weaponProficiencyChanged`, i to celowo.** Tamto
   * leci także przy wczytaniu zapisu, resecie i ustawieniu wartości narzędziem
   * — czyli w sytuacjach, w których komunikat „+1 Władanie bronią" byłby
   * kłamstwem. To leci **wyłącznie**, gdy punkt naprawdę przybył z praktyki.
   */
  weaponPracticeGained: "weapon-practice-gained",
  /**
   * payload: `{ family: WeaponFamily; cap: number; reached: boolean }` —
   * praktyka w tej rodzinie **PRZEPADA**, bo `P` stoi na twardym suficie rangi
   * (§34.3). `reached: true` leci raz, w chwili dojścia do sufitu;
   * `reached: false` leci przy każdym kolejnym ciosie zmarnowanym na suficie
   * (odbiorca dławi — patrz `ui/PracticeToast`).
   *
   * ⚠ **Powiadomienie jest OBOWIĄZKOWYM elementem UI, nie ozdobą** (§34.7,
   * kontrakt §34.10 poz. 12). Bez niego trening po osiągnięciu progu jest
   * czasem straconym, o którym gracz dowiaduje się dopiero, jeśli sam z siebie
   * otworzy panel BROŃ — a §34.3 wprost zabrania bankowania tej praktyki, więc
   * cisza w tym miejscu kosztuje realny postęp.
   *
   * ⚠ **Osobne zdarzenie od `weaponPracticeGained`** — tamto ogłasza ZYSK
   * i leci wyłącznie przy realnym punkcie. To ogłasza STRATĘ i leci dokładnie
   * tam, gdzie punktu NIE BĘDZIE.
   */
  weaponCapReached: "weapon-cap-reached",
  /** payload: { asked: string[] } — a conversation topic was asked for the
   *  first time, which can unlock topics at OTHER NPCs (see `core/Dialogue`) */
  dialogueChanged: "dialogue-changed",
  /**
   * payload: { slot: SlotId } — the player asked to load a save from inside the
   * game (the PlayerPanel "ZAPIS" tab).
   *
   * An event rather than a direct call because the panel lives in UIScene and
   * the thing that has to happen is a **GameScene restart** with new scene data
   * — the same restart a portal does. UI reaching across to restart another
   * scene is exactly the coupling every other panel here avoids.
   */
  loadGameRequested: "load-game-requested",
  /**
   * payload: none — the player asked to leave the active session for the
   * title screen (the PlayerPanel "ZAPIS" tab's "Zapisz i wyjdź do menu" button).
   *
   * Same reasoning as `loadGameRequested`: the panel lives in UIScene, and the
   * thing that has to happen — a guaranteed autosave, then stopping UIScene,
   * then starting TitleScene — is scene management that belongs to GameScene,
   * not to a widget reaching across scenes on its own.
   */
  returnToTitleRequested: "return-to-title-requested",
  /**
   * „Zapisz i wyjdź z gry" (zakładka ZAPIS, wyłącznie w aplikacji — przeglądarka
   * nie zamknie własnej karty). Scena gry robi gwarantowany autozapis, potem
   * `App.exitApp()`; ta sama droga przez `GameScene`, co powrót do menu.
   */
  exitGameRequested: "exit-game-requested",
} as const;
