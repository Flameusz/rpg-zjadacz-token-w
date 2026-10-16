---
typ: STAN
domena: progression
tytul: Progresja — XP, poziomy, punkty rozwoju
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-06, przymiar:doc_check, przymiar:atrybuty_kalibracja]
kotwice:
  - src/core/Progression.ts
  - GameConfig.PROGRESSION
  - GameConfig.ABILITIES
otwarte: [OI-43, OI-44]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Progresja — XP, poziomy, punkty rozwoju

> **Czym jest ten dokument.** Odpowiedzią na pytanie **jak postać rośnie**:
> skąd bierze się doświadczenie, co daje poziom i czym jest punkt rozwoju.
>
> **Czym NIE jest.** ⛔ **Nie podaje ani jednej liczby krzywej** ani nagród
> rosteru — to są dane. Nie mówi, co punkt *robi* po wydaniu; granice w §0.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| skąd XP, co daje poziom, czym jest punkt rozwoju | **`progression`** |
| **co robi** punkt włożony w atrybut | `attributes` |
| nauka umiejętności, sloty, cooldowny | `abilities` |
| biegłość `P`, praktyka, rangi Mastery | `proficiency` |
| złoto: skąd i na co | `economy` |
| kto daje ile XP i za co | `creatures`, `quests` |

⚠⚠ **Biegłość NIE jest osią progresji tej domeny.** Rośnie z użycia, nie
z poziomu, i ma własną walutę (praktykę). Jedyny punkt styku: **rangi Mastery
kupuje się z TEJ SAMEJ puli punktów** (§3).

### 0.1 Zależności

| kierunek | domena | przez co |
|---|---|---|
| `progression` **bierze** | `creatures`, `quests` | doświadczenie za zabójstwo i za zadanie |
| `progression` **daje** | `attributes` | punkty do wydania |
| `progression` **daje** | `abilities` | poziom jako **pierwsza z dwóch bramek** + punkty na naukę |
| `progression` **daje** | `proficiency` | punkty na rangi |
| `progression` **daje** | `economy` | ⛔ **nic** — to są rozłączne waluty (§3) |

---

## 1. Doświadczenie

⚠ **Dwa źródła i tylko dwa: zabójstwo i ukończone zadanie.** ⛔ Nie ma XP za
zbieractwo, gotowanie, rozmowy ani odkrywanie mapy.

⚠ **Zabójstwa są POWTARZALNE, zadania nie.** Prawie cały roster się odradza po
kilkunastu sekundach; wyjątkiem jest elita, która nie wraca. **Zadania są pulą
jednorazową** — co znaczy, że długa gra jedzie wyłącznie na zabójstwach.

⚠ **Nagroda jest własnością stworzenia, nie poziomu gracza.** ⛔ Nie ma
skalowania nagrody do poziomu ani kary za bicie słabszych — królik daje tyle
samo na poziomie 1 co na 27.

⚠ **Przyznanie XP przelewa się przez WIELE poziomów naraz** — jedna duża
nagroda może dać więcej niż jeden awans, i każdy z nich ogłasza się osobno.

⚠ **Na sufcie poziomu XP przestaje być przyjmowane, a pasek stoi pełny.**
Nadwyżka **nie jest bankowana**.

---

## 2. Poziom

Poziom rośnie, gdy XP przekroczy próg; próg rośnie **wykładniczo** względem
poziomu (`PROGRESSION.baseXp`, `PROGRESSION.growth`), a sufit stoi
w `PROGRESSION.maxLevel`.

⚠⚠ **Poziom sam z siebie nie daje NICZEGO poza punktami i bramkami.** Nie
podnosi HP, obrażeń ani żadnej statystyki — **wszystko idzie przez wydany
punkt**. To jest decyzja: postać nie rośnie mijającym czasem, tylko wyborem.

