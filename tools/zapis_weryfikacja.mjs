/**
 * Przymiar ZAPISU (`src/core/Save.ts`) — `OI-50`.
 *
 * ── Po co ─────────────────────────────────────────────────────────────────
 * Do dziś **najlepiej przestrzegana reguła zapisu nie miała ani jednej
 * asercji** (`docs/systemy/save.md`, `OI-50`). To jest dokładnie ten rodzaj
 * modułu, w którym błąd nie krzyczy: `save()` i `load()` to dwie ręcznie
 * utrzymywane listy pól, a pole dopisane do jednej, a zapomniane w drugiej,
 * nie psuje ani `tsc`, ani buildu — po prostu któryś fragment postaci cicho
 * nie wraca po wczytaniu.
 *
 * ⚠ **To NIE jest głos w żadnej sprawie projektowej.** Sprawdza wyłącznie,
 * czy kod robi to, co o sobie mówi. Od 2026-10-11 (`OI-51`) mówi o sobie:
 * niezgodny zapis się MIGRUJE (§G), a czego build nie umie wczytać, tego nie
 * niszczy — idzie do kopii przed nadpisaniem (§H).
 *
 * ── Co tu jest ────────────────────────────────────────────────────────────
 *   §A  pełny obieg: bogata postać → zapis → WYCZYSZCZENIE → wczytanie
 *   §B  kontrakt wersji: zapis z NOWSZEJ / zbyt starej wersji odrzucony i NIE TKNĄŁ stanu
 *   §C  kompletność: każde pole `SaveData` jest i pisane, i czytane
 *   §D  wstecz: zapis bez pól opcjonalnych wczytuje się (niezmiennik CLAUDE.md)
 *   §E  sloty: klucze i izolacja
 *   §F  wyciszenie: `load` nie autozapisuje w trakcie odtwarzania
 *   §G  łańcuch migracji: bez luk dla bieżącej wersji + sztuczny łańcuch
 *   §H  kopie: niewczytywalny zapis NIE ginie przy nadpisaniu ani „Nowej grze"
 *
 * ── Dlaczego JEDEN bundel ─────────────────────────────────────────────────
 * ⚠ Ta sama pułapka, co `import()` w konsoli przeglądarki (`src/core/CLAUDE.md`):
 * zbudowanie `Save` i `Inventory` osobnymi wejściami dałoby **drugi graf
 * modułów**, czyli inne instancje singletonów. Test „złoto wróciło"
 * przechodziłby wtedy na kopii, której `Save` w ogóle nie widzi.
 *
 *   node tools/zapis_weryfikacja.mjs      # nic nie zapisuje na dysk
 */
import { build } from "esbuild";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = mkdtempSync(join(tmpdir(), "zapis-"));
let bledy = 0;
let sprawdzen = 0;

function ok(warunek, opis, detal = "") {
  sprawdzen++;
  console.log(`  ${warunek ? "OK  " : "⛔  "} ${opis}${detal ? "   " + detal : ""}`);
  if (!warunek) bledy++;
}

/* ── localStorage: MUSI istnieć przed importem bundla ───────────────────────
   `Save.ts` wpina autozapis na zdarzenia już przy imporcie modułu, a każdy
   taki zapis sięga po `localStorage`. Bez stubu pierwszy emit wywaliłby się
   na `ReferenceError`, zanim test zdąży cokolwiek sprawdzić. */
const magazyn = new Map();
let zapisow = 0;
globalThis.localStorage = {
  getItem: (k) => (magazyn.has(k) ? magazyn.get(k) : null),
  setItem: (k, v) => {
    zapisow++;
    magazyn.set(k, String(v));
  },
  removeItem: (k) => magazyn.delete(k),
};

/* ── Stub Phasera: wyłącznie emiter zdarzeń ─────────────────────────────────
   `EventBus` używa `Phaser.Events.EventEmitter` i nic więcej. Gdyby kiedyś
   sięgnął głębiej, bundlowanie padnie tutaj — głośno, a nie po cichu. */
const stub = join(tmp, "phaser-stub.mjs");
writeFileSync(
  stub,
  `class EventEmitter {
     constructor() { this.l = new Map(); }
     on(k, fn, ctx) { if (!this.l.has(k)) this.l.set(k, []); this.l.get(k).push([fn, ctx]); return this; }
     once(k, fn, ctx) { return this.on(k, fn, ctx); }
     off(k, fn) { const a = this.l.get(k) ?? []; this.l.set(k, a.filter(([f]) => f !== fn)); return this; }
     removeAllListeners(k) { if (k === undefined) this.l.clear(); else this.l.delete(k); return this; }
     emit(k, ...args) { for (const [fn, ctx] of (this.l.get(k) ?? []).slice()) fn.call(ctx, ...args); return true; }
   }
   export default { Events: { EventEmitter } };`,
);

