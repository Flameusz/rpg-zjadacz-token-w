import Phaser from "phaser";
import { HUD_LAYOUT, MAP_BY_ID } from "../config/GameConfig";
import { UI, fontPx, textStyle } from "../core/theme";
import { GameEvents, EVENT } from "../core/EventBus";
import { Exploration } from "../core/Exploration";
import { Skills } from "../core/Skills";
import { WorldState } from "../core/WorldState";
import { fogTexture } from "./MapFog";
import { mapQuestIcon, mapQuestMark } from "./MapQuestMarks";
import { minimapRect } from "./ControlLayout";
import { PARCHMENT, parchmentLayout, type PRect } from "./MapParchment";

/** Jeden obraz obszaru w warstwie minimapy, w jednostkach WYŚWIETLANIA. */
interface Piece {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * ⭐ Minimapa HUD-u — i zarazem WEJŚCIE DO MAPY (od 2026-10-12; od 2026-10-11
 * do tej daty otwierała panel gracza — patrz `HUD_LAYOUT.minimap`). Tapnięcie
 * otwiera zakładkę MAPA panelu. Wejściem do reszty panelu jest `MenuButton`.
 * Geometria w `ControlLayout.minimapRect`, liczby w `HUD_LAYOUT.minimap`.
 *
 * Pokazuje WYCINEK wokół gracza: strzałka stoi w środku, mapa jedzie pod nią.
 * Kamera świata się nie obraca, więc północ jest zawsze u góry.
 *
 * ⚠ **Otwarty świat = JEDNA minimapa sklejona z obrazów obszarów** (wieś, las),
 * każdy w swoim miejscu z `WorldState.regions`. Minimapa per obszar
 * przeskakiwałaby na szwie dokładnie wtedy, gdy gracz na nią patrzy.
 *
 * ⚠ **Wycinek robi `setCrop`, nie maska.** Obrazy stoją w warstwie
 * nieruchomo, przesuwa się cała warstwa, a każdy obraz przycina się do okna.
 * Bez maski nie ma ani bufora szablonu, ani pułapki „maska żyje w przestrzeni
 * ekranu" (`src/ui/CLAUDE.md`). Kropki NPC przycinają się widocznością.
 *
 * ⚠ **Koszt klatki: praca tylko przy ZMIANIE.** Okno przesuwa się, gdy pozycja
 * gracza w jednostkach minimapy zmieni się o całą jednostkę; strzałka obraca
 * się przy zmianie zwrotu. Przy zapauzowanym świecie (otwarty panel) `update`
 * nie robi nic.
 *
 * Bez tekstury minimapy (mapa bez PNG, nieudane wczytanie) zostaje kartka
 * z napisem „MAPA" — tapnięcie dalej otwiera zakładkę, która sama mówi
 * „Mapa niedostępna".
 *
 * ⭐ **Oprawa = kartka PERGAMINU** (2026-10-13, D15 — `MapParchment.ts`):
 * obrzeże z konturem i nacięciami, cień, czysty pergamin pod rysunkiem tam,
 * gdzie mapy nie ma. ⚠ Rysunek mapy żyje w OKNIE (`content`, 92 j.), nie
 * w całym kwadracie — pole dotyku zostaje kwadratem `size`.
 *
 * ⭐ **Kartografia II odblokowuje minimapę** (2026-10-14, decyzja autora):
 * bez niej róg jest PUSTY — ani kartki, ani pola dotyku (mapę otwiera wtedy
 * zakładka Mapa w panelu). Rysunek idzie z tekstury MGŁY (`MapFog`):
 * nieodkryty teren to czysty pergamin, kropki mieszkańców tylko na odkrytym.
 */
export class Minimap {
  private readonly root: Phaser.GameObjects.Container;
  private readonly layer: Phaser.GameObjects.Container;
  private readonly arrow: Phaser.GameObjects.Graphics;
  private readonly fallbackLabel: Phaser.GameObjects.Text;
  private readonly hit: Phaser.GameObjects.Rectangle;
  private readonly size = HUD_LAYOUT.minimap.size;
  /** Okno rysunku mapy w kwadracie — środek obrzeża kartki. */
  private readonly win: PRect;

