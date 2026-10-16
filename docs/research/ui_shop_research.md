---
typ: HISTORIA
domena: ui
tytul: Ekran handlu na telefonie poziomym — research gier mobilnych
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-13
---

> Surowy raport subagenta (2026-10-13). Synteza i decyzje: `docs/ui_mobile_research.md` §8. Zrzuty nie są w repo (scratchpad sesji).

# Ekran handlu na telefonie poziomym — research (2026-10-13)

Cel: zobaczyć, jak mobilne RPG/MMO w poziomie układają ekran kupca (kupno,
sprzedaż, porównanie, odkup), i wybrać kierunek dla naszego sklepu zamiast
wymyślać go od zera. Wyłącznie research — żadnych zmian w projekcie.

## 0. Metoda i ograniczenia

- Zrzuty (13 plików w tym katalogu) obejrzałem po kolei; opisy układu biorą się
  z nich, a nie z pamięci. Pomiary (% wysokości ekranu) to szacunki z pikseli,
  ±20%.
- **Źródeł nie dało się użyć:** gameuidatabase.com (wyzwanie Cloudflare — nie
  obchodziłem go), wiki na Fandomie (HTTP 402), sklep Steam (zerwane połączenie),
  MobyGames, Nexus Mods i wiki Albionu (403), wiki LoL (zerwany TLS). Listingi
  App Store i Google Play pokazują prawie wyłącznie walkę; ekranów kupca nie mają.
