---
typ: STAN
domena: weapons
tytul: Broń — rodziny, warianty, zasięg
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-07, przymiar:doc_check, przymiar:combat_regresja, przymiar:katalog_ekwipunku]
kotwice:
  - src/core/WeaponTraits.ts
  - src/core/Equipment.ts
  - src/core/Progression.ts
  - GameConfig.WEAPON_FAMILY
  - GameConfig.ITEMS
  - GameConfig.DUAL_WIELD
otwarte: [OI-40, OI-42]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# Broń — rodziny, warianty, zasięg

> **Czym jest ten dokument.** Odpowiedzią na pytanie **czym jedna broń różni się
> od drugiej**: jakie osie ją opisują, czego rodzina nie przesądza, co wariant
> może zrobić i czego nigdy nie zrobi.
>
> **Czym NIE jest.** ⛔ **Nie podaje parametrów żadnej broni** — to są dane.
> Nie opisuje rozstrzygania ciosu, pancerza, biegłości ani przedmiotu jako
> przedmiotu; granice w §0.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| osie opisujące broń, rodzina, wariant, zasięg jako reguła | **`weapons`** |
| czym jest przedmiot; `weight`, `requires`, jakość, trwałość | `items` |
| jak cios się rozstrzyga, geometria, zamrożenie profilu | `combat` |
| typ obrażeń × materiał pancerza | `armor` |
| `P`, praktyka, ładunki rang skalujące cechę rodziny | `proficiency` |
| co robi punkt Siły i Zręczności | `attributes` |
| tarcza i to, co druga ręka robi z blokiem | `shields` |
| koszt zamachu jako system | `stamina` |
| zasięg i mnożnik konkretnej umiejętności | `abilities` |

### 0.1 Zależności

| kier. | domena | przez co |
|---|---|---|
| **daje** | `combat` | profil ciosu: zasięg, odrzut, przerwanie, zachwianie |
| **daje** | `armor` | typ obrażeń — na WARIANCIE, nie na broni |
| **daje** | `proficiency` | rodzinę jako jednostkę biegłości i **bazę** cechy |
| **daje** | `abilities` | zasięg — ⚠ umiejętność nie ma własnego |
| **daje** | `shields` | chwyt: druga ręka rozstrzyga profil 1.5H (§5.2) |
| **bierze** | `attributes` | skalowanie obrażeń per punkt |
| **bierze** | `proficiency` | mnożnik **EFEKTU** cechy z rangi |
| **bierze** | `items` | jakość egzemplarza i bramkę Siły |

---

## 1. Pięć osi, których nie wolno zlać

```
RODZINA       tożsamość archetypu        — klasyfikacja, opcjonalna cecha
MODEL         parametry konstrukcji      — obrażenia, tempo, zamach, zasięg, ręce, wymagania
TYP OBRAŻEŃ   rodzaj ciosu               — na WARIANCIE, nie na broni
RĘCE          ile rąk zajmuje            — własność PRZEDMIOTU
JAKOŚĆ        wykonanie egzemplarza      — domena `items`
```

⚠⚠ **Rodzina NIE jest wyprowadzana z typu obrażeń ani z liczby rąk.**
Najostrzejszy skutek: wariant obuchowy siekiery jest obuchowy, ale siekiera
należy do rodziny toporów — **więc nie dostaje osi obuchowej**. Inaczej wariant
przyznawałby zdolność, czego zabrania reguła zawężania (§3).

⚠ **Dwa modele tej samej rodziny mogą różnić się wszystkim innym** — zasięgiem,
tempem, ukorzenieniem, liczbą rąk, wymaganiami i wariantami. Rodzina niesie
**jedną wspólną oś**, nie komplet parametrów.

---

## 2. Rodzina

⚠ **Rodzina istnieje po to, żeby dziesięć przyszłych mieczy dziedziczyło oś
miecza bez kopiowania mechaniki do każdego z nich.**

⚠⚠ **Cecha rodziny jest DEKLARACJĄ, nie opcjonalnym polem liczbowym.** Rodzina
deklaruje **listę cech**; cecha może nieść liczbę albo być **czystym
znacznikiem**. ⛔ Poprzedni kształt — opcjonalne pole czytane strażnikiem
obecności — miał sufit i już go dotknął: rodzina, której tożsamością jest
**parametr modelu**, nie miała czego zadeklarować i wyglądała na rodzinę
z brakującym polem.

