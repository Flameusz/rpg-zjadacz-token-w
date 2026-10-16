---
typ: OPERACYJNE
domena: [shields, items, ui]
tytul: Checkpoint — GRAFIKA tarcz: pixel-art, standard drewna, gabaryt 1x2, RODZINA 3D
stan: zywy
otwarte: [OI-126, OI-127, OI-128, OI-144, OI-145]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-22
---

# CHECKPOINT — GRAFIKA TARCZ I STANDARD DREWNA (2026-09-19)

> **Po co ten plik.** Punkt wejścia do wszystkiego, co dotyka **grafiki tarcz,
> wspólnego standardu drewna i gabarytu 1×2 w interfejsie**.
> **Wracając do tego wątku, zacznij od tego pliku — nie od ponownego audytu.**
>
> ⚠ **To jest TRZECI dokument o tarczach i każdy odpowiada na inne pytanie:**
> `docs/tarcze_checkpoint.md` — **konstrukcje, materiały, jakość, warianty** (decyzje projektowe) ·
> `docs/pancerz_checkpoint.md` — **mechanika** (bloki, strefy, `T-1`, liczby katalogu) ·
> **ten plik** — wyłącznie **wygląd i to, jak wygląd wszedł do gry**.
>
> ⛔ Nie scalaj ich. Pierwsze dwa są zamrożone w swoim zakresie; ten jeden żyje.

---

## 1. Co jest ZROBIONE i ZAMKNIĘTE

### 1.1 Master sześciu drewnianych tarcz

⭐⭐ **Sześć konstrukcji rysowanych NATYWNIE w 32×32 / 32×64**, generator
`tools/build_shield_icons.py` (przymiar; zapis pod `--zapisz`, stress test pod
`--snapper`).

| konstrukcja | historycznie | px | desek | gabaryt |
|---|---|---|---|---|
| puklerz | 38 × 38 cm | 17 × 17 | 3 | 1×1 |
| okrągła | 66 × 66 cm | 29 × 29 | 5 | 1×1 |
| rycerska | 68 × 62 cm | 29 × 27 | 5 | 1×1 |
| migdałowa | 105 × 55 cm | 45 × 23 | 4 | **1×2** |
| legionowa | 106 × 57 cm | 47 × 25 | 5 | **1×2** |
| pawęż | 112 × 48 cm | 49 × 21 | 4 | **1×2** |

⛔ **Wariant bazowy to SAME PIONOWE DESKI** — bez umba, okuć, poziomych belek,
centralnych grzbietów i metalu. **To jest decyzja katalogowa, nie brak czasu**:
umbo, obrzeże i wzmocnienie są osiami WARIANTU i dokładają się DO tej bryły.
⛔ Nie „uzupełniaj" mastera o historyczne detale.

Reguły skali (pełny zapis: `public/assets/README.md`, sekcja o tarczach):
**0,44 px = 1 cm** · szerokość tarczy wypukłej to **cięciwa, nie łuk** ·
**szerokość deski stała 11–14 cm** (większa tarcza = więcej desek) ·
sylwetka 1×1 ma **sufit 30 px**.

### 1.2 Standard drewna całego ekwipunku

⭐⭐ **`tools/wood_palette.py` — 29 kolorów, wspólne dla CAŁEGO drewna w grze**
(tarcze, rękojeści, trzonki, drzewce, łuki, skrzynie, beczki). Rampa 12 stopni
+ słój ciepły/chłodny na stopniach 3–10 + kontur. Plik sprawdza własne
niezmienniki; `--probka` rysuje dziewięć przedmiotów spoza tarcz.

⛔ **Nie wpisuj brązu „tylko dla tarczy"** — od tego zaczyna się dwadzieścia
mikro-palet zamiast jednego materiału.

Trzy reguły, każda z pomiaru: **jasność** 30→150 geometrycznie ·
**nasycenie MALEJE ku górze** 0,64→0,45 (lekarstwo na żółto-morelowe drewno) ·
**odcień** 24,5°→22° (⛔ nie schodź do 20°, całość ucieka w mahoń).

### 1.3 Integracja w grze

- **Sześć PNG** w `public/assets/items/icon_shield_wood_*.png` — **generator
  pisze je wprost**, nie kopiuje się ich ręcznie.
