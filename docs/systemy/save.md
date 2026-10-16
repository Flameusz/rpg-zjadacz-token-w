---
typ: STAN
domena: save
tytul: Zapis — sloty, wersja, reguła addytywna
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-10-11, przymiar:doc_check, przymiar:zapis_weryfikacja]
kotwice:
  - src/core/Save.ts
  - src/core/Session.ts
  - GameConfig.INVENTORY
otwarte: [OI-50]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-14
---

# Zapis — sloty, wersja, reguła addytywna

> **Czym jest ten dokument.** Odpowiedzią na pytanie **jak w tej grze przeżywa
> się między sesjami**: co trafia do zapisu, kiedy, i co się dzieje z zapisem
> z innej wersji gry.
>
> **Czym NIE jest.** ⛔ **Nie mówi, co ZNACZY którekolwiek zapisane pole** — to
> należy do domeny, która je wytwarza. Granice w §0.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| kształt zapisu, wersja, sloty, odtwarzanie | **`save`** |
| co znaczy zapisane pole i jaka jest jego wartość domyślna **w mechanice** | domena właściciela |
| migawka i odtworzenie stanu jednego systemu | ten system |
| jak wygląda ekran wyboru zapisu | `ui` |

⚠⚠ **Ta domena nie wie, czym jest poziom, złoto ani ranga.** Woła migawkę
u właściciela i oddaje mu ją z powrotem — cała jej wiedza to **kształt i jego
trwałość w czasie**.

### 0.1 Zależności

| kierunek | domena | przez co |
|---|---|---|
| `save` **bierze** | każdy system trwały | migawkę i odtworzenie |
| `save` **bierze** | `world` | mapę i pozycję gracza |
| `save` **daje** | `ui` | opis slotu do narysowania |
| `save` **reaguje na** | wszystkie domeny trwałe | zdarzenia zmiany → autozapis |

---

## 1. Cztery sloty

**Jeden autozapis i trzy ręczne**, każdy pod własnym kluczem.

⚠⚠ **Autozapis NIGDY nie pisze do slotu ręcznego** — nawet do tego, z którego
wczytano. To jest cały sens podziału: autozapis trzyma obietnicę „**nic nie ginie
między sesjami**", a slot ręczny jest punktem, który gracz **wybrał**. Pisanie
autozapisu do wczytanego slotu **zlałoby oba**: nie dałoby się wrócić do decyzji,
bo decyzja zostałaby nadpisana przez samo granie dalej.

⚠ **Autozapis zachował ORYGINALNY klucz** i to jest cała migracja do slotów —
każda postać sprzed ich istnienia **po prostu JEST autozapisem**, bez kroku
konwersji, który można by pomylić.

⚠ **Trzy sloty, nie dziesięć** — listę zapisów się **skanuje**, nie czyta.

---

## 2. Wersja

⚠⚠ **Wersja chroni ZNACZENIE, nie tylko kształt.** Ostatnie podbicie nastąpiło
przy **niezmienionym kształcie**: zmieniła się wymowa zapisanych liczb progresji,
więc stary zapis odtworzyłby postać z budżetem, którego dzisiejsze reguły nigdy
by nie przyznały. ⛔ **„Podbij, gdy zmienia się kształt" jest niepełne.**

⭐⭐ **POLITYKA ZAPISU (`OI-51`, 2026-10-11): niezgodny zapis się MIGRUJE, nie
kasuje.** Do tej daty obowiązywało „obca wersja = nowa gra, nigdy migracja" —
poprawne w prototypie, nie do przyjęcia u gracza z dziesiątkami godzin postaci.
Autor zlecił odwrócenie przy dodawaniu „Zapisz i wyjdź". Trzy reguły:

