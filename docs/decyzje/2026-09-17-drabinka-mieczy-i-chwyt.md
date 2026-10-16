---
typ: DECYZJA
domena: [weapons, items]
tytul: Drabinka ROZMIARU mieczy i pytanie o przełączalny chwyt
stan: zywy
moc: ACTIVE
data: 2026-09-17
kotwice:
  - GameConfig.ITEMS
  - src/core/Equipment.ts
  - src/core/Items.ts
  - tools/rece_przymiar.mjs
  - tools/build_ikony_mieczy.py
otwarte: [C5, OI-112, OI-105]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-18
---

# Drabinka ROZMIARU mieczy — i pytanie o chwyt

> **Co ta decyzja rozstrzyga.** Że rodzina `sword` dostaje **dwie** konstrukcje
> mimo wniosku z audytu tego samego dnia, i dlaczego akurat te dwie. Oraz co
> stoi na przeszkodzie, żeby **bastard** był bronią 1H **i** 2H.

---

## 1. ⚙ Co ta decyzja ZAWĘŻA

`docs/decyzje/2026-09-17-katalog-broni-warstwy-spoleczne.md` §2 kończy się
zdaniem:

> ⛔ **Rodzina `sword` nie dostała w tej partii ani jednej pozycji i to jest
> WYNIK AUDYTU, nie przeoczenie.**

⚠⚠ **Tamta decyzja NIE jest unieważniana — jej `moc` zostaje `ACTIVE`, a cała
lista odrzuconych kandydatów obowiązuje.** Gladius, estok, katzbalger i „miecz
szczerbaty" zostają odrzucone i ⛔ nie wracają.

⭐ **Zawężony zostaje zasięg tamtego wniosku.** Audyt pytał: *czy brakuje
kolejnej konstrukcji SZERMIERCZEJ?* — i odpowiedź „nie" była poprawna.
Nie zadał drugiego pytania: *czy rodzina pokrywa oś ROZMIARU?* Odpowiedź na to
brzmi **nie** i jest to inna luka niż tamta:

```
   przed:   Miecz 1H (68) ──────────────────► Bastard 2H (78)
                                    ▲
                            skok o całą klasę broni,
                            bez niczego pomiędzy
```

Między największym mieczem jednoręcznym a najmniejszym dwuręcznym nie było
nic, a powyżej miecza dwuręcznego nie było **niczego w ogóle**.

---

## 2. Cztery miecze, cztery różne koszty

⛔ **To nie jest drabinka mocy i nie wolno jej w nią zamienić.** Każdy stopień
płaci czym innym:

⚠ Kolumna łuku **wycięta 2026-09-18** — `melee.arcDeg` nie jest już własnością
broni (`decyzje/2026-09-18-luk-nalezy-do-umiejetnosci.md`).

| | ręce | zasięg | Siła | cena | **czym płaci** |
|---|---:|---:|---:|---:|---|
| **Miecz długi** | 1 | 74 | 4 | 195 | brakiem parowania i najwyższą bramką Siły wśród 1H |
| **Bastard** | 2 | 78 | 4 | 260 | slotem drugiej ręki |
| **Miecz dwuręczny** | 2 | 82 | 6 | 380 | tempem (800 ms) |
| **Wielki miecz** | 2 | 92 | 8 | 600 | **wszystkim naraz** + martwą strefą 30 |

⚠ **Miecz długi jest wolniejszy i słabszy w dps od zwykłego miecza** (24,0 vs
25,8) — i tak ma być. Kupuje się w nim **zasięg 74**, czyli najdłuższą broń
jednoręczną w grze, a nie obrażenia.
⛔ To jest dokładnie ta rzecz, której autor zakazał: *„nie może być po prostu
miecz + większe obrażenia"*.

### Dlaczego miecz długi jest JEDNORĘCZNY

⚠ Historycznie „miecz długi" bywa bronią oburęczną. **W tym świecie nazwa
oznacza największą głownię, jaką da się prowadzić jedną ręką** — bo to jest
rola, której w katalogu brakowało, a miejsce ciężkiego miecza 2H zajmują już
dwie konstrukcje. ⛔ Nie dopisuj mu `hands: 2` „dla realizmu": jedynym powodem
jego istnienia jest to, że **da się z nim nosić tarczę**.