const re = (p) => JSON.stringify(resolve(KORZEN, p));
const wspolne = join(tmp, "wspolne.ts");
writeFileSync(
  wspolne,
  `export * from ${re("src/core/Save.ts")};
   export { Progression } from ${re("src/core/Progression.ts")};
   export { Inventory } from ${re("src/core/Inventory.ts")};
   export { Equipment, EQUIP_SLOTS, STOW_SLOTS, BAG_SLOTS } from ${re("src/core/Equipment.ts")};
   export { Quests } from ${re("src/core/Quests.ts")};
   export { TrackedQuest } from ${re("src/core/TrackedQuest.ts")};
   export { Skills } from ${re("src/core/Skills.ts")};
   export { Abilities } from ${re("src/core/Abilities.ts")};
   export { Dialogue } from ${re("src/core/Dialogue.ts")};
   export { Gathering } from ${re("src/core/Gathering.ts")};
   export { Stamina } from ${re("src/core/Stamina.ts")};
   export { Session } from ${re("src/core/Session.ts")};
   export { Vitals } from ${re("src/core/Vitals.ts")};
   export { WorldState } from ${re("src/core/WorldState.ts")};
   export { ArmorTraining } from ${re("src/core/ArmorTraining.ts")};
   export { ShieldSkill } from ${re("src/core/ShieldSkill.ts")};
   export { WeaponProficiency } from ${re("src/core/WeaponProficiency.ts")};
   export { ITEMS, QUESTS, SKILLS } from ${re("src/config/GameConfig.ts")};
   export { normalizeInstance } from ${re("src/core/Quality.ts")};
   export { GameEvents, EVENT } from ${re("src/core/EventBus.ts")};`,
);

const out = join(tmp, "bundle.mjs");
await build({
  entryPoints: [wspolne],
  outfile: out,
  bundle: true,
  format: "esm",
  platform: "node",
  logLevel: "silent",
  alias: { phaser: stub },
});
const M = await import(pathToFileURL(out).href);

const {
  Save, MANUAL_SLOTS, ALL_SLOTS, migruj, MIGRACJE, MIN_WERSJA,
  Progression, Inventory, Equipment, EQUIP_SLOTS, STOW_SLOTS, BAG_SLOTS,
  Quests, TrackedQuest, Skills, Abilities, Dialogue, Gathering, Stamina,
  Session, Vitals, WorldState, ArmorTraining, ShieldSkill, WeaponProficiency,
  ITEMS, QUESTS, SKILLS, normalizeInstance,
} = M;

/** Źródło `Save.ts` — §C i §D czytają je strukturalnie, nie przez uruchomienie. */
/* ⚠ **Znormalizowane do LF.** `src/core/Save.ts` leży w repo z CRLF-em
   (766/766 linii), a wzorce strukturalne §C/§D dopasowują koniec metody jako
   przejście wiersza + dwie spacje + klamra — co przy CR przed LF-em nie
   trafia. Ta sama pułapka złapała już `katalog_ekwipunku` (`OI-107`: fałszywa
   bramka `doc_check` §T przy ZEROWYM rozjeździe treści), więc normalizacja
   idzie tu raz, u źródła, a nie w każdym wzorcu osobno. */
const ZRODLO = readFileSync(join(KORZEN, "src/core/Save.ts"), "utf8")
  .split("\r\n")
  .join("\n");
/** Wersja zapisu, odczytana z tego, co kod NAPRAWDĘ pisze. Nie z eksportu:
 *  `SAVE_VERSION` jest prywatna i ma taka zostać. */
const WERSJA = Number(/const SAVE_VERSION = (\d+)/.exec(ZRODLO)[1]);
/** Ciało `interface SaveData` — jedno źródło dla §C i §D. */
const CIALO_SAVEDATA = /interface SaveData \{([\s\S]*?)\n\}/.exec(ZRODLO)[1];
/** Klucze najwyższego poziomu: linie o wcięciu DOKŁADNIE dwóch spacji. */
const poleWzorzec = (sufiks) =>
  [...CIALO_SAVEDATA.matchAll(new RegExp(`^ {2}([a-zA-Z][a-zA-Z0-9]*)${sufiks}:`, "gm"))].map((m) => m[1]);

const odczyt = (k) => JSON.parse(magazyn.get(k));
const glebokoRowne = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const kopia = (v) => JSON.parse(JSON.stringify(v));

