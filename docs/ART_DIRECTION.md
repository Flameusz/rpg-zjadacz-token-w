---
typ: KANON
domena: assets
tytul: Styl graficzny — biblia wizualna
stan: zywy
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-30
---

# Styl graficzny — biblia wizualna projektu

> **Czym jest ten plik.** Zasady, według których powstaje KAŻDY asset: natura,
> wioska, palisady, postacie, budynki, przedmioty. `docs/swiat.md` opisuje
> świat, `CLAUDE.md` opisuje kod — ten opisuje, jak to ma wyglądać.
>
> Każda liczba tutaj jest **zmierzona na istniejących plikach**, nie wzięta
> z sufitu. Metoda pomiaru jest podana przy każdej, żeby dało się ją powtórzyć
> po zmianie assetów.

---

## 1. Stan zastany — diagnoza

### 1.1 Nie ma dziś palety projektu

Zmierzone: liczba wspólnych kolorów między arkuszami.

| | Nature | Buildings | Character | items |
|---|---|---|---|---|
| **Nature** | — | 9 | **0** | 5 |
| **Buildings** | 9 | — | 1 | 6 |
| **Character** | **0** | 1 | — | 7 |

**Nature i Character nie mają ani jednego wspólnego koloru.** To nie jest jedna
gra graficznie — to pięć paczek postawionych obok siebie. Dlatego palisada
narysowana „pod Nature" i tak nie będzie pasować do postaci.

### 1.2 Nature.png — co konkretnie jest słabe

640×400, **39 kolorów**, mediana **4 kolorów na kafel**.

| rodzina | stopni | % powierzchni | rozpiętość odcienia |
|---|---|---|---|
| brązy / drewno | 19 | **71,6%** | 11–51° |
| zieleń | **6** | 5,2% | **82–86°** |
| zieleń ciemna | 4 | 4,1% | 141–142° |
| woda | **2** | 17,9% | 185–185° |
| neutralne | 8 | — | — |

Trzy wnioski:

1. **Arkusz „natury" jest w 72% drewnem.** Zieleń dostała 6 stopni, woda dwa.
   To arkusz pomostów i skrzyń, do którego dolepiono trawę.
2. **Woda jest płaska.** Dwa kolory to nie jest woda, to niebieski prostokąt.
3. **Rampy nie przesuwają odcienia** — zieleń mieści się w **4 stopniach**
   odcienia. Cieniowanie polega wyłącznie na przyciemnianiu jednego koloru.

### 1.3 Konwencje, które faktycznie obowiązują

Zmierzone na pikselach brzegowych (sąsiadujących z przezroczystością):

| arkusz | brzegów | z tego ciemnych | wniosek |
|---|---|---|---|
| Nature | 8 180 | 44,1% | **brak konturu** |
| Buildings | 9 953 | 41,3% | **brak konturu** |
| Character | 3 182 | 42,8% | **brak konturu** |

Ok. 42% to wynik przypadkowy — gdyby był kontur, byłoby powyżej 80%.
**Żaden istniejący asset nie używa obrysu.** To jest konwencja do utrzymania
albo do świadomej zmiany, ale nie do przypadkowego złamania.

Kierunek światła (przesunięcie jasnych pikseli względem środka masy):

| źródło | x | y | odczyt |
|---|---|---|---|
| Nature (74 kafle) | −0,0 | −0,3 | **brak kierunku** — płasko oświetlone |
| Character | −2,0 | −8,3 | **góra, lekko z lewej** |
| Gemini (propy) | −2,4 | +0,8 | **lewa strona** |

Nature nie ma kierunku światła w ogóle. Character ma. To kolejny powód, dla
którego elementy nie siedzą razem.

---

## 2. Materiały z Gemini — co da się z nich wziąć

Trzy arkusze, zmierzone.

| plik | rozmiar | siatka | alfa | ocena |
|---|---|---|---|---|
| `1b3doy…` | 2048×2048 | **16×16 kafli po 128 px — dokładnie 4:1** | brak | ✅ podstawa |
| `8th56t…` | 2654×1600 | ~50–51 px, bez równego przelicznika | brak | ⚠️ do ratowania |
| `k92hdp…` | 2654×1600 | brak (okresy 8–12 px = szum) | brak | ❌ odrzucić |

**Żaden nie ma kanału alfa** (`alfa min 255, max 255`). Szachownica i magenta są
**namalowane w pikselach** — to obrazek przezroczystości, nie przezroczystość.

### 2.1 Czego się od nich uczymy