### Sufity, które ustawiły jego liczby

⚠⚠ **Trzy z czterech parametrów miecza długiego to nie są liczby dobrane — to
są SUFITY istniejących niezmienników**, dotknięte dokładnie:

| liczba | sufit | co go stawia |
|---|---|---|
| średnia **12,0** | najmocniejsza 1H < najsłabsza 2H (12,5) | `§Y Y3` |
| zasięg **74** | każda 2H sięga dalej niż każda 1H (najkrótsza 2H: 76) | `§Y Y2` |
| cooldown **0,56** | każda 2H wolniejsza niż każda 1H (najszybsza 2H: 0,60) | `§Y Y1` |

⛔ **Żadnej z nich nie da się podnieść bez przestrojenia broni dwuręcznej.**

### Wielki miecz — ekstremum, nie nowy system

⭐ **Nie powstało dla niego ani jedno nowe pole.** Jest ekstremum ośmiu
istniejących osi: najwyższa średnia (27,0),
najdalszy zasięg broni niedrzewcowej (92), najwolniejszy cykl (950 ms),
najwyższa bramka Siły (8), największa masa (8 kg), najwyższa cena (600 g)
i **pierwsza martwa strefa poza bronią drzewcową**.

⭐⭐ **Martwa strefa 30 jest najważniejszą rzeczą w tym wpisie.** `minReach`
był dotąd cechą wyłącznie pik, halabard i glewii — na tyle konsekwentnie, że
łatwo było wziąć go za własność rodziny `polearm`. **Nie jest**, i wielki miecz
to teraz *pokazuje*, a nie tylko deklaruje.

⚠ 30, czyli mniej niż halabarda (34) i dużo mniej niż pika (62): wielkiego
miecza można chwycić za głownię i skrócić, czego z drzewcem zrobić się nie da.

⚠⚠ **Sufit zasięgu wyznacza obietnica rodziny drzewcowej, a nie gust.**
`§ZB Z9` wymaga, żeby każda drzewcowa sięgała dalej niż wszystko inne; najkrótsza
(włócznia) ma 98. ⛔ Nie podnoś 92 do 98 — `polearm` straciłaby jedyne, co ma.

---

## 3. ⏳ C5 — bastard 1H/2H: czego dziś nie da się zrobić POPRAWNIE

> ⚙⚙ **TEN ROZDZIAŁ ZOSTAŁ ZASTĄPIONY 2026-09-18** przez
> `docs/decyzje/2026-09-18-kategoria-1-5h.md`. Bastard, włócznia i widły są od
> tej daty kategorią **1.5H**: `hands: 2` + `grip: "either"`, chwyt wyprowadzany
> ze stanu drugiej ręki. ⛔ **Treść poniżej zostaje NIETKNIĘTA** — decyzje są
> niezmienne po zamknięciu, a to jest jedyny zapis tego, czego wtedy brakowało
> i dlaczego. ⚠ **Reszta tego dokumentu (drabinka ROZMIARU mieczy) zostaje
> w pełnej mocy.**

> ### ⚙ ROZSZERZONE 2026-09-18 — to samo dotyczy WŁÓCZNI
>
> Finalna pula broni chce **Włóczni 1H/2H jako jednej konstrukcji**, czyli
> dokładnie tej samej brakującej mechaniki co bastard. ⛔ Decyzją autora (F6)
> **obie zostają `hands: 2`** do czasu `OI-112`.
>
> ⚠⚠ **Włócznia ma jednak DRUGĄ blokadę, której bastard nie ma.** Profil 1H
> musiałby zmieścić się w korytarzu `§Y Y2` (*każda 2H sięga dalej niż każda
> 1H*), a ten jest pusty: ≤ 74 px przestaje być drzewcową, ≥ 76 px łamie Y2.
> To jest `C4`/`OI-108` — czyli `OI-112` i `OI-108` muszą zapaść **razem**.
>
> ⛔ Nie dopisano wyjątku `§Y` dla włóczni.

**Decyzja: bastard zostaje `hands: 2`. ⛔ Nie powstała żadna prowizorka.**

Autor chce docelowo jednej konstrukcji z dwoma profilami. To jest **zmiana
mechaniki, nie wpis w tablicy**, i poniżej stoi konkretna lista tego, co
musiałoby powstać — żeby następna sesja nie zaczynała od tego samego audytu.

