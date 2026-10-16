---
typ: DECYZJA
domena: assets
tytul: Postać powstaje z modelu 3D, nie z rysowanego arkusza
stan: zywy
moc: ACTIVE
data: 2026-09-08
kotwice:
  - src/render3d/Character3D.ts
  - src/scenes/GameScene.ts
  - src/entities/Player.ts
  - src/core/PlayerSilhouette.ts
  - tools/char3d_export_gltf.py
  - tools/char3d_weapons.py
  - tools/char3d_armor.py
  - tools/build_char3d.py
otwarte: [OI-3D-3, OI-3D-4]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-19
---

# Postać z modelu 3D

## Co zostało rozstrzygnięte

**Źródłem docelowej postaci gracza jest model 3D (`char.blend`), nie rysowany
arkusz pikseli.** Decyzja autora po obejrzeniu modelu w działającej grze.

⚠ **Powodem jest RUCH, nie wygląd.** Zgłoszenie brzmiało: „nie wygląda jeszcze
idealnie, ale jeśli chodzi o animacje ruchu jest o niebo lepiej". Statyczna
klatka z modelu nie bije dziś ręcznego pixel-artu — bije go dopiero animacja
i to ona rozstrzygnęła.

## Czego ta decyzja NIE rozstrzyga

⛔ **Nie mówi, że gra renderuje 3D w locie.** Model 3D jako ŹRÓDŁO i model 3D
jako RENDERER to dwie różne decyzje. Ta druga została rozstrzygnięta dzień
później — patrz „Domknięcie" na końcu.

⛔ **Nie mówi nic o przeciwnikach.** Zmierzony koszt dotyczy jednej postaci;
siedmiu wrogów to inne pytanie (`OI-3D-3`).

⚠ **Na dzień decyzji (2026-09-08) `Character.png` był nadal domyślną postacią.**
Przestał nią być **2026-09-09** — patrz „Domknięcie" na końcu.

## Dlaczego ruch wygrywa z arkuszem

Arkusz kwantuje animację do liczby wyrenderowanych klatek. Cykl chodu z
`char.blend` ma **trzy pozy**, więc w 2D wchodzi jako sztywne `[0,1,2,1]`;
w 3D te same trzy pozy są interpolowane i płynność nie zależy od liczby klatek.
Do tego dochodzą przejścia (bezruch → chód → cios), które w arkuszu zawsze
skaczą, oraz **ciągły zwrot postaci** zamiast zaokrąglenia do czterech wierszy.

## Co zostało zmierzone przed decyzją

| rzecz | wynik |
|---|---|
| koszt mostu 3D → tekstura Phasera | p50 **0,5 ms**, p99 0,8 ms na klatkę na postać (bufor 128×256, desktop) |
| wpływ na FPS | żaden mierzalny — gra chodzi z zapasem (p99 ≈ 10 ms przy budżecie 10 ms) |
| `char.glb` | 666 KB, 13,8 tys. wierzchołków po Subdivision |
| pełna regeneracja arkusza (wariant pre-render) | 5,6 s |
| czytelność sprite'a z modelu | klatka 24×60 za mała (ramię 2–3 px zjadane przez kontur); od ~38×96 sylwetka się czyta |

⚠ **Średnie FPS na desktopie NIE jest miarą tej decyzji.** Po włączeniu 3D
licznik klatek nie drgnął — i to jest fałszywy sygnał „nic nie kosztuje".
Kosztu szuka się w czasie mostu, bo to on skaluje się na telefon.

## Odrzucone: drugi canvas nad grą

⛔ **Wariant „three.js rysuje na własnym canvasie nad Phaserem" jest odrzucony
i nie należy do niego wracać bez nowego argumentu.** Świat rysuje się przez
jedną warstwę `Y_SORTED_WORLD`, w której pnie drzew, dekoracje „do przejścia
za" i wszystkie encje przeplatają się co klatkę przez `setDepth(DEPTH.entities + y)`
(94 miejsca w `src/`). Postać na osobnym canvasie jest wobec tej warstwy
PŁASKA: albo zawsze nad światem, albo zawsze pod nim — **czyli nigdy nie
wejdzie za drzewo**. Istnieje na to osobny moduł (`core/PlayerSilhouette.ts`),
więc problem jest realny, nie teoretyczny.

Przyjęty wariant: three.js renderuje do własnego, offscreenowego canvasa,
a Phaser dostaje z niego zwykłą teksturę i rysuje ją jako `Image` **wpięty do
tej samej warstwy Y-sortowanej**. Sprawdzone w grze w obie strony: postać
chowa się za koroną jabłoni i zasłania jej pień.

## Co ta decyzja odblokowuje

**Widoczny ekwipunek.** Gra ma 11 broni, 4 materiały pancerza i 10 slotów —
w arkuszu każdy zestaw to osobny render wszystkich kierunków i klatek, czyli
kombinatoryka nie do zrobienia. W 3D pancerz jest kopią fragmentu ciała
dziedziczącą te same wagi kości (porusza się z animacją bez riggingu), a broń
wisi w gnieździe kości dłoni. W grze to jeden `visible` na węźle.

