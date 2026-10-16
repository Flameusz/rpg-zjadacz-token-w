/**
 * Katalog ekwipunku — generator tabel do `docs/ekwipunek_przedmioty.md`.
 *
 * ── Po co to istnieje ──────────────────────────────────────────────────────
 * Bo przepisana liczba zawsze się rozjeżdża. Ten projekt ma na to udokumentowaną
 * bliznę (współrzędne „chaty zachód" w `wioska_plan.md`, stała pozycja Doroty w
 * `CLAUDE.md`) — dokument z ręcznie wklejonym `damageMin` broni rozjedzie się z
 * `GameConfig.ts` przy pierwszym strojeniu i **nikt tego nie zauważy**, bo obie
 * liczby wyglądają wiarygodnie.
 *
 * Dlatego podział jest sztywny:
 *   `docs/ekwipunek_mechanika.md`  — REGUŁY. Pisane ręcznie, zmieniają się rzadko.
 *   `docs/ekwipunek_przedmioty.md` — STAN. Generowany, zmienia się co sesję.
 *
 * ── Dlaczego .mjs, a nie .py jak reszta `tools/` ───────────────────────────
 * Bo źródłem jest TypeScript. Parsowanie `GameConfig.ts` regexem w Pythonie
 * dawałoby generator, który po cichu gubi wpis przy zmianie formatowania —
 * czyli dokładnie ten błąd, któremu ten plik ma zapobiegać. `GameConfig.ts` ma
 * ZERO importów runtime (jedyny import jest `import type`), więc esbuild
 * przerabia go na ESM i node go po prostu wykonuje. Prawdziwe wartości, nie
 * odczytane z tekstu.
 *
 * ── Przymiar, jak `build_mapa.py` ──────────────────────────────────────────
 * Domyślnie tylko drukuje raport i mówi, co by zmienił. Zapisuje wyłącznie z
 * `--zapisz`. Podmienia WYŁĄCZNIE zawartość między znacznikami
 * `<!-- AUTO:start:klucz -->` i `<!-- AUTO:end:klucz -->` — proza wokół nich
 * jest ręczna i generator jej nie dotyka.
 *
 * Użycie:
 *   node tools/katalog_ekwipunku.mjs            # raport, nic nie zapisuje
 *   node tools/katalog_ekwipunku.mjs --zapisz   # wstawia tabele do docs/
 */

import { build } from "esbuild";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOC = join(KORZEN, "docs", "ekwipunek_przedmioty.md");
const ZAPISZ = process.argv.includes("--zapisz");

// ── Wczytanie GameConfig.ts ─────────────────────────────────────────────────

const tmp = join(KORZEN, "node_modules", ".katalog-ekwipunku.mjs");
await build({
  entryPoints: [join(KORZEN, "src", "config", "GameConfig.ts")],
  outfile: tmp,
  format: "esm",
  bundle: false,
  logLevel: "silent",
});
const C = await import(pathToFileURL(tmp).href);
await unlink(tmp).catch(() => {});

const { ITEMS, PLAYER, ATTRIBUTES, EQUIPMENT, ARMOR_PROFILE, QUALITY, SHIELD, WEAPON_FAMILY, ITEM_SETS,
        WEAPON_MATERIAL } = C;

/**
 * ⚠⚠ **Gatunek materiału broni — dopisane 2026-09-17, razem z pierwszymi
 * dwiema żelaznymi konstrukcjami.** `WEAPON_MATERIAL` powstał dobę wcześniej
 * i **nie korzystała z niego żadna broń**, więc ten generator mógł czytać
 * `damageMin`/`buyPrice` wprost i mieć rację. Od chwili, gdy nóż i cep
 * zadeklarowały `iron`, **to samo czytanie zaczęłoby kłamać o 25% obrażeń
 * i 67% ceny** — czyli dokładnie tak, jak zabrania nagłówek tego pliku.
 *
 * ⚠ Broń bez pola `material` jest STALOWA (×1,00), więc dla całej reszty
 * katalogu te dwie funkcje nie zmieniają ani jednej liczby.
 * ⭐ Źródłem prawdy jest `core/WeaponMaterials.ts`; tu jest transkrypcja
 * dwóch jego linijek, bo generator nie importuje `src/core`.
 */
const gatunekBroni = (it) => (it.type === "weapon" ? (it.material ?? "steel") : null);
const gatMulObr = (it) => (gatunekBroni(it) ? WEAPON_MATERIAL[gatunekBroni(it)].damageMul : 1);
const gatMulCeny = (it) => (gatunekBroni(it) ? WEAPON_MATERIAL[gatunekBroni(it)].priceMul : 1);

/*
 * ⚠ **Cechy rodziny czytamy PRAWDZIWYMI funkcjami z `core/WeaponTraits.ts`,
 * nie własnym odczytem pola.**
 *
 * Do 2026-09-03 ten plik sięgał po `f.parryBonus`, `f.critMultiplierBonus`
 * i `f.staggerMs` — czyli po kształt sprzed migracji WeaponTraits (D5).
 * Po migracji tych pól NIE MA, więc odczyty schodziły do `undefined`:
 * kolumna DPS zaniżała topór i sztylet o cały mnożnik krytyka rodziny,
 * a sekcja tożsamości rodzin robiła się **pusta**. Nic nie świeciło na
 * czerwono, bo generator nie miał na to ani jednej asercji — dokładnie ta
 * klasa cichego rozjazdu, przed którą broni nagłówek tego pliku.
 *
 * `WeaponTraits.ts` nie ma ani jednego importu, więc wchodzi tak samo jak
 * `GameConfig.ts` — `bundle: false`, prawdziwy moduł, nie transkrypcja.
 */
const tmpTraits = join(KORZEN, "node_modules", ".katalog-weapontraits.mjs");
await build({
  entryPoints: [join(KORZEN, "src", "core", "WeaponTraits.ts")],
  outfile: tmpTraits,
  format: "esm",
  bundle: false,
  logLevel: "silent",
});
const WT = await import(pathToFileURL(tmpTraits).href);

