---
typ: DECYZJA
domena: [world]
tytul: Zagaje — jedna droga z placem zamiast owalnicy, zagroda z ogrodem i polem, rozwój krokowy
stan: zamkniety
moc: ACTIVE
data: 2026-10-10
kotwice:
  - src/world/WorldComposer.ts
  - tools/houses3d.py
otwarte: [OI-164]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-10
---

# Zagaje: droga z placem, zagroda z ogrodem i polem, wieś rośnie krokami

## Co rozstrzyga

**UKŁAD** z `docs/decyzje/2026-10-09-owalnica-zagajow.md` przestaje
obowiązywać: owalna droga wokół nawsia i sadzawka na nawsiu. Z tamtej decyzji
**zostają w mocy**: płot zamiast palisady (szczeble osady), karczma przy
północnym wjeździe z chmielnikiem, kuźnia przy południowym wjeździe,
młynówka ze stawem młyńskim, błonia przed lasem, rozmiar 128×128.

## Powód (autor, 2026-10-10, render z gry)

„Co to za staw w środku wioski, dlaczego droga przez wioskę wygląda jak
rondo?" Z kamery gry pierścień drogi wokół nawsia czyta się jak RONDO,
nawsie to pusty trawnik, a sadzawka z kafli wody 3×3 wygląda jak kwadratowy
basen. Historyczna poprawność owalnicy nie broni się w skali gry.

## Zasady (słowa autora → reguła)

1. **Jedna droga przez wieś, bez rozwidlenia.** W centrum **plac**
   rozszerzający się po OBU stronach drogi.
2. **Bez stawu w centrum.** ⚠ Sadzawka miała w planie FUNKCJĘ
   (`wioska_plan.md` §5.4: Witek moczy w niej len; §5.3: gęsi Zofii) — ta
   funkcja przenosi się na SKRAJ wsi (moczydło lnu i tak trzymano z dala od
   chałup przez smród), nie znika.
3. **Mniej budynków — ale NIE po równo.** „Jest dużo budynków obok siebie,
   wątpię, że tyle ich potrzeba": dziś 29 budynków i 50 odcinków płotu na
   7 zagród. ⛔⛔ **Zabudowa każdej zagrody wynika z jej KARTY OBEJŚCIA**
   (`docs/wioska_plan.md` §5: ludzie, majątek, inwentarz §3.4, zabudowa),
   nie z jednego szablonu. Reguła planu: **„wielkość gospodarstwa czyta się
   z budynku"** — sołtys (jedyna para wołów, koń, 2 krowy, sad, największa
   chałupa) ≠ Dobek (największa stodoła we wsi, widoczna z drogi) ≠ Marko
   (najmniejszy z rolniczych: chałupa, drewutnia, chlewik, kurnik
   przystawiony) ≠ Zofia (wdowa: obora, gęsi) ≠ Witek (chlew — najwięcej
   świń, len) ≠ Sobek (warsztat i skład drewna).
4. **Za podwórkiem ogród, za ogrodem pole** — „u mnie na wsi za podwórkiem
   zazwyczaj każdy ma ogród i pole". **Z podwórka da się wyjść na swoje
   pole** (przejście w płocie od tyłu). Jedno pole na północy to za mało.
   Wielkość pola też z karty: Dobek najwięcej, Marko „ledwo starczy",
   Witek pod len; ⚠ **kowal nie ma ziemi ornej** (§5.5 — dlatego musi kupować
   zboże), zielarka ma ogród ziołowy, nie pole.
