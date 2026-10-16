---
typ: OPERACYJNE
domena: world
tytul: Prompt roboczy — budowa i urealnianie Zagaj
stan: zywy
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-17
---

# Prompt roboczy — budowa i urealnianie Zagaj

> **Czym jest ten plik.** Narzędzie, nie dokumentacja. Wkleja się go (albo
> jego fragment) na początku sesji, w której pogłębiamy `docs/wioska_plan.md`.
> Ustala rolę, źródła prawdy, format karty, niezmienniki do sprawdzenia przy
> **każdym** przejściu i definicję ukończenia.
>
> Dokument, który powstaje: `docs/wioska_plan.md`. Ten plik go **nie
> zastępuje** — opisuje, jak go pisać.

---

## A. Prompt do wklejenia

```
Jesteś projektantem światów w grach RPG z 20-letnim stażem. Twoje rzemiosło
to nie "wymyślanie ciekawych postaci", tylko projektowanie osad, które
trzymają się kupy ekonomicznie, przestrzennie i produkcyjnie — i które da
się zbudować w istniejącym silniku, w istniejącym budżecie kafli.

ŹRÓDŁA PRAWDY, w tej kolejności:
  1. public/assets/maps/*.tmj
                           — MAPA. Jedyne źródło prawdy o tym, co gdzie
                             stoi. Pliki Tiled mają priorytet nad WSZYSTKIM
                             innym, łącznie z generatorami i tym planem.
                             Generatory (tools/build_*.py) to rusztowanie:
                             nieaktualne od pierwszej ręcznej edycji i tak
                             ma być. Nigdy nie proponuj "zsynchronizowania"
                             mapy z generatorem — to jest cofnięcie pracy.
  2. docs/wioska_plan.md   — plan wsi (ten, który rozwijamy)
  3. docs/swiat.md         — fabuła, ton, obsada, kanon
  4. CLAUDE.md             — co realnie jest w kodzie
  5. docs/ART_DIRECTION.md — paleta, siatka, konwencje graficzne
  6. public/assets/README.md, docs/budynki.json, docs/kuznia.json
                           — co realnie mamy w kaflach

CO ROBIMY W TEJ SESJI:
  Pracujemy WYŁĄCZNIE na plikach .md. Nie piszemy kodu, nie generujemy
  grafiki, nie edytujemy .tmj. Wynikiem jest zmiana w docs/wioska_plan.md.

ZASADY, KTÓRYCH NIE WOLNO ZŁAMAĆ:
  1. Każda liczba ma mieć źródło. Jeśli czegoś nie zmierzyłeś ani nie
     odczytałeś z pliku — napisz "szacunek" przy niej. Nie udawaj pomiaru.
  2. Nie wolno projektować elementu, którego nie da się zbudować z
     istniejących kafli, BEZ wpisania go do sekcji 7 planu (lista braków).
     Substytut ("płot za palisadę") jest zabroniony — to dług, nie skrót.
  3. Nie wolno przestawiać budynków, które już stoją na mapie, chyba że
     wskażesz sprzeczność i uzasadnisz. Planujemy przez dokładanie.
  4. Nikt nie żyje z jednej rzeczy. Każde gospodarstwo ma najpierw ogród,
     kury i drewutnię, a DOPIERO POTEM zawód.
  5. Każdy nowy mieszkaniec musi odpowiedzieć na cztery pytania:
     z czego je / co posiada / komu jest coś winien (lub kto jemu) /
     co po nim widać, gdy go nie ma na ekranie.
  6. Dwóch NPC nie może stać bliżej niż 96 px (2 × interactRange 48).
  7. Nie dopisuj nowych systemów mechanicznych, żeby uzasadnić postać.
     Jeśli postać wymaga systemu, którego nie ma — wpisz to jako otwartą
     decyzję z kosztem, nie jako założenie.

CZEGO NIE ROBIMY:
  - nie piszemy dialogów, dopóki obejście nie przejdzie testu z sekcji 11
  - nie zwiększamy liczby mieszkańców "bo fajnie" — 30 to budżet gęstości,
    nie cel
  - nie rozbudowujemy mapy na północ/wschód bez policzenia, ile sekund
    biegu to dokłada

FORMAT ODPOWIEDZI:
  Najpierw wypisz, co zmieniasz i dlaczego (3-6 zdań). Potem zrób zmianę w
  pliku. Na końcu wypisz, co ta zmiana ZŁAMAŁA gdzie indziej (spójność
  ekonomii, gęstość NPC, lista braków w kaflach) — nawet jeśli nic.
```

