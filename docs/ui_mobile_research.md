---
typ: OPERACYJNE
domena: ui
tytul: Interfejs mobilny — research gier mobilnych i przebudowa HUD-u, panelu, rozmowy i karty przedmiotu
stan: zywy
otwarte: [OI-87, OI-177, OI-178]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-13
---

# Interfejs mobilny — research i przebudowa

> **Po co ten wątek.** Autor 2026-10-12, dwie sesje jednego dnia:
> (1) „wciel się w specjalistę od interfejsów mobilnych MMO, research
> (Diablo Immortal, Metin, Eternium), usprawnienia — zwłaszcza dialogów,
> minimalistycznie i czytelnie"; (2) „HUD, panel, rozmowy pod przyszłą
> rozgrywkę: świeży gracz ma się szybko odnaleźć, a jednocześnie poczuć, że
> to jest dobrze przemyślane — poziom Wild Rift". Horyzont: produkt,
> monetyzacja za 1–2 lata, rozwój ewolucyjny.

## Stan (2026-10-13, po etapach B–F)

| rzecz | stan | gdzie |
|---|---|---|
| typ ataku: 1 przycisk + kolumna wyboru z „✕" | ✅ | `AttackModeButton.ts`, `HUD_LAYOUT.place.mode` |
| typ obrażeń widać zawsze — znak na przycisku ataku | ✅ | `AttackButton.ts` |
| 6 slotów umiejętności | ✅ | `ABILITY_SLOTS`, `HUD_LAYOUT.place.ability` |
| ⭐ **para broni: tryb ataku + zmiana zestawu obok siebie** na wspólnej podkładce | ✅ | `outer` 2–3, `WeaponSwapButton.paintPlate` |
| ⭐ **ramka postaci**: odznaka poziomu z pierścieniem XP, HP, wysiłek; bez złota i napisu punktów | ✅ | `HUD.ts`, `HUD_LAYOUT.unitFrame` |
| ⭐ **minimapa → MAPA**, **przycisk menu (plecak) → panel** | ✅ | `Minimap.ts`, `MenuButton.ts`, `HUD_LAYOUT.menuButton` |
| ⭐ **nawigacja panelu = szyna** (sakiewka u góry, „Wróć do gry” na dole; poziomy `TabBar` usunięty — D13) | ✅ | `Rail.ts`, `PlayerPanel.railTabs` |
| ⭐ **„Załóż · Zestaw I / II"** (i wybór palca przy dwóch pierścieniach) | ✅ | `PlayerPanel.equipTargetsFor` |
| ⭐ **najpierw slot**: pusty kafel lalki filtruje plecak do pasujących | ✅ | `ItemCategory.categoryOfSlot`, `CategoryStrip.select` |
| ⭐ **dymki „pierwszego razu"** (menu, zestaw, sposób ataku) | ✅ | `CoachMark.ts` |
| karta przedmiotu: krój 11 → 12 j., 21 → 18 wierszy | ✅ | `ItemCard.cardToLines`, `ItemTooltip` |
| rozmowa jako arkusz (pas + kolumna, bez huba) | ✅ (sesja 1) | `ConversationSheet.ts`, `NpcDialog` |
| ⭐ **etap B (2026-10-13)**: krój proporcjonalny w całym UI (D1), role tekstu `TYPE`, panel 100% krycia + przyciemnienie pod nim, widżet `Rail` + obszar usługi, przymiar paneli (`OI-68`) | ✅ | `theme.ts`, `FrameLayout.ts`, `Rail.ts`, `PanelBase`, `tools/panel_fit.mjs` |
| ⭐ **etap C (2026-10-13)**: rama rozmowy — „Rozmowa" = zakładka 0, usługi w stałej kolejności (kafle po dwa w kolumnie = zakładki szyny), zwężenie kolumny do szyny, podwidoki bez tytułów i ✕, Wstecz o jeden poziom, stan zakładek do końca rozmowy, w szynie samo imię (E4); D14 — grupy tematów | ✅ | `ConversationSheet`, `NpcDialog`, `TOPIC_GROUPS`, `rozmowy_przymiar` R6/R7 |
| ⭐ **etap D (2026-10-13)**: lalka-sylwetka `DOLL_CELLS` wspólna ze sklepem, E1 (jedna warstwa dla całej lalki + kropki), E2 (zestaw I/II nad rękami + miniatury, ⇄ = zamiana), trzy liczby pod lalką, plecak 4 kol. z torbami pod siatką, stała kolumna karty (`ShopDetails`) | ✅ | `PaperDoll.ts`, `EquipLayout.ts`, `PlayerPanel`, `ekwipunek_uklad` |
| ⭐ **etap E (2026-10-13)**: sklep **kupiec \| gracz \| karta** — kafle po obu stronach (decyzja autora po zrzucie A/B lista ↔ kafle), zakładki Kup·Odkup i Plecak·Na sobie, karta na rolach tekstu (ciało obok podglądu, porównanie z OBOMA zestawami — D10, obciążenie po → teraz), Cofnij do końca rozmowy + Odkup z narzutem (E3), licznik −/+/Max, naprawa przy rzeczach gracza | ✅ | `ShopLayout.ts`, `ShopPanel.ts`, `ShopDetails.ts`, `ItemCard.compares`, `docs/decyzje/2026-10-13-sklep-kupiec-gracz-karta.md` |
| ⭐ **etap F (2026-10-13)**: **lista + karta** (`ListDetail`) dla zadań u dawcy, szkolenia, Mistrzostwa, Postać → Umiejętności / Broń i dziennika; widoki usług na CAŁYM obszarze (`subviewSize`); **D4 — zadanie przyjmowane i oddawane w rozmowie**; Cechy, Opcje i Mapa na rolach tekstu, podzakładki Postaci 52 j. | ✅ | `ListDetail.ts`, `ListDetailLayout.ts`, `QuestCard.ts`, `WeaponFamilyCard.ts`, `ConversationSheet.questSpecs`, `panel_fit` §F |
| odbiór na telefonie | ⏳ autor | render 1:1 z S21 FE — §6 |