- **`iconTexture`** na 12 drewnianych tarczach (trzecia ścieżka ikony,
  sprawdzana przed `icon`). ⚠ Do 2026-09-19 **dziesięć z jedenastu** dzieliło
  jeden kafel `(11,9)` z `items.png`.
- **`inventoryFootprint: 1×2` na 12 tarczach** — wszystkie migdałowe, legionowe
  i pawęże, **także żelazne i stalowe**. ⭐ Gabaryt wynika z KONSTRUKCJI, nie
  z materiału.
- **Kafel ręki w lalce: dwa pola w pionie** (`WEAPON_ROWS_MAX`), przy czym
  liczba wierszy jest **wynikiem pomiaru** — telefon schodzi do jednego.
- **`src/ui/IconFit.ts`** — jedna reguła skali ikony (całkowita; przy
  zmniejszaniu odwrotność całkowitej), wspólna dla lalki i sklepu.
- ⭐⭐ **Półka kupca układa gabaryt tak samo jak plecak** (`packShelf`
  w `src/ui/ShopLayout.ts`, 2026-09-19): tarcza `1×2` zajmuje w sklepie **dwa
  pola**, ikona siada na środku przykrycia, złota ramka zaznaczenia świeci na
  obu polach. Trzy siatki panelu handlu i plecaka mówią dziś o gabarycie
  jedno.

---

## 2. Trzy usterki, które pokazał WYŁĄCZNIE render

Wszystkie przy zielonych asercjach — warte pamiętania, bo wrócą przy każdym
następnym przedmiocie niekwadratowym:

1. **Ikony 1×2 przecięte w połowie.** Kafle powstają po kolei (ramka → ikona),
   więc ramka pola `i+cols` lądowała NA ikonie pola `i`. Naprawa: ikony idą na
   wierzch po zbudowaniu kraty (`PlayerPanel.buildGrid`).
2. **Podświetlenie zaznaczenia obejmowało samą kotwicę** — złota ramka świeciła
   na połowie przedmiotu. Dziś pyta o przykrycie przez `bagAnchor`.
3. **Sklep zmniejszał ikonę do kafla.** ⚠⚠ **Pierwsza naprawa była objawowa
   i przeżyła pół dnia**: kolumna kupca dostała wyższy rząd (`rowH` 70), czyli
   rozsunięcie CAŁEJ półki pod najwyższą ikonę. Ramka pola zostawała kwadratowa
   (46 j.), więc tarcza wisiała 9 j. nad nią i 9 j. pod nią — zgłoszone
   z gry tego samego dnia jako „w sklepie też powinny zajmować 2 pola".
   ⭐ **Właściwą odpowiedzią jest GABARYT**, nie wyższy rząd: `packShelf`
   układa półkę jak plecak, `rowH` wrócił na 46 i **wróciły też cztery widoczne
   rzędy** (`OI-125` zamknięte). ⛔ Nie podnoś `rowH` żadnej z kolumn — po
   stronie gracza zabiera to czwarty wiersz i bazowy plecak przestaje mieścić
   się bez paska (S4/S5/S6).

---

## 3. Bramki — co uruchomić po każdej zmianie

```
python tools/build_shield_icons.py --snapper     # grafika + stress test redukcji
python tools/wood_palette.py --probka            # standard drewna + próbka przedmiotów
node tools/gabaryt_przymiar.mjs                  # gabaryt 1×2 w modelu
node tools/ekwipunek_uklad.mjs                   # lalka: kafel ręki, trzy ramki
node tools/sklep_uklad.mjs                       # okna kolumn handlu
npx tsc --noEmit && npm run build
```

⚠ **W silniku sprawdź `window.dev.missing` (puste) i `load.totalFailed` (0)** —
nietrafiona ścieżka assetu NIE wywala buildu.

⚠ **Bramka gabarytu miała asercję „żaden przedmiot nie deklaruje gabarytu"** —
prawdziwą do tej sesji. Została **przepisana na mocniejszą**, nie skasowana:
pilnuje, że gabaryt mają wyłącznie trzy duże konstrukcje i **każda** ich sztuka.
To ona wyłapała, że przy pierwszym podejściu pominięto egzemplarze żelazne
i stalowe.