⚠ **Rodzina bez cechy mechanicznej niczego nie zmienia i to jest legalne.**
Jej tożsamość jest już dostarczona parametrami modelu. **Rodzina to
klasyfikacja, nie obowiązek posiadania bonusu.**

⚠ **Broń nie musi należeć do żadnej rodziny.** Broń startowa stoi poza nimi
świadomie — nie ma tożsamości do niesienia. *(Skutek w `proficiency`: brak
rodziny znaczy punkt neutralny, nie zero.)*

⚠ **Rangę skalującą cechę czyta `proficiency`, a mnoży się EFEKT, nie tę
liczbę.** Ten dokument dostarcza wyłącznie **bazę**.

---

## 3. Wariant i REGUŁA ZAWĘŻANIA

Wariant to **sposób użycia jednej broni** (1–3 na broń). Niesie typ obrażeń
i mnożniki na parametrach modelu.

⚠⚠ **REGUŁA ZAWĘŻANIA: wariant może zdolność ODEBRAĆ, nigdy DODAĆ.**
Nie stoi na dyscyplinie — jest **wymuszona w trzech niezależnych postaciach**:

| co | jak wymuszone |
|---|---|
| **przerwanie** | pole wariantu jest typu „tylko fałsz" — `true` **się nie kompiluje** |
| **odrzut** | mnożnik **przycięty do ≤ 1**, więc broń bez odrzutu zostaje na zerze niezależnie od tego, jak napisano jej warianty |
| **cecha rodziny** | wariant jej **w ogóle nie dotyka** — należy do rodziny, nie do sposobu użycia |

⭐ **To jest wzorzec do powtórzenia dla każdej przyszłej zdolności warunkowej:**
broń **deklaruje** ją raz, a warianty, które jej mieć nie powinny, **wyłączają
ją u siebie**.

⚠ **Typ obrażeń mieszka na WARIANCIE, nie na broni** — dlatego jedna broń może
mieć cięcie i pchnięcie, a pancerz odpowiada osobno na każde.

⚠ **Wariant neutralny jest normalny.** Broń jednowariantowa nie potrzebuje
żadnego mnożnika; brak pola znaczy „jak model".

---

## 4. Zasięg jako reguła systemowa

⚠⚠ **Zasięg jest własnością MODELU. Wariant może go tylko przemnożyć.**

⚠⚠ **Umiejętność NIE MA własnego zasięgu — bierze go z broni.** Decyzja
**odwrócona przez rozgrywkę**: własny, krótszy zasięg umiejętności okazał się
nie kosztem, tylko **martwym pasmem**, w którym autoatak trafia, a umiejętność
odmawia. ⛔ Nie przywracać go pod żadną nazwą.

⚠⚠ **Ani DRUGA RĘKA — zasięg (górny i dolny) należy do POSTACI.** Autoatak pyta
o **jedną** liczbę niezależnie od tego, która ręka jest na kolei; ręka
rozstrzyga, **czym** cios idzie, nigdy **czy** wolno go wyprowadzić.
⛔ Bramkowanie cyklu zasięgiem drugiej broni **zatrzymuje cykl na stałe**, i to
niemo — pilnują tego `§W10b`/`§W11` regresji.

⚠⚠ **Zasięg ma też DOLNĄ granicę — `melee.minReach`, opcjonalną.** Brak pola
znaczy `0`, czyli dotychczasowe zachowanie; poniżej tej liczby cios **nie trafia
w ogóle**. Mierzy się tą samą miarą co zasięg górny i skaluje tym samym
`reachMul` wariantu.
⛔ **Własność KONSTRUKCJI, nigdy rodziny** — włócznia i pika są obie `polearm`,
martwą strefę ma tylko druga. ⭐ To ona, a nie zasięg, różnicuje broń drzewcową:
wszystkie muszą stanąć powyżej progu orbity, czyli po tej samej stronie jedynej
liczby, która naprawdę rozstrzyga.
⭐ **Obietnica rodziny `polearm` jest NIEZMIENNIKIEM** (N-94, `§ZB Z9`): najkrótsza
drzewcowa sięga dalej niż najdłuższa niedrzewcowa. ⛔ Nie podnoś zasięgu toporów
na drzewcu do wartości włóczni.

