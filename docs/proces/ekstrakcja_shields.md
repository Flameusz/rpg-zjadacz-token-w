---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena shields
stan: zamkniety
kotwice: [tools/doc_check.mjs, tools/combat_regresja.mjs]
otwarte: [OI-9, OI-24, OI-25, OI-26, OI-27]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `shields`

> **Po co ten plik.** Materiał dowodowy i zapis procedury; treść dziedziny
> poszła do `docs/systemy/shields.md`.
>
> ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Procedura

| krok | co zrobiono |
|---|---|
| **1. KOD** | pełny blok `SHIELD` z komentarzami, `BlockSpec` i `Equipment.blockSpec`/`blockStaminaCost`/`offhandSwingMul`, `Protection.guardZone`/`isFrontal`, `DamageResolver.resolveIncoming`, `Player.guardDir` i `Player.takeDamage`, obie tarcze w rosterze, bramka sprzętowa Uderzenia tarczą, `Defense` (PRD), `ItemTooltip`, grupy §L i §X w regresji. Narzędzia: esbuild → node na configu, `grep` po każdym symbolu |
| **2. DOKUMENTACJA** | `tarcze_analiza.md` (główny, 89 KB), `shield_bash.md`, `ekwipunek_mechanika.md` §4/§6.3, `odlozone.md`, `dziennik.md` 2026-09-05 (2), `feedback_obrony_analiza.md`, `bron_dwureczna_analiza.md` §F.5, `src/core/CLAUDE.md` |
| **3. ROZJAZDY** | 12 sztuk (§2) |
| **4. DECYZJE** | 28 pozycji z mocą (§3) |
| **5. POMIAR** | redukcja wg jakości, geometria sektorów, **łączna mitygacja** (§5) |
| **6. STAN + BRAMKA** | `docs/systemy/shields.md`; `doc_check`, `combat_regresja`, `tsc --noEmit` |

⚠⚠ **Najważniejsze ustalenie kolejności 1 → 2 w tej domenie: aktualny model
mieszka w DZIENNIKU, a nie w dokumencie o tarczach.** Trzy strefy osłony weszły
2026-09-05 i zostały opisane w `dziennik.md`; `tarcze_analiza.md` ma dwa banery
z sierpnia i **żaden z nich o tym nie wie**. Czytając „dokumenty o tarczach",
wziąłbyś model binarny za obowiązujący. To jest **trzecie powtórzenie** wzorca
z ekstrakcji `stamina` (K-S3): *aktualny model domeny bywa poza dokumentem tej
domeny*.

---

## 2. Rozjazdy

