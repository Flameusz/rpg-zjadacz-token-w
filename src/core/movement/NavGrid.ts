/**
 * Reprezentacja przestrzeni pod PRZYSZŁY `PathSolver` (A*).
 *
 * ⚠ **Budowana od razu, czytana dopiero później — i to jest decyzja autora
 * z 2026-08-28, nie zapas na wszelki wypadek.** Powód: przy bandytach,
 * strażnikach i mieście wracanie do `TiledMap` po to, żeby dopiero wtedy
 * zaprojektować całą reprezentację przestrzeni, byłoby drugą przebudową tego
 * samego. Koszt dziś: jedno przejście przy wczytaniu mapy i ~134 KB pamięci
 * dla docelowego lasu 140×60.
 *
 * ## Dwie rzeczy, które MUSZĄ być tak, a nie inaczej
 *
 * ⚠ **1. Siatka niesie PRZEŚWIT, nie „wolne/zajęte".** Każda komórka mówi,
 * **jak szerokie ciało się przez nią przeciśnie**. Bez tego A* dołożony za pół
 * roku poprowadziłby dzika (ciało 22 px) przez bramę 18 px — czyli
 * **odtworzyłby dzisiejszy błąd piętro wyżej**, tylko po dłuższej trasie.
 * Zapytanie brzmi „trasa dla ciała szerokiego na `w`", nigdy „trasa".
 *
 * ⚠ **2. Rozdzielczość jest PODKAFLOWA (8 px).** Zmierzone na żywej mapie
 * lasu: wszystkie bramy między pniami mają 18 px albo 33 px — czyli mieszkają
 * WEWNĄTRZ kafla 32 px. Siatka nawigacyjna w kaflach fizycznie nie umie ich
 * wyrazić; byłaby mapą, na której 52 przejścia w ogóle nie istnieją.
 *
 * Plik jest czysty — żadnego Phasera. Dostaje prostokąty kolizji i wymiary
 * mapy, oddaje tablicę liczb.
 */

/** Bok komórki nawigacyjnej w pikselach świata. Patrz punkt 2 w nagłówku. */
export const NAV_CELL = 8;

/** Prostokąt kolizji w pikselach świata — dokładnie to, co trafia do `solids`. */
export interface NavBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Siatka prześwitu. `clearance[i]` to **najszersze ciało (w px), które mieści
 * się wyśrodkowane w tej komórce** — 0 znaczy „w tej komórce stoi przeszkoda".
 */
export class NavGrid {
  readonly cols: number;
  readonly rows: number;
  /** Prześwit w PIKSELACH, nasycony na 255 (dalej i tak nikogo to nie ogranicza). */
  readonly clearance: Uint8Array;

  private constructor(cols: number, rows: number, clearance: Uint8Array) {
    this.cols = cols;
    this.rows = rows;
    this.clearance = clearance;
  }