⚠ **Zasięg mierzy się do KRAWĘDZI ciała celu, nie do środka** — konwencja należy
do `combat`; ⛔ jej zmiana zmieniłaby każdą liczbę zasięgu w grze naraz.

⚠⚠ **Zasięg jest jedyną osią, na której roster ma dziś PRÓG JAKOŚCIOWY, a nie
ciągłą skalę.** Istnieje dystans, poniżej którego broń nie sięga orbitującego
przeciwnika, a powyżej sięga — i przejście przez ten próg zmienia rolę broni
skokowo, nie stopniowo. ⚠ **Kto stroi zasięg, stroi przynależność do tej
kategorii**, a nie „trochę dalej". Skąd bierze się próg, czemu jest binarny i czemu pas ±2 px jest zakazany: `docs/decyzje/2026-09-07-prog-zasiegu-orbity.md`; co z tego zostaje otwarte — **OI-40**.

---

## 5. Model: co różnicuje broń

| oś | uwagi |
|---|---|
| obrażenia | zakres; ⚠ **rozstrzał jest osią tożsamości**, nie szumem |
| **skalowanie atrybutami** | ⚠⚠ **wymagane, bez wartości domyślnej** — to jest oś, na której młot należy do siłacza, a sztylet do zręcznościowca |
| tempo i **czas zamachu** | ⚠ **zawsze razem**; z czasu zamachu wyprowadzone są ukorzenienie i moment trafienia |
| zasięg i **dolna granica** | §4 |
| odrzut, przerwanie, **parowanie** | deklarowane przez broń, wyłączane przez wariant (§3) |
| **gatunek materiału** | §5.1 — czwarta oś modelu przedmiotu |
| **ręce** | ⚠ własność **przedmiotu**, nie rodziny |
| **chwyt** | §5.2 — druga oś obok rąk; `1H` · `2H` · **`1.5H`** |

⚠⚠ **„Dwie ręce" znaczy DOKŁADNIE JEDNO: druga ręka zostaje pusta.** Zero
premii do obrażeń, tempa i zasięgu; zero kary do bloku. Cena jest wyrażona
**wyłącznie w utraconym slocie**.
⚠ Skutek, który trzeba pilnować przy **każdym** dobrym przedmiocie do drugiej
ręki: podnosi on wartość slotu, którego broń dwuręczna nie ma — czyli **osłabia
ją po cichu**, nie dostając w zamian nic *(niezmiennik należy do `shields`)*.

⚠ **Młot 1H i 2H istnieją obok siebie** — liczba rąk nie tworzy rodziny.
⛔ **`hands` nadal ma DWA stany i trzeciego nie dostaje** — ale od 2026-09-18
stoi obok niego **druga oś, `grip`** (§5.2). ⛔ Wariantem ataku się tego nie da
i to zostaje w mocy: wariant opisuje sposób CIOSU, nie sposób TRZYMANIA.



⚠⚠ **Tożsamość konstrukcji należy do KONSTRUKCJI.** Rodzina jest szeroką
kategorią BIEGŁOŚCI. ⛔ Nie rozwiązuj różnic między konstrukcjami zakładaniem
nowej rodziny — parowanie zeszło z rodziny `sword` na broń właśnie dlatego
(`melee.parryBonus`).

### 5.1 Gatunek materiału

**Czwarta oś modelu przedmiotu: `Construction → Material → Quality → Variant`.**
`WEAPON_MATERIAL` mnoży **obrażenia i cenę**, i nic poza tym.

- ⭐ **Stal jest poziomem ZEROWYM.** Broń bez pola `material` czyta się jako
  stalowa (×1,00), więc wprowadzenie osi nie ruszyło ani jednej liczby.
- ⚠ **`priceMul` musi zostać NIŻSZY niż `damageMul`.** Inaczej tańszy gatunek
  jest słabszy **oraz** gorszy na złotówkę, czyli pułapką, nie wyborem. Ta sama
  reguła i ten sam powód, co po stronie pancerza.
- ⛔ **Gatunek nie rusza masy, wymagań Siły, tempa ani zasięgu**, nie jest
  rodziną i nie niesie cech.
- ⭐ **Od 2026-09-17 oś ma użytkowników** (nóż, cep). ⚠⚠ Broń żelazna ma w danych
  **równoważnik STALOWY** — nominał z configu nie jest tym, co widzi gracz.