| # | twierdzenie | kod / pomiar | waga · status |
|---|---|---|---|
| **S-1** | `tarcze_analiza.md` §7 reg. 2 — blok działa „**±90° od kierunku zwrotu**, czyli przednia połowa" | **trzy strefy** od 2026-09-05: pełna 120°, osłabiona 2 × 40°, dalej zero | ⛔⛔ najwyższa — to DOMOWY dokument domeny, a jego banery (08-26) o tym nie wiedzą |
| **S-2** | tamże §7 reg. 5 — ceną tarczy jest kara tempa „**plus `requires: { strength }`**" | **jedna z dwóch** tarcz ma bramkę; puklerz jest bez niej **z reguły**, nie z zapomnienia | ⚠ średnia — twierdzenie prawdziwe w połowie rosteru |
| **S-3** | `ekwipunek_mechanika.md` §6.3 — „kąt jest jedną stałą `SHIELD.blockArcDeg`" | granice tarczy to dziś `fullArcDeg`/`sideArcDeg`; `blockArcDeg` opisuje **półkulę ataku i parowania**, nie tarczę | ⚠ średnia — wskazuje NIE TĘ stałą; §4 tego samego pliku jest już poprawne |
| **S-4** | `tarcze_analiza.md` — lista „poza zakresem SHIELD-02": parry · Raise Shield · trzecia tarcza · broń dwuręczna · `weight` · ciężar→prędkość · trwałość · profile typów | **parry ISTNIEJE** (cecha rodziny broni), **`weight` ISTNIEJE** i napędza obciążenie, **broń dwuręczna ISTNIEJE**, ciężar→prędkość działa przez klasy obciążenia. Nie istnieją: Raise Shield, trzecia tarcza, trwałość, profile typów bloku | ⚠ średnia — lista czytana dziś jako „tego nie ma" wprowadza w błąd co do **połowy** pozycji |
| **S-5** | **milczenie** — nikt nie opisuje, że **łączna mitygacja nie ma wspólnego sufitu** | sufit jest tylko na pancerzu; blok mnoży się **poza** krzywą i sam capu nie ma | ⛔ wysoka → **OI-24** |
| **S-6** | **milczenie** — nikt nie opisuje, że **zewnętrzna granica tarczy jest SZERSZA od półkuli parowania** | `sideArcDeg` > `blockArcDeg`, więc istnieje pas, w którym tarcza reaguje, a parowania nie da się nawet spróbować | ⚠ średnia — fakt jest w komentarzu configu i w dzienniku, w żadnym dokumencie domeny jako REGUŁA |
| **S-7** | **milczenie** — nikt nie opisuje **stawki zapasowej** kosztu bloku | tarcza bez własnego `staminaCost` po cichu bierze wartość globalną | ⚠ niska — cicha wartość domyślna |
| **S-8** | `shield_bash.md` v1.1 — decyzja „**żadnego frameworku `Effects` teraz**" | warstwa efektów **POWSTAŁA** 2026-09-04 (`src/core/combat/StatusEffects.ts`, `EffectKinds.ts`, `EffectHost`), ale **ogłuszenie do niej NIE weszło** — nadal jest osobnym polem na `Enemy` | ⛔ wysoka — **w grze są dziś DWA mechanizmy stanów**; delegowane do `abilities`/`combat` → **OI-27** |
| **S-9** | tooltip: „Blok: X% — **od strony, w którą patrzysz**" | sformułowanie z ery binarnej; ani śladu pasa bocznego przy połowie wartości | ⚠ średnia → **OI-26** |
| **S-10** | `tarcze_analiza.md` §B.7 — „`size` zacznie coś robić, gdy powstanie **parry albo Raise Shield**" | **parry powstało** i okazało się cechą **BRONI** — nigdy nie mogło skonsumować pola tarczy | ⚠ średnia — warunek powrotu **w połowie nieaktualny** → **OI-9** |
| **S-11** | `odlozone.md` — `macierz_walki.mjs` zestawia bronie dwuręczne z tarczami | wiersze **niemożliwe w grze**; marginesy reakcji z nich są fantomowe | ⚠ znane i zapisane — delegowane do `weapons` |
| **S-12** | `tarcze_analiza.md` §7 reg. 4 — „**mała** liczba punktów, żeby interakcja z capem została nieistotna" | ✅ **TRZYMA** — punkty obu tarcz są małe wobec kompletów zbroi | ⚙ **kontrola pozytywna**, nie rozjazd |

⚠ **Kierunek rozjazdów jest tu INNY niż w trzech poprzednich domenach.** Tam
dokumentacja była za kodem w liczbach. Tutaj **cztery z dwunastu pozycji (S-4,
S-8, S-10, S-11) to decyzje unieważnione przez zdarzenia w INNYCH domenach** —
parowanie przyszło z broni, obciążenie ze staminy, warstwa efektów z umiejętności.
Dokument o tarczach nie miał jak tego zauważyć, bo nic w tarczach się nie zmieniło.

---

## 3. Rejestr decyzji z mocą

Skróty źródeł: `TA` = `tarcze_analiza.md`, `SB` = `shield_bash.md`,
`DZ` = `dziennik.md`, `OD` = `odlozone.md`, `KOD` = komentarz w źródle.