1. **Pole addytywne nadal NIE podbija wersji** (§3) — najtańsza droga zostaje.
2. **Podbicie `SAVE_VERSION` WYMAGA migracji** `MIGRACJE[stara]` (o jedną
   wersję w górę; `migruj` przechodzi łańcuch po kolei, na KOPII). Zmiana
   ZNACZENIA — jak v3 — też jest migracją (np. zwrot punktów do ponownego
   rozdania), ⛔ nigdy skasowaniem postaci. Luka w łańcuchu = `null` = odmowa,
   nie połowiczna postać.
3. **Czego ten build nie umie wczytać, tego nie niszczy.** Zapis z NOWSZEJ
   wersji (cofnięty build), starszy niż `MIN_WERSJA` albo uszkodzony trafia do
   kopii `<klucz>-kopia-v<wersja>` ZANIM go nadpisze autozapis albo usunie
   „Nowa gra" (`clear`). Tak samo oryginał przed pierwszym zapisem po migracji.
   Istniejącej kopii się nie nadpisuje. ⚡ Zwykły autozapis rozpoznaje własny
   slot po początku tekstu (`{"version":N,`), bez parsowania.

`MIN_WERSJA` = 3: v2 został świadomie porzucony przy przestrojeniu progresji
i w obiegu go nie ma. ⚠ Podniesienie progu znaczy „porzucam starsze zapisy"
i wymaga decyzji autora.

⚠ **Odmowa ≠ ukrycie.** Zapis niewczytywalny **nadal się parsuje**, żeby
interfejs powiedział „zapis z nowszej wersji gry — zaktualizuj grę" albo „zapis
ze zbyt starej wersji gry" zamiast pokazać pusty slot.

---

## 3. Reguła addytywna — rdzeń tej domeny

> ⚠⚠ **NOWE POLE DODAJE SIĘ JAKO OPCJONALNE, BEZ PODBIJANIA WERSJI.**

Uzasadnienie jest zawsze to samo: podbicie wersji dla pola **czysto
addytywnego** kasuje realny postęp **za zero zysku**. Zamiast tego **loader
podstawia wartość domyślną**, a domyślna musi znaczyć dokładnie to, co było
prawdą o postaci sprzed tej mechaniki.

⚠ **Reguła ma dwie połowy i obie są konieczne:**

| połowa | co znaczy |
|---|---|
| **pole opcjonalne** | zapis bez niego jest **legalny**, nie uszkodzony |
| **domyślna w loaderze** | brak pola odtwarza się jako **stan sprzed mechaniki**, nigdy jako zero „bo tak wyszło" |

⚠⚠ **To nie jest slogan — to jest zmierzony kształt zapisu.** Pola wymagane to
dziś **wyłącznie pierwotny zestaw**; **wszystko, co doszło później, jest
opcjonalne**, a stosunek jednych do drugich jest **trzy do jednego na korzyść
opcjonalnych**. Pomiar: `docs/proces/ekstrakcja_save.md` §4.

⚠ **Kształt pola też bywa unią, nie tylko obecnością.** Element noszony zapisany
przed istnieniem jakości wykonania jest **samym identyfikatorem**; od tego czasu
jest pełną kopią. **Obie postacie się wczytują**, a starsza normalizuje się do
jakości zwykłej i pełnej trwałości — czyli do obietnicy „**nic, co gracz już ma,
nie staje się gorsze**".

⚠ **Pole wycofane zostaje do ODCZYTU.** Atrybut usunięty z gry nadal daje się
przeczytać ze starego zapisu i **odwzorować na następcę** — dzięki temu wersja
nie musiała się ruszyć, a postać nie straciła ani punktu.

---

## 4. Odtwarzanie

⚠ **Wczytywanie normalizuje, nie przypisuje wprost.** Wpis wskazujący na
przedmiot, którego już nie ma, **gubi jeden slot** — ⛔ nigdy nie kładzie całego
zapisu.

⚠⚠ **Kolejność odtwarzania bywa TREŚCIĄ, nie porządkiem.** Pula wyliczana
z atrybutu musi zostać przeliczona **przed** przywróceniem wartości bieżącej —
inaczej bieżąca zostaje przycięta do starej, mniejszej puli.

