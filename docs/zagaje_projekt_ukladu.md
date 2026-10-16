---
typ: OPERACYJNE
domena: world
tytul: Zagaje — audyt układu i projekt do akceptacji (droga z placem, zagrody wg majątku)
stan: zywy
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# Zagaje — audyt i projekt układu (✅ wdrożony K1–K5, 2026-10-10)

> ⭐ **Co stoi na mapie — sekcja „Stan kroków”.** Części A–E to audyt i plan
> sprzed wdrożenia; tam, gdzie się różnią (np. młyn przeniesiony w NW,
> moczydło przy młynówce zamiast za potokiem), wygrywa „Stan kroków”.

> **Czym jest:** odpowiedź na brief GPT (sekcja „Zadanie dla Claude'a"),
> sprawdzona na ŻYWEJ mapie `village-zagaje.tmj` i na kanonie
> (`wioska_plan.md` §3/§5, dialogi w `GameConfig.ts`). Zasady:
> `docs/decyzje/2026-10-10-zagaje-droga-plac-krokowo.md`.
> ✅ **K1 i K2 WDROŻONE 2026-10-10** (sekcja „Stan kroków" na końcu) — wg
> **planu B** (niżej). ⚠ Schemat B z sekcji „Proponowany układ" jest
> NIEAKTUALNY: autor przyjął wersję z podwórzami przy trakcie i obwodem płotów.
> Oznaczenia: **[KONFLIKT]** — rozjazd z kanonem do rozstrzygnięcia,
> **[PROPOZYCJA]** — nowy mieszkaniec / funkcja.

## A. Audyt obecnego układu (odczyt mapy, nie pamięć)

Stan dziś (1 znak = 4 kafle; `H` chałupa, `S` stodoła, `G` gospodarczy,
`K` karczma, `W` wiata, `=` droga, `~` woda, `:` pole, `#` płot, `T` las,
litery małe = NPC):

```
     0  1 2  3 4  5 6  7 8  9 0  1 2
  28 ~~.............=KKKK####..T...TT
  36 ~~.=============KKKK..........TT
  40 ~~.==.SSS##HHH===..#####.......T
  48 ~~.==.SSSGG==/.T.=bHH===SS....TT
  52 ~~.==SSSGGHHH#~~.==HHGGGSS....TT     ← sadzawka na nawsiu (~~)
  60 ~~HH=SSSGG==/..snu=OHH==SSS...TT     ← owal drogi wokół nawsia
  68 ~GGM.SSS=kHHm@....=/==GGSSS...TT
  76 ~~~~~SSSGG####.T.=gHH===SS.....T
  84 T...~.SSSGGHHw=.==.##GGG##.....T
  92 T...~.########.=WWW...........T.
 100 TT.~~...T...T..===R==..........T
```

**Co działa:** trakt z północy przechodzi w drogę lasu; karczma przy
północnym wjeździe; kuźnia przy południowym, poza zabudową; młyn ze stawem
i młynówką na zachodzie, z boczną drogą (y 36); błonia przed lasem;
zielarka na uboczu przy lesie; Gniewko z owczarnią przy ugorze. Pierścień
stodół zamyka wieś od pól — dobra cecha obronna, do zachowania w duchu.

**Co jest złe:**
1. **Rondo.** Trakt rozwidla się na y 41–91 w owal ~24 × 50 kafli wokół
   pustego nawsia; sadzawka z kafli wody czyta się jak basen.
2. **Każda z 7 zagród ma IDENTYCZNY program:** chałupa 7×6 + stodoła 8×11 +
   gospodarczy 8×5 + wrota. Sołtys ≈ Marko ≈ wdowa; **kowal (bez ziemi ornej)
   i stolarz mają pełne stodoły**; Dobek NIE ma największej stodoły. To
   jest źródło „za dużo budynków" (22 w zagrodach).
3. **Pola nie należą do nikogo:** dwa wspólne bloki na północy
   (~1100 kafli), za zagrodami tylko stodoły. Brak przejść na tył.
4. **Kowal mieszka w środku wsi** (chałupa wschód, y 73), kuźnia poza nią.
5. **Brak:** składów drewna, ogrodów, sadu sołtysa, moczydła lnu, miejsca
   gęsi, stodoły dla przejezdnych przy karczmie (dialog Bogusza: „śpią
   w stodole"), drwali, łąki kośnej (siano na zimę dla 5 krów, 2 wołów,
   2 koni).
6. **[KONFLIKT z kartami]** Zofia mieszka na północy (y 54), a jej zagon
   ma leżeć „w rogu niwy południowej, przy samej ścianie lasu" (§5.3);
   najbardziej na południe mieszka Witek.

## B. Proponowany układ

```
     0  1 2  3 4  5 6  7 8  9 0  1 2
   4 ~~...""""""""""=.,,,,,,,,,.....T    " łąka kośna (siano)   , ugór — wypas Gniewka
  16 ~~...""""""""""=.,,,,,,,,,.WWHHT    owczarnia + Gniewko (zostają)
  28 ~~.............=KKKKcccc.......T    karczma + chmielnik (zostają)
  36 ~~.=============KKKKcccc.......T    boczna droga do młyna (zostaje)
  40 ~~..:::::SSHHH.=...cSScc+++....T    1 Dobek: stodoła L przy drodze | stodoła przejezdnych
  48 ~~..:::::SSSw..=...HHWWD+++....T    5 Sobek: warsztat W + skład drewna D | + rezerwa
  52 ~~...::::oHHHpp=pppHH...+++::::T    2 Witek | plac p po obu stronach traktu
  60 ~~HH.::::wwwppp=OppHHHJJSS:::::T    młynarz | O studnia | 6 sołtys + sad J + pas pola
  68 ~MMM...::oHHHpp=ppp...GGSS:::::T    młyn | 3 Marko: krótki pas, ogród o
  76 ~~~~gg:::oo....=......+++++++++T    g gęsi przy strumieniu | + rezerwa (dawna chałupa kowala)
  84 ...~~::::oGHHH.=......+++++++++T    4 Zofia: zagon ku błoniom i lasowi
  92 ...~~..........=WWW............T    kuźnia (zostaje)
 100 ..LL~.HHD...xxx=___HH..........T    L moczydło | drwal [PROPOZYCJA] | x plac Patryczka | kowal
 108 ...~~..........=.........HHo...T    zielarka + ogród ziołowy (zostaje)
 116 TTT~~TTTTTTTTTT=TTTTTTTTTTTTTTTT
```

| element | położenie (kafle) | uwaga |
|---|---|---|
| trakt | x 60–63, prosto przez całą mapę | owal znika |
| plac | x 50–75, y 52–71, po obu stronach traktu | studnia (65, 62) już tam stoi; lipa, ławka, koryto; staruszkowie przy studni |
| przed karczmą | pas między karczmą a traktem | **ławy, na których ktoś siedzi**; **Anna sprzedaje jedzenie** (kosze, skrzynie; wóz przed dniem targowym) — autor 2026-10-10 |
| zagrody | chałupy **zostają na miejscu**; za nimi **przestronne podwórze** obstawione budynkami wg kart i drzewami, ogród, długi wąski pas pola | wzór: ulicówka autora — szerokie podwórza, działki różnej szerokości, pasy pól aż po horyzont |
| pola | pasy za zagrodami, **długość = zamożność** | NW → łąka kośna, NE → ugór (trzecia niwa, wypas) |
| woda | młynówka bez zmian; **moczydło** x 8–14, y 98–106 (poniżej młyna i gęsi) | studnia na placu to osobne ujęcie — len jej nie zatruje |
| poza płotami | karczma, kuźnia + **chałupa kowala** (x 76–82, y 98–104), młyn, zielarka, owczarnia, drwal, Myśliwy (las) | zasada 7 |
| rezerwy | za Sobkiem; wschód y 72–90 (miejsce po chałupie kowala); północny zachód przy karczmie | zasada 9 |

### Program zabudowy — z kart obejść (S/M/L = mały/średni/duży)

| # | zagroda | budynki | pole | uzasadnienie różnicy |
|---|---|---|---|---|
| 1 | **Dobek** | chałupa M · **stodoła L przy drodze** · kurnik S · bróg (stóg) · wóz | najdłuższy pas | „wielkość gospodarstwa czyta się z budynku" (§5.2) |
| 2 | **Witek** | chałupa M (4 os.) · chlew S (2 świnie) · szopa lniana S | pas pod len | najwięcej świń, dużo lnu, bez krowy (§5.4) |
| 3 | **Marko** | chałupa S · drewutnia S (pieniek, siekiera) · chlewik S (krowa + świnia) · kurnik przy chałupie · kilka drzew | **krótki** pas | najmniejszy z rolniczych (§5.1) |
| 4 | **Zofia** | chałupa S · obora S · kurnik przy chałupie · gęsi przy strumieniu | pas ku błoniom, zagon przy ścianie lasu | bieda bez siły roboczej, pierze = dochód (§5.3) |
| 5 | **Sobek** | chałupa S · **warsztat** (wiata otwarta do drogi) · skład drewna (kłody, sągi, kozioł) | ogród, bez pola | rzemiosło, nie areał (§5.7) |
| 6 | **sołtys** | **chałupa L** · obora/stajnia M (woły, 2 krowy, koń) · stodoła M · **sad 8 jabłoni** | najszerszy pas | najzamożniejszy (§5.6) |
| — | karczma | karczma (stoi) · **stodoła dla przejezdnych** M · chmielnik | — | dialog Bogusza |
| — | kowal | kuźnia (stoi) · **chałupa S przy kuźni** · skład węgla, rudy i żelaza pod dachem · ogród — **wszystko za własnym, mocnym płotem z wrotami od traktu** (autor 2026-10-10: narzędzia i ruda są drogie) | **brak** | nie ma ziemi ornej (§5.5) |
| — | **drwale — TRZECH** (autor 2026-10-10) | 1–2 chałupy S · skład kłód · kozły | — | opał dla wsi, budulec dla Sobka, drewno do mielerza i wozami do miasta; wyręb w lesie (plan lasu: zachód) |

**Bilans:** w zagrodach 22 → **16 budynków**, w tym tylko dwie duże bryły
(stodoła Dobka, chałupa sołtysa). Każda zagroda dostaje skład drewna
(stos pod ścianą — rekwizyt `stos_*` z `props3d.py`).

## C. Zależności gospodarcze

| przepływ | od → do | rozliczenie | droga |
|---|---|---|---|
| zboże → mąka | zagrody → młyn | **miarka** mąki dla Miłosza | trakt → boczna droga y 36 |
| orka | sołtys (woły) → Dobek, Marko, reszta | **odrobek** (dniówki) | — |
| narzędzia, podkowy, okucia | kowal → wszyscy | zboże / mąka / odrobek | trakt → południe |
| węgiel drzewny | mielerz za rzeką (Adrian) → kuźnia | — | droga lasu |
| drewno | wyręb → drwal → Sobek (budulec), zagrody (opał), mielerz | w naturze | droga lasu → południowa brama |
| len | pas Witka → moczydło → szopa → Anna | Anna wiezie na targ | skrajem pól |
| słód | młyn → karczma | Miłosz pije za pół ceny | trakt |
| jaja, ser, mąka, len | zagrody → Anna → miasto | moneta i sól wracają | plac → trakt na północ |
| leczenie, mikstury | zielarka → wszyscy | jajka, mleko, gotówka | południe |
| siano | łąka kośna NW → obory | — | z łąki przez północ |
| wypas | owce (9 + cudze) → ugór NE; krowy i woły → błonia | wełna z każdej dziesiątej | **owce omijają plac** (owczarnia już na ugorze) |
| danina | zagrody → sołtys → pan | — | — |

✅ **Wóz Anny (autor, 2026-10-10):** „wieś się dogaduje" — ktoś i tak musi
wozić do miasta węgiel drzewny i inne rzeczy; Anna jedzie raz w tygodniu
w dzień targowy, czasem z kilkoma wozami (np. drewno z lasu), często
z kimś do ochrony. Bez nowego konia. Nowy przepływ: **węgiel i drewno →
miasto** (wozy wsi, z Anną albo bez). Postać: `docs/swiat.md` „Anna —
kuzynka karczmarza".

## D. Życie lokacji

⚠ Stan techniczny: mieszkańcy 3D stoją dziś w pozie `Idle`; chodzenie po
trasach i animacje pracy to NOWA robota. Najtańszy zysk to **miejsce pracy
+ rekwizyt**:

| kto | miejsce | rekwizyty (istnieją?) |
|---|---|---|
| Marko | drewutnia | pniak, stos, siekiera — `pniak`, `stos_*` ✅ |
| Dobek | stodoła, wóz, bróg | `stog_siana` ✅, wóz ❌ |
| Witek | szopa lniana / moczydło | snopki lnu ❌ |
| Sobek | warsztat | kozioł, deski, beczki — `beczka`, `kupka_klod` ✅, koło ❌ |
| Anna | **przed karczmą** | kosze, skrzynie (`skrzynka`), wóz ❌ |
| ktoś na ławie | przed karczmą | `lawka` ✅; poza siedząca **ODŁOŻONA** (autor 2026-10-10 — `docs/odlozone.md` §3) — w K1 same ławy |
| sołtys | sad / próg | jabłonie `tree3d jablon` ✅ |
| Dorota | ogród ziołowy | `ul` ✅, zioła ✅ |
| Radzim, Adrian | kuźnia | palenisko ✅ |

Dzieci (Janek, Marysia, Wojtek) są w kanonie, ale nie mają modeli —
**[PROPOZYCJA]** później: zabawa przy płocie / na placu, bez AI.
Nowe modele minimum: **wóz** (Dobek, Anna, młynarz) i **stragan / kosze**.

## E. Kolejność wdrożenia

| krok | zakres | rusza budynki? |
|---|---|---|
| **K1** ⭐ obowiązkowe | trakt prosto, plac, sadzawka i owal usunięte, studnia/lipa/ławka na placu; **ławy przed karczmą, Anna przeniesiona pod karczmę** | nie |
| **K2** ⭐ obowiązkowe | program zabudowy z tabeli: 5 stodół znika, małe budynki, stodoła Dobka L przy drodze, składy drewna, furtki na tył; **Zofia ↔ Witek zamieniają się chałupami** (sam NPC) | tak, wg tabeli |
| **K3** ⭐ obowiązkowe | pasy pól za zagrodami, ogrody, sad sołtysa; NW → łąka kośna; moczydło i gęsi | nie |
| **K4** | kowal poza płotami wsi: chałupa przy kuźni, **zagroda kuźni ogrodzona** (płot + wrota od traktu, skład pod dachem w środku), stodoła dla przejezdnych | tak (1 chałupa + płot) |
| **K5** korzystne | drwale (trzech), wóz, stragan, miejsca pracy NPC | nie |
| później | trasy NPC, dzieci, wzmocnione wejścia / brama / czatownia (palisada dopiero przy grodzie) | — |

**Nie ruszać:** karczma, chmielnik, kuźnia (wiata i palenisko), młyn, staw
i młynówka, owczarnia Gniewka, chata zielarki **z 6 ulami** (kanon §5.8: miód
= lek i jedyny słodzik), droga lasu, `swiat.world`.
⚙ **Ule przeniesione decyzją autora 2026-10-11** („czy ule nie powinny być
w miarę odsunięte od zabudowań, w kierunku stogu"): stały po trzy przy
ścianach chaty, tuż przy drzwiach i ścieżce; dziś **pasieka** w dwóch rzędach
po trzy, x 110–115 / y 105–108, między chatą a stogiem.

**Obronność po zmianie:** tylne płoty + stodoły Dobka i sołtysa + sad
tworzą częściową barierę; wjazdy tylko trakt N i S; furtki na pola to
świadome słabe punkty; błonia od południa dają widok na zagrożenie;
kuźnia i kowal poza płotem wsi obrywają pierwsi (zasada 7), ale zagroda
kuźni ma własny mocny płot — cenne żelazo i narzędzia nie leżą na widoku.

## Stan kroków

**K1 ✅ (2026-10-10)** — jednorazowy skrypt na żywym `.tmj` (nie w `tools/`,
idempotentny: drugi przebieg = 0 zmian). Owal drogi i sadzawka (26 kafli
wody) usunięte; trakt x 60–63 prosto; **plac x 54–73, y 52–71** (węższy
niż w schemacie: płoty frontowe zachodnich zagród stoją do x 53); dojścia
od wrót siedmiu zagród do traktu / placu; ścieżki WEWNĄTRZ podwórek
nietknięte (należą do K2). Dwa stemple drzew z traktu usunięte; „lipa" na
placu = **duży buk** 3×3 (lipy nie ma w katalogu 3D). Ławka z dawnego
nawsia pod drzewem przy studni, **dwie ławy przed karczmą**, **Anna pod
karczmą**, Sulisław i kot zdjęci z traktu. Babka (zioło) została na
placu — rośnie na udeptanym, to zgodne z naturą. Sprawdzone w grze
(widok z góry, plac, front karczmy), `dev.missing` puste, konsola czysta.
⚠ Zrzut Phasera nie łapie warstwy 3D — oględziny przez wymuszony zoom
kamery i zrzut panelu.

**K2 ✅ (2026-10-10) — plan B zaakceptowany przez autora** („podwórka blisko
traktu, przestrzeń oddać sadom i polom, zewnętrzne płoty łączą się
w pseudo-barierę, drzewa przy drodze, łąka kośna przy lesie"):
- **Chałupy frontem przy trakcie** (przy placu — frontem do placu), za nimi
  podwórze, budynki gospodarcze z tyłu. 7 starych zagród (76 obiektów)
  zastąpione: 21 budynków, 16 wrót, 64 odcinki płotu. Program wg kart:
  Dobek — stodoła 10×14 (największa we wsi), kurnik; Witek — szopa lniana,
  chlew; Marko — kurnik przy chałupie, chlewik, drewutnia; Zofia — obora;
  Sobek — warsztat (wiata otwarta na plac); sołtys — chałupa 8×6, obora/
  stajnia, stodoła. **Zofia ↔ Witek zamienieni** (zagon Zofii przy lesie).
- **Obwód:** zewnętrzne płoty zagród łączą się w jedną linię; bramy na
  trakcie (N y 38, S y 89), wrota do zagród, **7 furtek na pola**
  (świadome słabe punkty). Rezerwa na wschodzie (y 72–88) ogrodzona —
  bariera bez dziury.
- **Zrobione przy okazji z dawnego K4:** zagroda kuźni ogrodzona, chałupa
  kowala (Agata pod drzwiami) + zadaszony skład; stodoła wozaków naprzeciw
  karczmy; chałupa drwali (SW) — postaci drwali jeszcze nie ma.
- Rekwizyty: sągi przy każdej zagrodzie, skład drewna Sobka, kłody
  i pniak u drwali, stóg Dobka → bróg za płotem; świnie, kury, kot
  przeniesione do właściwych podwórzy.
- `houses3d.py --zapisz`: 113 budynków, bramka zielona. W grze: brak
  braków modeli, konsola czysta, bramy/wrota/furtki przechodnie (punkt
  kontrolny w płocie zablokowany — test działa).
- ⭐ **Poprawka po zrzucie autora (ta sama sesja): ZWARTA ZABUDOWA + WROTA
  WOZOWE** — „na podwórko powinien móc wjechać wóz, budynki mogą stać
  bardziej obok siebie, a nie robić dziury". Budynki gospodarcze
  przystawione do chałupy i do siebie (Dobek U: stodoła + obora + chałupa;
  Witek i Zofia L; Marko rząd + kurnik przy chałupie; Sobek L ze składem;
  **sołtys zagroda zamknięta**: chałupa, wrota, obora/stajnia od placu,
  stodoła 7×19 na całą szerokość z tyłu). Wrota do zagród 3–4 kafle
  (było 2). Sprawdzone: przejścia drożne, styk obory z chałupą lity.
- ⭐ **Druga poprawka po zrzucie autora:** na wąskich działkach zachodu
  (12 kafli) budynki z boku chałupy zjadały podwórze (u Witka pasek 3 kafli),
  a dachy sąsiednich zagród zlewały się nad płotem. Witek, Marko, Zofia:
  chałupa od drogi, podwórze na całą wysokość, budynki gospodarcze ZWARTYM
  RZĘDEM przy tylnym płocie, z odstępem od rzędu sąsiada.
- ⭐ **Przechodniość pod symulację zajęć** (autor: „postacie będą symulowały
  zachowania gospodarcze, będą chodzić między zabudową") — nowy przymiar
  `tools/wies_przechodniosc.py`: 30 budynków, każde drzwi z drogą do placu,
  wrota i furtki dostępne z obu stron. Poprawione po pierwszym przebiegu:
  płoty frontowe przed drzwiami Dobka i Zofii, warsztat Sobka odgrodzony od
  placu, skład Sobka frontem do płotu, furtki Dobka i sołtysa w ścianę
  stodoły (stodoły skrócone), **młyn z drzwiami od wody** (obrócony frontem
  do drogi młyńskiej).
- ⭐ **Trzecia poprawka (zrzut autora: „przybudówka zasłania wejście"):**
  kurnik Marka stał przed chałupą w przejeździe od wrót (zostawał 1 kafel)
  → przy tylnej ścianie chałupy; wrota Zofii pod chałupę (nad nią przejazd
  miał 2 kafle), wrota kuźni pod wiatę (przy niej szczelina 1 kafla).
  `wies_przechodniosc.py` sprawdza od tej pory także **przejazd wozu**:
  wrota ≥ 3 kafle muszą mieć z obu stron korytarz szeroki na 3 kafle.
- ⭐ **Młyn przeniesiony (autor):** lewy górny róg, na brzegu młynówki
  (x 6–13, y 26–33, koło w nurcie), obok stajnia/wozownia młynarza (koń
  i wóz) i jego chałupa — zwarty rząd, wrota na placyk i odnogę od traktu
  pod wozownią. Stary młyn, chałupa młynarza i zjazd drogi (U) na południe
  usunięte — w K3 pasy pól Witka i Marka mogą sięgnąć do wody. Przymiar:
  31 budynków, wszystko zielone.

**K3 ✅ (2026-10-10)** — ziemia wokół zabudowy (jednorazowy skrypt
`k3_ziemia`, poza `tools/`):
- **Pasy pól za obwodem, długość = zamożność:** Dobek zboże do samej wody
  (najdłuższy), Witek len do wody (miejsce po starym młynie), Marko krótki
  pas + łąka nad wodą, Zofia pas + dalszy zagon przy błoniach, sołtys
  najszerszy pas (cztery uprawy). Miedze = trawa.
- **Ogrody** warzywne tuż za tylnymi płotami (kapusta, nać, cebula,
  przekopane grządki) i u Sobka.
- **Sad sołtysa:** 8 jabłoni za stodołą (furtka zostaje wolna); kilka drzew
  owocowych u Marka, Witka, Zofii i Dobka.
- **Drzewa przy trakcie:** 7 dębów i buków (poza placem i zabudową).
- **Łąka kośna** w pasie przy lesie (gęstsza trawa) + 3 stogi.
- ~~Moczydło lnu przy młynówce~~ — stało ZA potokiem, bez dojścia; zastąpione w K3b.
- **Rezerwa → pastwisko krów sołtysa** (autor): 2 krowy + byk, koryto,
  wrota z podwórza sołtysa. Gęsi Zofii: koryto przy strumieniu —
  ⚠ modelu gęsi w grze NIE MA (parking).
- Przymiar przechodniości zielony; w grze brak braków.

**K3b ✅ (2026-10-10)** — woda (autor: „mostek przez rzekę i sztuczny zbiornik
lekko oddalony od głównego nurtu do moczenia lnu"; skrypt `k3b_moczydlo_kladka`):
- **Moczydło lnu = KOPANY staw** 5×5 (x 8–12, y 67–71) na łące po starym
  młynie, zasilany rowkiem szerokości 1 kafla z młynówki (x 6–7, y 69) —
  poniżej młyna i studni, więc moczony len nie psuje wody do picia, a od nurtu
  odsunięty, bo len w bieżącej wodzie zatruwa ryby i spływa. Najbliżej lnu
  Witka (dojście od jego furtki wzdłuż y 64). Przy stawie kłody do przyciskania
  snopków i pniak. Prostokąt, nie owal: ścięte narożniki w autokaflach czytały
  się jak krzyż, a kopany dół i tak ma proste boki.
- **Stare moczydło (x 8–12, y 99–104) zasypane** — leżało za potokiem i nie
  miało dojścia (przymiar: −1).
- **Kładka przez potok przy drwalach** (obiekt `kladka`, x 14–17, y 100–101,
  `kolizja=false`; pod nią kafle `path` nad wodą — o przejściu decyduje
  najwyższy kafel): drwale idą na zachodni brzeg i do wyrębu w lesie. Zachodni
  brzeg na południe od y 76 był dotąd ODCIĘTY wodą.
- ⚠ Przymiar przechodniości liczył wodę z samej warstwy `water` i kładki nie
  widział; dziś bierze najwyższy kafel, jak `TiledMap.topmostTileAt`.

**K5 ✅ (2026-10-10)** — sprzęt, miejsca pracy i drwale (autor: „skończmy
najpierw wioskę"; skrypt `k5_zagrody`):
- **Drwale = ojciec z synami** (imiona i charaktery wybrał autor):
  **Ciechan** (~55, małomówny, pamięta las sprzed naporu), **Bolko** (~28,
  robi za dwóch, chce przejąć wyrąb), **Zbych** (~19, ciągnie go do miasta).
  NPC z rozmową (`CIECHAN`/`BOLKO`/`ZBYCH`), modele 3D z presetów `npc3d`,
  twarze pixel-art (`build_player_face.py`). Wątki: mielerz kowala (po
  `AGATA.topics.wegiel`), deski Sobka, Anna, coś idącego za nimi w lesie.
- **Zagroda drwali:** chałupa ojca + **chałupa synów** naprzeciw (frontem na
  wspólne podwórze), **drewutnia** (wiata z sągami pod dachem), **kozioł
  do piłowania**, pniak z siekierą, dłużyce i kłody; drzewa z podwórza
  zdjęte. Bez płotu — narzędzia nie są tu warte tyle, co żelazo kowala.
- **Sprzęt zagród jako obiekty `budynki`** (obrót + kolizja, czego rekwizyt
  `DECOR_PROPS` nie umie): `woz` (drabiniak — Dobek pod tylnym płotem,
  młynarz przy chałupie), `stragan` (Anna, płótno w pasy, bochny, sery,
  kosze), `kozel`, `snopki` (len suszy się w rzędzie pod moczydłem).
- **Stragan Anny przy trakcie naprzeciw drzwi karczmy**, Anna za ladą —
  od południa karczmy nie było miejsca (płot obwodu), od północy zasłaniałby
  go dach. Przy okazji: Anna stała dotąd w kaflu płotu.
- Przymiar przechodniości: 33 budynki, zielono (sprzęt blokuje, ale drzwi
  nie ma — wyjęty z testu drzwi). W grze: konsola czysta, `dev.missing`
  puste, rozmowy działają.
- ⏳ Poza zakresem (parking): dzieci, trasy NPC i animacje pracy
  (symulacja gospodarcza), poza siedząca, koło młyńskie, model gęsi.

**K6 ✅ (2026-10-11) — podwórza: trawa, wydeptane ścieżki, drzewa** (zrzuty autora:
„podwórka całe wyglądają na udeptane … na podwórkach są też drzewa dające cień
i owoce", „furtka w powietrzu", „ścieżka prowadząca do ściany"; jednorazowy skrypt
`k6_podworza`, poza `tools/`, idempotentny — drugi przebieg = 0 zmian):
- **Klepisko tylko tam, gdzie się chodzi.** Na pięciu zamkniętych podwórzach
  (Dobek, Witek, Marko, Zofia, sołtys) i na placu ścieżka liczona od nowa z drzwi
  i wrót: sieć od drzwi chałupy (na placu od traktu), każde wejście dopięte
  najkrótszą drogą **po skosie** (zejście po polu odległości wzdłuż prostej, nie
  „L"), szerokość 2, fartuch przed wrotami, wrotami stodół i drzwiami chałupy,
  ścięte rogi. Na placu dodatkowo nieregularny brzeg — przy samych prostych
  drogach trawa wychodziła prostokątnymi trawnikami jak w parku. Reszta → trawa
  (`ground`). Klepisko: podwórza 672 → 374 kafle, plac 389 → 212.
  ⚠ **Kuźnia celowo zostaje klepiskiem** (podwórze robocze), Sobek też (warsztat
  otwarty na plac, wióry).
- **Drzewa owocowe NA podwórzach** (stemple `Nature`, modele 3D z `kafleNature`):
  po jednym dużym (grusza / jabłoń — cień przy chałupie) i dwa małe (śliwa,
  jabłoń) na podwórze, gdzie się mieszczą — 12 sztuk. Pień ≥ 1 kafel od ścieżki,
  ≥ 3 od drzwi, **≥ 2 od ściany** (model 3D ma koronę dookoła pnia, a stempel 2D
  rośnie tylko w górę — korona przebiłaby dach).
- **Wrota „w powietrzu":** trzy wrota stały o kafel obok linii zabudowy (Dobek
  57,47 · Zofia 57,86 · Sobek 71,51) — dostawione odcinki płotu przy narożnikach;
  szczelina podwórza Dobka na plac (54–56, 53) zamknięta. **Skrzydła wrót dostały
  pionowe listwy** (`houses3d.py`) — bez nich z kamery 40° czytały się jak deski
  zawieszone nad trawą. Nowa reguła przymiaru `wies_przechodniosc.py`: oba końce
  wrót przy płocie albo ścianie (sprawdzone: na mapie sprzed K6 świeci na czerwono).
- **Ścieżki w ścianę:** odnoga traktu w zachodnią ścianę karczmy (64–65, 29) zdjęta;
  ścieżka do Doroty skręca przy narożniku i dochodzi do drzwi od południa.
- Sprawdzone w grze (Witek, Dobek, sołtys, plac, karczma, Dorota): `dev.missing()`
  i `dev.mapWarnings()` puste; przymiar przechodniości zielony.

**K6b ✅ (2026-10-11) — grusza, pranie, gnojowniki, psy** (autor: „podmień buk na
gruszę i dodaj sznur z praniem, gnojownik, no i psy"; skrypt `k6b_zagrody`, poza
`tools/`, idempotentny):
- **Plac:** buk (69–71, 60) → **grusza duża** — tak stało w planie rdzenia wsi
  (`wioska_plan.md`: „plac, studnia, … grusza"), a K1 dało buka tylko dlatego,
  że lipy nie było w katalogu 3D.
- **Sznury z praniem** (`pranie`, 4×1, rząd W–E, `kolizja=false`) przy chałupach
  Marka, Zofii i Witka, na trawie podwórza.
- **Gnojowniki** (`gnojownik`, 2×3, lite) u Dobka, Zofii i sołtysa — **tyłem do
  ściany obory/stodoły**, otwartym frontem w podwórze; ⚠ nie przy kurniku.
  Wolno im stać na klepisku (tam stoją naprawdę); drzwi i przejazd wozu pilnuje
  `wies_przechodniosc.py` (zielony).
- **Psy** (`FarmAnimal`, gatunki `dog` / `sheepdog`, nazwy w Tiled `kirci` / `pies` /
  `owczarek`): Kirci na błoniach przy południowej bramie, dwa białe owczarki przy
  owczarni Gniewka. Model 3D z wilka (`farm3d.py`), awaryjny chód 2D z `wolf.png`.
- Modele: `houses3d.py` dostał rodzaje `pranie` i `gnojownik` (pierwsza wersja
  kopca schodziła pod grunt — bramka generatora odmówiła zapisu, poprawione).
  Sprawdzone w grze: grusza, pranie, gnojownik, Kirci i owczarek.

**K6c ✅ (2026-10-11) — kowal w górę, Gniewko do wsi, dwa małe pastwiska**
(autor: „całość działki kowala przesunięta w górę tak, że owczarnia i dom
Gniewka są ogrodzone płotem i mają owczarnię za zabudową"; skrypt
`k6c_kowal_gniewko`, poza `tools/`, jednorazowy — odmawia drugiego przebiegu):
- **Zagroda kowala** (kuźnia, chałupa, skład, płoty, Radzim, Agata, Adrian,
  kafle wyposażenia i klepiska) przesunięta o 16 wierszy w górę: x 64–84,
  y 72–90, wrota od traktu (64, 82–85). Jej wschodni płot jest dziś zachodnią
  granicą pastwiska krów.
- **Pastwisko krów** o ponad połowę mniejsze: x 85–100, y 73–87 (krowy, byk,
  koryto); wrota z podwórza sołtysa bez zmian.
- **Zagroda Gniewka** na dawnym miejscu kuźni (x 64–84, y 91–106): chałupa
  frontem do traktu, **owczarnia za nią** (otwarta na podwórze), wrota od
  traktu i wrota na **pastwisko owiec** (żerdzie, x 85–100, y 89–101, przy
  samotnej jabłoni). Owce, baran, dwa owczarki, Gniewko — tutaj.
- **Stary róg Gniewka (NE)** pusty: ścieżki zdjęte, pola zostają — miejsce na
  ugór owiec (propozycja 7, nierozstrzygnięta).
- ~~Południowa brama wsi między kuźnią a Gniewkiem~~ — bram na trakcie już nie
  ma (K6d).
- Sprawdzone w grze; przymiar przechodniości zielony, `houses3d` bramka
  zielona (145 budynków), minimapa odświeżona.

**K6d ✅ (2026-10-11) — trakt bez bram, ogródek kowala, dąb na placu** (autor:
„po co bramy wjazdowe do blokowania traktu, skoro kowal, drwale i zielarka nie
są ogrodzeni"; „rodzina kowala powinna mieć ogród z warzywami"; „między Witkiem,
studnią a Mamą można posadzić drzewo"; skrypt `k6d`, jednorazowy):
- **Wrota na trakcie (N y 38, S y 89) zdjęte** — płoty zagród kończą się przy
  drodze. ⚠ Tym samym „obwód z bramami" z K2 przestał istnieć: zagrody są
  ogrodzone każda osobno, droga przez wieś jest otwarta.
- ~~Ogródek kowala w rogu pastwiska za kuźnią~~ — **przeniesiony w K6e** (autor:
  „zwierzęta na pewno by się raz dwa do niego dobrały, jak z 3 stron jest płot
  pastwisk"). Dziś: **x 85–97, y 103–105**, na skrawku między płotem pastwiska
  owiec a ścieżką do zielarki; płot od ścieżki z **furtką (91–92, 106)**,
  grządki wzorem ogródka Zofii. Pastwisko krów wróciło do prostokąta,
  wschodni płot kuźni (id 1671) znów w całości.
- **Dąb średni na placu** (pień 57–58, 64) — między Witkiem, studnią a Ojcem
  i Mamą; na mapie wsi nie ma stempla dużego dębu ani buka.

**K6f ✅ (2026-10-11) — zamiana zagród: kowal na dół, Gniewko na górę** (autor:
„dom pasterza i kowala trzeba swapnąć"; skrypt `k6f`, jednorazowy):
- **Kuźnia wróciła na swoje pierwotne miejsce** (x 64–84, y 88–106) — teraz
  z **furtką prosto do ogrodu** (84, 103–104).
- **Zagroda Gniewka na górze** (x 64–84, y 72–88): chałupa frontem do traktu,
  owczarnia za nią, wrota na górne pastwisko.
- **Pastwiska zamienione funkcją:** górne (x 85–100, y 73–87) — owce i owczarek,
  tam też otwierają się wrota z podwórza sołtysa (owce całej wsi, także
  sołtysa); dolne (x 85–100, y 89–101, z jabłonią) — krowy, koryto, **wrota na
  wschód** (101, 94–95) na łąkę.

**K6j ✅ (2026-10-11) — wschodni blok jako dwa pasy ulicówki** (autor po K6i:
„czuję, że coś tu zjebaliśmy" → zaakceptowany szkic). ⭐ **Obowiązuje — zastępuje
podział pastwisk z K6i i ogród z K6e.** Diagnoza: K6c–K6i łatały po jednej uwadze
naraz i zostawiły mozaikę osobnych kojców bez właścicieli (krowy w pasie
6 kafli między cudzymi zagrodami, ogród kowala za pustą łąką, luźne krowy).
Zasada przywrócona: **pas prostopadły do drogi — dom → podwórze → ogród/sad →
pastwisko/pole.**
- **Pas Gniewka (y 72–88):** podwórze x 64–84 → **pastwisko owiec x 85–108**
  (wrota z podwórza 84, 82–83; wrota sołtysa 86–88, 72 — jego owce chodzą ze
  stadem wsi; wrota na błonia 109, 81–82).
- **Pas kowala (y 88–106):** podwórze x 64–84 → **ogród** x 86–95, y 90–95
  (furtka z kuźni 84, 96–97) → **sad** (stara jabłoń + jabłoń, śliwa, grusza,
  młoda jabłoń) do x 108; płot wschodni x 109, dolny y 102.
- **Błonia otwarte, bez płotu** — wspólny wypas: wszystkie krowy (sołtysa i wsi),
  koryto (116, 88). Zgodne z kanonem „krowy i woły → błonia".
- Stary ogród przy ścieżce do zielarki → trawa.
- **Tył kowala BEZ płotu** (autor: „po co płot wokół ogrodu kowala") — zdjęte
  żerdzie y 102 i x 109 poniżej pastwiska owiec; ogród i sad otwarte ku ścieżce
  do zielarki. **Druga furtka z podwórza kuźni** w rogu przy składzie
  (84, 103–104), tam, gdzie kończyła się ścieżka — Agata wychodzi prosto na
  grządki. Pierwsza furtka (84, 96–97) zostaje, ale jest wciśnięta między
  chałupę a skład i z podwórza jej nie widać.
- **Jabłoń Gniewka pod GÓRNYM płotem** (pień 74–75, 74), między chałupą
  a owczarnią — autor: „miało być u góry, nie u dołu" (K6i dało ją przy dolnym).

**K6i (unieważnione przez K6j) — pastwiska według właścicieli** (autor: „zgubiłem się,
czyje są krowy… pasterz ma mieć dojście z podwórka zamiast chodzić naokoło"):
- Górny prostokąt (x 85–100) podzielony żerdziami w y 79: **północ — krowy
  sołtysa** (wrota z jego podwórza, koryto), **południe — owce Gniewka**
  (wrota prosto z jego podwórza, owczarek, wrota na wschód 101, 80–81).
- **Dolne pastwisko przy kuźni zlikwidowane** — otwarta łąka z jabłonią;
  z jego płotu został tylko północny płot ogrodu kowala.
- **Jabłoń na podwórzu Gniewka** przy dolnym płocie, między chałupą
  a owczarnią (pień 75, 86).
- ⚠ Unieważnia podział pastwisk z K6f („owce góra, krowy dół").

**K6g ✅ (2026-10-11) — wschód wsi** (autor: „reszta — co tam możesz zrobić";
⛔ bez kapliczek — religia nieokreślona, `odlozone.md` §5; skrypt `k6g`):
- **Pasy pól za Sobkiem** (x 104–119): zboże y 42–44, miedza, len y 46–49.
- **Ugór w rogu po Gniewku** (x 103–120, y 26–38): pasy bruzd z przerwami,
  miedza co trzeci wiersz — owce mają dokąd wychodzić.
- **Drzewa śródpolne:** 8 sztuk (grusze, dęby, buk, brzozy, grab) na miedzach,
  łące i błoniach; 4 kandydatów odrzuciło sprawdzenie zajętości.
- **Dwie krowy wsi** na łące za wrotami pastwiska (kanon: krowy → błonia).
- **Kieszeń za chałupą Dobka otwarta:** płot (57, 38–40) skrócony do narożnika,
  w zakątku dwa stosy drewna. Pierwsza próba (drewutnia zapychająca kieszeń)
  odpadła na przymiarze — front wychodził w płot. **Dziś w środku wsi nie ma
  ani jednego nieosiągalnego wolnego kafla.**

**K6h ✅ (2026-10-11) — gnojowisko za oborą** (autor: „tam, skąd pochodzę,
gnojowisko to taki stóg siano-gówna za oborą, a nie na podwórku"):
- Model `gnojownik` (`houses3d.py`) to dziś **pryzma**: warstwy obornika
  zwężające się ku górze, przekładane słomą, widły w wierzchu — bez desek.
- Trzy skrzynie z podwórzy (Dobek, Zofia, sołtys z K6b) zdjęte. Kopce stoją
  **za tylną ścianą, po drugiej stronie płotu**: obora Zofii (32, 81), chlew
  Witka (30, 59), chlewik Marka (32, 67) — na skraju ogrodu/pola, gdzie
  obornik i tak idzie.
- ⚠ Dobek i sołtys **bez kopca**: tył obory Dobka to droga do młyna, tył obory
  sołtysa — plac. Wymagałoby to obrócenia budynków.

## Do rozstrzygnięcia przez autora

1. ✅ **Układ zaakceptowany** (schemat B, K2).
2. ✅ **Zofia ↔ Witek zamienieni chałupami** (K2).
3. ✅ wóz Anny — „wieś się dogaduje" (rozstrzygnięte 2026-10-10).
   Siedzenie na ławach — odłożone (`odlozone.md` §3). ⚙ Otwarte drobne:
   czy Anna i Bogusz mają sprzedawać to samo (dziś oboje chleb i ser).
4. **[KONFLIKT z briefem GPT] karczma „przy górnej części placu":** kanon
   i mapa stawiają ją przy północnym wjeździe, ~15 kafli nad placem.
   Propozycja: zostaje, plac kończy się Sobkiem i Dobkiem.
5. ✅ **Podwórka PRZESTRONNE** (autor 2026-10-10, zdjęcie wsi) — GPT miał
   rację, „małe podwórka" było moim błędnym odczytaniem zarzutu wobec
   obecnej mapy. Skutek dla schematu B: chałupa przy drodze → szerokie
   podwórze z budynkami dookoła i drzewami → ogród → długi, wąski pas pola
   aż do krawędzi mapy (na wschodzie ~40 kafli, na zachodzie do młynówki,
   a pasy „za kadrem" sugeruje sama krawędź). Do przerysowania przed K2.
6. ✅ **Drwale — trzech, ojciec z synami: Ciechan, Bolko, Zbych** (autor
   2026-10-10); dwie chałupy na południowo-zachodnim skraju przy wyrębie (K5).
