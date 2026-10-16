---
typ: STAN
domena: ui
tytul: Interfejs — powierzchnia, modal, afordancja
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-06, przymiar:doc_check, przymiar:ui_panele_weryfikacja, przymiar:hud_uklad, przymiar:panel_fit, render:2026-10-14]
kotwice:
  - src/ui/PanelBase.ts
  - src/ui/ControlLayout.ts
  - src/ui/Minimap.ts
  - src/ui/MapParchment.ts
  - src/ui/MapFog.ts
  - src/ui/MenuButton.ts
  - src/ui/CoachMark.ts
  - src/ui/FrameLayout.ts
  - src/ui/Rail.ts
  - src/ui/ItemCard.ts
  - src/ui/ListDetail.ts
  - src/ui/ListDetailLayout.ts
  - src/core/theme.ts
  - tools/ui_panele_weryfikacja.mjs
  - tools/hud_uklad.mjs
  - tools/panel_fit.mjs
  - GameConfig.HUD_LAYOUT.minTouch
otwarte: [OI-67, OI-68, OI-69, OI-87, OI-93]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-14
---

# Interfejs — powierzchnia, modal, afordancja

> **Czym jest ten dokument.** Odpowiedzią na pytanie **czym jest powierzchnia
> interfejsu w tej grze**: jak rozmawia z rozgrywką, co znaczy modal, jakie
> czasowniki wolno przypisać dotknięciu i jakie warunki musi spełnić każdy nowy
> widżet.
>
> **Czym NIE jest.** ⛔ **Nie opisuje ani jednego panelu, ekranu, przycisku ani
> komunikatu** — to jest zawartość. Granice w §0.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| powierzchnia, na której gracz **czyta stan i wydaje polecenia** | **`ui`** |
| modalność, pauza, oprawa panelu, afordancje | **`ui`** |
| **reakcja na pojedyncze zdarzenie**, rysowana tam, gdzie zaszło | `presentation` |
| co gracz robi **urządzeniem** i jak intencja dociera do gry | `input` |
| **czy** akcja jest dozwolona *(a więc i czy odmówić)* | domena mechaniki |
| dźwięk kliknięcia i cisza odmowy | `audio` |
| co panel wyświetla: ceny, statystyki, teksty | domena danych |

### 0.1 Test, który rozstrzyga

⭐ **Nie „czy to widać", tylko: czy to TRWA razem ze stanem, czy GAŚNIE razem ze
zdarzeniem.**

| | `ui` | `presentation` |
|---|---|---|
| **czas życia** | tyle, ile trwa stan | tyle, ile trwa zdarzenie |
| **odpowiada na** | pytanie *(ile mam, co noszę, co dalej)* | ogłoszenie *(trafiłeś, oberwałeś, chybił)* |
| **przestrzeń** | interfejsu | zwykle świata |
| **wejście** | zwykle przyjmuje | ⛔ nigdy |

⚠⚠ **Katalog `src/ui/` NIE JEST tą domeną.** Zmierzone: 28 plików, z czego
**jeden rysuje w przestrzeni ŚWIATA i jest budowany przez scenę gry**, a nie
przez nakładkę — należy do `presentation` mimo miejsca w drzewie. ⛔ Podział
plików jest historią, nie granicą.

⚠ **Jeden przypadek graniczny zostaje NIEROZSTRZYGNIĘTY do ekstrakcji
`presentation`**: powierzchnia, która **trwa** razem ze stanem, ale **nie da
się jej odczytać** — czyli jest czystą reakcją ciągłą. Dwa testy dają dla niej
przeciwne odpowiedzi.

### 0.2 Zależności

| kierunek | domena | przez co |
|---|---|---|
| `ui` **bierze** | mechaniki | **25 zdarzeń** stanu, na które przemalowuje |
| `ui` **daje** | rozgrywce | **10 zdarzeń** żądania *(użyj, zatwierdź, wczytaj)* |
| `ui` **spełnia wymóg** | `input` | minimalne pole dotykowe (§5) |
| `ui` **oddaje** | `audio` | moment potwierdzenia dźwiękiem |
| `ui` **czyta** | `presentation` | motyw, skalę i style tekstu |

---

## 1. Kontrakt: interfejs nie sięga do gry

⚠⚠ **Zero wyjątków — i to jest zmierzone, nie deklarowane.** W całym katalogu
interfejsu **nie ma ani jednego** wyszukania sceny gry. Widżet rozmawia
z rozgrywką wyłącznie przez **wspólny stan wejścia**, **emiter akcji**
i **szynę zdarzeń**.