⚠ **Autozapis jest WYCISZANY na czas wczytywania.** Odtwarzanie emituje te same
zdarzenia, które normalnie zapisują — bez wyciszenia wczytywanie zapisywałoby
w trakcie wczytywania.

⚠ **Zapis pozycji ma bramkę „dopiero gdy scena istniała".** Reset singletonów
przy nowej grze emituje zdarzenia, zanim świat ma jakiekolwiek wymiary; zapis
bez tej bramki przypiąłby postać do rogu mapy z zerowym zdrowiem.

---

## 5. Czego zapis świadomie NIE trzyma

| rzecz | dlaczego |
|---|---|
| **cooldowny umiejętności** | ⚠ stan chwili; bankowanie pozwalałoby ominąć długi cooldown wyjściem i wejściem |
| **efekty czasowe** | ta sama zasada — stan chwili *(`effects`)* |
| **żywe stworzenia** | ⚠ odradzają się od nowa; zapisanie ich znaczyłoby serializację pozycji, zdrowia i stanu AI dla czegoś, co **ma być za każdym razem inne** |
| **odblokowania umiejętności** | ⛔ **nie są trzymane wcale** — wynikają z poziomu i nauki |

⚠⚠ **Wyjątki od „żywe stworzenia nie przeżywają" są DWA i oba są celowe:**
śmierć przeciwnika, który nie wraca (jedzie na liczniku zabójstw) oraz
odrastanie stanowisk zbieractwa. ⚠ Obu wolno, bo są **krótką listą czytaną raz
przy wejściu na mapę** — nie stanem symulacji.

---

## 6. Autozapis

⚠ **Wyzwalaczem jest ZDARZENIE ZMIANY domeny trwałej**, nie zegar ani wyjście
z gry.

⚠⚠ **Wyzwalacz musi być wąski.** Układ paska umiejętności ma **własne
zdarzenie**, bo ogólne leci także przy każdym starcie cooldownu — zapisywałoby
po każdym użyciu umiejętności. ⚠ Ta sama lekcja wróciła przy praktyce, gdzie
zdarzenie leci **wyłącznie przy realnym punkcie**, a nie przy każdym ciosie.

⚠ **Niepowodzenie zapisu jest połykane.** Tryb prywatny albo pełny limit
przeglądarki nie może wywalić gry — utrata autozapisu nie jest awarią krytyczną.

---

## 7. Niezmienniki

- **N-136** — ⚠⚠ **nowe pole jest OPCJONALNE i NIE podbija wersji** (§3);
  loader podstawia domyślną znaczącą „stan sprzed mechaniki".
- **N-137** — **wersja chroni znaczenie, nie tylko kształt** (§2).
- **N-138** — ⭐ **starszy zapis MIGROWANY łańcuchem `MIGRACJE`; podbicie wersji
  bez migracji jest błędem** (przymiar §G1). Niewczytywalny (nowszy, za stary,
  uszkodzony) — odrzucany w całości, ⚠ ale **parsowany** i **odkładany do kopii**
  przed nadpisaniem lub usunięciem (§2, przymiar §H).
- **N-139** — **autozapis nigdy nie pisze do slotu ręcznego** (§1).
- **N-140** — **klucz autozapisu jest niezmienny** (§1).
- **N-141** — **odtwarzanie normalizuje**; ⛔ zły wpis gubi jeden slot, nie zapis (§4).
- **N-142** — **kolejność odtwarzania bywa treścią** (§4).
- **N-143** — **autozapis wyciszony na czas wczytywania** (§4).
- **N-144** — **wyzwalacz autozapisu musi być wąski** (§6).
- **N-145** — **stan chwili nie przeżywa zapisu** (§5).

---

## 8. Checklista: nowe pole zapisu

1. ⚠⚠ **Opcjonalne. Zawsze.** Podbicie wersji rozważ **wyłącznie**, gdy zmienia
   się **znaczenie** istniejących danych (N-137).
