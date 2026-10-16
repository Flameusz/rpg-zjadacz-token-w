---
typ: OPERACYJNE
domena: world
tytul: Zlecenie dla zewnętrznych modeli — gospodarka i zabudowa Zagajów
stan: zywy
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-10
---

# Zlecenie zewnętrzne — gospodarka i zabudowa Zagajów

> **Czym jest ten plik.** Gotowy tekst do wklejenia innym modelom AI (autor:
> „mam kilka modeli, które mogą się zająć brudną robotą, a ty wdrożeniem").
> Jest SAMOWYSTARCZALNY — zewnętrzny model nie widzi repozytorium, więc
> wszystkie fakty są w środku. Odpowiedzi wracają do sesji z Claude, który
> je weryfikuje względem kanonu (`docs/wioska_plan.md`, `docs/swiat.md`,
> dialogi w `GameConfig.ts`) i wdraża krokami K1–K5
> (`docs/decyzje/2026-10-10-zagaje-droga-plac-krokowo.md`).
>
> ✅ Obsada rozstrzygnięta (sekcja na końcu) — tekst można wklejać.

---

## Tekst do wklejenia

```
Jesteś projektantem osad do gier RPG i znasz realia średniowiecznej wsi
słowiańskiej (gospodarka, zabudowa zagrody, układ pól, rzemiosło na wsi).
Pomóż mi zaplanować GOSPODARKĘ i ZABUDOWĘ jednej wsi w mojej grze. Nie
piszesz kodu ani grafiki — oddajesz plan w tabelach.

=== ŚWIAT I TON ===
Fikcyjna, średniowieczna wieś słowiańska bez konkretnego roku. Ton: ciepły
realizm z suchym humorem (bliżej wczesnego Fable niż grimdarku). Wieś mała
i biedna, pieniądz rzadki — wymiana w naturze i odrobkiem. Nad wsią jest
pan (danina zbierana przez sołtysa). Na południe od wsi las z wilkami,
na północ trakt do miasta (4 dni wozem). Bohater gracza to 18-letni syn
najbiedniejszego z rolników.

=== SKALA (ważne — nie projektuj jak dla realnej wsi) ===
- Mapa wsi: 128 × 128 kafli, kafel 32 px. Postać ma ~60–70 px wysokości,
  czyli kafel to ~0,5–1 m. Cała mapa to ok. 1 hektar.
- Kamera z góry pod kątem 40°, postać zajmuje ~13% wysokości ekranu
  telefonu. Budynki to modele 3D (chałupa ok. 6×7 kafli, stodoła większa).
- Pól NIE da się pokazać w realnej wielkości. Pola są SYNEKDOCHĄ: kilka
  zagonów na gospodarstwo, które sugerują resztę „za kadrem".
- Liczy się czytelność z góry: kto bogaty, kto biedny, gdzie praca,
  gdzie centrum — bez czytania dialogów.

=== ZASADY AUTORA (obowiązują, nie podważaj ich) ===
1. Jedna droga (trakt północ–południe) przez wieś, BEZ rozwidlenia.
   W centrum PLAC rozszerzający się po obu stronach drogi.
2. Bez stawu w centrum. Woda tylko z powodem: młynówka (potok z północy)
   ze stawem młyńskim i kołem. Funkcje dawnej sadzawki — moczenie lnu
   i gęsi — trzeba umieścić na skraju wsi.
3. Mniej budynków niż dziś (dziś 29 budynków i 50 odcinków płotu na
   7 zagród — za gęsto), ALE NIE PO RÓWNO: wielkość i liczba budynków
   zagrody ma wynikać z majątku i zajęcia domowników. Bogaty ma więcej
   i większe, biedny mniej i mniejsze. „Wielkość gospodarstwa czyta się
   z budynku."
4. Za podwórkiem ogród, za ogrodem pole. Z podwórka da się wyjść na
   swoje pole (przejście w płocie od tyłu).
5. Podwórka są PRZESTRONNE (wzór autora: ulicówka, w której się
   wychował): chałupy blisko drogi, szerokie podwórza obstawione budynkami,
   drzewa i sady przy domach, działki różnej szerokości, za każdą długi
   i wąski pas pola prostopadły do drogi, aż po horyzont.
6. Każdy ma skład drewna (sągi pod ścianą albo w szopie / stodole).
7. Kowal i młynarz mieszkają POZA płotami wsi. Kuźnia jako pierwsza
   obrywa przy napadzie bandytów.
8. Drwale i wyręb są w lesie; drwale mogą mieć chałupy we wsi.
9. Wieś rośnie KROKAMI: układ ma zostawiać miejsce na dokładanie,
   tak żeby później nie przesuwać połowy wsi.
10. Wieś ma płoty (plecionka, żerdzie), NIE palisadę — palisada to gród.
11. Stałe miejsca: karczma przy północnym wjeździe (od miasta) z
   chmielnikiem; kuźnia przy południowym wjeździe (od lasu); młyn nad
   młynówką; błonia (pastwisko, plac ćwiczeń) między wsią a lasem;
   zielarka na skraju przy lesie i łąkach (zioła rosną tam, gdzie mieszka);
   Myśliwy poza wsią, przy lesie (dlatego wilk dopadł jego).

=== MIESZKAŃCY I MAJĄTEK (kanon — dialogi w grze już to mówią) ===
Inwentarz całej wsi (docelowo): kury 22, owce 16 (9 pasterza + cudze),
świnie 5, gęsi 4–6, krowy 5, woły 2 (JEDNA para, tylko u sołtysa —
reszta wsi orze na pożyczonych i odrabia to dniówkami), konie 2
(młynarz — wóz; sołtys), kozy 2, ule 6, psy 5, koty dużo.

1. Marko (54) + Alina (49) + bohater (18) — NAJMNIEJSZY z rolniczych.
   Zagony „ledwo starczy", 1 krowa, 1 świnia, ~2 kury, ogród, drewutnia
   z pieńkiem i siekierą, chlewik, kurnik przystawiony do chałupy. Orze na
   pożyczonych wołach. Ojciec były żołnierz, chore biodro.
2. Dobek (41) + Hanna (38) + Wojtek (14) — NAJWIĘKSZE zboże we wsi,
   największa stodoła (widoczna z drogi), 1 krowa, 1 świnia, ~3 kury,
   2 owce, wóz, bróg. Zwozi najwięcej zboża do młyna. Hanna liczy sery.
3. Zofia (35, wdowa) + teść Sulisław (81, pół wzroku) + Janek (12) +
   Marysia (7) — bieda bez siły roboczej. 1 krowa (obora), 4–6 gęsi (pierze
   = jej dochód), ~2 kury, zagony; jej zagon najbliżej lasu, nie ma komu
   pilnować.
4. Witek (44) + Marta (40) + Kuba (66, ojciec Marty) + Staszek (16, służy
   u sołtysa za parobka) — biedniejszy. 2 świnie (najwięcej we wsi), ~2 kury,
   dużo lnu, bez krowy.
5. Dobiesław, sołtys (52) + Małgorzata (50) + Dobrawa (19) — NAJZAMOŻNIEJSZY.
   Jedyna para wołów, koń, 2 krowy (najwięcej), 3 owce, sad jabłoniowy
   (8 drzew, status), największa chałupa. Sam orze; urząd na doczepkę.
   Wierzyciel połowy wsi (odrobek za woły).
6. Radzim, kowal (46) + Agata (43) + Adrian (ok. 29, czeladnik, trzeci rok
   terminu; pilnuje też mielerza za rzeką) — kuźnia, 1 krowa, ~2 kury,
   1 owca, ogród. NIE MA ZIEMI ORNEJ (musi kupować zboże, bierze zapłatę
   w naturze). Robi lemiesze, podkowy, okucia, części młyna; broń rzadko.
7. Sobek, stolarz (38) + Barbara (36) — warsztat (kozioł, deski, beczki,
   obręcze), skład drewna, 1 krowa, ~2 kury, 1 owca. Wozy, koła, płoty,
   dachy, beczki, trumny.
8. Dorota, zielarka (61, wdowa) + Patryczek (~20, wnuk; ręka w łubkach
   po bójce w karczmie, uczy walki, ma plac ćwiczeń na błoniach) — chata
   na uboczu przy lesie, 2 kozy, ~2 kury, 6 uli, ogród ziołowy, suszarnia
   ziół, śliwy. Żyje z leczenia (jajka, mleko, gotówka za mikstury).
9. Gniewko, pasterz (33) + Elżbieta (31) + Jaśko (13) — chałupa
   i otwarta owczarnia przy ugorze, 9 owiec + wypasa cudze, 2 psy.
10. Miłosz, młynarz (47) + Agnieszka (44) + Mirek (18) + Sulko (15) — młyn
   wodny z kołem i jazem, koń i wóz, 1 świnia, ~2 kury. Bierze miarkę od
   każdego przemiału — jedyny z gotówką, podejrzewany o bogactwo.
11. Bogusz, karczmarz — karczma przy północnym wjeździe, warzy piwo
   z własnego chmielu i słodu od młynarza (w naturze: młynarz pije za pół
   ceny). Wozacy z miasta przyjeżdżają dwa razy w miesiącu, „piją, śpią
   w stodole, rano jadą dalej z mąką". Przy karczmie deska ogłoszeń. Bogusz mieszka w karczmie; mieszka u niego
   kuzynka Anna (niżej). Bogusz jest wdowcem; Anna gotuje (lepiej niż on),
   obsługuje gości i lżej sprząta, ale nie jest służącą — każe mu znaleźć
   sobie żonę.
12. Anna (dorosła, wysoka) — handlarka: skupuje to, co wieś ma za dużo
   (mąka, jajka, ser, len), raz w tygodniu, w dzień targowy, wozi wozem na
   targ do miasta (koń — „wieś się dogaduje": ktoś i tak wozi do miasta węgiel
   drzewny i drewno; często ktoś jej towarzyszy jako ochrona), wraca z monetą
   i solą; pod karczmą sprzedaje chleb, jaja, ser. Miejscowi bandyci jej nie
   ruszają — „koledzy" spod ciemnej gwiazdy poprosili. Jeździ od
   czterech lat. KUZYNKA Bogusza: zbuntowała się, że „nie będzie kurą
   domową" i nie da się wyswatać rodzicom z tym, kto więcej zaoferuje —
   sama na siebie zarabia. Mieszka u kuzyna przy karczmie. Rodzice żyją
   (matka wciąż jej dogaduje), mieszkają POZA Zagajami. Ma rudą sukę.
13. Wszebor, Myśliwy — poza wsią, przy lesie; ranny przez wilka.
   Skupuje skóry od bohatera.

Obieg wewnątrz wsi: młynarz miele (miarka mąki), kowal kuje (za zboże
albo odrobek), zielarka leczy (jajka, mleko); sołtys pożycza woły za
odrobek; karczma bierze słód od młyna; Anna wywozi nadwyżki do miasta.
Trójpolówka: trzy niwy (ozimina, jarzyna, ugór wypasany).

=== CO MASZ ODDAĆ ===
A. GOSPODARKA — tabela per gospodarstwo: domownicy, z czego żyje
   (proporcje), zwierzęta, ziemia (ile zagonów w każdej niwie albo „brak"),
   ogród (co rośnie), skład drewna, co sprzedaje / kupuje / odrabia i komu.
   Sprawdź, czy liczby się domykają (kto karmi kowala, skąd siano na zimę
   dla krów i wołów, czy 5 krów i para wołów wyżywi się z błoni i ugoru,
   ile drewna na zimę). Wskaż, co jest nierealne, i zaproponuj poprawkę.
B. PROGRAM ZABUDOWY — tabela per gospodarstwo: lista budynków z rodzajem
   (chałupa, stodoła, obora, chlew, kurnik, szopa/drewutnia, warsztat,
   owczarnia, spichlerz, studnia…), względną wielkością (S/M/L) i tym,
   co jest przybudówką, a co osobnym budynkiem. Ma być widać różnicę
   majątku. Uzasadnij jednym zdaniem każdą różnicę między sąsiadami.
C. UKŁAD PRZESTRZENNY — schemat w ASCII (1 znak ≈ 4 kafle, siatka
   32 × 32 znaki = mapa 128 × 128): trakt, plac, zagrody po obu stronach
   drogi (kto gdzie i dlaczego — sąsiedztwa, relacje, częstotliwość
   odwiedzin przez gracza), ogrody i pasy pól za zagrodami, karczma,
   kuźnia i młyn poza płotami, błonia, moczydło lnu i miejsce gęsi na
   skraju, chałupy drwali. Zostaw wyraźnie oznaczone MIEJSCE NA ROZWÓJ.
D. KOLEJNOŚĆ BUDOWY — 4–6 kroków od „minimum, które czyta się jak wieś"
   do pełnego planu, każdy krok bez przesuwania tego, co już stoi.
E. LISTA NIEPEWNOŚCI — gdzie zgadujesz, gdzie realia się różnią
   regionalnie, co powinien rozstrzygnąć autor.

Nie wymyślaj nowych mieszkańców ani nowych zawodów bez oznaczenia
„PROPOZYCJA". Nie zmieniaj faktów o postaciach z listy — są już w grze.
```

---

## Rozstrzygnięcia obsady (autor, 2026-10-10)

| kto | rozstrzygnięcie |
|---|---|
| **Anna** | **kuzynka Bogusza**, która się zbuntowała: „nie będzie kurą domową", nie da się wyswatać „z tym, kto więcej zaoferuje", sama na siebie zarobi. Mieszka u kuzyna przy karczmie. Zgodne z dialogiem (`ANNA.topics.slimaki` — żyjąca matka; `sama_sobie` — samodzielność). ⚙ Rodzice poza Zagajami — założenie sesji, nie słowa autora |
| **Bogusz** | mieszka w karczmie; przejezdni śpią W STODOLE przy karczmie (dialog `INNKEEPER.topics.przejezdni`) |
| **Patryczek** | ✅ wnuk zielarki (kanon w `GameConfig.ts`), mieszka u babki → obejście Doroty ma 2 osoby, nie 1 |
| **Adrian** | ✅ czeladnik kowala, w obejściu kowala (karta §5.5) |
