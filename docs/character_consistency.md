---
typ: OPERACYJNE
domena: quests
tytul: Spójność postaci — kanon a to, co mówią w grze (OI-175)
stan: zywy
otwarte: [OI-175]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-12
---

# Spójność postaci — kanon a to, co mówią w grze

> **Czym jest ten plik.** Wynikiem przeglądu `OI-175` (2026-10-12): opis
> każdej postaci w `swiat.md` §2 i `wioska_plan.md` §5–6 zestawiony z jej
> `greeting(s)`, `topics` i tekstami `QUESTS` w `GameConfig.ts`. Trzy
> koszyki: **A** — poprawione od razu (reguła albo oczywisty błąd), **B** —
> karty do decyzji autora (jedno zdanie), **C** — luki: relacje, których
> kanon chce, a gra jeszcze nie wypowiada.
>
> Reguła rozstrzygania (`wioska_plan.md` §5.3): **wypowiadany dialog bije
> planowanie** — dialogu nie cofniesz z zapisów gracza, planu tak. Wyjątek:
> dialog sprzeczny z innym dialogiem — wtedy wygrywa ten, na którym stoi więcej.

## A. Poprawione 2026-10-12

| # | rozjazd | co zrobione |
|---|---|---|
| A1 | Patryczek (`zofia`): „teść **w łóżku**”, a Sulisław przesiaduje przy studni z Kubą i wychodzi nocą z kijem (`SULISLAW.topics.wzrok`, `KUBA.topics.studnia_starcy`) | „jej teść, co ledwie widzi” — zgodne z „połową wzroku” u Zofii; „jej”, bo samo „teść” w ustach Patryczka czytało się jak jego teść (autor 2026-10-12) |
| A2 | `wioska_plan` §6: Sulisław **68**, choć §5.3 rozstrzygnęło **81** (2026-08-18) | tabela → 81 |
| A3 | `wioska_plan` §5.3/§6: Janek **12**, Zofia w grze: „chłopak **jedenaście**” | plan → 11 (dialog wygrywa) |
| A4 | `wioska_plan` §6/§6.2: Dobek „woły”, „Dobiesław → Dobek — jedyni dwaj z wołami”, choć D-8 zabrało Dobkowi woły, a Hanna mówi to w grze | tabela i siatka relacji → rywalizacja o to, kto szybciej zaorze na pożyczonych, i zazdrość o konia (`HANNA.topics.woly_rywalizacja`) |
| A5 | `swiat.md` §2: zielarce „brakuje tylko punktu na mapie” — chata stoi od 2026-08-10 | zdanie zaktualizowane |
| A6 | `wioska_plan` §6 nie zna mieszkańców dodanych 2026-10-09/10 (Bogusz, Anna, Patryczek, drwale) ani **żony Ciechana** („Matka mówi, że to po mnie” — `CIECHAN.topics.synowie`) | wiersze dopisane pod tabelą jako uzupełnienie; „30 dusz” to konwencja planu, której nie przeliczam |

## B. Karty do decyzji

Każda karta: jedno zdanie decyzji, mój wariant zalecany jako pierwszy.

**B1 — Anna wita bohatera jak obcego.** Greeting: „A, **nowa twarz**”, ale
w tej samej grze trzy lata próbuje pogłaskać **rudego kota bohatera**
(`koty`, `swiat.md` — kot mieszka w jego domu), a bohater po cichu dokarmia
jej psa. **Zalecam:** „A, to ty. Chleb świeży, wczorajszy tańszy, a jak
szukasz chudej czarnej suki, to ja też.” Alternatywa: Anna jest we wsi od
niedawna — wtedy trzeba przesunąć „trzy lata” u kotów.

**B2 — Czyje pole ratujesz i kto pierwszy mówi „myśliwy”.** Kanon
(`swiat.md` „Trzy rodziny”, `wioska_plan` §5.3): pole **Zofii**, i to ona
pierwsza nazywa cię myśliwym. Gra: zlecenie na zające daje **Dobek**
(`zajace_w_zbozu`), scenę nazwania robi **Sołtys** (`mysliwy_z_zagajow`),
a Zofia nie ma ani zadania, ani zmiany kwestii. **Zalecam:** kanon idzie za
grą (Sołtys nazywa, pole Dobka niesie liczby), a Zofia dostaje jedną
kwestię `greetings` po `mysliwy_z_zagajow` — sąsiadka, która mówi to
**drugi** raz, cicho, przy płocie. Alternatywa: przenieść scenę na Zofię
(przepisanie zadania, tego nie polecam).

**B3 — Konie sołtysa.** Ciechan: „ciągniemy **końmi** sołtysa”,
`zrabowany_woz`: „**Konie** oddali”; plan (§5.6): sołtys ma **jednego**
konia i parę wołów, Hanna też mówi „ma tego konia”. **Zalecam:** zwózkę
robią woły sołtysa („ciągniemy wołami sołtysa”), a wóz na targ ciągnął
koń sołtysa — „Konia oddali”. Alternatywa: sołtys ma dwa konie (plan +1).