2. **Domyślna w loaderze** — i sprawdź, czy znaczy „stan sprzed tej mechaniki",
   a nie przypadkowe zero (N-136).
3. ⚠ **Czy to na pewno stan trwały?** Cooldown, efekt i pozycja żywego stwora
   **nie są** (N-145).
4. ⚠ **Czy da się to odtworzyć z czegoś innego?** Jeśli tak — nie zapisuj.
   Jeśli nie — **udokumentuj dlaczego** *(przykład: wartość startowa biegłości
   nie wynika z bieżącej)*.
5. **Wyzwalacz autozapisu** — sprawdź, czy istniejące zdarzenie nie leci zbyt
   często (N-144).
6. Bramki: `npx tsc --noEmit` · `npm run build` · **`node tools/zapis_weryfikacja.mjs`**.
   ⚠ **Przymiar pokrywa SKUTEK reguły addytywnej, nie samą regułę**: §C pilnuje,
   że każde pole `SaveData` jest i pisane, i czytane, a §D — że zapis pozbawiony
   WSZYSTKICH pól opcjonalnych nadal się wczytuje. Nie sprawdza natomiast, czy
   nowe pole *zadeklarowano* jako opcjonalne ani czy `SAVE_VERSION` nie poszedł
   w górę bez powodu. Patrz `OI-50`.

---

## `stowed` — czwarte pole dodane bez podbicia wersji (2026-09-11)

Drugi zestaw broni zapisuje się jako `stowed: { weapon2?, offhand2? }`.

- **Opcjonalne, więc `SAVE_VERSION` się nie ruszył** — czwarta rzecz dodana tą
  drogą po `quickSlot`, pierścieniach i torbach. Zapis sprzed drugiego zestawu
  wczytuje się jako „drugi zestaw pusty", co jest dokładnie poprawne.
- ⚠ **POZA `equipment`, z tego samego powodu co `bags`:** `weapon2`/`offhand2`
  nie są `EquipSlot`-ami, a zmieszanie obu unii uczyniłoby `readEquipped`
  niejednoznacznym co do rodzaju slotu, który czyta.
- ⚠ Wczytanie pisze w te pola **wprost**, omijając `equipFromBag` — dlatego
  `normalizeHands()` sprząta po OBU zestawach, nie tylko po czynnym.

## `explored` — odkryty teren (2026-10-14)

`explored?: Record<obszar, "kol×wier:base64" | "*">` — bity mgły per obszar
(`core/Exploration.ts`, opis mechaniki: `world` §5.1). Opcjonalne, bez podbicia
wersji.

- ⚠⚠ **Brak pola NIE znaczy „nic nie odkryto”** — znaczy „zapis sprzed
  Kartografii”, a taka postać miała mapę i minimapę od pierwszej klatki.
  Loader daje jej `cartography_1` + `cartography_2` i `"*"` (całość) dla wsi
  i lasu. Nowa gra zapisuje `{}`, nigdy brak. To ta sama obietnica co §3:
  nic, co gracz już ma, nie staje się gorsze.
- Wymiary siatki jadą w polu: zapis po przebudowie mapy (inny rozmiar)
  się nie rozpakowuje — mgła wraca, zamiast rysować się w złych miejscach.