---

## 4. ⛔ Czego NIE otwierać ponownie

- **Kierunek artystyczny mastera** — zamknięty po sześciu rewizjach
  (kształt → paleta → skala → mapowanie słojów → nasycenie). Materiał do oceny:
  `docs/art-review/shields-master-*.png`.
- **Liczba kolorów** — 29 jest wynikiem pomiaru płaskich plam i próbki na
  przedmiotach spoza tarcz, nie kompromisem estetycznym. ⛔ Nie „upraszczaj"
  z powrotem do 23 i nie dobijaj do 32.
- **Brak umba i belek w wariancie bazowym** — patrz §1.1.
- **Gabaryt 1×2 dla trzech dużych konstrukcji** — wynika ze skali świata.

---

## 5. ⏳ Otwarte

| id | rzecz |
|---|---|
| `OI-126` | ✅ **część tarczowa ZAMKNIĘTA 2026-10-02** — §15: 9 ikon metalowych na 18 tarcz + „Tarcza okuta”, standard `tools/metal_palette.py`. ⏳ Otwarty zostaje kontrast noży (osobny generator) |
| `OI-127` | jakość Q1–Q7 przez **geometrię desek** (mniej równe spasowanie, różne szerokości), nie przez kolor — master jest pod to przygotowany, nic nie jest wdrożone |
| `OI-128` | ✅ **ZAMKNIĘTE 2026-10-01** — reguła autora: broń > 45 cm = 1×2 (`docs/systemy/inventory.md` §11) |

✅ **`OI-125` ZAMKNIĘTE 2026-09-19** — „3 rzędy zamiast 4" było ceną wyższego
rzędu, a nie ceną nieprzycinanych ikon. Po wprowadzeniu gabarytu na półce kupca
widać znowu **cztery rzędy** przy ikonach w skali 1:1 (`node tools/sklep_uklad.mjs`,
sekcje §I i §P).

⚠ **Osiemnaście żelaznych i stalowych tarcz o gabarycie `1×2` ma dziś ikonę
32×32** (kafel `(11,9)`), więc w obu siatkach siada ona na środku dwóch pól
i zostawia wokół siebie pustkę. To jest `OI-126` (brak grafiki), **nie** usterka
układu — pole zajmuje konstrukcja, nie obrazek.

⚠ **Autor wraca do tarcz z własną listą spostrzeżeń** (zapowiedziane
2026-09-19). Ta sesja skończyła się na działającej integracji, nie na
wyczerpaniu tematu.

---

# CZĘŚĆ II — RODZINA 3D SZEŚCIU TARCZ (2026-09-21 … 22)

> **Po co ta część.** Do 2026-09-21 modele 3D tarcz były DWA i oba okrągłe.
> Ta sesja doprowadziła je do sześciu konstrukcji zintegrowanych z grą.
> ⛔ **Nie otwieraj tego ponownie bez konkretnej uwagi z uruchomionej gry** —
> każda liczba niżej jest zmierzona, a nie dobrana.

## 6. Stan wyjściowy — co było naprawdę

⚠⚠ **28 z 30 tarcz renderowało PUSTĄ LEWĄ DŁOŃ.** `Character3D` adresował
model po **id przedmiotu**, a modele nazywały się `buckler` i
`ironbound_shield` (dwa stare wpisy). Gracz kupujący u Sobka
`wood_round_shield` trzymał powietrze.

⚠⚠ **Bramka tego nie widziała i nie mogła.** `sprawdz_komplet_rosteru` cięła
`GameConfig.ts` od `export const ITEMS` i szukała literału `block: {`. Obie
rzeczy fałszywe: `SHIELD_ITEMS` stoi PRZED `ITEMS` i wchodzi przez spread,
a `block` przychodzi z `...statTarczy(...)`. Raport pisał „tarcz w GameConfig:
2, modeli tutaj: 2" i kończył się **zielono**. Wzorcowa asercja-dekoracja.

Wymiary też kłamały: puklerz miał **23,6 cm zamiast 38**, okrągła **47,6
zamiast 66** — dobrane pipetą po starych ikonach 32×32 sprzed mastera.

## 7. Jedno źródło konturu: `tools/shield_shapes.py`

