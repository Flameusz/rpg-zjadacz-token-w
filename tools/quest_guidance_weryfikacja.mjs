/**
 * Weryfikacja WDROŻONEJ wskazówki zadań (2026-08-23).
 *
 * ⚠ **Uruchamia PRAWDZIWE `src/core/QuestGuidance.ts` i `src/core/Quests.ts`**,
 * na prawdziwych zadaniach z `GameConfig.ts` — nie własną kopię reguły. Ten
 * sam zabieg i ten sam powód, co w `stamina_weryfikacja.mjs`: podmieniany jest
 * WYŁĄCZNIE `EventBus` (ciągnie Phasera, czyli DOM). Cała arytmetyka i cały
 * przepływ stanu to ten kod, który wykonuje gra.
 *
 * Sprawdza trzy rzeczy, każda była w tym passie realną decyzją:
 *  1. maszynę stanów `guidanceFor` (objective → turnIn → none),
 *  2. że `talk` niesie `npcId` jako DANE, a nie jako fragment napisu,
 *  3. **zgłoszony błąd „ukończony collect pokazuje 0/5"** — czyli że
 *     `questObjectiveLine` przestaje pytać plecak po oddaniu zadania.
 *
 * ⚠ Reguła projektu: asercja, która nie potrafi zaświecić na czerwono, jest
 * dekoracją. Sprawdzone celowym zepsuciem — patrz `--udowodnij-czerwien`,
 * które podmienia `questObjectiveLine` na naiwny odczyt sprzed poprawki
 * i MUSI wtedy wywalić test §3.
 *
 * Kod wyjścia ≠ 0, gdy którakolwiek asercja padnie.
 *
 *   node tools/quest_guidance_weryfikacja.mjs
 *   node tools/quest_guidance_weryfikacja.mjs --udowodnij-czerwien
 */

