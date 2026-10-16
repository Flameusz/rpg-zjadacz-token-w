---
typ: KANON
domena: [world, creatures]
tytul: Kolonia pająków w Gęstwinie — zamiar autora i jego granice
stan: zywy
otwarte: [OI-172]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# Kolonia pająków w Gęstwinie — zamiar autora i jego granice

> **Czym jest ten plik.** Zapis kierunku, który autor wypracował w rozmowach
> z ChatGPT (wrzesień–październik 2026) i przekazał 2026-10-11. **Nic z tego
> poza dwoma pająkami nie istnieje w grze.** Plik rozdziela trzy rzeczy, które
> łatwo pomylić: **(A) co jest w grze**, **(Z) zamiar autora**, **(P) moje
> propozycje** — te ostatnie nie są kanonem, dopóki autor ich nie przyjmie.
>
> Nadrzędny jest `swiat.md` §1 (kręgosłup) i §4 (pająki, Gęstwina). Przy
> sprzeczności wygrywa tamten plik, a ten trzeba poprawić.

---

## 1. Trzy poziomy — nie mieszać

Z materiału autora najważniejsze jest rozróżnienie, a nie lista stworów:

| poziom | co | gdzie |
|---|---|---|
| **człowiek w lesie** | drwale, wyręby, węglarze, wozy | las użytkowy, skraj puszczy (`swiat.md` Drwale, `audyt_zagaje_swiat_2026-10-09.md` W1) |
| **dzika przyroda** | wilki, dziki, niedźwiedź, pierwsze pająki | las, wschodnia gęstwina |
| **kolonia** | zorganizowana, ale **dzika i niedorozwinięta** populacja pająków | leże za Gęstwiną (matecznik / puszcza — autor 2026-10-12); Gęstwina to przedpole |
| *(kiedyś)* **rasa** | pajęczy humanoidzi z własną gospodarką | **daleko na południu**, nie w rozdziale 1 — §5 |

## 2. Co jest w grze (A)

- **Sieciarz** i **skoczek jadowity** — w lesie, wschodnia gęstwina, rozstawieni
  „jeden osobno, para głębiej” (`swiat.md` §4, `docs/systemy/creatures.md`).
  Modele 3D w rosterze (`OI-161`).
- **Mapa Gęstwiny** (`thicket-gestwina.tmj`, 64×64) — **celowo pusta**: trakt
  się urywa, las ciemnieje, woda stoi. ⛔ „Kto zechce tę mapę rozbudować — niech
  nie zaczyna od wyjaśnienia” (`swiat.md` §4).
- Leża, jaskini, robotnic, obrońcy ani królowej **nie ma** — ani w kodzie, ani
  w dokumentach przed tym plikiem.

## 3. Zamiar autora (Z)

**Leże kolonii**: jaskinia-gniazdo, wokół pajęczyny, ślady
działalności. ⭐ **Miejsce przesunięte (autor 2026-10-12):** leże stoi **za
lasem gospodarczym, za Gęstwiną — „może matecznik albo puszcza”**, czyli na
mapie, której jeszcze nie ma, a nie w samej Gęstwinie. Gęstwina jest
**przedpolem**: pierwsza fala pokazuje tam pajęczyny-granicę, więcej
sieciarzy i skoczków, ciszę i znikającą zwierzynę (§4 pkt 2). Nazwa i kształt
mapy leża — otwarte. **Zwierzyna jest wciągana do środka** — widać, że to nie kilka
pająków rozrzuconych po lesie, tylko ekosystem.

Kolonia zorganizowana **jak mrowisko** — role, nie gatunki do odstrzału:

| rola | stan | zamiar |
|---|---|---|
| **sieciarz** | ✅ jest | sieci przygotowują teren; pajęczyny mogą **wyznaczać granicę** kolonii, utrudniać ruch i zdradzać gniazdo |
| **skoczek jadowity** | ✅ jest | mobilny, atakuje skokiem |
| **robotnica** | ⏳ pomysł | najczęstsza, „codzienność” kolonii |
| **obrońca (pseudoptasznik)** | ⏳ pomysł | duży, ciężki — czytelnie inny niż szybki skoczek |
| **królowa** | ⏳ pomysł | serce kolonii, cel zejścia w głąb gniazda |