/**
 * ⚠ **Warstwa czytana z PRAWDZIWEGO `core/ArmorLayers.ts`, nie z kopii mapy.**
 * Ta sama reguła, co przy `familyTraitValue` wyżej i przy `ControlLayout`
 * w `hud_uklad.mjs`: druga tablica „materiał → warstwa" w tym pliku rozjechałaby
 * się z grą przy pierwszej zmianie taksonomii, a diff by tego nie pokazał.
 * Kolczuga przeniosła się już raz (`metalowa` → `L2`, 2026-09-12) i dokładnie
 * taka zmiana musi tu dojechać sama.
 *
 * Moduł bundluje się czysto, bo jego jedyne zależności niebędące configiem
 * (`Protection`, `Items`) są importowane WYŁĄCZNIE jako typy albo same są
 * czystymi czytnikami configu — zero Phasera.
 */
const tmpLayers = join(KORZEN, "node_modules", ".katalog-armorlayers.mjs");
await build({
  entryPoints: [join(KORZEN, "src", "core", "ArmorLayers.ts")],
  outfile: tmpLayers,
  format: "esm",
  bundle: true,
  logLevel: "silent",
  define: { "import.meta.env.DEV": "false" },
});
const AL = await import(pathToFileURL(tmpLayers).href);
const { itemLayer, ARMOR_LAYERS, ARMOR_LAYER_LABEL } = AL;

/**
 * ⚠ **Gatunek materiału z PRAWDZIWEGO `core/ArmorMaterials.ts`** — ta sama
 * reguła, co przy warstwach linijkę wyżej, i ten sam powód: mnożniki gatunku
 * przepisane tutaj rozjechałyby się z grą przy pierwszym strojeniu, a diff by
 * tego nie pokazał.
 *
 * ⚠⚠ **Bez tego cały katalog KŁAMAŁBY o żelazie.** Żelazna sztuka deklaruje
 * liczby KONSTRUKCJI (te same, co jej stalowy bliźniak), a obniżkę robią
 * `materialDefenseMul` i `materialPriceMul` — czytanie `p.defense` i
 * `p.buyPrice` wprost pokazywałoby żelazo jako równe stali. To jest dokładnie
 * ta klasa cichego rozjazdu, którą opisuje nagłówek: *nowa oś mechaniki
 * wymaga NAUCZENIA generatora*.
 */
const tmpMaterials = join(KORZEN, "node_modules", ".katalog-armormaterials.mjs");
await build({
  entryPoints: [join(KORZEN, "src", "core", "ArmorMaterials.ts")],
  outfile: tmpMaterials,
  format: "esm",
  bundle: true,
  logLevel: "silent",
  define: { "import.meta.env.DEV": "false" },
});
const AM = await import(pathToFileURL(tmpMaterials).href);
const { itemMaterial, materialDefenseMul, materialPriceMul, materialLabel } = AM;
await unlink(tmpMaterials).catch(() => {});

/** Punkty ochrony po gatunku — konstrukcja × `materialDefenseMul`. */
const ppOf = (p) => (p.defense ?? 0) * materialDefenseMul(itemMaterial(p.id));
/** Liczba dla tabeli: całkowita bez przecinka, ułamkowa z jednym miejscem. */
const l2 = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ","));
/** Cena po gatunku, z zaokrągleniem gry (`buyPriceOf`). */
const cenaOf = (p) =>
  p.buyPrice == null ? null : Math.max(1, Math.round(p.buyPrice * materialPriceMul(itemMaterial(p.id))));
await unlink(tmpTraits).catch(() => {});
const { familyTraitValue } = WT;

// ── Pomocnicze ──────────────────────────────────────────────────────────────

/** Przecinek dziesiętny — cała dokumentacja projektu jest po polsku. */
const l = (n, m = 1) => n.toFixed(m).replace(".", ",");
const pct = (x, m = 1) => `${l(x * 100, m)}%`;
const mul = (v) => (v === undefined || v === 1 ? "—" : `×${l(v, 2)}`);

const TYP_PL = { slash: "cięte", pierce: "kłute", blunt: "obuchowe" };
const MAT_PL = { leather: "skóra", metal: "metal", padded: "przeszywanica", mail: "kolczuga" };
const SLOT_PL = {
  weapon: "Broń", offhand: "Druga ręka", head: "Głowa", chest: "Klata",
  gloves: "Rękawice", shoulders: "Ramiona", legs: "Nogi", boots: "Buty",
  ring1: "Pierścień", ring2: "Pierścień",
};
/**
 * Sloty pancerza w kolejności od głowy w dół — `ring*` nie niesie punktów.
 *
 * ⚠⚠ **Ta lista jest RĘCZNA i dlatego pilnuje jej asercja niżej.** `shoulders`
 * ożyło 2026-09-16 razem z pierwszymi naramiennikami i **wypadło z katalogu
 * po cichu**: nagłówek liczył 85 sztuk pancerza, a tabele opisywały 81.
 * Cztery naramienniki nie istniały w dokumencie, mimo że istniały w grze —
 * dokładnie ten rodzaj cichej dziury, który ten generator ma zamykać
 * (`tools/CLAUDE.md`: *nowa oś mechaniki wymaga NAUCZENIA generatora*).
 * ⚠ `shoulders` NIE jest warstwowane — zostaje poza `SLOTY_WARSTWOWE`, więc
 *   kolumna „warstwa" pokaże mu „—", tak jak rękawicom i drugiej ręce.
 */
const SLOTY_PANCERZA = ["head", "chest", "gloves", "shoulders", "legs", "boots", "offhand"];
/** Cztery obszary z trzema warstwami (`LAYERED_SLOTS` w `src/ui/EquipLayout.ts`).
 *  ⚠ Rękawice i druga ręka są pancerzem, ale NIE są warstwowane. */
const SLOTY_WARSTWOWE = ["head", "chest", "legs", "boots"];

const przedmioty = Object.values(ITEMS);
const bronie = przedmioty.filter((i) => i.type === "weapon");
const pancerze = przedmioty.filter((i) => i.type === "armor");

/** Redukcja z punktów — LUSTRO `Protection.reductionFromPoints`. ⚠ Gdyby tam
 *  zmienił się wzór, ten raport zacząłby kłamać cicho. Sprawdzane niżej
 *  asercją na znanej wartości. */
