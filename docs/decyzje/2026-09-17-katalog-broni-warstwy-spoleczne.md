---
typ: DECYZJA
domena: [weapons, items, economy, world]
tytul: Katalog broni rośnie po WARSTWACH SPOŁECZNYCH, nie po niszach DPS
stan: zywy
moc: ACTIVE
data: 2026-09-17
kotwice:
  - GameConfig.ITEMS
  - GameConfig.WEAPON_MATERIAL
  - tools/combat_regresja.mjs
  - tools/materialy_przymiar.mjs
  - tools/katalog_ekwipunku.mjs
otwarte: [C4, B2, OI-41]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-17
---

# Katalog broni rośnie po WARSTWACH SPOŁECZNYCH

> **Co ta decyzja rozstrzyga.** Wedle jakiego kryterium do katalogu broni
> **wchodzi** nowa konstrukcja, a wedle jakiego **nie wchodzi**. Roster
> 21 → 30 z 2026-09-17 jest jej pierwszym zastosowaniem, ale reguła jest
> ogólna i dotyczy każdej następnej partii.
>
> ⛔ **Nie jest tabelą liczb.** Parametry są w `GameConfig.ITEMS`, roster
> w `docs/ekwipunek_przedmioty.md` *(generowany)*.

---

## 1. Kryterium przyjęcia

**Konstrukcja wchodzi do katalogu wtedy, gdy potrafisz powiedzieć, KTO
w świecie jej używa i DLACZEGO akurat jej.**

⛔ **Nie wchodzi dlatego, że rodzina ma mało pozycji.** ⛔ Nie wchodzi
dlatego, że w tabeli DPS jest dziura. ⛔ Nie wchodzi dlatego, że istnieje
historycznie.

⚠⚠ **Wprost dopuszczamy konstrukcje SŁABSZE od istniejących.** Broń może
istnieć dlatego, że jest tania, łatwa do wykonania, gospodarcza, łatwa do
ukrycia, prestiżowa albo po prostu leżała w stodole. Równość skuteczności
NIE jest celem projektowym i nie wolno jej „naprawiać" przesuwaniem liczb.

⚠ **Ale słabsza ≠ pułapka.** Dwie sztuki z tej partii trzeba było
przeliczyć, bo pierwsze wersje były pułapkami, nie wyborami:

| | pierwsza wersja | co było źle | poprawka |
|---|---|---|---|
| **Nóż** | 5–9 żelaza, 15 g | 14,6 dps za 15 g wobec **16,8 dps za 12 g** osiosanego kija — gorzej i drożej niż rzecz, którą gracz już ma | 7–10, 12 g |
| **Mizerykordia** | 6–10, 150 g | 23,1 dps wobec **25,0 dps sztyletu za 40 g**, a premia krytyka jest w tej liczbie już policzona — nie zostało nic, co tłumaczy cenę | 8–12 |

**Granica jest taka:** wolno być gorszym w *niektórych* kanałach; nie wolno
być gorszym we *wszystkich* naraz **i** droższym. Pierwsze jest tożsamością,
drugie jest usterką.

---

## 2. Test „czy to nie jest synonim"

Zanim konstrukcja wejdzie, przechodzi cztery pytania. **Odpadnięcie na
którymkolwiek jest wynikiem, nie porażką** — połowa kandydatów tej partii
odpadła i to jest normalny plon audytu.