| # | decyzja | źródło | moc |
|---|---|---|---|
| D-1 | tarcza to PANCERZ z jednym dodatkowym polem, nie osobny system | TA, KOD | **ACTIVE** |
| D-2 | blok **deterministyczny**; rzut kością odrzucony z pomiarem | TA §7, §B.11 | **ACTIVE** |
| D-3 | blok **neutralny wobec typu obrażeń** — decyzja, nie odroczenie | TA §7, KOD | **ACTIVE** |
| D-4 | blok **po pancerzu**, jedno zaokrąglenie na końcu | TA §7, KOD | **ACTIVE** |
| D-5 | **kąt stoi poza przedmiotem**, w stałej | TA §B.8–§B.9 | **ACTIVE** |
| D-6 | osłona idzie za **zwrotem, który rysuje sprite** | TA §11.1 → decyzja autora 2026-08-15 | **ACTIVE** |
| D-7 | **auto-obracanie osłony na cel USUNIĘTE** (2026-08-23) | KOD | **ACTIVE** (decyzja negatywna) |
| D-8 | punkty tarczy działają z **każdej** strony, blok tylko z przodu | KOD | **ACTIVE** |
| D-9 | **żadnego materiału „drewno"** | KOD | **ACTIVE** |
| D-10 | `size` jako **etykieta bez efektu** — jedyne przyjęte future-proofing | TA §B.7 | ⚠ **ACTIVE z nieaktualnym warunkiem powrotu** (S-10) |
| D-11 | blok **binarny**: cała przednia półkula = pełna redukcja | TA §7 | ⛔ **SUPERSEDED** przez D-12 |
| D-12 | **trzy strefy**: pełna 120° + 2 × 40° osłabione = 200° reakcji | DZ 2026-09-05 (2) | **ACTIVE** |
| D-13 | pełny blok **nie rośnie** ponad 120° | KOD | **ACTIVE** |
| D-14 | **świadomy rozdział** granicy ataku i granicy tarczy — dwie stałe, dwa uzasadnienia | DZ, KOD | **ACTIVE** |
| D-15 | mnożnik pasa bocznego to **wartość playtestowa**, warianty świadomie nieporównywane | KOD | **ACTIVE**, liczba `OPEN` |
| D-16 | blok boczny **bez osobnej kary** za wysiłek | KOD | **ACTIVE** |
| D-17 | wysiłek za **zablokowany cios**, nigdy za trzymanie tarczy | KOD | **ACTIVE** |
| D-18 | jakość skaluje `reduction`, **nie** karę tempa ani kosztu | KOD | **ACTIVE** |
| D-19 | „procent jakości na tarczy wart więcej niż na zbroi" — asymetria świadomie przyjęta | KOD | **ACTIVE** |
| D-20 | cena tarczy okutej z **twierdzenia o konwersji** (220, nie 140) | TA §9.1, KOD | ⚠ **ACTIVE, ale wyliczenie nie znało KONTROLI** → OI-25 |
| D-21 | bramka „**wymaga tarczy**" twarda; odrzucono „działa bez tarczy, słabiej" | SB §1.3 R8 | **ACTIVE** |
| D-22 | zasięg Uderzenia **z BRONI** — decyzja ODWRÓCONA przez rozgrywkę | SB §3.2 | **ACTIVE** |
| D-23 | „**żadnego frameworku `Effects` teraz**" | SB v1.1 | ⛔ **SUPERSEDED** — warstwa istnieje (S-8) |
| D-24 | „Raise Shield jako czwarty przycisk się nie zmieści" | TA §B.9 | ⛔ **SUPERSEDED** — poprawnie odnotowane banerem 08-26 |
| D-25 | **feedback bloku jest wymaganiem**: osobny dźwięk i błysk **zamiast** trafienia | TA §10.5, KOD | **ACTIVE** |
| D-26 | koszt alternatywny tarczy zostaje **otwarty**; ⛔ nie naprawiać nerfem tarczy | OD | **ACTIVE** (decyzja negatywna) |
| D-27 | puklerz **bez `requires`** — reguła „pełna ścieżka bez wymagań" | KOD | **ACTIVE** |
| D-28 | lista „poza zakresem SHIELD-02" | TA §11 | ⚠ **częściowo SUPERSEDED** (S-4) |

