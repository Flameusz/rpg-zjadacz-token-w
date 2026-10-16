---
typ: OPERACYJNE
domena: [world, quests]
tytul: Region Zagajów w rozdziale 1 — propozycja geografii
stan: zywy
otwarte: [OI-171, OI-172]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# Region Zagajów w rozdziale 1 — propozycja geografii

> **Czym jest ten plik.** To JEDNA propozycja układu regionu do akceptacji
> autora. Nie ma w niej kodu, map ani assetów. ⛔ **To nie jest kanon.** Po
> akceptacji ustalenia przechodzą do `swiat.md` (`KANON`), a ten plik dostaje
> `stan: zamkniety`.
>
> Każda pozycja ma jedną z czterech etykiet:
> **[JEST]** w mapie albo w kodzie · **[USTALONE]** zapisane wcześniej w kanonie
> albo w planie · **[PROPOZYCJA]** nowe, czeka na zdanie autora ·
> **[PRZYSZŁOŚĆ]** tylko możliwość, nie projektujemy.
>
> Materiał autora z rozmów z ChatGPT traktuję jako intencję, nie jako układ do
> odtworzenia. Nadrzędne zostają: `swiat.md` §1 (kręgosłup, kolejność
> odsłaniania, „bliżej źródła pusto"), `spider_colony.md`, zamknięty etap lasu
> (`forest_rebuild_scope.md`) oraz rozstaw (`decyzje/2026-10-04-rozstaw-lasu.md`).

---

## 0. W trzech zdaniach

1. Region ma **dwie osie**. Oś **ludzka biegnie traktem z północy na
   południe**: Zagaje → las użytkowy → bród → las przy trakcie → obóz węglarzy
   → miasto. Oś **dzika biegnie na wschód**: delianki zarastają → zarzucony
   wyrąb → Gęstwina → leże kolonii.
2. Przybywa **jedna nowa mapa**: odcinek traktu za lasem z obozem węglarzy,
   dołączony płynnie pod lasem. Gęstwina zostaje osobną mapą za progiem,
   a miasto jest cięciem podróży („cztery dni wozem"), nie mapą do przejścia.
3. Najpierw trzeba rozstrzygnąć jedną sprzeczność: **teksty i układ wsi
   prowadzą do miasta na PÓŁNOC, a kanon świata na POŁUDNIE** (§2).

---

## 1. Stan zmierzony 2026-10-11 [JEST]

| element | gdzie (kafle mapy członkowskiej) | źródło |
|---|---|---|
| świat płynny | wieś 128×128 nad lasem 240×90, szew na trakcie x 60–63 | `maps/swiat.world`, `src/world/CLAUDE.md` |
| trakt wsi | x 60–63 **od krawędzi y 0 do y 127**. Wychodzi z mapy także na PÓŁNOC, w pustkę | `village-zagaje.tmj` |
| karczma | przy północnym wjeździe (66, 29) | decyzja owalnicy 2026-10-09, utrzymana 2026-10-10 |
| drwale | SW skraj wsi; kładka (14–17, 100) na zachodni brzeg potoku → wyręb w NW lasu (sterty i dłużyce x 5–14, y 7–20) | `zagaje_projekt_ukladu.md` K3b/K5 |
| rzeka | płynie przez las ze wschodu na zachód (y ≈ 24–40); źródłowe rozlewisko na wschodzie (x 210–240) | `forrest.tmj` |
| przeprawa | trakt przecina rzekę przy x 60–63, y 28–37 jako kafle drogi nad wodą. W planie lasu to **bród**: „nie most" (Z-5), most miał być późniejszą inwestycją wsi | `las_faza1b_final.md` Z-5 |
| trakt za rzeką | biegnie na południe do y ≈ 64, skręca na **wschód** i urywa się w strzępach przy x ≈ 130 | `forrest.tmj` |
| gradient lasu | ludzi ubywa **ku wschodowi**: wyręb A1 → delianki A5 → odległe delianki A7 → zarzucony wyrąb A8 | `forest_rebuild_scope.md` (współrzędne sprzed ×1,5) |
| Gęstwina | portal na wschodniej krawędzi lasu (238,5; 69) → (2, 32) mapy 64×64; trakt umiera, dwa zastoiska, 2 sieciarze + 3 skoczki | `thicket-gestwina.tmj`, `swiat.md` §4 |
| obóz bandytów | v3 (119,5; 38,5): południowy brzeg rzeki, ~25 kafli na północ od traktu. ⚠ Miejsce **ROBOCZE** | `bandyci_plan.md`, `odlozone.md` §1 |
| południowa krawędź lasu | y 89, lity las, bez drogi i bez przejścia | `forrest.tmj` |

Mielerza nie ma na mapie, obozu węglarzy nie ma nigdzie, leża i jaskini też
nie ma.

---

## 2. Sprzeczność do rozstrzygnięcia najpierw: w którą stronę jest miasto

> ✅ **ROZSTRZYGNIĘTE 2026-10-15 — wbrew rekomendacji niżej: miasto na
> PÓŁNOCY.** Górna droga wsi prowadzi do miasta. Na południe od wsi leżą las,
> dzikie obszary i węglarze (`docs/decyzje/2026-10-15-przeglad-pytan-autora.md`
> pkt 7). Kwestia kowala („na północ") zostaje bez zmian. Do wyrównania:
> `swiat.md` §1 „Oddech", czyli wyjazd do miasta przez las. Oś z §0 i §3
> („Zagaje → las → węglarze → miasto") już nie obowiązuje: węglarze są
> celem w dziczy na południu, a nie przystankiem w drodze do miasta.
> Rozumowanie poniżej zostawiam jako historię.

| za POŁUDNIEM (przez las i rzekę) | za PÓŁNOCĄ (od strony karczmy) |
|---|---|
| `swiat.md` §1 „Oddech": wyjazd do miasta wynika z tego, że **„wilki się panoszą i nie ma komu iść"**, a droga przez las i most na południe „jest pod ten wątek położona" | decyzja owalnicy: karczma stoi „przy trakcie **od strony miasta**", a trakt idzie „z północy (do miasta)" |
| `swiat.md` §3 (poprawka geografii 2026-10-09): „za rzeką […] trakt do miasta" | `zagaje_projekt_ukladu.md` §C: Anna wiezie towar do miasta „traktem na północ" |
| audyt W1: węglarze „za lasem, przy trakcie do miasta". Materiał autora: obóz „na południowym skraju głębokiego lasu" | kowal (`BLACKSMITH.topics.miasto`): „Na **północ**, przez most […] do miasta". Ta kwestia powstała przy dawnej, odwróconej geografii, kiedy wieś leżała na południe od lasu |
| wóz Anny jedzie „często z kimś do ochrony" (autor 2026-10-10). Ochrona ma sens tylko na drodze przez las | Myśliwy: „nikt stąd nie chodzi dalej niż most" — pasuje do lasu jako ślepego końca |

**Rekomendacja: miasto na POŁUDNIU.** Tylko przy tym wariancie kręgosłup
działa bez łatania. Powód wyjazdu (wilki na drodze), próg mostu, węglarze
z materiału autora i eskorta wozów leżą na jednej osi. Gdyby miasto leżało na
północy, droga do niego omijałaby las. Wtedy wilki nie byłyby przeszkodą
w podróży, a las stałby się ślepym zaułkiem, do którego wieś nie ma po co
chodzić.

Koszt wariantu POŁUDNIE (teksty do wyrównania, żadna mapa):
- kowal: „na północ" → „na południe";
- Myśliwy: „nikt stąd nie chodzi dalej niż most" kłóci się z wozami wsi do
  miasta. Zdanie trzeba zawęzić (np. do zejścia z traktu) albo zostawić jako
  przesadę człowieka, który pamięta las sprzed wozów;
- karczma zostaje na miejscu; nieaktualne jest tylko sformułowanie „od
  strony miasta". Zamkniętej decyzji się nie edytuje, więc wystarczy dopisek
  w `swiat.md`;
- północny wylot traktu prowadzi „dalej", poza rozdział 1. Tam mieszczą się
  wozacy, którzy „jadą dalej z mąką" (Bogusz), i cotygodniowy targ Anny.
  ⚠ Targ raz w tygodniu nie może być miastem odległym o cztery dni. To
  sprzeczność tekstów, niezależna od kierunku. ⛔ Mapy na północy nie budujemy.

---

## 3. Propozycja: dwie osie i mapy z funkcją [PROPOZYCJA]

```
                  (północ: trakt „dalej" — poza rozdziałem 1, bez mapy)
                                   │
                     ┌──── ZAGAJE (wieś) ────┐
                     │   drwale SW, kładka   │
          ═══════════╪═══════ szew płynny ═══╪══════════════════════════════════╗
          LAS        │ wyręb A1        trakt │                                  ║
          (240×90)   │ ~~~~~~~~~ RZEKA ══ bród/most ~~~~~~~~~~~~~~~ rozlewisko  ║
                     │ delianki A5 + mielerz kowala   A7 ··· A8 zarzucony wyrąb ║→ PORTAL (próg)
          wilki SW   │ └─ trakt skręca na wschód i UMIERA ·····                 ║   GĘSTWINA 64×64
                     │                                                          ║   przedpole leża
                     ▼ NOWA odnoga traktu na południe                           ║   └→ [PRZYSZŁOŚĆ]
          ═══════════╪════ szew płynny ═══════════════════════════════════════╝       wnętrze leża
          TRAKT ZA   │ las przy trakcie (droga utrzymana, puszcza po bokach)
          LASEM      │ OBÓZ WĘGLARZY przy trakcie, na skraju lasu
          (nowa)     ▼
                 CIĘCIE PODRÓŻY → miasto (poza tym dokumentem)
```

| mapa | status | jedna funkcja | wejście / wyjście |
|---|---|---|---|
| Zagaje | [JEST] | dom, handel, zlecenia | szew z lasem |
| Las | [JEST] | rewir gracza i szczebel wilków; gradient ludzi W→E | szew z wsią; **nowy** szew na południu; portal do Gęstwiny |
| **Trakt za lasem** *(nazwa robocza)* | [PROPOZYCJA] | **przyczółek ludzi po drugiej stronie lasu**: węglarze, eskorty, droga do miasta | szew z lasem; cięcie podróży do miasta |
| Gęstwina | [JEST] | **przedpole kolonii**: las robi się cudzy | portal z lasu; wejście do leża |
| wnętrze leża | [PRZYSZŁOŚĆ] | zejście w głąb gniazda | z Gęstwiny |

Po jednej mapie na funkcję i bez map-łączników. Kafle między wsią a obozem
to las, który już istnieje.

---

## 4. Miejsca po kolei

### 4.1 Las użytkowy i drwale [JEST / USTALONE]

Las przechodzi stopniowo w dzicz już dziś, i to wzdłuż właściwej osi: na
zachodzie świeży wyręb Ciechana (A1), w środku delianki (A5), a na wschodzie
gospodarka gaśnie (A7–A8) aż do progu Gęstwiny. Myśliwy mówi: „za most chodzi
się po drewno". Delianki leżą za rzeką. ⛔ **Nic tu nie dokładam.** Las jest
zamkniętym etapem, a materiał autora opisuje to, co mapa już mówi.

### 4.2 Mielerz kowala ≠ obóz węglarzy [USTALONE + PROPOZYCJA]

To nie jest sprzeczność, tylko dwie rzeczy w dwóch skalach. Taki podział
rekomendował już audyt 2026-10-09 §D:

| | mielerz kowala | obóz węglarzy |
|---|---|---|
| kto | Agata i Adrian, „dwa razy do roku, tydzień pilnowania" | ludzie z tego fachu, cały sezon |
| dla kogo | kuźnia Radzima | miasto |
| gdzie | **za rzeką, w deliankach A5** [USTALONE: dialogi + plan lasu A5 „mielerz — ostatni ślad wsi"] | **za lasem, przy trakcie** [PROPOZYCJA] |
| skala | jeden mielerz przy deliance | 2–3 mielerze w różnych fazach, budy, sągi, wóz, załadunek (audyt §D.3) |
| na mapie | ⏳ brak: asset mielerza „TODO", obiekt do postawienia w A5 | nowa mapa |

Mielerz kowala jest jedną drobną dekoracją w lesie, nie przebudową. Szczapy
na niego dają już dziś drwale („Kowal bierze bukowe szczapy sągami").

### 4.3 Obóz węglarzy — mapa „Trakt za lasem" [PROPOZYCJA]

**Gdzie.** Odnoga traktu odchodzi na południe od miejsca, w którym droga
w lesie skręca na wschód (x ≈ 62–66, y ≈ 64), i dochodzi do krawędzi y 89.
Pod lasem leży nowa mapa: najpierw las przy utrzymanym trakcie, potem obóz
na jego **południowym skraju**, przy drodze. Spełnia to oba źródła naraz:
„południowy skraj głębokiego lasu" z materiału autora i „za lasem, przy
trakcie do miasta" z audytu W1.

**Dlaczego to nie łamie gradientu.** Ludzi ubywa ku **wschodowi**, a nie
na południe. Trakt na południe jest drogą, na której ludzi znów przybywa:
zaczyna się tu zaplecze miasta. Odnoga mija bór wilków od wschodu, więc
droga do miasta biegnie skrajem ich terenu. To jest geograficzny zapis zdania
„wilki się panoszą i nie ma komu iść". Wschodnia gałąź traktu dalej umiera
w A7, a ten gest zostaje nietknięty.

**Funkcja dla gracza:** przystanek po niebezpiecznym odcinku (ognisko,
handel, zlecenia) i pierwszy odcinek podróży z „Oddechu".

**Łańcuch z materiału autora (intencja, bez treści zadań):** Zagaje (zapasy:
Anna, kowal) → drwale (wóz, eskorta; Ciechan „synów samych w głąb już nie
puszcza", więc jeżdżą we dwóch albo z kimś) → węglarze → węgiel do miasta.
Propozycja miejsca w czasie: **po Szarym, jako zwyczajny powód pierwszego
odcinka podróży**. Tak `swiat.md` §1 zabrania pisać podróż jako pretekst.
⚠ Uwaga gospodarcza z audytu §D.1: węglarz zwykle pali drewno z miejsca.
Drewno od drwali broni się jako dodatek, nie jako jedyne źródło. Geografii
to nie blokuje.

**Zderzenie z kanonem: palisada.** Materiał autora daje obozowi palisadę
i prowizoryczną wieżę. Kanon szczebli mówi: wieś grodzi się **płotem**,
gród **palisadą**, miasto **murem**, a „palisada w grze zapowiada pierwszy
gród". Rekomendacja: **ostrokół z żerdzi i zasieki** zamiast palisady,
a wieża zostaje (patrzy na drogę i ogień mielerzy). Tak obóz broni się przed
zwierzem i zbójem, a nie podszywa się pod gród.

**Wokół obozu:** martwa strefa (wycięte, wydeptane, czarne od sadzy, bez
runa). Pustka jest tu treścią, jak w borze wilków.

⛔ Bez statusu prawnego obozu, bez podatków i bez lore Lechtii. Ludzie obozu
mówią, CO widzą, nigdy DLACZEGO (reguła Ciechana).

### 4.4 Przeprawa i droga do miasta [USTALONE + PROPOZYCJA]

- **Przeprawa** zostaje w miejscu, w którym jest [JEST]. Dialogi mówią
  „most", a mapa ma bród (Z-5). Trzeba to wyrównać przy budowie odnogi.
  Ponieważ jest to droga dla wozów, rekomenduję **most**: Z-5 przewidywał go
  jako „inwestycję wsi", więc może już stać. Tak wymaga §4 `swiat.md`:
  „zwężenie, rozpadające się barierki, dalej to inna sprawa".
- **Miasto nie jest mapą do przejścia.** „Cztery dni wozem" przy obecnej skali
  map dają dziesiątki ekranów lasu. Południowa krawędź mapy „Trakt za lasem"
  kończy się **cięciem podróży**: ekranem wyjazdu i przyjazdu, tak jak
  przejście kończy się dziś przebudową sceny. Czym jest miasto, ten dokument
  nie rozstrzyga.

### 4.5 Gęstwina i wejście do leża [JEST + PROPOZYCJA]

- Gęstwina zostaje **osobną mapą za portalem** [JEST]. Wejście w nią to
  **próg**, nie kolejny krok (`forest_rebuild_scope.md` §0, A8). Przygaszenie
  przy przejściu robi tę samą robotę co zmiana mapy: wchodzisz gdzie indziej.
  ⛔ Nie wklejać jej do `swiat.world`.
- **Wejście do leża** [PROPOZYCJA] leży na wschodnim końcu mapy, **za parą
  skoczków** (52–54, 27–29). Ta para już dziś stoi tam, gdzie „poszło się
  dalej, niż trzeba było". Pajęczyny gęstnieją od wejścia ku jaskini
  i wyznaczają granicę kolonii, tak jak chce materiał autora. Wylot jaskini to
  model 3D na płaskim terenie, nie nowa rzeźba mapy.
- ⚠ **Przesunięte przez autora 2026-10-12:** leże NIE stoi w Gęstwinie,
  tylko dalej — „za lasem gospodarczym, za Gęstwiną, może matecznik albo
  puszcza” (`docs/spider_colony.md` §3). Wylot jaskini w Gęstwinie z akapitu
  wyżej jest przez to nieaktualny; Gęstwina zostaje przedpolem ze znakami.
- **Co widać i kiedy** rozstrzyga `OI-172`. Propozycja stamtąd: w pierwszej
  fali tylko sieci, cisza i zasnuty wylot, a ofiary dopiero w drugiej fali.
  Geografia od tego nie zależy, bo wylot stoi w tym samym miejscu w obu
  falach.
- ⛔ Gęstwina dalej **niczego nie tłumaczy**: żadnego NPC, notatki ani
  znaleziska.

### 4.6 Obszar podziemny [PRZYSZŁOŚĆ]

Jedyna możliwość, jaką ten plan zostawia: **wnętrze leża jako osobna mapa za
wylotem jaskini**, na zejście do królowej (`spider_colony.md` §3). Powstaje
dopiero po `OI-172` i po ustaleniu ról kolonii. ⛔ Żadnej sieci podziemi
„w stronę rasy", żadnych haków w kodzie na zapas (`spider_colony.md` §5).
Ruiny starsze niż Zagaje i stara puszcza (`forest_rebuild_scope.md` §0) też
zostają poza rozdziałem 1.

### 4.7 Obóz bandytów [JEST, ROBOCZE]

v3 zostaje, bo działa i zadanie „Zrabowany wóz" jest grywalne. Leży za rzeką
(zgodnie z „Zbóje za rzeką" sołtysa) i z dala od traktu (zgodnie z wolą
autora: „ciężej dostępne miejsce"). **Kiedy powstanie „Trakt za lasem",
warto wrócić do tego miejsca.** Zbójom naturalnie pasuje droga do miasta,
z której mają łup. Przeniesienie wymaga jednak przepisania opisu zadania
i `working` Ciechana (`odlozone.md` §1). To decyzja przy tamtym kroku, nie
teraz. ⛔ Nie w Gęstwinie.

---

## 5. Przejścia wynikają z geografii

| przejście | rodzaj | dlaczego tak |
|---|---|---|
| wieś ↔ las | płynne [JEST] | jeden teren, trakt się nie urywa |
| las ↔ Trakt za lasem | **płynne** [PROPOZYCJA] | las przechodzi w las, trakt biegnie dalej. ⚠ Wymaga pomiaru 3D na S21 FE; jeśli wynik nie przejdzie, wariantem zapasowym jest portal na krawędzi y 89 |
| las → Gęstwina | portal [JEST] | próg: „to, co leży ZA" strefą wschodnią |
| Gęstwina → leże | portal [PRZYSZŁOŚĆ] | wylot jaskini to drzwi z natury rzeczy |
| Trakt za lasem → miasto | cięcie podróży [PROPOZYCJA] | cztery dni drogi nie są mapą |
| północny wylot traktu wsi | brak [JEST] | prowadzi poza rozdział 1 |

---

## 6. Czego ta propozycja świadomie nie robi

- ⛔ nie przebudowuje lasu. Jedyna ingerencja to **pas odnogi traktu** od
  zakrętu do krawędzi y 89 (z `tools/forest_clearance.py` jako strażnikiem).
  Powód jest fabularny (§2), a nie błąd z gry, i dlatego wymaga zgody autora
  (§8);
- ⛔ nie projektuje miasta, mapy na północ od wsi ani lore Lechtii;
- ⛔ nie nadaje obozowi statusu prawnego ani podatków;
- ⛔ nie dodaje rasy pająków ani podziemi poza wnętrzem leża;
- ⛔ nie ustala liczb (rozmiar nowej mapy, populacja, łup). Mapę projektuje
  się dopiero po akceptacji osi, a rozmiar wynika z trzech części (las przy
  trakcie, obóz z martwą strefą, wylot drogi).

---

## 7. Teksty i plany do wyrównania po decyzji (nieblokujące)

| gdzie | co | przy wariancie |
|---|---|---|
| `GameConfig` `BLACKSMITH.topics.miasto` | „Na północ" → „Na południe" | POŁUDNIE |
| `GameConfig` Myśliwy `most` | „nikt stąd nie chodzi dalej niż most" wobec wozów do miasta | POŁUDNIE |
| `swiat.md` §3 tabela obiektów | karczma „od strony miasta" | POŁUDNIE |
| `zagaje_projekt_ukladu.md` §C | Anna i miasto „traktem na północ"; targ co tydzień ≠ miasto o cztery dni drogi | oba |
| dialogi wobec mapy | „most" przy brodzie (§4.4) | oba |
| `swiat.md` §1, §3, §4; audyt W1 | cała oś południowa | PÓŁNOC (koszt dużo większy) |

⚠ Po każdej zmianie rozmów: `node tools/rozmowy_przymiar.mjs`.

---

## 8. Decyzje BLOKUJĄCE (tylko te)

1. **Miasto leży na POŁUDNIU, za lasem i rzeką?** (§2; rekomendacja: tak).
   Bez tej decyzji nie wiadomo, gdzie jest obóz węglarzy, dokąd prowadzi
   eskorta ani które dialogi poprawić.
2. **Obóz węglarzy jako NOWA mapa „Trakt za lasem", płynnie pod lasem,
   z odnogą traktu przez zamknięty las do krawędzi y 89?** (§4.3, §6).
   Alternatywa to obóz w obrębie obecnego lasu (audyt W3), co oznacza
   przebudowę zamkniętego etapu i zderzenie z „ludzi ubywa".
3. **Ostrokół z żerdzi i wieża zamiast palisady przy obozie?** (§4.3,
   szczeble osady). Blokuje dopiero projekt samego obozu, nie przyjęcie
   geografii.