- ⚠ **Tabela jest OSOBNA od `ARMOR_MATERIAL`**, bo pancerz mnoży punkty
  ochrony, a broń zakres obrażeń.

---

### 5.2 Chwyt — kategoria 1.5H

```
1H     komplet w jednej ręce; druga wolna i darmowa
2H     istnieje tylko w dwóch rękach; cena = utracony slot
1.5H   komplet w dwóch rękach, DAJE SIĘ OPANOWAĆ w jednej
```

⭐⭐ **2H płaci SLOTEM, 1.5H płaci KONTROLĄ.** Linia katalogowa półtoraka **jest**
jego profilem oburęcznym; chwyt jednoręczny powstaje z niej przez **derogację**
(`oneHanded`), nigdy przez drugi komplet liczb. Dlatego zdanie z §5 zostaje
w mocy: tryb oburęczny **niczego nie dodaje, przestaje odbierać**.

⚠ **Tryb WYPROWADZANY ze stanu drugiej ręki** (`Equipment.gripOf`): pusta →
oburęczny, zajęta → jednoręczny. ⛔ Bez przełącznika i bez pola w zapisie.
⛔⛔ **Chwyt NIE dotyka TEMPA** — tarcza już je opodatkowuje (`offhandSwingMul`).
⛔ Ani `reach`, `requires`, `weight`, skalowania atrybutami, rodziny.
⚠ Dla drzewcowych ceną jest **martwa strefa** (`minReachAdd`, dodawany).
⛔ **Broń 1.5H nigdy nie wchodzi do drugiej ręki.**

Bastard, włócznia, widły; wartości to **PLAYTEST BASELINE**. Model i odrzucone
warianty: `docs/decyzje/2026-09-18-kategoria-1-5h.md`.

## 6. Broń w drugiej ręce

⚠ **Liczy się WŁASNĄ rodziną, cechą i rangą** — sztylet nie zachwiewa, bo jego
rodzina nie ma tej cechy. ⚠ **Obie ręce dzielą wszystko, co należy do CIAŁA**
(tempo z Zręczności, zmęczenie) i różnią się **czasem bazowym broni**.
⚠ **Szansa krytyka należy do TEJ ręki**; premia postaci wchodzi do obu.
⛔ **Przyjmuje wyłącznie broń `1H`** — `2H` i `1.5H` nie (§5.2).
*(Model kadencji dwóch broni należy do `combat`.)*

---

## 7. Niezmienniki

- **N-84** — **pięć osi się nie zlewa** (§1); rodzina nie wynika z typu obrażeń
  ani z liczby rąk.
- **N-85** — **REGUŁA ZAWĘŻANIA**: wariant odbiera, nigdy nie dodaje (§3).
  *(Pochłonął N-4 z `items`.)*
- **N-5** *(depozyt z `items`)* — rozpiętość wariantów jednej broni węższa niż
  odległość do sąsiedniej kategorii. ⚠ **Wskazówka, nie mierzony niezmiennik** (`OI-41` zamknięte 2026-10-11).
- **N-86** — **cecha rodziny jest DEKLARACJĄ**; rodzina bez cechy jest legalna (§2).
- **N-87** — **rodzina niesie bazę, ranga mnoży EFEKT** *(egzekwuje `proficiency`)*.
- **N-88** — **typ obrażeń mieszka na wariancie** (§3).
- **N-89** — **skalowanie atrybutami wymagane, bez domyślnej** (§5).
- **N-90** — **tempo i czas zamachu ruszają się razem** (§5).
- **N-91** — **zasięg należy do modelu; umiejętność go pożycza** (§4).
- **N-92** — **„dwie ręce" znaczy dokładnie jedno: pusta druga ręka** (§5).
- **N-93** — **broń w drugiej ręce liczy się własną rodziną i rangą** (§6).
- **N-94** — **każda drzewcowa sięga dalej niż każda niedrzewcowa** (§4).
- **N-95** — ⛔ **kąt obszaru NIE jest własnością broni**; `arcDeg`/`arcMul`
  usunięte — `decyzje/2026-09-18-luk…`.
- **N-96** — ⭐ **chwyt jednoręczny półtoraka tylko ODBIERA** (§5.2). Linia
  katalogowa **jest** profilem oburęcznym; ⛔ tryb oburęczny nie dodaje nic.
