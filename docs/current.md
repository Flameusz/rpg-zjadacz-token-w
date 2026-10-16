---
typ: OPERACYJNE
domena: proces
tytul: Punkt wejścia — gdzie jest projekt
stan: zywy
otwarte: [OI-164, OI-171, OI-172, OI-143, OI-20, OI-100, OI-166]
zastepuje: [docs/checkpoint_2026-09-21.md]
zastapione-przez: null
aktualizacja: 2026-10-11
---

# Punkt wejścia — gdzie jest projekt

> ⭐ **ZACZYNASZ TU** (także na innym komputerze). Jedyny plik, który to mówi
> (`doc_check` §W). Aktualizowany **w miejscu**; poprzednie wersje są w gicie
> (`git log -p docs/current.md`) — nie robi się z niego kopii z datą.
> Budżet 10 KB (§B). Stan repo sprawdź, nie czytaj:
> `git log --oneline -3 && git status --short`.
>
> ⛔ Router, nie opis: mechanika → `docs/systemy/`, lista spraw →
> `docs/zadania.md`, historia → `docs/dziennik.md`.

## 1. Gdzie jest projekt (2026-10-11)

Rozgrywka 2D (Phaser), **obraz 3D domyślnie od 2026-10-06** — gracz,
mieszkańcy, zwierzęta, bandyci, drzewa, rekwizyty i domy są modelami
(`docs/systemy/render3d.md`). Systemy wojownika (pancerz, broń, tarcze,
biegłość, stamina) są w kodzie i **czekają na playtest, nie na kod**.
Od ~09-20 praca przesunęła się na **3D i zawartość świata**: wieś Zagaje,
otwarty świat wieś + las (`swiat.world`), pierwsi humanoidalni wrogowie.

✅ Autor (2026-10-15): po migracji na izometrię wraca `docs/roadmap.md`
i łuk/kusza (ETAP 3) wchodzi **przed** dalszymi wątkami świata.

## 2. Aktywne wątki

