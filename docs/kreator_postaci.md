---
typ: KANON
domena: assets
tytul: Kreator postaci — awatar gracza i fabryka wariantów NPC
stan: zywy
otwarte: [OI-166, OI-167, OI-168]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-09
---

# Kreator postaci

> **Status: PROJEKT, zero kodu.** Zapisane 2026-10-09 na prośbę autora.
> Kreator **nie wyprzedza akceptacji bazy 3D** (`OI-134`), ale osie ustalamy
> TERAZ, żeby baza nie wymagała przeróbki. Wątek: `OI-166`; model biznesowy,
> od którego zależy część decyzji: `OI-167`.

## 1. Po co — dwa cele, jeden system

1. **Gracz ma poczuć, że tworzy SWOJEGO awatara** (jak w WoW). To pierwszy
   ekran nowej gry, więc także pierwsze wrażenie produktu: zrzuty do sklepu,
   pierwsze dwie minuty, retencja.
2. **Fabryka NPC.** Wszyscy pixel-artowi NPC-e zostaną zastąpieni modelami
   3D z jednej bazy (decyzja autora 2026-10-03), a `swiat.md` już zakłada
   obsadę z wariantów (kolor ubrania, fryzura, broda, nakrycie głowy).
   ⭐ **NPC = zapisany preset kreatora.** Te same osie robią gracza i 21+
   mieszkańców — budujemy raz, używamy dwa razy.

⭐ **Myślimy o grze jak o produkcie** (autor: horyzont ≥ rok, możliwy
zarobek). Wszystko, co tu ustalamy, ma przeżyć dodawanie opcji przez lata
bez zmian w kodzie — **opcje kreatora są DANYMI (katalog), nie kodem.**

## 2. Reguła czytelności: co widać z 60 px

Postać w grze ma ~60 px wysokości. Kolejność prac wynika z tego, co gracz
**zobaczy w rozgrywce**, a nie tylko na ekranie kreatora:

| oś | widać w grze | koszt | etap |
|---|---|---|---|
| sylwetka | ✅ najmocniej | ⚠ wysoki (pancerz musi pasować) | v1 |
| fryzura (kształt) | ✅ | średni (siatki na kości głowy) | v1 |
| kolor włosów / skóry / zarostu | ✅ | niski (materiał) | v1 |
| zarost | ✅ | niski–średni | v1 |
| kolor oczu, twarz, blizny, malunki | ❌ tylko z bliska | niski, ale bez zysku | z portretami 3D |

⚠ **Kreator musi mieć podgląd „widok z gry"** (kamera i skala rozgrywki).
Opcja, której nie odróżnisz w tym podglądzie, nie wchodzi do v1 —
inaczej sprzedajemy różnicę, której gracz nigdy nie zobaczy.

## 3. Ramy, których kreator NIE rusza (bez decyzji autora)

- ✅ **Bohater to syn Marka i Aliny, ~18 lat — ROZSTRZYGNIĘTE 2026-10-09
  (autor, D1).** Płci w kreatorze dziś nie wybieramy. ⭐ **Płeć jest
  w planach razem z trybem co-op** (`OI-168`, §10) — więc przygotowujemy
  pod nią fundamenty, nie treść.
- **Szkielet i nazwy kości są nienaruszalne** (`postac3d_checkpoint.md`).
  Sylwetka = skala kości w zakresach, nie nowe ciało.
- **Kosmetyka nigdy nie daje statystyk.** Sylwetka nie zmienia udźwigu,
  fryzura nie zmienia niczego. (Także warunek uczciwej monetyzacji — §8.)

## 4. Sylwetki — propozycja v1

Gracz wybiera z **5 sylwetek** (preset kotwic `PROPORCJE` → skale kości)
+ suwak **wzrostu** w wąskim zakresie (±5%). Wszystkie mieszczą ten sam
pancerz, bo pancerz jest skinowany do tych samych kości.

