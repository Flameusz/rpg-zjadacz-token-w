---
typ: DECYZJA
domena: weapons
tytul: Zasięg ma próg binarny wobec krążącego celu — pas wokół progu jest zakazany
stan: zamkniety
moc: ACTIVE
data: 2026-09-07
kotwice:
  - src/scenes/GameScene.ts
  - tools/macierz_walki.mjs
  - GameConfig.WOLF.pack.circleRadius
otwarte: [OI-40]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-07
---

# Próg zasięgu wobec krążącego celu

## Skąd bierze się próg

`GameScene.targetInReach` **nie porównuje dystansu z zasięgiem wprost** — od
dystansu odejmuje margines liczony z ROZMIARU CELU:

```
allowance = max(displayWidth, displayHeight) × 0,35
trafienie ⟺ dystans − allowance ≤ zasięg
```

Dla wilka (klatka 28 px × skala 1,8) `allowance` = **17,64 px**, a wataha
orbituje na `circleRadius` **96**. Próg dosięgnięcia orbity to więc
**zasięg ≥ 78,36**, nie 96.

## Rozstrzygnięcie

> ⚠⚠ **Przejście przez ten próg jest BINARNE, nie stopniowe.** Zmierzone:
> zasięg 78 daje **22,2%** cyklu orbity trafialne, zasięg 79 — **97,1%**.
> Jedna jednostka zasięgu zmienia rolę broni, a nie jej moc.
>
> ⛔ **Żadna broń nie powinna stać w pasie ±2 px wokół progu.** Orbita nie jest
> okręgiem (`orbitLeadDeg` 26, `closeInFactor` 1,5), więc w tym pasie o trafieniu
> decyduje szum — gracz raz trafia, raz nie, **bez powodu widocznego na ekranie**.

To trzeci raz, kiedy ten projekt sparzył się na „dwóch liczbach, które mają być
równe": `SHIELD.blockArcDeg`, kąty pierścieni HUD, i tutaj.

## Co jest dziś po drugiej stronie progu

Stan zmierzony `node tools/macierz_walki.mjs` (przymiar, bez zapisu):
**2 z 16 wariantów** sięgają orbity — broń drzewcowa z zapasem **+19,64 px**
i dwuręczna obuchowa z zapasem **+1,64 px**. Najbliżej z drugiej strony stoi
jednoręczna obuchowa: **−0,36 px**.

⚠ **Liczby czytaj z generatora, nigdy z dokumentu.** Ten plik podaje je jako
stan w dniu decyzji, nie jako źródło.

## Co to zastępuje

⛔ Teza „**każda broń poza włócznią jest poza orbitą**, a najdłuższa jednoręczna
mija próg o ułamek piksela" — prawdziwa dla rosteru z 2026-08-16 i cytowana
potem w trzech dokumentach — **jest SUPERSEDED, nie złamana**. Chronologia:

| kiedy | co |
|---|---|
| 2026-08-16 | pomiar; przy 7 broniach teza prawdziwa |
| 2026-08-26 | wchodzą dwie bronie dwuręczne, autor **świadomie utrzymuje tezę**: „pasmo 72–78, **pod progiem**; włócznia zachowuje wyłączność" |
| **2026-09-05** | zasięg broni dwuręcznej obuchowej **74 → 80** — bo „większy zasięg" jest jedną z cech tożsamości 2H, a przy 74 ta broń sięgała tyle co kij startowy i **krócej niż jej jednoręczny odpowiednik**. Wyłączność drzewcowej **wymieniona świadomie** na cechę 2H |

⚠ **Tożsamość broni drzewcowej nie została skasowana, tylko rozcieńczona** —
jej zapas jest o rząd wielkości większy. To inna sytuacja i wymaga innej
odpowiedzi niż „przywrócić wyłączność".

## Co zostaje otwarte (`OI-40`, zawężone)

Pytanie **nie brzmi** „czy drzewcowa ma odzyskać wyłączność" — to zostało
rozstrzygnięte 2026-09-05. Otwarte są dwie liczby:

1. **Czy `allowance` — ułamek rozmiaru CELU — ma w ogóle wchodzić do porównania
   z zasięgiem BRONI.** Dziś duży przeciwnik jest łatwiejszy do trafienia każdą
   bronią, a jego rozmiar przesuwa próg pod każdą z nich.
2. **Czy broń wolno zostawić w pasie ±2 px** — dotyczy dziś dwóch sztuk
   (dwuręczna obuchowa +1,64, jednoręczna obuchowa −0,36).

⛔ **Nie „nudguj" żadnej z tych liczb bez rozstrzygnięcia obu.** Przesunięcie
o jedną jednostkę nie jest korektą zaokrąglenia — zmienia, czy bronią da się
stać w miejscu i bić krążącego wilka.
