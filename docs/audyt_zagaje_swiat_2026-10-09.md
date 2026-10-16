---
typ: HISTORIA
domena: [world, economy]
tytul: Audyt Zagajów w 3D — zabudowa, gospodarka leśna, węglarze, Lechtia
stan: zywy
otwarte: [OI-164]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-09
---

# Audyt Zagajów w 3D — zabudowa, gospodarka leśna, węglarze, Lechtia

> Zlecenie autora (2026-10-09): ocenić gęstość domów 3D i sposób tworzenia
> budynków oraz **przeanalizować, ocenić i skrytykować** materiał przygotowany
> przez ChatGPT z dawnych rozmów („audyt świata 3D — Zagaje, gospodarka leśna
> i państwo książąt Lechtii"). Zastrzeżenie autora: wioska to **prototyp
> rozwijany co jakiś czas, nigdy nieukończony** — dojdą np. chaty drwali,
> a za lasem kolejna lokacja z obozem węglarzy.
>
> ⛔ Ten dokument **niczego nie wdraża**. Zgodnie z samym materiałem: najpierw
> diagnoza, decyzje po akceptacji autora.
>
> Hierarchia wiarygodności użyta niżej: mapa i kod → dokumenty `KANON`/`STAN`
> i zamknięte decyzje → `HISTORIA` → materiał z ChatGPT → wnioski własne.

---

## 0. Odpowiedź w trzech zdaniach

1. **Domy są za gęsto względem 3D, nie względem 2D.** Rozstaw wsi ustawiano dla
   rysunków elewacji, a bryła 3D przy kamerze 40° zasłania za sobą 6–8,5
   kafla — w zachodnim skupisku następny budynek stoi 1–5 kafli dalej.
2. **Właściwa naprawa to zmiana ŹRÓDŁA budynku**, nie przesuwanie kafli:
   budynek jako obiekt 3D postawiony w Tiled (punkt + typ + obrót + wymiary),
   a nie model wyczytany z plamy kafli elewacji. Dopiero na tym warto
   rozstawić zachód wsi od nowa i dokładać chaty drwali, palisadę, zagrody.
3. **Materiał z ChatGPT jest dobrym kwestionariuszem, ale słabym źródłem
   faktów**: część tez jest w repo potwierdzona słowo w słowo, część jest
   nieaktualna, a obozu węglarzy i Chanatu w repozytorium nie ma wcale.
   Pomysł obozu „za lasem" się broni — jako przystanek **przy trakcie do
   miasta** (wątek wyjazdu z `swiat.md`), czyli z drogą do odbiorcy węgla,
   a nie jako ślepy przyczółek za głębokim lasem.

---

## A. Stan obecny (zmierzony 2026-10-09)

| element | stan |
|---|---|
| mapy | wieś 100×100 · las **240×90** (po rozstawie ×1,5, 2026-10-04) · Gęstwina 64×64 |
| przejścia | wieś (51,99) — **brzeg POŁUDNIOWY** → las (62,2) — brzeg północny; las (239,69) — **brzeg wschodni** → Gęstwina (2,32) |
| świat w 3D | domyślny od 2026-10-06; drzewa, rekwizyty, kuźnia, uprawy, **16 domów** (`tools/houses3d.py`), studnia, koło, ognisko, zwierzęta wsi |
| budynki wsi | 15 zespołów kafli = 15 modeli; zabudowa 943 z 10 000 kafli (9,4%) |
| młyn | x2–9 / y74–81, własny staw x0–7 / y82–89, koło na styku — ręcznie w Tiled (`swiat.md` §stan) |
| Myśliwy | **w lesie** (chata x96–100 / y5–11 `forrest.tmj`, ognisko 95,14), ~35 kafli od wejścia ze wsi — decyzja autora 2026-08-17: nie przeprowadza się |
| palisada | **brak** (B1 w `wioska_plan.md` §7.2 — „brak kafli") |
| tablica zleceń | **brak** (B10) |
| mieszkańcy | 19 NPC w grze (z lasem); plan: 30 dusz za palisadą + Myśliwy (`wioska_plan.md` §6) |
| wyręb / drwale / mielerz | **tylko w planach lasu** (`las_projekt_docelowy.md` §6: wyręb P1 zachód; mielerz P3) — asset mielerza: `katalog_assetow.md` „❌ TODO" |
| obóz węglarzy | ⛔ **nie istnieje** — ani w mapach, ani w kodzie, ani w żadnym dokumencie |

---

## B. Diagnoza domów 3D

### B.1 Pomiar

Wysokość bryły × kamera 40° → ile kafli terenu za tylną ścianą zasłania dach
(`wys · 4,955 px/j. / tan 40° / 32`), oraz odległość do najbliższego budynku
z tyłu (zachodzącego w osi X):

| budynek (kafle) | wys. j. | zasłania za sobą | następny dom z tyłu |
|---|---|---|---|
| stodoła + kurnik 18–27 / 45–62 | 46 | **8,5** | **3** (chata 17–22/35–41) |
| kuźnia 34–39 / 53–59 | 32 | 6,0 | **2** (chałupa 39–46/42–50) |
| obora 16–23 / 66–74 | 38 | 7,1 | **3** (stodoła) |
| chata 26–31 / 68–74 | 34 | 6,2 | 5 (stodoła) |
| młyn 2–9 / 74–81 | 38 | 7,1 | **1** (dom L) |
| sołtys 58–65 / 60–68 | 40 | 7,4 | 8 |
| chata 60–65 / 76–82 | 34 | 6,2 | 7 |
| chata 39–44 / 76–82 | 34 | 6,2 | 16 |

**Zachód wsi (stodoła, kurnik, obora, kuźnia, dom L, młyn) to jedna bryła**
— każdy dach wchodzi w następny budynek. Wschód (sołtys, chaty wschodnie) ma
odstępy 7–16 kafli i tam 3D czyta się dobrze. To zgadza się z wrażeniem
autora „coś jest nie tak".

### B.2 Przyczyna

Rozstaw wsi powstał dla **rysunku elewacji**: kafle domu to front + trójkąt
dachu narysowany „nad" ścianą, a obszar za domem był wolny dla oka. Bryła 3D
zajmuje ten sam prostokąt **i do tego** rośnie w górę — przy 40° każdy metr
wysokości chowa ~1,2 m terenu za domem. Odstęp 2–3 kafli, który w 2D był
podwórkiem, w 3D jest w całości pod dachem sąsiada.

Drugorzędne: wszystkie domy stoją **szczytem do kamery** (tak były narysowane
kafle), więc wieś to rząd identycznych trójkątów; prawdziwa wieś miesza
szczyty do drogi z kalenicami wzdłuż niej i ma zagrody między budynkami.

### B.3 Warianty naprawy

| wariant | co daje | koszt | ryzyko |
|---|---|---|---|
| **K1 · kąt kamery 45–55°** (`dev.widok3d.kat`) | zasłona maleje ~20–40%, dachy skrócone | minimalny | dotyka całej gry (walka, celowanie) — ocenić na telefonie |
| **K2 · niższe bryły** (ściana 15 → 12–13 j., spadek 44° → 40°) | −15–20% zasłony | minimalny (`RODZAJ` w `houses3d.py`) | strzecha < 45° jest nierealistyczna; chałupa robi się przysadzista |
| **K3 · rozstaw zachodu wsi w Tiled** | usuwa przyczynę | średni: przesunięcie 6 zespołów kafli + kolizje K3 + spawny NPC/zwierząt | ⚠ robota na KAFLACH, które przy K4 i tak przestają być źródłem — **zrobiona dwa razy** |
| **K4 · budynek jako obiekt 3D** (niżej) | obrót, rzuty L/T/U, chaty drwali, palisada, zagrody bez nowej grafiki 2D | średni-duży, jednorazowy | kolizja z obrysu zamiast z kafli — nowe miejsce, które da się popsuć |

### B.4 Rekomendacja: K4 jako źródło, potem K3 na nim, K1 do oceny

**Budynek jako obiekt Tiled** — warstwa obiektów `budynki` z punktem
(środek frontu) i właściwościami: `typ` (chalupa / stodola / obora / kurnik /
wiata / mlyn / kuznia / chata_drwala…), `obrot` (0/90/180/270), `szer`,
`gleb`, `drzwi` (pozycja), `okna`, `komin`, ewentualnie `skrzydla` dla L/T/U.
Generator (dzisiejszy `houses3d.py` prawie gotowy — skrzydło już dziś jest
prostokątem z parametrami) robi model per typ i wariant; silnik:
- stawia model z obrotem,
- **liczy kolizję z obrysu** (prostokąt/prostokąty skrzydeł → komórki `solid`
  NavGridu), zamiast z kafli `Buildings`,
- w 2D (`?widok2d`) zostaje dzisiejsza ścieżka kafli albo prosta elewacja.

Dlaczego to, a nie przesuwanie kafli:
- **chaty drwali, obóz węglarzy, palisada, zagrody, wóz** — wszystko, co autor
  zapowiada, to dziś pozycje B1–B7 z `wioska_plan.md` §7.2 zablokowane
  „brakiem kafli". W 3D kafle przestają być wąskim gardłem — palisada to
  generator słupów, nie 12 ręcznie rysowanych kafli;
- prototyp „rozwijany co jakiś czas" potrzebuje **taniego dokładania**
  budynku: obiekt w Tiled + typ, bez rysowania elewacji;
- obrót kończy „rząd identycznych trójkątów".

Kolejność: K4 (infrastruktura, na istniejących 15 budynkach przeniesionych
1:1 jako obiekty — wygląd bez zmian, dowód „nic się nie zmieniło") → K3 rozstaw
zachodu na obiektach → K1 porównanie 40/45/50° na telefonie, z domami już
rozstawionymi. ⛔ Nie robić K3 na kaflach przed K4.

---

## C. Ocena materiału z ChatGPT

### C.1 Co się zgadza (potwierdzone w repo)

| teza materiału | źródło w repo |
|---|---|
| Zagaje świadomie **poniżej średniej Lechtii** | `tarcze_checkpoint.md` §2.4 — dosłownie |
| dobre podstawowe wyposażenie powszechne, rzadkie: materiał / mistrzostwo / unikat | `tarcze_checkpoint.md` §2.1 |
| służba ~40% roku; żołd, raty, kontrakty, nagrody, rynek wtórny | `tarcze_checkpoint.md` §2.1 |
| drewno = konstrukcja tarcz, żelazo = okucia/obręcze/umba | `tarcze_checkpoint.md` §2.2, §2.5 |
| zwykły rynek do Q4, Q5+ nigdy z półki | `tarcze_checkpoint.md` §2.4; kod `shopMaxLevel: 4` |
| wieś 100×100; młyn na południowej flance z **własnym stawem i jazem**, bez wspólnej hydrologii z rzeką lasu | `wioska_plan.md` §4.2–4.3, D-2; `swiat.md` |
| Myśliwy poza palisadą, przy skraju lasu; przeprowadzka odrzucona | `wioska_plan.md` §4.3 (decyzja 2026-08-17) |
| plan 30 mieszkańców | `wioska_plan.md` §6 |
| progresja w kształcie L, pasma P1–P6, P3b bór wilków, Gęstwina dalej | `las_projekt_docelowy.md` §4 |
| las gospodarczy maleje ku wschodowi; „ludzi ubywa od wsi" | `las_projekt_docelowy.md` §4, §6 |
| palisada i tablica zleceń jako braki | `wioska_plan.md` B1, B10; `swiat.md` |

To jest wartościowe: materiał dobrze streszcza ustalenia, które w repo są
rozproszone po trzech dokumentach.

### C.2 Co jest nieaktualne albo przekłamane

| teza materiału | stan faktyczny | waga |
|---|---|---|
| „rozważono las 100×60 → 140×60" | las ma **240×90** (rozstaw ×1,5, `decyzje/2026-10-04-rozstaw-lasu.md`) — materiał sam każe to sprawdzić, ale opiera na tym myślenie o przestrzeni | średnia |
| P1–P6 jako „docelowa struktura" | `las_projekt_docelowy.md` to **`HISTORIA`, zamknięty**; **P6 stara puszcza wyszła z mapy lasu** na osobną, przyszłą (`odlozone.md`); A9/A10 niepomalowane | **wysoka** — materiał czyta plan jako stan |
| „młyn blisko bramy" | młyn x2–9 stoi ~45 kafli od bramy x51; „przy bramie" dotyczy **pasa** (y 76–99), nie odległości | niska |
| „mapa 3D wioski" jako dane | 3D jest RZUTEM mapy kafli; dziś źródłem budynków są kafle elewacji (patrz §B) — materiał nie wie, że to się zmienia | średnia |
| geografia | zgodna z mapą (wieś na północy, las na południu), ⚠ ale **`swiat.md` nadal ma odwrotną** z adnotacją (`wioska_plan.md` §1.2d: „swiat.md trzeba będzie poprawić w jednym akapicie") — materiał tego nie wychwycił, a to jedyna realna sprzeczność geograficzna w repo | **wysoka (P0)** |

### C.3 Czego w repo NIE MA (materiał przedstawia jako ustalenia)

| teza | stan |
|---|---|
| **obóz węglarzy na południe od głębokiego lasu, „najbardziej wysunięty na południe element"** | ⛔ zero wzmianek; jedyny ślad węglarstwa to **mielerz w P3** jako „ostatni ślad wsi przed dziczą" |
| Lechtia jako **państwo współpracujących księstw**; kontyngenty, rezerwa, pospolite ruszenie, wojska zawodowe | ⛔ brak; `tarcze_checkpoint.md`: „Historia Lechtii, polityka i Gildia — osobny temat, **nie tutaj**". Nazwa „Lechtia" pada w repo tylko tam |
| sąsiedztwo **Chanatu** | ⛔ zero wzmianek |
| „ustalenia ekonomii z 14–15 września" | istnieją, ale jako **założenia ograniczające projekt przedmiotów**, nie lore państwa (`tarcze_checkpoint.md` §2, nagłówek) |

Materiał uczciwie zastrzega „nie dopisuj niepotwierdzonych faktów" — a sam
podaje cztery takie fakty w trybie oznajmującym. To nie zarzut wobec
pomysłów; to ostrzeżenie dla każdej kolejnej sesji: **te tezy trzeba najpierw
zapisać jako `KANON` decyzją autora**, inaczej będą krążyć jako „ustalenia"
bez źródła — dokładnie ten mechanizm, który kosztował projekt „pole, którego
nie było w kodzie" (`CLAUDE.md`, ostrzeżenie o `zaimplementowane.md`).

### C.4 Krytyka samego zlecenia

- **Zakres nieproporcjonalny do fazy.** Osiem sekcji wyników (A–H), tabela
  rozbieżności, koncepcja regionu i wnioski dla państwa — dla wsi, która jest
  świadomie prototypem. Wartościowe są z tego trzy rzeczy: lista rozbieżności,
  logika przepływu surowców i kolejność prac.
- **Pytania o „przepływ zasobów" bez ich mechaniki.** Gospodarka nie jest
  symulowana; jedynym nośnikiem jest wygląd i rozmowa. Pytanie brzmi więc
  „czy widać, skąd drewno i węgiel", a nie „czy wieś się utrzymuje".
  Materiał to zresztą przyznaje (§6, „nie wymagaj pełnej symulacji").
- **Brak priorytetu „telefon i walka".** Ani słowa o czytelności z kamery
  mobilnej przy zabudowie 3D, a to jest dziś realny problem (§B).
- **Dobre:** zakaz przesuwania istniejących obiektów pod stary szkic, zasada
  „najpierw ustal stan", odróżnianie ustaleń od propozycji, preferencja małych,
  odwracalnych zmian. To warto przyjąć wprost.

---

## D. Węglarze i drwale — ocena pomysłu „obóz za lasem"

### D.1 Co mówi historia (wiedza ogólna, nie kanon)

- Węglarstwo było pracą **sezonową w głębi lasu**: mielerz stawia się tam, gdzie
  drewno jest tanie, a węglarze mieszkali przy nim tygodniami w budach — obóz
  daleko od wsi jest więc **realistyczny**.
- Węgiel drzewny jest lekki, ale objętościowy i kruchy; wozi się go workami
  wozami do **dużego odbiorcy**: kuźnic żelaznych, dymarek, miast. Kowal jednej
  wsi zużywa go mało — obóz produkujący na skalę regionu oznacza, że **gdzieś
  jest huta albo gród, który go kupuje**.
- Drwale pracują bliżej osady i drogi (wywózka kłód), wyręby przesuwają się
  latami; mielerz stoi na skraju wyrębu, bo pali odpady i drewno małowymiarowe.

### D.2 Zgodność z kanonem lasu

Gradient z `las_projekt_docelowy.md`: **ludzi ubywa od wsi**, a P5–P6 to
„ostatni mielerz, ostatni kilometr utrzymanego traktu — a potem bandyci".
Obóz węglarzy dostępny **wyłącznie przez głęboki las** odwraca ten gradient:
za najgroźniejszym pasmem nagle pojawia się osada.

To da się pogodzić, jeśli obóz należy do **innego gradientu**:

| wariant | sens gospodarczy | sens dla gracza | zgodność z kanonem |
|---|---|---|---|
| **W1 · obóz za lasem przy trakcie do miasta** (odbiorca: miasto / kuźnica — do zapisania jako kanon) | ✅ węgiel jedzie do miasta, nie do Radzima | ✅ przyczółek po niebezpiecznym paśmie: odpoczynek, handel, zlecenia; **zawias do reszty Lechtii** i przystanek wątku „wyjazd do miasta" (`swiat.md`) | ✅ las dalej pustoszeje od Zagajów; obóz to początek zaplecza miasta |
| W2 · obóz za lasem bez drogi dalej | ❌ nie ma komu sprzedać węgla | ✅ przyczółek | ⚠ łamie „ludzi ubywa" |
| W3 · obóz w lesie gospodarczym Zagajów (zachód P1 / P3, przy wyrębie) | ✅ zaplecze kowala, krótki transport | 🟡 element wyrębu, nie lokacja | ✅ = rozbudowany „mielerz P3" z planu |

**Rekomendacja:** W1 jako nowa lokacja (decyzja autora), a **jednocześnie
mielerz/wyręb Zagajów w zachodniej części lasu** (W3 w skromnej skali — to już
jest w planie lasu). Dwa obiekty, dwie skale: wiejski mielerz na potrzeby
Radzima i obóz węglarzy obsługujący większą gospodarkę. Węgiel u Radzima
(`swiat.md`: „węgiel" w wyposażeniu kuźni) dostaje wtedy źródło widoczne
z drogi.

⭐ Kierunek W1 jest **zgodny** z istniejącym wątkiem, gdy przeczytać go przez
odwróconą geografię: `swiat.md` mówi, że Radzim wyśle gracza do miasta „drogą
na północ przez most", ale w geografii tamtego dokumentu wieś leży **na
południe od lasu** — droga do miasta prowadzi więc **przez las i rzekę**.
Na prawdziwej mapie (wieś na północy) to trakt na **południe, przez las**.
Obóz węglarzy „za lasem", przy tym trakcie, to naturalny przystanek w drodze
do miasta — a miasto to naturalny odbiorca węgla. ⚠ Warunek: przy poprawce
geografii w `swiat.md` (P0) zapisać wprost, że trakt do miasta wychodzi
z lasu na południu — inaczej ten wniosek wisi na interpretacji.

### D.3 Koncepcja funkcjonalna obozu (bez współrzędnych — lokacja nie istnieje)

```
  [las: skraj wyrębu]      [mielerze 2–3, w różnych fazach: stos · palący się · rozebrany]
         │                         │
   ścieżka zrywkowa          plac roboczy (ubita ziemia, sadza, zwęglone polana)
         │                         │
  [sągi drewna]──────────[buda węglarzy][ognisko][kosze/worki z węglem]
                                   │
                         [załadunek: wóz, rampa]──── DROGA do odbiorcy (W1)
```

Zasady przestrzenne: mielerze z dala od bud (dym, ogień); sągi między lasem
a mielerzami (drewno idzie z lasu do ognia); worki przy drodze (załadunek);
dookoła **martwa strefa** — wycięte, wydeptane, poczerniałe, bez runa. Pustka
wokół obozu jest treścią (ta sama zasada co bór wilków: „terytorium poznaje
się po tym, czego w nim nie ma").

Wszystko to są modele generowane (mielerz, sąg, buda, kosz, wóz) — w 3D bez
nowego pixel-artu.

---

## E. Rozbieżności (tabela)

| obszar | stan obecny | ustalenie dokumentacji | problem | pewność |
|---|---|---|---|---|
| geografia wieś–las | wieś N, las S (portal 51,99 → 62,2) | `swiat.md`: wieś na **południe** od lasu | dokument `KANON` przeczy mapie; poprawka zapowiedziana w `wioska_plan.md` §1.2d i niezrobiona | pewne |
| struktura lasu | 240×90; P6 poza mapą; A9/A10 puste | `las_projekt_docelowy.md` P1–P6 na jednej mapie | plan `HISTORIA` czytany jako stan (także przez ChatGPT) | pewne |
| węglarze | brak | brak (tylko mielerz P3) | obóz istnieje wyłącznie w rozmowie autora z ChatGPT | pewne |
| Lechtia / Chanat | brak lore | brak (`tarcze_checkpoint.md`: „osobny temat") | tezy materiału nie mają źródła | pewne |
| zabudowa 3D | 15 modeli z kafli elewacji, odstępy 1–5 kafli na zachodzie | `wioska_plan.md` — rozstaw pod 2D | zasłanianie 6–8,5 kafla przy 40° | pewne (pomiar) |
| palisada | brak | „fundament prologu" (B1) | „poza palisadą" Myśliwego nic nie znaczy | pewne |
| wyręb / drwale | brak na mapie | P1 zachód (plan lasu) | martwa ćwiartka lasu bez powodu | pewne |

---

## F. Rekomendacje

**P0 — przed dalszą rozbudową**
1. ✅ **Poprawić geografię w `swiat.md`** — ZROBIONE 2026-10-09 (zapowiedziane
   od 2026-08-10). Koszt: minuty. Bez tego każda analiza świata — także
   zewnętrzna — zaczyna od sprzeczności.
2. **Zapisać decyzją autora, co z materiału ChatGPT jest kanonem** (obóz
   węglarzy i jego kierunek, Lechtia jako księstwa, Chanat). Do tego czasu
   traktować jako szkic. Koszt: decyzja.

**P1 — duży wpływ**
3. ✅ **K4: budynek jako obiekt 3D w Tiled** — ZROBIONE 2026-10-09 (dziennik (12)): 18 obiektów 1:1, wygląd bez zmian, obrót sprawdzony w grze. (§B.4) — infrastruktura pod
   wszystko poniżej. Ryzyko: kolizja z obrysu — wymaga asercji „nikt nie
   stoi w ścianie" (wzorzec z K3 2026-10-06).
4. ✅ **K3: rozstaw zachodu wsi na obiektach** — ZROBIONE 2026-10-09 (dziennik (13)); obroty kalenicą do drogi — jeszcze nie. — zagrody i podwórza między
   stodołą, oborą, kurnikiem, kuźnią i domem L; przy okazji obrót części
   budynków kalenicą do drogi.
5. ✅ **Palisada jako generator 3D** (B1) — ZROBIONE 2026-10-09 (dziennik (14)) — odblokowana przez 3D.

**P2 — później**
6. Wyręb + chaty drwali + skromny mielerz w zachodniej części lasu (W3).
7. Kąt kamery: porównanie 40/45/50° na telefonie z rozstawioną wsią.
8. Wóz drabiniasty i ślady transportu (B7) przy młynie i stolarzu.

**P3 — przyszłość**
9. Nowa lokacja: obóz węglarzy (W1) z drogą do odbiorcy.
10. Lore Lechtii w osobnym dokumencie `KANON`, zanim pojawi się w dialogach.

---

## G. Co Zagaje mówią o Lechtii — fakty vs wnioski

**Fakty (repo):** wieś biedna z wyboru projektu; kowal ma półkę `[1,2]`
i żyje z okuć, pługów i części młyna; stolarz robi drewno, kowal żelazo „od
dwudziestu lat"; ludzie wracają ze służby ze sprzętem — stąd rynek wtórny;
drewno to podstawowy materiał uzbrojenia królestwa.

**Wnioski (nie kanon):** królestwo uzbraja się z lasów, więc gospodarka leśna
(drewno, węgiel, smoła) jest strategiczna; wieś na skraju dużego lasu jest
naturalnym zapleczem surowcowym, nie tylko rolniczym; obóz węglarzy obsługujący
kuźnicę byłby pierwszym miejscem, gdzie gracz **widzi** tę skalę — i dobrym
zawiasem z „wsi na dnie" do „gospodarki państwa".

---

## H. Kolejność prac (bez robienia czegokolwiek dwa razy)

```
P0: swiat.md (geografia) ─┐
P0: decyzja: kanon węglarzy/Lechtii ─┐
                          │          │
P1: K4 budynek-obiekt (15 domów 1:1, dowód „bez zmian") 
        └─ P1: K3 rozstaw zachodu + obroty
              └─ P1: palisada (generator)
                    └─ P2: kąt kamery na telefonie
P2: wyręb/drwale/mielerz w lesie (niezależne od wsi)
P3: obóz węglarzy (nowa mapa) — po decyzji kanonu i po K4 (te same typy budynków)
```

⛔ Nie przesuwać kafli budynków przed K4. ⛔ Nie wyznaczać współrzędnych obozu
przed decyzją o jego drodze.