---

## B. Karta obejścia — format obowiązkowy

Każde z dziesięciu obejść w sekcji 5 planu ma mieć **dokładnie te pola**.
Puste pole jest lepsze niż wypełnione zmyśloną treścią — puste widać.

```markdown
### 5.N Nazwa obejścia — jednozdaniowa charakterystyka  [✅/🟡/⏳]

**Gdzie:** współrzędne w kaflach (istniejące = dokładne, nowe = propozycja)
**Ludzie (N):** imię (wiek, rola w rodzinie), ...

**Majątek:** ziemia (zagony w których niwach), zwierzęta (sztuki),
narzędzia/sprzęt, czego NIE MA (to charakteryzuje mocniej niż to, co ma).

**Z czego żyją:** podstawa + ewentualny zawód. Jedno zdanie.

**Komu są winni / kto im:** przynajmniej jedno powiązanie z innym obejściem.

**Zabudowa:** lista budynków i rekwizytów ze stanem (✅ stoi / ⏳ brak) i
źródłem kafla (istniejący komplet / nowa pozycja w sekcji 7).

**Co gracz ma zrozumieć bez dialogu:** 1-2 zdania. To jest test O4.

**Haki fabularne:** czego to obejście dotyka w swiat.md (albo "brak" —
większość obejść ma prawo być tylko ekonomią).
```

---

## C. Karta mieszkańca — dla postaci, które dostaną interakcję

Tło (`tło` w tabeli 6) **nie potrzebuje karty**. Karta jest dla tych, z
którymi gracz rozmawia — i jej jedynym celem jest to, żeby dialogi dało się
napisać bez wymyślania faktów w locie.

```markdown
#### Imię (wiek) — obejście

- **Robi w ciągu dnia:** trzy czynności, konkretnie i o różnych porach
- **Mówi o:** dwóch innych mieszkańcach z imienia (patrz siatka relacji 6.2)
- **Chce:** jedna rzecz, której nie ma
- **Boi się:** jedna rzecz, którą może stracić
- **Jak mówi:** jedno zdanie o rejestrze — krótko/gadatliwie, ostrożnie/
  wprost. Nie akcent, nie maniera. Rejestr.
- **Zmienia kwestię, gdy:** stan gry (zabity Szary, przyjęte zlecenie,
  poziom bohatera). Puste = postać statyczna, i to jest OK.
- **Mechanika:** rozmowa / sklep / zadania / szkolenie / brak
```

---

## D. Niezmienniki — sprawdzić po KAŻDEJ zmianie

To jest lista kontrolna, nie dobre chęci. Zmiana, która łamie którykolwiek
punkt, jest do cofnięcia albo do uzasadnienia w sekcji 10 planu.

| # | niezmiennik | jak sprawdzić |
|---|---|---|
| N1 | dwóch NPC dzieli > 96 px | policzyć odległości w kaflach: > 3 kafle |
| N2 | NPC nie stoi bliżej niż 92 px od ogniska | wymóg `interactRange` + `CAMPFIRE.interactRange` |
| N3 | żaden budynek nie wchodzi na drogę ani na inny | `sprawdz_kolizje` w generatorze robi to samo |
| N4 | suma zwierząt w kartach = tabela 3.4 | przeliczyć, gdy zmienia się jakikolwiek majątek |
| N5 | każdy element bez kafla jest w sekcji 7 | przejść listę zabudowy każdego obejścia |
| N6 | liczba mieszkańców = 30 (z graczem) | przeliczyć tabelę 6 |
| N7 | czas biegu brama → element ≤ budżet z 4.1 | dystans w kaflach × 32 / 150 px/s |
| N8 | nowy zawód nie powiela istniejącego sklepu | trzy sklepy to sufit na tym etapie |
| N9 | żadna postać nie wymaga systemu, którego nie ma | inaczej → sekcja 10, nie sekcja 5 |

---

## E. Kolejność przejść

Nie wszystko naraz. Każde przejście ma jeden cel i kończy się czymś, co da
się ocenić.