5. **Podwórka są PRZESTRONNE.** ⚠⚠ Pierwsze brzmienie tego punktu
   („podwórka małe i ściśnięte — prawda o wsi") było BŁĘDNYM odczytaniem:
   autor opisywał tym zdaniem USTERKĘ obecnej mapy, nie regułę. Wzór autora
   (zdjęcie lotnicze wsi, w której się wychował — ulicówka): chałupy blisko
   drogi, **szerokie podwórza** obstawione budynkami gospodarczymi, drzewa
   i sady przy domach, **działki różnej szerokości**, a za każdą **długi,
   wąski pas pola prostopadły do drogi**, ciągnący się aż po horyzont
   (pasy w różnych uprawach — mozaika kolorów).
6. **Każdy ma skład drewna** — sągi pod ścianą albo w szopie / stodole.
7. **Młynarz i kowal POZA płotami.** Kuźnia jako pierwsza dostaje przy
   napadzie bandytów albo czymś gorszym. ⚠ **Ale kuźnia ma WŁASNE ogrodzenie**
   (autor: „narzędzia i ruda metalu są drogie — nie może być łatwym łupem"):
   kuźnia, chałupa kowala i skład (węgiel, ruda, żelazo, gotowe narzędzia)
   w jednej zagrodzie za mocnym płotem z wrotami od traktu. Poza płotem WSI,
   nie poza własnym — kowal mieszka przy niej i pilnuje.
8. **Drwale i wyręb są w LESIE**; drwale mogą mieć chałupy we wsi jak inni.
   **Drwali jest TRZECH** (autor: „ja bym wolał trzech") — ojciec z synami:
   Ciechan, Bolko, Zbych (wybór autora, K5).
8a. **Młyn w LEWYM GÓRNYM ROGU** (autor, ta sama sesja): na brzegu młynówki,
   na wysokości wozowni naprzeciw karczmy; droga do niego to ODNOGA od traktu
   pod wozownią (y 36–37), nie pętla w kształcie U na południe wsi. Powody
   autora: dalej od lasu (bezpieczniej), bliżej traktu — mąka idzie na sprzedaż.
   Unieważnia położenie młyna z `wioska_plan.md` D-2 (południe wsi).
   ⚙ **Ranga wsi (kierunek autora, z zastrzeżeniem „chyba"):** młyn, kuźnia
   i karczma naraz robią z Zagajów jedną z WIĘKSZYCH wsi w okolicy — młyny nie
   stały w każdej osadzie z kilku domów.
9. ⭐⭐ **Wieś rośnie KROKAMI.** „Łatwiej będzie potem nanosić poprawki niż
   przesuwać większość wioski, by poszerzyć np. podwórko." Konsekwencja:
   układ zostawia MIEJSCE na dokładanie; każdy krok jest mały, obejrzany
   w grze i nie wymaga przesuwania tego, co już stoi.

## Kolejność kroków (propozycja; każdy krok = osobna, zamknięta zmiana)

| krok | zakres | czego NIE rusza |
|---|---|---|
| **K1** | droga prosto przez wieś, plac po obu stronach drogi w centrum (studnia, lipa, ławka, koryto na placu), sadzawka i owal drogi usunięte | zagrody, karczma, kuźnia, młyn |
| **K2** | zabudowa każdej zagrody wg JEJ karty obejścia (§5): bogaci więcej i większe, biedni mniej i mniejsze; skład drewna przy każdej (pod ścianą albo w szopie / stodole); przejście z podwórka na tył | położenie zagród względem drogi |
| **K3** | za zagrodami ogrody i pasy pól o szerokości z karty (bez pola u kowala); moczydło lnu i miejsce dla gęsi na skraju; pole na północy przestaje być jedynym | zabudowa |
| **K4** | młynarz i kowal poza płotami | reszta wsi |
| **K5** | chałupy drwali we wsi + wyręb w lesie (plan lasu: wyręb na zachodzie) | — |

⚠ **Mapa wsi to żywy `.tmj`** (od 2026-10-09 edytowany w Tiled, bez
generatora): każdy krok robi **jednorazowy skrypt** ruszający tylko swój
obszar, idempotentny, niezostający w `tools/` (`tools/CLAUDE.md`). Razem
z budynkami przesuwają się pozycje NPC i zwierząt (warstwa `objects`)
i maski zakazu roślin. **Odbiór kroku: render z gry, nie raport.**

⚠ **Poprawione tego samego dnia, przed rozpoczęciem K1 — dwa razy.**
(1) Punkt 5 zamieniony z „małe podwórka" na „przestronne" (autor: „jakie
małe podwórka, kiedy ci tak mówiłem?" + zdjęcie wsi). (2) Autor: „każdego
chcesz traktować tak samo, a całe plany odnośnie wioski oraz majętności idą
się…"): pierwsza wersja K2 zrównywała zagrody do „chałupa + jeden budynek".

## Konsekwencje

- `docs/wioska_plan.md` §4 opisywał już przed tą decyzją układ sprzed
  owalnicy; obsada (§6) i ekonomia (§3) dalej obowiązują.
- Zapisy z pozycją gracza we wsi mogą lądować w innym miejscu po każdym
  kroku; postęp nie przepada.
