import {
  MERCHANT,
  BLACKSMITH,
  PEASANT,
  MILLER,
  ELDER,
  FATHER,
  MOTHER,
  HERBALIST,
  ZOFIA,
  HANNA,
  WITEK,
  KUBA,
  SULISLAW,
  AGATA,
  DOBRAWA,
  SOBEK,
  GNIEWKO,
  ANNA,
  PATRYCZEK,
  INNKEEPER,
  ADRIAN,
  CIECHAN,
  BOLKO,
  ZBYCH,
} from "../config/GameConfig";
import type { ItemId } from "./Items";

/**
 * The talkable NPCs, as one registry.
 *
 * Everything used to reach for the global `MERCHANT` const — the dialogue hub,
 * all three views, the entity and the scene. That was fine while there was
 * exactly one shopkeeper and quietly wrong the moment there were two: the shop
 * would have shown the Hunter's stock while standing at the forge.
 *
 * So an NPC is now data looked up by id, and the id travels with the
 * `interactableNearby` event (as its `key` — see `core/Interactables.ts`).
 * Adding a third is a config block plus a spawn point.
 */
export type NpcId =
  | "hunter"
  | "blacksmith"
  | "peasant"
  | "miller"
  | "elder"
  | "father"
  | "mother"
  | "herbalist"
  | "widow"
  // `docs/wioska_plan.md` §6's "rozmowa" tier — the eight residents who had
  // something to say. Its "tło" tier (children, farmhands, the apprentice) is
  // deliberately absent: an NPC with nothing to say costs more than no NPC,
  // since it still eats a slot in the interact-range audit and teaches the
  // player that talking to people isn't worth the keypress.
  | "hanna"
  | "witek"
  | "kuba"
  | "sulislaw"
  | "agata"
  | "dobrawa"
  | "sobek"
  | "gniewko"
  // Dopisana wprost przez autora (2026-08-14), poza rozpiska §6.
  | "anna"
  // Owalnica (2026-10-09): karczmarz i czeladnik kowala — obaj mają co powiedzieć,
  // więc wchodzą mimo reguły „tło nie dochodzi" (czeladnik był tam jako Bolko).
  | "innkeeper"
  | "adrian"
  | "patryczek"
  // Drwale (K5 Zagajów, 2026-10-10): ojciec z synami — wybór autora.
  | "ciechan"
  | "bolko"
  | "zbych";

/**
 * One thing you can ask an NPC about.
 *
 * The point of these is that a villager is a *conversation*, not a shop with a
 * greeting attached — five of the people on the village map exist purely to be
 * talked to, and until now "talking to" them meant reading one sentence.
 *
 * `after` is what makes the set a chain rather than a menu: a topic stays
 * hidden until every id it names has been asked, **anywhere**. The asked-set is
 * global (see `core/Dialogue`), so the Hunter naming the Szary is what lets you
 * raise him with the Sołtys — you carry knowledge between people, which is the
 * only cheap way a cast this small can feel like it knows things you don't.
 */
export interface Topic {
  id: string;
  /** The question, phrased as the player would ask it. */
  q: string;
  /** The answer. */
  a: string;
  /** Hidden until all of these topic ids have been asked (of anyone). */
  after?: readonly string[];
  /** Hidden until this quest is `completed`. */
  requiresQuest?: string;
  /**
   * Hidden until the player has PICKED this herb species at least once.
   *
   * The third gate, and the only one keyed to something done in the world
   * rather than to another conversation. It exists because the herbs are real
   * plants and the point of them is that knowledge travels the way it does in
   * life: you find the thing, you bring it to someone who knows, and *then*
   * you learn what it is. Opening all five of Dorota's plant topics at once
   * would turn that into a catalogue — five rows to click through, none of
   * which you had any reason to ask about.
   */
  requiresHerb?: string;
  /**
   * ⭐ **Grupa tematów** (D14, autor 2026-10-12: „u zielarki: powiedz mi więcej
   * o ziołach → powiedz mi więcej o [ziele]; na dole »Zmień temat«"). Klucz
   * w `TOPIC_GROUPS` (`GameConfig`). Temat z grupą nie stoi w korzeniu
   * rozmowy — liczy się w wierszu grupy, a pokazuje po wejściu do niej.
   *
   * ⚠ Grupa = tematy RÓWNOLEGŁE (wiele niezadanych naraz, jak zioła), nie
   * łańcuch `after` — łańcuch prowadzi rozmowa sama, kontynuacją bieżącego
   * tematu. ⚠ Literówka ukryłaby temat w nieistniejącej grupie na zawsze —
   * pilnuje `R6`/`R7` w `tools/rozmowy_przymiar.mjs`.
   */
  group?: string;
}