⚠ Kolonia jest **dziką, niedorozwiniętą** wersją pająków (słowa autora). Bez
narzędzi, mowy i kultury.

## 4. Gdzie to się styka z kanonem — rzeczy do pilnowania (P)

1. ✅ **Kolonia jest WYPCHNIĘTA — decyzja autora 2026-10-11.** Osiadła
   w Gęstwinie, bo uciekła spod „warsztatu”, tak samo jak wilki. To szczebel,
   nie szczyt: **prawdziwym zmartwieniem jest nekromanta** (`swiat.md` §1,
   „Szczyt jest znany autorowi”). Zgodne z regułą „bliżej źródła pusto, dalej
   tłoczno” — tłok w Gęstwinie jest **objawem**. ⚠ Dla gracza kolonia może
   przez chwilę **wyglądać** na źródło (tak działa każdy szczebel), ale ⛔ żaden
   tekst nie może tego **potwierdzić**.
2. **Ciała to DRUGA fala.** Zwierzyna wciągana do jaskini to ścierwo, a
   `swiat.md` §1 „Kolejność odsłaniania” zabrania w pierwszej fali ciał, odoru
   i rozkładu. W pierwszej fali kolonia zostawia tylko **pajęczyny, ciszę
   i znikające zwierzęta**; leże z ofiarami — **po powrocie z miasta**.
3. **Gęstwina dalej niczego nie tłumaczy.** Kolonia się **pokazuje** (ślady,
   zachowanie), nikt jej nie objaśnia. Mieszkańcy mówią, CO widzą, nigdy
   DLACZEGO (reguła Ciechana, `swiat.md` Drwale).
4. **Nie zamykać drogi do rasy (§5).** Żaden NPC ani tekst nie mówi jako
   faktu „pająki to zwykłe zwierzęta, zawsze były”. Zarazem ⛔ **nic
   w rozdziale 1 nie sugeruje inteligencji** — żadnych narzędzi, ołtarzy,
   upraw w jaskini.
5. **Mechanika ról** — przy projektowaniu robotnicy, obrońcy i królowej
   najpierw sprawdzić, co dają istniejące hooki `Enemy` i `Creature3D`
   (`src/entities/CLAUDE.md`), zanim powstanie cokolwiek nowego. Ten plik nie
   projektuje liczb ani zachowań.

## 5. Daleka przyszłość — pajęcza rasa (Z, odłożone)

Autor (2026-10-11): **humanoidalna rasa pająków, coś w rodzaju nerubian
z WoW**, **daleko na południu**, **nie wcześniej niż za ok. pół roku**, gdy
świat się rozrośnie. Wątki z rozmów autora: **hodowla grzybów, uprawy
w jaskiniach, podstawowa metalurgia**, własna gospodarka szersza niż
polowanie i rozmnażanie.

⛔ **Nie projektować teraz** — ani rasy, ani podziemnej mapy, ani haków
w kodzie „na zapas”. Jedyne, co obowiązuje już dziś, to §4 pkt 4.
⚠ Związek dzikiej kolonii z rasą (przodek? zdziczała gałąź? daleki krewny?)
**nie jest rozstrzygnięty** i nie musi być przed jej etapem.
Wpis odroczenia: `docs/odlozone.md` §3.

## 6. Poza zakresem tego pliku

- **Geografia regionu** (las użytkowy, obóz węglarzy, wejście do jaskini,
  ewentualna mapa podziemna) — materiał autora zakłada m.in. obóz węglarzy
  „na południowym skraju głębokiego lasu”, z palisadą i wieżą; audyt
  2026-10-09 (W1) proponuje „za lasem, przy trakcie do miasta”. To osobna
  decyzja geograficzna, nie część kolonii.
- **Lore Lechtii** — osobny dokument `KANON`, zanim wejdzie do dialogów.

## Otwarte

- `OI-172` — ✅ miejsce w kręgosłupie rozstrzygnięte (wypchnięta, 2026-10-11);
  ✅ **miejsce leża: za lasem gospodarczym i Gęstwiną** (matecznik albo
  puszcza — autor 2026-10-12), więc w pierwszej fali gracz go nie widzi;
  Gęstwina dostaje znaki (§3). ⏳ zostaje: kształt i nazwa mapy leża oraz
  fala, w której gracz do niej dociera.