1. **Czy to nie jest ta sama rzecz pod inną nazwą?**
2. **Czy to nie jest oś JAKOŚCI przebrana za konstrukcję?**
   *(„miecz szczerbaty" to miecz jakości 1, nie nowy `ItemId`)*
3. **Czy to nie jest oś MATERIAŁU przebrana za konstrukcję?**
   *(żelazny kord ma `material: "iron"`, nie własny wpis)*
4. **Czy ma innego WŁAŚCICIELA w świecie niż rzecz, do której jest podobna?**
   ⭐ To jedyne pytanie, które potrafi konstrukcję **uratować** mimo
   podobieństwa statystyk — i dwa razy uratowało w tej partii.

### Co odpadło i dlaczego

| kandydat | rodzina | werdykt |
|---|---|---|
| **Gladius / miecz legionowy** | sword | ⛔ synonim krótkiego miecza; tarcza legionowa go nie wymusza |
| **Estok / kończar** | sword | ⛔ trzeci pchający miecz obok rapiera i sztyletu — nisza zajęta dwa razy |
| **Katzbalger** | sword | ⛔ synonim kordu |
| **Miecz szczerbaty / zardzewiały** | sword | ⛔ **oś jakości**, pytanie 2 |
| **Maczuga** | blunt | ⛔ synonim pałki z większym łbem |
| **Pobijak / młot ciesielski** | blunt | ⛔ synonim pałki; narzędzie bez własnej osi |
| **Kosa bojowa (kosynierzy)** | polearm | ⏳ **przeszła projektowo, zablokowana ARTEM** — na `items.png` nie ma sylwetki, która przy 17,6 px czyta się jako kosa, a nie jako topór. Wraca, gdy będzie ikona |
| **Rohatyna u Radzima** | — | ⛔ dystrybucja: idzie do Myśliwego, patrz §5 |

⛔ **Rodzina `sword` nie dostała w tej partii ani jednej pozycji i to jest
WYNIK, nie przeoczenie.** Osiem mieczy pokrywa już mieszczanina, straż,
żołnierza, rzeźnika, bandytę, obcego kupca i rycerza. **Najszersza rodzina
w katalogu jest jednocześnie tą, która najmniej potrzebuje dokładania.**

> ### ⚙ ZAWĘŻONE tego samego dnia — `2026-09-17-drabinka-mieczy-i-chwyt.md`
>
> ⚠⚠ **Powyższy wniosek zostaje w mocy dla konstrukcji SZERMIERCZYCH** —
> gladius, estok, katzbalger i „miecz szczerbaty" są dalej odrzucone i ⛔ nie
> wracają. Zawężony jest jego ZASIĘG: audyt pytał *„czy brakuje kolejnego
> sposobu fechtowania?"* i odpowiedział poprawnie „nie", ale **nie zadał
> pytania o oś ROZMIARU**. Między mieczem 1H (zasięg 68) a bastardem 2H (78)
> nie było nic, a powyżej miecza dwuręcznego nie było niczego w ogóle.
>
> ⭐ Decyzja autora dołożyła dwie konstrukcje: **Miecz długi** (1H, zasięg 74)
> i **Wielki miecz** (2H, ekstremum ośmiu osi). Powody, sufity i pytanie
> o chwyt bastarda: `docs/decyzje/2026-09-17-drabinka-mieczy-i-chwyt.md`.

---

## 3. Co weszło — dziewięć konstrukcji

| konstrukcja | rodzina | kto tego używa |
|---|---|---|
| **Nóż** | dagger | chłopi, biedota, każdy — narzędzie, nie oręż |
| **Mizerykordia** | dagger | rycerstwo (dobijanie), skrytobójcy, bogaci mieszczanie |
| **Buzdygan** | blunt | straż i zbrojni — kuty seryjnie, wszędzie taki sam |
| **Kilof** | blunt | górnicy, kopacze — i bandyci, którym został w rękach |
| **Nadziak** | blunt | jazda i szlachta — dziób pod jedną rękę i siodło |
| **Cep bojowy** | blunt | chłopi w rebelii; najtańsza dwuręczna w grze |
| **Topór brodaty** | axe | osadnicy, najemnicy, drużynnicy |
| **Berdysz** | axe | straż miejska i piechota — oporządzenie szyku |
| **Rohatyna** | polearm | myśliwi — poprzeczka pod grotem na dzika |

⭐ **Dwie osie prostopadłe do siebie zostały użyte zamiast rozmnażania
rodzin:**

- **`pierce` z rodziny `blunt`** (kilof, nadziak) — pierwszy raz, kiedy
  rodzina obuchowa niesie inny typ obrażeń. ⛔ Nie łamie reguły zawężania:
  typ obrażeń należy do WARIANTU, a precedens stoi od dawna po drugiej
  stronie (siekiera z rodziny `axe` ma wariant `Obuch`).
- **`material: "iron"`** (nóż, cep) — pierwsi użytkownicy osi gatunku po
  stronie broni. ⚠ Żelazo dostały dokładnie te dwie sztuki, w których jest
  **faktem świata**: obie wychodzą z wiejskiej kuźni, a nie z warsztatu
  płatnerza. ⛔ Nie jest to zaproszenie do podwojenia katalogu żelaznymi
  bliźniakami.

⛔ **Zero nowych rodzin, zero nowych pól, zero nowych gałęzi w kodzie walki.**

---

## 4. Czego zabroniły NIEZMIENNIKI

⚠⚠ **To jest najważniejsza część tego dokumentu**, bo opisuje jedyny
przypadek, w którym świat chciał czegoś, czego mechanika nie wpuściła.

### C4 — dzida, czyli jednoręczna drzewcowa

Włócznia z tarczą jest **najczęstszym zestawem piechoty, jaki kiedykolwiek
istniał**, i dziś nie da się go w tej grze złożyć: wszystkie cztery bronie
drzewcowe są `hands: 2`, więc **drzewcowego nie da się nosić z tarczą**.

Blokuje to `§Y Y2`: *każda 2H sięga dalej niż każda 1H*. Korytarz jest pusty:

```
   ≤ 74 px   przestaje być drzewcowa (osiosany kij ma 74)
   ≥ 76 px   łamie Y2 (najkrótsza 2H, topór bojowy, ma 76)
```

⛔ **Nie „naprawiono" tego dopisaniem drugiego wyjątku obok `hammer`.**
Wyjątek w strażniku, który zapada przy dosypaniu zawartości, uczy
ignorowania strażnika. Wyjście jest jedno z dwóch i **oba są rebalansem
rosteru, czyli decyzją autora**:

- **(a)** podnieść zasięg broni dwuręcznych tak, żeby korytarz się otworzył —
  ⚠ przenosi modele przez próg orbity wilka (96 px) i wymaga przeliczenia;
- **(b)** przyjąć, że Y2 opisuje roster, a nie regułę, i wymienić go na słabsze
  zdanie — ⚠ Y2 jest dziś jedną z trzech cech tożsamości 2H.

### Trzy bramki, które przestroiły liczby zamiast je przepuścić

| bramka | co wymusiła |
|---|---|
| `§T6` | **trzy cooldowny** — nóż 0,42 → 0,44, cep i berdysz 0,72 → 0,70. Trafienie wypadało 25–35 ms od końca okna ogłuszenia przy progu 50 ms |
| `§Y Y3` | **sufit średniej 1H = 12,0** — buzdygan, kilof i nadziak stoją dokładnie na nim |
| `§ZB Z1` | **łuk topora brodatego 62°** (węziej niż toporek) i **cena rohatyny 190 g** (drożej niż włócznia) — inaczej powstałaby dominacja |

⭐ **Ani razu nie poluzowano niezmiennika, żeby przepchnąć zawartość.**

---

## 5. Dystrybucja: trzy półki, nie jedna

⛔ **Nie wszystko idzie do Radzima** — i to jest decyzja o świecie, nie
o wygodzie.

| kupiec | co dostał | dlaczego on |
|---|---|---|
| **Myśliwy** | Nóż, Rohatyna | *„drewno, skóra i to, co zostaje z tuszy"*. ⭐ Rohatyna prostuje starą niezgodność: komentarz przy `spear` (2026-08) mówił wprost *„oszczep na dziki byłby fabularnie ładniejszy"* i odrzucił włócznię jako zwykłe wojskowe żelazo. Rohatyna nim nie jest |
| **Radzim (Kowal)** | Buzdygan, Nadziak, Topór brodaty, Berdysz, Mizerykordia | `bron_skad`: wędrowni handlarze płacą odpadowym żelazem, ludzie przynoszą znaleziska. Seryjne oporządzenie straży i rzeczy OBCE to dokładnie ten towar |
| **Rolnik** | Cep bojowy, Kilof | ⭐ **pierwsza półka Rolnika w ogóle.** Obie bronie mają tożsamość *„nikt tego nie kupił jako broni"* — postawienie ich u kowala skasowałoby ją. Kilof z półki kowala jest towarem; kilof od chłopa jest kilofem |

⚠ **Jakość jest częścią tej wypowiedzi.** Radzim wydaje w jakości 1–2
(znalezisko), Myśliwy i Rolnik w 2–3 (rzecz, której sami używali).

⛔ **Zero nowych linii dialogu** i ⛔ zero nowych kupców. Półka Radzima rośnie
z 65 na 70 pozycji — to jest dług `B2`, nie problem do rozwiązania
dosypywaniem sprzedawców.

---

## 6. Co ta decyzja ZMIENIŁA w strażnikach

⚠ Trzy zmiany w narzędziach; **żadna nie poluzowała asercji**, wszystkie
przeszły sabotaż.

1. **`§ZB` liczy na wartościach EFEKTYWNYCH** (po `WEAPON_MATERIAL`), nie na
   surowych polach. Żelazny cep zapisany jako 5–27 / 75 g działa w grze jak
   4–21,6 / 45 g — dominacja liczona surowo oceniłaby go o 25% za mocno
   **i** o 67% za drogo naraz.
2. **`§ZB Z9`** *(nowe)* — każda drzewcowa sięga dalej niż każda
   niedrzewcowa. Obietnica rodziny `polearm` była do dziś wyłącznie zdaniem
   w komentarzu; berdysz był pierwszą bronią, która naprawdę kusiła długim
   drzewcem. **`§ZB Z10`** *(nowe)* — gatunek materiału ma co najmniej
   jednego użytkownika, czyli ścieżka mnożenia jest przechodzona.
3. **`§W W11c` przestało liczyć ręcznie.** Stało tam `bezStrefy.length === 18`
   — licznik, który zapalał się przy każdej nowej broni, choć nic się nie
   psuło. Dziś strażnik wymienia z nazwy trójkę z martwą strefą.
4. **Zamek `material` po stronie PANCERZA przepuszcza broń.** Zdanie *„nikt
   o nie nie zapyta"* przestało być prawdą; deklaracji broni pilnuje
   `weaponMaterialProblems` w `§W`. ⛔ Wyjątek dotyczy **wyłącznie** typu
   `weapon` — mikstura z polem `material` dalej jest błędem i `§E E2` tego
   pilnuje.
5. **Generator katalogu mnoży przez gatunek.** Do dziś czytał `damageMin`
   i `buyPrice` wprost i miał rację, bo żadna broń nie deklarowała gatunku.
   Od dziś czytanie wprost kłamałoby o 25% obrażeń i 67% ceny — czyli
   dokładnie tak, jak zabrania nagłówek tego generatora.

---

## Czego ta decyzja NIE rozstrzyga

- **Balansu rosteru.** To jest partia SZEROKOŚCI, druga z rzędu; globalna
  kalibracja należy do momentu, w którym będzie też broń dystansowa.
- **`C4`** — czy jednoręczna drzewcowa ma powstać i którym z dwóch wyjść.
- **`B2`** — reguły dystrybucji (tag × typ kupca × region × poziom).
- **Modeli 3D.** ⚠ `char.glb` niesie 11 siatek `Bron_*`; **19 konstrukcji
  rysuje się jako pusta dłoń + `console.warn`**. Degradacja jest
  zaprojektowana, ale widoczna.
- **`OI-41`** — jak mierzyć `N-5`.