const redukcja = (pkt) =>
  pkt <= 0 ? 0 : Math.min(pkt / (pkt + EQUIPMENT.defenseK), EQUIPMENT.maxDefenseReduction);

/** Punkty skuteczne przeciw typowi — lustro `Protection.armorPointsAgainst`. */
const pktPrzeciw = (pkt, mat, typ) => (typ ? pkt * ARMOR_PROFILE[mat][typ] : pkt);

// ── Liczby broni ────────────────────────────────────────────────────────────

/**
 * Jeden wiersz = jedna PARA (broń, wariant). Broń jednowariantowa daje jeden
 * wiersz, miecz i siekiera po dwa. To jest właściwa jednostka: gracz nie
 * wybiera broni, tylko sposób jej użycia.
 */
function wariantyBroni(it, sila, zrecznosc = 0) {
  const m = it.melee ?? PLAYER.melee;
  const ataki = it.attacks ?? PLAYER.attacks;
  // ⚠ Gatunek mnoży ZAKRES BAZOWY, dokładnie jak `Quality.instanceDamage`.
  const gm = gatMulObr(it);
  const bazaObr = { min: it.damageMin * gm, max: it.damageMax * gm };
  const bazaCd = it.attackCooldown;
  const bazaZamach = it.swingDurationMs;

  const premiaTempa = Math.min(
    zrecznosc * ATTRIBUTES.attackSpeedPerAgility,
    ATTRIBUTES.maxAttackSpeedBonus,
  );
  // ⚠ **Zręczności NIE MA w szansie na krytyka od 2026-08-20** — patrz
  // `ATTRIBUTES.maxCritChance`. Krytyk należy do BRONI i RODZINY.
  const szansaKryt = Math.min(
    PLAYER.critChance + (m.critChanceBonus ?? 0),
    ATTRIBUTES.maxCritChance,
  );
  // ⚠ TRZY człony, dokładnie jak `Progression.critMultiplier`: baza + premia
  // BRONI (`melee`, dziś sztylet) + oś RODZINY (`WEAPON_FAMILY`, dziś topory).
  // Bez trzeciego kolumna DPS zaniżałaby topory i ten plik zacząłby po cichu
  // kłamać — czego cały jego nagłówek zabrania.
  const rodzina = it.family ? WEAPON_FAMILY[it.family] : null;
  const mnoznikKryt =
    PLAYER.critMultiplier + (m.critMultiplierBonus ?? 0)
    + familyTraitValue(rodzina, "critMultiplierBonus");

  return ataki.map((w) => {
    const sm = w.swingMul ?? 1;
    const cd = (bazaCd * sm) / (1 + premiaTempa);
    const zamach = (bazaZamach * sm) / (1 + premiaTempa);
    // ⚠ **Root NIE jest już `zamach + 40`** (zmiana 2026-08-20). Zobowiązanie
    // do klatki trafienia zostaje, odzyskanie skraca Zręczność — przepisane
    // z `Progression.rootDurationMs`.
    const redukcjaOdzysku = Math.min(
      zrecznosc * ATTRIBUTES.recoveryPerAgility,
      ATTRIBUTES.maxRecoveryReduction,
    );
    const root =
      zamach * PLAYER.swingHitFraction +
      (zamach * (1 - PLAYER.swingHitFraction) + PLAYER.swingPoseBufferMs) * (1 - redukcjaOdzysku);
    // ⚠ **Atrybuty MNOŻĄ obrażenia broni, w tempie zapisanym NA BRONI**
    // (`strScale`/`dexScale`) — nie dodają płasko. Bez tego kolumny DPS @S0/@S4
    // zaniżałyby ciężką broń i zawyżały lekką, czyli plik kłamałby dokładnie
    // o tym, co ta zmiana naprawiała. Patrz `Progression.attributeDamageMul`.
    const mnoznikAtr = 1 + sila * it.strScale + zrecznosc * it.dexScale;
    const dmin = bazaObr.min * (w.damageMul ?? 1) * mnoznikAtr;
    const dmax = bazaObr.max * (w.damageMul ?? 1) * mnoznikAtr;
    const srednia = (dmin + dmax) / 2;
    return {
      bron: it,
      wariant: w,
      // ⚠⚠ **Kolumna `łuk` zniknęła 2026-09-18** razem z `melee.arcDeg`.
      //   Kąt jest dziś własnością umiejętności (`ABILITIES.cleave.halfArcDeg`),
      //   a nie konstrukcji — więc wypisywanie go per broń opisywałoby oś,
      //   której broń nie ma. ⛔ Nie przywracaj jej, dopóki łuk nie wróci
      //   na przedmiot — a decyzja mówi, że nie wraca.
      zasieg: m.reach * (w.reachMul ?? 1),
      // ⚠ **Martwa strefa skaluje się TYM SAMYM `reachMul`, co zasięg górny** —
      //   inaczej wariant przesuwałby tylko jedną granicę pasma i po cichu
      //   zmieniał jego szerokość. Broń bez pola ma 0, czyli zachowanie sprzed
      //   wprowadzenia osi.
      martwa: (m.minReach ?? 0) * (w.reachMul ?? 1),
      odrzut: m.knockback * Math.min(1, Math.max(0, w.knockbackMul ?? 1)),
      przerywa: m.interrupts === true && w.interrupts !== false,
      dmin, dmax, srednia,
      cdMs: cd * 1000,
      zamach, root,
      rootProc: root / (cd * 1000),
      dps: (srednia * (1 + szansaKryt * (mnoznikKryt - 1))) / cd,
    };
  });
}

// ── Tabele ──────────────────────────────────────────────────────────────────