  private pieces: Piece[] = [];
  /** Kropka mieszkańca + gdzie stoi w swoim obszarze (mgła pyta o obszar). */
  private npcDots: { dot: Phaser.GameObjects.Arc; x: number; y: number; region: string; lx: number; ly: number }[] = [];
  /** ⭐ Cele zadań (`MapQuestMarks`): ikona zamiast kropki, widoczna też we mgle. */
  private questIcons: { img: Phaser.GameObjects.Image; npcId: string; x: number; y: number }[] = [];
  /** Czy gracz zna Kartografię II — ostatnio ZASTOSOWANE. */
  private unlocked = false;
  /** Jednostki wyświetlania na piksel świata. 0 = nic do narysowania. */
  private f = 0;
  /** Dla czego zbudowano obrazy — tożsamość tablic, bo GameScene podmienia je
   *  w każdym `create()`, więc porównanie referencji jest dokładne i tanie. */
  private builtMap = "";
  private builtW = -1;
  private builtRegions: unknown = null;
  private builtNpcs: unknown = null;
  /** Ostatnio ZASTOSOWANE okno i zwrot — `NaN` = jeszcze nie malowano. */
  private paintedCx = NaN;
  private paintedCy = NaN;
  private paintedHeading = NaN;
  /** Palec, który wcisnął minimapę — akcja odpala się na jego PUSZCZENIU. */
  private pressedId: number | null = null;

  constructor(private readonly scene: Phaser.Scene, private readonly onTap: () => void) {
    const s = this.size;
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);
    const kartka = parchmentLayout(s, HUD_LAYOUT.minimap.frame);
    this.win = kartka.content;
    const w = this.win;
    // Rysowane RAZ: kartka nie zmienia się z ruchem gracza.
    const sheet = scene.add.graphics();
    sheet.fillStyle(PARCHMENT.shadow, PARCHMENT.shadowAlpha);
    for (const r of kartka.silhouette) sheet.fillRect(r.x + kartka.shadow.dx, r.y + kartka.shadow.dy, r.w, r.h);
    for (const r of kartka.rects) sheet.fillStyle(PARCHMENT[r.tone], 1).fillRect(r.x, r.y, r.w, r.h);
    // Czysty pergamin pod rysunkiem — tam, gdzie obraz obszaru nie sięga
    // (i przyszła „mgła”: nieodwiedzone = pusta kartka, `docs/pomysly.md`).
    sheet.fillStyle(PARCHMENT.paper, 1).fillRect(w.x, w.y, w.w, w.h);
    this.layer = scene.add.container(0, 0);

    // Strzałka narysowana grotem do GÓRY; obrót liczy `update` ze zwrotu.
    this.arrow = scene.add.graphics({ x: w.x + w.w / 2, y: w.y + w.h / 2 });
    this.arrow.fillStyle(0xffffff, 1).lineStyle(2, 0x000000, 0.9);
    this.arrow.beginPath();
    this.arrow.moveTo(0, -8).lineTo(6, 6).lineTo(0, 3).lineTo(-6, 6).closePath();
    this.arrow.fillPath().strokePath();

    this.fallbackLabel = scene.add
      .text(w.x + w.w / 2, w.y + w.h / 2, "MAPA", textStyle({ fontSize: fontPx("small"), color: "#5e4630", fontStyle: "bold" }))
      .setOrigin(0.5);