### Dlaczego nie da się tego zrobić WARIANTAMI

⛔ Pierwsza kusząca odpowiedź — *„dwa `attacks`: Jedną ręką i Oburącz"* — **nie
działa i to jest rozstrzygnięte**. Wariant potrafi przemnożyć obrażenia,
zasięg i tempo, ale **nie dotyka `hands`**, więc slot drugiej ręki zostałby
zablokowany w obu wariantach. Wariant opisuje sposób CIOSU, nie sposób
TRZYMANIA.

### Co czyta `hands` dzisiaj

| miejsce | co robi |
|---|---|
| `Equipment.usesBothHandsIn` | wyprowadza dwuręczność z `itemHands(itemId)` |
| `Equipment.handsRefusalFor` | odmawia drugiej ręki i liczy miejsce w plecaku |
| `Equipment.equipFromBag` | rezerwuje miejsce na odkładane przedmioty |
| `Equipment.accepts` | podświetlanie slotu w panelu |
| `Equipment.normalizeHands` | sprząta nielegalną parę po `Save.load()` |
| `ui/ItemTooltip` | znacznik „obie ręce" na karcie |
| ⚠ `render3d/Character3D` | **czyta `ITEMS[…].hands` WPROST**, z pominięciem `itemHands` — drugi, niezależny czytelnik |
| `tools/combat_regresja` `§Y` | **dzieli roster na 1H i 2H**; Y1–Y3 porównują te dwa zbiory |

### Czego BRAKUJE

1. **Nośnika stanu chwytu.** Chwyt nie jest własnością egzemplarza w plecaku,
   tylko tego, JAK rzecz jest trzymana — więc należy do `Equipment`, per zestaw
   (`weapon` i `weapon2` mogą mieć różny). Dziś takiego pola nie ma.
2. **Warstwy statystyk zależnej od chwytu.** `Equipment` wystawia obrażenia,
   zasięg i tempo czytając `ITEMS` wprost. Drugi profil musi gdzieś
   zamieszkać — i ⛔ **nie w `attacks`**, patrz wyżej.
3. **Rozstrzygnięcia, co robi `§Y`.** Konstrukcja, która jest 1H **i** 2H, nie
   należy do żadnego z dwóch zbiorów, które Y1–Y3 porównują. To jest jedyny
   punkt, w którym ta zmiana dotyka NIEZMIENNIKA, a nie kodu.
4. **Sterowania w UI.** Nie ma dziś ani przycisku, ani miejsca na niego.
   ⚠ Zamiana chwytu w walce jest OSOBNĄ mechaniką (czas przełożenia, okno
   bezbronności, koszt staminy) — ta sama granica, którą `weapons.md` postawił
   drugiemu zestawowi broni.
5. **Drugiego klipu 3D.** `Character3D` już wie o dwuręczności, a chód
   oburęczny jest otwartą pozycją od 2026-09-09.

⭐ **Co JEST gotowe:** zapis. `Save` przyjmuje nowe pola jako **opcjonalne bez
podbijania `SAVE_VERSION`** (tak weszły `quickSlot`, pierścienie, `offhand`,
`gloves`, `amulet`), więc chwyt zapisze się tą samą ścieżką.

⛔ **Nie zaczynaj od kodu.** Pierwszym krokiem jest punkt 3 — **jedno zdanie
autora o tym, czym staje się tożsamość 2H**, gdy broń może nią nie być.

---

## 4. Co ta partia zmieniła w strażnikach

| zmiana | po co |
|---|---|
| **`tools/rece_przymiar.mjs`** *(nowy)* | ⚠⚠ Reguła „dwuręczna blokuje drugą rękę" żyła w pięciu miejscach `Equipment` i **nic jej nie uruchamiało** — `§Y` bada liczby, nie zachowanie. Przymiar sprawdza obie ścieżki (`accepts` dla podświetlenia, `equip` dla operacji), obie strony (1H wpuszcza, 2H odmawia), oba zestawy i **granicę `Save.load()`**, czyli `normalizeHands` |
| `§W W11c` przepisane **po raz drugi tego dnia** | rano stał tam licznik `=== 18`, w południe lista `glaive,halberd,pike`. Tę drugą przewrócił wielki miecz — słusznie, bo lista była migawką rosteru, nie regułą. Dziś stoi reguła: martwa strefa jest MNIEJSZOŚCIĄ i **w każdej rodzinie, która ją ma, jest też konstrukcja bez niej** |
| generator katalogu: kolumna **`martwa`** | `minReach` niesie dziś cztery konstrukcje i różnicuje je naprawdę; tabela, która go nie pokazuje, przemilcza połowę tożsamości piki |
| `tools/build_ikony_mieczy.py` *(nowy)* | na arkuszu **nie było** sylwetki większej od zwykłego miecza — patrz §5 |

