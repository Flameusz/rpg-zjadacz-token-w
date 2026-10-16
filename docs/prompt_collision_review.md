---
typ: OPERACYJNE
domena: proces
tytul: Prompt konsultacyjny — kolizja terenu vs ciała
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-28
---

# Prompt konsultacyjny — kolizja terenu vs ciała stworzeń (§10)

**Co to jest.** Prompt do wklejenia zewnętrznemu modelowi (GPT), żeby ocenił
propozycję z `las_faza1b_final.md` §10. ⚠ **Nie jest źródłem faktów o grze** —
fakty są w §10 i w kodzie; tu jest tylko sposób zapytania.

**Jak użyć.** Wklej wszystko poniżej linii, a jako załącznik dołóż paczkę
`docs/` (płasko) albo minimum: `las_faza1b_final.md` (§10 to sedno),
`las_projekt_docelowy.md`, `odlozone.md`, `bestiariusz_audyt.md`.

**Liczby mobilne w prompcie są zmierzone, nie szacowane** — `CAMERA` w
`GameConfig.ts` (9 kafli na krótszej osi → zoom **1 na telefonie**, 2 na
desktopie) i `PLAYER.bodyWidth = 18`. Jeśli któraś się zmieni, popraw ją tutaj,
bo cała mobilna część argumentu na nich stoi.

---

Wciel się w **senior game architecta z 20-letnim doświadczeniem w grach RPG** —
takiego, który prowadził zarówno duże produkcje PC, jak i wydania mobilne, i wie,
czym różni się projektowanie pod mysz/klawiaturę od projektowania pod kciuk.
**Robimy grę mobilną** i potrzebuję Twojej oceny jednej decyzji projektowej.

## Co robimy

Top-down 2D action RPG w pixel-arcie, feel walki bliżej WoW/LoL niż roguelike.
Phaser 3 + TypeScript, fizyka **Arcade** (ciała to prostokąty AABB, separacja
osiami), kafel **32×32 px**, mapy z Tiled. Gra działa w przeglądarce i ma
zbudowany projekt Android (Capacitor, pełny ekran, orientacja pozioma).
Sterowanie na telefonie: **wirtualna gałka** (lewy kciuk) + przyciski akcji.
Grywalny prototyp, nie demo — jest siedmiu wrogów, dziesięć slotów ekwipunku,
osiem umiejętności, trzy mapy, 19 NPC-ów.

Horyzont wydania: **pół roku do roku**.

## Sytuacja

Do zeszłego tygodnia **żadna mapa nie miała ani jednego kafla z kolizją** —
przez cały czas rozwoju gry przechodziło się przez drzewa i ściany. Właśnie
dodaliśmy prawdziwą kolizję terenu (pnie drzew, ściany budynku) i to odsłoniło
konflikt, którego wcześniej nie dało się zobaczyć, bo wszystkie rozmiary ciał
fizycznych były strojone niezależnie w świecie bez ścian.

Pełny opis z pomiarami jest w załączonym `las_faza1b_final.md`, **sekcja §10** —
to jest sedno, zacznij tam. Skrót:

1. **52 przejścia w lesie mają prześwit dokładnie 18 px.** Ciało gracza ma
   **dokładnie 18 px** szerokości. Dzik ma 22, elitarny wilk 20, niedźwiedź 30 —
   żaden nie przechodzi. Rozkład jest zero-jedynkowy: albo 18 px, albo 32–33 px,
   nic pośrodku.
2. **Pościg wroga to `moveToObject`, czyli linia prosta bez omijania.** W 11–20 %
   pozycji gracza w zasięgu agro wróg nie dociera **nigdy** (symulacja 20 s):
   wchodzi w pień i oscyluje. To zero-jedynkowe, nie „wolniej".
3. **Zwierzęta ambientowe (sarna, lis) nigdy nie dostały ustawionego ciała** —
   mają domyślne, czyli całą klatkę arkusza. Sarna: **79×57 px**, szersza niż
   dwa i pół kafla. Ma dostęp do 40 % mapy, w 163 rozłącznych wyspach. Jej
   animacja ucieczki przenosi ją o 76 px przy ciele szerokim na 79.

Objaw w rozgrywce, zgłoszony przez autora: dzika trywialnie łatwo zablokować
między drzewami i bić bezkarnie, a takich miejsc jest w lesie bardzo dużo.

## Propozycja do oceny (§10.6)

Jedna reguła — **„najwęższe przejście w lesie ≥ 24 px"** — i trzy konsekwencje:

1. zwężenie boxów kolizji pni z 14 na 8 px (przejście 18 → 24 px), kosztem tego,
   że gracz wchodzi ~3 px w namalowany pień;
2. nadanie zwierzętom ambientowym prawdziwych, małych ciał (sarna ~26×14);
3. „ślizg z histerezą" zamiast parcia w korę — wróg przy zablokowaniu bierze
   kierunek prostopadły i **trzyma go** przez zadany dystans. Zmierzone na
   prototypie: zaklinowanie **11–20 % → 1–7 %**, ~30 linii kodu w jednym miejscu.