**Co zostało po etapach B–F (2026-10-13)** — plan przebudowy jest w kodzie;
reszta to dopracowanie albo rzeczy czekające na playtest:
- ⏳ **autor:** odbiór E+F na telefonie (APK na prośbę); pytania z
  `docs/current.md` §3 (oddanie zadania z głosem dawcy czy „(Otrzymujesz: …)",
  kafle slotów przy umiejętnościach, domyślna warstwa lalki i „Użytkowy II");
- **gotowe do zrobienia:** D7 (strzałka „lepsze" na kaflu), D6 (rozmiar tekstu
  jako ustawienie), role tekstu w widżetach HUD-u (`OI-178`);
- **po playteście / z łukiem / po kreatorze:** D9 (edytor HUD), D2–D3
  (`OI-177`), D5 (twarz rozmówcy),
  D15 (mapa z mgłą, Kartograf);
- **dług z decyzją autora:** `OI-67` (próg dotyku poza listami i kartami),
  `OI-69` (dwa kształty odmowy), `OI-93` (dwa typy przycisków na pasku).

Bramki: `hud_uklad` (§6b), `ekwipunek_uklad` (sylwetka, 5 ramek),
`panel_fit`, `karta_przedmiotu`, `ui_panele_weryfikacja`, `filtr_przymiar`,
`sklep_uklad`, `sklep_cofniecie`. Render sklepu: `tools/phone_render_shop.json`;
etapu F: `tools/phone_render_lists.json` (usługi + D4) i
`tools/phone_render_pages.json` (strony panelu gracza poza plecakiem).

---

## 1. Diagnoza wyjściowa (2026-10-12, render 1:1 z telefonem)

1. **Tryb ataku i zamiana zestawu w dwóch końcach rogu** (`middle` 3 nad
   klastrem, `outer` 2 po lewej) — dwie decyzje o tej samej broni.
2. **„Załóż" na karcie broni szło zawsze do zestawu I** (`slotForItem` →
   `weapon`); drugi zestaw dało się zbudować tylko przeciąganiem, o którym
   karta nie mówi. To samo z pierścieniem przy dwóch zajętych palcach.
3. **Minimapa otwierała plecak** — odwrotnie niż odruch z każdej innej gry;
   wymagała znaczka ☰, żeby to w ogóle zapowiedzieć.
4. **HUD nosił złoto i „Punkty rozwoju: 41 (C)"** — klawisz C nie istnieje na
   telefonie, złoto nic nie mówi w walce. XP jako „1358 / 7664" krojem 11 j.
   na trawie: ≈ 7 dp, nieczytelne.
5. **Panel: zakładki tekstowe 11 j., „Wróć do gry" na dole** zabierał pas
   68 j. każdej stronie, złoto zwykłym tekstem.
6. ⚠⚠ **Typografia panelu na telefonie** (największy dług, dziś tylko
   częściowo ruszony — `OI-178`): 1 j. ≈ 0,118 mm, więc krój 11–13 j. to
   **1,3–1,5 mm** wysokości kroju (≈ 7–8 dp). Gry mobilne trzymają tekst
   ≥ 12–14 dp. Rozmowa (sesja 1) ma 21 j. i czyta się dobrze; panel — nie.

## 2. Co zrobiono w sesji 2 i dlaczego