function tabelaBroni() {
  const w = [];
  w.push("| broń | ręce | gat. | wariant | typ | obr. | DPS @S0 | DPS @S4 | cykl | root | root/cykl | zasięg | martwa | odrzut | przerywa | Siła | cena | trwałość |");
  w.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  const goleRece = {
    id: "__fists", name: "Gołe ręce", ...PLAYER,
    damageMin: PLAYER.damageMin, damageMax: PLAYER.damageMax,
    attackCooldown: PLAYER.attackCooldown, swingDurationMs: PLAYER.swing.durationMs,
    melee: PLAYER.melee, attacks: PLAYER.attacks, buyPrice: null, durability: null,
  };
  for (const it of [goleRece, ...bronie]) {
    const s0 = wariantyBroni(it, 0);
    const s4 = wariantyBroni(it, 4);
    s0.forEach((v, i) => {
      // ⚠ `hands` jeszcze nie istnieje w danych (patrz `bron_dwureczna_analiza.md`).
      // Kolumna zapali się sama w dniu, w którym pole zostanie dodane.
      // ⭐ **1.5H (2026-09-18)**: `grip: "either"` znaczy, że `hands: 2` opisuje
      //   PEŁNY profil, a istnieje też mniejszy. Kolumna musi to powiedzieć,
      //   bo inaczej półtorak czyta się w tabeli jak zwykła broń dwuręczna.
      const rece = it.grip === "either" ? "**1.5H**" : it.hands === 2 ? "**2H**" : it.hands === 1 ? "1H" : "—";
      // ⚠ Kolumna pokazuje gatunek TYLKO wtedy, gdy nie jest stalowy — stal
      //   jest poziomem zerowym i wypisanie jej 30 razy niczego nie niesie.
      const gat = gatunekBroni(it) && gatunekBroni(it) !== "steel"
        ? `**${WEAPON_MATERIAL[gatunekBroni(it)].name}**` : "—";
      w.push(
        `| ${i === 0 ? it.name : ""} | ${i === 0 ? rece : ""} | ${i === 0 ? gat : ""} | ${v.wariant.name} | ${TYP_PL[v.wariant.damageType]} `
        + `| ${l(v.dmin, 1)}–${l(v.dmax, 1)} | ${l(v.dps)} | ${l(s4[i].dps)} `
        + `| ${Math.round(v.cdMs)} ms | ${Math.round(v.root)} ms | ${pct(v.rootProc, 0)} `
        + `| ${Math.round(v.zasieg)} | ${v.martwa ? `**${Math.round(v.martwa)}**` : "—"} | ${v.odrzut || "—"} | ${v.przerywa ? "**tak**" : "nie"} `
        + `| ${it.requires?.strength ?? "—"} | ${it.buyPrice == null ? "—" : Math.round(it.buyPrice * gatMulCeny(it))} | ${it.durability ?? "—"} |`,
      );
    });
  }
  return w.join("\n");
}

function tabelaMnoznikowWariantow() {
  const w = [];
  w.push("| broń | wariant | `reachMul` | `damageMul` | `swingMul` | `thrustMul` | `sweepMul` | `knockbackMul` | `interrupts` |");
  w.push("|---|---|---|---|---|---|---|---|---|");
  for (const it of bronie) {
    for (const a of it.attacks ?? []) {
      w.push(
        `| ${it.name} | ${a.name} | ${mul(a.reachMul)} | ${mul(a.damageMul)} `
        + `| ${mul(a.swingMul)} | ${mul(a.thrustMul)} | ${mul(a.sweepMul)} | ${mul(a.knockbackMul)} `
        + `| ${a.interrupts === false ? "wyłączone" : "—"} |`,
      );
    }
  }
  return w.join("\n");
}

/**
 * Jak OPISAĆ jedną cechę rodziny w katalogu.
 *
 * ⚠ **Klucze muszą pokrywać `WeaponTrait["kind"]` z `core/WeaponTraits.ts`.**
 * Cecha bez wpisu NIE jest pomijana po cichu — ląduje w tabeli jako
 * `⚠ NIEZNANA CECHA` i zapala kontrolę niżej. Poprzednia wersja tego pliku
 * czytała trzy pola po nazwie i po migracji D5 zamilkła bez śladu.
 *
 * ⛔ To jest wyłącznie OPIS. Wartości pochodzą z `WEAPON_FAMILY`, a to, czy
 * i jak są konsumowane, rozstrzyga `Progression` — ten plik niczego nie liczy
 * na własną rękę.
 */
const OPIS_CECHY = {
  parry: () =>
    "**parowanie** — *znacznik bez wartości; liczba stoi w modelu broni* "
    + "(`melee.parryBonus`)",
  critMultiplierBonus: (t) => `siła krytyka **+${l(t.value, 2)}**`,
  staggerMs: (t) => `zachwianie **${t.value} ms**`,
  reach: () => "**zasięg** — *znacznik bez wartości; liczba stoi w modelu broni*",
};

/** Cechy jednej rodziny, opisane po kolei. Nierozpoznane zostają WIDOCZNE. */
function opiszCechy(f) {
  return (f.traits ?? []).map((t) => OPIS_CECHY[t.kind]?.(t) ?? `⚠ NIEZNANA CECHA \`${t.kind}\``);
}
/**
 * Rodziny broni: oś archetypu + kto do niej należy. Generowane, bo inaczej
 * liczba wpisana ręcznie rozjedzie się z `WEAPON_FAMILY` i nikt tego nie
 * zauważy — obie będą wyglądały wiarygodnie.
 */
function tabelaRodzin() {
  const w = [];
  w.push("| rodzina | oś | co realnie robi DZIŚ | przedmioty |");
  w.push("|---|---|---|---|");
  for (const [id, f] of Object.entries(WEAPON_FAMILY)) {
    const czlonkowie = bronie.filter((b) => b.family === id).map((b) => b.name);
    const efekty = opiszCechy(f);
    w.push(
      `| **${f.label}** (\`${id}\`) | ${f.identity} | ${efekty.join(", ") || "— *tożsamość niesie model*"} `
      + `| ${czlonkowie.join(", ") || "*brak*"} |`,
    );
  }
  const bezRodziny = bronie.filter((b) => !b.family).map((b) => b.name);
  w.push("");
  w.push(`**Świadomie poza rodzinami:** ${bezRodziny.join(", ") || "*brak*"} `
    + "— plus gołe ręce. Brak rodziny jest legalnym stanem, nie luką do zapełnienia.");
  return w.join("\n");
}