⚠ **Zastąpienie CZĘŚCIOWE wystąpiło po raz CZWARTY z rzędu** (D-10, D-20, D-28),
licząc `attributes`, `stamina` i `armor`. Przy czterech domenach z czterech to
nie jest już obserwacja — **to jest własność tej dokumentacji** i powinna wejść
do procedury jako domyślne założenie, a nie jako niespodzianka.

---

## 4. OI-9 — rozstrzygnięcie

**Pytanie:** `size` na tarczach jest etykietą bez efektu; miało być rozstrzygnięte
razem z domeną `shields`.

**Fakt z kodu (twardy):** pole ma **zero czytelników** w całym `src/`. Nie jest
czytane przez blok, przez zasięg, przez geometrię, przez UI ani przez sklep.

**Historia jego czterech kandydatów na konsumenta:**

| kandydat | co się stało |
|---|---|
| **parowanie** | powstało (Combat v1) — ale jako **cecha rodziny BRONI**, nie tarczy. Nigdy nie mogło skonsumować pola tarczy |
| **Raise Shield** | nie powstało i nie jest zaplanowane |
| **zasięg Uderzenia tarczą** | miał być pierwszym konsumentem i **odmówił po pomiarze** — krótszy zasięg okazał się martwym pasmem, nie kosztem |
| **geometria trzech stref** (2026-09-05) | najbardziej naturalna okazja, żeby tarcze różniły się kątem — **wybrano wspólną stałą**, żeby konwencja granicy została jedna |

**Rozstrzygnięcie:**