  /**
   * Zbuduj siatkę z prostokątów kolizji mapy.
   *
   * Prześwit liczony jest transformatą odległości (chamfer 3-4, dwa przebiegi)
   * od komórek zajętych: odległość do najbliższej przeszkody × 2 = najszersze
   * ciało, które się tu zmieści. To przybliżenie — chamfer myli się o kilka
   * procent wobec metryki euklidesowej — i **tak ma zostać**: siatka odpowiada
   * na „czy w ogóle tędy", a ostatni odcinek i tak poprowadzi sterowanie
   * lokalne, które pyta silnik o prawdziwe ciało.
   */
  static build(boxes: readonly NavBox[], widthPx: number, heightPx: number): NavGrid {
    const cols = Math.ceil(widthPx / NAV_CELL);
    const rows = Math.ceil(heightPx / NAV_CELL);
    const n = cols * rows;

    // Odległość w jednostkach chamfera (3 = bok, 4 = skos). INF wystarczy
    // większe niż jakakolwiek osiągalna suma.
    const INF = 0x3fff;
    const dist = new Int32Array(n).fill(INF);

    for (const b of boxes) {
      const c0 = Math.max(0, Math.floor(b.x / NAV_CELL));
      const c1 = Math.min(cols - 1, Math.floor((b.x + b.w - 0.0001) / NAV_CELL));
      const r0 = Math.max(0, Math.floor(b.y / NAV_CELL));
      const r1 = Math.min(rows - 1, Math.floor((b.y + b.h - 0.0001) / NAV_CELL));
      for (let r = r0; r <= r1; r++) {
        const base = r * cols;
        for (let c = c0; c <= c1; c++) dist[base + c] = 0;
      }
    }

    // Krawędź świata liczy się jak przeszkoda — inaczej trasa przy brzegu mapy
    // dostawałaby nieskończony prześwit i A* prowadziłby tuż przy ścianie.
    for (let c = 0; c < cols; c++) {
      dist[c] = Math.min(dist[c], 3);
      dist[(rows - 1) * cols + c] = Math.min(dist[(rows - 1) * cols + c], 3);
    }
    for (let r = 0; r < rows; r++) {
      dist[r * cols] = Math.min(dist[r * cols], 3);
      dist[r * cols + cols - 1] = Math.min(dist[r * cols + cols - 1], 3);
    }

    // Przebieg w przód (lewy-górny → prawy-dolny).
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        let d = dist[i];
        if (d === 0) continue;
        if (r > 0) {
          d = Math.min(d, dist[i - cols] + 3);
          if (c > 0) d = Math.min(d, dist[i - cols - 1] + 4);
          if (c < cols - 1) d = Math.min(d, dist[i - cols + 1] + 4);
        }
        if (c > 0) d = Math.min(d, dist[i - 1] + 3);
        dist[i] = d;
      }
    }
    // Przebieg wstecz.
    for (let r = rows - 1; r >= 0; r--) {
      for (let c = cols - 1; c >= 0; c--) {
        const i = r * cols + c;
        let d = dist[i];
        if (d === 0) continue;
        if (r < rows - 1) {
          d = Math.min(d, dist[i + cols] + 3);
          if (c > 0) d = Math.min(d, dist[i + cols - 1] + 4);
          if (c < cols - 1) d = Math.min(d, dist[i + cols + 1] + 4);
        }
        if (c < cols - 1) d = Math.min(d, dist[i + 1] + 3);
        dist[i] = d;
      }
    }

    const clearance = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      if (dist[i] === 0) {
        clearance[i] = 0;
        continue;
      }
      // chamfer: 3 jednostki = 1 komórka = NAV_CELL px. Odległość do
      // przeszkody w px, razy dwa (ciało jest wyśrodkowane).
      const px = (dist[i] / 3) * NAV_CELL * 2;
      clearance[i] = px > 255 ? 255 : Math.round(px);
    }

    return new NavGrid(cols, rows, clearance);
  }

  /** Prześwit (px) w punkcie świata. Poza mapą: 0. */
  clearanceAt(x: number, y: number): number {
    const c = Math.floor(x / NAV_CELL);
    const r = Math.floor(y / NAV_CELL);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return 0;
    return this.clearance[r * this.cols + c];
  }

  /**
   * Czy ciało szerokie na `bodyW` przeciśnie się przez ten punkt.
   *
   * ⚠ To jest jedyne miejsce, w którym „niedźwiedź się nie mieści" jest
   * wyrażalne **bez `if (bear)`** — jego trasy po prostu nie mają węzłów
   * o prześwicie mniejszym niż 30 px.
   */
  passable(x: number, y: number, bodyW: number): boolean {
    return this.clearanceAt(x, y) >= bodyW;
  }

  /**
   * Czy odcinek A→B ma CIĄGŁY prześwit ≥ `bodyW` na całej długości.
   *
   * Próbkuje co `NAV_CELL` px — ta sama rozdzielczość co reszta siatki, więc
   * nie ma sensu próbkować gęściej. Używane w dwóch miejscach, które NIE mogą
   * dostać osobnej implementacji kolizji (`src/world/CLAUDE.md`: „nie buduj
   * drugiego systemu"): `PathSolver` (czy skrót między dwoma punktami trasy
   * jest bezpieczny, zamiast trzymać się siatki komórka-po-komórce) i
   * line-of-sight sieciarza (czy pocisk doleci bez trafienia w pień).
   *
   * ⚠ **To pytanie o TEREN, nie o istoty** — tak samo jak `passable`, sprawdza
   * wyłącznie ciała statyczne zapisane w tej siatce. Ruchome przeszkody
   * (drugi wróg na torze) tego nie widzą, i to jest świadomie ta sama granica,
   * którą ma `MovementContext.isFree`.
   */
  hasClearLine(ax: number, ay: number, bx: number, by: number, bodyW: number): boolean {
    return this.firstBlockedOn(ax, ay, bx, by, bodyW) === null;
  }

  /**
   * Najbliższy punkt, w którym ciało `bodyW` się mieści, szukany pierścieniami
   * co `NAV_CELL` do `maxR` px — albo `null`, gdy w promieniu nie ma żadnego.
   *
   * ⚠ Siatka bezpieczeństwa dla pozycji Z ZAPISU, nie narzędzie ruchu: zapis
   * trzyma surowe współrzędne, a mapa potrafi się zmienić pod spodem (rozstaw
   * lasu ×1,5 z 2026-10-04 — stara pozycja wypada w innym miejscu, czasem
   * w pniu albo w wodzie).
   */
  nearestPassable(x: number, y: number, bodyW: number, maxR: number): { x: number; y: number } | null {
    if (this.passable(x, y, bodyW)) return { x, y };
    for (let r = NAV_CELL; r <= maxR; r += NAV_CELL) {
      const n = Math.max(8, Math.round((2 * Math.PI * r) / NAV_CELL));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        if (this.passable(px, py, bodyW)) return { x: px, y: py };
      }
    }
    return null;
  }

  /**
   * **Pierwszy punkt na odcinku A→B, w którym ciało `bodyW` już się nie
   * mieści** — albo `null`, gdy cała droga jest wolna.
   *
   * ⚠ **To jest `hasClearLine` z odpowiedzią GDZIE, a nie druga implementacja
   * kolizji.** Tamta metoda deleguje tutaj i próbkowanie zostaje w jednym
   * miejscu — dokładnie z tego powodu, dla którego `navBoxes` i `solids`
   * powstają w jednym przebiegu po mapie (`src/world/CLAUDE.md`: „nie buduj
   * drugiego systemu"). Kopia pętli po stronie wołającego rozjechałaby się
   * przy pierwszej zmianie `NAV_CELL`.
   *
   * ⚠ **Odpowiedź ma rozdzielczość `NAV_CELL` (8 px)** i mówi „tor jest
   * PRZECIĘTY", a **nie** „ciało zatrzyma się dokładnie tutaj": Arcade
   * rozsuwa i ślizga ciało po przeszkodzie, więc bieg potrafi obsunąć się
   * bokiem i mimo wszystko dojechać. Podgląd Szarży korzysta z tego świadomie
   * w tym słabszym znaczeniu (decyzja autora, 2026-09-04).
   *
   * ⚠ **Pyta o TEREN, nie o istoty ani rekwizyty** — ta sama granica, co
   * `passable` i `hasClearLine`. Studnia, ognisko i NPC mają własne collidery
   * i tej siatki nie widzą.
   */
  firstBlockedOn(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    bodyW: number,
  ): { x: number; y: number } | null {
    const dist = Math.hypot(bx - ax, by - ay);
    const steps = Math.max(1, Math.ceil(dist / NAV_CELL));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      if (!this.passable(x, y, bodyW)) return { x, y };
    }
    return null;
  }
}