⭐⭐ Pięć funkcji kształtu przeniesionych **dosłownie** z
`build_shield_icons.py` + tabela centymetrów + grubość + wypukłość + punkt
uchwytu + profil noszenia. Generator ikon importuje je zamiast mieć własne.

**Dowód braku regresji:** pełny przebieg `build_shield_icons.py --zapisz`
zostawił cały pixel-art **bajt w bajt**. Powtarzany po każdej kolejnej
zmianie w tej sesji.

⚠ Samokontrola złapała dwie prawdziwe rzeczy, których nikt nie szukał:
* **funkcje kształtu nie mają zamkniętej dziedziny** — poza `v = ±1` dalej
  zwracają „wewnątrz", bo pisano je pod rasteryzator, który próbkuje tylko
  `[-1, 1]²`. Rycerska wychodziła **72 cm zamiast 68**;
* **Douglas–Peucker nie zachowuje symetrii** — środek masy uciekał w bok,
  a bramka CARRY raportowała `dY = −0,88` przy `−0,10` dla kół. Dziś
  upraszczamy prawą połowę i odbijamy lustrzanie, tak jak `maska()` w ikonach.

## 8. Bryła — minimalny standard, który odróżnia tarczę od płyty

⚠⚠ Pierwsza wersja była **płaskim wytłoczeniem konturu** i została zgłoszona
jako „brązowe płyty / debug placeholders". Kontur, wymiar i mocowanie były
poprawne; brakowało BRYŁY. Standard, który to naprawił:

    kontur 2D + realna grubość + kontrolowana wypukłość + faza krawędzi
    + gładkie cieniowanie lica

⭐ Legionowa ma **14 cm** strzałki i to jest POLICZONE: cięciwa 57 cm przy
łuku 86 cm (Dura-Europos) daje promień ~35 cm, a `R − √(R² − (c/2)²)` = 14,5.

⚠⚠ **Zakotwiczenie kopuły na ŚRODKU, nie na obręczy.** Pierwsza wersja
dawała obręcz na zerze i środek na `+h`, a dłoń siedzi po stronie wklęsłej —
więc całe wysklepienie odsuwało tarczę od ręki. Objaw: **duże tarcze
lewitowały**, tym mocniej, im głębsze (legionowa prześwit **1,77 j.** przy
0,31–0,50 sprzed wysklepienia).

⛔ **Nie zamykaj tej luki `chwyt`em** — próbowane i odrzucone pomiarem.
Lokalne Z biegnie w świecie DO PRZODU, więc dociśnięcie tamtędy wypycha
tarczę przed ciało: `dX` legionowej spadło do **−0,09** (przestała być po
zewnętrznej stronie pięści), `dY` do **−1,15** przy limicie 0,35.

## 9. Skala gameplayowa — OSOBNA OŚ od `cm`

⚠⚠ **`cm` jest współdzielone z generatorem ikon.** Wpisanie tam mniejszej
liczby pod czytelność 3D przeskalowałoby ZAMKNIĘTĄ rodzinę pixel-artu —
cicho, bo nic by nie krzyknęło. Stąd osobne `skala_gry`.

Powód: przy 66 cm okrągła kryła w GUARD **47% głowy**. Zmierzone
(`tools/char3d_przymiar_czytelnosc.py` — maski alfy, niezależne od koloru):

| rozmiar | zasłona ciała | zasłona głowy |
|---|---|---|
| 66 cm | 51,0% | **47,3%** |
| 58 cm | 41,6% | 28,2% |
| **56 cm** | **39,4%** | **23,6%** |
| 55 cm | 38,3% | 21,6% |

Decyzja autora: **56 cm**, i ten mnożnik (**0,8485**) idzie na całą szóstkę,
żeby RELACJE rozmiarów między archetypami zostały nietknięte.

⚠⚠ **NIEAKTUALNE od 2026-10-03 (`OI-156`).** Pomiar wyżej był robiony na bryle,
która w świecie była **×1,65 większa**, niż mówiły liczby (dziecko kości
dziedziczy skalę armatury): „66 cm" miało naprawdę ~109 cm, „56 cm" ~92 cm.
Po naprawie jednostek (`char3d_shields`: obiekt kompensuje skalę) `SKALA_GRY`
wynosi **1,0** — wymiar historyczny, ta sama reguła co broń. Ten sam przyrząd
w GUARD: zasłona głowy okrągła **0,0%**, legionowa 22,2%, reszta ≤ 1,7%
(próg zaakceptowany wtedy: 23,6%).