```
gra  ──25 zdarzeń stanu──▶  interfejs      „przemaluj się"
gra  ◀──10 zdarzeń żądań──  interfejs      „gracz chce"
```

⚠ **Ruch w drugą stronę też ma swoją regułę: jeden most, jedno pytanie.**
Istniejące mosty *(trafienie w świat, sprzętowy Back)* są rejestrowane **przez
stronę gry**, odpowiadają na jedno pytanie i nie niosą stanu *(`input`)*.

⚠⚠ **Widżet NIE decyduje, czy akcja jest dozwolona.** Pyta mechanikę i pokazuje
odpowiedź. ⛔ Druga bramka w interfejsie znaczy dwa źródła prawdy o tej samej
regule.

---

## 2. Skalowana jest KAMERA, nie współrzędna

⚠⚠ **Interfejs ma własną rozdzielczość wirtualną**: kamera nakładki dostaje
przybliżenie, a widżety liczą we własnych jednostkach. ⛔ Mnożnik doklejany do
każdej współrzędnej oznaczałby przejrzenie tysięcy linii z gwarancją, że jedna
zostanie pominięta.

⚠ **Kotwiczenie do krawędzi liczy się w szerokości WIRTUALNEJ, nigdy
fizycznej** — to jedyna poprawka rozsiana po plikach tej domeny.

⚠ **Nienaruszalny pas przy prawej krawędzi** jest wymogiem urządzenia, nie
estetyki: pod nim rysuje się systemowy pasek nawigacji. ⛔ Systemowe marginesy
bezpieczne go **nie złapią** — w trybie pełnoekranowym raportują zero.

⚠ **Rozdzielczość tekstu kompensuje przybliżenie kamery**, a **kierunek tego
mnożnika był realnym błędem**: odwrotność wygląda równie prawdopodobnie
i daje tekst próbkowany w dół. ⚙ Sama arytmetyka należy do `presentation`;
tutaj obowiązuje reguła **„nowy widżet idzie przez wspólny styl"**, nawet gdy
nie potrzebuje ani kroju, ani koloru.

---

## 3. Panel: wspólna oprawa, własne otwarcie

⚠ **Wspólna jest OPRAWA** — tło, ramka, przycisk zamknięcia, karta przedmiotu
z rzędem akcji, pauza. ⚙ **Reguły otwarcia zostają przy panelu**, bo się
różnią *(zasięg rozmówcy, zakładki, warunek posiadania)*.

⚠⚠ **Panel jest interaktywny na CAŁEJ powierzchni — i to jest łata na wadę, nie
polerka.** Bez tego dotknięcie **pustego miejsca** panelu nie trafiało w nic,
więc drążek ruchu uznawał je za wolne i stawiał tam bazę **przez otwarty
modal** *(`input` §4)*.

⚠⚠ **Modalność nie ma właściciela.** Każdy panel trzyma **własną** flagę
otwarcia *(osiem niezależnych flag)*, a pauza świata to **dwa niezależne
wywołania** wstrzymania i wznowienia — ⛔ **bez zliczania i bez pytania, czy
ktoś inny też jest otwarty**. Zmierzony skutek i decyzja: `OI-52`, `OI-68`.

⭐ **Rozmowa jest RAMĄ z zakładkami** (2026-10-13): rozmowa = zakładka 0,
usługi w STAŁEJ kolejności; usługa zwęża kolumnę do szyny (gęsta treść —
do samych ikon, kafle na tych samych wysokościach) i nie ma własnego
tytułu ani ✕, Wstecz cofa o jeden poziom, stan zakładki trwa do końca rozmowy.

⭐ **Wybór z listy = LISTA + KARTA** (etap F): jeden widżet, decyzja
w prawym dolnym rogu karty; zadanie bierze się i oddaje też w rozmowie (D4).

⚠ **Widok podrzędny NIE pauzuje i nie wznawia sam** — pauza należy do rozmowy
jako całości, inaczej przejście ze sklepu do trenera na moment odpauzowałoby
świat.

⚠⚠ **Panel ma pełne krycie, a pod nim przyciemnienie na CAŁY ekran**
(interaktywne) — HUD nie prześwituje i nie stoi „dookoła" modala (2026-10-13).