function tabelaPancerzaPerSlot() {
  const w = [];
  for (const slot of SLOTY_PANCERZA) {
    const wSlocie = pancerze.filter((p) => p.slot === slot);
    w.push(`**${SLOT_PL[slot]}** (\`${slot}\`) — ${wSlocie.length} szt.`);
    w.push("");
    if (!wSlocie.length) {
      w.push("_pusty_");
      w.push("");
      continue;
    }
    // ⚠ Sortowane WARSTWAMI, nie kolejnością w `ITEMS`. Tabela ma czytać się
    // jak stos od ciała na zewnątrz — to jest cała wartość tej kolumny.
    const kolejnosc = (x) => ARMOR_LAYERS.indexOf(itemLayer(x.id) ?? "L3");
    const uszeregowane = [...wSlocie].sort((a, b) => kolejnosc(a) - kolejnosc(b));
    w.push("| warstwa | przedmiot | profil | gatunek | pkt | waga | sam: bez typu / cięte / kłute / obuch. | Siła | cena | dodatkowo |");
    w.push("|---|---|---|---|---|---|---|---|---|---|");
    for (const p of uszeregowane) {
      // ⚠ Punkty PO gatunku, nie surowe `p.defense` — patrz `ppOf`.
      const d = ppOf(p);
      const r = ["", "slash", "pierce", "blunt"].map((t) =>
        pct(redukcja(pktPrzeciw(d, p.armorType, t || undefined)), 1),
      );
      const extra = p.block
        ? `blok ${pct(p.block.reduction, 0)} / tempo ×${l(p.block.swingMul, 2)}`
        : "—";
      // Slot niewarstwowany (rękawice, druga ręka) dostaje „—", a nie zmyśloną
      // warstwę: `itemLayer` odpowiada dla każdego pancerza, ale warstwowane są
      // cztery obszary (`LAYERED_SLOTS`) i tabela ma o tym mówić prawdę.
      const warstwa = SLOTY_WARSTWOWE.includes(slot) ? (itemLayer(p.id) ?? "—") : "—";
      const gat = itemMaterial(p.id);
      w.push(
        `| **${warstwa}** | ${p.name} | ${MAT_PL[p.armorType] ?? p.armorType} `
        + `| ${gat ? materialLabel(gat) : "—"} | ${l2(d)} `
        + `| ${p.weight ?? "—"} | ${r.join(" / ")} `
        + `| ${p.requires?.strength ?? "—"} | ${cenaOf(p) ?? "—"} | ${extra} |`,
      );
    }
    w.push("");
  }
  return w.join("\n").trimEnd();
}

/** Nazwane komplety — jedyne miejsce w tym pliku z ręczną listą, bo „komplet"
 *  jest pojęciem projektowym, a nie własnością danych. */
const KOMPLETY = [
  ["brak", []],
  // ⚠ Jednostką jest PEŁNA PIĄTKA slotów, nie czwórka. Do 2026-08-17 rękawice
  // miała tylko przeszywanica (i to jako nagrodę), więc komplety liczyło się
  // po cztery sztuki; dziś każdy materiał poza butami przeszywanicy ma swój
  // własny kafel w każdym slocie i czwórka przestała opisywać cokolwiek.
  ["skóra (5 szt.)", ["leather_helmet", "leather_chest", "leather_gloves", "leather_legs", "leather_boots"]],
  ["przeszywanica (5 szt.)", ["padded_cap", "gambeson", "padded_gloves", "padded_chausses", "foot_wraps"]],
  ["kolczuga (5 szt.)", ["mail_coif", "mail_hauberk", "mail_gloves", "mail_chausses", "mail_boots"]],
  // Historyczny sposób noszenia kolczugi: NA przeszywanicy. W grze jest jeden
  // slot klatki, więc dosłownie nawarstwić się nie da — ale przeszywanica ma
  // najlepszy obuch w tabeli (1,1), a kolczuga najgorszy (0,35), więc oddanie
  // jej klatki naprawia dokładnie tę dziurę, którą kolczuga otwiera. Ten
  // wiersz istnieje po to, żeby tę wymianę było widać w liczbach.
  ["kolczuga + przeszywanica na klacie", ["mail_coif", "gambeson", "mail_gloves", "mail_chausses", "mail_boots"]],
  ["stal (5 szt.)", ["steel_helmet", "steel_chest", "steel_gauntlets", "steel_legs", "steel_boots"]],
  ["stal + tarcza okuta", ["steel_helmet", "steel_chest", "steel_gauntlets", "steel_legs", "steel_boots", "ironbound_shield"]],
];

function tabelaKompletow() {
  const w = [];
  w.push("| komplet | pkt | bez typu | cięte | kłute | obuchowe | Siła | cena |");
  w.push("|---|---|---|---|---|---|---|---|");
  for (const [nazwa, ids] of KOMPLETY) {
    const szt = ids.map((id) => ITEMS[id]);
    const brak = ids.filter((id) => !ITEMS[id]);
    if (brak.length) { w.push(`| ${nazwa} | ⚠ brak w ITEMS: ${brak.join(", ")} | | | | | | |`); continue; }
    const pktSuma = szt.reduce((s, p) => s + ppOf(p), 0);
    const perTyp = ["slash", "pierce", "blunt"].map((t) =>
      pct(redukcja(szt.reduce((s, p) => s + pktPrzeciw(ppOf(p), p.armorType, t), 0))),
    );
    const sila = Math.max(0, ...szt.map((p) => p.requires?.strength ?? 0));
    const cena = szt.reduce((s, p) => s + (cenaOf(p) ?? 0), 0);
    // ⚠ Sztuka bez `buyPrice` (nagroda zadaniowa) NIE MOŻE po cichu wypaść z
    // sumy — inaczej komplet z rękawicami kosztuje tyle samo, co bez nich,
    // i tabela mówi, że dodatkowa ochrona jest za darmo.
    const nieKupne = szt.filter((p) => p.buyPrice == null);
    const cenaOpis = !cena
      ? "—"
      : nieKupne.length
        ? `${cena} + ${nieKupne.length}× nagroda`
        : `${cena}`;
    w.push(
      `| ${nazwa} | ${pktSuma} | ${pct(redukcja(pktSuma))} | ${perTyp.join(" | ")} `
      + `| ${sila || "—"} | ${cenaOpis} |`,
    );
  }
  return w.join("\n");
}