⚠ **Poziom jest PIERWSZĄ z dwóch bramek umiejętności** — druga to nauka
u trenera *(domena `abilities`)*. ⚠⚠ **Wszystkie dzisiejsze odblokowania mieszczą
się w pierwszej piątej części skali poziomów**; reszta skali nie odblokowuje
niczego (OI-43).

---

## 3. Punkt rozwoju

⚠⚠ **JEDNA WSPÓLNA PULA — i to jest jedyna waluta w grze z realnym
niedoborem.** Ten sam licznik kupuje:

| ujście | domena |
|---|---|
| atrybuty | `attributes` |
| naukę umiejętności u trenera | `abilities` |
| rangi Mastery | `proficiency` |

⚠ **Wydanie punktu w jedno jest rezygnacją z drugiego.** Ta wspólność jest
mechaniką, nie oszczędnością implementacyjną.

⚠ **Punkty przyznaje wyłącznie awans**, stałą liczbą na poziom. ⛔ Nie ma
innego źródła: ani zadania, ani znaleziska, ani złoto punktów nie dają.

⚠ **Wydanie jest ATOMOWE i „wszystko albo nic".** Zakup, na który nie starcza,
nie zostawia postaci częściowo obciążonej — to jest warunek, pod którym nauka
może pobrać punkty **i** złoto razem albo wycofać się czysto.