⚠ **Panel ma OBSZAR GOSPODARZA**: obszar na lewo od szyny — rozmowy albo
własnej (panel gracza, 2026-10-13). Nie mieszczący się panel jest **zmniejszany skalą** do
obszaru; ⚙ przymiar liczy to na sześciu ramkach, telefon ma skalę 1 (`OI-68`).

---

## 4. Czasowniki i afordancje

⚠⚠ **Tapnięcie ZAZNACZA, przycisk WYKONUJE.** ⛔ Zero ukrytych gestów, zero
podwójnych tapnięć *(pełny rachunek kosztu — `input` §8)*.

⚠ **Rozdział „zaznacz" od „narysuj kartę" jest nośny, nie kosmetyczny.**
Zaznaczenie **przełącza** (drugie tapnięcie odznacza), rysowanie tylko rysuje —
dzięki temu licznik ilości przemalowuje kartę **bez zmiany zaznaczenia**.

⚠⚠ **Karta ma w panelu JEDEN adres — stałą kolumnę**, nie dymek przy
kursorze (od etapu F dymka nie ma w ogóle). ⛔ Dymek bił się z kolumną
o uwagę: kolumna stała pusta dokładnie wtedy, gdy było co w niej pokazać.

⚠⚠ **Odmowa jest WIDOCZNA i NAZWANA.** Przycisk niedostępny zostaje na ekranie
**wyszarzony, z powodem**; brak przycisku nie niesie informacji, a odmowa bez
powodu czyta się na dotyku jak zepsute UI.

⚙ **Ta sama zasada daje w innych kanałach reguły ODWROTNE — i to jest
zamierzone**: dźwięk przy odmowie **milczy**, bo kliknięcie znaczy „zadziałało"
*(`audio`)*; pytanie w rozmowie, którego nie wolno zadać, jest **ukryte**, bo
wypisanie go zdradza łańcuch *(`quests`)*. ⭐ **Oko dostaje powód, ucho ciszę,
a wiedza nie dostaje zapowiedzi.**

⚠ **Odmowa ma dziś DWA kształty** — trwały wyszarzony przycisk i ulotny
komunikat — ⛔ a reguła, kiedy który, nie istnieje (`OI-69`).

⚠ **Podświetlenie celu zapala się przy PODNIESIENIU, nie przy najechaniu** —
palec zasłania ikonę, więc „najpierw wyceluj, potem się dowiedz" to zła zamiana.

---

## 5. Cel dotykowy: reguła i jej faktyczny zasięg

⚠⚠ **Pole dotykowe nie może być mniejsze od progu ani od własnej grafiki**
*(wymóg `input`, N-150)*. Cel większy od rysunku jest **techniką, nie
oszustwem**: pozwala zejść z wagą wizualną bez zejścia poniżej progu.

⛔ **Reguła jest egzekwowana asercją dla klastra bojowego i kafli szyny —
i dla niczego więcej.** Przyciski paneli biorą wymiary od wołającego, wiersze
akcji pod kartą mają stałą wysokość, **wszystkie leżą poniżej progu**, a nic
tego nie sprawdza. ⚙ Kod nazywa to **długiem, nie wzorcem** (`OI-67`).

---

## 6. Geometria rogu bojowego

⚠⚠ **Widżet NIE liczy własnej pozycji — pyta o slot i dostaje punkt.**
Geometria ma jeden dom; wcześniejsza „połowiczna naprawa" umieściła ją
w widżecie, który sam był jej klientem.

⚠ **Kontrolki leżą na łuku, nie w kolumnie, i to jest wynik pomiaru** —
łuk jest jedynym kształtem, w którym wszystkie przyciski są **równo oddalone**
od kciuka.

⚠⚠ **Kąt jest przypisany do SLOTU, nie do kolejności.** Nauka trzeciej
umiejętności nie ma prawa przestawić dwóch pierwszych pod kciukiem; pusty slot
się nie rysuje.

⚠ **O pierścieniu decyduje PILNOŚĆ × CZĘSTOTLIWOŚĆ, nie kategoria** —
przenosząc coś między pierścieniami, przenosisz **sąd o częstotliwości**.

⚠ **Po każdej zmianie kąta, promienia albo rozmiaru — uruchom przymiar
układu.** Sprawdza nakładki, wyjście poza ekran, pas nawigacji, próg dotykowy
i zasięg kciuka na prawdziwym kodzie. ⛔ **Dwie liczby, które mają być równe,
nie nadają się na próg.**

