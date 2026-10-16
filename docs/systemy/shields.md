---
typ: STAN
domena: shields
tytul: Tarcze — blok kierunkowy i koszt osłony
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-06, przymiar:doc_check, przymiar:combat_regresja, przymiar:tarcze_przymiar]
kotwice:
  - src/core/Protection.ts
  - src/core/Equipment.ts
  - src/core/DamageResolver.ts
  - src/entities/Player.ts
  - GameConfig.SHIELD
  - GameConfig.STAMINA.costs.blockFallback
  - GameConfig.QUALITY.modifiers.defense
  - GameConfig.EQUIPMENT.durability
  - src/core/Quality.ts
  - tools/char3d_shields.py
  - tools/tarcze_przymiar.mjs
otwarte: [OI-24, OI-25, OI-26]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-27
---

# Tarcze — blok kierunkowy i koszt osłony

> **Czym jest ten dokument.** Odpowiedzią na pytanie **czym tarcza różni się od
> reszty pancerza**: kiedy blok działa, ile zdejmuje, co za to płacisz i czym
> tarcza jest poza obroną.
>
> **Czym NIE jest.** Nie jest katalogiem tarcz ani tabelą liczb — te są
> w `docs/ekwipunek_przedmioty.md` (generowanym). Nie opisuje krzywej pancerza,
> parowania ani umiejętności; granice w §0.

---

## 0. Granice domeny

| pytanie | domena | dokument |
|---|---|---|
| kiedy blok działa, ile zdejmuje, co kosztuje | **`shields`** | ten plik |
| punkty obrony tarczy, materiał, krzywa i sufit | `armor` | `docs/systemy/armor.md` |
| tarcza jako **przedmiot** (slot, jakość, cena, `size`) oraz **łańcuch trwałości i naprawy** | `items` | `docs/systemy/items.md` |
| kolejność unik → parowanie → blok → pancerz, jedno zaokrąglenie | `combat` | — |
| **parowanie** — skąd się bierze i komu przysługuje | `weapons` (cecha rodziny) + `combat` | — |
| liczby, cooldown i ogłuszenie Uderzenia tarczą | `abilities` | — |
| koszt wysiłku jako system, krzywa przyjętego ciosu | `stamina` | `docs/systemy/stamina.md` |
| co gracz widzi po zablokowaniu | `presentation` | — |

⚠⚠ **PAROWANIE NIE NALEŻY DO TEJ DOMENY** i to jest ustalenie z kodu, nie
konwencja porządkowa. Parowanie płynie z **cechy rodziny BRONI**
(`DEFENSE.parry.core` × cecha rodziny), działa **bez tarczy** i ma **własną,
inną granicę kątową** niż tarcza (§2.1). Wspólna jest wyłącznie funkcja
sprawdzająca kąt.

### 0.1 Zależności — surowiec pod przyszłą mapę

| kierunek | domena | przez co |
|---|---|---|
| `shields` **czyta** | `items` | `block` na przedmiocie, jakość egzemplarza, slot `offhand` |
| `shields` **daje** | `combat` | ułamek redukcji + strefa (`DamageResult.zone`) |
| `shields` **daje** | `stamina` | koszt zablokowanego ciosu; pośrednio obniża koszt przyjętego |
| `shields` **daje** | `abilities` | bramkę sprzętową Uderzenia tarczą (§5) |
| `shields` **sąsiaduje** z | `armor` | wspólny plik `src/core/Protection.ts`, zero wspólnych obliczeń |
| `shields` **sąsiaduje** z | `weapons` | wspólny predykat kąta z parowaniem i z bramką zwrotu ataku |

---

## 1. Czym jest tarcza

⚠⚠ **Tarcza to PANCERZ, który dodatkowo blokuje — nie osobny system.**
`type: "armor"` + `slot: "offhand"` sprawia, że za darmo działają: dobór slotu,
`accepts`, jakość, punkty obrony, sklep, tooltip i przeciąganie na lalkę.
**Jedynym nowym polem w całym systemie jest `block`.**

`BlockSpec` niesie **ile** zdejmuje, **jak spowalnia** i **ile kosztuje
wysiłku** (`staminaCost`; przy braku — `STAMINA.costs.blockFallback`); co z tego
skaluje się jakością i stanem — §4.