⛔ **Respecu nie ma i nie jest planowany.** Na tym stoi cała reszta: bramka,
której gracz nie przejdzie, byłaby nieodwracalna *(patrz „pełna ścieżka bez
wymagań" w `items`)*.

⚠⚠ **Pula z całej skali poziomów jest SKOŃCZONA, a ujścia poza atrybutami są
policzalne** — i ich suma zbliża się do niej niebezpiecznie (OI-44).

---

## 4. Zapis

Poziom, XP, punkty i wydane atrybuty przeżywają zapis. ⚠ **Sumaryczne XP jest
trzymane osobno i służy wyłącznie do wglądu** — nie da się z niego odtworzyć
progresji ani na nim niczego oprzeć.

---

## 5. Niezmienniki

- **N-94** — **dwa źródła XP i tylko dwa** (§1).
- **N-95** — **nagroda należy do stworzenia, nie do poziomu gracza**; ⛔ żadnego
  skalowania ani kary za słabsze cele.
- **N-96** — **poziom nie daje nic poza punktami i bramkami** (§2).
- **N-97** — **jedna wspólna pula punktów** (§3); nowe ujście konkuruje
  z atrybutami, umiejętnościami i rangami naraz.
- **N-98** — **punkty przyznaje wyłącznie awans** (§3).
- **N-99** — **wydanie jest atomowe**; sprawdź wszystkie koszty przed pobraniem
  któregokolwiek *(ta sama reguła co przy zakładaniu sprzętu i nauce)*.
- **N-100** — ⛔ **respec nie istnieje**; każda bramka musi mieć obejście
  *(egzekwuje `items`)*.
- **N-101** — **XP na sufcie przepada**, nie jest bankowane (§1).

---

## 6. Checklista: nowe źródło XP albo nowe ujście punktów

1. ⚠ **Nowe źródło XP** — rozstrzygnij jawnie, czy jest **powtarzalne**.
   Powtarzalne zmienia krzywą całej gry, jednorazowe tylko jej początek.
2. ⛔ **Nie skaluj nagrody do poziomu gracza** (N-95).
3. ⚠ **Nowe ujście punktów** — policz je wobec **całej puli ze skali poziomów**
   i wobec ujść, które już istnieją (N-97, OI-44). To jest zmiana budżetu całej
   gry, nie dodanie opcji.
4. ⚠ **Nowa bramka poziomu** — sprawdź, gdzie ląduje wobec dzisiejszych
   odblokowań (OI-43).
5. Bramki: `npx tsc --noEmit` · `npm run build` ·
   `node tools/atrybuty_kalibracja.mjs`.

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| dwa źródła XP | ✅ | ✅ | `kod:2026-09-06` |
| przelew przez wiele poziomów naraz | ✅ | ✅ | `kod:2026-09-06` |
| XP na sufcie przepada | ✅ | ✅ | `kod:2026-09-06` |
| poziom daje wyłącznie punkty i bramki | ✅ | ✅ | `kod:2026-09-06` |
| jedna wspólna pula | ✅ | ✅ | `przymiar:atrybuty_kalibracja` |
| atomowe wydanie punktów | ✅ | ✅ | `kod:2026-09-06` |
| brak respecu | ✅ *(świadomie)* | ✅ | — |
| **krzywa wobec zawartości** | ✅ | ⚠ | ❌ **policzone, nierozstrzygnięte** — OI-43 |
| **budżet punktów wobec ujść** | ✅ | ⚠ | ❌ **policzone, nierozstrzygnięte** — OI-44 |
| zestawienie krzywej i nagród | ❌ | ⚠ | ❌ **brak generatora** — OI-45 |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-43** | ⚠⚠ **Krzywa XP nie jest przestrojona pod dzisiejszą zawartość — POLICZONE.** Jedno pełne przejście mapy (każdy przeciwnik zabity raz) plus wszystkie zadania wyprowadza postać **znacznie powyżej ostatniego odblokowania umiejętności**, a **cała reszta skali poziomów nie odblokowuje już niczego**. Dojście do sufitu wymaga liczby przejść o dwa rzędy wielkości większej. Pełne liczby i metoda: `docs/proces/ekstrakcja_progression.md` §4. ⚠ **Pozycja była znana jako „wymaga DECYZJI, nie poprawki"** — ekstrakcja dodaje wyłącznie pomiar. ⛔ Możliwe odpowiedzi (mnożnik krzywej / nagrody rosteru / poziomy odblokowań / sufit) to **różne gry**. |
| **OI-44** | ⚠⚠ **Budżet punktów rozwoju jest niemal wyczerpany przez ujścia POZA atrybutami.** Pula z całej skali poziomów jest skończona; suma kosztów pełnej nauki umiejętności i pełnych rang Mastery dla wszystkich rodzin broni zostawia na atrybuty **kilka punktów z kilkudziesięciu**. ⚠ To nie jest usterka — **wspólna pula ma zmuszać do wyboru** (N-97) — ale nikt nie policzył, czy dzisiejszy stosunek jest zamierzony. ⚠ **Czytać RAZEM z `OI-28`**: trzy z czterech rang są przy dzisiejszej zawartości nieosiągalne, więc realny nacisk na pulę jest **dziś mniejszy, niż mówi cennik**. Liczby: `ekstrakcja_progression.md` §5. |
| **OI-45** | ✅ **ZAMKNIĘTE 2026-10-11** — `node tools/katalog_postepu.mjs --zapisz` → `docs/postep_katalog.md`: krzywa 1–50, pula XP z map (jedno wyczyszczenie = poziom 17), nagrody zadań, ujścia złota i punktów. |

---

## Czego ten dokument nie rozstrzyga

- **Żadnej liczby**: krzywej, nagród, progów, sufitu.
- **Czy krzywa jest dobrze wyważona** — `OI-43`.
- **Czy sufit poziomu ma taką wartość, jaką ma.**
- **Co robi punkt po wydaniu** — `attributes`, `abilities`, `proficiency`.
- **Skąd bierze się złoto** — `economy`.
- **Kto daje ile XP** — `creatures`, `quests`.

---

## Gdzie szukać POWODÓW

| pytanie | dokument | moc |
|---|---|---|
| dlaczego jedna wspólna pula i co z niej wynika | `docs/systemy/attributes.md` §4 | ACTIVE |
| pełny rozbiór osi progresji z pomiarami | `docs/systemy/combat.md` | ACTIVE |
| dlaczego rangi Mastery są ujściem punktów I złota | `docs/systemy/proficiency.md` | ACTIVE |
| pomiary, rozjazdy i metoda tej ekstrakcji | `docs/proces/ekstrakcja_progression.md` | — |