- **Bez materiału** (pominięte, nie oceniam): Grim Soul, Vampire's Fall: Origins,
  Toram, MU Origin, Undecember, Tarisland, Octopath CotC, Ragnarok (same grafiki
  marketingowe), Honkai: Star Rail (nie znalazłem zrzutu sklepu), Warspear (jest
  tylko ekran postaci). Torchlight: Infinite — źródła, które znalazłem, opisują
  wyłącznie rynek graczy (Trade House), nie kupca NPC
  ([maxroll](https://maxroll.gg/torchlight-infinite/currency/trade-house-for-beginners)).
- Przeliczniki: w projekcie 1 j. ≈ 0,62 dp (CSS 780×360, DPR 3 —
  `docs/ui_mobile_research.md` §6), więc **wysokość ekranu ≈ 360 dp, 1% wysokości
  ≈ 3,6 dp ≈ 5,8 j.** ⚠ Przy 0,62 dp/j. **48 dp to 77 j., nie 68 j.** jak podano
  w briefie (68 j. ≈ 42 dp, co pasuje do gęstości 2,625, nie 3). Dalej liczę
  wariantem ostrożnym: **dotyk ≥ 77 j., tekst 12 dp ≈ 19 j., 14 dp ≈ 23 j.**

## 1. Gry — co widać

### Diablo Immortal (Blizzard/NetEase) — „rama usług NPC”
Zrzuty: `diablo_immortal_merchant_npc_column_list_detail.jpg`,
`diablo_immortal_blacksmith_salvage_multiselect.jpg`,
`diablo_immortal_dialog_band_shop_button.jpg` (alfa, iPad 4:3; źródło:
[Blizzplanet](https://diablo.blizzplanet.com/blog/comments/diablo-immortal-vendors-merchants)).

1. **Układ:** trzy pionowe strefy pod wspólnym nagłówkiem. Z lewej (~20%
   szerokości) jest kolumna kupca: portret, imię w nagłówku („HONOR MERCHANT ⓘ”)
   i **pionowa lista zakładek** — u kupca kategorie (General / Immortals /
   Limited Time), u kowala usługi (Salvage / Upgrade / Reforge / Rank Transfer).
   Środek (~45%) to lista wierszy (ikona, nazwa, limit zakupu, cena). Wiersz ma
   ~12% wysokości, widać 5. Z prawej (~27%) jest karta przedmiotu, a pod nią
   **„BUY ⓧ3000” w prawym dolnym rogu**.
2. **Przepływ:** tap w wiersz → karta → BUY. U kowala środek zamienia się
   w siatkę plecaka 4×N z **ptaszkami multiselect** i przyciskami „Salvage all:”
   per jakość (biały/niebieski/żółty). Prawa kolumna zbiera wybrane pozycje
   (każda z ✕), pokazuje „Results” i ma duży przycisk SALVAGE. Sprzedaży za złoto
   nie ma — sprzęt idzie na rozbiórkę u kowala
   ([Sportskeeda](https://sportskeeda.com/esports/how-dismantle-get-rid-items-diablo-immortal)).
3. **Szczegóły:** karta zadokowana na stałe po prawej, bez wyskakującego okna.
4. **Nawigacja:** pionowe zakładki pod portretem; lista się przewija.
5. **Nagłówek:** tożsamość kupca (portret + imię + ⓘ), waluta i ✕ w prawym
   górnym rogu. **Wejście z rozmowy:** dolny pas dialogu (portret, imię, kwestia
   „Looking for something in particular?”), nad jego prawym końcem przycisk
   „SHOP”. Portret i imię przechodzą do lewej kolumny sklepu. Nie potwierdziłem,
   czy ✕ wraca do rozmowy, czy do świata.
6. **Tekst:** ~2,3–2,7% wysokości (≈ 8–10 dp). Kapitaliki ozdobnego kroju
   czyta się gorzej niż sam rozmiar by sugerował.

### Black Desert Mobile (Pearl Abyss) — „lada z oknem na świat”
Zrzut: `black_desert_mobile_npc_shop_split_world_visible_sell_junk.jpg`
([BlueStacks](https://www.bluestacks.com/blog/game-guides/black-desert-mobile/bdm-daily-todo-list-en.html)).

1. **Układ:** z lewej „Products List” (~31% szerokości, wiersz ~17% wysokości).
   Z prawej siatka torby 5 kolumn (~33%) z ikonowymi zakładkami kategorii.
   **Środek zostaje pusty — widać świat i stoisko kupca.**
2. **Przepływ:** pod torbą wskaźnik wagi (742/1500 LT) i slotów (49/100) oraz
   dwa duże przyciski **„Sell All” / „Sell Junk”**. Przewodnik każe codziennie
   zaczynać od „Sell Junk” u najbliższego kupca. Wersja PC ma zakładki
   Purchase / Sell / **Buyback** z ~10% narzutem na odkup
   ([wiki BDO](https://www.naeu.playblackdesert.com/en-US/Wiki?wikiNo=17)) —
   wersji mobilnej tego nie sprawdziłem.
5. **Nagłówek:** „←” i imię kupca („Lara”) z lewej, waluty pośrodku, ikona
   wyjścia z prawej. Dwa wyjścia (wstecz / zamknij) — najpewniej powrót do menu
   NPC kontra wyjście do świata (wniosek, nie sprawdzone).
6. **Tekst:** ~3% wysokości (≈ 11 dp), czytelny.

### Lineage 2M (NCSoft) — „lada z koszykiem”
Zrzut: `lineage2m_general_merchant_cart_weight_max_buttons.jpg`
([BlueStacks](https://www.bluestacks.com/blog/game-guides/lineage-2m/l2m-tips-tricks-en.html)).

1. **Układ:** z lewej „Merchandise List” z zakładkami ALL / Potion / Other
   (~24% szerokości, wiersz ~11%, widać 6). Środek (~34%) to **„Purchase List”
   (koszyk) na tle świata**. Z prawej „Bag”: siatka 4 kolumny, zakładki
   kategorii i licznik 9/100.
2. **Przepływ:** dobierasz do koszyka, potem jedno „Confirm”. Pod koszykiem
   pasek „Estimated Weight 18,8%”, cena i przyciski **+10 / +100 / +1000 /
   Max 49,9% / Max 79,9%** — „Max” liczy się **do progu wagi**, nie do pieniędzy.
   Na dole „Purchase Settings” (zapamiętane zakupy) i „Auto-Trade”.
5. **Nagłówek:** „General Merchant →]” w prawym górnym rogu, waluty u góry
   pośrodku.
6. **Tekst:** ~2,7% wysokości (≈ 10 dp).

### Genshin Impact (miHoYo)
Zrzuty: `genshin_mora_shop_list_detail.png`, `genshin_premium_shop_tab_rail.png`
([Interface In Game](https://interfaceingame.com/screenshots/genshin-impact-mobile-purchase-sword/)).

1. **Układ:** lista wierszy z lewej (~50% szerokości, wiersz ~12% wysokości,
   5 widocznych: ikona, nazwa, cena, „Purchase up to 1/1”), karta z prawej
   (~32%). **„Purchase” w prawym dolnym rogu.** Sklep premium ma kategorie jako
   pionową szynę z lewej.
5. **Nagłówek:** waluta i ✕ w prawym górnym rogu; tożsamości kupca nie ma.
6. **Tekst:** nazwy ~3,7–4% wysokości (≈ 13–14 dp) — najbardziej czytelny
   z oglądanych.

### Wild Rift (Riot) — wzorzec jakości autora
Zrzut: `wildrift_items_catalog_tabs_list_detail.jpg` — katalog przedmiotów
z lobby ([ONE Esports](https://www.oneesports.gg/wild-rift/the-ultimate-guide-to-wild-rift-for-league-of-legends-players/)).
To nie jest sklep z meczu, ale ma ten sam szkielet.

1. **Układ:** pionowe kategorie z lewej (~10% szerokości) z przełącznikiem
   lista/siatka pod nimi. Środek to lista w 2 kolumnach (ikona z ceną na ikonie,
   nazwa, opis w jednym zdaniu). Z prawej panel szczegółów (~21%) z zakładkami
   „statystyki / drzewko”. Na dole pasek buildu i „RECOMMENDED”.
2. **Cofanie:** zakup w meczu da się cofnąć, dopóki nie oddalisz się od
   sklepikarza i nie wejdziesz w walkę — warunek odcięcia jest ten sam co
   zamknięcia sklepu (wiki LoL, strona
   [WR:Future's Market](https://wiki.leagueoflegends.com/en-us/WR:Future%27s_Market),
   cytat z wyników wyszukiwania). Sklep przebudowano w łatce 2.2
   ([wiki](https://wiki.leagueoflegends.com/en-us/V2.2_(Wild_Rift))).
   **Cofnij zamiast okna „Czy na pewno?”.**

### Eternium (Making Fun) — „samo się mieści”
Zrzut: `eternium_inventory_compare_popup_iphone.jpg` (iPhone 2778×1284,
proporcje jak S21 FE; [App Store](https://apps.apple.com/us/app/eternium/id579931356)).
Zrzutu samego kupca nie znalazłem.

1. **Układ ekwipunku:** jedna rama wpuszczona w świat — po bokach widać miasto.
   Nagłówek: tytuł · waluty z „+” · ✕. Z lewej karta bohatera: sloty w kolumnie
   obok modelu, broń pod nim, trzy kafle statystyk. Z prawej plecak (komórka
   ~11% wysokości). Przy prawej krawędzi **pionowa szyna ikon** (Ekwipunek /
   Rzemiosło / Mistrzostwo / Wygląd).
2. **Handel (z forum):** sprzedaż i odkup działają u każdego kupca w mieście
   („access to Sell and Buyback from all the other vendors”). Odkup działa tylko
   w bieżącej sesji i po tej samej cenie, za którą się sprzedało
   ([wątek](https://forum.makingfun.com/forum/eternium/feedback-suggestions/201616-equipment-lock-feature)).
   Funkcję odkupu dodano w 1.2.19 ([Update notes](https://mage-minions.fandom.com/wiki/Update_notes)).
3. **Porównanie:** okno przedmiotu nad siatką: statystyki, potem **„Compared to
   equipped Medium Bracer”** z różnicami na zielono/czerwono, na dole Equip /
   Add Socket / Reforge / Drop. Okno zasłania pół plecaka.
7. **Krytyka:** gracze przy zbiorczej sprzedaży sprzedawali założone przedmioty
   i prosili o blokadę
   ([wątek](https://forum.makingfun.com/forum/eternium/feedback-suggestions/59807-feature-lock-equipped-items)).
   ✕ stoi za blisko „+ gold”. Nie da się mieć naraz otwartego schowka, plecaka
   i ekwipunku
   ([UI feedback](https://forum.makingfun.com/forum/eternium/feedback-suggestions/190133-ui-feedback)).
   „Sklepy” nie są wyśrodkowane, przy pełnym plecaku legenda wypada poza ekran
   ([1.3.13](https://forum.makingfun.com/forum/eternium/feedback-suggestions/114378-feedback-bugs-1-3-13)).
   Gracze proszą o „sell all”
   ([wątek](https://forum.makingfun.com/forum/eternium/feedback-suggestions/149092-home-town-npc-suggestions)).

**Dlaczego „samo się mieści” (wniosek z zrzutu):** każdy ekran ma tę samą ramę,
nagłówek i szynę. Na szerszym ekranie rama dostaje marginesy, w których widać
świat — elementy się nie rozciągają. Kafle są duże i jest ich mało, a okno
pokazuje się tylko na żądanie.

### RuneScape 3 i Old School RuneScape (mobile = ten sam interfejs)
Zrzuty: `runescape3_shop_buy_sell_tabs_transaction_bar.png`,
`osrs_shop_quantity_mode_buttons.png` ([RS Wiki](https://runescape.wiki/w/Shop),
[OSRS Wiki](https://oldschool.runescape.wiki/w/Shop)).

- **RS3:** zakładki **Buy | Sell** przełączają jedną siatkę kart (ikona, nazwa,
  cena). Jest przełącznik siatka/lista. Na dole pasek transakcji: nazwa i opis,
  „Min −5 −1 [1] +1 +5 Max”, cena, „You have”, Buy.
- **OSRS:** sama siatka towaru. Ilość 1 / 5 / 10 / 50 wybiera się **trybem
  przed dotknięciem** przedmiotu. Według OSRS Wiki we wrześniu 2025
  **przyciski ilości w kliencie desktopowym ujednolicono z mobilnymi** — wzorzec
  powstał na telefonie. Ceny w rogach komórek są drobne; na telefonie to słabe
  miejsce.

### Exiled Kingdoms (FDG) — klasyczny „PC na telefonie”
Zrzuty: `exiled_kingdoms_phone_paperdoll_backpack_inline_detail.png`,
`exiled_kingdoms_phone_dialogue_right_half.png`
([Google Play](https://play.google.com/store/apps/details?id=net.fdgames.ek.android)).
Ekranu handlu nie znalazłem; ekwipunek pokazuje ich podejście do gęstości.

- **Ekwipunek:** trzy kolumny po ~1/3 — statystyki, manekin 4×4 z **opisem
  przedmiotu w miejscu pod manekinem** (Drop / Equip), plecak 4×5 ze złotem
  i dużym „Back” w prawym dolnym rogu. Komórka ~11% wysokości, tekst ~3,1%
  (≈ 11 dp).
- **Rozmowa:** prawa połowa ekranu (portret, kwestia, numerowane odpowiedzi),
  świat widoczny z lewej. Bliskie naszemu układowi.

### Stardew Valley (mobile), Albion Online, Titan Quest — tylko tekst
- **Stardew:** na telefonie ilość wybiera się suwakiem. Gracze go chwalą
  („mobile buying menu is amazing, I love the slider”), ale zaznaczają, że przy
  dużej sakiewce trudno kupić mało; prosili też o pole liczby. U jednego kupca
  suwaka brakowało i trzeba było klikać 2000 razy
  ([wątek 1](https://forums.stardewvalley.net/threads/buy-more-than-1-item-at-a-time-from-the-desert-merchant-mobile.29887/),
  [wątek 2](https://forums.stardewvalley.net/threads/bar-for-quantity-of-items-in-stores.7015/)).
  Sklep w wersji PC pokazuje portret i kwestię sklepikarza obok listy — to
  z mojej pamięci; zrzutu mobilnego nie zweryfikowałem.
- **Albion:** jeden interfejs na PC i telefon. Twórcy przyznali, że „your screen
  shouldn't be too small”, i telefonów oficjalnie nie wspierali
  ([wywiad](https://www.mmogames.com/articles/archives/albion-online-mobile-development-interview)).
  Rynek przebudowano w 2018
  ([GamingOnLinux](https://gamingonlinux.com/2018/07/the-albion-online-merlyn-update-is-now-officially-live-bringing-faction-warfare)),
  w 2023 doszło „Select / Unselect All” w zakładce Loadouts
  ([devtrackers](https://devtrackers.gg/albion/p/4de104c6-29-march-2023-beyond-the-veil-patch-7)).
- **Titan Quest (port PC):** w historii wersji jest „fixed a possible issue of
  accidentally 'selling' items outside of the merchant screen”
  ([App Store](https://apps.apple.com/us/app/titan-quest-hd/id1424977227)).
  Recenzent na TapTap: interfejs pod telefon „is terrible”
  ([TapTap](https://www.taptap.io/post/6621836)).

## 2. Pomiary porównawcze

| gra | wiersz/komórka (% wys.) | tekst nazw (% wys. ≈ dp) | widocznych pozycji | główny przycisk |
|---|---|---|---|---|
| Genshin | wiersz 12% | 3,7–4% ≈ 13–14 dp | 5 | prawy dół |
| Diablo Immortal | wiersz 12% | 2,5% ≈ 9 dp | 5 | prawy dół |
| BDM | wiersz 17%, komórka 11% | 3% ≈ 11 dp | 2 + 25 | prawy dół (Sell) |
| Lineage 2M | wiersz 11%, komórka 9% | 2,7% ≈ 10 dp | 6 + 24 | prawy dół (Confirm) |
| Wild Rift | wiersz 12% | 2,6–2,8% ≈ 10 dp | 8 (2 kol.) | prawy panel |
| Eternium | komórka 11% | 2,5% ≈ 9 dp | ~20 | w oknie |
| Exiled Kingdoms | komórka 11% | 3,1% ≈ 11 dp | 20 + 16 | prawy dół (Back) |
| **nasz sklep (dziś)** | **komórka 12% (70 j.)** | **1,9–2,2% ≈ 7–8 dp** | 20 + 20 | prawy dół |

**Wniosek:** rozmiar komórek mamy w normie. **Za mały jest tekst** — mniejszy niż
w każdej oglądanej grze, nawet w gęstych MMO (2,5–3%). Do 12–14 dp (19–23 j.)
dochodzi z nich tylko Genshin. Wiersz listy mieści się w 11–12% wysokości,
a nasze minimum dotyku 77 j. to 13,3% — trochę więcej niż u wzorców,
akceptowalnie.

**Trzy reguły powtarzają się wszędzie:** (1) **towar kupca to LISTA wierszy**
(ikona + nazwa + cena), a **siatka zostaje dla własnego plecaka** — wyjątkiem są
tylko porty PC (RS3, OSRS); (2) główny przycisk stoi w prawym dolnym rogu;
(3) karta szczegółów jest zadokowana, a nie wyskakuje — wyjątkiem jest Eternium.

## 3. Archetypy

| # | archetyp | kto | szerokość | mocne | słabe | 1×2 | porównanie |
|---|---|---|---|---|---|---|---|
| A | **Rama usług NPC** — kolumna kupca (portret, imię, pionowa lista usług) + lista + karta z przyciskiem | Diablo Immortal | 20 / 45 / 30% | tożsamość i kontekst NPC zostają; jedna rama na handel, naprawę i usługi; przycisk w strefie kciuka | kupno i sprzedaż nie są widoczne naraz; brak manekina | lista: wymiar bez znaczenia; plecak w zakładce Sprzedaż | w karcie |
| B | **Lada z oknem na świat** — towar z lewej, plecak z prawej, środek: świat / koszyk / karta | BDM, Lineage 2M | 30 / 35 / 33% | kupno i sprzedaż naraz; tap w plecak = sprzedaj; „Sell Junk”; świat i NPC widoczne | miejsce na kartę tylko w środku; trzy kolumny ściskają tekst | natywnie w siatce plecaka | w środku albo w oknie |
| C | **Katalog: lista + karta** — szyna kategorii, lista, karta | Genshin, Wild Rift | 10 / 55 / 30% | najczytelniejszy; szybkie zakupy | sprzedaż wymaga osobnego trybu; zero kontekstu NPC | lista | w karcie, z zakładkami |
| D | **Jedna siatka z przełącznikiem Kup / Sprzedaj / Odkup + pasek transakcji** | RS3, BDO PC, OSRS | 100% + pasek 25% wys. | zwarty; odkup jako zakładka | tryby mylą; ceny w komórkach drobne | siatka | w pasku |
| E | **PC: dwie siatki + manekin (+ karta)** | Titan Quest, Exiled Kingdoms, **nasz prototyp** | 4 × 25% | wszystko widać; przeciąganie | na telefonie każda kolumna za wąska → tekst 7–8 dp; manekin zjada 25% szerokości dla rzadkiej czynności | natywnie | przypięte w czwartej kolumnie |

## 4. Rekomendacja dla nas

**Kierunek: A, czyli rama usług zbudowana z rozmowy, z kartą jak w C i „Sprzedaj
śmieci” z B. Wariant B zostaje do porównania zrzutami A/B na S21 FE.** To
przedłużenie punktu 0 w `docs/ui_mobile_research.md` §7 („rozmowa jako RAMA
dla usług”) i D13 (pionowa szyna).

```
┌──────────────────────────────────────────────────────────────┬────────────┐
│ ▣ Kowal Radomir — „Za tę tarczę dam ci 40 groszy.”    ◉ 1240 │ ↩ Rozmowa  │ 64 j.
├──────────────────────────┬───────────────────────────────────┤ ▶ Handel   │
│ [Kup] [Sprzedaj] [Odkup 3]│ Miecz jednoręczny · stal · Dobry │   Naprawa  │
│ ⚔ Broń  ⛨ Pancerz  ◫ Tarcze│ 1×2 · Siła 6 ✓ · 85/85          │   Zadania  │
│ ▮ Topór brodaty     120 gr│ Obrażenia 9–14   ▲ +2 (vs Z. I)   │   Trening  │
│ ▮ Miecz jednoręczny 340 gr│                  ▼ −1 (vs Z. II)  │            │
│ ▮ Pawęż      1×2    410 gr│ Obciążenie 31,2 → 34,8 kg         │            │
│ ▮ …   (5 wierszy × 77 j.)  │ Plecak: miejsce 1×2 ✓            │            │
│                           │ [−] 1 [+]          [ KUP 340 gr ]│ Do widzenia│
└──────────────────────────┴───────────────────────────────────┴────────────┘
   ~400 j. (lewy kciuk)            ~560 j.                         ~220 j.
```

- **Budżet:** szyna 220 + lista 400 + karta 560 + odstępy ~77 = 1257 j.
  W pionie: pasek rozmówcy 64 j., zakładki 56 j., 5 wierszy × 77 j. z odstępami
  ≈ 417 j. Plecak 4×4 przy komórce 77 j. to ~332 × 332 j. — w trybie Sprzedaj
  mieści się w lewym panelu bez przewijania.
- **Szyna = kolumna z rozmowy.** Tap w „Handel” nie zamyka rozmowy: dolny pas
  zwija się do paska rozmówcy u góry, a kolumna odpowiedzi zostaje na miejscu,
  z podświetlonym „Handel”, „↩ Rozmowa” na górze i „Do widzenia” na dole.
  Podwidok nie ma własnego ✕ ani tytułu, więc znika szarpnięcie „rozmowa → modal
  z ✕”. Naprawa (tylko u wybranych kupców), Zadania i Trening to ta sama szyna.
- **Kciuki:** lewy przewija i wybiera z listy, prawy potwierdza „KUP” — on stoi
  przy szynie. Między „KUP” a „Do widzenia” musi być wyraźny odstęp; Eternium
  dostało skargę właśnie na sąsiedztwo ✕ i „+”.
- **Towar jako lista.** W wierszu 77 j. przedmiot 1×2 mieści się w natywnej
  pionowej ikonie 38×77, więc ikony po skosie 1:2 nie trzeba przycinać. Wiersz
  pokazuje glif „1×2” i znacznik, czy przedmiot zmieści się w plecaku. Brak
  Siły to czerwona kłódka, a nie ukrycie wiersza.
- **Karta zadokowana** (nie okno — w Eternium okno zasłania siatkę). Treść:
  nazwa, rodzaj · materiał · jakość, wymiar, wymagania, trwałość, cena. Pod
  nimi **porównanie per statystyka, kolorem** (D7). **Broń porównujemy
  z OBOMA zestawami** (D10). **Pancerz porównujemy z przedmiotem pod tym
  samym adresem slot + warstwa**, a pozostałe warstwy obszaru pokazujemy jako
  kontekst („Tułów: L1 przeszywanica · L2 kolczuga ← zastąpi · L3 —”). Do tego
  wiersz **obciążenia przed → po**, jak pasek wagi w Lineage 2M.
- **Manekin znika z ekranu handlu.** „Co noszę” mówi porównanie. Dla kupionych
  rzeczy karta ma „Załóż” — Eternium pokazuje, że gracz chce dopasowywać
  ekwipunek bez wychodzenia z ekranu. Pełny manekin otwiera się z szyny jako
  podwidok, jeśli autor go zechce.
- **Sprzedaż:** zakładka „Sprzedaj” pokazuje w lewym panelu prawdziwą siatkę
  plecaka (4 kolumny, 1×2), a karta w środku ma cenę skupu i „SPRZEDAJ”. Do tego
  „Sprzedaj śmieci” (BDM) i tryb multiselect z ptaszkami (kowal w Diablo
  Immortal). Założone i oznaczone przedmioty są **domyślnie wyłączone ze
  sprzedaży zbiorczej** (lekcja z Eternium).
- **Bez okien „Czy na pewno?”.** Zamiast nich: **„Cofnij”** do zamknięcia
  rozmowy (zwrot 1:1, jak w Wild Rift) i zakładka **„Odkup”** z rzeczami
  sprzedanymi w sesji (Eternium: ta sama cena; BDO: +10% — decyzja autora).
  Potwierdzenie tylko przy sprzedaży zbiorczej (z sumą) i przy przedmiotach
  jakości ≥ X.
- **Ilość** (strzały, mikstury, jedzenie): krokomierz −/+ z gotowymi wartościami
  (+5, „Max za grosz”, „Max do udźwigu” jak w Lineage 2M). Sam suwak to za mało
  (skargi w Stardew).
- **Przeciąganie** zostaje jako dodatek w trybie Sprzedaj: z plecaka na listę
  kupca. Nie jest główną drogą.
- **Tekst:** nazwy ≥ 23 j. (14 dp), drugi plan ≥ 19 j. (12 dp), ceny 23 j.
  pogrubione, przyciski ≥ 24 j.

**Koszty i ryzyka A:** kupna i sprzedaży nie widać naraz (jeden tap na
zakładce). Przeciąganie między stronami odpada. Szyna kosztuje ~220 j.
szerokości. **Wariant B do zrzutu A/B:** szyna zwija się do samych ikon (~84 j.),
a układ to lista 380 | karta 380 | plecak 340. Kupno i sprzedaż widać wtedy
naraz i działa przeciąganie, ale kosztem węższej karty (~236 dp) i ikon bez
podpisów w szynie.

## 5. Antywzorce

1. **Rozmowa znika i wyskakuje modal z własnym ✕ i tytułem** — dziś u nas.
   Diablo Immortal przynajmniej przenosi portret i imię do sklepu.
2. **Cztery równe kolumny na telefonie poziomym** — każda dostaje ~25%,
   a tekst kurczy się do 7–8 dp (nasz prototyp, porty PC).
3. **Ceny i ilości jako drobny napis w rogu komórki** (RS3 / OSRS) — na telefonie
   nieczytelne. Cena należy do wiersza.
4. **Okno porównania nad siatką, z której wybierasz** (Eternium) — zasłania to,
   co się porównuje.
5. **Sprzedaż zbiorcza bez blokady założonych rzeczy** (Eternium). To samo przy
   rozbiórce bez cofania — Eternium dało 5-sekundowe odliczanie dla legend.
6. **Zamknij tuż obok przycisku walutowego albo głównego** (Eternium).
7. **Ilość tylko suwakiem** (Stardew) albo tylko pojedynczymi tapnięciami
   („2000 razy”).
8. **Okno „Czy na pewno?” przy każdym zakupie** zamiast cofania (Wild Rift,
   odkup w Eternium/BDO).
9. **Akcje ukryte pod długim przytrzymaniem albo prawym klikiem** — dziedzictwo
   PC; na dotyku nikt ich nie znajdzie.
10. **„Sprzedaż” możliwa poza ekranem kupca** (błąd naprawiany w Titan Quest)
    — sprzedaż ma żyć wyłącznie w ramie handlu.
11. **Pulsujące oferty i kropki na ekranie handlu** (już w §4 naszego
    researchu UI).

## 6. Do decyzji autora (warianty, nie rozstrzygnięcia)

| sprawa | warianty |
|---|---|
| układ | A (szyna + lista + karta) / B (szyna ikon + trzy panele) — zrzut A/B 1:1 na S21 FE |
| odkup | cena 1:1 w sesji (Eternium) / +10% (BDO) / „Cofnij” do zamknięcia rozmowy + odkup z narzutem |
| manekin w handlu | brak (porównanie wystarcza) / podwidok z szyny / miniatura obszaru w karcie |
| tło | świat przyciemniony za ramą (Eternium, BDM) / pełne tło |
| kwestia kupca | stała / reagująca na akcję („Za tę tarczę dam ci…”) — wymaga tekstów (`docs/swiat.md`) |

## 7. Zrzuty

Wszystkie w tym katalogu (⭐ = najcenniejsze):
- ⭐ `diablo_immortal_merchant_npc_column_list_detail.jpg`
- ⭐ `diablo_immortal_blacksmith_salvage_multiselect.jpg`
- `diablo_immortal_dialog_band_shop_button.jpg`
- ⭐ `black_desert_mobile_npc_shop_split_world_visible_sell_junk.jpg`
- ⭐ `lineage2m_general_merchant_cart_weight_max_buttons.jpg`
- ⭐ `eternium_inventory_compare_popup_iphone.jpg`
- `genshin_mora_shop_list_detail.png`, `genshin_premium_shop_tab_rail.png`
- `wildrift_items_catalog_tabs_list_detail.jpg`
- `runescape3_shop_buy_sell_tabs_transaction_bar.png`, `osrs_shop_quantity_mode_buttons.png`
- `exiled_kingdoms_phone_paperdoll_backpack_inline_detail.png`, `exiled_kingdoms_phone_dialogue_right_half.png`