- **`blunt` ≠ `interrupt`** *(depozyt z `armor`)* — typ opisuje interakcję
  z ochroną, przerywanie jest cechą broni; mogą wystąpić razem albo osobno.

---

## 8. Checklista: nowa broń

1. **Rodzina** — istniejąca czy nowa? ⚠ Nowa rodzina musi mieć **oś, której nie
   da się wyrazić parametrem modelu**; inaczej to jest model, nie rodzina (§2).
2. **Cecha** — deklaracja, nie pole. ⚠ Rodzina bez cechy jest legalna;
   ⚠ cecha o bazie zero wymaga własnego nośnika *(`proficiency`)*.
3. **Skalowanie atrybutami** — wpisz jawnie, nie ma domyślnej (N-89).
4. **Warianty** — 1–3; typ obrażeń na każdym. ⚠ Sprawdź N-85: czy któryś
   **dodaje** coś, czego model nie ma.
5. ⚠⚠ **Zasięg** — sprawdź, po której stronie progu jakościowego ląduje (§4,
   OI-40). ⛔ To nie jest strojenie o kilka pikseli.
6. **Ręce** — `2` znaczy wyłącznie „druga ręka pusta" (N-92).
7. **Tempo i zamach razem** (N-90); pamiętaj, że z zamachu wynika ukorzenienie.
8. ⚠ **N-5** — rozstrzygnij świadomie, jak daleko wariant odsuwa broń od jej
   modelu; ⛔ **nic tego dziś nie sprawdza** — świadomie (`OI-41`).
9. ⚠⚠ **KTO tego używa i DLACZEGO akurat tego?** Bez odpowiedzi to synonim.
   Kryterium przyjęcia i lista odrzuconych: decyzja `2026-09-17-katalog-broni…`.
10. Bramki: `npx tsc --noEmit` · `npm run build` ·
   `node tools/combat_regresja.mjs` · `node tools/katalog_ekwipunku.mjs`
   (⚠ bez `--zapisz`, patrz OI-42).

---

## Drugi zestaw broni

Para slotów `weapon2` / `offhand2` trzyma broń, której postać w tej chwili NIE ma
w rękach; zamienia je `Equipment.swapWeaponSet()`.

- ⚠ **Świadomie POZA `EQUIP_SLOTS`, jak `BAG_SLOTS`** — schowana broń nie chroni
  i nie daje premii.
- ⚠⚠ **Ale WAŻY w pełni** (`OI-96`, zamknięte): `equippedWeight` iteruje
  `EQUIP_SLOTS` **oraz** `STOW_SLOTS`. ⛔ Ten akapit mówił do 2026-09-15 „nie waży
  i to jest dług" — dług został spłacony.
- ⚠ **Zamiana przenosi ZAWARTOŚĆ**, nie przestawia wskaźnika „który zestaw jest
  czynny", i **nie idzie przez plecak**.
- ⚠ **Reguły rąk obowiązują w OBU zestawach** i pytają o zestaw TEGO slotu
  (`usesBothHandsIn(set)`, `gripOf(set)`). `normalizeHands()` sprząta po wczytaniu
  zapisu oba — bez tego pierwsza zamiana wniosłaby nielegalną parę do rąk.
- ⚠ **Zamiana jest też na HUD-zie (od 2026-10-12, prośba autora)** — przycisk
  `WeaponSwapButton` i klawisz `X`; rozstrzyga `GameScene` (odmowa przy ciosie
  w locie, odstęp `WEAPON_SWAP.cooldownMs`). ⚠ **Koszt zamiany w walce (czas
  przełożenia, okno bezbronności, stamina) NIE istnieje** — to osobna
  decyzja (`OI-177`), dziś zamiana jest darmowa poza odstępem.
- ⚠ **`equipFromBag` ze wskazanym slotem, który odmawia, KOŃCZY operację** — nie
  spada na `slotForItem`.

Powody i odrzucone warianty: `docs/decyzje/2026-09-11-ekwipunek-fundament.md`,
`docs/decyzje/2026-09-15-masa-schowanego-zestawu.md`.

## Pokrycie

