---
typ: OPERACYJNE
domena: [creatures, quests]
tytul: Bandyci — plan etapu (pierwsi humanoidalni wrogowie)
stan: zywy
kotwice: []
otwarte: [OI-171]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# Bandyci — plan etapu

> **Decyzja autora 2026-10-11: „Tak, całość".** Ten plik jest punktem wejścia
> etapu (`OI-171`) — co ustalono i w jakiej kolejności. Jak działa to, co już
> wejdzie do kodu, opisze `docs/systemy/creatures.md` (STAN), nie ten plik.

## Po co

Zestawienia z 2026-10-11 (`docs/stworzenia_katalog.md`, `docs/postep_katalog.md`)
pokazały, że rozgrywce brakuje zawartości, nie systemów:

- jedno wyczyszczenie map daje poziom 17, po Szarym nie ma na kim rosnąć
  (`OI-43` czeka „na rozbudowę rozgrywki");
- pasma biegłości 100–349 są puste → rangi Mastery III–IV nieosiągalne (`OI-28`);
- obrażenia cięte i obuchowe mają po jednym dostawcy (`OI-120`);
- 18 sztuk pancerza nie ma żadnej drogi zdobycia (`OI-106`);
- baza 3D V5 jest MASTEREM, który odblokował humanoidalnych wrogów (`OI-134`).

## Ustalenia

**Fabuła.** `swiat.md` zna już „miejscowych bandytów" (Anny nie ruszają, bo
ktoś ze wsi poprosił). Zagrożenie LUDZKIE — chciwość, nie zjawisko z lasu —
więc ⛔ **nie dotyka łańcucha przyczynowego** i niczego wyżej nie odsłania.
Zaczep: zbóje obrabowali wóz drwali z drewnem na targ; **Ciechan** prosi
o pomoc. **Anna** wie, kim są niektórzy z nich, i tego nie powie.

**Gdzie.** ⚠ **Lokalizacja ROBOCZA — do ustalenia** (autor: „wrócimy jeszcze
do ułożenia tego obozu”, `docs/odlozone.md` §1). Stoi dziś: ⭐ **v3 (autor, ta sama sesja: „za blisko traktu, ma być w ciężej
dostępnym miejscu”)**: kryjówka **na północ od traktu, na brzegu rzeki**
(119,5; 38,5), 24,5 kafla od drogi — poza kadrem z traktu (~16 kafli
w pionie). Plecy: rzeka bez brodu; od traktu zasłania ją staw; dojście tylko
lasem, dookoła stawu. Wycięta tylko elipsa pod obozem. Ślad: koleiny
zrabowanego wozu od traktu na północ. Odrzucone: v1 (106,77) — 12 kafli od
traktu, „dym widać z drogi”; v2 (111,82) przy południowym krańcu mapy —
17,5 kafla, dachy dalej w kadrze z drogi. ⛔ **Nie w Gęstwinie** — kanon: tam
„nie ma nikogo, kto by cokolwiek powiedział", las ma być CUDZY.

**Kiedy.** Zadanie dostępne **po Szarym** (`requiresQuest: grey_wolf_revenge`)
— kanoniczny „oddech" po kulminacji: zwyczajny, ludzki problem przed drugą falą.

**Roster** (3D na bazie V5, broń z istniejących modeli):

| kto | broń | obrażenia | pancerz | `P` | HP | rola |
|---|---|---|---|---:|---:|---|
| Zbój z pałką | `club` | blunt | leather | ~100 | ~80 | podchodzi, wolny ciężki cios |
| Zbój z toporem | `axe` | slash | padded | ~120 | ~95 | szybszy, agresywny |
| Herszt (elita, nie odradza się) | `sword` | slash | mail | ~160 | ~260 | telegrafowany silny cios, woła resztę |

Obóz: 4 zbójów + herszt; zwykli odradzają się wolniej niż zwierzęta. Liczby
w tabeli są STARTOWE — strojenie w `GameConfig.ts` i playtest.

**Łup.** Po raz pierwszy **złoto** z wroga (zasila rangi Mastery, `OI-46`).
⭐ **Zmienione 2026-10-11 (autor):** z wroga spada to, co **miał na sobie** —
rzadko (~12% na zbója) i zniszczone (jakość Podła, broń z 10–35% trwałości),
żeby obóz nie był farmą przedmiotów. Herszt: hełm stożkowy na pewno + jedna rzecz
ze stroju. Lamelka, łuska i ćwiekowana skóra poszły do sklepów (reguła etapu
testów, `docs/dystrybucja_ekwipunku.md`). Tabela: `LOOT.equipmentDrops`.

**Zadanie „Zrabowany wóz"** (Ciechan): etap 1 — zbóje, etap 2 — herszt;
nagroda złoto + przedmiot; tematy u Ciechana, Anny i sołtysa.

## Stan (2026-10-11, ta sama sesja)

✅ **Kroki 1–4 zrobione i sprawdzone w silniku** (`docs/dziennik.md` 2026-10-11 (6)):
modele `enemy_bandit_*.glb`, klasa `Bandit` + alarm obozu, obóz w kryjówce
nad rzeką (119,5; 38,5), łup ze złotem, zadanie „Zrabowany wóz" i rozmowy (Ciechan,
Anna, sołtys). ⏳ Otwarte: **playtest** (liczby z tabeli są startowe),
odbiór na S21 FE (pięć modeli ze skórą naraz).

## Kolejność kroków

1. **Model wroga-humanoida** — mieszkańcy mają dziś tylko klip `Idle`; dochodzi
   eksport presetu z `Walk`/`Run`/`Attack`/`Death` i bronią w dłoni.
   ⛔ Baza V5 nietknięta (`docs/postac3d_checkpoint.md`).
2. **Klasy wrogów** na `Enemy` + `ActionRunner`: telegrafowany zamach (wzór:
   `Bear.resolveSwipe`), wołanie towarzyszy (wzór: wycie wilka). Bez nowych systemów.
3. **Obóz na mapie lasu** — polana, szałas i ognisko jako modele 3D, spawny.
4. **Łup, zadanie, rozmowy** → `rozmowy_przymiar`, katalogi, `assety_przymiar`.

## Poza zakresem (świadomie)

Łucznicy (walka dystansowa = etap 3 roadmapy) · blok tarczą u wrogów ·
rabunek wozu jako scena · zmiana krzywej XP (`OI-43` zostaje decyzją autora).
