---
typ: HISTORIA
domena: attributes
tytul: Atrybuty — powody, pomiary i odrzucone warianty
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-05
---

# Atrybuty postaci i ich rozwój

> ## ⚠ STAN DOMENY PRZENIESIONY (2026-09-05) — ten plik zostaje jako POWODY
>
> **Aktualny model czterech atrybutów: `docs/systemy/attributes.md`.**
> Przy sprzeczności wygrywa tamten plik — jest kotwiczony w kodzie i pilnowany
> przez `tools/doc_check.mjs`.
>
> ⛔ **Ten plik NIE jest archiwizowany i nie wolno go usunąć.** Jest jedynym
> nośnikiem sześciu rzeczy, których `STAN` świadomie nie kopiuje, bo są
> uzasadnieniami, a nie stanem — m.in. pomiaru, który obalił model płaskiej
> Siły (§10.4b), pomiaru „pół paska w ~75 s przy każdym buildzie" (§2, §11.1)
> broniącego niezmiennika `hpRegen = hp/150`, i powodu odpięcia krytyka od
> Zręczności (§11.4). Pełna lista: `docs/proces/ekstrakcja_attributes.md` §5.
>
> ⚠ **Poprawka do §11.4:** oba komentarze w `GameConfig.ts`, które ta sekcja
> opisuje jako „dług w kodzie do sprzątnięcia", **zostały sprzątnięte
> 2026-09-05**. Otwarty jest natomiast **trzeci, o którym ten dokument nie
> wie** — `Progression.critMultiplier` nadal twierdzi „Zręczność mówi jak
> często krytykujesz". Szczegóły: `ekstrakcja_attributes.md` §2 (R-1, R-2).
>
> ⚠ **Poprawka do §3:** liczby budżetu punktów („pula XP lasu = 825", „~148
> przejść", „jedno przejście = poziom 11") opierają się na starym rosterze —
> audyt 2026-09-03 zmierzył **1 115 XP** za sam las. Zasada („49 punktów to
> fikcja, realna rozmowa dotyczy pierwszych kilkunastu") **zostaje w mocy**.

> ## ⚠⚠ ZACZNIJ OD §11 — tam jest tabela, która zgadza się z KODEM
>
> **Hierarchia w tym pliku (2026-09-05): §11 > §10 > §1–§9.**
>
> - **§11** — stan faktyczny na dziś, sprawdzony przeciw `GameConfig.ts`
>   i `core/Progression.ts`. **Cztery** atrybuty.
> - **§10** — model skalowania per broń (2026-08-20), **nadal wdrożony**, ale
>   napisany, gdy atrybuty były **trzy**. Wszystkie jego wzory obowiązują;
>   nieaktualne są w nim **nazwy atrybutów przy HP** (patrz nota w §10.4d).
> - **§1–§9** — stan SPRZED 2026-08-20, zapis tego, co zmianę wymusiło
>   (odwrócona drabinka broni, Zręczność jako stat-pułapka, brak kursu wymiany
>   HP↔dps). **Każde zdanie w czasie teraźniejszym w §1–§9 dotyczy stanu
>   historycznego.**
>
> ⚠ **Dwie rzeczy zmieniły się PO §10 i tego §1–§10 nie wie:**
> **(1)** dawna Kondycja (`endurance`) rozpadła się 2026-08-21 na **Witalność**
> (HP) i **Kondycję** (stamina) — `docs/stamina_model.md`;
> **(2)** **Zręczność przestała dawać szansę na krytyka** — pole
> `critChancePerAgility` nie istnieje w konfigu. Każda tabela dps w §1–§10, która
> liczy krytyk ze Zręczności, jest z tego powodu historyczna.
>
> Trzy rzeczy z §1–§9, które NADAL obowiązują i dlatego warto je przeczytać:
> §1 (czego nie ma w DPS jednocelowym), §3 (realne pasmo to 0–15 punktów, nie
> 49) i §6 (ryzyka).

Status (2026-08-13, uzupełnione 2026-08-20): audyt powstał w trybie CR-1..CR-3
— najpierw pomiary na żywym silniku, dopiero potem decyzje. Wszystkie liczby są
**zmierzone**, nie przepisane z komentarzy: jeden komentarz w `CLAUDE.md`
okazał się nieaktualny (§4.1). **Model docelowy z §10 jest wdrożony.**

Dotyczy trzech atrybutów: **Siła**, **Kondycja**, **Zręczność** —
`ATTRIBUTES` w `GameConfig.ts`, logika w `core/Progression.ts`.

---

## 1. Metoda pomiaru (przeczytaj, zanim zaufasz tabelom)

Silnik odpalony na dev serwerze, świat sterowany ręcznie, atrybuty ustawiane
wprost na `Progression`, statystyki czytane z **żywych getterów** — więc jakość
egzemplarza, warianty ataku i bonusy sprzętu wchodzą tą samą drogą co w grze.

DPS liczony jako `średnie obrażenia × (1 + szansa_kryt × (mnożnik_kryt − 1)) /
cooldown`, jakość Zwykła, bez pancerza, bez pierścieni.

⚠ **To jest DPS JEDNOCELOWY i trzy rzeczy celowo w nim nie siedzą**, więc
„najlepsza broń" w tych tabelach znaczy wyłącznie „najlepsza przeciw jednemu
celowi":
- **łuk ataku** — siekiera ma 100° i w pomiarze trafiała 5/5 celów jednym
  cięciem, sztylet ma 38°. Przeciw grupie siekiera jest wielokrotnie wyżej, niż
  pokazuje ta tabela;
- **przerwanie** — młot jako jedyny kasuje zamach przeciwnika (dzik, Szary,
  pająk, wilk). Tego nie da się wyrazić w dps i to jest jego realna wartość;
- **zużycie i root** — trwałość zużywa się raz na zamach (nie na cel), a dłuższy
  zamach dłużej ukorzenia.

Zamach roluje też obrażenia losowo, więc dps to wartość oczekiwana, nie wynik
pojedynczej walki.

---

## 2. Co każdy atrybut robi dzisiaj

| Atrybut | Efekt | Pole |
|---|---|---|
| **Siła** | `+1` obrażeń **płasko**, do min i max | `damagePerStrength: 1` |
| **Kondycja** | `+6` maxHP **oraz** `+0,04` regen/s | `hpPerEndurance: 6`, `hpRegenPerEndurance: 0.04` |
| **Zręczność** | `+1,2%` szybkości ataku **oraz** `+0,6%` szansy na kryt | `attackSpeedPerAgility: 0.012`, `critChancePerAgility: 0.006` |

Zmierzone (miecz, jakość Zwykła):

| pkt | Siła → dps | Kondycja → HP / regen / pół paska | Zręczność → szybkość / kryt / dps |
|---:|---:|---|---|
| 0 | 25,8 | 100 / 0,65 s⁻¹ / **77 s** | 0% / 15,0% / 25,8 |
| 5 | 37,0 | 130 / 0,85 / **76 s** | 6% / 18,0% / 27,9 |
| 10 | 48,2 | 160 / 1,05 / **76 s** | 12% / 21,0% / 30,1 |
| 20 | 70,6 | 220 / 1,45 / **76 s** | 24% / 27,0% / 34,7 |
| 49 | 135,5 | 394 / 2,61 / **75 s** | 58,8% / 44,4% / 49,5 |

**Kondycja jest jedynym atrybutem, którego deklarowany projekt trzyma się
w pomiarze.** Komentarz przy `hpRegenPerSecond` obiecuje „pół paska w ~75 s przy
każdym buildzie" — wychodzi 77/76/76/76/75 s. `hpRegenPerEndurance =
hpPerEndurance/150` działa dokładnie tak, jak zapisano. ⚠ Zmiana jednej z tych
dwóch liczb bez drugiej łamie tę własność po cichu.

---

## 3. Budżet punktów: teoretyczny vs realny

- `skillPointsPerLevel: 1`, `maxLevel: 50` → **49 punktów na całą grę**.
- Do poziomu 50 trzeba **122 425 XP**. Cała pula XP mapy lasu to **825**, czyli
  **~148 pełnych przejść**. Do poziomu 20: **3,4 przejścia**.
- Jedno przejście mapy = **poziom 11 = 10 punktów**.

⚠ **Kolumna „49 pkt" jest fikcją i nie należy na niej opierać decyzji.** Realna
rozmowa o balansie dotyczy przedziału **0–15 punktów** — a wszystkie problemy
z §4 są tam już w pełni obecne. Kolumna 49 zostaje w tabelach tylko po to, żeby
pokazać kierunek, w którym rzecz zmierza.

(Osobno zaparkowana jest sama krzywa XP — patrz `docs/odlozone.md`.)

---

## 4. Ustalenia

### 4.1 ⚠ Liczba w `CLAUDE.md` jest nieaktualna

`CLAUDE.md` zapisuje, że rebalans (`damagePerStrength` 2→1, `skillPointsPerLevel`
3→1) ściął przewagę Siły nad Zręcznością „z ~32× do ~2,7×". Zmierzone dziś,
miecz, cała pula 49 pkt:

| | dps | przyrost nad bazą |
|---|---:|---:|
| baza (0 pkt) | 25,8 | — |
| 49 w Siłę | 135,5 | **+109,8** |
| 49 w Zręczność | 49,5 | **+23,7** |

**Stosunek ×4,6, nie ×2,7.** Przy realnych 10 punktach zależy od broni i jest
jeszcze ostrzejszy — wartość **jednego** kolejnego punktu:

| broń | +1 Siła | +1 Zręczność | przewaga Siły |
|---|---:|---:|---|
| Kij | +2,24 dps | +0,29 | **×7,7** |
| Sztylet | +2,78 | +0,45 | **×6,2** |
| Miecz | +2,24 | +0,45 | **×5,0** |
| Siekiera | +2,24 | +0,47 | **×4,8** |
| Młot | +1,72 | +0,51 | **×3,4** |

Do poprawienia w `CLAUDE.md` niezależnie od tego, co zdecydujemy dalej.

### 4.2 ⚠ Płaska Siła nie „spłaszcza" drabinki broni — ona ją ODWRACA

To jest korekta wobec pierwszej, pobieżnej wersji tej analizy, która mówiła
o „zapadnięciu się rozpiętości". Rozpiętość **nie znika**:

| Siła | Kij (12 g) | Sztylet (40 g) | Miecz (110 g) | Siekiera (180 g) | Młot (280 g) | rozpiętość | najlepsza |
|---:|---:|---:|---:|---:|---:|---|---|
| 0 | 16,8 | 25,0 | 25,8 | 26,9 | **29,3** | ×1,74 | **młot** |
| 5 | 28,0 | **38,9** | 37,0 | 38,1 | 37,9 | ×1,39 | **sztylet** |
| 10 | 39,2 | **52,8** | 48,2 | 49,3 | 46,5 | ×1,35 | **sztylet** |
| 20 | 61,6 | **80,6** | 70,6 | 71,7 | 63,8 | ×1,31 | **sztylet** |
| 49 | 126,6 | **161,1** | 135,5 | 136,6 | 113,7 | ×1,42 | **sztylet** |

Psuje się **kolejność**, nie rozstrzał. Przy Sile 0 drabinka respektuje ceny
(młot najwyżej). Od **5 punktów** — czyli od połowy pierwszego przejścia mapy —
najlepszą bronią jednocelową jest **sztylet za 40 g** i zostaje nią na zawsze.
Przy 49 punktach **młot za 280 g (113,7) jest gorszy od kija za 12 g (126,6)**.

⚠ **Najostrzejsza konsekwencja, i to ona powinna zdecydować:** młot wymaga
**Siły 6**. Sztylet nie wymaga niczego. Czyli **w momencie, w którym gracz
legalnie zakłada młot, sztylet — dostępny mu od pierwszego poziomu — jest już
od młota lepszy** (przy Sile 5: 38,9 vs 37,9). Ten sam atrybut, który odblokowuje
ciężką broń, jednocześnie robi lekką broń lepszą od niej. To nie jest przewaga
jednej broni nad drugą; to jest bramka, która nie prowadzi donikąd.

(Przypomnienie z §1: młot ma przerwanie, którego w tej liczbie nie ma. Pytanie
brzmi, czy samo przerwanie ma udźwignąć broń, która jest jednocześnie
najdroższa, najwolniejsza i najsłabsza w dps.)

### 4.3 ⚠ Oba sufity Zręczności są nieosiągalne z atrybutów

Przy pełnych 49 punktach: szybkość ataku **58,8%** przy capie **60%**, kryt
**44,4%** przy capie **60%**. Czyli `maxAttackSpeedBonus` i `maxCritChance` nie
są w praktyce sufitami atrybutu — są **sufitami dla sprzętu i jakości**, które
wchodzą do tej samej sumy (`Equipment.bonusAttackSpeed`,
`Equipment.weaponQualitySpeed`).

To nie jest błąd, ale warto wiedzieć: „cap na Zręczności" nie ogranicza dziś
żadnego buildu opartego na atrybutach.

### 4.4 Czego nie widać w liczbach, a wpływa na wybór punktu

- **Siła jest jedynym atrybutem dającym DOSTĘP.** Bramkuje miecz (2), siekierę
  (4), młot (6) i stalowy pancerz (2–4). Przy realnym budżecie 10 punktów
  wydanie 6 na młot to **60% całej puli** — i te same punkty są jednocześnie
  najsilniejszym dps w grze. **Siła wygrywa dwa razy z tego samego punktu.**
- **Nie ma respeca.** Każdy wybór jest ostateczny, co podnosi cenę pomyłki
  i premiuje stat oczywiście najsilniejszy.
- **Zręczność ma trzeci, niepoliczony efekt:** skraca `swingDurationMs`, czyli
  jednocześnie **skraca root po zamachu** i przyspiesza moment trafienia. To
  realna zaleta przeciw Szaremu i watasze i jedyny mechaniczny argument za nią,
  jaki dziś istnieje — nie widać go w dps.
- **Kondycja nie ma konkurencji w swojej roli.** Nie jest porównywalna z dwoma
  pozostałymi: nie zwiększa obrażeń w ogóle. Jej problemem nie jest siła, tylko
  to, że rywalizuje o ten sam punkt co stat zwiększający dps ×5.

---

## 5. Opcje

Kalibracja poniżej: **model procentowy** = Siła mnoży obrażenia BRONI zamiast
dodawać do nich płasko. Policzone dla dwóch wartości.

| model | rozpiętość drabinki | najlepsza broń | dps miecza przy 10 pkt | dps szczytowe (49 pkt) |
|---|---|---|---:|---:|
| **A — dziś (płasko +1)** | ×1,74 → ×1,31 | młot → **sztylet** | 48,2 | 161,1 (sztylet) |
| **B — +5% / pkt** | **×1,74 na całej krzywej** | **młot zawsze** | 38,6 | 101,1 (młot) |
| **C — +8,7% / pkt** | **×1,74 na całej krzywej** | **młot zawsze** | **48,2** | 154,1 (młot) |

⚠ **Model procentowy zachowuje drabinkę broni DOKŁADNIE — ×1,74 przy każdej
inwestycji** — bo skaluje broń, zamiast ją omijać. To nie jest efekt strojenia,
tylko własność modelu.

- **Opcja A — zostawić.** Zero pracy, zero ryzyka regresji. Koszt: sprzęt
  przestaje mieć znaczenie wraz z rozwojem postaci, czyli odwrotnie niż w grze
  o zdobywaniu sprzętu, a bramki `requires` prowadzą do broni gorszej niż ta bez
  bramki.
- **Opcja B — +5%/pkt.** Drabinka wraca, ale to **wyraźny nerf gracza**
  (miecz przy 10 pkt: 48,2 → 38,6, czyli −20%). Wymagałby przestrojenia HP
  przeciwników, więc jest to zmiana balansu całej gry, nie jednego pola.
- **Opcja C — +8,7%/pkt (kalibrowane).** Skalibrowane tak, żeby **moc gracza
  w realnym przedziale nie zmieniła się wcale**: miecz przy 10 pkt = 48,2, czyli
  co do dziesiątej części dzisiejsza wartość. Szczyt też wychodzi porównywalnie
  (154 vs dzisiejsze 161). Zmienia się wyłącznie **kto jest najlepszy** — i to
  jest cały cel.
  ⚠ Kalibracja jest robiona **na mieczu przy 10 pkt**. Inne bronie przy innych
  inwestycjach przesuwają się o kilka procent; to jest do sprawdzenia, nie do
  przyjęcia na wiarę.
- **Opcja D — obniżyć `damagePerStrength` poniżej 1.** Odrzucam jako pozorną:
  spowalnia odwracanie drabinki, nie usuwa go, a jednocześnie osłabia jedyny
  atrybut, który dziś cokolwiek znaczy. `CLAUDE.md` ostrzega wprost, żeby nie
  „naprawiać" tego nudgowaniem liczb.

---

## 6. Ryzyka

**R-1 — to jest zmiana balansu CAŁEJ gry, nie jednego pola.** Siła wchodzi do
`meleeDamageMin/Max`, a te do każdego trafienia, każdego wariantu ataku, każdej
redukcji pancerza i pośrednio do tempa zdobywania XP. Nie da się tego wdrożyć
„na próbę i zobaczymy".

**R-2 — bramki `requires` trzeba przemyśleć razem z modelem.** Dziś Siła 6 na
młot jest jednocześnie ceną wstępu i największym bonusem. W modelu procentowym
Siła 6 nadal odblokowuje młot, ale młot jest wtedy realnie najlepszą bronią —
czyli bramka zaczyna znaczyć to, co miała znaczyć. Do sprawdzenia, czy nie robi
się wtedy **za** atrakcyjna.

**R-3 — Zręczność nadal przegrywa.** Model procentowy nie naprawia stosunku
Siła:Zręczność sam z siebie; naprawia stosunek broni do siebie. Osobne pytanie,
czy Zręczność ma zostać statem „dla stylu gry" (krótszy root, więcej krytów),
czy dostać własne podniesienie.

**R-4 — brak respeca podnosi cenę każdej pomyłki.** Jeśli model się zmieni,
istniejące zapisy niosą punkty wydane pod stare zasady. Do decyzji, czy to
w ogóle problem na etapie prototypu (prawdopodobnie nie), ale trzeba to
powiedzieć wprost, a nie odkryć później.

**R-5 — DPS jednocelowy to nie jest cała prawda.** Patrz §1. Każdy wniosek
o siekierze i młocie z tych tabel jest niepełny, dopóki nie zważy się łuku
i przerwania. Model procentowy tego nie zmienia, ale ocena „czy młot jest teraz
OK" bez tego jest nieprawdziwa.

---

## 7. Pytania do recenzenta

1. **Czy odwrócenie drabinki broni (§4.2) jest problemem do naprawy teraz, czy
   akceptowalnym stanem prototypu?** Kluczowy fakt: sztylet wyprzedza młot już
   przy Sile 5, a młot wymaga Siły 6 — bramka prowadzi do broni gorszej od tej
   bez bramki.
2. **Jeśli naprawiać: opcja C (moc bez zmian, zmienia się tylko kolejność) czy
   B (drabinka + świadomy nerf, z przestrojeniem HP przeciwników)?**
3. **Czy Zręczność ma zostać statem „niszowym"** (root, kryty, tempo), skoro
   przegrywa 3–8× na punkt w dps — czy to osobne zadanie?
4. **Czy sufity Zręczności (§4.3), nieosiągalne z atrybutów, mają zostać
   sufitami sprzętowymi**, czy to niezamierzone?
5. **Czy 49-punktowy budżet ma jakikolwiek sens**, skoro wymaga ~148 przejść
   mapy? Czy balansujemy pod 0–15 punktów i traktujemy resztę jako martwą?

---

## 8. Recenzja zewnętrzna (GPT) — przyjęte i skorygowane

Recenzent zaproponował ten sam kierunek co §5 (Siła → procent, kalibracja
bliska +8,7%), odrzucił czwarty atrybut i zwiększanie puli punktów — zgodnie
z §6/§8 tej analizy. Cztery punkty jego oceny wymagały korekty przed
przyjęciem:

### 8.1 ⚠ „Zręczność = tempo i mobilność" jest odwrotnością tego, co robi kod

Recenzent zbudował tożsamość Zręczności na skróconym rootcie. Zmierzone
(miecz; ten sam kierunek na każdej broni):

| Zręczność | cooldown | root | udział rootu w cyklu | wolnego ruchu / s |
|---:|---:|---:|---:|---:|
| 0 | 500 ms | 220 ms | 44,0% | **560 ms** |
| 10 | 446 | 201 | 45,0% | 550 |
| 20 | 403 | 185 | 45,9% | 541 |
| 49 | 315 | 153 | **48,7%** | **513 ms** |

**Inwestowanie w Zręczność ZMNIEJSZA ilość wolnego czasu na sekundę**, nie
zwiększa. Przyczyna jest w kodzie: `rootedUntil = swingDurationMs + 40` —
zamach skaluje się przez `1/(1+bonus)`, a stałe `+40 ms` nie skaluje się wcale,
więc im szybciej gracz macha, tym większy procent cyklu zajmuje ten sam bufor.

Poprawne zdanie: Zręczność **skraca pojedyncze zobowiązanie** (220→153 ms, więc
po KONKRETNYM zamachu reagujesz wcześniej), ale **wydłuża sumaryczne
ukorzenienie** przy podtrzymywanym autoataku, który jest stanem domyślnym.
Ucieczki to nie dotyczy — `resolveAttack` nie startuje zamachu przy wciśniętym
ruchu, root szkodzi tylko w wymianie ciosów stojąc.

⚠ Jedna linijka mogłaby to naprawić (skalować `+40` razem z zamachem), ale to
osobna decyzja od modelu Siły i nie jest tu proponowana do wdrożenia.

### 8.2 ⚠ „Kondycja jest najmniej gameplayowa" nie ma pomiaru za sobą

To była teza (moja, z poprzedniej tury), zacytowana przez recenzenta i
awansowana na ustalenie. Nie da się jej dziś obronić: **nie istnieje kurs
wymiany między HP a dps** w tej analizie. Porównanie „+1 Siła vs +1
Zręczność" jest legalne (ta sama waluta — dps). Porównanie z Kondycją nie ma
tu żadnej wspólnej miary.

Uczciwa miara wymaga realnego starcia: czas-do-zabicia-przeciwnika vs
czas-do-śmierci-gracza, dla porównywalnych inwestycji w Siłę i w Kondycję.
Bez tego pomiaru każda decyzja o dodaniu Kondycji nowego efektu byłaby
budowaniem na intuicji — dokładnie to, przed czym ostrzega §6/opcja D.

### 8.3 Sprzeczność w rekomendacji GPT

Punkt 2 jego odpowiedzi proponuje Kondycji nowy trzeci efekt („odporność/
stabilność"), punkt 3 mówi „nie dawałbym jej efektu na ślepo", zakończenie
mówi „nie dokładać kolejnych rzeczy". Przyjęta wersja: **punkt 3** — żadnego
nowego efektu przed pomiarem z §8.2.

Podobna usterka kolejności w proponowanym AR-1: p.1 „przeliczyć Siłę na
procent" (decyzja) poprzedza p.2 „porównać modele" (weryfikacja, na której ta
decyzja miała stać). W CR-1…CR-3 kolejność była odwrotna i to działało.

### 8.4 ⚠ Niewycenione ryzyko: łańcuch mnożników jakość × wariant × Siła

Dziś: `obrażenia = baza(jakość) × wariant + Siła×1` — Siła jest DODAWANA, więc
tłumi względny wpływ jakości. W modelu procentowym:
`obrażenia = baza(jakość) × wariant × (1 + Siła×p)` — **jakość, wariant i
Siła zaczynają się MNOŻYĆ**. Przy Sile 20 i p=8,7% mnożnik Siły to ×2,74,
czyli różnica Podła↔Arcymistrzowska rośnie niemal trzykrotnie względem dziś.

`docs/jakosc_wykonania.md` ma świadomą decyzję trzymania jakości w 1–4 właśnie
po to, żeby nie przebiła drabinki broni — model procentowy zmienia arytmetykę,
na której ta decyzja stała. Im wyższe `p`, tym mocniej rośnie ten efekt.
**Nie wybierać `p` bez wyceny tego mnożnika.**

### 8.5 Liczby w przykładzie GPT nie mieszczą się w budżecie gry

„10 STR / 10 DEX / 10 CON" to 30 punktów = poziom 31 = ponad 10 pełnych
przejść mapy (§3: jedno przejście = 10 punktów łącznie). Realna przestrzeń
decyzji to podziały typu 6/4/0, nie 10/10/10 — przy 10 punktach presja na
Siłę jest silniejsza, niż sugeruje ten przykład.

### 8.6 Poprawiony zakres AR-1 (do zatwierdzenia, nie wdrożone)

1. Zacząć od porównania modeli (jak §5), decyzja o Sile na końcu — nie na
   początku.
2. Dodać wycenę łańcucha mnożników z §8.4 przed wyborem `p`.
3. Dodać pomiar Kondycji kursem wymiany (§8.2) przed jakąkolwiek decyzją o
   nowym efekcie.
4. Zmierzyć Zręczność jako „krótsze zobowiązanie kontra mniej wolnego czasu na
   sekundę" (§8.1), nie jako „mobilność". Do rozstrzygnięcia przy okazji: czy
   `+40 ms` w `rootedUntil` ma się skalować z zamachem.
5. Bez czwartego atrybutu, bez zmian XP, bez zmian pancerza, bez implementacji
   przed zatwierdzeniem — te zakazy z propozycji GPT zostają.

---

## 9. Czego świadomie NIE proponuję

- **Nowych atrybutów.** `CLAUDE.md` ma to jako ⏳; dopóki trzy istniejące nie
  są względem siebie sensowne, czwarty tylko rozcieńczy problem.
- **Respeca.** Osobna decyzja, wpływa na `requires` i na zapisy.
- **Ruszania krzywej XP** — zaparkowane osobno, i wrzucenie tego razem
  uniemożliwiłoby ocenę, co zadziałało (ta sama reguła, która wyłączyła ciężar
  pancerza z CR-2 i strojenie `ARMOR_PROFILE` z CR-3).
- **Strojenia `ARMOR_PROFILE`** — zaparkowane po CR-3, osobny wątek.

---

## 10. Nowy model atrybutów (2026-08-20) — ✅ WDROŻONY

Status: **wdrożone.** `ATTRIBUTES`, siedem broni + gołe ręce, `Progression`,
`Player.triggerAttack`, `PlayerPanel` oraz dwa generatory (`katalog_ekwipunku`,
`macierz_walki`) — `tsc --noEmit` i `npm run build` czyste.

⚠ **§1–§9 tego dokumentu opisują stan SPRZED tej zmiany** i zostają jako zapis
tego, co ją wymusiło. Przy sprzeczności z §10 wygrywa §10.

Liczby niżej wychodzą z `tools/atrybuty_kalibracja.mjs`, który czyta prawdziwe
wartości przez esbuild i **sprawdza sam siebie** dwiema asercjami: (a) model
stary odtwarza liczby z `docs/ekwipunek_przedmioty.md`, (b) **model nowy przy
0 pkt daje dokładnie te same liczby co stary** — czyli zmiana jest niewidoczna
dla świeżej postaci.

Decyzje autora, które ta kalibracja realizuje:
1. **Skalowanie PER BROŃ**, nie jednolity procent (§10.1 — powód).
2. **Zręczność: rozdzielenie zobowiązania i odzyskania** (§10.5).

### 10.1 Dlaczego per broń, a nie jednolite `p` — pomiar, którego §5 nie miała

⚠ **Model jednolicie procentowy zachowuje drabinkę, ale ją ZAMRAŻA.** Zmierzone:
przy każdym `p` rozpiętość wynosi ×1,74 na całej krzywej, bo model mnoży
wszystko tak samo — **więc najlepszą bronią jest młot przy Sile 0 i przy Sile
15, dla postaci siłowej i dla zręcznościowej.** Wybór broni przestaje być
wyborem buildu. Zamiana odwróconej drabinki na zamrożoną nie jest celem.

Skalowanie per broń jest jedynym z trzech modeli, w którym **odpowiedź na
pytanie „która broń jest najlepsza" zależy od BUILDU** (§10.3).

⚠ I nie balans jest tu rozstrzygający, tylko przyszłość: **to jedyny model, do
którego wpina się łuk i magia bez wyjątku w kodzie.** Przy „+X% obrażeń
fizycznych od Siły" łuk jest nierozwiązywalny.

### 10.2 Skalibrowane współczynniki

`obrażenia = baza(jakość) × wariant × (1 + SIŁ×strScale + ZRĘ×dexScale)`

| broń | cena | `strScale` | `dexScale` | oś |
|---|---:|---:|---:|---|
| Osiosany kij | 12 | 0,030 | 0,030 | starter — **ma odpadać** |
| Sztylet | 40 | 0,015 | 0,062 | skrajnie ZRĘ |
| Toporek | 70 | 0,045 | 0,038 | lekko ZRĘ |
| Miecz | 110 | 0,050 | 0,045 | **celowo neutralny** (punkt odniesienia) |
| Włócznia | 150 | 0,080 | 0,035 | SIŁ ⚠ patrz §10.6 |
| Siekiera | 180 | 0,070 | 0,020 | SIŁ |
| Młot | 280 | 0,080 | 0,005 | skrajnie SIŁ |

### 10.3 Test rozstrzygający: najlepsza broń zależy od buildu ✅

| build | dziś (płasko) | po zmianie |
|---|---|---|
| baza | Młot | Młot |
| SIŁ 5 / 10 / 15 | Siekiera / **Sztylet** / **Sztylet** | **Młot / Młot / Młot** |
| ZRĘ 5 / 10 / 15 | Młot / Młot / Młot | **Sztylet / Sztylet / Sztylet** |

⚠ **Dziś przy Sile 15 najlepszą bronią jednocelową jest sztylet za 40 g —
bramka Siły prowadzi do broni gorszej niż broń bez bramki.** Po zmianie ten
stan znika.

Rozpiętość **bez kija** (starter zawyża ją o rzecz zamierzoną): ×1,26 w bazie →
×1,83 przy SIŁ 10 → ×2,10 przy SIŁ 15. Rozpiętość MA rosnąć — to znaczy, że
sprzęt i build zaczynają znaczyć — ale ×2,1 w realnym paśmie jest sufitem,
powyżej którego „najlepsza broń" staje się przymusem zamiast wyboru.

### 10.4 Cztery pozostałe sprawdzenia

**(a) Cena śledzi moc — ASERCJA, nie wrażenie.** Przymiar sprawdza w obrębie
buildu, czy droższa broń jest lepsza (reguła, którą projekt egzekwował ręcznie
przy `WEAPON_FAMILY.axe`). **Buildy siłowe: czysto na wszystkich poziomach.**
Cztery naruszenia zostały i wszystkie są informacją, nie usterką — patrz §10.6.

> ⚠ **NIEAKTUALNE OD 2026-09-05: jest 23 naruszeń, nie cztery, a buildy siłowe
> NIE są już czyste.** To **nie jest** regresja modelu — roster urósł
> z 7 do 11 broni, a wszystkie nowe naruszenia dotyczą pozycji, których ta
> kalibracja nigdy nie widziała (**Pałka, Krótki miecz, Topór bojowy, Młot
> bojowy**). Dwa wzorce powtarzają się w każdej kolumnie: `Krótki miecz (75 g)
> < Toporek (70 g)` i `Młot bojowy (360 g) < Topór bojowy (320 g)` — ten drugi
> to ta sama sprawa, co zaparkowana nota „`Młot` 1H bije `Młot bojowy` 2H".
> **To jest sygnał balansowy do playtestu, nie usterka do naprawy teraz**
> (`docs/konfiguracje_broni_checkpoint.md` §2, decyzja 4). Liczby §10.4(c),
> §10.4(d) i §10.3 są **potwierdzone bez zmian** — patrz §11.6.

**(b) Warianty ataku przestają się spłaszczać.** Przewaga Cięcia nad Pchnięciem:

| | SIŁ 0 | SIŁ 4 | SIŁ 10 |
|---|---:|---:|---:|
| dziś (miecz) | 11,8% | 6,9% | **3,3%** |
| po zmianie (miecz) | 11,8% | **11,8%** | **11,8%** |
| dziś (siekiera) | 23,5% | 18,3% | 14,4% |
| po zmianie (siekiera) | 23,5% | **23,5%** | **23,5%** |

To jest jeden z trzech systemów, które płaska Siła erodowała, przywrócony
**własnością modelu**, a nie strojeniem.

**(c) Łańcuch mnożników wyceniony — §8.4 żądało tego PRZED wyborem liczby.**
Najmocniejszy realny cios (Arcymistrzowska × wariant × atrybut × Okrzyk ×
krytyk):

| broń | dziś @SIŁ15 | po zmianie @SIŁ15 | wzrost |
|---|---:|---:|---:|
| Sztylet | 69,7 | 35,7 | ×0,51 |
| Miecz | 70,0 | 58,7 | ×0,84 |
| Siekiera | 81,4 | 81,7 | **×1,00** |
| **Młot** | 86,0 | 109,1 | **×1,27** |

⚠ Najgorszy przypadek to ×1,27 i dotyczy najdroższej, najmocniej bramkowanej
broni w pełnym buildzie siłowym. **Przy SIŁ 0 wszystkie bronie wychodzą
identycznie (×1,00)** — świeża postać nie odczuje zmiany w ogóle.

**(d) Kurs wymiany atrybutów — na TRZECH broniach, nie na jednej.**
Przyrost procentowy na punkt (przeżywalność ∝ HP × DPS):

| pkt | %HP (KON) | Młot SIŁ/ZRĘ | Miecz SIŁ/ZRĘ | Sztylet SIŁ/ZRĘ |
|---:|---:|---|---|---|
| 0 | 6,00 | **8,00** / 1,71 | 5,00 / 5,75 | 1,50 / **7,47** |
| 5 | 4,62 | 5,61 / 1,49 | 3,39 / 4,22 | 1,08 / 5,66 |
| 10 | 3,75 | 4,32 / 1,34 | 2,56 / 3,40 | 0,85 / 4,61 |
| 15 | 3,16 | 3,52 / 1,24 | 2,06 / 2,89 | 0,70 / 3,92 |

> ⚠ **Etykieta „KON" w tej tabeli znaczy dziś WITALNOŚĆ.** Kolumna mierzy
> `%HP na punkt`, a HP należy od 2026-08-21 do Witalności; dzisiejsza Kondycja
> nie daje HP w ogóle (daje pulę staminy). Liczby zostają — zmieniła się nazwa
> atrybutu, nie pomiar. Patrz §11.
>
> ⚠ Kolumny `SIŁ/ZRĘ` liczą dps **z krytykiem zależnym od Zręczności**, którego
> kod już nie ma. Kierunek wniosku (parytet w „właściwym sprzęcie") się trzyma,
> ale bezwzględne wartości ZRĘ są w tej tabeli **zawyżone**.

⚠ **To jest cały wynik tej analizy w jednej tabeli.** Dziś (miecz, 0 pkt):
SIŁ 8,70 przeciw ZRĘ 1,63, czyli **×5,3**. Po zmianie każdy stat we
**właściwym sprzęcie** daje 6,00–8,00 na punkt — rozstrzał ×1,33.

**Wartość punktu zależy teraz od tego, co trzymasz w ręku.** To nie jest
poprawka balansu; to jest różnica między atrybutem będącym decyzją a atrybutem
będącym listą zakupów.

### 10.5 Zręczność: recovery

Do tej zmiany `root = zamach + 40` (`Player.triggerAttack`), a `+40` nie skalowało się
wcale — **więc inwestowanie w Zręczność ZMNIEJSZAŁO wolny czas** (560 → 541 ms/s
przy ZRĘ 20). ⚠ Samo przeskalowanie `+40` daje dokładnie **zero** (560 ms/s
przy każdej wartości), a nie poprawę. Potwierdzone pomiarem.

Model wdrożony (`Progression.rootDurationMs`):

```
root = zamach×hitFraction + (zamach×(1−hitFraction) + 40) × (1 − redukcja)
redukcja = min(ZRĘ × recoveryPerAgility, maxRecoveryReduction)
```

Zobowiązanie do klatki trafienia zostaje (to jest zapowiedź i czytelność pozy);
Zręczność skraca to, co PO trafieniu.

| `recoveryPerAgility` | ZRĘ 10 | ZRĘ 20 | root/cykl przy ZRĘ 10 |
|---|---:|---:|---:|
| — (dziś) | 550 ms/s | 541 | 45,0% |
| **0,020 (wybrane)** | **604** | 652 | **39,6%** |
| 0,030 | 631 | 680 | 36,9% |

**0,020**, bo Zręczność ma już w §10.4(d) parytet w dps — przy 0,030 dostawałaby
tożsamość i przewagę liczbową naraz. Przy ZRĘ 0 root wynosi 220 ms, czyli
**dokładnie tyle co dziś** — zero regresji dla postaci, która w to nie
inwestuje. `maxRecoveryReduction = 0,5` (wiąże dopiero od ZRĘ 25).

⚠ **Skutek uboczny do przyjęcia świadomie:** `docs/tarcze_analiza.md` opiera
tarczę na zdaniu *„tarcza jest odpowiedzią na twój własny root"*. Krótszy root
osłabia ten argument **dla buildu zręcznościowego** — i to jest właściwe
(zręczny unika, siłacz blokuje), ale nie jest darmowe.

⚠ **`guardDir` czyta `attackPoseUntil`, nie `rootedUntil`.** Poza ataku zostaje
bez zmian, więc po skróceniu roota gracz może się ruszyć, mając osłonę wciąż
zwróconą w stronę ciosu. Czyta się to poprawnie („jeszcze się składasz"), ale
jest to ZMIANA i nie wolno jej odkryć po wdrożeniu.

### 10.6 Co kalibracja WYKRYŁA, a czego nie naprawia

⚠ **W rosterze nie ma drogiej broni lekkiej.** Asercja cenowa świeci na czerwono
przy każdym buildzie zręcznościowym: `Toporek (70 g) < Sztylet (40 g)`. Sztylet
za 40 g jest końcem drabinki dla Zręczności — czyli **postać zręcznościowa nie
ma na co wydawać złota**, co dokłada się do zmierzonego problemu martwej waluty
(`docs/odlozone.md` §1). To jest **luka w zawartości, nie wada modelu**, i model
właśnie ją ujawnił.

⚠ **Włócznia dalej nie płaci za `hands: 2`.** Współczynnik podniesiono tak, żeby
drabinka cen się zgadzała, ale przy buildzie mieszanym różnica z mieczem to
0,2 dps. **To NIE jest naprawa dwuręczności** — tamto zostaje tam, gdzie było
(`docs/bron_dwureczna_analiza.md`, `docs/udzwig_umiejetnosci.md` §1).

⚠ **HP przeciwników nie ma krzywej.** Roster to 30–190 HP przy mnożniku gracza
~×2,0 w paśmie 0–15. Dopóki moc gracza w tym paśmie się nie zmienia (§10.4c),
nie jest to blokada — ale **przy każdym późniejszym ruszeniu `strScale` w górę
staje się nią natychmiast.**

### 10.7 Czego ta kalibracja świadomie NIE obejmuje

Bez zmian, zgodnie z §9 i `docs/odlozone.md`: obciążenie i `requires` (zależne
od `weight`, patrz `docs/udzwig_umiejetnosci.md`), krzywa XP, `ARMOR_PROFILE`,
respec, czwarty atrybut.

---

# 11. STAN AKTUALNY — CZTERY ATRYBUTY (audyt 2026-09-05)

> ⚠ **Ta sekcja opisuje KOD, nie propozycję.** Sprawdzona przeciw
> `src/config/GameConfig.ts` i `src/core/Progression.ts`. Przy sprzeczności
> z §1–§10 **wygrywa §11**. Powstała, bo dokument opisywał **trzy** atrybuty,
> a `Progression.Attribute` ma cztery od 2026-08-21.

```ts
export type Attribute = "strength" | "vitality" | "conditioning" | "agility";
//                        Siła        Witalność    Kondycja        Zręczność
```

## 11.1 Co każdy atrybut robi DZISIAJ

| Atrybut | Efekt | Pole / wzór | Sufit |
|---|---|---|---|
| **Siła** | mnożnik obrażeń, **per broń** | `1 + SIŁ × strScale + ZRĘ × dexScale` (§10.2) | — |
| | udźwig sprzętu | `EQUIPMENT_LOAD.base 20 + perStrength 2,5` | — |
| | **dostęp** do przedmiotów | `requires` na przedmiocie | — |
| **Witalność** | max HP | `ATTRIBUTES.hpPerVitality: 6` | — |
| | regeneracja HP | `ATTRIBUTES.hpRegenPerVitality: 0,04` | — |
| **Kondycja** | pula staminy | `STAMINA.base 120 + perConditioning 10` (przez `Stamina.syncMax`) | — |
| **Zręczność** | mnożnik obrażeń, **per broń** | `dexScale` (§10.2) | — |
| | tempo ataku | `ATTRIBUTES.attackSpeedPerAgility: 0,012` | `maxAttackSpeedBonus: 0,6` |
| | skrócenie **recovery** po zamachu | `ATTRIBUTES.recoveryPerAgility: 0,02` (§10.5) | `maxRecoveryReduction: 0,5` |
| | **unik** | `DEFENSE.dodge.base 0,04 + perAgility 0,004`, `lightLoadBonus 1,3` | `dodge.cap 0,5` |

⚠ **Niezmiennik Witalności, łatwy do złamania po cichu:**
`hpRegenPerVitality = hpPerVitality / 150` (6/150 = 0,04). Trzyma własność
„pół paska w ~75 s przy każdym buildzie" (zmierzone w §2: 77/76/76/76/75 s).
**Zmiana jednej z tych dwóch liczb bez drugiej łamie ją bezgłośnie.**

## 11.2 Czego atrybuty NIE robią — a dokument twierdził, że robią

⚠⚠ **KRYTYK NIE ZALEŻY OD ŻADNEGO ATRYBUTU.** `Progression.critChance` to
dziś wyłącznie:

```
min( PLAYER.critChance (0,15) + Equipment.bonusCritChance
     + weaponMelee.critChanceBonus ,  ATTRIBUTES.maxCritChance (0,6) )
```

Pole `ATTRIBUTES.critChancePerAgility` **nie istnieje** w `GameConfig.ts`.
Konsekwencje, żeby ktoś nie wyciągnął starych wniosków:
- **§2, §4.1, §4.3 i §10.4(d)** liczą dps ze wzorem zawierającym krytyk ze
  Zręczności — te liczby są **historyczne**;
- teza §4.3 („oba sufity Zręczności są nieosiągalne z atrybutów") jest dziś
  prawdziwa **z innego powodu**: `maxCritChance` w ogóle nie jest sufitem
  atrybutu, tylko sufitem sprzętu i broni;
- `tools/atrybuty_kalibracja.mjs` trzyma `critChancePerAgility: 0.006`
  w obiekcie `STARY` — **i to jest poprawne**, to jest model odniesienia sprzed
  2026-08-20, nie stan bieżący.

⚠ **Kondycja nie daje HP.** §2 i §10.4(d) przypisują HP „Kondycji"; od
2026-08-21 HP należy do **Witalności**, a Kondycja odpowiada za pulę staminy.
Pola `hpPerEndurance` / `hpRegenPerEndurance` z §2 **nie istnieją**.

⚠ **Siła nie jest płaską premią do obrażeń.** `damagePerStrength` nie istnieje
od wdrożenia §10 — obrażenia skalują się mnożnikiem per broń.
📌 Wpis „Siła to płaska premia do obrażeń" w `CLAUDE.md` → „⏳ Otwarte" jest
z tego powodu **nieaktualny**; to znany, zaparkowany dług dokumentacyjny
(`docs/konfiguracje_broni_checkpoint.md` §3), a nie nowe znalezisko.

## 11.3 Gdzie mieszka reszta

| temat | dokument |
|---|---|
| Rozdział Witalność / Kondycja, cała mechanika staminy | `docs/stamina_model.md` |
| Model skalowania per broń, `strScale`/`dexScale`, recovery | **§10 tego pliku** |
| Udźwig, `requires`, obciążenie | `docs/udzwig_umiejetnosci.md` |
| Unik / parowanie / blok jako łańcuch obrony | `docs/tarcze_analiza.md` §C, `docs/ekwipunek_mechanika.md` |
| Biegłość (`P`, `m(P)`, Mastery) — **oś prostopadła do atrybutów** | `docs/bieglosc_checkpoint.md` |

⚠ **Biegłość nie jest atrybutem i nie kupuje się jej punktami.** Rośnie
z praktyki, per rodzina broni. Nie mieszaj tych dwóch osi przy strojeniu.

## 11.4 Krytyk ze Zręczności — ROZSTRZYGNIĘTE (2026-09-05)

✅ **Usunięcie krytyka ze Zręczności było ŚWIADOME** (decyzja autora,
2026-09-05). Nie przywracaj `ATTRIBUTES.critChancePerAgility` i nie traktuj
jego braku jako regresji do naprawienia.

⚠ **Dług w KODZIE, nie w dokumentacji:** `GameConfig.ts` ma dwa komentarze,
które wciąż powołują się na to nieistniejące pole. Zostają do świadomego
sprzątnięcia — **nie usuwaj ich przy okazji czegoś innego**, bo drugi z nich
niesie realny pomiar:
- **`WEAPON_FAMILY.axe`** — opisuje rozdział „**Zręczność → jak często
  krytykujesz**, rodzina Axe → jak mocno boli krytyk". Po decyzji **pierwsza
  połowa tego rozdziału nie istnieje**: topór nadal podbija SIŁĘ krytyka
  (`critMultiplierBonus`), ale częstotliwość nie zależy już od atrybutu, tylko
  od `PLAYER.critChance` + sprzętu + broni. Tożsamość rodziny **działa**, jej
  uzasadnienie w komentarzu jest przestarzałe.
- **`COMBAT_FEEDBACK.typeFeedback`** — zdanie „`critChancePerAgility` podnosi
  szansę do 60%, więc kanał psułby się tym bardziej, im dalej gracz rozwija
  postać". ⚠ **Wniosek zostaje w mocy**, tylko przyczyna jest inna: do 60%
  dowozi dziś sprzęt i broń, a nie rozwój postaci. Sam pomiar (błędny wniosek
  gracza w 35% przy n=5, 22,3% przy n=20 z krytykami wobec 1,2% bez) jest
  nietknięty i nadal uzasadnia deterministyczny kanał.

## 11.5 Otwarte pytanie balansowe — DO PLAYTESTU, nie teraz

❓ **Czy Zręczność ma dziś za dużo korzyści?** Pytanie postawione przez autora
2026-09-05. **Z obecnych danych NIE DA SIĘ na nie odpowiedzieć** i warto
wiedzieć dlaczego, żeby nikt nie odpowiedział na nie „na oko":

Zręczność ma **cztery** kanały (obrażenia `dexScale`, tempo, recovery, unik)
przy trzech Siły, dwóch Witalności i **jednym** Kondycji — z szerokości wygląda
na przeładowaną. Ale jedyny pomiar parytetu, jaki istnieje — **§10.4(d)** —
liczy dziś **źle w obie strony naraz**:

- **zawyża** Zręczność, bo wlicza krytyk, którego już nie ma (§11.2);
- **zaniża** ją, bo jest oparty na `%HP × DPS`, więc **unik i recovery w ogóle
  w nim nie siedzą**.

Który błąd jest większy — nie wiadomo, a różnica netto **jest** odpowiedzią na
to pytanie.

⚠ Kontekst historyczny, żeby nie pomylić kierunku: Zręczność była w tym
projekcie **stat-pułapką** (§4.1: przewaga Siły ×4,6), §10 dopiero ją wyrównał,
a usunięcie krytyka pchnęło ją **z powrotem w dół**, nie w górę.

⛔ **Rozstrzygnięcie wymaga nowego pomiaru wartości punktu z unikiem
i recovery — czyli BALANSU WARTOŚCI.** To jest jedna z decyzji zamkniętych
w `docs/konfiguracje_broni_checkpoint.md` §2: *nie balansujemy konkretnych
wartości przed playtestem trzech konfiguracji.* Wraca po playteście, nie
wcześniej.

## 11.6 Naprawa `tools/atrybuty_kalibracja.mjs` (2026-09-05)

Przymiar **nie przechodził własnego samosprawdzenia** i miał **dwie niezależne
usterki tej samej klasy: czytał nazwy pól, których config już nie ma.** Obie
były CICHE — nie rzucały wyjątku, tylko drukowały złą liczbę.

| # | co czytał | co jest w kodzie | objaw |
|---|---|---|---|
| 1 | `"critMultiplierBonus" in f` — kształt `WEAPON_FAMILY` sprzed **Weapon Traits V1 (2026-09-03)** | cechy rodzin siedzą w `traits: [{ kind, value }]`; gra czyta je przez `familyTraitValue()` | warunek **zawsze fałszywy** → gubiona KAŻDA premia rodziny. Sztylet **24,0** zamiast 25,0 |
| 2 | `ATTRIBUTES.hpPerEndurance` — nazwa sprzed **rozdziału atrybutu (2026-08-21)** | `hpPerVitality` | cała kolumna `%HP/pkt` wychodziła **`NaN`** — czyli dokładnie kurs wymiany z §10.4(d) |

⚠ **Objaw usterki nr 1 był wąski, sama usterka nie.** Z pięciu broni
referencyjnych tylko sztylet należy do rodziny z premią do krytyka, więc na
czerwono świecił jeden wiersz — ale rodzina `axe` (`critMultiplierBonus: 0,25`)
była liczona równie źle i wchodzi do asercji cenowej.

**Naprawa nie przepisuje reguły drugi raz:** `core/WeaponTraits.ts` nie ma
żadnych importów runtime, więc przymiar buduje go tak samo jak config i woła
**prawdziwe** `familyTraitValue`. Następny refaktor kształtu cech złamie build
tego pliku, a nie jego wyniki.

### Co ta naprawa POTWIERDZIŁA

Po naprawie samosprawdzenie przechodzi **10/10** (sztylet 25,0), a tabele
wychodzą **identycznie** jak zapisane w §10 z 2026-08-20:

- **§10.4(c)** łańcuch mnożników — sztylet ×0,51, miecz ×0,84, siekiera ×1,00,
  młot ×1,27: **bit w bit**;
- **§10.4(d)** kurs wymiany — `%HP/pkt` 6,00 / 4,62 / 3,75 / 3,16 oraz wszystkie
  kolumny SIŁ/ZRĘ: **bit w bit**.

⚠ **`docs/ekwipunek_przedmioty.md` był poprawny przez cały czas** — to przymiar
kłamał. Wcześniejsza hipoteza („dokument opisuje sztylet sprzed cech rodzin")
była **błędna** i została wycofana.

### Co pozostaje otwarte

⚠ **Asercja cenowa daje dziś 23 naruszenia zamiast czterech** — patrz nota przy
§10.4(a). Przyczyna to **rozrost rosteru z 7 do 11 broni**, nie model. Sygnał
balansowy, zaparkowany do playtestu.