| # | sylwetka | czyta się jako | kotwice (kierunek) |
|---|---|---|---|
| S1 | **smukła** | młody, zwinny | barki −, klatka −, ramię −, udo − |
| S2 | **przeciętna** | baza (dzisiejsza V3) | — |
| S3 | **barczysta** | wojownik | barki ++, klatka +, ramię ++, szyja + |
| S4 | **krępa** | chłopak od roboty w polu | wzrost −, talia +, udo +, kark + |
| S5 | **wysoka, żylasta** | myśliwy | wzrost +, kończyny +, klatka − |

**Tylko dla NPC (v1):** **tęga** (brzuch — karczmarz, sołtys) i **stara**
(przygarbienie, wysunięta głowa — Kuba, Sulisław). Wymagają kształtu
(shape key), więc każdy pancerz musiałby mieć jego odpowiednik — dlatego
na razie wyłącznie NPC-e, którzy nie zmieniają ubrania.

⚠ **Bramka sylwetki:** każda sylwetka × każdy pancerz z katalogu bez
przenikania (przyrządy z `tools/CLAUDE.md`: odległość od bryły liczona
wzorem, samokontrola PASS/FAIL).

## 5. Fryzury — propozycja v1 (8)

Wczesnośredniowieczne, prawdopodobne we wsi; **każda ma odróżnialną
sylwetkę z kamery gry** (test: podgląd 60 px, zestawienie obok siebie).

| # | fryzura | sylwetka z kamery | pod hełmem |
|---|---|---|---|
| F1 | krótko przycięte | gładka czaszka | chowa się |
| F2 | **na garnek** (pod miskę) — typowa słowiańska | równa „czapka" włosów | chowa się |
| F3 | półdługie za uszy | szersza głowa | chowa się |
| F4 | długie związane rzemieniem (kitka) | kitka za głową | **kitka wystaje** |
| F5 | długie rozpuszczone | włosy na ramionach | końce wystają |
| F6 | ogolona / krótki jeż | najmniejsza głowa | chowa się |
| F7 | warkocz z tyłu | warkocz na plecach | **warkocz wystaje** |
| F8 | rozczochrane, kręcone | nieregularna objętość | chowa się |

⚠ Każda fryzura deklaruje zachowanie **pod hełmem** (chowa / wystaje
fragment) — jak w WoW. Bez tego hełm przebija włosy albo „czyta się jak
fryzura" (uwaga autora z 2026-10-03, `postac3d_checkpoint.md`).

**Zarost (5):** brak · meszek (18-latek) · krótka broda · wąsy ·
długa broda *(NPC — starsi)*.

**Kolory włosów/zarostu (8):** lniany · jasny blond · rudy · kasztanowy ·
ciemny brąz · czarny · *siwy, szpakowaty (NPC; dla gracza — do decyzji)*.

**Skóra (5 tonów):** zakres do ustalenia (`OI-166`, D2) — lore wskazuje
jaśniejsze karnacje regionu, produkt na rynek globalny przemawia za
szerszą paletą. Decyzja autora, nie domyślna.

## 6. Model danych (zasady, nie kod)

- **Wygląd** = mały obiekt identyfikatorów: `{ sylwetka, wzrost, fryzura,
  kolorWlosow, zarost, skora }` (+ później `oczy`, `twarz`).
- **Katalog opcji** w `GameConfig` (id, nazwa, asset, flagi: `tylkoNpc`,
  `odblokowanie`) — nowa fryzura to **wiersz w katalogu + siatka**, zero
  zmian w kodzie. To jest warunek, żeby kosmetyka mogła kiedyś rosnąć
  (darmowe aktualizacje, nagrody, ewentualnie płatne — §8).
- **Zapis:** pole `wyglad` **opcjonalne**, bez podbijania `SAVE_VERSION`
  (stary zapis = wygląd domyślny). Nieznane id opcji (usunięta fryzura)
  → wartość domyślna, nigdy błąd.
- **NPC:** `NpcDef.wyglad` — preset. Portret i model biorą się z niego.
- **Runtime, nie wypiekanie:** skale kości i kolory nakłada silnik
  (`Character3D`); fryzury/zarost to osobne siatki w jednym `.glb`,
  przełączane widocznością. Generator (`char3d_base.py`) eksportuje
  zakresy, nie warianty.

## 7. Etapy