To nie jest pixel art (167–281 tys. kolorów), ale **struktura barwna jest
lepsza od naszej** i to jest mierzalne:

| | zieleń: rozpiętość odcienia | stopni |
|---|---|---|
| Nature.png | **4°** (82–86) | 6 |
| Gemini `1b3doy` | **47°** (70–117) | 18 |

**To jest cała różnica jakościowa w jednej liczbie.** Nie chodzi o rozdzielczość
ani o liczbę kolorów — chodzi o to, że ich cień idzie w inny odcień niż światło.

### 2.2 Czego NIE robimy

- **Nie zmniejszamy propów do 32×32.** Drzewo narysowane na 128 px ma detal
  wart 3–4 kafli; wciśnięte w jeden kafel zamienia się w papkę. Idzie
  **pocięte na siatkę jako prop wielokaflowy** (2×3, 3×3) — dokładnie tak, jak
  już działa drzewo i most w Nature.png (`extractTileGrid`).
- **Nie dopasowujemy na siłę do starej palety.** Zmierzone: wymuszenie 39
  kolorów Nature na kępkach trawy wrzuciło w nie **granatowe placki**, bo
  w tej palecie nie ma odpowiednich zieleni i „najbliższy kolor" trafiał
  w neutralne.

---

## 3. Paleta projektu

**56 kolorów: 10 ramp po 5 stopni + 6 neutralnych.** Plik: `docs/paleta.json`.

| rampa | 1 (cień) | 2 | 3 (baza) | 4 | 5 (światło) |
|---|---|---|---|---|---|
| trawa | `#195736` | `#297535` | `#4c923d` | `#81b056` | `#bbce72` |
| listowie | `#164334` | `#245a38` | `#347138` | `#568847` | `#809f5d` |
| ziemia | `#4d241c` | `#673e2c` | `#825c3f` | `#9c7d55` | `#b6a16e` |
| piasek | `#694936` | `#8d6d4f` | `#b1956b` | `#d5c08b` | `#f9ecad` |
| kamień | `#494a57` | `#646775` | `#7f8692` | `#9ca6b0` | `#b9c7ce` |
| drewno | `#49231d` | `#623b2d` | `#7b573f` | `#947654` | `#ac976c` |
| kora | `#351a1a` | `#472b27` | `#5a3f35` | `#6c5545` | `#7e6d56` |
| woda | `#243562` | `#385884` | `#5082a5` | `#6cafc7` | `#8cdfe8` |
| akcent ciepły | `#650a19` | `#871919` | `#aa432e` | `#cc7448` | `#efac69` |
| akcent chłodny | `#362954` | `#533c71` | `#75528e` | `#996baa` | `#be86c7` |
| neutralne | `#12101a` | `#2b2a36` | `#4a4956` | `#75737f` | `#a7a5ae` `#e6e4e0` |

### 3.1 Jak jest zbudowana

Każda rampa to 5 stopni z **przesunięciem odcienia**:

- **cień idzie w chłód** (trawa: 148°, czyli w zieleń morską)
- **światło idzie w ciepło** (trawa: 72°, czyli w żółć)
- **nasycenie jest najwyższe w cieniu** (×1,15) i najniższe w świetle (×0,72) —
  to zapobiega „neonowym" rozjaśnieniom i błotnistym cieniom

Generator siedzi w skrypcie, więc rampę da się przeliczyć, a nie tylko
przepisać ręcznie.

**Pułapka do zapamiętania:** odcień interpolujemy **krótszym łukiem koła**.
Rampa 350° → 30° policzona wprost jedzie przez zieleń i zamiast czerwieni
wychodzi tęcza. Pierwsza wersja akcentu ciepłego miała dokładnie ten błąd.

### 3.2 Zweryfikowane na materiale

Te same cztery kafle, stara paleta kontra nowa:

| kafel | stara paleta (39) | nowa paleta (56) |
|---|---|---|
| trawa | 5 kolorów, czysto | 3 kolory, czysto |
| kępki trawy | **granatowe placki** | 7 kolorów, poprawnie |
| przejście trawa/ziemia | 10 kolorów, dobrze | 15 kolorów, dobrze |
| grzyby | tło szaroniebieskie | tło prawie białe |

### 3.3 Reguła wyciągnięta z wady

W teście **rampy akcentowe podkradały piksele** — na przejściu trawa/ziemia
i na kapeluszu grzyba pojawiły się pomarańczowe punkty, bo „najbliższy kolor"
trafiał w akcent ciepły.