⏳ **Trzy duże mają `rozmiar_roboczy=True`** (`OI-144`) — po skali dalej
89–95 cm, a ich czytelności nikt nie oceniał w grze. Generator drukuje przy
nich `ROBOCZY`.

## 10. CARRY: dwa profile, nie sześć animacji

Po przejściu na prawdziwe wymiary trzy największe **orały grunt** (migdałowa
2,43 j. pod linią stóp). To nie jest błąd modelu, tylko fizyka.

⚠ **Cena profilu LARGE to przechył 52° i jest nieusuwalna samą pozą** —
tarcza jest sztywno wzdłuż przedramienia, więc podniesienie dłoni obraca ją
razem z nim. Zmierzone: z = −6,74 → 25°, −6,40 → 36°, −6,10 → 45°,
**−5,80 → 52°** (wybrane: najmniejszy przechył przy czystym gruncie),
−5,60 → 75°. Oś X nie wpływa na przechył wcale.

## 11. GUARD: pion + kant

⚠⚠ **Pion długiej osi.** `_ustaw_lico_tarczy` ustawia tylko NORMALNĄ lica
i zostawia jeden stopień swobody. Dopóki modele były kołami, ten stopień nie
znaczył nic. Przy sześciu konstrukcjach **rycerska, migdałowa, legionowa
i pawęż stały POZIOMO — 87° od pionu.** Bramka była zielona, bo sprawdzała
wyłącznie kierunek lica.

⭐ Naprawa: `PION_TARCZY_WALKA` + `_ustaw_pion_tarczy`, obrót **wokół
normalnej lica** — nie rusza kierunku lica ani położenia, dla koła jest
wizualnie zerowy, więc JEDNA poza obsługuje sześć konstrukcji. Przechył
**87° → 0°**.

⚠⚠ **Kant +22°, nie 0 i nie +25.** Po spionowaniu garda czytała się jak
pionowa ściana — `|n·przód| = 1,000`, matematycznie idealny billboard.
Autor wybrał na renderze kierunek **na zewnątrz** (+), wbrew historycznemu
(−, krawędź zewnętrzna do przodu). Wpisane +22, bo +25 wpycha okrągłą
**0,97 j.** w tors przy progu 0,90.

⚠ Zależność **nie jest monotoniczna**: +25 → 0,97 (okrągła) ⛔, +22/+20/+18 →
0,86 (pawęż) ✅, **+15 → 0,98 (rycerska) ⛔**, +10 → 0,89. Mniejszy kant NIE
znaczy bezpieczniejszy.

## 12. Integracja: adresowanie po KONSTRUKCJI

`Character3D.zsynchronizujTarcze` czyta `def.construction`, nie `itemId`.
**30 tarcz dzieli 6 brył**, a każda nowa pozycja katalogu działa bez nowego
modelu. Zweryfikowane na żywej grze: **30/30 zapala właściwy węzeł, zero
`console.warn`**.

⚠ Tabela `PROFIL_TARCZY` w `Character3D.ts` jest odpowiednikiem
`shield_shapes[...]["profil"]` i **pilnuje jej bramka** — rozjazd daje EXIT=1.
Widziane na czerwono (scutum LARGE→SMALL).

## 13. Bramki — stan na koniec

`tools/char3d_sprawdz_tarcze.py` **EXIT=0**: 30 tarcz, 6 konstrukcji,
6 modeli, zero rozjazdu profili, zero zamiatania gruntu, przenikanie ciała
w normie, prześwit przedramienia **0,38–0,52 j.** w obu pozach,
`lico_przod = 0,93`, przechył GUARD **0°**.

⚠ Bramka zyskała w tej sesji trzy metryki, których nie miała, i każda
z nich złapała realny błąd: **przechył długiej osi**, **punkt odniesienia**
(zamiast średniej wierzchołków / środka AABB) i **normalną z osi obiektu**
(zamiast z największej ściany — po wysklepieniu największa ściana to pas
kopuły, więc legionowa raportowała `lico_przod = 0,78` przy progu 0,80).