Świadomie **nie** proponujemy prawdziwego szukania drogi (A*/flow-field).
Niedźwiedź (30 px) miałby zostać jedynym, którego las zatrzymuje — jako decyzja
projektowa, nie skutek uboczny.

## Kalibracja — na co NIE poświęcaj odpowiedzi

1. **Nie argumentuj terminami ani „czy warto to robić przed premierą".** Ta
   dyskusja jest w projekcie rozstrzygnięta.
2. **Nie proponuj „po prostu to przetestujcie".** Autor gra w tę wersję na
   bieżąco; zgłoszenie pochodzi z rozgrywki, nie z teorii. Interesuje mnie, jak
   to zaprojektować, nie czy sprawdzić.
3. **Nie proponuj dodania stworzeń, umiejętności ani systemów progresji.**
   Bilans tej fazy jest zamknięty.
4. **Nie wracaj do decyzji zamkniętych** wypisanych w §1 dokumentu (rozmiar
   mapy, kierunek rozbudowy, pozycje watahy wilków).
5. **Nie przepisuj mi §10 własnymi słowami.** Zakładam, że je przeczytałeś.

## Na czym mi zależy

Odpowiedz na te pytania, w tej kolejności, **z uzasadnieniem opartym na tym, co
widziałeś w innych produkcjach**, nie na ogólnikach:

1. **Czy 24 px to właściwy standard prześwitu?** Wynika z „najszerszy wróg poza
   niedźwiedziem ma 22 px + 2 px zapasu". Alternatywy: 32 px (nikt się nigdy nie
   klinuje, ale las traci ciasnotę) albo 20 px (mieści elitarnego wilka, nie
   mieści dzika). Jaki zapas nad najszerszym ciałem stosuje się w praktyce?
2. **Zwężać kolizję drzew czy zwężać ciała zwierząt?** Ciało fizyczne jest
   u nas osobne od hurtboxa walki, więc zwężenie dzika z 22 na 18 **nie
   zmieniłoby ani zasięgu, ani trafialności** — ale byłaby to łatka na jedno
   zwierzę zamiast reguły. Z drugiej strony zachowałaby zgodność kolizji
   z namalowanym pikselem.
3. **Czy niedźwiedź ma się nie mieścić?** Bronię tezy, że zwierzę, które nie
   wciśnie się za graczem w gąszcz, jest treścią, a nie usterką — i że gracz
   uczy się tego jako mechaniki. Czy to się broni, czy będzie odebrane jako
   zepsute AI?
4. **Ślizg czy od razu prawdziwe szukanie drogi?** Ślizg zdejmuje ¾–⅞ problemu
   za ~30 linii. Reszta (2–7 %) skupia się w najgęstszej części lasu, którą
   dopiero zbudujemy. Czy zostawienie tego jest do przyjęcia, czy to jest dług,
   który zawsze wraca drożej?
5. **Kolejność.** Twierdzę, że to musi wejść **przed** przemalowaniem lasu, bo
   inaczej stawiamy 40 nowych kolumn terenu, którego walki nie da się ocenić.
   Zgadzasz się?

## ⚠ Pytanie mobilne — najważniejsze, potraktuj je osobno

Kamera świata stoi na telefonie na **zoomie 1** (dobrane tak, żeby na krótszej
osi ekranu mieściło się 9 kafli). Czyli te **18 px przejścia to 18 px na
ekranie telefonu** — około 3 mm. Ciało gracza ma dokładnie 18 px, więc żeby
przecisnąć się między dwoma drzewami, trzeba trafić z **zerową tolerancją
boczną** — i zrobić to **wirtualną gałką pod kciukiem**, która ma z natury
gorszą rozdzielczość kątową niż klawiatura czy pad.

Pytanie: **czy przejście o zerowej tolerancji jest w ogóle akceptowalne
w sterowaniu dotykowym?** Bo jeżeli nie, to problem przestaje być „dzik się
klinuje", a staje się „gracz też się klinuje, tylko tego jeszcze nie zgłosił",
i wtedy 24 px może być za mało, a właściwą odpowiedzią może być zupełnie inny
minimalny prześwit — albo tolerancja wejścia w przejście (corner-cutting,
zwężanie ciała gracza w ruchu, przyciąganie do środka bramy). Jakie rozwiązania
widziałeś w mobilnych grach akcji z widokiem z góry?

## Format odpowiedzi

- **Zacznij od rekomendacji w 3–5 zdaniach.** Jedna droga, nie przegląd opcji.
- Potem odpowiedzi na pytania 1–5 i na pytanie mobilne, każda krótko.
- Na końcu: **czego byś jeszcze zmierzył, zanim to wdrożymy**, i co konkretnie
  by Cię przekonało, że rekomendacja jest zła.
- Jeśli uważasz, że diagnoza w §10 jest błędna albo niepełna — **powiedz to
  wprost i uzasadnij**. Poprzednia analiza w tym projekcie odrzuciła zgłoszenie
  autora, bo zmierzyła spójność przestrzeni zamiast prześwitu; wolę drugą taką
  korektę usłyszeć od Ciebie niż odkryć ją w rozgrywce.