### 6.1 Prawy górny róg: minimapa = mapa, przycisk menu = panel

⚠⚠ **Przycisk menu (plecak, na lewo od minimapy) jest na telefonie JEDYNYM
wejściem do ekwipunku i zapisu** — rysowany zawsze, bez tekstury. Minimapa
otwiera MAPĘ (od 2026-10-12). Przyszłe ikony rosną w lewo od przycisku menu.
Minimapa jest sklejona z obrazów obszarów (`world` §4.1), w oprawie kartki
pergaminu W ŚRODKU swojego kwadratu (10-13). Reguły:
`src/ui/CLAUDE.md`. ⭐ 10-14: minimapa z Kartografią II, MAPA (Okolica |
Świat) z I; rysunek z mgły (`MapFog`, `world` §5.1).

### 6.2 Pierwszy raz

⚠ **Podpowiedź uczy, gdy kontrolka POJAWIA SIĘ po raz pierwszy** — raz na
urządzenie, jedna naraz, nie na modalu, ⛔ bez połykania tapnięcia.

---

## 7. Koszt klatki

⚠⚠ **W pętli klatkowej stosuj kolor, obrys i przezroczystość TYLKO przy zmianie
stanu, od którego zależą.** Przemalowanie napisu wysyła teksturę na kartę
graficzną **zawsze**, także gdy kolor jest ten sam.

⚠⚠ **Klucz deduplikacji musi opisywać WSZYSTKO, co pętla rysuje — inaczej
zamraża stan końcowy.** Zmierzony przypadek: klucz opisywał sam kąt łuku,
a pętla rysowała też liczbę sekund i wygaszenie ikony, więc „zostały 3 ms"
i „gotowe" dzieliły klucz — przycisk zostawał **wygaszony, będąc już
klikalnym**. ⚠ Wada rosła z długością odliczania: od jednego użycia na pięć do
**wszystkich**.

⚠ **Zysk siedzi w stanie BEZCZYNNYM, nie w kwantyzacji kroku.**

⚠ **Kwantyzując cokolwiek pod „i tak nie widać", policz to w pikselach
URZĄDZENIA, nie w jednostkach logicznych.**

---

## 8. Pierwszy przemalunek i przewijanie

⚠⚠ **Każda strona panelu maluje się przy BUDOWIE, nie dopiero przy pierwszym
zdarzeniu.** ⚙ To jedyna reguła tej domeny z **własnym przymiarem** — powstała
z wady, w której panel zbudowany, gdy torba **już była założona**, pokazywał ją
pustą w nieskończoność.

⚠⚠ **Maska przycina RYSOWANIE, nie WEJŚCIE.** Element wyprowadzony przewijaniem
poza okno jest niewidoczny, ale **dalej trafialny** — przewijana lista
klikalnych pozycji musi im wyłączać wejście poza oknem.

⚠ **Rząd slotów liczony ze stałych PRZERASTA panel po cichu** — wymiaruj
z długości listy, zawijaj i **ostrzegaj**, gdy wynik wyjdzie poza panel.

⚠ **Po każdej zmianie układu przemieć wszystkie dzieci strony względem granic
panelu** — podpis wyjeżdżający za krawędź nie pokazuje się w żadnej liczbie.

---

## 9. Niezmienniki

- **N-213** — ⛔ **interfejs nie sięga do sceny gry**; wyłącznie stan
  i zdarzenia (§1).
- **N-214** — **widżet nie rozstrzyga, czy akcja jest dozwolona** (§1).
- **N-215** — **skalowana jest kamera, nie współrzędna**; kotwice liczą się
  w szerokości wirtualnej (§2).
- **N-216** — **panel jest interaktywny na całej powierzchni** (§3).
- **N-217** — **widok podrzędny nie pauzuje sam**; pauza należy do modala jako
  całości (§3).
- **N-218** — **tapnięcie zaznacza, przycisk wykonuje**; zaznaczenie
  i rysowanie to dwie różne czynności (§4).
- **N-219** — **karta ma jeden adres**: stałą kolumnę, nie dymek (§4).
- **N-220** — **odmowa jest widoczna i nazwana** (§4).
- **N-221** — **pole dotykowe ≥ próg i ≥ grafika** — ⚠ egzekwowane tylko
  w klastrze bojowym (§5).
- **N-222** — **widżet pyta o slot, nie liczy pozycji**; kąt należy do slotu,
  nie do kolejności (§6).