export interface NpcDef {
  id: NpcId;
  name: string;
  /** Fallback line, used when no state-dependent greeting matches. */
  greeting: string;
  /**
   * State-dependent lines, checked most-specific-first by
   * `NpcDialog.pickGreeting`. Optional: an NPC with no quests and nothing to
   * teach (the smith, for now) has no states to react to.
   */
  greetings?: Readonly<Record<string, string>>;
  /** What he sells. May be empty for a talk-only NPC. */
  stock: readonly ItemId[];
  /**
   * The workmanship range this vendor's shelf is stocked at, `[min, max]`.
   * Omitted means everything is Zwykła.
   *
   * **This is characterisation, not a random roll**, and it is the cheapest
   * content in the system: a village smith who mostly forges mill parts and
   * horseshoes turns out mediocre blades, while the Hunter tans his own leather
   * and sells it better than anyone. The player learns who to go to for what
   * without a line of dialogue explaining it.
   *
   * The actual level per item is DERIVED from (vendor, item) — see
   * `vendorQuality`. It must never be rolled at display time: `ShopPanel.show()`
   * rebuilds the stock on every open, so a roll would let the player walk out
   * and back in until a good one appeared.
   */
  stockQuality?: Readonly<Partial<Record<"weapon" | "armor", readonly [number, number]>>>;
  /**
   * Pojedyncze sztuki, których stan jest USTALONY, zamiast wyliczony z hasza
   * `stockQuality`.
   *
   * ⚠ **To nie jest obejście hasza, tylko doprecyzowanie tej samej
   * charakterystyki.** Półka Kowala jest z drugiej ręki — mówi to wprost jego
   * własny temat `bron_skad` (wędrowni kupcy płacą mu żelazem, ludzie
   * przynoszą znaleziska) — a towar z drugiej ręki nie jest w jednakowym
   * stanie. Hasz odpowiada „jaki mniej więcej towar trzyma ten człowiek";
   * to pole odpowiada „a ta konkretna sztuka jest wytłuczona", i to jest
   * rzecz, którą projektant wie, a hasz nie.
   *
   * ⚠ **Zaciskane do zadeklarowanego `stockQuality`.** Wpis poza zakresem
   * kupca łamałby dokładnie tę charakterystykę, którą zakres niesie — wiejski
   * kowal nie zacznie sprzedawać Mistrzowskiej roboty przez jedną linijkę
   * w tabeli. Zaciskanie jest po to, żeby to było niemożliwe, a nie po to,
   * żeby było wygodnie.
   *
   * Używać oszczędnie: to jest lista utrzymywana ręcznie, więc każda pozycja
   * musi mieć powód, który da się wypowiedzieć.
   */
  stockQualityFor?: Readonly<Partial<Record<ItemId, number>>>;
  /** Quest ids he gives out and takes back. */
  quests: readonly string[];
  /** What you can ask him about. Optional: an NPC with none simply shows no
   *  "Rozmowa" row in the dialogue hub. */
  topics?: readonly Topic[];
  interactRange: number;
  scale: number;
  /** Tint over the shared placeholder portrait, or null for none. Used only
   *  when `portraitTexture` is absent or fails to load. */
  tint: number | null;
  /** This NPC's own texture key, if it has bespoke art (e.g. the Kowal's
   *  `ASSETS.kowal.key`). Falls back to the shared NPC.png placeholder,
   *  tinted, when unset or not present in the texture cache. */
  portraitTexture?: string;
  /** Looping idle animation key (e.g. the Kowal's `"kowal-idle"`, registered
   *  in `Animations.ts`), used instead of a static `portraitTexture` frame
   *  when both the anim and its spritesheet texture loaded successfully.
   *  Unset for every NPC without a directional/idle sheet of their own. */
  idleAnimKey?: string;
}

export const NPCS: Readonly<Record<NpcId, NpcDef>> = {
  hunter: MERCHANT,
  blacksmith: BLACKSMITH,
  peasant: PEASANT,
  miller: MILLER,
  elder: ELDER,
  father: FATHER,
  mother: MOTHER,
  herbalist: HERBALIST,
  widow: ZOFIA,
  hanna: HANNA,
  witek: WITEK,
  kuba: KUBA,
  sulislaw: SULISLAW,
  agata: AGATA,
  dobrawa: DOBRAWA,
  sobek: SOBEK,
  gniewko: GNIEWKO,
  anna: ANNA,
  patryczek: PATRYCZEK,
  innkeeper: INNKEEPER,
  adrian: ADRIAN,
  ciechan: CIECHAN,
  bolko: BOLKO,
  zbych: ZBYCH,
};

/** Every NPC, in the order they should be placed/considered. */
export const NPC_IDS = Object.keys(NPCS) as NpcId[];

/* ⛔ USUNIĘTE 2026-09-08: `getNpc(id)` — opakowanie na `NPCS[id]` bez ani
   jednego czytelnika w `src/`, `tools/` czy `docs/`. Cały projekt indeksuje
   `NPCS` wprost (`NPCS[it.interactKey as NpcId]`, `NPCS[npcId]`), więc ta
   funkcja była drugim, nieużywanym adresem do tej samej tablicy. */
