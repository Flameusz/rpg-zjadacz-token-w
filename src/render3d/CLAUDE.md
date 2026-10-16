# `src/render3d/` — obraz świata w 3D

Jak to działa: `docs/systemy/render3d.md` (`STAN`). Rig, proporcje i wygląd
postaci: `docs/postac3d_checkpoint.md`. Tu wyłącznie reguły, które łatwo
złamać przy edycji tych plików.

⚠ **Ten plik dochodzi automatycznie tylko przy `Read`/`Edit` na plikach z tego
katalogu.** Odczyt bashem niczego nie wstrzykuje.

---

## Rysuje, nie decyduje

- ⛔ **Nic z rozgrywki nie czyta stanu z three.js.** Ruch, kolizje, AI,
  walka, zasięgi i HUD liczą się w Phaserze, w pikselach 2D. Moduł 3D tylko
  kopiuje z hosta pozycję, alfę, tint i `stan3d()`. Jeśli nowa funkcja
  potrzebuje informacji z modelu (np. położenia dłoni), to jest decyzja
  architektoniczna, nie poprawka.
- ⚠ **Ścieżka 2D musi dalej działać** (`?widok2d`, brak `.glb`). Po zmianie
  w moście albo w `stan3d()` sprawdź oba widoki — niezmiennik „gra ZAWSZE
  się uruchamia" dotyczy też modeli.

## Renderery

- ⛔ **Nie twórz `WebGLRenderer` per postać i nie wołaj na nim `dispose()`.**
  Most ma JEDEN wspólny renderer (`Shared3D.wspolnyRenderer`), scena świata
  — jeden swój (`WorldView3D.plotno`). Kontekstów WebGL jest kilkanaście na
  kartę (na telefonie mniej); restart sceny przez portal tworzył kiedyś nowy
  kontekst za każdym razem.
- ⚠ **Kolejność „render → natychmiast kopia" jest warunkiem poprawności**
  (`renderujDo`): bufor nie jest zachowywany, następna postać go nadpisze.
- ⚠ **Płótno Phasera leży NAD płótnem świata** (`z-index` w konstruktorze
  `WorldView3D`). Na pulpicie nie widać różnicy; na telefonie HUD i drążek
  znikały pod światem.

## Host 2D, model 3D

- ⚠⚠ **Sprite hosta nie gaśnie przez `setVisible(false)`** — Phaser 3.90
  pomija niewidoczne obiekty w trafieniu wskaźnikiem, więc wroga nie dałoby
  się wybrać palcem. Gasi się puste `renderWebGL`/`renderCanvas` na tej jednej
  instancji (`Creature3D`).
- ⚠ **Materiały klonuj przy wejściu do świata** (`wSwiecie`) —
  `SkeletonUtils.clone` je dzieli, a tint telegrafu ma barwić jedno stworzenie.
  `onBeforeCompile` nie przechodzi przez `clone()`, więc dopiski shadera
  (krawędź, kontur) zakłada się PO klonowaniu.
- ⚠ **Tint mnoży kolor własny materiału**, nie zastępuje go (gracz ma barwy
  w materiałach, zwierzęta w kolorach wierzchołków) — `userData.kolor0`.
- ⚠ **Skalę świata ustala gracz** (`skalaSwiata`). Nie stroisz rozmiaru
  gatunku w kodzie — w konfigu modelu, względem tej skali.
- ⚠ `PlayerSilhouette` kopiuje obrazek MODELU (nie arkusza), a miecz 2D
  gracza musi być zgaszony, gdy model jest widoczny.

## Sprawdzanie

- ⚠ **Zrzut widoku 3D: `window.__widok3dObiekt.zrzut()`**, nie
  `game.renderer.snapshot()` — ten drugi łapie tylko płótno Phasera (HUD
  i pierścienie), bez świata. Bufor three.js trzeba skopiować w tym samym
  zadaniu co render.
- `dev.widok3d.kat(35|40|45)` / `.zoom(x)` / `.grunt()`, `dev.char3d.koszt`,
  `dev.perf.watch(15)` — koszt mierzy się na S21 FE, nie na pulpicie
  (pulpit ma zapas, który wszystko ukrywa).
- Patrz na render, nie na raport — `tools/CLAUDE.md`.