/* ══════════════════════════════════════════════════════════════════════════
   BOGATA POSTAĆ — stan, w którym KAŻDE pole zapisu jest NIEDOMYŚLNE
   ══════════════════════════════════════════════════════════════════════════
   ⚠⚠ **To jest warunek, bez którego §A niczego nie dowodzi.** Pole zostawione
   na wartości domyślnej przechodzi obieg trywialnie: po `reset()` ma tę samą
   wartość, więc „wróciło" nie odróżnia się od „nigdy nie zostało wczytane".
   Złapane sabotażem przy pisaniu tego pliku: wycięcie `Equipment.weapon2`
   z `load()` NIE zapaliło żadnej asercji, bo postać testowa nie miała
   schowanego zestawu. Dlatego §A1 sprawdza to POLE PO POLU, a nie migawkę
   jako całość.

   ⚠ Stan sypie się tu przez `restore()` każdego systemu — udokumentowaną
   odwrotność jego `snapshot()`. To NIE jest rozgrywka i nie ma nią być:
   przymiar bada zapis, nie reguły zdobywania.
   ══════════════════════════════════════════════════════════════════════════ */
/**
 * Egzemplarz przedmiotu **przepuszczony przez `normalizeInstance`** — czyli
 * dokładnie w tej postaci, w jakiej przechowuje go gra.
 *
 * ⚠ Bez tego §A zgłaszał FAŁSZYWY alarm na całym pancerzu: `normalizeInstance`
 * dokłada `durability` tylko tam, gdzie przedmiot ją ma (`hasDurability`), i
 * przycina ją do maksimum dla danej jakości. Pancerz dziś trwałości NIE MA
 * (jest odłożona), więc wpisana ręcznie znikała przy wczytaniu i wyglądała jak
 * zgubione pole. To był błąd przymiaru, nie zapisu.
 */
const egz = (id, quality, durability) =>
  id ? normalizeInstance({ itemId: id, qty: 1, quality, durability }) : null;
const pierwszyTypu = (typ) => Object.keys(ITEMS).find((id) => ITEMS[id].type === typ);
/**
 * Pierwszy przedmiot pasujący do każdego adresu lalki — pytany przez
 * `Equipment.slotForItem`, czyli tę samą funkcję, której używa gra.
 *
 * ⚠ Nie przez `ITEMS[id].slot`: pancerz deklaruje OBSZAR (`chest`), a adresem
 * jest obszar + warstwa (`chest_L2`), i to `slotForItem` wyprowadza warstwę
 * z konstrukcji. Ręczne zgadywanie adresu rozjechałoby się z modelem C przy
 * pierwszym nowym przedmiocie.
 */
function przedmiotNaAdres() {
  const wg = new Map();
  for (const id of Object.keys(ITEMS)) {
    const s = Equipment.slotForItem(id);
    if (s && !wg.has(s)) wg.set(s, id);
  }
  return wg;
}

function zbudujPostac() {
  wyczysc();

  Progression.level = 12;
  Progression.xp = 345;
  Progression.totalXp = 4321;
  Progression.skillPoints = 7;
  Progression.strength = 21;
  Progression.vitality = 17;
  Progression.conditioning = 13;
  Progression.agility = 11;
  Progression.emitAttributes();

  Inventory.gold = 1618;
  const doPlecaka = Object.keys(ITEMS).slice(0, 6);
  for (const id of doPlecaka) Inventory.addItem(id, 1);
  Inventory.quickSlot = doPlecaka[0];

  // Ekwipunek: egzemplarze z NIEDOMYŚLNĄ jakością i trwałością, żeby obieg
  // sprawdzał `normalizeInstance`, a nie tylko samo id.
  const naAdres = przedmiotNaAdres();
  let n = 0;
  for (const s of EQUIP_SLOTS) {
    const id = naAdres.get(s);
    if (id) Equipment[s] = egz(id, (n % 7) + 1, 20 + (n++ % 60));
  }
  // Schowany zestaw broni i torby — oba mają w zapisie własne bloki.
  Equipment.weapon2 = egz(pierwszyTypu("weapon"), 7, 100);
  Equipment.offhand2 = egz(naAdres.get("offhand"), 1, 5);
  Equipment.bag1 = egz(pierwszyTypu("container"), 3, 30);
  Equipment.normalizeHands();
  Equipment.emitChanged();
  Equipment.emitBagsChanged();

  // Zadania: status, liczniki, etap, ubite sztuki, odrost i wręczone nagrody.
  const zadania = Object.keys(QUESTS);
  const zId = zadania.find((q) => (QUESTS[q].stages?.length ?? 0) > 1) ?? zadania[0];
  const etap = QUESTS[zId].stages?.[1]?.id;
  Quests.restore(
    { [zId]: "active" },
    { [zId]: [2] },
    { rabbit: 5, boar: 2 },
    [zadania[1]].filter(Boolean),
    etap ? { [zId]: etap } : {},
    ["przymiar:etap-wreczony"],
  );
  TrackedQuest.restore(zId); // PO `Quests.restore` — waliduje się o żywy status

  Dialogue.restore(["przymiar:temat-a", "przymiar:temat-b"]);
  Gathering.restore({ "przymiar:stanowisko": { active: [0, 2], at: 1_700_000_000_000 } }, ["mieta"]);
  Skills.restore([Object.keys(SKILLS)[0]]);
  Abilities.restoreSlots([Abilities.all()[0] ?? null, null, null, null]);
  ArmorTraining.restore(2);
  ShieldSkill.restore({ points: 3, pool: 17 });
  const rodzina = Object.keys(WeaponProficiency.snapshot() ?? {})[0] ?? "sword";
  WeaponProficiency.restore(
    { [rodzina]: 120 },
    { [rodzina]: 10 },
    { [rodzina]: 4.5 },
    { [rodzina]: 2 },
  );

  Stamina.syncMax(Progression.conditioning);
  Stamina.spend(9, "swing", 0);

  Vitals.maxHp = 180;
  Vitals.hp = 97;
  WorldState.widthPx = 5120;
  WorldState.heightPx = 1920;
  WorldState.mapId = "village";
  WorldState.playerX = 1234;
  WorldState.playerY = 567;
  Session.set(3_600_000 + 12_345);
}