⚠ **Warunek („z której strony") stoi POZA przedmiotem**, w stałych `SHIELD`;
**siła** osłony należy do egzemplarza. Pełny podział i jego dzisiejsze
uzasadnienie: **N-22** (§6).

⚠ **Punkty obrony tarczy działają z KAŻDEJ strony** (masa na ramieniu); sam
blok tylko z przodu. Tarcza od tyłu nie jest więc zerem — ale to blok, a nie
punkty, niesie właściwą ochronę. Punkty idą przez materiał i krzywą jak każdy
inny kawałek pancerza (domena `armor`).

⚠ **Żadnego materiału „drewno".** Nowy materiał to nowa kolumna w profilu
i nowa decyzja balansowa; deska z okuciem jest mechanicznie skórą albo metalem.

---

## 2. Blok kierunkowy

> **Tarcza chroni cię przed tym, na co patrzysz.**

### 2.1 Trzy strefy

Cios trafia w jedną z trzech stref, liczonych od zwrotu **widocznego na
postaci**:

| strefa | granica | ile zdejmuje |
|---|---|---|
| **front** | do `SHIELD.fullArcDeg` | pełne `reduction` |
| **bok** | do `SHIELD.sideArcDeg` | `reduction × SHIELD.sideZoneMul` |
| **tył** | dalej | nic |

⚠ **Pełna strefa świadomie NIE rośnie.** Tarcza chroniąca prawie całe otoczenie
zrobiłaby z „jedna ręka + tarcza" bezwarunkowo najlepszą konfigurację obronną
i skasowała decyzję, o którą w tej walce chodzi.

⚠⚠ **Zewnętrzna granica tarczy jest SZERSZA niż półkula parowania i ataku**
(`sideArcDeg` > `SHIELD.blockArcDeg`) — istnieje więc wąski pas, w którym tarcza
reaguje, a parowania nie da się nawet spróbować. **To jest świadomy rozdział,
pierwszy w tym projekcie**: atak pyta „czy mogę to trafić", tarcza „czy zdążę ją
podstawić", i te pytania nie muszą mieć jednej granicy.

⚠ **Dług nazewniczy, świadomie niespłacony:** `SHIELD.blockArcDeg` nie nazywa
dziś łuku bloku, tylko **półkulę ataku i parowania**. Przemianowanie dotyka
przymiaru, konfigu i sześciu dokumentów — osobna przeprowadzka.

⚠ **Geometria stref jest ZBUDOWANA na predykacie półkuli**, nie napisana obok
niego. Dzięki temu konwencja granicy (kąt w stopniach, porównanie ostre,
obsługa zerowego wektora) jest **jedna**, a zagnieżdżenie gwarantuje
strukturalnie `front ⊆ bok ⊆ blokowalne`. Druga kopia tej geometrii już raz
kosztowała pomiar.

⚠ **Cios bez kierunku wypada jako „tył" i nie da się go zablokować** — ta sama
konwencja, co „świadomie bez typu obrażeń": decyzja na zapis, nie przeoczenie.

### 2.2 Który zwrot się liczy

**Widoczny na postaci** (`guardKat`): kierunek ataku w pozie
ataku, kierunek ruchu poza nią.

⚠⚠ **To było jedyne pytanie, które ta domena musiała rozstrzygnąć PRZED
implementacją**, bo źle rozstrzygnięte kładzie cały model kierunkowy. Przez czas
zobowiązania sprite patrzy w cel — czyli dokładnie wtedy, gdy gracz nie może się
uchylić. **Tarcza jest odpowiedzią na twój własny root.**

⚠⚠ **Poza ataku i ukorzenienie to DWA timery**, równe wyłącznie przy Zręczności 0
bez zmęczenia: przy wysokiej Zręczności osłona przeżywa zobowiązanie, przy
wyczerpaniu jest odwrotnie. ⛔ **Nie pisz o nich „równo".** Model kierunkowy to
**wzmacnia**, nie osłabia. Pomiar: `docs/systemy/combat.md` §5,
`docs/proces/ekstrakcja_combat.md` §4 (`OI-32`).

⚠ **Znany koszt, na zapis:** biegnąc w jedną stronę i bijąc w drugą przerzucasz
osłonę kilka razy na sekundę. **Jeśli playtest przeczyta to jako losowe, tę
regułę zmienia się PIERWSZĄ — nie liczby tarcz.**

⚠⚠ **Auto-obracanie osłony na cel jest USUNIĘTE i nie wolno go przywracać
osobno.** Tworzyło „drugą, ukrytą prawdę": sprite stał tyłem, a tarcza kryła
przód. Zniknęło razem z auto-obracaniem ATAKU — to były dwa objawy jednej
decyzji. **Przód i plecy znaczą dziś to samo w ataku i w obronie.**

### 2.3 Cztery własności bloku

- ⚠ **Deterministyczny.** Zero rzutów, i powód jest zmierzony: gracz przyjmuje
  kilka ciosów na walkę, więc „30% szansy" nie jest 30% redukcji, tylko monetą
  rzucaną raz na starcie. **Strefa nie dokłada tu losowości — zmienia MNOŻNIK,
  nie szansę.**
- ⚠ **Neutralny wobec typu obrażeń.** Pancerz odpowiada na „**czym** we mnie
  trafiono", tarcza na „**czy zdążyłem ją podstawić**". Własny profil per typ
  dałby wynik będący iloczynem dwóch niewidocznych tabel — nie do rozłożenia
  przez obserwację. **To jest decyzja, nie odroczenie.**
- ⚠ **Nakładany PO pancerzu, w jednym zaokrągleniu.** Kolejność jest numerycznie
  obojętna; **liczba zaokrągleń obojętna nie jest** — podwójne zjadłoby cały
  efekt tarczy na małych ciosach.
- ⚠ **Nie zatrzymuje niczego, co jest już w środku.** Jad i krwawienie omijają
  tę ścieżkę. Tarcza zatrzymuje cios, nie stan.

⚠ **Wołający CZYTA werdykt (`zone`), nigdy nie odtwarza redukcji z wyniku.**
Przy jednej strefie odtworzenie dawało tę samą liczbę; przy trzech byłoby
nieprawdą.

---

## 3. Co tarcza kosztuje

| koszt | nośnik | uwagi |
|---|---|---|
| **tempo** | `BlockSpec.swingMul` | ⚠ trafia w **tempo ataku ORAZ czas zamachu**, nigdy w jedno bez drugiego |
| **wysiłek** | `BlockSpec.staminaCost` | ⚠ za **faktycznie zablokowany cios**, nigdy za trzymanie tarczy |
| **udźwig** | `weight` przedmiotu | wchodzi w klasy obciążenia — domena `stamina` |
| **slot** | `offhand` | broń dwuręczna wyklucza tarczę **strukturalnie**, bez osobnej reguły |

⚠⚠ **Kara tempa jest sprzężeniem, nie podatkiem.** Z czasu zamachu wyprowadzone
są ukorzenienie i moment trafienia, więc tarcza spowalniająca zamach **sama
wydłuża okno, w którym gracz stoi zakorzeniony** — czyli sama tworzy sytuację,
w której jest potrzebna. Zamierzone.

⚠ **Blok boczny nie ma i nie potrzebuje osobnej kary za wysiłek.** Koszt
przyjętego ciosu liczy się od obrażeń **po** mitygacji, więc słabsza osłona już
kosztuje więcej staminy. Druga kara byłaby policzeniem tego samego dwa razy.
⚠ Ta sama zależność działa w drugą stronę: blok **obniża koszt przyjęcia ciosu**
— zasłonięcie się jest tańsze niż inkasowanie.

---

## 4. Jakość i STAN: co skaluje, a co nie

⚠ **Dwie prostopadłe osie:** jakość mówi, **jak dobrze rzecz zrobiono**, stan —
**w jakim jest teraz**. Naprawiona Podła tarcza zostaje Podła.

| pole | jakość | stan |
|---|---|---|
| `reduction` | ✅ `QUALITY.modifiers.defense` | ✅ `× destroyedMultiplier` |
| `swingMul` | ⛔ cena jest tożsamością kategorii | ⛔ |
| `staminaCost` | ⛔ lepsze wykonanie nie zmniejsza pędu ciosu | ⛔ |
| punkty obrony | ✅ jak każdy pancerz (`armor`) | ✅ `instanceDefense` |

⚠ **Tarcza zużywa się za ZABLOKOWANY CIOS** (N-27, ta sama stawka w obu
strefach) **oraz za CELNY bash** (`S10`, 2026-09-15 — ⛔ bash w powietrze nie
zużywa nic). Jeden kanał, wspólna stawka; łańcuch naprawy należy do `items`.
⚠ Rozbita tarcza **nadal blokuje**, na `destroyedMultiplier`; kąty są
nietykalne przez jakość i przez stan (N-22).

⚠⚠ **Procent jakości na tarczy jest wart WIĘCEJ niż procent jakości na zbroi**,
i to jest znana, przyjęta asymetria: blok mnoży się **poza** krzywą malejących
przyrostów, więc dostaje pełny nominał, a punkty pancerza nie.

⚠ **Redukcja bloku nie ma własnego sufitu** — jedyny ogranicznik w tej gałęzi
(cap redukcji) siedzi przy pancerzu i tarczy nie dotyczy. Skutek: łączna
mitygacja nie ma jednego wspólnego stropu (OI-24).

---

## 5. Tarcza jako broń

Tarcza jest źródłem **jedynej twardej kontroli w grze** (ogłuszenia) przez
Uderzenie tarczą.

⚠ **Bramka sprzętowa czyta `blockSpec`, nie nazwę przedmiotu.** Tarczą jest
**to, co potrafi blokować** — jedno źródło prawdy zamiast listy identyfikatorów.
Broń dwuręczna wypada z tego sama, bo blokuje slot drugiej ręki; **żadnej
osobnej gałęzi.** ⚠ To **jedyna bramka sprzętowa** w całym zestawie
umiejętności i ma taką zostać.

⚠ **Zasięg Uderzenia płynie z BRONI, nie z tarczy** — decyzja **odwrócona przez
rozgrywkę**: własny, krótszy zasięg okazał się nie kosztem, tylko martwym
pasmem, w którym autoatak trafia, a umiejętność odmawia. **Reguła: jeśli
trafiasz kogoś autoatakiem, trafiasz go też umiejętnością na tym celu.**
⛔ Nie przywracać własnego zasięgu tarczy.

⚠⚠ **Skutek dla wyceny: tarcza ma dziś TRZY składniki wartości** — redukcję,
karę tempa i **kontrolę** (OI-25).

---

## 6. Niezmienniki

- **N-21** — **tarcza jest pancerzem z jednym dodatkowym polem.** Nowy przedmiot
  do drugiej ręki nie dostaje własnego systemu.
- **N-22** — **warunek osłony stoi w stałych, siła osłony na egzemplarzu.**
  **Warunek**: kąty per KONSTRUKCJA (`T-1` ✅, `SHIELD_GEOMETRY`),
  `sideMul` globalny; **siła** (`reduction`) — egzemplarz: przedmiot × jakość
  × **stan**; **cena** → §4. ⚠ **Stan zmienia SIŁĘ, nigdy KSZTAŁT.**
  ⏳ Rejestr jest PUSTY do `B3` (po `P1`), więc każda konstrukcja dostaje
  fallback 60°/100°. ⛔ **Geometria nadal NIE stoi na przedmiocie**. Dlaczego pierwotne uzasadnienie („Raise Shield") jest martwe:
  `docs/tarcze_checkpoint.md` §4.
- **N-23** — **blok jest deterministyczny** (§2.3). ⛔ Blok jako rzut kością jest
  odrzucony z pomiarem, nie z gustu.
- **N-24** — **blok jest neutralny wobec typu obrażeń** (§2.3).
- **N-25** — **jedna konwencja granicy kąta.** Strefy budują się na istniejącym
  predykacie; druga kopia geometrii jest błędem, nie optymalizacją.
- **N-26** — **`swingMul` trafia w tempo ORAZ w czas zamachu**, nigdy w jedno.
- **N-27** — **wysiłek płaci się za zablokowany CIOS, nigdy za posiadanie
  tarczy.** Bierny podatek za sprzęt jest tą mechaniką, której system unika.
- **N-28** — **feedback bloku jest WYMAGANIEM, nie ozdobą.** Gra nie pokazuje
  liczby obrażeń otrzymanych, więc cicha redukcja jest niewidzialna. Blok gra
  własny dźwięk i błysk **zamiast** zwykłego trafienia, nigdy obok — dwa naraz
  zlałyby się w jeden.
- **N-29** — ⚠ **każdy dobry przedmiot do drugiej ręki jest cichym osłabieniem
  broni dwuręcznej.** Cena „obu rąk" jest wyrażona w slocie, którego wartość
  właśnie podnosisz. Wymaga pilnowania przy **każdym** takim przedmiocie.

⚠ **Parowanie, ogłuszenie jako prymityw i krzywa kosztu przyjętego ciosu**
należą do innych domen (§0) — nie powielaj ich tutaj.

---

## 7. Checklista: nowa tarcza

1. `type: "armor"`, `slot: "offhand"` — to wszystko, czego trzeba.
2. `block: { reduction, swingMul, staminaCost }`. ⚠ Bez `staminaCost` przedmiot
   po cichu bierze stawkę zapasową.
3. **Wycena wg twierdzenia o konwersji**: X% redukcji od przodu jest warte tyle,
   co X% więcej obrażeń, a kara tempa oddaje z tego część. ⚠ Dolicz **kontrolę**
   (§5), której pierwotne wyliczenie nie znało.
4. `requires` — przynajmniej jedna tarcza musi zostać bez bramki (niezmiennik
   „pełna ścieżka bez wymagań", domena `items`).
5. Sprawdź **N-29** i sprawdź przedmiot z bronią dwuręczną w ręku — odmowa ma
   **nazwać powód**.
6. ⚠ **Różnicowanie tarcz KĄTEM to nie nowy przedmiot, tylko zmiana modelu**
   (N-22, OI-9).
7. ⚠ **Model 3D do lewej ręki** — bryła per KONSTRUKCJA
   (`tools/char3d_shields.py`), od 2026-10-03 także okuta
   `<konstrukcja>_<gatunek>` (`shield_shapes.OKUCIA`, wybór po IKONIE,
   `Character3D.wariantTarczy`). Brak wpisu = **pusta ręka, nie błąd**;
   łapie to `tools/char3d_sprawdz_tarcze.py`.
8. Bramki: `npx tsc --noEmit`, `npm run build`, `node tools/combat_regresja.mjs`
   (grupy §L i §X), `blender -b public/assets/char.blend --python
   tools/char3d_sprawdz_tarcze.py`.

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| tarcza jako pancerz z polem `block` | ✅ | ✅ | `kod:2026-09-06` |
| trzy strefy osłony i ich granice | ✅ | ✅ | `przymiar:combat_regresja` §X |
| niezmiennik `pełna ≤ zewnętrzna` | ✅ | ✅ | `przymiar:combat_regresja` §X1 · **`przymiar:tarcze_przymiar` §X1 (per przedmiot)** |
| **spójność `BlockSpec` per przedmiot** (N-21, zakresy pól) | ✅ | ✅ | `przymiar:tarcze_przymiar` §X2/§X3 |
| **redukcja przy Q7 nadal < 100%** | ✅ | ✅ | `przymiar:tarcze_przymiar` §X4 |
| jedna konwencja granicy (strefy na predykacie) | ✅ | ✅ | `przymiar:combat_regresja` §X2 |
| parowanie NIE poszerzone o pas boczny | ✅ | ✅ | `przymiar:combat_regresja` §X3 |
| mnożnik strefy wchodzi parametrem, nie importem | ✅ | ✅ | `przymiar:combat_regresja` §X4 |
| wołający czyta werdykt, nie odtwarza redukcji | ✅ | ✅ | `przymiar:combat_regresja` §X5 |
| `guardKat` = widoczny zwrot | ✅ | ✅ | `przymiar:tarcze_przymiar` §N1 |
| blok deterministyczny i neutralny wobec typu | ✅ | ✅ | `kod:2026-09-06` |
| koszt wysiłku za zablokowany cios | ✅ | ✅ | `kod:2026-09-06` |
| `swingMul` w tempo i zamach razem | ✅ | ✅ | `przymiar:combat_regresja` |
| jakość skaluje `reduction`, nie karę | ✅ | ✅ | `kod:2026-09-06` |
| **stan (`durability`) skaluje `reduction`** przez `destroyedMultiplier` | ✅ | ✅ | `przymiar:tarcze_przymiar` §D4 |
| **zużycie: zablokowany cios + CELNY bash (`S10`); jeden kanał** | ✅ | ✅ | `przymiar:tarcze_przymiar` §D/§S8 |
| stan NIE dotyka geometrii ani `sideMul` | ✅ | ✅ | `przymiar:tarcze_przymiar` §D8/§D9 |
| bramka sprzętowa Uderzenia tarczą przez `blockSpec` | ✅ | ✅ | `kod:2026-09-06` |
| `size` — etykieta bez konsumenta | ❌ *(świadomie)* | ✅ | `kod:2026-09-06` — OI-9 |
| brak wspólnego sufitu mitygacji | ✅ | ⚠ | ❌ **przeliczone, niezaakceptowane** — OI-24 |
| czy pas boczny jest w ogóle odczuwalny | ✅ | ⚠ | ❌ **gracz nie ma jak go zobaczyć** — OI-26 |
| koszt alternatywny noszenia tarczy | ✅ | ⚠ | ❌ `reka` — OI-25 |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-9** | ⚙ **Rozstrzygnięte co do FAKTU, zawężone co do pytania.** `size` nie ma **ani jednego czytelnika** w kodzie, a warunek jej powrotu („gdy powstanie parowanie albo Raise Shield") jest **w połowie nieaktualny**: parowanie POWSTAŁO i okazało się cechą **broni**, więc nigdy nie mogło jej skonsumować; dwaj kolejni kandydaci odmówili z własnych powodów. **Zostaje wąskie pytanie: czy tarcze mają się kiedykolwiek różnić WŁASNĄ geometrią.** Dopóki odpowiedź brzmi „nie", `size` jest poprawną etykietą, nie osieroconym polem. Pełna historia: `docs/proces/ekstrakcja_shields.md` §4. |
| **OI-24** | ⚠⚠ **Łączna mitygacja nie ma wspólnego sufitu.** Sufit siedzi na pancerzu, blok mnoży się **poza** nim i sam capu nie ma. Przeliczenie: `docs/proces/ekstrakcja_shields.md` §5. **Nigdzie nie zapadła decyzja, ile ma wynosić maksymalna mitygacja w tej grze** — jest tylko sufit jednego z dwóch składników. Decyzja autora. |
| **OI-25** | ⚠⚠ **Koszt alternatywny noszenia tarczy — otwarty i POGŁĘBIONY.** „Jedna ręka + tarcza" jest dziś opłacalne bezwarunkowo, a Uderzenie tarczą dołożyło trzeci składnik wartości. ⛔ Autor świadomie **nie chce** naprawiać tego osłabieniem tarczy — koszt ma wynikać z całego systemu sprzętu. Zapis i warunek powrotu: `docs/odlozone.md`. |
| **OI-26** | ⚠ **Pas boczny jest niewidzialny dla gracza.** Jego mnożnik jest jawnie **wartością playtestową**, ale kierunek wróg → gracz nie pokazuje liczby obrażeń, a tooltip podaje tylko wartość pełną. **Playtest strukturalnie nie może odpowiedzieć, czy pas boczny czyta się dobrze** — ta sama pułapka, którą projekt opisał już raz przy typach obrażeń. |

---

## Czego ten dokument nie rozstrzyga

- **Balansu żadnej liczby.** Redukcje i kary są jawnie pierwszym podejściem;
  ⚠ jeśli tarcza okaże się wyborem oczywistym, **najpierw kara tempa, dopiero
  potem redukcja** — kara to jedno pole, redukcja to tożsamość rzeczy.
- **Parowania** — cecha rodziny broni, domeny `weapons` i `combat`.
- **Ogłuszenia jako prymitywu ani liczb Uderzenia tarczą** — domena `abilities`.
- **Punktów obrony, materiału i krzywej** — domena `armor`.
- **Czy „Raise Shield" ma powstać.** Nie istnieje i nie jest zaplanowane.
- **Czy roster tarcz jest kompletny** — siatka luk jest w katalogu generowanym.

---

## Gdzie szukać POWODÓW

⚠ **Dokumenty źródłowe tej domeny — analizy, checkpointy i pakiety do oceny
zewnętrznej — zostały USUNIĘTE 2026-09-07**
(`docs/decyzje/2026-09-07-odchudzenie-dokumentacji-combat.md`). Werdykty
i odrzucone warianty żyją dalej w rejestrze niżej; pełne przebiegi są w gicie.

| pytanie | dokument |
|---|---|
| rejestr **28 decyzji z mocą**, 12 rozjazdów i rozstrzygnięcie `OI-9` | `docs/proces/ekstrakcja_shields.md` |
| dlaczego trzy strefy zamiast półkuli i co przy tym naprawiono | `docs/dziennik.md` 2026-09-05 (2) |
| dlaczego koszt alternatywny tarczy zostaje otwarty — ⛔ nie naprawiać nerfem | `docs/odlozone.md` |