function tabelaProfiliPancerza() {
  const w = [];
  w.push("| materiał | cięte | kłute | obuchowe | najlepsza odpowiedź |");
  w.push("|---|---|---|---|---|");
  for (const [mat, prof] of Object.entries(ARMOR_PROFILE)) {
    const najlepszy = Object.entries(prof).sort((a, b) => a[1] - b[1])[0][0];
    w.push(
      `| ${MAT_PL[mat] ?? mat} (\`${mat}\`) | ${l(prof.slash, 2)} | ${l(prof.pierce, 2)} | ${l(prof.blunt, 2)} `
      + `| **${TYP_PL[najlepszy]}** |`,
    );
  }
  return w.join("\n");
}

/** Siatka slot × materiał — puste komórki są listą zakupów na przyszłe przedmioty. */
function tabelaLuk() {
  const materialy = Object.keys(ARMOR_PROFILE);
  const w = [];
  w.push(`| slot | ${materialy.map((m) => MAT_PL[m] ?? m).join(" | ")} |`);
  w.push(`|---|${materialy.map(() => "---").join("|")}|`);
  let puste = 0;
  for (const slot of SLOTY_PANCERZA) {
    const kom = materialy.map((mat) => {
      const l = pancerze.filter((p) => p.slot === slot && p.armorType === mat);
      if (!l.length) { puste++; return "— **luka**"; }
      return l.map((p) => `${p.name} (${l2(ppOf(p))})`).join("<br>");
    });
    w.push(`| **${SLOT_PL[slot]}** | ${kom.join(" | ")} |`);
  }
  return { tabela: w.join("\n"), puste };
}

/** Który typ obrażeń jest dostarczany na jakim dystansie — to jest mapa nisz
 *  dla nowej broni, i to ona pokazała, że nie ma dalekiego `pierce`. */
function tabelaZasiegTyp() {
  const wiersze = [];
  for (const it of bronie) for (const v of wariantyBroni(it, 0)) {
    wiersze.push({ nazwa: `${it.name} / ${v.wariant.name}`, typ: v.wariant.damageType, zasieg: v.zasieg });
  }
  const kubelki = [["zwarcie (<60)", (z) => z < 60], ["średni (60–72)", (z) => z >= 60 && z < 72], ["daleki (≥72)", (z) => z >= 72]];
  const w = [];
  w.push("| dystans | cięte | kłute | obuchowe |");
  w.push("|---|---|---|---|");
  for (const [nazwa, test] of kubelki) {
    const kom = ["slash", "pierce", "blunt"].map((t) => {
      const p = wiersze.filter((r) => r.typ === t && test(r.zasieg));
      return p.length ? p.map((r) => `${r.nazwa} (${Math.round(r.zasieg)})`).join("<br>") : "— **luka**";
    });
    w.push(`| ${nazwa} | ${kom.join(" | ")} |`);
  }
  return w.join("\n");
}

/** ⚠ `QUALITY.modifiers` jest kluczowane STATYSTYKĄ, potem poziomem — nie
 *  odwrotnie. Tabela musi to odwrócić, bo czytelnik pyta „co daje Dobra", a nie
 *  „co robi damage na siedmiu poziomach". */
function tabelaJakosci() {
  const M = QUALITY.modifiers;
  const znak = (v) => (v === 0 ? "—" : `${v > 0 ? "+" : "−"}${l(Math.abs(v) * 100, 0)}%`);
  const w = [];
  w.push("| poziom | nazwa | obrażenia | obrona | tempo ataku | maks. trwałość | cena | wymóg Siły | w sklepie? |");
  w.push("|---|---|---|---|---|---|---|---|---|");
  for (const poziom of Object.keys(QUALITY.levels)) {
    const wReq = M.requirement[poziom];
    w.push(
      `| ${poziom} | ${poziom == QUALITY.defaultLevel ? `**${QUALITY.levels[poziom].name}**` : QUALITY.levels[poziom].name} `
      + `| ${znak(M.damage[poziom])} | ${znak(M.defense[poziom])} | ${znak(M.attackSpeed[poziom])} `
      + `| ×${l(M.maxDurability[poziom], 2)} | ×${l(QUALITY.priceMul[poziom], 2)} `
      + `| ${wReq === 0 ? "—" : wReq > 0 ? `+${wReq}` : `${wReq}`} `
      + `| ${poziom <= QUALITY.shopMaxLevel ? "tak" : "**nie — rezerwa nagród**"} |`,
    );
  }
  return w.join("\n");
}

// ── Sanity: czy lustra wzorów jeszcze się zgadzają ──────────────────────────