- **N-223** — **maluj przy zmianie stanu**, a klucz deduplikacji musi opisywać
  wszystko, co pętla rysuje (§7).
- **N-224** — **każda strona maluje się przy budowie** (§8).
- **N-225** — **maska przycina rysowanie, nie wejście** (§8).

---

## 10. Checklista

**Nowy widżet:** ⛔ nie sięgaj do sceny gry (N-213) · idź przez wspólny styl
(§2) · ⚠ daj mu pole ≥ progu — **nikt tego nie sprawdzi za ciebie** poza
klastrem bojowym (N-221, OI-67) · ⚠ maluj przy budowie, nie przy pierwszym
zdarzeniu (N-224).

**Nowy panel:** ⚙ oprawa z klasy wspólnej, reguła otwarcia własna (§3) ·
⚠ sprawdź, czy mieści się w oknie — ostrzeżenie jest **tylko deweloperskie**
(OI-68) · ⚠ jeśli pauzuje, pamiętaj, że **nikt nie zlicza pauz** (OI-52).

**Nowa akcja na karcie:** ⚠ tapnięcie **zaznacza**, przycisk **wykonuje**
(N-218) · ⚠ odmowa zostaje **widoczna i nazwana** (N-220) · ⛔ nie dokładaj
gestu, żeby uniknąć przycisku.

**Zmiana w pętli klatkowej:** ⚠ policz, co pętla NAPRAWDĘ rysuje, i włóż to
całe do klucza (N-223).

**Bramki:** `npx tsc --noEmit` · `npm run build` ·
`node tools/hud_uklad.mjs` *(geometria klastra)* ·
`node tools/ui_panele_weryfikacja.mjs` *(pierwszy przemalunek)* ·
`node tools/doc_check.mjs`.

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| interfejs nie sięga do sceny gry | ✅ | ✅ | ⭐ `kod:2026-09-06` — **zero wyjątków, policzone** |
| kontrakt zdarzeń w obie strony | ✅ | ✅ *(opisany po raz pierwszy jako liczba)* | `kod:2026-09-06` |
| skala jako kamera; kotwice wirtualne | ✅ | ✅ | `kod:2026-09-06` |
| wspólna oprawa panelu | ✅ | ✅ | `kod:2026-09-06` |
| panel interaktywny na całej powierzchni | ✅ | ✅ | `reka:2026-08-27` |
| **właściciel modalności i pauzy** | ⚙ ognisko klawiatury jest (`KeyFocus`); pauza — nie | ✅ | ❌ — OI-68 |
| mieszczenie się panelu w obszarze (ekran / rama) | ✅ skala do obszaru | ✅ | ✅ `przymiar:panel_fit` §P |
| szyna: kafel ≥ próg, wyjście na dole pod przerwą | ✅ | ✅ | ✅ `przymiar:panel_fit` §S |
| rama rozmowy: zakładki, stała kolejność usług, Wstecz o poziom | ✅ | ✅ | `render:2026-10-13` |
| lista + karta; zadania w rozmowie (D4) | ✅ | ✅ | ✅ `panel_fit` §F · `render:2026-10-13` |
| tapnięcie zaznacza; rozdział zaznacz/rysuj | ✅ | ✅ | `reka:2026-08-27` |
| karta ma jeden adres | ✅ | ✅ | `kod:2026-09-06` |
| odmowa widoczna i nazwana | ✅ | ✅ | ⚠ **dwa kształty, brak reguły wyboru** — OI-69 |
| **próg dotykowy** | ⚙ **klaster + szyna z asercją, reszta poniżej** | ✅ *(zasięg opisany po raz pierwszy)* | ⚠ `przymiar:hud_uklad` **tylko dla klastra** — OI-67 |
| geometria rogu ma jeden dom | ✅ | ✅ | ✅ `przymiar:hud_uklad` |
| kąt przypisany do slotu | ✅ | ✅ | ✅ `przymiar:hud_uklad` |
| przycisk menu jako wejście, zawsze rysowany; minimapa → mapa | ✅ | ✅ | ✅ `przymiar:hud_uklad` §6, §6b |
| mapa z mgłą, Kartografia | ✅ | ✅ | ✅ `mapa_przymiar` · render |
| podpowiedź „pierwszego razu" | ✅ | ✅ | `render:2026-10-12` |
| malowanie tylko przy zmianie stanu | ✅ | ✅ | ❌ **złapane z rozgrywki, brak przymiaru** |
| pierwszy przemalunek stron | ✅ | ✅ | ✅ `przymiar:ui_panele_weryfikacja` |
| maska przycina rysowanie, nie wejście | ✅ | ✅ | `kod:2026-09-06` |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-67** | ⚠⚠ **Próg dotykowy pilnowany w klastrze, szynie i listach + kartach (`panel_fit` §F); reszta przycisków paneli bierze wysokość od wołającego** (karta plecaka, sklep — `docs/ui_mobile_research.md` §9). ⛔ Decyzja AUTORA: przyjąć wyjątek jawnie czy zostawić dług. |
| **OI-68** | ✅ przymiar mieszczenia się paneli i szyny (`tools/panel_fit.mjs`, 2026-10-13). Otwarte: **modalność bez właściciela** (osiem flag otwarcia, niezliczane wywołania pauzy — powiązane z `OI-52`). |
| **OI-93** | ⚠ **Pasek zdolności miesza DWA typy przycisków, wyglądające identycznie**: część otwiera darmową sesję celowania, część odpala się na naciśnięciu z pełnym kosztem — naciśnięcie „żeby zobaczyć podgląd" spala odnowienie. Problem NOWEGO gracza (raz na zdolność). ⛔ Nie przestawiać zdolności natychmiastowych na zatwierdzenie puszczeniem — unik jest przyciskiem paniki. |
| **OI-69** | ⚠ **Odmowa ma dwa kształty i żadnej reguły wyboru**: 5 miejsc z wyszarzonym przyciskiem z powodem („możliwe, ale nie teraz"), 21 z ulotnym komunikatem („właśnie się nie udało"). ⛔ Potrzebne jedno zdanie autora. |
| **OI-87** | rozmowa: ✅ arkusz (10-12), rama usług (10-13), ✅ zadania w arkuszu (D4, 10-13); otwarte — reprezentacja NPC (twarz, D5): `docs/ui_mobile_research.md` §5 |