function wyczysc() {
  Progression.reset();
  Inventory.reset();
  Equipment.reset();
  Quests.reset();
  Skills.reset();
  // ⚠ `resetLoadout()`, NIE `reset()`. To drugie czyści wyłącznie cooldowny
  //   i zostawia pasek umiejętności nietknięty — `wyczysc()` udaje tu „Nową
  //   grę", a tę robi `TitleScene` przez `resetLoadout`. Z `reset()` pole
  //   `abilitySlots` miało po obu stronach `["cleave", …]` i jego linijka §A2
  //   przechodziła, nie dotykając `load`; wyłapał to dopiero strażnik A1.
  Abilities.resetLoadout();
  Dialogue.reset();
  Gathering.reset();
  ArmorTraining.reset();
  ShieldSkill.reset();
  WeaponProficiency.reset();
  TrackedQuest.reset();
  Session.reset();
  Stamina.refill();
}

/** Wszystko, co ma przeżyć obieg — jedna migawka do porównania przed/po. */
const migawka = () => ({
  progression: {
    level: Progression.level, xp: Progression.xp, totalXp: Progression.totalXp,
    skillPoints: Progression.skillPoints, strength: Progression.strength,
    vitality: Progression.vitality, conditioning: Progression.conditioning,
    agility: Progression.agility,
  },
  gold: Inventory.gold,
  /**
   * ⚠ **Bez ogona pustych kafli.** `load` DOSYPUJE plecakowi pojemność, którą
   * obiecują założone torby (`expectedCapacity` w `Save.ts`) — świadomie, żeby
   * nie zabrać miejsca, które lalka przyznaje. Porównanie surowej tablicy
   * czytałoby ten dosyp jako „plecak wrócił inny" i §A zgłaszałoby FAŁSZYWY
   * alarm na poprawnym kodzie. Sam dosyp pilnuje osobna asercja (A4), więc
   * nic nie ginie z pola widzenia.
   */
  slots: (() => {
    const s = [...Inventory.slots];
    while (s.length && s[s.length - 1] === null) s.pop();
    return s;
  })(),
  quickSlot: Inventory.quickSlot,
  equipment: Object.fromEntries(EQUIP_SLOTS.map((s) => [s, Equipment[s]])),
  stowed: Object.fromEntries(STOW_SLOTS.map((s) => [s, Equipment[s]])),
  bags: Object.fromEntries(BAG_SLOTS.map((s) => [s, Equipment[s]])),
  stamina: Stamina.snapshot(),
  quests: Quests.snapshot(),
  questProgress: Quests.progressSnapshot(),
  questStages: Quests.stageSnapshot(),
  kills: Quests.killSnapshot(),
  trackedQuest: TrackedQuest.snapshot(),
  topics: Dialogue.snapshot(),
  gathering: Gathering.snapshot(),
  discovered: Gathering.discoveredSnapshot(),
  skills: Skills.snapshot(),
  armorTraining: ArmorTraining.snapshot(),
  shieldSkill: ShieldSkill.snapshot(),
  abilitySlots: Abilities.slotSnapshot(),
  weaponProficiency: WeaponProficiency.snapshot(),
  weaponMastery: WeaponProficiency.masterySnapshot(),
  playtimeMs: Session.playtimeMs,
});

/* ══════════════════════════════════════════════════════════════════════════
   §A. PEŁNY OBIEG
   ══════════════════════════════════════════════════════════════════════════ */