const kontrole = [];
{
  /*
   * ⚠⚠ **Lustra sprawdzane PRAWDZIWĄ funkcją gry, nie znaną liczbą (`OI-23`
   * A-14, 2026-10-09).** Stały tu „pełna stal bez typu = 53,3%" i „pełna skóra
   * = 35,1%" na ZAHARDKODOWANEJ liście czterech sztuk — podczas gdy tabela tego
   * samego skryptu liczy komplet z pięciu. Asercja nie mogła zaświecić na
   * czerwono z powodu, dla którego istniała: zmiana wzoru w `Protection` nie
   * ruszała liczby sumowanej z czterech wpisów `ITEMS`. Dziś `Protection.ts`
   * jest wczytywany esbuildem (czysty moduł, bez Phasera) i porównywany
   * z lustrem w całym paśmie punktów.
   */
  const protTmp = join(KORZEN, "node_modules", ".katalog-protection.mjs");
  await build({
    entryPoints: [join(KORZEN, "src", "core", "Protection.ts")],
    outfile: protTmp,
    format: "esm",
    bundle: true,
    logLevel: "silent",
  });
  const P = await import(pathToFileURL(protTmp).href);
  await unlink(protTmp).catch(() => {});
  const probki = Array.from({ length: 401 }, (_, i) => i * 0.75 - 10); // −10 … 290 pkt
  const zlaRed = probki.filter((p) => Math.abs(redukcja(p) - P.reductionFromPoints(p)) > 1e-12);
  kontrole.push([
    `lustro redukcji = Protection.reductionFromPoints (${probki.length} próbek)`
      + (zlaRed.length ? ` — ROZJAZD przy ${zlaRed.slice(0, 3).join(", ")} pkt` : ""),
    zlaRed.length === 0,
  ]);
  const zlePkt = [];
  for (const mat of Object.keys(ARMOR_PROFILE))
    for (const typ of [undefined, "slash", "pierce", "blunt"])
      if (Math.abs(pktPrzeciw(40, mat, typ) - P.armorPointsAgainst(40, mat, typ)) > 1e-12) zlePkt.push(`${mat}/${typ}`);
  kontrole.push([
    `lustro punktów przeciw typowi = Protection.armorPointsAgainst`
      + (zlePkt.length ? ` — ROZJAZD: ${zlePkt.join(", ")}` : ""),
    zlePkt.length === 0,
  ]);
  kontrole.push([`cap redukcji = ${pct(EQUIPMENT.maxDefenseReduction, 0)}`, EQUIPMENT.maxDefenseReduction === 0.75]);
  kontrole.push([`kąt bloku = ${SHIELD.blockArcDeg}°`, SHIELD.blockArcDeg === 90]);

  /*
   * ⚠⚠ **Asercja, której brak przepuścił naramienniki (2026-09-16).**
   * `SLOTY_PANCERZA` jest listą ręczną, a nagłówek raportu liczy pancerze
   * z `ITEMS` — więc slot dołożony w configu i pominięty tutaj znikał z KAŻDEJ
   * tabeli, zostawiając w nagłówku prawdziwą liczbę. Raport był zielony,
   * dokument niepełny o cztery sztuki.
   *
   * ⛔ Nie zamieniaj tego na „weź wszystkie sloty z `ITEMS`". Kolejność tej
   * listy jest treścią (od głowy w dół), a milczące dopisanie nowego slotu na
   * końcu odebrałoby powód, żeby ktokolwiek spojrzał, gdzie ma stać.
   */
  const bezTabeli = pancerze.filter((p) => !SLOTY_PANCERZA.includes(p.slot));
  kontrole.push([
    `każdy pancerz trafia do tabeli: ${pancerze.length - bezTabeli.length}/${pancerze.length}`
      + (bezTabeli.length ? ` — POZA: ${[...new Set(bezTabeli.map((p) => p.slot))].join(", ")}` : ""),
    bezTabeli.length === 0,
  ]);

  /*
   * ⚠ **Kontrola, której brak przepuścił migrację D5.** Odczyt nieistniejącego
   * pola dawał `undefined`, więc tabela rodzin cichła, a DPS toporów spadał —
   * i nic tego nie zgłaszało. Ta asercja pyta o RÓWNOŚĆ: ile cech rodziny
   * zadeklarowały, tyle katalog ma opisać.
   *
   * ⚠ Człon `zadeklarowane > 0` jest częścią asercji, nie ozdobnikiem: gdyby
   * `WEAPON_FAMILY` przestało nieść cechy w ogóle, `0 === 0` świeciłoby na
   * zielono i kontrola zgłosiłaby, że wszystko gra, tracąc cel z oczu.
   */
  const zadeklarowane = Object.values(WEAPON_FAMILY)
    .reduce((s, f) => s + (f.traits?.length ?? 0), 0);
  const opisane = Object.values(WEAPON_FAMILY)
    .reduce((s, f) => s + opiszCechy(f).filter((o) => !o.startsWith("⚠")).length, 0);
  kontrole.push([
    `cechy rodzin opisane: ${opisane}/${zadeklarowane}`,
    zadeklarowane > 0 && opisane === zadeklarowane,
  ]);

  /* ⚠ I druga strona tej samej monety: rodzina, która NIC nie deklaruje,
   *    jest dziś stanem nieistniejącym. Gdyby się pojawiła, ma być widoczna
   *    jako decyzja, a nie odkryta przy czytaniu pustej komórki w dokumencie. */
  const bezCech = Object.entries(WEAPON_FAMILY)
    .filter(([, f]) => !(f.traits?.length ?? 0))
    .map(([id]) => id);
  kontrole.push([
    `rodziny bez zadeklarowanych cech: ${bezCech.join(", ") || "brak"}`,
    bezCech.length === 0,
  ]);
}

// ── Złożenie ────────────────────────────────────────────────────────────────

/**
 * ZESTAWY — oś dodana 2026-09-11 razem z `ITEM_SETS`.
 *
 * ⚠ **Generator MUSIAŁ się jej nauczyć** (reguła z `tools/CLAUDE.md`: nowa oś
 * mechaniki wymaga nauczenia generatora). Bez tego katalog dalej opisywałby
 * dwadzieścia pancerzy jako niezwiązane ze sobą, a członkostwo w komplecie —
 * czyli rzecz, która w późnej grze decyduje o wyborze — nie byłoby widoczne
 * nigdzie poza kodem.
 *
 * ⚠ **Członkowie liczeni z `ITEMS`, nie deklarowani w tabeli.** Nowy przedmiot
 * z tagiem `set` wchodzi do tego zestawienia sam; ręczna lista rozjechałaby się
 * przy pierwszym takim dopisku — dokładnie ta sama choroba, którą ten plik już
 * raz opisał przy `KOMPLETY`.
 */
function tabelaZestawow() {
  const czlonkowie = new Map();
  for (const [id, def] of Object.entries(ITEMS)) {
    if (!def.set) continue;
    if (!czlonkowie.has(def.set)) czlonkowie.set(def.set, []);
    czlonkowie.get(def.set).push(id);
  }
  const w = [];
  w.push("| zestaw | członków | progi | premie | sloty |");
  w.push("|---|---|---|---|---|");
  for (const [id, def] of Object.entries(ITEM_SETS ?? {})) {
    const ids = czlonkowie.get(id) ?? [];
    const sloty = [...new Set(ids.map((x) => SLOT_PL[ITEMS[x].slot] ?? ITEMS[x].slot))].join(", ");
    const progi = def.tiers.map((t) => `${t.count}`).join(" / ");
    const premie = def.tiers.map((t) => t.text).join(" · ");
    const ostrz = ids.length === 0 ? " ⚠ ZERO członków" : "";
    w.push(`| ${def.name} | ${ids.length}${ostrz} | ${progi} | ${premie} | ${sloty} |`);
  }
  // Tag wskazujący na nieistniejący zestaw = przedmiot wypadający z kompletu
  // po cichu. Asercja, nie ozdoba.
  const osierocone = [...czlonkowie.keys()].filter((k) => !(k in (ITEM_SETS ?? {})));
  if (osierocone.length) {
    w.push("");
    w.push(`⚠ **Tagi bez definicji zestawu:** ${osierocone.join(", ")}`);
  }
  w.push("");
  w.push(
    "⚠ **Najwyższy próg nie sięga liczby członków** i to jest decyzja projektowa," +
      " nie brak: przy pięciu członkach i progach 2/4 zawsze zostaje wolne miejsce" +
      " na sztukę z innego zestawu. Pełne uzasadnienie przy `ITEM_SETS`" +
      " w `GameConfig.ts`.",
  );
  return w.join("\n").trimEnd();
}