- ⚠ **Wyjątek od §6: autozapis z odkryć jest DŁAWIONY** (`MAP_FOG.saveEveryMs`,
  15 s), bo komórki odkrywają się kilka razy na sekundę marszu. Resztę
  dopisuje `visibilitychange` przy schowaniu aplikacji.

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| cztery sloty, autozapis nie pisze do ręcznych | ✅ | ✅ | `kod:2026-09-06` |
| niezmienny klucz autozapisu | ✅ | ✅ | `kod:2026-09-06` |
| wersja chroni znaczenie | ✅ | ✅ | `kod:2026-09-06` |
| migracja łańcuchem + kopia niewczytywalnego (`OI-51`) | ✅ | ✅ | `przymiar:zapis_weryfikacja` §G/§H (sabotaż: 4/4 wykryte) |
| **reguła addytywna** | ✅ | ✅ | ⚠ **częściowo** — `przymiar:zapis_weryfikacja` §C/§D pokrywa SKUTEK; deklaracja pola i `SAVE_VERSION` dalej bez asercji (`OI-50`) |
| unia kształtów pola i normalizacja | ✅ | ✅ | `kod:2026-09-06` |
| pole wycofane odwzorowane na następcę | ✅ | ✅ | `kod:2026-09-06` |
| upadek jednego slotu zamiast całego zapisu | ✅ | ✅ | `kod:2026-09-06` |
| kolejność odtwarzania (pula przed wartością) | ✅ | ✅ | `kod:2026-09-06` |
| wyciszenie autozapisu przy wczytywaniu | ✅ | ✅ | `kod:2026-09-06` |
| bramka „dopiero gdy scena istniała" | ✅ | ✅ | `kod:2026-09-06` |
| stan chwili poza zapisem | ✅ *(świadomie)* | ✅ | `kod:2026-09-06` |
| dwa wyjątki stanu świata | ✅ | ✅ | `kod:2026-09-06` |
| **polityka wobec premiery** | ✅ | ✅ | ✅ **2026-10-11** — migracja zamiast kasowania (§2) |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-50** | ⚠ **ZAWĘŻONE 2026-09-21, NIEZAMKNIĘTE.** Domena ma od tej daty przymiar — `tools/zapis_weryfikacja.mjs`, **59 asercji**, wszystkie zielone; każda udowodniona sabotażem na `Save.ts` (**14 mutacji, 14 wykrytych**, plik przywrócony bajt w bajt). Pokrywa: pełny obieg zapis→wyczyszczenie→wczytanie **pole po polu** (§A), całkowitość odmowy przy obcej wersji (§B), **strukturalne sprawdzenie, że każde pole `SaveData` jest i pisane, i czytane** (§C), wczytanie zapisu pozbawionego wszystkich pól opcjonalnych (§D), klucze i izolację slotów (§E) oraz wyciszenie autozapisu (§F). ⛔ **Co ZOSTAJE otwarte:** nic nie sprawdza, że nowe pole *zadeklarowano* jako opcjonalne, ani że `SAVE_VERSION` nie poszedł w górę bez powodu — to reguły o PRZYSZŁEJ edycji, nie o dzisiejszym stanie, i przymiar ich nie widzi. ⚠ Czy to wystarcza do zamknięcia — **decyzja autora**, nie wniosek z zieleni. |
| ~~OI-51~~ | ✅ **ZAMKNIĘTE 2026-10-11** — polityka odwrócona: migracja łańcuchem `MIGRACJE`, kopia niewczytywalnego zapisu przed nadpisaniem (§2). |

---

## Czego ten dokument nie rozstrzyga

- **Co znaczy którekolwiek zapisane pole** — domena właściciela.
- **Czy dana rzecz POWINNA być zapisywana** — to decyzja domeny, która ją
  wytwarza; tutaj jest wyłącznie reguła, **jak** się to robi.
- **Jak wygląda ekran wyboru zapisu** — `ui`.
- **Ile slotów powinno być.**

---

## Gdzie szukać POWODÓW

| pytanie | dokument | moc |
|---|---|---|
| ocena polityki zapisu i jej granic czasowych | `docs/audyt_projektowy_fundamentow_2026-09-03.md` §2.9 | ACTIVE |
| przykłady pól dodanych tą regułą, z uzasadnieniem każdego | `docs/systemy/items.md`, `docs/systemy/proficiency.md`, `docs/systemy/abilities.md` | ACTIVE |
| rozjazdy, pomiar kształtu zapisu i metoda ekstrakcji | `docs/proces/ekstrakcja_save.md` | — |