---

## Czego ten dokument nie rozstrzyga

- **Żadnego panelu, ekranu, przycisku ani komunikatu z osobna** — to jest
  content.
- **Czy dzisiejszy układ jest dobry** — promienie, kąty i hierarchia pilności
  mają swoje pomiary; ⛔ nie projektuję ergonomii od nowa.
- **Reakcji na pojedyncze zdarzenie** — błysku, wstrząsu, śladu, napisu nad
  celem: `presentation`.
- **Co gracz robi urządzeniem** i jak intencja dociera do gry — `input`.
- **Czy akcja jest dozwolona** — to rozstrzyga domena mechaniki.
- **Dźwięku potwierdzenia i ciszy odmowy** — `audio`.
- **Arytmetyki skali, rozdzielczości tekstu i filtrowania** —
  `presentation`.
- ⛔ **Klasyfikacji jednej powierzchni granicznej** *(trwałej, ale bez treści do
  odczytania)* — należy do ekstrakcji `presentation`.

---

## Gdzie szukać POWODÓW

| pytanie | dokument | moc |
|---|---|---|
| komplet reguł katalogu: skala, dotyk, panele, koszt klatki, minimapa | `src/ui/CLAUDE.md` | ACTIVE |
| dlaczego geometria rogu ma jeden dom i skąd łuk | `GameConfig.HUD_LAYOUT` *(przy kodzie)* | ACTIVE |
| dlaczego zniknęło podwójne tapnięcie; jeden model karty | `docs/sklep_migracja_wzorca.md`, `docs/decyzje/2026-09-19-ekran-handlu-przebudowa.md` | SUPERSEDED |
| sklep: kupiec \| gracz \| karta, kafle po obu stronach, Cofnij + Odkup | `docs/decyzje/2026-10-13-sklep-kupiec-gracz-karta.md` | ACTIVE |
| maszyna gestu w siatce plecaka i przewijanie | `docs/inventory_scroll_ux.md` | ACTIVE |
| wejście, arbitraż dotyku i próg jako wymóg | `docs/systemy/input.md` §3–§5 | ACTIVE |
| cisza jako świadoma odwrotność odmowy widocznej | `docs/systemy/audio.md` §7 | ACTIVE |
| ukrywanie pytania jako trzecia odmiana tej samej zasady | `docs/systemy/quests.md` §6 | ACTIVE |
| rozjazdy, pomiary i rejestr tej ekstrakcji | `docs/proces/ekstrakcja_ui.md` | — |