1. **`size` nie jest osieroconym polem czekającym na konsumenta** — jest
   etykietą, której reguła zatrzymania („etykiety nie da się po cichu wystroić
   ani policzyć dwa razy") **została zweryfikowana czterokrotnie**.
2. ⚠ **Warunek jej powrotu, zapisany w §B.7, jest w połowie nieaktualny.**
   „Gdy powstanie parry albo Raise Shield" — parry powstało i okazało się
   należeć do innej domeny. Warunek w poprawionym brzmieniu:
   > `size` zacznie cokolwiek znaczyć dopiero wtedy, gdy powstanie mechanika
   > różnicująca tarcze **ich własną geometrią albo masą**. Samo pojawienie się
   > kolejnej mechaniki obronnej tego nie przesądza — trzy z czterech
   > dotychczasowych kandydatów odmówiły z własnych, dobrych powodów.
3. **Co zostaje OPEN, a czego pomiar nie rozstrzyga:** czy projekt CHCE, żeby
   tarcze różniły się kątem. Dziś decyzja brzmi „nie" (D-13, D-14) i jest
   uzasadniona; ⛔ ale to jest decyzja projektowa, nie fakt z kodu.

---

## 5. Pomiary

**Metoda:** skrypt nad zbundlowanym `GameConfig.ts`; redukcja bloku po jakości
liczona jak w `Equipment.blockSpec` (mnożnik jakości obrony, **bez** capu),
łączna mitygacja jako `1 − (1 − pancerz)(1 − blok)` — tak, jak składa je
resolver przed jedynym zaokrągleniem.

**Geometria (z `SHIELD`):** pełny sektor **120°** · pas boczny **2 × 40°** ·
łączna reakcja **200°** · tył **160°**. Półkula ataku i parowania: **180°**.
⚠ Zewnętrzna granica tarczy wychodzi **poza** półkulę parowania o 10° na stronę.

**Skalowanie jakością** (blok mnoży się POZA krzywą, więc dostaje pełny nominał):
przy jakości sklepowej redukcja tarczy rośnie o kilka punktów procentowych,
a przy najwyższej — o kilkanaście procent wartości bazowej. Kara tempa i koszt
wysiłku **nie ruszają się wcale**, więc **jakość poprawia tarczę bez podnoszenia
jej ceny w rozgrywce**. To jest ta sama asymetria, którą D-19 nazwał i przyjął.

**OI-24 — łączna mitygacja.** Przy realnym szczycie pancerza (~70% z ekstrakcji
`armor`) i tarczy okutej łączna redukcja mieści się w przedziale **~84–86%**,
a przy sufcie pancerza i najlepszej jakości sięga **~88%**. Żadna pojedyncza
liczba w konfigu tego nie zapowiada: sufit dotyczy **wyłącznie** członu
pancerza.

⚠ **To nie jest zgłoszenie „za dużo".** To jest zgłoszenie, że **nie istnieje
miejsce, w którym ktokolwiek zdecydował, ile ma wynosić maksymalna mitygacja
w tej grze** — jest tylko sufit jednego z dwóch składników. Decyzja autora.

---

## 6. Los każdego niezmiennika

| niezmiennik | los |
|---|---|
| „tarcza to pancerz, który blokuje" | ✅ **PRZEJĘTY** jako **N-21** — `items` zachowuje kształt PRZEDMIOTU, `shields` konsekwencję MECHANICZNĄ |
| „kąt stoi poza przedmiotem" | ✅ przeniesiony jako **N-22** |
| „blok deterministyczny" | ✅ przeniesiony jako **N-23** — z zachowaniem POMIARU, który to przesądził |
| „blok neutralny wobec typu" | ✅ przeniesiony jako **N-24** — ⚠ przyszedł jako **depozyt z domeny `armor`** i został odebrany |
| „jedna konwencja granicy kąta" | ✅ przeniesiony jako **N-25** |
| „`swingMul` w tempo ORAZ zamach" | ✅ przeniesiony jako **N-26** |
| „wysiłek za zablokowany cios" | ✅ przeniesiony jako **N-27** |
| „feedback bloku jest wymaganiem" | ✅ przeniesiony jako **N-28** |
| „każdy przedmiot do drugiej ręki osłabia broń dwuręczną" (§F.5) | ✅ przeniesiony jako **N-29** — ⚠ dotąd żył **wyłącznie** w dokumencie o broni dwuręcznej i w checkliście |
| „blok jako rzut kością — odrzucone" | ✅ przeniesiony **razem z powodem** (N-23) |
| „punkty tarczy z każdej strony, blok z przodu" | ✅ przeniesiony — `STAN` §1 |
| „mała liczba punktów, żeby cap został nieistotny" | ✅ **ZWERYFIKOWANY i TRZYMA** (S-12) — przeniesiony jako fakt, nie jako obietnica |
| „bramka czyta `blockSpec`, nie nazwy" | ✅ przeniesiony — `STAN` §5 |
| „zasięg umiejętności z broni" | ✅ przeniesiony — `STAN` §5, jako **reguła ogólna** („trafiasz autoatakiem → trafiasz umiejętnością") |
| parowanie: skąd się bierze, komu przysługuje | ➡ **DELEGOWANY** do `weapons` (cecha rodziny) + `combat` (łańcuch obrony) |
| ogłuszenie jako prymityw, diminishing returns | ➡ **DELEGOWANY** do `abilities` |
| krzywa kosztu przyjętego ciosu | ➡ **DELEGOWANY** do `stamina` |
| punkty, materiał, krzywa i sufit tarczy | ➡ **DELEGOWANY** do `armor` |
| `size` jako POLE przedmiotu | ➡ **ZOSTAJE** w `items`; pytanie projektowe zostaje tutaj (OI-9) |
| brak wspólnego sufitu mitygacji | 🆕 **NOWY** — z pomiaru, nieopisany nigdzie (S-5) |
| zewnętrzna granica tarczy szersza od półkuli parowania | 🆕 **NOWY** jako reguła domenowa (S-6) |
| stawka zapasowa kosztu bloku | 🆕 **NOWY** — `STAN` §1 i checklista (S-7) |

---

## 7. Granice wyprowadzone z KODU