    // ⚠ `fillAlpha` 0, nie `alpha` 0 — obiekt z zerową alfą wypada z testu
    // trafienia (patrz `ControlLayout.hitCircle`). Bok ≥ `minTouch`.
    this.hit = scene.add.rectangle(0, 0, s, s, 0x000000, 0).setOrigin(0).setInteractive({ useHandCursor: true });
    this.hit.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.pressedId = p.id;
    });

    this.root.add([sheet, this.layer, this.arrow, this.fallbackLabel, this.hit]);
    this.setFallback(true);
    this.reposition();

    this.applyUnlock();
    GameEvents.on(EVENT.skillsChanged, this.applyUnlock, this);
    GameEvents.on(EVENT.explorationChanged, this.onExplored, this);
    GameEvents.on(EVENT.questsChanged, this.refreshQuestIcons, this);
    GameEvents.on(EVENT.trackedQuestChanged, this.refreshQuestIcons, this);

    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUpOutside, this);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.reposition, this);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
      scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUpOutside, this);
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.reposition, this);
      scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
      GameEvents.off(EVENT.skillsChanged, this.applyUnlock, this);
      GameEvents.off(EVENT.explorationChanged, this.onExplored, this);
      GameEvents.off(EVENT.questsChanged, this.refreshQuestIcons, this);
      GameEvents.off(EVENT.trackedQuestChanged, this.refreshQuestIcons, this);
    });
  }

  /** Kartografia II: pokaż albo schowaj całą minimapę razem z polem dotyku. */
  private applyUnlock(): void {
    const on = Skills.has("cartography_2");
    if (on === this.unlocked && this.root.visible === on) return;
    this.unlocked = on;
    this.root.setVisible(on);
    // Schowany kontener nie zawsze chroni dziecko przed testem trafienia —
    // wejście wyłączane wprost.
    if (on) this.hit.setInteractive({ useHandCursor: true });
    else this.hit.disableInteractive();
    this.pressedId = null;
    this.paintedCx = this.paintedCy = NaN;
  }

  /** Odkrył się teren — kropki mieszkańców mogły wyjść z mgły. Rysunek mapy
   *  odświeża się sam (tekstura `MapFog`); tu tylko wymuszenie okna. */
  private onExplored(): void {
    this.paintedCx = NaN;
  }

  /**
   * ⚠ **Akcja na PUSZCZENIU, nie na wciśnięciu** (`src/ui/CLAUDE.md`). Panel
   * otwierany na `DOWN` dostawałby `UP` tego samego palca — a w prawym górnym
   * rogu panelu leżą zakładki i karta przedmiotu.
   *
   * Test trafienia na puszczeniu, bo palec mógł zjechać z minimapy (wtedy to
   * nie było tapnięcie). Słuchacz SCENY, nie obiektu — `GAMEOBJECT_POINTER_UP`
   * nie przychodzi, gdy palec puszcza się obok.
   */
  private onPointerUp(p: Phaser.Input.Pointer): void {
    if (p.id !== this.pressedId) return;
    this.pressedId = null;
    if (this.scene.input.hitTestPointer(p).includes(this.hit)) this.onTap();
  }

  private onPointerUpOutside(p: Phaser.Input.Pointer): void {
    if (p.id === this.pressedId) this.pressedId = null;
  }

  private reposition(): void {
    const r = minimapRect(this.scene);
    // Całkowita pozycja: obrazy pixel-art przesunięte o ułamek jednostki
    // migotałyby pod NEAREST przy każdym kroku okna.
    this.root.setPosition(Math.round(r.x), Math.round(r.y));
  }

  /** Brak obrazu → zostaje ramka z napisem „MAPA". */
  private setFallback(on: boolean): void {
    this.layer.setVisible(!on);
    this.arrow.setVisible(!on);
    this.fallbackLabel.setVisible(on);
  }

  /** (Prze)buduj obrazy i kropki dla bieżącej mapy. */
  private build(): void {
    this.builtMap = WorldState.mapId;
    this.builtW = WorldState.widthPx;
    this.builtRegions = WorldState.regions;
    this.builtNpcs = WorldState.npcs;
    for (const p of this.pieces) p.img.destroy();
    for (const d of this.npcDots) d.dot.destroy();
    for (const q of this.questIcons) q.img.destroy();
    this.pieces = [];
    this.npcDots = [];
    this.questIcons = [];
    this.f = 0;
    this.paintedCx = this.paintedCy = NaN;

    const sources = WorldState.regions.length
      ? WorldState.regions
      : [{ id: WorldState.mapId, x: 0, y: 0, w: WorldState.widthPx, h: WorldState.heightPx }];
    const zoom = HUD_LAYOUT.minimap.zoom;
    let pxPerWorld = 0;
    for (const src of sources) {
      const base = MAP_BY_ID[src.id]?.minimapKey;
      if (!base || !this.scene.textures.exists(base) || src.w <= 0) continue;
      const key = fogTexture(this.scene, src.id);
      if (!key) continue;
      const texW = (this.scene.textures.get(key).getSourceImage() as { width: number }).width;
      const own = texW / src.w;
      if (!pxPerWorld) pxPerWorld = own;
      else if (import.meta.env.DEV && Math.abs(own - pxPerWorld) > 1e-6) {
        // Obrazy obszarów o różnej gęstości rozjechałyby się na szwie.
        console.warn(`[minimapa] „${key}” ma ${own} px/px świata, poprzednie ${pxPerWorld} — szew się rozjedzie`);
      }
      this.f = zoom * pxPerWorld;
      const img = this.scene.add.image(src.x * this.f, src.y * this.f, key).setOrigin(0).setScale(zoom);
      this.layer.add(img);
      this.pieces.push({ img, x: src.x * this.f, y: src.y * this.f, w: src.w * this.f, h: src.h * this.f });
    }
    if (!this.pieces.length) {
      this.setFallback(true);
      return;
    }
    this.setFallback(false);

    // NPC-e stoją w miejscu (snapshot z `create()`), więc kropka ma stałą
    // pozycję w warstwie i jedzie razem z nią; okno rusza tylko widoczność.
    for (const n of WorldState.npcs) {
      const x = n.x * this.f;
      const y = n.y * this.f;
      const reg = sources.find((r) => n.x >= r.x && n.y >= r.y && n.x < r.x + r.w && n.y < r.y + r.h);
      if (!reg) continue;
      const dot = this.scene.add.circle(x, y, 2.5, UI.goldNum, 1).setStrokeStyle(1, 0x000000, 0.8);
      this.layer.add(dot);
      this.npcDots.push({ dot, x, y, region: reg.id, lx: n.x - reg.x, ly: n.y - reg.y });
    }
    this.refreshQuestIcons();
  }

  /** Ikony celów zadań — przebudowa przy zmianie zadań albo śledzonego. Tanie:
   *  najwyżej kilka ikon, a zdarzenia lecą rzadko. */
  private refreshQuestIcons(): void {
    for (const q of this.questIcons) q.img.destroy();
    this.questIcons = [];
    if (!this.f) return;
    for (const n of WorldState.npcs) {
      const mark = mapQuestMark(n.id);
      if (!mark) continue;
      const x = n.x * this.f;
      const y = n.y * this.f;
      const img = mapQuestIcon(this.scene, mark, x, y + 4, 14);
      this.layer.add(img);
      this.questIcons.push({ img, npcId: n.id, x, y });
    }
    this.paintedCx = NaN;
  }

  private update(): void {
    if (!this.unlocked || WorldState.widthPx <= 0) return;
    if (
      WorldState.mapId !== this.builtMap ||
      WorldState.widthPx !== this.builtW ||
      WorldState.regions !== this.builtRegions ||
      WorldState.npcs !== this.builtNpcs
    ) this.build();
    if (!this.f) return;

    const cx = Math.round(WorldState.playerX * this.f);
    const cy = Math.round(WorldState.playerY * this.f);
    if (cx !== this.paintedCx || cy !== this.paintedCy) {
      this.paintedCx = cx;
      this.paintedCy = cy;
      this.paintWindow(cx - this.win.w / 2, cy - this.win.h / 2);
    }

    const h = WorldState.playerHeading;
    if (!(Math.abs(h - this.paintedHeading) < 0.02)) {
      this.paintedHeading = h;
      this.arrow.setRotation(h + Math.PI / 2);
    }
  }

  /** Okno `[x0, x0+w) × [y0, y0+h)` w jednostkach warstwy, rysowane w `win`. */
  private paintWindow(x0: number, y0: number): void {
    const s = this.win.w;
    this.layer.setPosition(this.win.x - x0, this.win.y - y0);
    for (const p of this.pieces) {
      const ix0 = Math.max(x0, p.x);
      const iy0 = Math.max(y0, p.y);
      const ix1 = Math.min(x0 + s, p.x + p.w);
      const iy1 = Math.min(y0 + s, p.y + p.h);
      if (ix1 <= ix0 || iy1 <= iy0) {
        p.img.setVisible(false);
        continue;
      }
      // Przycięcie w pikselach TEKSTURY. Przy `zoom` 1/4, 1/2 albo całkowitym
      // i obszarach na siatce kafli wychodzi w liczbach całkowitych.
      const k = p.img.scaleX;
      p.img
        .setVisible(true)
        .setCrop((ix0 - p.x) / k, (iy0 - p.y) / k, (ix1 - ix0) / k, (iy1 - iy0) / k);
    }
    const m = 3; // kropka przy samej krawędzi wystawałaby na obrzeże kartki
    const marked = new Set(this.questIcons.map((q) => `${q.x},${q.y}`));
    for (const q of this.questIcons) {
      q.img.setVisible(q.x >= x0 + m && q.x < x0 + s - m && q.y - 10 >= y0 && q.y < y0 + s - m);
    }
    for (const d of this.npcDots) {
      d.dot.setVisible(
        !marked.has(`${d.x},${d.y}`) &&
        d.x >= x0 + m && d.x < x0 + s - m && d.y >= y0 + m && d.y < y0 + s - m &&
        Exploration.isRevealed(d.region, d.lx, d.ly),
      );
    }
  }
}