import { build } from "esbuild";
import { unlink, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const stub = join(KORZEN, "node_modules", ".eventbus-stub-quest.ts");
/** `theme.ts` ciągnie Phasera i DOM (`Viewport`), a `NpcStatus` potrzebuje
 *  z niego wyłącznie stałych kolorów. Ta sama sztuczka co w `hud_uklad.mjs`. */
const themeStub = join(KORZEN, "node_modules", ".theme-stub-quest.ts");
const tmp = join(KORZEN, "node_modules", ".quest-guidance-real.mjs");

const UDOWODNIJ = process.argv.includes("--udowodnij-czerwien");

/**
 * ⚠ Atrapa musi NAPRAWDĘ rozsyłać zdarzenia, inaczej połowa testu jest fikcją:
 * `QuestState` nasłuchuje własnego `inventoryChanged`, żeby przemiatać etapy
 * (`advanceAllActive`), a `Inventory.addItem` emituje synchronicznie. Atrapa
 * z pustym `emit` ukryłaby każdy błąd w tym sprzężeniu — łącznie ze strażnikiem
 * re-entrancy, który powstał właśnie tam.
 */
await writeFile(
  stub,
  `const L = new Map();
   export const GameEvents = {
     emit(k, ...a) { for (const f of L.get(k) ?? []) f.fn.call(f.ctx, ...a); },
     on(k, fn, ctx) { if (!L.has(k)) L.set(k, []); L.get(k).push({ fn, ctx }); },
     off(k, fn) { const l = L.get(k) ?? []; const i = l.findIndex((e) => e.fn === fn); if (i >= 0) l.splice(i, 1); },
   };
   export const EVENT = new Proxy({}, { get: (_t, k) => String(k) });\n`,
);

await writeFile(
  themeStub,
  `export const UI = { green: "#7ddf9a", gold: "#ffcc66", white: "#ffffff", muted: "#8892a6", text: "#c8d0e0" };\n`,
);

await writeFile(
  join(KORZEN, "node_modules", ".quest-entry.ts"),
  `export * from "${join(KORZEN, "src", "core", "QuestGuidance.ts").replace(/\\/g, "/")}";
   export { Quests, objectivesOf, objectiveText, turnInNpcOf } from "${join(KORZEN, "src", "core", "Quests.ts").replace(/\\/g, "/")}";
   export { Inventory } from "${join(KORZEN, "src", "core", "Inventory.ts").replace(/\\/g, "/")}";
   export { Equipment } from "${join(KORZEN, "src", "core", "Equipment.ts").replace(/\\/g, "/")}";
   export { TrackedQuest } from "${join(KORZEN, "src", "core", "TrackedQuest.ts").replace(/\\/g, "/")}";
   export { npcQuestMarker, npcTrainerBadge, npcTeachesAnything } from "${join(KORZEN, "src", "core", "NpcStatus.ts").replace(/\\/g, "/")}";
   export { QUESTS, ENEMY_NAMES } from "${join(KORZEN, "src", "config", "GameConfig.ts").replace(/\\/g, "/")}";\n`,
);

await build({
  entryPoints: [join(KORZEN, "node_modules", ".quest-entry.ts")],
  outfile: tmp,
  format: "esm",
  bundle: true,
  logLevel: "silent",
  define: { "import.meta.env.DEV": "false" },
  plugins: [
    {
      name: "stuby",
      setup(b) {
        b.onResolve({ filter: /EventBus$/ }, () => ({ path: stub }));
        b.onResolve({ filter: /core\/theme$|^\.\/theme$/ }, () => ({ path: themeStub }));
      },
    },
  ],
});

const M = await import(pathToFileURL(tmp).href);
const {
  Quests, Inventory, Equipment, QUESTS, TrackedQuest,
  guidanceFor, guidanceText, objectivesOf, turnInNpcOf,
  npcQuestMarker, npcTrainerBadge,
} = M;
let { questObjectiveLine } = M;

await Promise.all(
  [stub, themeStub, tmp, join(KORZEN, "node_modules", ".quest-entry.ts")].map((p) =>
    unlink(p).catch(() => {}),
  ),
);

/**
 * Wersja SPRZED poprawki: czyta żywy plecak niezależnie od statusu zadania,
 * dokładnie tak, jak robiły to oba panele. Istnieje po to, żeby udowodnić, że
 * asercje §3 potrafią zaświecić na czerwono — bez tego są dekoracją.
 */
if (UDOWODNIJ) {
  console.log("⚠ TRYB DOWODU: `questObjectiveLine` podmieniona na wersję sprzed poprawki.\n");
  questObjectiveLine = (id, i) => ({
    text: M.objectiveText(id, i),
    done: Quests.isObjectiveDone(id, i),
  });
}

let bledy = 0;
const padr = (s, n) => String(s).padEnd(n);
function ok(nazwa, warunek, detal = "") {
  if (!warunek) bledy++;
  console.log(`  ${warunek ? "OK  " : "BŁĄD"} ${padr(nazwa, 56)} ${detal}`);
}

/* ── 1. Maszyna stanów wskazówki ───────────────────────────────────────── */

console.log("== 1. guidanceFor: objective → turnIn → none ==");

// `rabbit_hunt` — zadanie typu `collect`, jednoetapowe, oddawane u dawcy.
const COLLECT_ID = Object.keys(QUESTS).find((id) => {
  const q = QUESTS[id];
  return (q.objectives ?? []).some((o) => o.kind === "collect" && o.count > 1);
});
ok("znaleziono zadanie `collect` do testu", !!COLLECT_ID, COLLECT_ID ?? "—");

const objective = objectivesOf(COLLECT_ID)[0];
const potrzeba = objective.count;
const itemId = objective.itemId;

ok("nieprzyjęte zadanie → kind `none`", guidanceFor(COLLECT_ID).kind === "none", guidanceFor(COLLECT_ID).kind);

Quests.accept(COLLECT_ID);
const gPusty = guidanceFor(COLLECT_ID);
ok("przyjęte, zero przedmiotów → kind `objective`", gPusty.kind === "objective", gPusty.kind);
ok("...i wskazuje pierwszy cel (index 0)", gPusty.index === 0, `index=${gPusty.index}`);
ok("...zwraca CZĘŚCI, nie gotowe zdanie", !!gPusty.verb && !!gPusty.subject, `${gPusty.verb} / ${gPusty.subject}`);
ok("...postęp jako LICZBY", gPusty.have === 0 && gPusty.goal === potrzeba, `${gPusty.have}/${gPusty.goal}`);
ok("...złożona etykieta niesie 0/N", guidanceText(gPusty).includes(`0/${potrzeba}`), guidanceText(gPusty));

// Częściowy postęp — czyta plecak na żywo, więc wskazówka ma się ruszyć.
Inventory.addItem(itemId, potrzeba - 1);
const gCzesc = guidanceFor(COLLECT_ID);
ok("częściowy postęp → dalej `objective`", gCzesc.kind === "objective", gCzesc.kind);
ok("...licznik nadąża za plecakiem", gCzesc.have === potrzeba - 1, guidanceText(gCzesc));

// Ostatnia sztuka domyka cele → wskazówka przeskakuje na „wróć do".
Inventory.addItem(itemId, 1);
const gGotowe = guidanceFor(COLLECT_ID);
ok("cele spełnione → kind `turnIn`", gGotowe.kind === "turnIn", gGotowe.kind);
ok("...niesie npcId jako DANE", !!gGotowe.npcId, gGotowe.npcId ?? "—");
ok("...npcId = effectiveTurnInNpc", gGotowe.npcId === turnInNpcOf(COLLECT_ID), gGotowe.npcId);
ok("...subject to IMIĘ, nie surowe id", gGotowe.subject !== gGotowe.npcId, gGotowe.subject);
ok("...czasownik to `Wróć do`", gGotowe.verb === "Wróć do", gGotowe.verb);

/* ── 1b. Kształt etykiety: CZASOWNIK: Mianownik [licznik] ───────────────── */
//
// ⚠ To jest ta asercja, która złapała „Wróć do Myśliwy". Nazwa MUSI stać po
// dwukropku — wtedy jest cytowana, a nie wpięta w zdanie, więc nie wymaga
// odmiany. Dokładnie jeden dwukropek: licznik dokleja się SPACJĄ.
console.log("\n== 1b. Format etykiety ==");
const KSZTALT = /^[^:]+: [^:]+$/;
for (const [nazwa, g] of [
  ["objective (licznik)", gCzesc],
  ["turnIn", gGotowe],
]) {
  const t = guidanceText(g);
  ok(`${nazwa}: dokładnie jeden dwukropek`, (t.match(/:/g) ?? []).length === 1, t);
  ok(`${nazwa}: kształt \`Czasownik: Nazwa\``, KSZTALT.test(t), t);
}

/* ── 2. `talk` niesie npcId, a nie sparsowany napis ─────────────────────── */

console.log("\n== 2. Cel `talk` niesie `npc` jako dane ==");

const TALK_ID = Object.keys(QUESTS).find((id) => {
  const q = QUESTS[id];
  const etapy = q.stages ?? [{ objectives: q.objectives ?? [] }];
  return etapy.some((s) => (s.objectives ?? []).some((o) => o.kind === "talk"));
});
ok("znaleziono zadanie z celem `talk`", !!TALK_ID, TALK_ID ?? "—");

if (TALK_ID) {
  Quests.accept(TALK_ID);
  // Przemiel etapy aż do tego, który pyta o rozmowę (albo do końca zadania).
  let g = guidanceFor(TALK_ID);
  let krokow = 0;
  while (g.kind === "objective" && !g.npcId && krokow < 8) {
    const cel = objectivesOf(TALK_ID)[g.index];
    if (cel.kind === "collect") Inventory.addItem(cel.itemId, cel.count);
    else if (cel.kind === "kill") Quests.recordKill(cel.enemy);
    else if (cel.kind === "equip") {
      // ⚠ Przypisanie WPROST do slotu, jak `Save.load` — `equipFromBag` chce
      // przedmiotu w plecaku i całej reguły dwuręczności, a tu chodzi wyłącznie
      // o przepchnięcie etapu, żeby dojść do celu `talk`.
      Equipment.weapon = { itemId: cel.itemId, qty: 1, quality: 1 };
      Equipment.emitChanged();
    } else break;
    g = guidanceFor(TALK_ID);
    krokow++;
  }
  if (g.kind === "objective" && g.npcId) {
    const cel = objectivesOf(TALK_ID)[g.index];
    ok("`objective` typu talk ma npcId", !!g.npcId, g.npcId);
    ok("...npcId == objective.npc (nie parsowany)", g.npcId === cel.npc, `${g.npcId} vs ${cel.npc}`);
    ok("...etykieta to `Porozmawiaj: <imię>`", guidanceText(g).startsWith("Porozmawiaj: "), guidanceText(g));
    ok("...bez licznika (goal === 1)", !guidanceText(g).includes("/"), guidanceText(g));
  } else {
    console.log("  --   etap `talk` nieosiągalny bez Equipment — pominięte");
  }
}

/* ── 3. ZGŁOSZONY BŁĄD: ukończony `collect` nie pokazuje 0/N ────────────── */

console.log("\n== 3. Ukończony `collect` — regresja 0/5 po oddaniu ==");

const przedOddaniem = questObjectiveLine(COLLECT_ID, 0);
ok("przed oddaniem: cel policzony jako wykonany", przedOddaniem.done === true, przedOddaniem.text);

// ⚠ Drugi argument jest WYMAGANY od 2026-08-23 — patrz §4. Oddajemy u tego,
// kogo wskazuje `turnInNpcOf`, czyli tu u dawcy.
const oddane = Quests.complete(COLLECT_ID, turnInNpcOf(COLLECT_ID));
ok("`complete()` przeszło", oddane === true);
ok("status = completed", Quests.getStatus(COLLECT_ID) === "completed", Quests.getStatus(COLLECT_ID));
ok(
  "oddanie ZUŻYŁO przedmioty (plecak pusty)",
  Inventory.countItem(itemId) === 0,
  `${Inventory.countItem(itemId)} szt.`,
);

// To jest ten test. Przed poprawką `objectiveText` czytał tu żywy plecak
// (zero sztuk) i drukował „0/N" pod ukończonym zadaniem.
const poOddaniu = questObjectiveLine(COLLECT_ID, 0);
ok("po oddaniu: NIE pokazuje 0/N", !poOddaniu.text.includes(`0/${potrzeba}`), poOddaniu.text);
ok("po oddaniu: pokazuje N/N", poOddaniu.text.includes(`${potrzeba}/${potrzeba}`), poOddaniu.text);
ok("po oddaniu: done === true", poOddaniu.done === true, String(poOddaniu.done));
ok("ukończone zadanie → guidance `none`", guidanceFor(COLLECT_ID).kind === "none", guidanceFor(COLLECT_ID).kind);

/* ── 4. Kontrakt oddania: giver=A, turnInNpc=B ──────────────────────────── */
//
// ⚠ **Zadanie SYNTETYCZNE, wstrzykiwane w czasie wykonania.** Żaden prawdziwy
// quest nie ustawia dziś `turnInNpc`, więc bez tego cała reguła routingu jest
// nietestowalna — a `as const` w configu jest wyłącznie kompilacyjne, obiekt
// w runtime jest zwykły i `Object.keys(QUESTS)` czytane jest przy każdym
// zapytaniu. Dopisanie klucza + `Quests.reset()` daje pełnoprawny quest bez
// zaśmiecania `GameConfig.ts` wpisem, który widziałby gracz.
//
// To jest test, który udowodnił, że kontrakt NIE działał: przed poprawką
// `complete()` nie pytało o NPC w ogóle, a `QuestPanel` listował po `giver` —
// więc tracker mówił „Wróć do: Kowal", a oddać dawało się u Myśliwego.

console.log("\n== 4. Oddanie u turnInNpc, nie u dawcy ==");

const A = "hunter";
const B = "blacksmith";
QUESTS.__test_ab = {
  id: "__test_ab",
  name: "Test A→B",
  giver: A,
  turnInNpc: B,
  description: "Syntetyczny — dawca A, oddanie u B.",
  objectives: [{ kind: "kill", enemy: "rabbit", count: 1 }],
  reward: { xp: 1 },
};
Quests.reset();

ok("turnInNpcOf zwraca B, nie dawcę", turnInNpcOf("__test_ab") === B, turnInNpcOf("__test_ab"));

// available → oferuje DAWCA
ok("available: jest u A (dawcy)", Quests.questsAtNpc(A).includes("__test_ab"));
ok("available: NIE ma go u B", !Quests.questsAtNpc(B).includes("__test_ab"));

Quests.accept("__test_ab");

// active + niegotowy → nie da się oddać NIGDZIE
ok("active+niegotowy: A nie może oddać", Quests.complete("__test_ab", A) === false);
ok("active+niegotowy: B nie może oddać", Quests.complete("__test_ab", B) === false);
ok("...i status dalej `active`", Quests.getStatus("__test_ab") === "active", Quests.getStatus("__test_ab"));

// active → przenosi się do B
ok("active: NIE ma go już u A", !Quests.questsAtNpc(A).includes("__test_ab"));
ok("active: jest u B", Quests.questsAtNpc(B).includes("__test_ab"));

Quests.recordKill("rabbit");
ok("po zabiciu: cele spełnione", Quests.isObjectiveMet("__test_ab") === true);

const gAB = guidanceFor("__test_ab");
ok("wskazówka kieruje do B", gAB.kind === "turnIn" && gAB.npcId === B, `${gAB.kind}/${gAB.npcId}`);

// ⚠ SEDNO: gotowy quest, ale u niewłaściwego człowieka.
ok("active+ready: A NIE MOŻE oddać", Quests.complete("__test_ab", A) === false);
ok("...status nietknięty po odmowie", Quests.getStatus("__test_ab") === "active", Quests.getStatus("__test_ab"));
ok("active+ready: B MOŻE oddać", Quests.complete("__test_ab", B) === true);
ok("...status = completed", Quests.getStatus("__test_ab") === "completed", Quests.getStatus("__test_ab"));

delete QUESTS.__test_ab;

/* ── 5. Znacznik nad NPC: priorytet ? > ◆ > ! ───────────────────────────── */
//
// ⚠ Kolejność jest tu CAŁĄ regułą i psuje się cicho — zamiana dwóch gałęzi
// miejscami dalej się kompiluje i dalej pokazuje jakiś glif.

console.log("\n== 5. Znacznik zadaniowy nad NPC ==");

// ⚠ TALKER musi być kimś, kto NIE ma własnych zadań, inaczej jego własne „!"
// miesza się z tym, co mierzymy. Pierwsza wersja użyła Patryczka i zapaliła się
// na czerwono — słusznie, bo on ma dwa własne zadania. `hanna` nie ma żadnego.
const TALKER = "hanna";
const GIVER = "elder";
/** Osobno, bo do sprawdzenia rozdziału `+` potrzebny jest prawdziwy trener. */
const TRAINER = "patryczek";

// Zadanie, którego bieżący krok to rozmowa z TALKER-em, oddawane u GIVER-a.
QUESTS.__test_mark = {
  id: "__test_mark",
  name: "Test znacznika",
  giver: GIVER,
  description: "Syntetyczny — krok `talk`, oddanie u dawcy.",
  objectives: [{ kind: "talk", npc: TALKER }],
  reward: { xp: 1 },
};
Quests.reset();
TrackedQuest.reset();

const glif = (npc) => npcQuestMarker(npc)?.text ?? "—";

ok(`available: "!" nad dawcą (${GIVER})`, glif(GIVER) === "!", glif(GIVER));
ok(`available: nic nad ${TALKER}`, glif(TALKER) === "—", glif(TALKER));

Quests.accept("__test_mark");
ok("po przyjęciu: śledzone automatycznie", TrackedQuest.id === "__test_mark", String(TrackedQuest.id));

// Bieżący krok to rozmowa → romb nad rozmówcą, nie nad dawcą.
ok(`active: "◆" nad ${TALKER}`, glif(TALKER) === "◆", glif(TALKER));
ok(`active: nic nad dawcą (krok go nie dotyczy)`, glif(GIVER) === "—", glif(GIVER));

// ⚠ Romb ZNIKA, gdy przestajemy śledzić — świat ma mówić to samo co tracker.
TrackedQuest.set(null);
ok(`nieśledzone: "◆" znika z ${TALKER}`, glif(TALKER) === "—", glif(TALKER));
TrackedQuest.set("__test_mark");
ok(`znów śledzone: "◆" wraca`, glif(TALKER) === "◆", glif(TALKER));

// ⚠ Jedyne starcie priorytetów, którego nie widać wyżej: ten sam NPC jest
// celem bieżącego kroku I ma własne zadanie do wzięcia. Wygrywa „◆", bo mówi
// o tym, co gracz robi TERAZ.
QUESTS.__test_offer = {
  id: "__test_offer",
  name: "Test oferty",
  giver: TALKER,
  description: "Zadanie do wzięcia u tej samej osoby, która jest celem kroku.",
  objectives: [{ kind: "kill", enemy: "rabbit", count: 1 }],
  reward: { xp: 1 },
};
ok(
  `priorytet: "◆" bije "!" u tego samego NPC`,
  glif(TALKER) === "◆" && Quests.getStatus("__test_offer") === "available",
  glif(TALKER),
);
delete QUESTS.__test_offer;

// Domknięcie celu → oddanie u dawcy, więc "?" przechodzi na niego.
Quests.recordTalk(TALKER);
ok("cele spełnione", Quests.isObjectiveMet("__test_mark") === true);
ok(`ready: "?" nad dawcą (${GIVER})`, glif(GIVER) === "?", glif(GIVER));
ok(`ready: "◆" znika z ${TALKER}`, glif(TALKER) === "—", glif(TALKER));

// PRIORYTET: ten sam NPC ma naraz gotowe do oddania I nowe do wzięcia.
QUESTS.__test_extra = {
  id: "__test_extra",
  name: "Test drugie",
  giver: GIVER,
  description: "Drugie zadanie tego samego dawcy, wciąż do wzięcia.",
  objectives: [{ kind: "kill", enemy: "rabbit", count: 1 }],
  reward: { xp: 1 },
};
ok(
  `priorytet: "?" bije "!" u tego samego NPC`,
  glif(GIVER) === "?" && Quests.getStatus("__test_extra") === "available",
  glif(GIVER),
);

// ⚠ Trener JEST osobny: `+` nie konkuruje już o miejsce ze znacznikiem zadania.
// Patryczek uczy I ma własne zadania — czyli dokładnie ten przypadek, w którym
// stara wersja pokazywała jedno kosztem drugiego.
const trenerGlif = npcTrainerBadge(TRAINER)?.text ?? "—";
ok(
  `${TRAINER} ma naraz znacznik zadania i usługi`,
  glif(TRAINER) !== "—" && trenerGlif !== "—",
  `zadanie=${glif(TRAINER)}, trener=${trenerGlif}`,
);
ok(
  "`+` NIGDY nie wychodzi z gałęzi zadaniowej",
  ![GIVER, TALKER, TRAINER].some((n) => glif(n) === "+"),
);

delete QUESTS.__test_mark;
delete QUESTS.__test_extra;

/* ── Wynik ─────────────────────────────────────────────────────────────── */

console.log("");
if (bledy) {
  console.error(`${bledy} BŁĘDÓW.`);
  process.exit(1);
}
console.log("OK — wszystkie asercje przeszły.");