→ **Akcenty są opcjonalne per asset, nie wchodzą do domyślnego zestawu
kwantyzacji.** Włącza się je świadomie, dla assetu, który ma czerwony kapelusz
albo złoty detal.

---

## 4. Zasady graficzne

### 4.1 Siatka i wymiary

- **Kafel: 32×32 px.** Bez wyjątków.
- **Skok w arkuszu: 33 px** (32 + 1 px przerwy). Przerwa jest po to, żeby
  filtrowanie nie zasysało sąsiada.
- **Prop większy niż kafel = wielokaflowy**, ułożony na tej samej siatce.
  Nie skalujemy, nie wpychamy na siłę.
- **Arkusz nie rośnie bez potrzeby.** `forrest.tmj` ma wklejone
  `columns: 19`, `tilecount: 228`, `imagewidth: 640`. Dopóki wypełniamy
  **147 wolnych miejsc wewnątrz 640×400**, mapa nic nie zauważy i stare
  identyfikatory kafli zostają ważne. Powiększenie arkusza = odświeżenie
  tilesetu w Tiled.

### 4.2 Kolor

- **Tylko paleta z `docs/paleta.json`.** Nowy kolor = uzasadniona zmiana
  palety, a nie wyjątek w jednym pliku.
- **Teren: 3–8 kolorów na kafel.** Prop: do ~16. Detaliczny prop: do ~24.
  Wszystko powyżej znaczy, że to nie jest pixel art.
- **Cieniowanie przez rampę, nie przez przyciemnianie.** Wybieramy sąsiedni
  stopień rampy, nie mnożymy koloru przez 0,8. To jest ta różnica 4° kontra 47°.
- **Akcenty świadomie**, patrz 3.3.

### 4.3 Światło

- **Źródło: góra, lekko z lewej.** Zgodne z Character.png (−2,0 / −8,3) i
  z materiałem Gemini (−2,4). Nature.png jest oświetlone płasko i to jest
  do naprawienia przy przebudowie, nie do naśladowania.
- **Prop dotykający ziemi ma cień kontaktowy** — ciemniejszy owal pod spodem,
  z rampy neutralnej, przezroczystość ok. 40%. Bez niego obiekt „wisi".

### 4.4 Kontur

- **Teren: bez konturu.** Zgodnie z tym, co już obowiązuje we wszystkich trzech
  arkuszach.
- **Prop: bez czarnego obrysu**, ale krawędź ciemniejsza o jeden stopień
  własnej rampy. Czarna obwódka wprowadziłaby styl, którego nigdzie indziej
  nie ma.

### 4.5 Przezroczystość

- **Prawdziwy kanał alfa. Zawsze.**
- **Nigdy magenta, nigdy namalowana szachownica.** Oba trzeba potem zdejmować,
  a antyaliasing zostawia po nich obwódkę, której nie da się w pełni usunąć.
- Piksel jest albo w pełni kryjący, albo w pełni przezroczysty. Bez półcieni
  na krawędzi — przy `pixelArt: true` i tak nie ma po nich śladu poza brudem.

### 4.6 Czytelność na telefonie

Kamera ma `zoom: 2`, więc na ekranie 375 px widać **~6 kafli szerokości**.

- Sylwetka musi być czytelna **z sześciu kafli**, nie z bliska.
- Detal cieńszy niż 2 px zniknie — nie ma sensu go rysować.
- Kontrast jasności między obiektem a podłożem ważniejszy niż kontrast barwy.

---

## 5. Kolejność prac

1. **Nature.png** — przebudowa terenu z arkusza `1b3doy` do wolnych miejsc,
   z zachowaniem identyfikatorów kafli używanych przez mapę (**37 sztuk**).
2. **Woda** — z 2 stopni do pełnej rampy 5-stopniowej.
3. **Propy leśne** — drzewa jako wielokaflowe, kamienie, krzaki, grzyby.
4. **Palisada i budynki wioski** — już w nowej palecie od pierwszego piksela.
5. **Postacie** — najtrudniejsze i najpóźniej; Character.png ma dziś zerowe
   pokrycie z Nature i przemalowanie go dotknie każdej animacji.

## 6. Czego nie da się zrobić automatem

Konwersja liczy kolory, nie rysuje kształtów. **Nowego obiektu, którego nie ma
w źródłach, nie da się wygenerować** — można składać warianty (przebarwienia,
odbicia, komplety krawędzi do autokafelkowania) z tego, co istnieje. Wszystko
poza tym wymaga rysowania ręcznego albo nowej partii materiału źródłowego.