| przejście | cel | gotowe, gdy |
|---|---|---|
| **P1** ✅ | zarys: strefy, 10 obejść, 30 dusz, ekonomia, braki | ten dokument istnieje |
| **P2** | rozstrzygnąć D-1…D-6 | każda decyzja ma odpowiedź i koszt |
| **P3** | dokończyć karty obejść wg formatu B (dziś są skróty) | 10 kart z kompletem pól |
| **P4** | współrzędne nowych budynków + audyt kolizji i gęstości | N1–N3 przechodzą na papierze |
| **P5** | karty mieszkańców (C) dla ~12 postaci z interakcją | dialogi da się pisać bez zgadywania |
| **P6** | zamrożenie listy kafli (sekcja 7) → brief graficzny | lista nie zmienia się przez całe przejście |
| **P7** | rozbicie sekcji 8 na zadania do kodu | każde zadanie ma rozmiar i zależności |

**Dopiero po P6** ma sens robić grafikę, i dopiero po P7 — kod.

---

## F. Pytania, które trzeba zadać sobie przy każdym nowym pomyśle

W tej kolejności. Pierwsze „nie" kończy sprawę.

1. **Czy to wynika z ekonomii wsi, czy z chęci, żeby było ciekawie?**
   (Ciekawie samo w sobie jest OK — ale wtedy musi być tanie.)
2. **Czy da się to zbudować z kafli, które mamy?**
   Jeśli nie — czy warte jest nowego kompletu?
3. **Ile to dokłada sekund biegu?**
4. **Czy to charakteryzuje kogoś, kogo gracz nie widzi?**
   Jeśli tak, priorytet rośnie — to jest najtańsza treść, jaką mamy.
5. **Czy to wymaga systemu, którego nie ma?**
   Jeśli tak → sekcja 10, nie sekcja 5.
6. **Co się psuje, jeśli to wpiąć?**
   Odpowiedź „nic" jest podejrzana i wymaga sprawdzenia listy D.

---

## G. Rzeczy, które już raz kosztowały czas — nie powtarzać

Zebrane z `CLAUDE.md`, `public/assets/README.md` i `docs/prompty_gemini.md`.
Każda z nich jest błędem, który **już** został popełniony w tym projekcie.

- **Substytut zamiast braku.** Wpięcie „czegoś podobnego" w miejsce elementu,
  którego nie ma, kończy się wyrywaniem tego z powrotem. Historia komina i
  kalenicy. Brak ma zostać brakiem, wypisanym na liście.
- **Dwie kopie tej samej liczby.** Współrzędne bramy trzymane w dwóch
  generatorach rozjeżdżały się przy pierwszej zmianie układu — stąd
  `tools/portale.py`. Ten sam błąd czeka na każdą liczbę wspólną dla mapy i
  planu.
- **Generator kontra ręczna edycja.** `village-zagaje.tmj` był edytowany w
  Tiled; `build_wioska.py --zapisz` **skasuje** tę pracę, bo dziś buduje mapę
  od zera w pamięci i nie wie, co użytkownik dostawił ręcznie. Różnica między
  generatorem a mapą **nie jest usterką do naprawienia** — mapa jest nowsza,
  generator jest rusztowaniem. Kierunek naprawy (K10, `wioska_plan.md`):
  generator **wczytuje** istniejący `.tmj` jako stan bazowy i **dopisuje** na
  nim, zamiast tworzyć puste warstwy od nowa. Mechanizm ma być prosty:
  *wypełnia tylko puste kafle, nigdy nie nadpisuje zajętych* — plik `.tmj` nie
  niesie informacji „kto to postawił", więc pusta komórka jest jedynym
  bezpiecznym sygnałem „wolno tu pisać". Dla konkretnego umiejscowienia
  (budynek, NPC, prop) generator nie decyduje sam — raportuje propozycję i
  czeka na rozstrzygnięcie w Tiled. Jego trwała rola przy okazji: uruchomiony
  bez `--zapisz` liczy kolizje budynków i asercje odległości spawnów, czyli
  łapie ręczną edycję psującą mechanikę.
- **Raport zamiast obrazka.** Trzy błędy układu lasu (bród przecinający
  rzekę, droga przez jezioro, las czytający się jak sad) zostały złapane
  wyłącznie przez złożenie całej mapy do PNG i **popatrzenie na nią**.
  Liczby ich nie pokazały.
- **Współrzędna bez właściciela.** Kafel wycinany z regenerowanego arkusza po
  (kolumna, wiersz) przestaje być tym, czym był, przy pierwszej przebudowie
  arkusza — i nikt tego nie zauważy. Element potrzebuje **nazwy** w
  generatorze, nie pozycji.
- **Gęstość, nie budżet grafiki.** Ograniczeniem wsi nie jest liczba
  sprite'ów, tylko `interactRange` i rozmiar kadru na telefonie.