/**
 * STOS WARSTWOWY — co stoi na której warstwie w czterech obszarach.
 *
 * ⚠ **Ta tabela istnieje, żeby KOLIZJA WARSTW nie mogła się schować.** Do
 * 2026-09-12 kolczuga i płyta dzieliły jedną warstwę, przez co kanoniczny stos
 * „przeszywanica → kolczuga → napierśnik" był niewyrażalny — i nie widział tego
 * nikt, bo żaden dokument nie pokazywał warstw obok siebie. Pusta komórka tutaj
 * jest informacją; dwie rodziny w jednej komórce bywają poprawne (skóra
 * i kolczuga dzielą L2 celowo).
 */
function tabelaStosu() {
  const w = [];
  w.push("| obszar | " + ARMOR_LAYERS.map((x) => ARMOR_LAYER_LABEL[x]).join(" | ") + " |");
  w.push("|---" + "|---".repeat(ARMOR_LAYERS.length) + "|");
  for (const slot of SLOTY_WARSTWOWE) {
    const kom = ARMOR_LAYERS.map((warstwa) => {
      const lista = pancerze
        .filter((p) => p.slot === slot && itemLayer(p.id) === warstwa)
        .map((p) => p.name);
      return lista.length ? lista.join(" · ") : "_(puste)_";
    });
    w.push(`| **${SLOT_PL[slot]}** | ${kom.join(" | ")} |`);
  }
  w.push("");
  w.push(
    "⚠ **Warstwa jest właściwością PRZEDMIOTU, nie sytuacji** — przeszywanica"
    + " noszona sama jest dalej L1, z pustym L2 i L3. Taksonomia:"
    + " `docs/decyzje/2026-09-12-taksonomia-pancerza.md`.",
  );
  return w.join("\n").trimEnd();
}

const luki = tabelaLuk();
const BLOKI = {
  bronie: tabelaBroni(),
  rodziny: tabelaRodzin(),
  warianty: tabelaMnoznikowWariantow(),
  "pancerz-sloty": tabelaPancerzaPerSlot(),
  stos: tabelaStosu(),
  komplety: tabelaKompletow(),
  zestawy: tabelaZestawow(),
  profile: tabelaProfiliPancerza(),
  "luki-pancerz": luki.tabela,
  "luki-bron": tabelaZasiegTyp(),
  jakosc: tabelaJakosci(),
};

console.log("=== katalog ekwipunku ===");
console.log(`broni: ${bronie.length} (wariantów: ${bronie.reduce((s, b) => s + (b.attacks?.length ?? 0), 0)})`);
console.log(`pancerza: ${pancerze.length} w ${SLOTY_PANCERZA.filter((s) => pancerze.some((p) => p.slot === s)).length}/${SLOTY_PANCERZA.length} slotach`);
console.log(
  `warstwy: ` +
    ARMOR_LAYERS.map(
      (x) =>
        `${x} ${pancerze.filter((p) => SLOTY_WARSTWOWE.includes(p.slot) && itemLayer(p.id) === x).length}`,
    ).join(" · ") +
    ` (w czterech obszarach warstwowanych)`,
);
console.log(`materiałów: ${Object.keys(ARMOR_PROFILE).length}`);
console.log(`pustych komórek slot × materiał: ${luki.puste}`);
console.log("");
for (const [opis, ok] of kontrole) console.log(`${ok ? "OK  " : "BLAD"} ${opis}`);
console.log("");

let doc = existsSync(DOC) ? await readFile(DOC, "utf8") : null;
if (!doc) {
  console.log(`BLAD: brak ${DOC} — utwórz plik ze znacznikami AUTO, potem uruchom ponownie.`);
  process.exit(1);
}
let zmian = 0;
/*
 * ⚠⚠ **Koniec linii DOKUMENTU, nie LF na sztywno** (naprawa 2026-09-18).
 * Plik przychodzi z gita z CRLF (`core.autocrlf = true`, brak `.gitattributes`),
 * a generator wstawiał LF — więc `nowy !== doc` było prawdziwe ZAWSZE, nawet
 * przy identycznej treści. Skutek: „11 bloków do odświeżenia" przy zerowym
 * rozjeździe i **stale czerwony `doc_check` §T**, w którym utonąłby prawdziwy
 * rozjazd. Zmierzone: po normalizacji końców linii plik był identyczny co do
 * bajtu (40 117 = 40 117 B). ⛔ To NIE jest rozluźnienie asercji — porównanie
 * nadal jest dokładne, tylko przestało mylić „inny separator" z „inną treścią".
 */
const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
const NL = doc.includes(CR + LF) ? CR + LF : LF;
for (const [klucz, tresc] of Object.entries(BLOKI)) {
  const re = new RegExp(`(<!-- AUTO:start:${klucz} -->)([\\s\\S]*?)(<!-- AUTO:end:${klucz} -->)`);
  if (!re.test(doc)) { console.log(`BLAD: brak znacznika AUTO:${klucz} w dokumencie`); continue; }
  const nowy = doc.replace(re, `$1${NL}${tresc.split(LF).join(NL)}${NL}$3`);
  if (nowy !== doc) { zmian++; console.log(`zmiana: ${klucz}`); }
  doc = nowy;
}
console.log("");
if (!ZAPISZ) {
  console.log(`PRZYMIAR — ${zmian} bloków do odświeżenia. Nic nie zapisano. Uruchom z --zapisz.`);
} else {
  await writeFile(DOC, doc, "utf8");
  console.log(`ZAPISANO ${DOC} (${zmian} bloków).`);
}