**B4 — Dobrawa i „wszyscy w naszym wieku poszli”.** Zostali Zbych (19),
Patryczek (~20), Mirek (18). Kanon mówi węziej: jedyna **rówieśniczka**,
która została. **Zalecam** pytanie bohatera: „Dziewczyny w naszym wieku
powychodziły do innych wsi. Ty nie.” Odpowiedź Dobrawy bez zmian.

**B5 — „Trzydzieści lat tu chodzę” mówią dwaj.** Myśliwy (`czemu_zszedl`)
i Ciechan (`las_dawniej`) — prawie te same słowa, a Myśliwy sam liczy
gdzie indziej **dwadzieścia** lat w lesie po wojsku (`a_ty`, Sołtys
`mysliwy_poza`). **Zalecam:** Myśliwy „Całe życie tu chodzę” (zdanie
o „cofaniu się” nietknięte — `swiat.md` §1 reguła 6), Ciechan bez zmian.

**B6 — Dobek wie, że przysłał go Miłosz.** Miłosz: „nie mów mu, że ja cię
posłałem, bo się obrazi”, Dobek od progu: „Miłosz cię przysłał? To dobrze”.
**Zalecam zostawić** — to czyta się jak ironia (młynarz źle zna sąsiada).
Karta istnieje, żeby to było świadome.

**B7 — Targ co tydzień a miasto o cztery dni.** Już opisane
w `region_geography_proposal.md` §2 (Anna, kowal, Bogusz, „nikt nie chodzi
dalej niż most”). Tu tylko odsyłacz: rozstrzyga się razem z kierunkiem
miasta, nie osobno.

### Drobne — bez akcji, odnotowane

- Wszebor 57, Marko 54, a „jeden zaciąg… tyle lat co ty” — trzy lata
  różnicy przy osiemnastu mieszczą się w mowie potocznej.
- „Trzydzieści lat temu” (zaciąg) przy ojcu 54-letnim to ~36 — jw.
- Kowal sprzedaje broń, której „nie kuł” (`bron_skad`), kanon mówi „broń
  robi sporadycznie” — zgodne: sporadyczna robota nie leży na półce.
- Mama: `working` i `turnIn` to ta sama kwestia — świadome czy kopia?

## C. Luki — relacje z kanonu, których gra jeszcze nie wypowiada

`swiat.md` „Relacje”: **każdy wymienia z imienia jednego–dwóch innych**.
Dziś wypowiedziane są m.in.: Agata→Miłosz/Sobek/Dobiesław, Gniewko→pięć
domów, Sobek→Radzim/Zofia, Dobrawa→Marko (odrobek). Brakuje:

| relacja (kanon) | kto mógłby to powiedzieć | uwaga |
|---|---|---|
| **Anna ↔ Bogusz** — kuzynostwo, „nie jestem służącą”, „znajdź sobie żonę” | Anna, Bogusz | najmocniejsza luka: postaci stoją obok siebie, a żadne nie wspomina drugiego |
| **Bogusz — wdowiec** | Bogusz | ani słowa w grze |
| **Anna ↔ rudy kot bohatera** | Anna (`koty`), Mama | kanon 2026-10-11 nie dotarł do kwestii |
| **Marko → Dobiesław** — winien dni za woły, wstyd mu | Ojciec | dziś mówi to tylko Dobrawa |
| **Alina → Agnieszka** — jajka za mąkę | Mama | Agnieszka nie ma sprite'a; wystarczy imię |
| **Zofia → Dorota** — odbierała jej porody | Zofia, Zielarka | kanon „Dorota → wszyscy” też niewypowiedziany |
| **Kuba → Witek/Marta** — mieszka u zięcia | Kuba, Witek | studnia ma mówić „o wszystkim” |
| **Bolko — to on wiózł zrabowany wóz** | Bolko | ofiara napadu nie ma tematu ani przed, ani po |
| Myśliwy po Szarym: „Potem pogadamy poważnie” | Myśliwy | obietnica bez dalszego ciągu — zaczep pod następny szczebel łańcucha |

⚠ Pisanie tych kwestii to robota twórcza — szkice do wspólnej sesji, nie do
wpinania bez autora. Każda nowa kwestia: standard mowy (`swiat.md` §1 „Mowa
mieszkańców”) i `node tools/rozmowy_przymiar.mjs`.

## Jak powtórzyć przegląd

Kwestie NPC: `GameConfig.ts` od `MERCHANT` do `GNIEWKO` (bez komentarzy:
`grep -v '^\s*\(//\|\*\)'`), teksty zadań: `QUESTS`. Kanon: `swiat.md` §2,
`wioska_plan.md` §5–6. Sprawdzać: wiek, relacje, majątek, kto co wie, liczby
powtarzane przez kilka postaci (lata, sztuki, osoby).