1. **Teraz (tanie):** ten dokument + rozstrzygnięcia D1–D5 (§9).
2. **Przy akceptacji bazy (`OI-134`):** sprawdzić, że kotwice `PROPORCJE`
   dają się sterować z silnika (skala kości), i że pancerz idzie za nimi.
3. **Fabryka NPC:** presety wyglądu dla obsady → modele 3D zastępują
   pixel-art (pierwsi: karczmarz Bogusz i czeladnik Adrian — dziś bez
   portretów).
4. **Ekran kreatora przy „Nowej grze":** obracany podgląd 3D, kategorie,
   „Losuj", przełącznik **z pancerzem / bez** i **widok z gry**.
5. **Zmiana wyglądu w grze:** cyrulik/fryzjer we wsi (jak barber w WoW) —
   naturalny NPC i naturalne miejsce na nowe opcje.
6. **Z portretami renderowanymi z 3D:** oczy, twarz, blizny.

## 8. Produkt i monetyzacja — konsekwencje dla kreatora

- Kreator to **ekran o największej dźwigni na pierwsze wrażenie** — warto
  w niego zainwestować jakość ponad resztę UI.
- Jeśli model biznesowy (`OI-167`) przewiduje kosmetykę: pipeline z §6
  (opcje jako dane, flaga `odblokowanie`) jest gotowy bez przebudowy.
  ⛔ **Nigdy statystyki za pieniądze** — §3.
- Jeśli premium (jednorazowy zakup): te same dane służą darmowym
  aktualizacjom i nagrodom w grze (fryzura za zadanie, kolor z rzadkiego
  barwnika) — **opcje odblokowywane w świecie** budują przywiązanie.

## 9. Decyzje autora (otwarte)

| # | pytanie | od czego zależy |
|---|---|---|
| D1 | ✅ **zostaje syn** (2026-10-09); płeć wraca z co-op (`OI-168`) | — |
| D2 | zakres tonów skóry | lore vs rynek globalny |
| D3 | czy gracz nadaje imię (dziś nikt go nie wymawia) | dialogi |
| D4 | czy część opcji jest odblokowywana w grze | `OI-167` |
| D5 | lista sylwetek i fryzur (§4–5) — akceptacja / zmiany | — |

## 10. Co-op ze znajomymi (kiedyś) — co to zmienia już dziś

Autor (2026-10-09): bohater kampanii zostaje synem, ale **może dojść tryb
co-op dla znajomych**, a z nim wybór płci (`OI-168`). Nic z tego nie jest do
zrobienia teraz; poniżej to, co jest **tanie dziś, a drogie później**:

| obszar | przygotowanie teraz | dlaczego |
|---|---|---|
| **ciało** | drugi typ ciała (kobiecy) = ten sam szkielet i nazwy kości, osobna siatka bazowa | bez tego każdy pancerz trzeba by robić od nowa |
| **pancerz 3D** | generatory pancerza **sterowane kotwicami ciała**, nie wymiarami wpisanymi na sztywno — drugi typ ciała to przebieg generatora, nie remodel | WoW: 2 typy ciała × cały ekwipunek |
| **katalog wyglądu** | opcje z polem „dla typu ciała" (fryzury w większości wspólne) | dodanie kobiecych opcji = wiersze katalogu |
| **zapis** | ⚠⚠ **oddzielić POSTAĆ (wygląd, poziom, ekwipunek, biegłość) od ŚWIATA (zadania, mapy, zabite elity)** — dziś jeden slot trzyma wszystko | w co-op postać gościa przychodzi do świata gospodarza i z niego wraca; to najdroższa konsekwencja, jeśli odłożyć ją do końca |
| **dialogi** | nic teraz; kiedyś warianty form („wróciłeś/wróciłaś") dla kwestii do GOŚCI — gospodarz zostaje synem | kampania nie zmienia narracji |
| **walka** | już przygotowana: czyste resolvery bez Phasera „pod przyszłe authority" (`src/core/CLAUDE.md`) | serwer/host musi liczyć to samo co klient |

⛔ Co-op **nie jest** dziś zadaniem implementacyjnym — to kierunek, który
ma wpływać na decyzje architektury (zapis, ciało, pancerz), zanim zrobią się
drogie.