console.log("§A. Pełny obieg zapis → wyczyszczenie → wczytanie:");
{
  zbudujPostac();
  const przed = kopia(migawka());
  Save.save(1);
  ok(magazyn.has("rpg-save-1"), "A0. zapis do slotu 1 naprawdę coś zapisał");

  wyczysc();
  const poCzyszczeniu = kopia(migawka());
  // ⚠⚠ Asercja, która nie potrafi zaświecić na czerwono, jest dekoracją — i to
  //   jest jedyne miejsce, które pilnuje tego DLA KAŻDEGO POLA Z OSOBNA.
  //   Porównanie całej migawki nie wystarcza: wystarczy, że różni się złoto,
  //   a wszystkie pozostałe pola mogą być puste po obu stronach i ich linijki
  //   `A2` przejdą, nie dotykając `load` ani razu. Dokładnie tak przeszedł
  //   przy pisaniu tego pliku sabotaż wycinający `Equipment.weapon2`.
  const puste = Object.keys(przed).filter((k) => glebokoRowne(przed[k], poCzyszczeniu[k]));
  if (process.env.ZAPIS_DIAG) {
    for (const k of puste) {
      console.log(`       [PUSTE] ${k}: przed=${JSON.stringify(przed[k]).slice(0,200)} po-wyczyszczeniu=${JSON.stringify(poCzyszczeniu[k]).slice(0,200)}`);
    }
  }
  ok(
    puste.length === 0,
    "A1. ⭐⭐ KAŻDE pole różni się po wyczyszczeniu (inaczej jego `A2` jest dekoracją)",
    puste.join(", ") || "—",
  );

  const swiat = Save.load(1);
  const po = kopia(migawka());

  for (const klucz of Object.keys(przed)) {
    const zgoda = glebokoRowne(przed[klucz], po[klucz]);
    ok(zgoda, `A2. wraca: ${klucz}`);
    if (!zgoda && process.env.ZAPIS_DIAG) {
      console.log("       przed:", JSON.stringify(przed[klucz]).slice(0, 700));
      console.log("       po   :", JSON.stringify(po[klucz]).slice(0, 700));
    }
  }

  // ⭐ Reguła pojemności, którą `Save.load` opisuje o sobie wprost: plecak
  //    wolno DOSYPAĆ do tego, co obiecują założone torby, i nigdy nie wolno
  //    go skrócić — krótszy plecak obciąłby przedmioty, które już w nim są.
  ok(
    Inventory.slots.length >= przed.slots.length,
    "A4. ⭐ wczytanie NIGDY nie skraca plecaka",
    `${przed.slots.length} zajętych → ${Inventory.slots.length} kafli`,
  );
  ok(
    Inventory.slots.slice(przed.slots.length).every((s) => s === null),
    "A4. …a dosypane kafle są puste (nic się w nich nie materializuje)",
  );

  ok(swiat !== null, "A3. `load` zwrócił blok świata (nie null)");
  ok(swiat?.mapId === "village", "A3. …z mapą", String(swiat?.mapId));
  ok(swiat?.spawn?.x === 1234 && swiat?.spawn?.y === 567, "A3. …z pozycją gracza");
  ok(swiat?.hp === 97, "A3. …z punktami życia", String(swiat?.hp));
}