## 14. ⏳ Otwarte po tej sesji

* **`OI-144`** — rozmiar trzech dużych (89–95 cm) jest ROBOCZY, nieoceniony
  w grze. ⚠ Głowa pawęży zostaje zasłonięta w **~41% niezależnie od kąta** —
  to rozmiar, nie orientacja.
* **`OI-145`** — fasetowanie obrysu widoczne przy dużych renderach
  (`TOLERANCJA_J`, 16–22 wierzchołki). W buforze gry niewidoczne
  (0,23 px). Jedna liczba, jeśli kiedyś zacznie przeszkadzać.
* **Krzywizna `forma`** (kula/walec/pion) jest w tabeli, ale **3D jej nie
  używa** — modele są wysklepione jednym wzorem. Świadomie poza zakresem.
* **Metal** (żelazo/stal) — czeka na rampę metalu, `OI-126`.

---

# CZĘŚĆ III — TARCZE METALOWE (2026-10-02)

## 15. Warstwa metalu na masterze

⭐ **Generator `tools/build_metal_shield_icons.py`** bierze rysunek drewnianego
mastera (`build_shield_icons.rysuj`, **nietknięty**) i kładzie na nim metal —
dokładnie oś WARIANTU, którą master zapowiada w §1.1. Co dokłada, wynika
z macierzy materiałów (`docs/tarcze_checkpoint.md` §1.3), nie z gustu:

| konstrukcja | metal | ikony |
|---|---|---|
| puklerz | **lity**: kopuła na całym wnętrzu, uniesiony rant, umbo z ciemnym kołnierzem | żelazo, stal |
| okrągła | obręcz 2 px + umbo | żelazo, stal (+ „Tarcza okuta” = żelazna) |
| rycerska | obręcz 2 px + nity | żelazo, stal |
| migdałowa | obręcz + umbo w GÓRNEJ, najszerszej części (autor: zamiast dwóch pasów — „drabinka”) | żelazo |
| legionowa | obręcz + umbo | żelazo, stal |

- **9 ikon na 18 tarcz** — warianty lekki/ciężki dzielą ikonę jak w drewnie;
  żelazo = stal z zamianą rampy stopień w stopień (`metal_palette.na_zelazo_kolor`).
- ⭐⭐ **Wspólny standard metalu `tools/metal_palette.py`** (bliźniak
  `wood_palette.py`): STEEL i IRON po 5 stopni, liczby przeniesione 1:1
  z `build_armor_icons.py` (przegląd czytelności 2026-09-30) — pancerz importuje
  je dziś stamtąd i wyszedł bajt w bajt ten sam. Niezmienniki: monotoniczna
  jasność, stal chłodna (B > R), żelazo neutralno-ciepłe, niższy kontrast.
- Asercje: **sylwetka = sylwetka drewnianego mastera** (konstrukcja się nie
  zmienia — to ją czyta gabaryt), paleta, stal bez tonów żelaza i odwrotnie,
  udział metalu (lity ≥ 85% wnętrza, okucie 12–60%), obręcz kryje ≥ 95%
  krawędzi, umbo tam, gdzie ma być, i NIE w środku tam, gdzie go nie ma,
  żelazo ≠ stal, wyśrodkowanie.

⚠ **Umbo — trzy usterki, wszystkie wyłącznie na renderze** (lekcje mastera
z rewizji 2 obowiązywały, ale nie wystarczyły):
1. kołnierz jako próg w jednostkach promienia był cieńszy od piksela →
   **przerywany pierścień** (puklerz);
2. kołnierz jako pas odległości `|d − r| ≤ 0,6` → sterczące piksele na
   przekątnych, umbo na drewnie czytało się jak **zębatka**;
3. koło `d ≤ r + 0,3` → **kanciaste, prawie kwadratowe**. Dziś: koło `d ≤ r`
   (rzędy 3-5-7-7-7-5-3), kołnierz = koło minus jego erozja.

W grze: `ASSETS.iconShieldMetal` + pętla w `Assets.ts`, `iconTexture` przy 19
tarczach; gabaryt 1×2 migdałowych i legionowych był już wcześniej (konstrukcja).
