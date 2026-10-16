---
typ: HISTORIA
domena: ui
tytul: Rozmowa jako rama usług — research gier mobilnych
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-13
---

> Surowy raport subagenta (2026-10-13). Synteza i decyzje: `docs/ui_mobile_research.md` §8. Zrzuty nie są w repo (scratchpad sesji).

# Rozmowa jako rama usług: przegląd RPG na telefon w poziomie

Data: 2026-10-13. Zakres: jak gry pokazują rozmowę z NPC i jak z niej przechodzą do usługi (handel, zadania, nauka, rzemiosło), oraz co z tego wynika dla naszego arkusza rozmowy (pas NPC na dole po lewej, kolumna odpowiedzi i usług po prawej).

Zrzuty leżą w tym samym katalogu. Ich nazwy podaję w nawiasach. Każde zdanie o konkretnej grze opiera się na zrzucie albo na adresie z sekcji „Źródła” na końcu.

**Ograniczenia, które zmieniają wnioski.** Strony gameuidatabase.com (Cloudflare), Reddit (captcha), Fandom i API sklepu Steam odrzucały automatyczne pobieranie. Nie obchodziłem tych zabezpieczeń. Zrzuty pochodzą więc z interfaceingame.com, wiki projektów, Wikipedii, Google Play i Blizzplanet. Dla Wuthering Waves, ZZZ, Tower of Fantasy, Albionu, Toram, Warspear, Lineage 2M, Ragnarok Origin, Tarisland, Grim Soul, Eternium, portów Beamdoga i KOTOR nie zdobyłem zrzutu rozmowy ani usługi. Na Google Play są tylko grafiki reklamowe. Tych gier nie oceniam (§6).

---

## 1. Najważniejsze wnioski

1. **Trzy rozwiązania dominują, a czwarte robi to dobrze.** HoYoverse (Genshin) i Witcher 3 zamieniają rozmowę na pełny ekran usługi. Black Desert, Dragon Quest XI i Stardew zostawiają głos NPC widoczny podczas handlu. ESO i Diablo Immortal trzymają tożsamość NPC i zakładki usług w **bocznej kolumnie**, a pozostałą część ekranu oddają usłudze. Czwarte rozwiązanie jest najbliższe temu, czego chce autor.
2. **Szerokość jest na telefonie 20:9 tańsza od wysokości.** Nasz ekran ma 1257×580 j. Pasek na górze o wysokości 48 dp (≈77 j.) zabiera 13% wysokości. Pionowa szyna z ikonami o tej samej szerokości dotykowej zabiera 6–8% szerokości. Siatki sklepu są ograniczone liczbą wierszy, więc szyna boczna kosztuje mniej niż pasek u góry.
3. **Przy 48 dp na wiersz kolumna mieści najwyżej 7 wierszy.** 580 j. podzielone przez 77 j. daje 7,5 wiersza. Grupowanie tematów (D14) jest więc warunkiem działania, a nie ozdobą. Kolumny nie da się zbudować z 7 tematów, usług, archiwum i „Żegnaj” naraz.
4. **Usługi muszą stać w stałym miejscu.** Witcher 3 zawsze stawia wyjście na końcu listy (howtomakeanrpg). BDO trzyma usługi na stałym pasku z klawiszami 1–5 (zrzuty BDO). U nas usługi są sortowane razem z tematami według pilności, więc „Handel” zmienia pozycję i gracz nie wyrobi sobie odruchu.
5. **„✕ wraca do rozmowy” to sprzeczne znaczenia.** Gracz uczy się, że ✕ zamyka. Pełnoekranowy sklep Genshina ma ✕ i walutę w górnym pasku, ale nie pokazuje imienia NPC. Kontekst rozmowy znika.

---

## 2. Przegląd gier

### 2.1 Gry mobilne i mobilne z pochodzenia