/* ══════════════════════════════════════════════════════════════════════════
   §B. KONTRAKT WERSJI
   ══════════════════════════════════════════════════════════════════════════
   Od `OI-51` (2026-10-11) starszy zapis się MIGRUJE (§G); odrzucany jest
   zapis z NOWSZEJ wersji gry (cofnięty build) i starszy niż `MIN_WERSJA`.
   Skoro jest ODRZUCANY, to musi być odrzucany CAŁY — wczytanie połowy pól
   i porzucenie reszty zostawia postać w stanie, którego nikt nie zapisał.
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§B. Kontrakt wersji:");
{
  zbudujPostac();
  Save.save(2);
  const obcy = odczyt("rpg-save-2");
  obcy.version = WERSJA + 1;
  obcy.progression.level = 99;
  magazyn.set("rpg-save-2", JSON.stringify(obcy));

  wyczysc();
  const przedProba = kopia(migawka());
  const wynik = Save.load(2);
  const poProbie = kopia(migawka());

  ok(wynik === null, "B1. zapis z NOWSZEJ wersji gry NIE wczytuje się (null)");
  ok(
    glebokoRowne(przedProba, poProbie),
    "B2. ⭐ …i NIE TKNĄŁ stanu — odmowa jest całkowita, nie połowiczna",
  );
  const opis = Save.describe(2);
  ok(opis !== null, "B3. `describe` nadal czyta obcy zapis (żeby nazwać go po imieniu)");
  ok(opis?.compatible === false, "B3. …i mówi `compatible: false`");
  ok(opis?.level === 99, "B3. …podając jego własne dane, nie domyślne", `poz. ${opis?.level}`);
  ok(Save.newestSlot() !== 2, "B4. niezgodny slot nie wygrywa `Kontynuuj`");

  const stary = odczyt("rpg-save-2");
  stary.version = MIN_WERSJA - 1;
  magazyn.set("rpg-save-2", JSON.stringify(stary));
  wyczysc();
  ok(Save.load(2) === null, "B5. zapis starszy niż `MIN_WERSJA` NIE wczytuje się");
  ok(Save.describe(2)?.compatible === false, "B5. …i `describe` mówi `compatible: false`");
}

/* ══════════════════════════════════════════════════════════════════════════
   §C. KOMPLETNOŚĆ PÓL — strukturalnie, ze źródła
   ══════════════════════════════════════════════════════════════════════════
   ⭐⭐ To jest asercja, dla której ten plik powstał. Klasa błędu, której nie
   złapie ani `tsc`, ani obieg z §A (bo §A porównuje to, co sam wypisał):
   **pole dopisane do `SaveData` i do `save()`, a zapomniane w `load()`**.
   Postać zapisuje się wtedy w komplecie i wczytuje bez tego pola — cicho,
   bez jednego ostrzeżenia, i widać to dopiero jako „zgubiło mi postęp".
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§C. Każde pole `SaveData` jest i pisane, i czytane:");
{
  const pola = poleWzorzec("\\??");
  const cialoSave = /\n  save\(slot[\s\S]*?\n  \}/.exec(ZRODLO)[0];
  const cialoLoad = /\n  load\(slot[\s\S]*?\n  \}\n/.exec(ZRODLO)[0];

  ok(pola.length > 20, `C0. ⭐ wykryto pola SaveData (${pola.length})`, "inaczej §C nic nie bada");
  ok(
    // od `OI-51` wersję czyta `migruj(…)` — łańcuch migracji, nie porównanie wprost
    cialoSave.includes("version: SAVE_VERSION") && cialoLoad.includes("migruj("),
    "C0. …i obie metody dały się wyciąć ze źródła",
  );

  const niepisane = [];
  const nieczytane = [];
  for (const p of pola) {
    // ⚠ Pole bywa pisane NA DWA sposoby i oba są prawidłowe: jako klucz
    //   literału (`gold: Inventory.gold`) albo jako przypisanie warunkowe po
    //   nim (`data.world = {…}` — blok świata wchodzi tylko wtedy, gdy scena
    //   naprawdę ruszyła). Wzorzec pytający wyłącznie o klucz zgłaszał `world`
    //   jako „niepisane", czyli świecił na czerwono na poprawnym kodzie.
    const jakoKlucz = new RegExp(`(^|[^.\\w])${p}:`, "m").test(cialoSave);
    const jakoPrzypisanie = new RegExp(`data\\.${p}\\s*=`).test(cialoSave);
    if (!jakoKlucz && !jakoPrzypisanie) niepisane.push(p);
    const czytaWersje = p === "version" && cialoLoad.includes("migruj(");
    if (!czytaWersje && !new RegExp(`data(\\?)?\\.${p}\\b`).test(cialoLoad)) nieczytane.push(p);
  }
  ok(niepisane.length === 0, "C1. każde pole `SaveData` jest PISANE przez `save()`", niepisane.join(", ") || "—");
  ok(nieczytane.length === 0, "C2. ⭐⭐ każde pole `SaveData` jest CZYTANE przez `load()`", nieczytane.join(", ") || "—");
}

/* ══════════════════════════════════════════════════════════════════════════
   §D. WSTECZ — niezmiennik z `CLAUDE.md`
   ══════════════════════════════════════════════════════════════════════════
   „Nowe pole zapisu dodaje się jako OPCJONALNE, bez podbijania
   `SAVE_VERSION`." Cała reguła istnieje po to, żeby stary zapis WCIĄŻ SIĘ
   WCZYTYWAŁ. Tutaj stara postać jest udawana wprost: z pełnego zapisu znikają
   WSZYSTKIE pola oznaczone w `SaveData` jako opcjonalne.
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§D. Zapis bez pól opcjonalnych (stara postać) wczytuje się:");
{
  zbudujPostac();
  Save.save(3);
  const pelny = odczyt("rpg-save-3");
  const opcjonalne = poleWzorzec("\\?");
  ok(opcjonalne.length > 0, `D0. SaveData ma pola opcjonalne (${opcjonalne.length})`, opcjonalne.join(", "));

  const chudy = { ...pelny };
  for (const p of opcjonalne) delete chudy[p];
  ok(
    opcjonalne.some((p) => pelny[p] !== undefined),
    "D0. ⭐ …i pełny zapis NAPRAWDĘ je miał (inaczej §D usuwa nic)",
  );
  magazyn.set("rpg-save-3", JSON.stringify(chudy));

  wyczysc();
  let wybuch = null;
  try {
    Save.load(3);
  } catch (e) {
    wybuch = e;
  }
  ok(wybuch === null, "D1. ⭐ wczytanie NIE wybucha", wybuch ? String(wybuch.message) : "");
  ok(Progression.level === 12, "D2. …a pola obowiązkowe wróciły mimo braku opcjonalnych", `poz. ${Progression.level}`);
  ok(Inventory.gold === 1618, "D2. …łącznie ze złotem", `${Inventory.gold} g`);

  // Zapis uszkodzony (nie-JSON) nie może wywrócić gry.
  magazyn.set("rpg-save-3", "{to nie jest json");
  try {
    ok(Save.load(3) === null, "D3. uszkodzony (nie-JSON) zapis → `null`, bez wyjątku");
  } catch (e) {
    ok(false, "D3. uszkodzony (nie-JSON) zapis → `null`, bez wyjątku", String(e.message));
  }
  ok(Save.describe(3) === null, "D4. …i `describe` też go nie przepuszcza");
}

/* ══════════════════════════════════════════════════════════════════════════
   §E. SLOTY — klucze i izolacja
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§E. Sloty — klucze i izolacja:");
{
  magazyn.clear();
  zbudujPostac();
  Save.save("auto");
  ok(magazyn.has("rpg-save"), "E1. ⛔ autozapis trzyma ORYGINALNY klucz `rpg-save` (na tym stoi migracja slotów)");
  for (const s of MANUAL_SLOTS) {
    Save.save(s);
    ok(magazyn.has(`rpg-save-${s}`), `E2. slot ${s} ma własny klucz rpg-save-${s}`);
  }
  ok(new Set(ALL_SLOTS).size === ALL_SLOTS.length, "E3. lista slotów bez powtórzeń");

  Save.clear("auto");
  ok(!magazyn.has("rpg-save"), "E4. clear(\"auto\") kasuje autozapis…");
  ok(
    MANUAL_SLOTS.every((s) => magazyn.has(`rpg-save-${s}`)),
    "E4. ⭐ …i NIE RUSZA ręcznych (nowa gra nie pali kopii gracza)",
  );
  ok(Save.hasAnySave() === true, "E5. `hasAnySave` widzi ręczne sloty po skasowaniu autozapisu");
}

/* ══════════════════════════════════════════════════════════════════════════
   §F. WYCISZENIE W TRAKCIE ODTWARZANIA
   ══════════════════════════════════════════════════════════════════════════
   `load()` przypisuje kilkanaście singletonów, a każde przypisanie emituje —
   a każdy emit jest wpięty w autozapis. Bez wyciszenia wczytanie slotu 1
   wystrzeliłoby kilkanaście autozapisów PÓŁWCZYTANEJ postaci, każdy z blokiem
   `world` opisującym miejsce sprzed wczytania.
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§F. Wczytywanie nie autozapisuje w trakcie:");
{
  magazyn.clear();
  zbudujPostac();
  Save.save(1);
  wyczysc();
  Save.save("auto"); // stan „po nowej grze" w autozapisie
  const autoPrzed = magazyn.get("rpg-save");

  zapisow = 0;
  Save.load(1);
  ok(zapisow === 0, "F1. ⭐ ZERO zapisów w trakcie `load` (wyciszenie działa)", `${zapisow}`);
  ok(
    magazyn.get("rpg-save") === autoPrzed,
    "F2. …więc autozapis nie został nadpisany półwczytaną postacią",
  );
  // …a po wczytaniu autozapis znów żyje: pierwsza zmiana stanu musi go ruszyć.
  zapisow = 0;
  Inventory.addGold(1);
  ok(zapisow > 0, "F3. ⛔ …ale po `load` autozapis ZNÓW działa (wyciszenie się zdjęło)", `${zapisow}`);
}

/* ══════════════════════════════════════════════════════════════════════════
   §G. ŁAŃCUCH MIGRACJI (`OI-51`)
   ══════════════════════════════════════════════════════════════════════════
   Polityka: podbicie `SAVE_VERSION` WYMAGA migracji o jedną wersję w górę.
   G1 pilnuje tego na prawdziwym łańcuchu (luka = czerwono, zanim wyjdzie
   build kasujący postacie); G2–G6 sprawdzają mechanikę `migruj` na łańcuchu
   sztucznym, bo prawdziwy jest dziś pusty.
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§G. Łańcuch migracji:");
{
  const luki = [];
  for (let v = MIN_WERSJA; v < WERSJA; v++) if (typeof MIGRACJE[v] !== "function") luki.push(v);
  ok(luki.length === 0, `G1. ⭐⭐ każda wersja ${MIN_WERSJA}…${WERSJA - 1} ma migrację o krok w górę`, luki.join(", ") || "—");
  ok(MIN_WERSJA <= WERSJA, "G1. …i `MIN_WERSJA` nie przekracza bieżącej");

  const lancuch = { 1: (d) => ({ ...d, a: 1 }), 2: (d) => ({ ...d, b: d.a + 1 }) };
  const wejscie = { version: 1, x: 7 };
  const wynik = migruj(wejscie, 3, 1, lancuch);
  ok(wynik?.version === 3 && wynik?.a === 1 && wynik?.b === 2 && wynik?.x === 7,
    "G2. ⭐ v1 → v3 przechodzi OBA kroki po kolei", JSON.stringify(wynik));
  ok(wejscie.version === 1 && !("a" in wejscie), "G2. …i NIE ruszył oryginału (migracja dostaje kopię)");
  ok(migruj({ version: 1 }, 3, 1, { 1: lancuch[1] }) === null, "G3. ⭐ luka w łańcuchu → `null`, nie połowiczna postać");
  ok(migruj({ version: 4 }, 3, 1, lancuch) === null, "G4. wersja NOWSZA niż docelowa → `null`");
  ok(migruj({ version: 0 }, 3, 1, lancuch) === null, "G4. …starsza niż minimum → `null`");
  ok(migruj({ version: "3" }, 3, 1, lancuch) === null, "G4. …wersja nie-liczba → `null`");
  ok(migruj({ version: 1 }, 3, 1, { 1: () => { throw new Error("x"); }, 2: lancuch[2] }) === null,
    "G5. wyjątek w migracji → `null`, bez wyjątku na zewnątrz");
  const biezaca = migruj({ version: 3, y: 1 }, 3, 1, lancuch);
  ok(biezaca?.version === 3 && biezaca?.y === 1, "G6. zapis w wersji docelowej przechodzi bez zmian");
}

/* ══════════════════════════════════════════════════════════════════════════
   §H. KOPIE — czego build nie umie wczytać, tego nie niszczy (`OI-51`, reguła 3)
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§H. Niewczytywalny zapis idzie do kopii, zanim zginie:");
{
  const kopie = () => [...magazyn.keys()].filter((k) => k.includes("-kopia-"));
  magazyn.clear();
  zbudujPostac();

  Save.save(1);
  Save.save(1);
  ok(kopie().length === 0, "H1. nadpisanie zapisu Z TEJ wersji NIE robi kopii (zwykły autozapis)");

  const nowszy = JSON.stringify({ ...odczyt("rpg-save-1"), version: WERSJA + 1 });
  magazyn.set("rpg-save-2", nowszy);
  Save.save(2);
  ok(magazyn.get(`rpg-save-2-kopia-v${WERSJA + 1}`) === nowszy,
    "H2. ⭐⭐ zapis z NOWSZEJ wersji odłożony do kopii co do bajtu, zanim go nadpisano");
  ok(odczyt("rpg-save-2").version === WERSJA, "H2. …a slot trzyma już bieżącą wersję");

  magazyn.set("rpg-save-3", "{to nie jest json");
  Save.save(3);
  ok(magazyn.get("rpg-save-3-kopia-vx") === "{to nie jest json", "H3. uszkodzony zapis też idzie do kopii (`-kopia-vx`)");

  magazyn.set("rpg-save", nowszy);
  Save.clear("auto");
  ok(!magazyn.has("rpg-save") && magazyn.get(`rpg-save-kopia-v${WERSJA + 1}`) === nowszy,
    "H4. ⭐ „Nowa gra” (clear auto) po niewczytywalnym autozapisie zostawia kopię");

  magazyn.set("rpg-save-2", JSON.stringify({ version: WERSJA + 1, inny: true }));
  Save.save(2);
  ok(magazyn.get(`rpg-save-2-kopia-v${WERSJA + 1}`) === nowszy,
    "H5. istniejąca kopia NIE jest nadpisywana drugą (pierwsza zachowana jest tą właściwą)");
}

rmSync(tmp, { recursive: true, force: true });
console.log(`\nSprawdzeń: ${sprawdzen}.`);
if (bledy) {
  console.log(`⛔ NIE PRZESZŁO: ${bledy}`);
  process.exit(1);
}
console.log("OK — zapis odtwarza postać w komplecie, migruje bez luk, odmawia całkowicie i nie niszczy niewczytywalnego.");
console.log("Nic nie zapisano na dysk — ten przymiar pracuje na stubie `localStorage`.");