| granica | co pokazał kod | werdykt |
|---|---|---|
| `shields` ↔ `armor` | wspólny plik, **zero wspólnych obliczeń**: geometria nie czyta profilu, arytmetyka ochrony nie czyta stałych tarczy. Jedyny styk to wspólne zaokrąglenie w resolverze — fakt domeny `combat` | ❌ **sąsiedztwo, nie zależność** — potwierdza rekomendację z ekstrakcji `armor` |
| `shields` ↔ `weapons` | ⚠ **parowanie NIE jest tarczą**: płynie z cechy rodziny broni, działa bez tarczy i ma **inną granicę kątową**. Wspólny jest tylko predykat kąta | ❌ **wspólny predykat, nie wspólna mechanika** |
| `shields` ↔ `combat` | tarcza oddaje ułamek **i strefę**; kolejność kroków oraz jedno zaokrąglenie należą do `combat` | ✅ zależność asymetryczna, jak przy `armor` |
| `shields` ↔ `abilities` | ⚠ **dwukierunkowa i to rzadkość**: `abilities` czyta `blockSpec` jako bramkę, a `shields` dostaje z powrotem **trzeci składnik wartości tarczy** (kontrolę), którego pierwotna wycena nie znała | ✅ **zależność obustronna** |
| `shields` ↔ `stamina` | tarcza pobiera stawkę za blok **i obniża** koszt przyjętego ciosu, bo ten liczy się po mitygacji | ✅ zależność w obie strony wartości, jednokierunkowa w kodzie |

⚠ **Wniosek taksonomiczny: `armor` i `shields` słusznie zostały osobno.**
Gdyby je scalono, dokument musiałby jednocześnie twierdzić „ochrona zależy od
typu obrażeń" (pancerz) i „ochrona jest wobec typu neutralna" (tarcza) — dwie
przeciwne reguły w jednym `STAN`-ie. **To jest mocniejszy argument niż ten
z ekstrakcji `armor`**, gdzie widać było tylko brak wspólnego kodu.

---

## 8. Czego procedura tu NIE złapała

1. ⚠⚠ **Dokument domeny nie wie o zmianach, które przyszły z INNYCH domen.**
   Cztery z dwunastu rozjazdów (S-4, S-8, S-10, S-11) to decyzje unieważnione
   spoza tarcz: parowanie z broni, obciążenie ze staminy, warstwa efektów
   z umiejętności. **`tarcze_analiza.md` nie zaniedbał niczego — po prostu nie
   miał jak tego zobaczyć.** ⛔ Wniosek dla następnych domen: lista „poza
   zakresem" starzeje się **szybciej** niż opis mechaniki, bo unieważnia ją
   dowolna inna domena. **Czytaj ją zawsze przeciw kodowi, nigdy jako stan.**

2. ⚠ **Rozjazd może siedzieć w jednym zdaniu wśród pięciu poprawnych.**
   §7 `tarcze_analiza.md` ma pięć reguł: trzy są dziś dokładnie prawdziwe, jedna
   jest w połowie prawdziwa (S-2), jedna została zastąpiona (S-1). Baner na
   górze dokumentu **nie pomaga**, bo mówi o innych sekcjach. Granulacja banerów
   jest za gruba, a rozjazd za drobny.

3. ⚠ **„Milczenie" bywa własnością SKŁADANIA, nie pola.** S-5 (brak wspólnego
   sufitu) nie jest brakiem opisu jakiegoś pola — **każde pole z osobna jest
   opisane**. Brakuje opisu tego, co się dzieje, gdy dwa opisane mechanizmy
   pomnożą się przez siebie. **Żaden przymiar tego nie znajdzie, a ekstrakcja
   znajduje to tylko wtedy, gdy ktoś policzy złożenie.**

4. ⚙ **Kontrola pozytywna wypadła dobrze i warto to zapisać.** Jedna pozycja
   zaparkowana (`odlozone.md`, koszt alternatywny tarczy) była **poprawnie
   zaktualizowana** po wdrożeniu Uderzenia tarczą, razem z powodem i skutkiem.
   Dokumentacja tego projektu nie jest równomiernie zaniedbana — **parking
   trzyma się lepiej niż analizy.**

⚙ **Co zadziałało bez zmian:** odczyt code-first, tabela granic domeny na
początku `STAN`, weryfikacja każdego niezmiennika, `## Pokrycie` z bramek.
⚠ Nowość działająca: **grupa §X w regresji dała gotowe pozycje do `## Pokrycie`**
— siedem asercji, każda z nazwą i intencją. Domena z takim przymiarem opisuje
się sama; `armor` takiego nie miał i to było widać w budżecie.