| gra | układ rozmowy | przejście do usługi | tożsamość NPC w usłudze | źródło |
|---|---|---|---|---|
| **Genshin Impact** | Imię i kwestia w pasie na dole na środku (≈10% wysokości). Opcje to wiersze z ikoną dymka w prawej ~31% szerokości, tuż nad pasem. Rozstaw wierszy ≈6,8% wysokości, czyli ≈39 j. u nas (≈24 dp). Świat widoczny, HUD schowany. | Opcja w rozmowie otwiera sklep na **pełnym ekranie**: rozmyte tło, lista po lewej, karta przedmiotu po prawej, waluta i ✕ u góry, „Purchase” na dole po prawej. | **Brak.** Jest tylko ikona metki w rogu. | `genshin_mobile_dialogue_options_right.png`, `genshin_mobile_npc_shop_full_replacement.png` |
| **Genshin: Katheryne** (NPC z samymi usługami) | Te same opcje, ale każda jest usługą: odbiór nagród za zlecenia i rangę, ekspedycje. | Każda usługa otwiera osobny ekran. | – | anibase (Katheryne) |
| **Honkai: Star Rail** | Ten sam schemat co Genshin. Opcje to wiersze ze strzałką na prawo od środka, imię i kwestia na dole na środku. Rozstaw wierszy ≈7,5% wysokości (≈27 dp). | – | – | interfaceingame: honkai-star-rail-dialogue |
| **Diablo Immortal** (alfa, iPad) | Dotknięcie NPC otwiera **pas na dole**: portret, imię, jedna kwestia, ok. 18% wysokości i 84% szerokości. Na prawej krawędzi pasa stoi **jeden przycisk usługi**: „SHOP”, a u NPC z kilkoma usługami „SERVICES”. Nad NPC jest dymek z kwestią. | Usługa zajmuje cały ekran. Po lewej ma **kolumnę tożsamości** (≈20% szerokości): ikona i nazwa „BLACKSMITH”, portret, pod nim **pionowe zakładki usług** (Salvage, Upgrade, Reforge, Rank Transfer). Waluta i ✕ są w prawym górnym rogu. | **Tak:** portret i nazwa przez cały czas trwania usługi. Inną usługę tego samego NPC wybiera się bez powrotu do rozmowy. | `diablo_immortal_npc_band_with_shop_button.jpg`, `diablo_immortal_blacksmith_identity_and_service_tabs.jpg`, Blizzplanet |
| **Exiled Kingdoms** | Rozmowa w **prawym panelu** (≈62% szerokości), po lewej widać świat. U góry portret, imię i tekst NPC z **pojęciem-hiperłączem** (niebieskie „abandoned mine”). Niżej numerowane odpowiedzi z dopiskami w nawiasach: „(Leave)”, „(Personality 1)”. Na dole „(Choose an option to continue)”. | Oferta zadania to odpowiedź w rozmowie („I'll do it” albo „(Leave)”), bez osobnego ekranu. | – | `exiled_kingdoms_mobile_dialogue_right_panel.png` |
| **OSRS mobile** | Rozmowa w okienku czatu. | **Usługa bez rozmowy:** przytrzymanie palca na NPC daje menu czynności (Talk-to, Trade, Board, Quick-Travel). Menu Entry Swapper ustawia, która czynność jest domyślna przy dotknięciu. | – | `osrs_mobile_npc_actions_entry_swapper.png`, OSRS Wiki: Mobile |
| **Elder Scrolls: Blades** | Etykieta NPC z ikoną dymka („MERCENARY”), kwestia, kreska, pod nią odpowiedź gracza. Wszystko wyśrodkowane w dolnej połowie ekranu. | – | – | interfaceingame: the-elder-scrolls-blades-dialogue |
| **Stardew Valley** | – | Sklep pokazuje **portret właściciela i jego kwestię wewnątrz ekranu sklepu**. Dokumentacja moddingu: pole Owners „wpływa na pokazany portret i dialog”. | **Tak** (portret i kwestia) | Stardew Wiki: Modding:Shops |
| **Octopath CotC** | Usługi są czasownikami na NPC („Path Actions”: Inquire, Purchase…), a „nie każdy NPC ma wszystkie”. | Czynność wybiera się bez drzewa rozmowy. | – | Octopath Wiki: Path Actions (CotC) |

### 2.2 PC i konsole, które pokazują różne podejścia

| gra | co robi | dlaczego to ważne dla telefonu | źródło |
|---|---|---|---|
| **Black Desert** (PC, nowy interfejs) | Rozmowa zostawia **stały pasek usług na dole** (≈10% wysokości): Go Back, Chat, Shop lub Storage z klawiszami 1–5, Conversation (2/8), Give Gift, Exit (ESC). Okno usługi otwiera się **nad paskiem**. Napis z kwestią NPC i kamera na NPC zostają, a imię z rolą („<Material Vendor> Zaaira”, Amity) wisi w lewym górnym rogu. Między usługami przechodzi się jednym dotknięciem. **„Go Back” i „Exit” to dwa różne przyciski.** | To najczystszy przykład „rozmowy jako ramy”. Na PC 16:9 jest miejsce na pasek, na telefonie 20:9 trzeba go obrócić w pion. | `bdo_pc_npc_shop_service_bar_persists.jpg`, `bdo_pc_npc_service_bar_persists_over_storage.png`, BDO NA/EU Wiki |
| **Elder Scrolls Online** | Kamera zostaje na NPC (lewe ~75% ekranu), a sklep to **kolumna po prawej** (≈21% szerokości) z zakładkami-ikonami u góry: kup, sprzedaj, odkup, napraw. U dołu „Repair All”, „Buy” i „Exit”. | Dowód, że usługa może żyć w prawej kolumnie, a NPC zostaje w kadrze. | `eso_vendor_right_column_npc_on_camera.jpg` |
| **Dragon Quest XI** | Okno sklepu nachodzi na ekran, a **okno dialogu na dole zostaje** („What do you need?”, ≈17% wysokości). | Kupiec mówi przez cały czas handlu. Ceną jest wysokość. | `dq11_shop_dialogue_band_persists.jpg` |
| **Witcher 3** | Opcje rozmowy to kolumna na prawo od środka. Żółte opcje popychają rozmowę i stoją u góry. **Wyjście jest zawsze ostatnie.** Opcje zmieniające stan mają ikonę: sakiewka oznacza sklep, dymek z X wyjście. Ostatnia kwestia NPC zostaje na ekranie, gdy gracz wybiera. Sklep zajmuje cały ekran. Strona kupca ma etykietę roli („HERBALIST”) i jego pieniądze. | Wzór dla ikon typu opcji i stałego miejsca wyjścia. | `witcher3_shop_from_dialogue.jpg`, howtomakeanrpg, techwiser |
| **World of Warcraft** | Okno kupca ma portret i imię NPC u góry, a zakładki Merchant i Buyback u dołu ramki. Od Wrath of the Lich King **wiele „gadanych” kwestii kupców jest domyślnie ukrytych**, więc kliknięcie kupca otwiera handel od razu. | Blizzard uznał, że przy NPC z jedną usługą rozmowa jest tarciem. | `wow_merchant_frame_npc_portrait.png`, Warcraft Wiki: Flavor text |
| **Diablo IV** | Mała ramka rozmowy na środku z imieniem NPC, wierszem zadania z ikoną, odpowiedzią i przyciskiem „Fermer” (Zamknij). Sklep ma **panel tożsamości po lewej**: portret, „Marchand – Armes”, licznik dostawy, odkup. Pośrodku widać świat, po prawej jest postać i ekwipunek. | Tożsamość kupca jest stałym elementem ekranu sklepu. | `diablo4_vendor_npc_identity_panel.png`, `diablo4_gossip_window_quest_row_close.png` |
| **Morrowind** | Tematy jako lista obok tekstu, nowe pojęcia jako hiperłącza w treści. Usługi (handel, czary, szkolenie) to „dodatkowe polecenia w oknie rozmowy”. Gracze narzekają, że **nie widać, co już przeczytane**. | Wzór słownika pojęć i usług w tej samej kolumnie. Zarazem przestroga przed długą, płaską listą. | UESP: Morrowind:NPCs, TV Tropes, forum Nexus |
| **Gothic** | Handel otwiera kwestia „Show me your goods”, która prowadzi do stołu handlu z dwoma ekwipunkami. | Usługa jest kwestią w rozmowie, czyli dokładnie nasz model. | gothic.wiki: Trade |
| **Disco Elysium** | Cała rozmowa w **prawej pionowej kolumnie**, wzorowanej świadomie na Twitterze: tekst płynie w górę, odpowiedzi są na dole kolumny. Kotaku: tekst do klikania ląduje w prawym dolnym rogu, tam gdzie jest prawa ręka. Krytyka: na konsolach tekst bywał nieczytelny, potem dodano powiększanie czcionki. | Uzasadnienie prawej kolumny i ostrzeżenie o rozmiarze czcionki. | `disco_elysium_right_column_lowres.jpg`, 80.lv, Kotaku, Can I Play That |

### 2.3 Zadania, nauka i grupowanie tematów

- **Oferta zadania.** Exiled Kingdoms i Gothic przyjmują zadanie odpowiedzią w rozmowie. „Nie” jest zwykłą odpowiedzią z dopiskiem „(Leave)”. Diablo IV pokazuje zadanie jako wiersz z ikoną w ramce rozmowy i ma osobne „Zamknij”. W BDO licznik „Conversation (2/8)” na pasku mówi, ile wątków zostało do omówienia.
- **Nauka i rzemiosło.** Kowal z Diablo Immortal ma najlepszy mobilny przykład: lista przedmiotów, szczegóły, wymagane materiały, a na dole jeden przycisk z ceną w treści („UPGRADE ● 22000”). Zakładki usług tego NPC są w kolumnie tożsamości.
- **Wiele pytań.** Emily Short (Game Developer, 2009) opisuje model „piasta i szprychy”. Daje swobodę, ale „prowadzi do powtórzeń” i „wrażenia nieprawdopodobnie cierpliwego NPC”. Opisuje cztery sposoby postępowania z omówionym tematem: usunąć go (wtedy potrzebny jest dziennik), zostawić („sztywne”), dopisać wersję na powtórkę albo usunąć i dać zbiorczy temat-streszczenie. Wymuszony powrót do piasty po każdej odpowiedzi nazywa nienaturalnym. Morrowind pokazuje skutek płaskiej listy bez stanu „przeczytane”.
- **Krytyka graczy.** O Genshinie piszą, że opcje i tak prowadzą do tego samego, a rozmów nie da się szybko przewinąć. Pomijanie weszło tylko w spotkaniach z postaciami (od 4.5), a w 2026 przyspieszono klikanie przez rozmowy (Dexerto FR, PCInvasion, esports.gg). U nas tematy są pytaniami o wiedzę, a nie pozornymi wyborami, i tak powinno zostać.

---

## 3. Cztery wzorce przejścia „rozmowa → usługa” na telefonie w poziomie

Koszty podaję dla naszego ekranu (1257×580 j., 48 dp ≈ 77 j.).

| wzorzec | jak wygląda | zalety | wady | koszt | kto go używa |
|---|---|---|---|---|---|
| **A. Szyna boczna** | Kolumna rozmowy po prawej nie znika. W trybie usługi zwęża się do szyny: portret i imię, zakładka „Rozmowa”, usługi, „Żegnaj”. Usługa wypełnia resztę ekranu. | Rama jest ciągła, nie przybywa ✕. Między usługami przechodzi się bez powrotu. Szyna jest w strefie prawego kciuka. Nie zabiera wysokości. | Zabiera szerokość. Kolumnę trzeba zbudować jako jeden składnik z dwiema szerokościami. Przycisk „Kup” stoi blisko „Żegnaj”. | Rozmowa: 25–30% szerokości (jak dziś). Usługa: szyna z ikoną i krótkim podpisem ≈100–120 j. (8–10%), usługa dostaje ≈1130 j. **Wysokość 0.** | ESO (kolumna sklepu po prawej), Diablo Immortal (kolumna tożsamości z zakładkami, po lewej), Exiled Kingdoms i Disco Elysium (rozmowa w prawym panelu), Morrowind (usługi w kolumnie tematów) |
| **B. Pasek tożsamości u góry** | U góry pasek z imieniem NPC, jedną kwestią, zakładkami usług, walutą i wyjściem. Usługa pod spodem. | Znany z ekranów sklepów. Mieści walutę. | Zabiera wysokość, której jest najmniej. Na telefonie w poziomie górny pasek jest daleko od kciuków. Przejście z prawej kolumny na górny pasek zmienia geometrię, więc rama przestaje się czytać jako ta sama. | ≈77 j. wysokości (13%) | Witcher 3 (nagłówek sklepu z przełącznikiem), Genshin (pasek z walutą i ✕, bez NPC), WoW (portret i imię nad listą) |
| **C. Pas NPC zostaje na dole** | Pas z kwestią NPC (albo pasek usług) zostaje pod usługą. | NPC mówi przez cały czas, czuć kupca. | Zabiera 15–30% wysokości. Sklep z siatką plecaka się nie zmieści. | 90–175 j. wysokości | Dragon Quest XI, Black Desert (pasek usług i napis), Diablo Immortal (pas z „SHOP”, ale tylko przed usługą), Stardew (portret i kwestia w sklepie) |
| **D. Pełna podmiana z nagłówkiem** | Rozmowa znika, usługa ma własny tytuł, ✕ i walutę. | Najprostszy w budowie. Usługa ma cały ekran. | Właśnie to autor nazwał dziwnym: rozmowa, potem modal z ✕. Ginie tożsamość NPC (Genshin). ✕ znaczy dwie rzeczy. | Cały ekran | Genshin, Witcher 3, Diablo Immortal (z kolumną tożsamości, więc hybryda A i D) |
| *(dodatkowo)* **0. Usługa bez rozmowy** | Czynność bezpośrednio na NPC: przytrzymanie palca, domyślne dotknięcie, przycisk w pasie. | Najszybsze dla stałego klienta. | Odbiera rozmowie rolę. | – | OSRS (Trade i swapper), WoW (ukryte kwestie kupców), Octopath CotC (czasowniki), Diablo Immortal („SHOP” w pasie) |

---

## 4. Rekomendacja dla naszej gry

### 4.1 Decyzja: wzorzec A, a rozmowa to zakładka nr 0

**Jedna prawa kolumna, dwie szerokości.** Rozmowa jest pierwszą zakładką NPC, a usługi kolejnymi zakładkami tej samej ramy. Gracz nie „wychodzi z rozmowy do sklepu”, tylko przełącza zakładkę u tego samego człowieka. Tak robią BDO (pasek), Diablo Immortal (kolumna z zakładkami) i ESO (zakładki w kolumnie). Rama się nie zmienia, więc nie potrzeba nowego tytułu ani nowego ✕.

**Tryb rozmowy** (wysokości przy wierszu 48 dp, czyli 77 j.):
```
 [pas NPC: imię + kwestia, dół-lewo, ≤1/3 wys.]   │ Zioła · 3 nowe        ← podpis, nie wiersz
                                                    │ ! Czy Kirka się znalazła?   (pilne)
                                                    │   Zioła ›            •3
                                                    │   Okolica ›          •1
                                                    │ ───────────────
                                                    │ [🪙 Handel] [⚔ Nauka]       ← stały blok usług
                                                    │   Omówione (12)
                                                    │ ✕ Żegnaj
```
**Tryb usługi** (po dotknięciu „Handel”):
```
 [ panel usługi: ~1130 j. szerokości, cała wysokość, bez tytułu i bez ✕ ]  │ [portret]
                                                                           │ 💬 Rozmowa
                                                                           │ ─────
                                                                           │ 🪙 Handel ◀ aktywna
                                                                           │ ⚔ Nauka
                                                                           │ ─────
                                                                           │ ✕ Żegnaj
```

**Przejście** trwa ok. 200–250 ms i nie może wyglądać jak nowe okno:
- pas NPC zjeżdża w dół,
- wiersze tematów gasną,
- kolumna zwęża się do szyny,
- panel usługi wsuwa się od lewej na przyciemniony świat.

Usługi mają **te same ikony i tę samą kolejność** w obu trybach. Blok usług stoi nisko w kolumnie, więc w szynie ikony prawie nie zmieniają wysokości. Odruch kciuka zostaje.

**Głos NPC w trybie usługi.** Pas zabiera wysokość, więc nie zostaje. W zamian portret na górze szyny i **krótkie dymki** po zdarzeniach (kupno, sprzedaż, brak pieniędzy), 1 linijka, ok. 2,5 s. To daje to, co DQ XI, BDO i Stardew, bez stałego kosztu wysokości.

### 4.2 Wstecz, wyjście i przełączanie

| akcja | zachowanie |
|---|---|
| Inna usługa w szynie | Natychmiastowa podmiana panelu. Stan każdej zakładki trwa do końca rozmowy: przewinięcie, wybrany przedmiot, koszyk. Bez pytań, chyba że w koszyku jest niezatwierdzona transakcja. Wtedy koszyk się zachowuje, nie znika. |
| „Rozmowa” albo portret w szynie | Powrót do rozmowy **dokładnie w to miejsce, w którym gracz był** (także wewnątrz grupy). |
| „Żegnaj” | Koniec wszystkiego, zawsze ostatni wiersz w kolumnie i w szynie (wzór Witchera). Bez potwierdzenia, bo rozmowę łatwo otworzyć ponownie. |
| **Android Wstecz** | Zdejmuje jeden poziom ze stosu, od najgłębszego: okienko ilości lub potwierdzenia, potem usługa → Rozmowa, potem grupa tematów → korzeń rozmowy, a w korzeniu Wstecz = Żegnaj. Zgodnie z dokumentacją Androida Wstecz cofa przez historię ekranów. Warto przygotować podgląd celu pod predictive back z Androida 13+. |
| ✕ | **Nie ma go w ramie rozmowy.** Jedyne ✕ to „✕ Żegnaj”, które naprawdę zamyka. |

**Ryzyko:** „Żegnaj” na dole szyny sąsiaduje z przyciskiem zatwierdzenia w sklepie na dole po prawej. Lekarstwo:
- ≥16 dp przerwy,
- „Kup/Sprzedaj” pod kartą przedmiotu, a nie przy krawędzi szyny,
- „Żegnaj” w stylu cichym, zatwierdzenie w stylu pełnym.

### 4.3 Zadania i nauka w tej ramie

- **Oferta i oddanie zadania zostają w rozmowie.** To moment fabularny, tak jak w Exiled Kingdoms i Gothicu. Nad odpowiedziami („Biorę to”, „Opowiedz więcej”, „Nie teraz”) pojawia się mała **karta zadania**: cel i ikony nagrody. Oddanie zaczyna się od pilnego wiersza „!”, potem jest kwestia NPC i pokaz nagrody bez osobnego ekranu.
- **Zakładka „Zadania” to rejestr** z listą i szczegółami: dostępne, w toku, do oddania. Przyciski „Porozmawiaj o tym” i „Oddaj” **przeskakują do zakładki Rozmowa na właściwy temat**, zamiast przyjmować zadanie w tabeli. Narracja zostaje w rozmowie, a porządek w rejestrze.
- **Nauka i Biegłość** w układzie lista, szczegóły i jeden przycisk z ceną w treści („Naucz się · 120 zł”), jak u kowala z Diablo Immortal.

### 4.4 Grupowanie tematów (D14)

- **Jeden poziom zagłębienia.** Grupa to wiersz „Zioła ›” z licznikiem nieprzeczytanych („•3”). Głębsze drzewa nie mieszczą się w 7 wierszach i powtarzają błąd piasty, o którym pisze Short.
- **Wewnątrz grupy:**
  - podpis-okruszek u góry („Zioła · 3 nowe”) jako tekst, nie wiersz, żeby nie zabierał miejsca,
  - tematy,
  - na dole **„‹ Zmień temat”** tuż nad „Żegnaj”, zgodnie z życzeniem autora. To strefa kciuka, ale wymaga odstępu od „Żegnaj”,
  - Android Wstecz robi to samo co „‹ Zmień temat”.
- **Omówione tematy znikają z grup i trafiają do „Omówione (n)”**, czyli dzisiejszego „Wróć do tematu…”. Short pokazuje, że zostawianie omówionych tematów na liście jest „sztywne”, a usuwanie wymaga dziennika. Nasz globalny zbiór zadanych pytań jest takim dziennikiem. Pusta grupa znika.
- **Kolejność:** pilne pytania z zadań u góry, potem grupy według liczby nowych, **potem stały blok usług**, „Omówione”, „Żegnaj”. Usługi nie biorą udziału w sortowaniu według pilności. Wykrzyknik pilności może świecić na ikonie usługi (np. „Zadania •”), ale ikona nie zmienia miejsca.
- **Budżet wysokości:** podpis (≈30 j.), 1–2 pilne pytania, 2–3 grupy, usługi jako chipy po 2 w rzędzie (1–2 rzędy), „Omówione”, „Żegnaj”. Wychodzi ≤7 wierszy po 77 j.

  Dla porównania HoYoverse wydaje gry z rozstawem opcji ok. 7% wysokości ekranu (≈25–27 dp). Proponuję:
  - **48 dp** dla usług i „Żegnaj” (skutkowe),
  - **40–44 dp** dla tematów (tanie do cofnięcia).

  Tematów nigdy nie przewijamy w kolumnie. Gdy ich za dużo, wyższy poziom grupuje je mocniej.

### 4.5 Ścieżka skrótu dla stałego klienta (opcjonalnie, później)

WoW ukrył kwestie kupców, OSRS daje „Trade” od razu, a Diablo Immortal stawia „SHOP” na pasie. Wszystkie trzy uznały, że przy n-tej wizycie rozmowa jest tarciem. U nas wystarczy, że usługi stoją zawsze w tym samym miejscu: rozmowa + „Handel” to dwa dotknięcia. Przytrzymanie palca na NPC jako bezpośrednie wejście w usługę zostawiam na decyzję po odbiorze.

### 4.6 Koszty tej rekomendacji

- Sklep dostaje ok. 1130 j. zamiast 1257 j. Jeśli siatka kupca, plecak, założony sprzęt i karta przedmiotu się nie mieszczą, najpierw przenieść założony sprzęt do zakładki plecaka albo kartę przedmiotu do nakładki. Dopiero potem rozważać ukrywanie szyny (zwinięcie do samej kolumny ikon ok. 90 j. = 56 dp).
- Kolumna musi być **jednym składnikiem z maszyną stanów** (rozmowa szeroka ↔ szyna wąska), a nie dwoma osobnymi interfejsami. To praca w `NpcDialog`.
- Koszt, który biorę: usługa nie ma pełnej szerokości ekranu, w zamian rama jest ciągła.

---

## 5. Antywzorce

1. **Modal na modalu z własnym ✕ o innym znaczeniu.** To dzisiejszy problem: ✕ w sklepie wraca, a gracz rozumie ✕ jako „zamknij”.
2. **Usługa bez tożsamości NPC.** Sklep Genshina ma ikonę metki, a nie kupca.
3. **Usługi sortowane razem z tematami według pilności**, przez co skaczą po kolumnie. Odruch kciuka nie powstaje (por. stałe miejsce wyjścia w Witcherze i stały pasek BDO).
4. **Długa płaska lista tematów bez stanu przeczytane/nieprzeczytane** (Morrowind, skarga na forum Nexus).
5. **Wymuszony powrót do piasty po każdej odpowiedzi i nieśmiertelne tematy.** Daje efekt „nieprawdopodobnie cierpliwego NPC” (Short).
6. **Pasek u góry na ekranie 20:9.** Zabiera 13% wysokości, której jest najmniej, i jest poza strefą kciuka.
7. **„Żegnaj” tuż przy „Kup”** w prawym dolnym rogu.
8. **Wstecz, które z usługi zamyka całą rozmowę** i gubi miejsce w grupie tematów.
9. **Pozorne wybory** prowadzące do tego samego (zarzut wobec Genshina). U nas tematy są wiedzą, nie „wyborem”, i tak niech zostanie.
10. **Za mały tekst rozmowy.** Disco Elysium musiało dodać powiększanie czcionki. Nasze 13 dp to dolna granica: pas Genshina ma ok. 3,5% wysokości, czyli ≈13–15 dp.
11. **Czarne przejście albo zgaszenie świata przy wejściu w usługę.** Zrywa wrażenie, że to wciąż ta sama rozmowa w tym samym miejscu.

---

## 6. Czego nie zweryfikowano

Wuthering Waves, Zenless Zone Zero, Tower of Fantasy, Albion Online mobile, Toram, Warspear, Lineage 2M, Ragnarok Origin, Tarisland, Grim Soul, Eternium, porty Beamdoga (BG/NWN/Planescape), KOTOR mobile, Kingdom Come. Brak dostępnych zrzutów rozmowy lub usługi: Google Play pokazuje grafiki reklamowe, a wiki i fora odrzucały automatyczne pobieranie. Nie wyciągam o nich wniosków. Dane Diablo Immortal pochodzą z zamkniętej alfy z 2021 (iPad, 4:3). Wersja wydana mogła się różnić.

---

## 7. Zrzuty w tym katalogu

| plik | co pokazuje |
|---|---|
| ⭐ `bdo_pc_npc_shop_service_bar_persists.jpg` | Stały pasek usług BDO (Go Back / Chat / Shop / Conversation / Exit) i sklep nad nim, imię z rolą w lewym górnym rogu |
| `bdo_pc_npc_service_bar_persists_over_storage.png` | To samo przy magazynierze: więcej usług na pasku (Currency Exchange, Storage, Transport, Give Gift) |
| ⭐ `diablo_immortal_blacksmith_identity_and_service_tabs.jpg` | Mobilny ekran usługi: kolumna z portretem i nazwą, pionowe zakładki usług tego NPC, lista, szczegóły, przycisk z ceną |
| ⭐ `diablo_immortal_npc_band_with_shop_button.jpg` | Pas NPC na dole (portret, imię, kwestia) z jednym przyciskiem „SHOP” na krawędzi |
| ⭐ `eso_vendor_right_column_npc_on_camera.jpg` | Sklep jako prawa kolumna z zakładkami-ikonami, NPC zostaje w kadrze |
| ⭐ `exiled_kingdoms_mobile_dialogue_right_panel.png` | Mobilna rozmowa w prawym panelu: hiperłącze-pojęcie, numerowane odpowiedzi, „(Leave)” |
| ⭐ `genshin_mobile_dialogue_options_right.png` | Opcje-wiersze z ikoną po prawej, imię i kwestia na dole na środku |
| `genshin_mobile_npc_shop_full_replacement.png` | Sklep NPC na pełnym ekranie: ✕ i waluta u góry, bez imienia NPC |
| `dq11_shop_dialogue_band_persists.jpg` | Okno dialogu zostaje pod sklepem |
| `witcher3_shop_from_dialogue.jpg` | Pełnoekranowy sklep z etykietą roli kupca i jego pieniędzmi |
| `wow_merchant_frame_npc_portrait.png` | Okno kupca z portretem i imieniem, zakładki Merchant i Buyback |
| `diablo4_vendor_npc_identity_panel.png` | Panel tożsamości kupca po lewej, świat pośrodku, ekwipunek po prawej |
| `diablo4_gossip_window_quest_row_close.png` | Mała ramka rozmowy: wiersz zadania z ikoną, odpowiedź, „Zamknij” |
| `osrs_mobile_npc_actions_entry_swapper.png` | Czynności na NPC z przytrzymania palca i wybór domyślnej |
| `disco_elysium_right_column_lowres.jpg` | Rozmowa w prawej kolumnie (niska rozdzielczość, z Wikipedii) |

---

## Źródła

- interfaceingame.com: Genshin Impact Mobile (dialogue-2, purchase-sword), Honkai: Star Rail (dialogue), Witcher 3 (shop), TES Blades (dialogue), ESO (vendor), DQ XI (shop), Black Desert (npc-shop), Diablo IV beta (vendor, quest-dialogue), WoW (vendor) — https://interfaceingame.com/games/genshin-impact-mobile/ · https://interfaceingame.com/games/honkai-star-rail/ · https://interfaceingame.com/games/the-witcher-3-wild-hunt/ · pliki: https://interfaceingame.com/wp-content/uploads/…
- Black Desert NA/EU Wiki (magazyn, opcje interakcji z klawiszami) — https://www.naeu.playblackdesert.com/en-US/Wiki?wikiNo=43
- Blizzplanet, Diablo Immortal vendors & merchants (zrzuty z zamkniętej alfy) — https://diablo.blizzplanet.com/blog/comments/diablo-immortal-vendors-merchants
- Exiled Kingdoms, Google Play — https://play.google.com/store/apps/details?id=net.fdgames.ek.android
- OSRS Wiki: Mobile (Menu Entry Swapper, przytrzymanie palca) — https://oldschool.runescape.wiki/w/Mobile
- Stardew Valley Wiki: Modding:Shops (Owners, Portrait, Dialogues) — https://stardewvalleywiki.com/Modding:Shops
- Warcraft Wiki: Flavor text (ukryte kwestie kupców od WotLK) — https://warcraft.wiki.gg/wiki/Flavor_text
- How to Make an RPG, „Witcher Three Conversation” — https://howtomakeanrpg.com/r/a/witcher-three-conversation.html
- Techwiser, ikony Witcher 3 Remastered — https://techwiser.com/the-witcher-3-wild-hunt-remastered-icons/
- UESP: Morrowind:NPCs — https://en.uesp.net/wiki/Morrowind:NPCs · TV Tropes: Keywords Conversation — https://tvtropes.org/pmwiki/pmwiki.php/Main/KeywordsConversation · Nexus forum — https://forums.nexusmods.com/topic/5400865-morrowind-dialogue-question
- Gothic Wiki: Trade — https://www.gothic.wiki/w/Trade
- Emily Short, „Analysis: Conversation Design In Games”, Game Developer, 2009 — https://www.gamedeveloper.com/game-platforms/analysis-conversation-design-in-games
- Disco Elysium: Wikipedia (zrzut) — https://en.wikipedia.org/wiki/Disco_Elysium · 80.lv — https://80.lv/articles/disco-elysium-working-on-ui-design · Kotaku — https://kotaku.com/disco-elysiums-dialogue-system-is-as-addictive-as-any-s-1841046831 · Can I Play That — https://caniplaythat.com/2022/06/30/disco-elysium-the-final-cut-pc-accessibility-update-implements-dyslexic-fonts/
- Genshin, krytyka rozmów: Dexerto FR — https://www.dexerto.fr/genshin-impact/les-joueurs-de-genshin-impact-reclament-ajout-fonctionnalite-indispensable-1466810/ · PCInvasion — https://www.pcinvasion.com/?p=426834 · esports.gg — https://esports.gg/news/genshin-impact/dialogue-skip-system/
- Katheryne (Genshin) — https://anibase.net/en/character/lKNOq/Katheryne
- Octopath CotC, Path Actions — https://octopathtraveler.fandom.com/wiki/Path_Actions_(Champions_of_the_Continent)
- Android, nawigacja Wstecz i predictive back — https://developer.android.com/guide/navigation/custom-back