Zbudowane i obejrzane: dwa warianty pancerza (przeszywanica, kolczuga) i
dziewięć broni z `GameConfig`, każda pod swoim `id`.

## Otwarte

| id | co |
|---|---|
| `OI-3D-3` | **czy przeciwnicy też**. Koszt zmierzony dla jednej postaci; roster to siedem gatunków. |
| `OI-3D-4` | **chwyt oburęczny W MARSZU**. Garda i cios mają już własne klipy z obiema dłońmi na drzewcu (`Attack_2H`, `Walk_Armed_2H`, pilnuje ich `tools/char3d_sprawdz_bron.py`), ale w chodzie wolna ręka nadal balansuje jak przy pustych dłoniach. |

Długi świadome, nie do naprawy przy okazji: model nie ma twarzy ani kształtu
fryzury (linia włosów to proste cięcie po wysokości czaszki).

⚠ **Ten akapit opisuje stan z 2026-09-08 i przestał być prawdziwy 2026-09-19.**
Ciało i głowa są od tej daty GENEROWANE (`tools/char3d_base.py`), mają twarz,
uszy i włosy jako geometrię. ⛔ **Ta decyzja nie rozstrzyga jednak, jak baza ma
WYGLĄDAĆ** — bieżąca wersja (V3) jest robocza i **niezaakceptowana**.
Stan, wersje i plan: `docs/postac3d_checkpoint.md`.

## Pułapki tego pliku źródłowego

Cztery rzeczy w `char.blend` wyglądają inaczej, niż się wydaje, i każda
kosztowała jeden błędny render. Pełny opis: `public/assets/README.md`,
sekcja o `char.blend`. W skrócie: akcja `Walk` to 3 pozy + wkluczowany obrót
obiektu o −90°, `Solidify` to inverted-hull outline z `material_offset`,
`diffuse_color` nie trafia do glTF (liczy się `Base Color` w Principled),
a maski stref nie wolno zmniejszać interpolacją.


---

## Domknięcie — 2026-09-09

**Model 3D jest domyślną postacią gracza.** Tworzy go `GameScene.create()`,
`Player` gasi wtedy swój sprite (`setVisualOverride`). Decyzja autora:
„gracz już może być docelowo postacią 3D, będziemy go dopracowywać".

Zamknięte tym samym dwie pozycje:

- **`OI-3D-1` — pre-render vs renderowanie w locie → RENDEROWANIE W LOCIE.**
  Pre-render kwantuje animację do liczby klatek i skacze na przejściach, czyli
  gubi dokładnie to, co rozstrzygnęło samą decyzję.
- **`OI-3D-2` — skala postaci → LICZONA Z SPRITE'A, nie wpisana.** Obawa
  o „1,6× wyższą postać" nie zmaterializowała się: dotyczyła CZYTELNOŚCI
  pre-renderowanego pixel-artu (twarda alfa, kontur, kwantyzacja), a renderowanie
  w locie żadnego z tych kroków nie robi. Skala obrazka wynika z
  `player.displayHeight` (60 px) i ze ZMIERZONEGO udziału postaci w kadrze
  (81%), więc zmiana `PLAYER.scale` pociągnie model sama.

### Co trzeba było zrobić poza samym przełączeniem

⚠ **`PlayerSilhouette` gasi się na `!player.visible`** — a sprite 2D jest teraz
właśnie niewidoczny. Bez zmiany źródła obrys zza drzewa **zniknąłby po cichu**,
czyli wróciłby problem, dla którego ten moduł powstał. Kopiuje więc teraz
obrazek modelu (`char3d-live`), nie klatkę sprite'a.

⚠ **Miecz 2D musi gasnąć.** `Player` rysuje broń jako osobny `Image`; przy
broni trzymanej przez model wisiałaby obok druga, płaska.

⚠ **Renderer three.js MUSI ginąć razem ze sceną.** Portale restartują
`GameScene`, a każdy model to własny kontekst WebGL — przeglądarka daje ich
kilkanaście na kartę, więc bez sprzątania kilka przejść portalem wyczerpuje
pulę i gubi kontekst CAŁEJ gry, nie tylko modelu.

### Cena, zmierzona

| co | ile |
|---|---|
| bundle produkcyjny | 1 999 KB → **2 632 KB** (+633 KB, three.js przestał być importem dynamicznym pod strażą `DEV`) |
| bufor renderu | 192×256 → **96×128** (postać wyświetlana na 60 px, więc większy bufor był nadpróbkowaniem bez zysku) |

⚠ **Koszt mostu w ms/klatkę NIE został zmierzony po tej zmianie.** Panel
przeglądarki w tej sesji nie miał fokusu, więc `requestAnimationFrame` chodziło
**1,3 Hz** i każdy odczyt percentyli byłby zmyśleniem. Liczba do zdobycia na
telefonie: `dev.char3d.koszt()`.

### Ścieżka awaryjna zostaje

Gdy `char.glb` się nie wczyta, `GameScene` **zostaje przy `Character.png`** i gra
działa dalej — ten sam niezmiennik, co przy brakującym PNG czy dźwięku.
`dev.char3d.off()` zdejmuje model na żywo, do porównania jednego z drugim.