⚠ Wszystkie nowe asercje przeszły sabotaż.

---

## 5. Art: dlaczego ikony trzeba było NARYSOWAĆ

⚠⚠ **Wolne kafle rzędu mieczy są MNIEJSZE od zwykłego miecza** i to jest fakt
policzony, nie wrażenie:

```
   wolny (0,2)   174 px        wolny (0,3)   185 px
   ⛔ `sword` (0,5)   239 px   ← zwykły miecz jest WIĘKSZY od obu
```

Miecz długi dostałby więc ikonę, która **kłamie o jego jedynej cesze**,
a wielki miecz — sylwetkę tej samej klasy co `sword` i `bastard_sword`.

⭐ Oba kafle są rysowane przez `tools/build_ikony_mieczy.py` w paletę
**próbkowaną z arkusza** (cztery tony metalu, pięć brązu rękojeści) i wpisane
w puste kafle **(1,4)** i **(1,5)**.

⚠ **Sam rozmiar nie wystarczył.** Pierwsza wersja wielkiego miecza czytała się
przy 17,6 px **tak samo jak tasak** — obie są szerokimi, liściastymi głowniami.
Rozstrzygnęło dopiero **zbrocze**: ciemna bruzda wzdłuż środka głowni, której
nie ma żadna inna ikona tego arkusza. ⛔ Nie kasuj go „dla czystości".
⚠ Widać to było wyłącznie na zestawieniu ośmiu ostrzy obok siebie w skali
półki sklepu — *„patrz na render, nie tylko na raport"*.

---

## 6. Koszt zapisany jawnie: `W4` się ruszył

⚠⚠ **`obciazenie_przymiar` `W4` pokazuje 59,7 kg zamiast 58,7 kg — i zrobił to
wielki miecz.** Najcięższy osiągalny zestaw bierze najcięższą broń w katalogu,
a ta waży 8 kg wobec 7 kg młota bojowego.

⛔ **To nie jest nowa usterka**: `W4` jest czerwony od 2026-09-15, pasmo 40–55 kg
należy do kalibracji Modelu D (`OI-105`), a dominującą przyczyną jest ciężka
pawęż (16,2 kg). ⚠ Ale **liczba się zmieniła i ktoś, kto będzie kalibrował,
musi wiedzieć, która pozycja ją przesunęła** — zamilczenie tego byłoby dokładnie
tym, przed czym ostrzega nagłówek generatora katalogu.

⚠ **Nie obniżono masy do 7 kg, żeby pomiar został nietknięty.** Wielki miecz ma
być najcięższą bronią w grze; strojenie danych pod wygodę pomiaru odwraca
zależność między nimi.

---

## Czego ta decyzja NIE rozstrzyga

- **`C5` / `OI-112`** — czy i jak bastard dostaje dwa profile chwytu.
- **Balansu rosteru.** Wielki miecz ma najwyższy dps w grze (31,8 @S0) i to
  jest ZAMIERZONE dla broni za 600 g i Siłę 8; globalna kalibracja należy do
  momentu, w którym będzie też broń dystansowa.
- **`OI-105`** — pasma kalibracji Modelu D, do którego `W4` się nie mieści.
- **Modeli 3D.** ⚠ `char.glb` niesie 11 siatek `Bron_*`; **21 z 32 konstrukcji**
  rysuje się jako pusta dłoń (`OI-109`).
- **Czy „Kord" (`messer`) ma zostać.** Konstrukcja weszła 2026-09-16, ma
  dystrybutora u Myśliwego i **nie była ruszana** — korekta zakresu mówi „nie
  dodawaj", a nie „usuń".