| wątek | stan | wejście | następny krok |
|---|---|---|---|
| ⭐ **Rozbudowa przed krzywą XP** (autor 10-12; krzywa nie przed ~10-26) | agent prowadzi sam w dzień, bez Blendera; autor odbiera wieczorem | `docs/content_expansion.md` (§3 „do odbioru”) | ⚠ **po izometrii pierwszeństwo ma łuk/kusza** (autor 10-15); stąd tylko drobne poprawki, np. głos dawcy przy oddaniu zadania |
| **Mapa i Kartografia** (D15) | ✅ 10-14: mgła, widok Okolica / Świat, Kartografia I (Myśliwy, mapa) i II (Sołtys, minimapa) | `docs/systemy/world.md` §5.1, `docs/pomysly.md` „Kartografia” | odbiór na telefonie; poziom III i wyjścia „dalej” na mapie świata po decyzji o geografii |
| **Interfejs mobilny** (HUD, panel, rozmowa, sklep, usługi) | ✅ etapy B–F w kodzie 10-13; F = **lista + karta** (zadania, szkolenie, Mistrzostwo, Postać, dziennik), **zadania brane i oddawane w rozmowie (D4)**, role tekstu w całym panelu gracza | `docs/ui_mobile_research.md` §9 (F + odstępstwa), `docs/decyzje/2026-10-13-sklep-kupiec-gracz-karta.md` | odbiór E+F na telefonie; potem D7, edytor HUD (D9) po playteście |
| **Zagaje — układ wsi** | K1–K6j na mapie; ulicówka, zagroda = pas prostopadły do drogi | `docs/zagaje_projekt_ukladu.md` („Stan kroków"), kanon `docs/wioska_plan.md` | uwagi autora z gry; zmiana = cały blok + szkic „dziś/plan" |
| **Bandyci** (`OI-171`) | kroki 1–4 w grze; obóz v3 **roboczy** | `docs/bandyci_plan.md` | playtest liczb; miejsce obozu (`odlozone.md` §1) |
| **Świat 3D** (`OI-164`) | domyślny; S21 FE 119,8 FPS | `docs/systemy/render3d.md` | decyzja: kąt kamery i zoom |
| ⭐ **Migracja na widok IZOMETRYCZNY** (`OI-164`, autor 10-14) | ⏳ ZAPLANOWANA na **sobotę 2026-10-17** (duża praca) | `docs/zadania.md` `OI-164`, młyn: `docs/dziennik.md` 10-14 (7) | kamera z ukosa zamiast top-down: dziś budynek ma 4 strony i koło młyna musi być skręcone o 25°, żeby je w ogóle było widać; część zostaje, część do dopasowania — przegląd, co się psuje (kamera, sortowanie, zasłony, budynki, rekwizyty z `skret`/`bezObrotu`, UI w świecie) |
| **Geografia regionu** | propozycja, nie kanon | `docs/region_geography_proposal.md` §8 | trzy decyzje autora |
| **Łańcuch fabuły** | kolonia pająków = szczebel, nekromanta = szczyt (ukryty) | `docs/spider_colony.md`, `docs/swiat.md` §1 | Gęstwina = przedpole (1. fala: znaki), leże za nią — matecznik/puszcza (autor 10-12) |
| **Kreator postaci** (`OI-166`) | projekt, zero kodu | `docs/kreator_postaci.md` | decyzje D1–D5, model biznesowy `OI-167` |

**Wątki uśpione** (wejście, gdy wracasz): pancerz i tarcze —
`docs/pancerz_checkpoint.md` (FREEZE) · grafika tarcz —
`docs/tarcze_grafika_checkpoint.md` · ikony pancerza (wsad 5) —
`docs/gemini_armor_icons.md` §8 · las, test na telefonie —
`docs/plan_dalszych_prac.md` ETAP A · postać 3D (zamknięta) —
`docs/postac3d_checkpoint.md`.

## 3. Czeka na zdanie autora

✅ **2026-10-15 rozstrzygnięte** (`docs/decyzje/2026-10-15-przeglad-pytan-autora.md`): łuk/kusza **przed** wątkami świata (po izometrii) · oddanie zadania z **głosem dawcy** · kafle slotów zostają · kąt kamery z renderu w sobotę · lalka = **wygląd łączony** warstw · ceny dopiero po mieście · północna droga → miasto, południe → las, dzicz, węglarze.

| sprawa | pytanie |
|---|---|
| `OI-172` | kształt i nazwa mapy leża (matecznik / puszcza za Gęstwiną) |
| `OI-143` | czy trzy zestawy materiałowe mogą być częściowo czynne naraz (warunek `OI-94`) |
| `OI-20` / `OI-100` | sufit redukcji obrony; piąty profil pancerza (łuska) |
| `OI-126` | sztylety na nową rampę metalu (zmienia zamrożone SHA1) |
| geografia | obóz węglarzy jako osobna mapa? ostrokół zamiast palisady? |
| Kartografia | co daje poziom III (`pomysly.md`) |

⏸ **Odłożone przez autora (2026-10-11):** krzywa XP i rangi Mastery
(`OI-43`, `OI-28`, `OI-46`) — za wcześnie przy zwierzętach i świeżych
bandytach; poziomy nie są dziś problemem.

**Czeka na playtest:** biegłość (pięć pytań — `docs/odlozone.md` §2), stamina,
`OI-105` (Model D), liczby bandytów, pościg lisa (`OI-162`), jeleń (`OI-163`),
odbiór rozstawu lasu (`OI-165`).

## 4. Zamknięte — nie otwieraj bez błędu z uruchomionej gry

| etap | data | gdzie |
|---|---|---|
| las: kolizja, nawigacja, GreyWolf, Bear | 08-31 | `docs/forest_rebuild_scope.md` |
| ekwipunek: fundament (lalka jako dane) | 09-11 | `docs/decyzje/2026-09-11-ekwipunek-fundament.md` |
| warstwy pancerza (model C) + obciążenie Model D | 09-15 | `docs/decyzje/2026-09-15-*.md` |
| ARMOR SYSTEM FREEZE (pancerz i tarcze) | 09-18 | `docs/pancerz_checkpoint.md` |
| katalog broni 37 + oś materiału + `minReach` | 09-18 | `docs/decyzje/2026-09-18-katalog-broni-zamkniety-37.md` |
| ekran handlu; cofnięcie sprzedaży atomowe | 09-19/21 | `docs/decyzje/2026-09-19-ekran-handlu-przebudowa.md` |
| prototyp postaci 3D — baza V5 = MASTER | 10-10 | `docs/postac3d_checkpoint.md` |
| zapis: migracja zamiast kasowania (`OI-51`) | 10-11 | `docs/systemy/save.md` §2 |

⛔ `coverage`, hit location i penetracja **nie powstaną**.

## 5. Świadomie odłożone — ⛔ nie „naprawiaj" przy okazji

- **`B1` — obciążenie `W4`** (59,7 kg wobec 40–55): `obciazenie_przymiar`
  świeci na czerwono **celowo**; nie ruszaj mas, pasma ani testu.
- **Siła jako płaska premia** — poprawka wymaga przestrojenia całej broni i HP.
- **Wspólny stub Phasera w `tools/`** — minimalne stuby są czujnikiem.
- **Każda broń i pancerz w sklepie** — reguła etapu testów, do przeglądu
  przed wydaniem (`docs/odlozone.md` §1).
- Barierki „czego nie budujemy" → `docs/odlozone.md` §5.

## 6. Bramki przed „zrobione"

```bash
npx tsc --noEmit && npm run build && node tools/doc_check.mjs
```

Po zmianie rozmów/zadań `node tools/rozmowy_przymiar.mjs`; po zmianie
ścieżek `node tools/assety_przymiar.mjs`; po zmianie map, portali albo
`MAP_ATLAS` `node tools/mapa_przymiar.mjs`; w silniku `dev.missing()` puste.
Obraz 3D sprawdza się zrzutem `window.__widok3dObiekt.zrzut()`.

## 7. Granice

- ⛔ Nie rozstrzygaj za autora — §3 to jedno zdanie decyzji; agent daje
  warianty i pomiar.
- ⛔ Nie twórz mechanik przy okazji; wariant może zdolność odebrać, nie dodać.
- Kod bez `STAN` łapie `doc_check` §D (katalogi `src/`).

## 8. Jak utrzymać ten plik

Zmieniasz go, gdy zmienia się **wątek, następny krok albo pytanie do
autora** — nie przy każdej poprawce. Zakończony wątek: wiersz z §2 do §4
(albo do „uśpionych"), jego dokument dostaje `stan: zamkniety`. Nowy wątek:
wiersz w §2 i jeden dokument wątku o stałej nazwie (`DOC_CONTRACT.md` §11).