---

# 7. Nature jako system modularny — inwentaryzacja

Metoda: każdy narysowany kafel sklasyfikowany po **materiale dominującym na
czterech krawędziach i w środku** (pas 5 px), plus zestawienie z tym, co mapa
faktycznie maluje na każdej warstwie.

## 7.1 Co realnie jest

| warstwa mapy | kafli | **różnych kafli** | czym malowane |
|---|---|---|---|
| `ground` | 2000 | **1** | jeden kafel trawy, 2000 razy |
| `water` | 174 | 7 | prostokątna ramka stawu + wypełnienie |
| `roads` | 176 | 13 | paski, głównie 3 kafle (20, 21, 22) |
| `nature` | 295 | 7 | dwa drzewa wielokaflowe |
| `bridge` | 20 | 9 | most |

**Cała ziemia świata to jeden kafel powtórzony dwa tysiące razy.**

Kafle pełne (100% krycia, jednolity materiał): **trawa 2, ziemia 7, woda 1.**

Kafle przejściowe (różne materiały na krawędziach): **17**, z czego **14 to
ramka woda/ziemia** (tylko poziomo-pionowa, bez skosów) i 3 to korony drzew.

## 7.2 Czego brakuje — zestawienie

| system | wymagane | **jest** | brakuje |
|---|---|---|---|
| trawa — wypełnienia z wariantami | 4 | 2 | 2 |
| **trawa ↔ ziemia** (Wang 16) | 16 | **0** | **16** |
| **trawa ↔ woda** (Wang 16) | 16 | **0** | **16** |
| ziemia ↔ woda (Wang 16) | 16 | 14 (tylko proste) | 2 + skosy |
| trawa ↔ piasek (Wang 16) | 16 | **0** | **16** |
| las ↔ trawa (Wang 16) | 16 | **0** | **16** |
| **ścieżki**: proste, zakręty, T, X, zakończenia | 16 | **0** | **16** |
| wypełnienia pozostałych materiałów | 16 | 8 | 8 |

**Nie istnieje ani jedno przejście trawa↔woda i ani jeden kafel skrzyżowania
ścieżki.** Rzeka na mapie ma prostokątne brzegi, bo innych nie ma. Droga nie ma
zakrętu, bo nie ma z czego go złożyć.

## 7.3 Ile kafli potrzeba

| wariant | liczba |
|---|---|
| minimum (Wang 16 na przejście) | **116** |
| jakościowy (blob 47 na przejście) | 271 |

Wolnych miejsc w obecnym arkuszu: **147**. Minimum się mieści, ale bez zapasu
na propy — a blob 47 nie mieści się wcale.

## 7.4 Jak powiększyć arkusz nie niszcząc mapy

**Identyfikator kafla = wiersz × liczba_kolumn + kolumna.**

Dopóki **liczba kolumn zostaje 19**, dołożenie wierszy **nie rusza żadnego
istniejącego identyfikatora**:

| arkusz | wierszy | kafli | id 0–227 |
|---|---|---|---|
| 640×400 (obecny) | 12 | 228 | — |
| **640×800** | 24 | 456 | **bez zmian** |
| 640×1000 | 30 | 570 | bez zmian |

**Poszerzenie w BOK przenumerowałoby wszystko i zniszczyło mapę.** To jest
jedyna nieodwracalna pomyłka możliwa na tym etapie.

Po zmianie wysokości trzeba raz odświeżyć tileset w Tiled (zaktualizuje
`imageheight` i `tilecount`), ale każda już postawiona mapa działa dalej.

## 7.5 Układ nowej przestrzeni (wiersze 12–23)

Jeden system na wiersz — Wang-16 mieści się w 19 kolumnach z zapasem:

| wiersz | zawartość | id |
|---|---|---|
| 12 | wypełnienia z wariantami (trawa, ziemia, piasek, kamień, woda) | 228–246 |
| 13 | trawa ↔ ziemia, Wang 16 | 247–262 |
| 14 | trawa ↔ woda, Wang 16 | 266–281 |
| 15 | ziemia ↔ woda, Wang 16 | 285–300 |
| 16 | ścieżki, Wang 16 (krawędziowy) | 304–319 |
| 17 | trawa ↔ piasek, Wang 16 | 323–338 |
| 18 | listowie ↔ trawa, Wang 16 | 342–357 |
| 19–23 | zapas na propy | 361–455 |
