---
typ: DECYZJA
domena: [weapons, items, proces]
tytul: Katalog broni zamknięty na 37 — zakres przed balansem
stan: zywy
moc: ACTIVE
data: 2026-09-18
kotwice:
  - GameConfig.ITEMS
  - tools/katalog_ekwipunku.mjs
  - src/core/Equipment.ts
otwarte: [OI-108, OI-112, OI-114, OI-115, OI-116, OI-117, OI-118, OI-119]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-18
---

# Katalog broni zamknięty na 37 — zakres przed balansem

> **Co ta decyzja rozstrzyga.** Że rozszerzanie katalogu broni jest **zakończone
> na 37 konstrukcjach** i że to jest **zatwierdzony baseline**, a nie stan
> przejściowy. Oraz kolejność dalszej pracy: **najpierw zakres, potem pomiar,
> potem balans.**

---

## 1. Roster ZAMKNIĘTY

Katalog liczy **37 konstrukcji** i na tym etapie **nie rośnie**.

⛔ **Liczebności i wartości czyta się z `docs/ekwipunek_przedmioty.md`**
(generator: `tools/katalog_ekwipunku.mjs`), nigdy stąd. Ta decyzja mówi, że
roster jest zamknięty — nie powtarza jego zawartości.

⚠ **Nie otwierać ponownie nazw z tej puli.** Przebieg dojścia do 37 (dwie
partie 21 → 30 → 32 i domknięcie 32 → 37) opisuje `docs/dziennik.md`
2026-09-18 (2) oraz decyzje `2026-09-17-katalog-broni-warstwy-spoleczne.md`
i `2026-09-17-drabinka-mieczy-i-chwyt.md`. ⛔ Nie odtwarzaj tamtych analiz.

Dwa rozstrzygnięcia z ostatniej partii, które łatwo cofnąć przez nieuwagę:

- ⭐ **Kij (`stick`) należy do rodziny `blunt`.** Broń improwizowana ma rodzinę
  jak każda inna. ⛔ Nie dopisywać dla niego wyjątku w `WeaponProficiency`.
- ⭐ **Kilof wyszedł z katalogu broni** (`OI-115`) — wraca jako przedmiot
  UŻYTKOWY razem z systemem narzędzi, nie wcześniej.

---

## 2. Model przedmiotu zostaje bez zmian

Pięć warstw, bez nowych pól i bez nowych rodzin:

```
Construction → Material → Quality → Variant → ItemInstance
```

- **Construction** — fizyczne właściwości konstrukcji.
- **Material** — gatunek (`WEAPON_MATERIAL`: żelazo / stal).
- **Quality** — jakość wykonania (`QUALITY`, 7 poziomów).
- **Variant** — ⚠ dla broni dziś **pusty**; oś obsługuje wyłącznie tarcze.
- **ItemInstance** — konkretny egzemplarz (jakość, trwałość).

⭐ **`family` jest ADRESEM, nie balansem** — jedynym połączeniem broni
z `WeaponProficiency` i rangami Mastery. ⛔ Nie tworzyć nowych rodzin.

⭐ **`AttackVariant` i `minReach` istnieją i są wystarczające** do wyrażenia
zamierzonych broni. Katalog urósł z 11 do 37 konstrukcji **bez ani jednego
rozgałęzienia po `id` w `src/`** — i to jest miara, po której ten model uznano
za wystarczający.

---

## 3. ⚠⚠ Brak globalnego balansu jest STANEM, nie długiem

Roster **nie przeszedł globalnego balansu** i **na tym etapie nie ma przejść**.
Liczby są pierwszym podejściem; niezmienniki pilnują relacji, nie wartości.

⛔ **Nie zgłaszać tego jako usterki.** ⛔ Nie „poprawiać przy okazji"
pojedynczych broni, których liczba wygląda nie na miejscu.

---

## 4. ⭐⭐ Zasada robocza: NAJPIERW ZAKRES → POTEM POMIAR → POTEM BALANS

```
   ZAKRES   →   POMIAR   →   BALANS
   co w ogóle    jak się      ile ma
   istnieje      zachowuje    wynosić
```

Czego ta kolejność zakazuje na obecnym etapie:

- ⛔ **dodawania mechanik po to, żeby przedmioty były „ciekawsze"** — nowa
  mechanika wchodzi, gdy bez niej czegoś nie da się wyrazić, nie gdy byłoby
  z nią atrakcyjniej;
- ⛔ **sztucznego wykorzystywania istniejących pól** — pole z zerem
  użytkowników zostaje puste, dopóki nie znajdzie właściciela z powodu
  projektowego (zasada audytu: *brak konsumenta ≠ martwy kod*);
- ⛔ **globalnego balansu przed domknięciem szerszej itemizacji** — przestrajanie
  37 broni przed pancerzem, tarczami i resztą sprzętu trzeba by powtórzyć;
- ⛔ **rozwiązywania hipotetycznych problemów bez danych z rozgrywki** — hipoteza
  bez pomiaru jest wpisem do backlogu, nie zadaniem.

⚠ **To nie jest zakaz myślenia o mechanikach.** Jest zakazem **wdrażania ich**
przed pomiarem. Hipotezy mają swoje miejsce: `docs/zadania.md` (numer)
i `docs/odlozone.md` (powód i warunek powrotu).

---

## Czego ta decyzja NIE rozstrzyga

- **Żadnej liczby.** Balans jest świadomie odłożony, nie odrzucony.
- **Czy katalog kiedykolwiek urośnie.** Zamknięty jest ETAP, nie temat.
  Otwarte pozycje zawartości: `OI-108` (jednoręczna drzewcowa), `OI-112`
  (chwyt 1H/2H), `OI-114` (ikona wideł), `OI-115` (kilof jako narzędzie).
- **Hipotez zaparkowanych dziś:** `OI-116` (rozdzielenie `attackCooldown`
  i `swingDurationMs`), `OI-117` (tożsamość buzdyganu), `OI-118` (warstwa 3D
  a `swingDurationMs`), `OI-119` (`minReach` jako możliwa podstawa jakości
  trafienia). ⛔ Żadna z nich nie jest tą decyzją przesądzona.