- **Para broni** na zewnętrznym łuku (`outer` 2 = tryb, `outer` 3 = zestaw,
  227°), równa waga 0,8, wspólna podkładka-kapsuła (wspólny obszar = jedna
  grupa). Wzór: satelity ataku w MOBA („atakuj stwora / wieżę" w Mobile
  Legends, Wild Rift, HoK, AoV). ⚠ **Nie przy samym ataku**: pierścień
  wewnętrzny niesie umiejętności 1–3, a satelita mniejszy od `minTouch`
  łamałby próg dotyku. Zwolnione `middle` 3 = rezerwa (7. umiejętność albo
  „ultimate pojawiający się, gdy gotowy" — Diablo Immortal).
- **Ramka postaci**: odznaka poziomu, XP jako pierścień, kropka punktów;
  tapnięcie odznaki → POSTAĆ. Złoto zeszło z HUD-u (Eternium: waluty tylko
  w menu); wpływ złota ogłasza świat (`+N zł` nad łupem).
- **Wejścia z HUD-u**: minimapa → MAPA (wszystkie badane gry: minimapa to
  instrument mapy), przycisk z plecakiem na lewo od minimapy → panel na
  ostatniej zakładce innej niż mapa. ⭐ **Ten rząd jest miejscem na przyszłe
  ikony** (sklep, poczta, wydarzenia) — rosną W LEWO, nie do klastra walki.
- **Pasek zakładek** (`TabBar`): ikona + podpis 15 j., stała szerokość
  kafla, sakiewka (moneta `drawCoin` + kwota z odstępem tysięcy), ✕ jako
  ostatni kafel. Zakładka `save` nazywa się dla gracza **„Opcje"** z kołem
  zębatym (zapis, ustawienia, wyjście — gracz szuka tego pod zębatką).
  Pasek urósł 40 → 56 j.; wysokość oddał zlikwidowany dolny pas.
- **Karta**: przy dwóch sensownych miejscach przycisk niesie CEL
  („Załóż · Zestaw II", „Zamień · pierścień II"); odmowę nazywa ta sama
  ścieżka co upuszczenie na kafel. Zagęszczenie: typ + jakość w jednym
  wierszu, ceny w jednym, „Masz" od dwóch sztuk.
- **Najpierw slot**: pusty kafel lalki → plecak na zakładce tego slotu.
- **Onboarding w chwili użycia** (`CoachMark`): dymek raz na urządzenie przy
  POJAWIENIU się kontrolki, jeden naraz, nie na modalu, czeka na podpowiedź
  walki, gaśnie na dowolne tapnięcie i go nie połyka.

## 3. Research — co robią inni (skrót; pełne raporty z URL-ami w sesji 2026-10-12)

**MOBA (Wild Rift, Mobile Legends, Honor of Kings, Arena of Valor, UNITE).**
Duży atak w rogu, umiejętności łukiem, ultimate na zewnętrznym/górnym końcu —
złamanie konwencji mierzalnie spowalnia naukę (praca Aalto/Rovio). Przełączniki
zmieniające to, CO trafia atak, są małymi satelitami ataku. Celowanie:
przeciągnięcie z przycisku, strefa martwa, anulowanie blisko klastra (WR 2.2,
MLBB „Swipe Cancel"). Wszystkie mają **edytor układu HUD** (położenie, rozmiar,
przezroczystość, zapisane układy) — ale każdy poradnik zaczyna od naprawiania
złego domyślnego. Preferencje stałe (priorytet celu, auto-ulepszanie) są
**ustawieniem, nie przyciskiem**. Stan na przycisku: wycinek + liczba sekund,
szary ze skosem przy blokadzie. Samouczek: 2 krótkie obowiązkowe + opcjonalne
per funkcja (WR uczy osobno nawet satelitów ataku).

**Mobilne RPG/MMO (Eternium, Diablo Immortal, Genshin, OSRS, BDM, Albion,
Lineage).** Eternium (zrzuty): nagłówek panelu = tytuł · waluty (ikona +
liczba, „+" do sklepu) · ✕ na końcu; zakładki jako pionowa szyna ikon; na HUD-zie
TYLKO „Ekwipunek" i „Opcje", XP cienkim paskiem na dole, **złota brak**.
Diablo Immortal: ☰ obok minimapy, menu jako siatka ikon; portret z poziomem
i HP; menu odblokowywane krokami samouczka. Genshin: minimapa → duża mapa;
menu Paimon = siatka ikon odblokowywanych z rangą. OSRS: zakładki na prawej
krawędzi, rzadsze schowane za „Expand". **Wybór slotu przy zakładaniu**:
krytykowane jest „zawsze lewy pierścień" (ESO) i porównanie tylko z jednym
(Last Epoch); dobre — jawny wybór celu (Genshin „Fast Equip") albo najpierw
slot (Genshin „Switch", Diablo III na konsoli). **Krytykowane**: pulsujące
ikony i oferty na każdym ekranie (Eternium, BDM), zagracony HUD (Lineage 2
Revolution), czerwone kropki, które nie gasną (Diablo Immortal — klasa błędu).

**Waluta.** WoW: stan = jedna liczba w miedziakach, podział na stopnie robi
wyłącznie wyświetlanie. Epokowo dla wsi XIII–XIV w.: **denar → grosz →
grzywna** (grzywna krakowska = 48 groszy, rozrachunkowa); „złoty" i „szeląg"
później. → `docs/odlozone.md` §1 („TRZY STOPNIE MONET").

## 4. Pułapki, których świadomie uniknięto

1. Satelity mniejsze od `minTouch` przy ataku — para broni stoi na łuku.
2. Czerwona kropka, która nie gaśnie — kropki są WYPROWADZANE ze stanu
   (`skillPoints > 0`), nie zapalane zdarzeniem.
3. Dwie podpowiedzi naraz — `CoachMark` czeka na `CombatHint`.
4. Pulsujące „kup mnie" — miejsce na sklep jest zarezerwowane biernie (rząd
   przy minimapie, sakiewka), nic nie mruga.
5. Przesuwanie znanych przycisków po wydaniu (Eternium, krzywe ekrany) —
   decyzje o układzie zapadają TERAZ, przed graczami.

## 5. Do decyzji autora (warianty i rekomendacja, nie rozstrzygnięcia)

| # | sprawa | warianty | rekomendacja |
|---|---|---|---|
| **D1** | ⭐ **krój całego UI** (`OI-178`) | monospace (dziś) / proporcjonalny jak w rozmowie (`READING_FONT`) | **proporcjonalny** — zrzut A/B 1:1 z telefonem: przy tej samej wysokości karty czytelność wyraźnie wyższa, wiersze ~15% węższe, czyli miejsce na większy krój. Zmiana = jedna stała `FONT` w `theme.ts` + przegląd paneli |
| D2 | koszt zamiany zestawu w walce (`OI-177`) | 0 + odstęp 1 s (dziś) / czas przełożenia / stamina | razem z łukiem (etap 3) |
| D3 | pasek per zestaw broni | jeden pasek 6 slotów (dziś) / sloty broni podmieniane zamianą | przy łuku; cooldowny schowanych muszą tykać i być widoczne |
| D4 | zadania w rozmowie | podwidok (dziś) / przyjęcie i oddanie jako strony arkusza | arkusz |
| D5 | twarz rozmówcy | brak / migawka modelu 3D | po kreatorze postaci |
| D6 | rozmiar tekstu jako ustawienie | brak / 100–120–140% | tak, razem z D1 |
| D7 | strzałka „lepsze" na kaflu plecaka | brak / strzałka + delty na karcie | tak, delty per statystyka (pułapka jednej oceny) |
| D8 | auto-ścieżka z dziennika (Diablo Immortal) | brak / ślad do celu | odłożyć — wieś mała |
| **D9** | **edytor układu HUD** (WR, MLBB, HoK) | brak / przesuwanie + rozmiar + przezroczystość + reset | po playteście; geometria ma JEDEN dom (`HUD_LAYOUT`), więc edytor to nadpisanie tych liczb z ustawień |
| **D10** | **porównanie z OBOMA zestawami** na karcie broni | tylko zestaw I (dziś) / dwa bloki | tak — przy przycisku „Zestaw II" gracz nie widzi, co tam leży |
| **D11** | **trzy stopnie monet** | — | `docs/odlozone.md` §1 |
| **D13** | ⭐ **nawigacja panelu jako PIONOWA szyna** (autor 2026-10-12: „panel z plecakiem jako lista pionowa, jak kolumna w rozmowie — mniejszy zakres poznawczy") | poziomy `TabBar` (dziś) / szyna przy prawej krawędzi: sakiewka u góry, zakładki ikona + podpis, „✕ Wróć do gry" ostatnia na dole — jak „Do widzenia" w rozmowie | **tak** — jeden wzorzec „opcje = pionowa lista po prawej" w całej grze; Eternium ma szynę ikon przy prawej krawędzi; w poziomie brakuje wysokości, nie szerokości (strona zyskuje 56 j.). Wykonanie: `PanelBase` z kolumną dołączoną z prawej (przesunięcie kontenera + `fitScale` po pełnej szerokości), `TabBar` w układzie „rail", dwa miejsca w `PlayerPanel` liczące od środka ekranu (`uiW/2` przy karcie umiejętności i kotwicy karty przedmiotu), `tools/ekwipunek_uklad.mjs` odejmuje szynę od szerokości |
| **D14** | ⭐ **tematy rozmowy w GRUPACH** (autor 2026-10-12: „u zielarki: powiedz mi więcej o ziołach → powiedz mi więcej o [ziele]; na dole »Zmień temat« = powrót do stałych grup") | płaska lista frontu (dziś, do 7 pozycji) / dwa poziomy: grupa tematów → pytania w grupie, ostatni wiersz „Zmień temat" | **tak** — ta sama pionowa kolumna, mniej pozycji naraz; dane `Dialogue` mają już tematy z bramkami `after`, brakuje pola grupy. ⚠ Po zmianie rozmów: `node tools/rozmowy_przymiar.mjs` (literówka w bramce ukrywa temat na zawsze) |
| **D15** | **minimapa jako pergamin + mgła wojny + Kartograf** (autor 2026-10-12, referencja: krawędź mapy z Minecrafta) | ✅ kartka na minimapie (10-13, `MapParchment.ts`); ✅ mapa w panelu na kartce (Okolica / Świat), mgła, Kartografia I–II (10-14, `docs/systemy/world.md` §5.1) | pomysł: `docs/pomysly.md` „Kartografia” |
| **D12** | **sterowanie umiejętnościami „dotknij → celuj → dotknij"** + onboarding w zadaniach (Ojciec, Patryczek, Mama) | ✅ 2026-10-14: ustawienie „Celowanie: przeciągnij / dotknij celu” (`Settings.aimMode`); onboarding w zadaniach — otwarty | `docs/systemy/input.md` §5 |

## 6. Jak to sprawdzać na „telefonie" bez telefonu

Render 1:1 z S21 FE: `node tools/phone_render.mjs <scenariusz>` (bezgłowy
Chrome + CDP, 780×360 CSS, DPR 3 → zrzut 2340×1080; kroki `eval`, `tap`,
`tapAt`, `drag` z `midShot`, `key`, `shot` — nagłówek pliku). Scenariusze:
`tools/phone_render_frame.json` (rama rozmowy, C),
`tools/phone_render_inventory.json` (panel gracza po D + minimapa w kartce:
14 zrzutów, dwa przeciągnięcia ze stanem przed/po). ⚠ Przeglądarka w panelu aplikacji, gdy jest
UKRYTA, nie renderuje klatek — strona stoi na „Loading". ⚠ Liczby `dp` w tym
pliku: 1 j. ≈ 0,62 dp przy 780×360 CSS (DPR 3).

## 7. Brief z 2026-10-12 — ZASTĄPIONY

Brief „dopracowanie na telefonie" (rama usług, D13, D14, D1, spójność oprawy,
D10/D7, POSTAĆ i ZADANIA, podpisy mapy) został wchłonięty przez research 2 (§8)
i etapy §9; krok 0 (pasek rozmówcy u góry) — odrzucony na rzecz szyny (R2).
Pełny tekst: `git log -p docs/ui_mobile_research.md`. Z niego nadal otwarte
poza etapami D–F: **D7** (strzałka „lepsze" na kaflu). Podpisy NPC na mapie —
✅ etap F (`small`, 15 j.); D10 — ✅ etap E.

## 8. Research 2 (2026-10-13): rama usług, sklep, ekwipunek — synteza

Trzy raporty (surowe, z URL-ami): `docs/research/ui_dialogue_frame_research.md`,
`ui_shop_research.md`, `ui_inventory_research.md`. Autor: „sklep i panel to
prototypy; na interfejsy, które towarzyszą graczowi cały czas, nie liczy się
szybkie dowiezienie". ⚠ Brief §7 krok 0 (pasek rozmówcy u góry) jest tym
researchem **zastąpiony** — patrz R2.

**Ustalenia (zgodne we wszystkich trzech raportach):**
- **R1 Tekst, nie kafle.** Kafel/wiersz 70 j. = 12% wysokości — norma rynku
  (10–14%). Tekst 11–13 j. = 1,9–2,2% wysokości; wzorce 2,5–4% (Diablo
  Immortal, Eternium, BDM, Lineage 2M, Wild Rift, Genshin). Cel: tekst główny
  ≥ 18 j., nazwy w listach 20–23 j., drugi plan ≥ 15–16 j., tytuły 22–24 j.
  ⚠ Przelicznik dp zależy od „rozmiaru wyświetlacza": S21 FE domyślnie
  0,709 dp/j. (68 j. = 48 dp), telefon z powiększonym widokiem 0,62 dp/j.
  (68 j. = 42 dp) — projektować pod gorszy.
- **R2 Nawigacja = pionowa SZYNA, nie górna listwa.** Na 13 zrzutach
  ekwipunku żadna gra nie przełącza działów listwą u góry (u góry: tytuł,
  waluty, ✕). Listwa 56–68 j. kosztuje rząd plecaka; szyna ~100–200 j.
  kosztuje szerokość, której jest w nadmiarze. ⇒ D13 potwierdzone.
- **R3 Rozmowa = zakładka 0 tej samej ramy.** Tap „Handel" zwęża kolumnę
  rozmowy do szyny (tożsamość NPC u góry, usługi w STAŁEJ kolejności,
  „Do widzenia" na dole), treść usługi po lewej, bez własnego tytułu i ✕
  (Diablo Immortal: kolumna kupca z pionowymi zakładkami usług; BDO: stały
  pasek usług). Wstecz = jeden poziom. ⚠ Usługi nie mogą skakać po kolumnie
  wg pilności (dziś skaczą) — kciuk nie wyrobi odruchu.
- **R4 Sklep: towar kupca to LISTA wierszy** (ikona + nazwa + cena; 1×2 bez
  problemu), siatka tylko dla plecaka gracza (zakładka Sprzedaj), karta
  ZADOKOWANA, przycisk KUP z ceną w prawym dolnym rogu. Manekin znika ze
  sklepu — „co noszę" mówi porównanie (broń vs OBA zestawy, pancerz vs ten
  sam adres + warstwa, obciążenie przed → po). Do tego „Sprzedaj śmieci"
  (bez założonych), Cofnij/Odkup zamiast „Czy na pewno?", ilość −/+/Max.
  Cztery równe kolumny (dzisiejszy prototyp) to wzorzec portów z PC.
- **R5 Ekwipunek: sylwetka anatomiczna** (jak w sklepie — autor miał rację)
  | plecak 4 kol. | STAŁA kolumna karty | szyna. Karta-okienko zasłania to,
  z czym gracz porównuje (Diablo Immortal, Eternium) — kolumna, nie okienko.
  Pod lalką 3–4 duże liczby (Eternium). Wspólne ze sklepem są KOMPONENTY
  (komórka, siatka plecaka, karta, kafel slotu, szyna), nie cały układ.
- **R6 Zadania i nauka** w ramie: lista + szczegóły + jeden przycisk z ceną
  (wzór: strona Postać → Broń, dziś najlepiej zbudowana). D14 (grupy tematów)
  konieczne: kolumna mieści ~6–7 wierszy.
- Z audytu 2026-10-13: tło paneli 95% krycia — przebija HUD (pasek HP,
  minimapa, dymki); widoki zadań/trenera to okna 816×440 z HUD-em dookoła.

**Proponowany budżet szerokości (1257 j.):** szyna ~190 j. (ikona + podpis
18 j., kafel ≥ 68 j., ≤ 5 zakładek + wyjście) · treść ~1005 j.
Ekwipunek: lalka ~250 | plecak ~310 | karta ~410. Sklep: lista ~420 |
karta ~570. Wyjście na dole szyny ≥ 16 j. od przycisku akcji karty, inny
wygląd.

**Do decyzji autora (warianty — następna sesja z makietami 1:1):**
| # | sprawa | warianty | rekomendacja |
|---|---|---|---|
| E1 | warstwa pancerza w lalce | przełącznik per obszar (dziś) / jeden przełącznik całej lalki Wierzch·Środek·Spód | jeden dla całej lalki + kropki zajętości |
| E2 | zestawy broni w lalce | oba zestawy naraz (dziś) / przełącznik I·II nad rękami + miniatury drugiego | przełącznik |
| E3 | odkup w sklepie | 1:1 w sesji / Cofnij do końca rozmowy + Odkup z narzutem | Cofnij + Odkup |
| E4 | kwestia NPC w ramie | samo imię / linia reagująca na akcję (wymaga tekstów, `swiat.md`) | samo imię teraz, linie później |
| E5 | wyjście w szynie | dół (jak „Do widzenia") / góra | dół |
| D1 | krój | monospace / proporcjonalny | proporcjonalny (wszystkie raporty mierzą czytelność na krojach proporcjonalnych) |

**Etapy:** (A) makiety 1:1 + wybór E1–E5 · (B) fundament: krój i skala tekstu,
krycie tła, `Rail` + rama (`PanelBase`), przymiar paneli (`OI-68`) ·
(C) rama rozmowy z usługami + D14 · (D) ekwipunek na nowej ramie ·
(E) sklep: lista + karta + Sprzedaj · (F) zadania/trener/Mistrzostwo jako
lista + szczegóły. Każdy etap kończy zrzut 1:1 (`cdp` 780×360 DPR 3 albo
891×411 DPR 2,625 — ten sam obraz 2340×1080).

**⭐ Po wdrożeniu B–C (autor, 2026-10-13 wieczorem):** w Handlu szyna SAMYCH
IKON (+112 j. dla sklepu; kafle na tych samych wysokościach — `S7`); złoto
należy do widoku, który je wydaje — w sklepie „3 020 (−40)", wydatek lekko
czerwony (`UI.spend`), zamiast zdania „po zakupie"; szyna rozmowy bez sakiewki.
Ocena krytyczna przed wdrożeniem: zysk realny, ale połowiczny (kafel 54 → 62 j.
na S21 FE, norma 68 dopiero w E); koszt — szyna ma dwie gęstości, więc
tożsamość (imię) znika w Handlu (niesie ją podpis półki kupca).

**⭐ Rozstrzygnięte przez autora 2026-10-13:** E1 — jeden przełącznik warstwy
dla całej lalki · E2 — przełącznik zestawów I/II nad rękami · E3 — Cofnij do
końca rozmowy + Odkup z narzutem · E4 — w ramie samo imię NPC, linie później ·
E5 — wyjście na dole szyny · **D1 — krój proporcjonalny w całym UI.**
Etap A (wybór) zamknięty; makiety są opcjonalne — można iść od razu w B.

## 9. Brief wdrożenia (dla każdej sesji, także innego modelu)

Czytaj najpierw §8 i `src/ui/CLAUDE.md`. Każdy etap = osobny commit-etap,
zamknięty zrzutem `node tools/phone_render.mjs` (wzór
`tools/phone_render_example.json`) obejrzanym w powiększeniu, plus
`npx tsc --noEmit && npm run build && node tools/doc_check.mjs` i przymiary
dotkniętych paneli (`sklep_uklad`, `ekwipunek_uklad`, `karta_przedmiotu`,
`hud_uklad`, `filtr_przymiar`, `ui_panele_weryfikacja`).

- ✅ **B · fundament** (2026-10-13): D1 krój proporcjonalny, role tekstu
  `TYPE` zamiast literałów (⚠ przenosiny paneli pod role to D–F), krycie
  1,0 + przyciemnienie, `Rail` + geometria czysta, przymiar paneli (`OI-68`).
- ✅ **C · rama rozmowy** (2026-10-13). `NpcDialog` = maszyna stanów; „Rozmowa" = zakładka 0,
  usługi w STAŁEJ kolejności (nie wg pilności), kolumna arkusza ↔ szyna
  (zwężenie), podwidoki bez tytułów i ✕ (`addCloseButton`/`headerButton`
  znikają z Shop/Quest/Trainer/Mastery), wyjście = „Do widzenia", Wstecz =
  jeden poziom, stan zakładki trwa do końca rozmowy. D14: grupy tematów
  (jeden poziom, „‹ Zmień temat" nad „Do widzenia", licznik nowych) —
  po zmianie danych `node tools/rozmowy_przymiar.mjs`.
- ⏭ **Odstępstwa i koszty B–C (do przeglądu):** podwidoki ruszone minimalnie —
  zdjęte tytuły/✕/„Wróć", złoto do sakiewki szyny, Szkolenie/Mistrzostwo
  pokazują same punkty rozwoju, Mistrzostwo stawia przyciski pod opisem (krój
  proporcjonalny odsłonił stare nakładanie); ⚠ **sklep w obszarze usługi ma
  na telefonie kafel 57–62 j. < 68** (szyna samych ikon odrobiła połowę straty;
  resztę zdejmie E — `sklep_uklad` R3/Z6 ostrzega); kafel sylwetki ≤ kafel
  siatki (ta sama skala tarczy — `Z9`); podgląd karty liczony ze skali
  (`D4`/`D5`); `PanelBase.addCloseButton` usunięty (zero klientów). Grupy
  tematów w danych: tylko zioła Zielarki (reszta NPC ma łańcuchy `after`,
  po 2–4 tematy naraz).
- ✅ **D · ekwipunek** na szynie (2026-10-13): `DOLL_CELLS` (`PaperDoll.ts`)
  zastąpiło kratę `EQUIP_CELLS` i dało `SHOP_DOLL` filtrem; E1, E2, trzy
  liczby, torby pod siatką, karta = `ShopDetails`; przepływ „od przedmiotu"
  (tap → karta z „Załóż · Zestaw I/II", przeciągnięcie → cyjan na celu) i „od
  slotu" (pusty → filtr plecaka, zajęty → karta + cyjan na pasujących).
  Panel gracza w obszarze obok WŁASNEJ szyny (997×556 na S21 FE).
- ⏭ **Odstępstwa D (do przeglądu):** domyślny widok warstw = oko („to, co
  widać" — zewnętrzna); planowany „Użytkowy II" zszedł z sylwetki (brak
  wolnego kafla 3×5 — pytanie do autora); zajęty kafel PODŚWIETLA pasujące,
  nie filtruje (reguła 10-12); `TabBar.ts` usunięty (`formatAmount` →
  `theme.ts`); maska siatki poszerzana na czas przeciągania (ikona w locie
  znikała nad lalką — błąd starszy niż D); inne strony panelu (Postać,
  Zadania, Mapa, Opcje) tylko przeniesione do nowego obszaru — role tekstu
  dostaną w F. Strona plecaka nie jest na liście `NA_ROLACH` (reszta pliku
  ma 56 literałów).
- ✅ **E · sklep** (2026-10-13), po trzech zrzutach A/B z autorem:
  **kupiec | gracz | karta**, kafle po obu stronach (68 j., ×2 jak w panelu
  gracza), zakładki **Kup·Odkup** i **Plecak·Na sobie** (sylwetka z
  `DOLL_CELLS`), karta zadokowana z kwotą na przycisku w prawym dolnym rogu,
  porównanie z OBOMA zestawami (D10: przełącznik „Zestaw I | II" w wąskiej
  karcie), obciążenie po → teraz w bloku porównania, E3 (Cofnij 1:1 do końca
  rozmowy + Odkup z narzutem `SHOP.buybackMarkup`), licznik −/+/Max, naprawa
  na karcie i „Napraw wszystko" na wizytówce kupca. Decyzja:
  `docs/decyzje/2026-10-13-sklep-kupiec-gracz-karta.md`.
- ⏭ **Odstępstwa E od briefu (do przeglądu):** towar to KAFLE, nie lista
  (autor po zrzucie A/B — research R4 rekomendował listę); **bez zakładki
  Sprzedaj** i **bez „Sprzedaj śmieci"** (autor: surowce posłużą do wyrobu,
  zbiorczo dopiero „złom" — `docs/odlozone.md` §5); Naprawa zeszła z zakładek
  kupca na rzeczy gracza; menu boczne w Handlu zostaje samymi ikonami (autor:
  „tylko w sklepie"). Przeciągania między kolumnami nie ma (dotknięcie +
  przycisk). Karta stała się wspólnie lepsza także w panelu gracza: role
  tekstu, ciało obok podglądu, przełącznik zestawów. Po drodze naprawione:
  cofnięcie sprzedaży oddawało NOWY egzemplarz (darmowa naprawa), ⓘ wystawało
  3 j. poza panel, ramka podglądu `1×2` w wąskiej karcie za płaska (`D5`),
  okno potwierdzenia na progu dotyku, chleb pisał się „Eliksir".
- ✅ **F · zadania / trener / Mistrzostwo** (2026-10-13): jeden widżet
  `ListDetail` (geometria `ListDetailLayout`, czysta; `panel_fit` §F z
  kontrolą) — wiersz 68 j. ze znacznikiem (`!` `?` `✓` `+`) albo ikoną,
  karta z tytułem `title`, sekcjami i przewijanym ciałem o całkowitej
  liczbie wierszy, przycisk z kwotą w prawym dolnym rogu, odmowa nad nim,
  sakiewka „3 020 (−120)" i punkty w nagłówku karty. Widoki usług biorą cały
  obszar (997×556 na S21 FE; były 816×440–470). **D4**: zadanie do wzięcia
  i do oddania to wiersze kolumny rozmowy — „!" pokazuje opis w głosie
  dawcy z „Biorę to." / „‹ Jeszcze nie", „?" oddaje i pisze nagrodę;
  zakładka Zadania zostaje przeglądem z tymi samymi przyciskami. Strony panelu
  gracza dostały role tekstu: Postać (podzakładki 52 j., Cechy, Umiejętności
  i Broń na `ListDetail`), dziennik na `ListDetail`, Opcje (przyciski 56 j.),
  Mapa (podpisy mieszkańców `small` zamiast 8 j. — dług z §7).
- ⏭ **Odstępstwa F (do przeglądu):** **przypisanie umiejętności na pasek
  to rząd sześciu kafli slotów w pasie akcji karty** (wolny — kładzie,
  zajęty — zamienia, złoty — zdejmuje), nie stos przycisków „Slot N —
  zamień"; pasek slotów u góry podstrony zniknął (ikony w rzędzie kafli
  mówią to samo). Dziennik bez filtra Aktywne/Ukończone: lista „do oddania →
  w toku → zrobione", śledzenie przyciskiem karty, tracker z HUD-u otwiera
  kartę śledzonego. Po D4 wypowiedź „po decyzji" to linia z danych
  (`working`) albo suchy komunikat w nawiasie („(Otrzymujesz: 30 XP, 2× Ser.)")
  — ⛔ agent nie dopisał NPC-om kwestii; jeśli oddanie ma mieć głos dawcy,
  potrzebne są nowe linie (autor). Mistrzostwo i Postać → Broń dzielą sekcje
  karty (`WeaponFamilyCard`), dawca i dziennik — treść zadania (`QuestCard`).
  Po etapie usunięty martwy kod karty-dymka: `ItemTooltip` (cały — nikt
  już nie wołał `show*`), klasa `CardActions` i `ItemCard.cardToLines`;
  kontrole „renderer nie liczy sam" (`tarcze_przymiar` B2,
  `zestawy_przymiar` G1/G3) celują dziś w `ShopDetails`.