⚠ Skrót: `KR` = `przymiar:combat_regresja`, `K6` = `kod:2026-09-06`.

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| pięć rozdzielnych osi | ✅ | ✅ | `K6` |
| rodzina jako klasyfikacja z opcjonalną cechą | ✅ | ✅ | `K6` |
| cecha jako deklaracja (unia po rodzaju) | ✅ | ✅ | `KR` |
| zawężanie — przerwanie (typ) | ✅ | ✅ | **kompilator** |
| zawężanie — odrzut (przycięcie ≤ 1) | ✅ | ✅ | `KR` |
| zawężanie — cecha rodziny nietykana wariantem | ✅ | ✅ | `K6` |
| typ obrażeń na wariancie | ✅ | ✅ | `KR` |
| zasięg z modelu, wariant mnoży | ✅ | ✅ | `KR` |
| umiejętność pożycza zasięg broni | ✅ | ✅ | `K6` |
| tempo i zamach razem | ✅ | ✅ | `KR` |
| „dwie ręce" = pusty slot i nic więcej | ✅ | ✅ | `K6` |
| druga ręka liczy się własną rodziną i rangą | ✅ | ✅ | `K6` |
| **chwyt 1.5H — derogacja, nie premia** | ✅ | ✅ | `przymiar:rece_przymiar` §H |
| **próg zasięgu wobec orbitującego celu** | ✅ | ✅ | `przymiar:macierz_walki` — OI-40 |
| **N-5 — rozpiętość wariantów** | ⚠ | ⚠ | wskazówka projektowa bez metryki (`OI-41` zamknięte 2026-10-11) |
| zestawienie rosteru broni | ✅ | ⚠ | ❌ **częściowo zablokowane** — OI-42 |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-40** | ⚙ **ZAWĘŻONE — to nie jest złamany niezmiennik.** Teza „każda broń poza drzewcową jest poza orbitą" była **pomiarem rosteru**, nie regułą. Otwarte zostają **dwie liczby**: czy margines z rozmiaru CELU wchodzi do porównania z zasięgiem BRONI i czy wolno stać w pasie ±2 px wokół progu. ⛔ Nie ruszać jednej bez drugiej. Wywód: `docs/decyzje/2026-09-07-prog-zasiegu-orbity.md` |
| **OI-42** | ⚠ **Generator MACIERZY ZASIĘGÓW nie może zostać uruchomiony z zapisem**, dopóki nie zapadnie `OI-40`. ⚠ Macierz zestawia też bronie dwuręczne z tarczami — **wiersze niemożliwe w grze**. ⛙ Blokada generatora ROSTERU (`OI-7`) **zdjęta 2026-09-17**. |

---

## Czego ten dokument nie rozstrzyga

- **Parametrów żadnej broni** ani jednej liczby rosteru.
- **Balansu drabinki** — który model ma być lepszy i o ile.
- **Czy roster jest kompletny** — siatka luk jest w katalogu generowanym.
- **Dwóch liczb progu zasięgu** (`OI-40`) ani **metryki `N-5`** (wskazówka bez metryki) — obie
  stoją w tabeli „Otwarte" wyżej.
- **Rozstrzygania ciosu i geometrii** — `combat`.
- **Broni dystansowej** — nie istnieje.

---

## Gdzie szukać POWODÓW

⚠ **Dokumenty źródłowe tej domeny — analizy, checkpointy i pakiety do oceny
zewnętrznej — zostały USUNIĘTE 2026-09-07**
(`docs/decyzje/2026-09-07-odchudzenie-dokumentacji-combat.md`). Werdykty
i odrzucone warianty żyją dalej w rejestrze niżej; pełne przebiegi są w gicie.

| pytanie | dokument |
|---|---|
| rejestr **24 decyzji z mocą** i pomiar rosteru wobec progu | `docs/proces/ekstrakcja_weapons.md` |
| skąd bierze się próg zasięgu, czemu jest binarny i czemu pas ±2 px jest zakazany | `docs/decyzje/2026-09-07-prog-zasiegu-orbity.md` |
| dlaczego dwie cechy tożsamości 2H są **strukturalnie nieosiągalne** | `docs/decyzje/2026-09-07-obrona-wroga-nie-istnieje.md` |
| dlaczego cecha rodziny jest deklaracją, nie polem opcjonalnym | `docs/audyt_projektowy_fundamentow_2026-09-03.md` D5 |
| **wedle czego konstrukcja wchodzi do katalogu** | `docs/decyzje/2026-09-17-katalog-broni-warstwy-spoleczne.md` |
| kierunek dalszego rozróżnienia stylów (1H+tarcza / 2H / dual wield) | `docs/archetypy_walki.md` |
