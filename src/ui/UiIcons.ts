import Phaser from "phaser";

/**
 * **Ikony interfejsu rysowane wektorowo** (2026-10-12) — zakładki panelu,
 * przycisk menu HUD-u, moneta, zamknięcie.
 *
 * ── Dlaczego `Graphics`, a nie PNG ─────────────────────────────────────────
 * Kamera nakładki powiększa ~1,86× na telefonie (`theme.uiScale`), więc
 * bitmapa 32×32 wyszłaby albo rozmyta (LINEAR), albo schodkowa w ułamkowej
 * skali (NEAREST). Kształt rysowany przez `Graphics` jest geometrią i zostaje
 * ostry przy KAŻDYM powiększeniu — tak jak kółka klastra bojowego. Ikony
 * PRZEDMIOTÓW zostają pixel-artem: to treść świata, a to jest oprawa.
 *
 * ── Kontrakt ───────────────────────────────────────────────────────────────
 * Każda ikona mieści się w kwadracie `size × size` o środku w (0,0) obiektu
 * `Graphics` i jest JEDNOBARWNA (`color`) — stan (czynna / nieczynna /
 * odmowa) niesie kolor wołającego, nie wariant rysunku. Wyjątkiem jest moneta:
 * jej kolor JEST treścią (miedź / srebro / złoto, `docs/odlozone.md`).
 *
 * ⚠ Czysta funkcja rysująca: nie tworzy obiektów, nie słucha zdarzeń. Widżet
 * trzyma swój `Graphics` i woła `drawUiIcon` przy zmianie stanu — ⛔ nie
 * w pętli klatkowej (`src/ui/CLAUDE.md`, „Koszt klatki").
 */
export type UiIconKind =
  | "character"
  | "bag"
  | "quests"
  | "map"
  | "options"
  | "close"
  // Rama rozmowy (etap C, 2026-10-13): zakładka „Rozmowa" i usługi NPC —
  // te same ikony w kolumnie rozmowy i w szynie (research §4.1).
  | "talk"
  | "trade"
  | "training"
  | "mastery"
  // Przełącznik warstw lalki (etap D): „to, co widać".
  | "eye";

/** Stopień monety. Dziś gra ma jeden (`gold`); trzy czekają na decyzję autora. */
export type CoinTier = "gold" | "silver" | "copper";

const COIN: Record<CoinTier, { face: number; rim: number; shine: number }> = {
  gold: { face: 0xf2c14e, rim: 0x9c6a12, shine: 0xfff3c4 },
  silver: { face: 0xd5dae2, rim: 0x7c8592, shine: 0xffffff },
  copper: { face: 0xd08a4f, rim: 0x84461c, shine: 0xffd2a8 },
};

/**
 * Narysuj ikonę `kind` w `g` (czyści `g`). `hole` to kolor tła pod ikoną —
 * potrzebny tam, gdzie rysunek ma „dziurę" (oś koła zębatego, kartka zwoju),
 * bo `Graphics` nie odejmuje kształtów.
 */
export function drawUiIcon(
  g: Phaser.GameObjects.Graphics,
  kind: UiIconKind,
  size: number,
  color: number,
  hole = 0x1c2030,
): Phaser.GameObjects.Graphics {
  const s = size;
  g.clear();
  switch (kind) {
    case "character": {
      // Popiersie: głowa + barki. Najczęstszy znak „postać/profil" w grach.
      g.fillStyle(color, 1);
      g.fillCircle(0, -s * 0.17, s * 0.19);
      g.fillRoundedRect(-s * 0.36, s * 0.07, s * 0.72, s * 0.36, { tl: s * 0.2, tr: s * 0.2, bl: s * 0.04, br: s * 0.04 });
      break;
    }
    case "bag": {
      // Plecak: zaokrąglona góra (nie kłódka, nie teczka — to ona odróżnia
      // plecak od skrzynki), ucho, klapa z klamrą i kieszeń z przodu.
      g.lineStyle(Math.max(2, s * 0.07), color, 1);
      g.beginPath();
      g.arc(0, -s * 0.3, s * 0.1, Math.PI, 0, false);
      g.strokePath();
      g.fillStyle(color, 1);
      g.fillRoundedRect(-s * 0.32, -s * 0.32, s * 0.64, s * 0.74, { tl: s * 0.26, tr: s * 0.26, bl: s * 0.08, br: s * 0.08 });
      g.lineStyle(Math.max(1.5, s * 0.055), hole, 1);
      g.lineBetween(-s * 0.32, -s * 0.06, s * 0.32, -s * 0.06);
      g.strokeRoundedRect(-s * 0.19, s * 0.1, s * 0.38, s * 0.22, s * 0.05);
      g.fillStyle(hole, 1);
      g.fillRect(-s * 0.06, -s * 0.1, s * 0.12, s * 0.1);
      break;
    }
    case "quests": {
      // Zwój: kartka między dwoma wałkami, trzy linijki pisma.
      g.fillStyle(color, 1);
      g.fillRoundedRect(-s * 0.36, -s * 0.42, s * 0.72, s * 0.14, s * 0.07);
      g.fillRoundedRect(-s * 0.36, s * 0.28, s * 0.72, s * 0.14, s * 0.07);
      g.fillRect(-s * 0.27, -s * 0.32, s * 0.54, s * 0.62);
      g.lineStyle(Math.max(1.5, s * 0.06), hole, 1);
      for (const y of [-0.16, 0, 0.16]) g.lineBetween(-s * 0.17, s * y, s * (y === 0.16 ? 0.06 : 0.17), s * y);
      break;
    }
    case "map": {
      // Mapa złożona w trzy, z kołkiem miejsca.
      const pts = [
        [-0.42, -0.3], [-0.14, -0.4], [0.14, -0.3], [0.42, -0.4],
        [0.42, 0.3], [0.14, 0.4], [-0.14, 0.3], [-0.42, 0.4],
      ].map(([x, y]) => new Phaser.Math.Vector2(x * s, y * s));
      g.fillStyle(color, 1);
      g.fillPoints(pts, true);
      g.lineStyle(Math.max(1.5, s * 0.05), hole, 0.9);
      g.lineBetween(-s * 0.14, -s * 0.4, -s * 0.14, s * 0.3);
      g.lineBetween(s * 0.14, -s * 0.3, s * 0.14, s * 0.4);
      g.fillStyle(hole, 1);
      g.fillCircle(s * 0.02, -s * 0.06, s * 0.1);
      g.fillTriangle(-s * 0.07, -s * 0.02, s * 0.11, -s * 0.02, s * 0.02, s * 0.14);
      break;
    }
    case "options": {
      // Koło zębate: osiem zębów, dziura w osi. Znak „ustawienia" w każdej grze.
      const teeth = 8;
      const rOut = s * 0.44;
      const rIn = s * 0.33;
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i < teeth * 2; i++) {
        const a0 = (i / (teeth * 2)) * Math.PI * 2;
        const r = i % 2 === 0 ? rOut : rIn;
        // Ząb to trapez: dwa punkty na obwodzie zewnętrznym lub wewnętrznym.
        pts.push(new Phaser.Math.Vector2(Math.cos(a0 - 0.12) * r, Math.sin(a0 - 0.12) * r));
        pts.push(new Phaser.Math.Vector2(Math.cos(a0 + 0.12) * r, Math.sin(a0 + 0.12) * r));
      }
      g.fillStyle(color, 1);
      g.fillPoints(pts, true);
      g.fillCircle(0, 0, rIn);
      g.fillStyle(hole, 1);
      g.fillCircle(0, 0, s * 0.14);
      break;
    }
    case "close": {
      const k = s * 0.3;
      g.lineStyle(Math.max(2.5, s * 0.11), color, 1);
      g.lineBetween(-k, -k, k, k);
      g.lineBetween(-k, k, k, -k);
      break;
    }
    case "talk": {
      // Dymek z ogonkiem i trzema kropkami — „rozmowa" w każdej grze.
      g.fillStyle(color, 1);
      g.fillRoundedRect(-s * 0.42, -s * 0.36, s * 0.84, s * 0.58, s * 0.16);
      g.fillTriangle(-s * 0.22, s * 0.18, -s * 0.02, s * 0.18, -s * 0.3, s * 0.42);
      g.fillStyle(hole, 1);
      for (const x of [-0.2, 0, 0.2]) g.fillCircle(s * x, -s * 0.07, s * 0.065);
      break;
    }
    case "trade": {
      // Sakwa kupca: worek zawiązany pod szyjką. Nie moneta — moneta znaczy
      // w tej grze SAKIEWKĘ (stan złota), a to jest usługa.
      g.fillStyle(color, 1);
      g.fillCircle(0, s * 0.12, s * 0.3);
      g.fillTriangle(-s * 0.2, -s * 0.12, s * 0.2, -s * 0.12, 0, s * 0.1);
      g.fillRoundedRect(-s * 0.14, -s * 0.3, s * 0.28, s * 0.16, s * 0.05);
      g.fillTriangle(-s * 0.24, -s * 0.42, -s * 0.06, -s * 0.28, -s * 0.16, -s * 0.24);
      g.fillTriangle(s * 0.24, -s * 0.42, s * 0.06, -s * 0.28, s * 0.16, -s * 0.24);
      g.lineStyle(Math.max(1.5, s * 0.06), hole, 1);
      g.lineBetween(-s * 0.15, -s * 0.15, s * 0.15, -s * 0.15);
      break;
    }
    case "training": {
      // Otwarta księga: dwie stronice przy grzbiecie, po dwie linijki pisma.
      g.fillStyle(color, 1);
      g.fillPoints([[-0.44, -0.28], [-0.04, -0.2], [-0.04, 0.36], [-0.44, 0.28]].map(([x, y]) => new Phaser.Math.Vector2(x * s, y * s)), true);
      g.fillPoints([[0.44, -0.28], [0.04, -0.2], [0.04, 0.36], [0.44, 0.28]].map(([x, y]) => new Phaser.Math.Vector2(x * s, y * s)), true);
      g.lineStyle(Math.max(1.5, s * 0.05), hole, 1);
      for (const y of [-0.06, 0.08]) {
        g.lineBetween(-s * 0.34, s * (y - 0.02), -s * 0.12, s * (y + 0.02));
        g.lineBetween(s * 0.34, s * (y - 0.02), s * 0.12, s * (y + 0.02));
      }
      break;
    }
    case "eye": {
      // Oko: migdał z tęczówką i źrenicą — „pokaż to, co widać na postaci".
      const w = s * 0.46;
      const h = s * 0.26;
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i <= 24; i++) {
        const t = (i / 24) * Math.PI;
        pts.push(new Phaser.Math.Vector2(-w * Math.cos(t), -h * Math.sin(t)));
      }
      for (let i = 1; i < 24; i++) {
        const t = (i / 24) * Math.PI;
        pts.push(new Phaser.Math.Vector2(w * Math.cos(t), h * Math.sin(t)));
      }
      g.fillStyle(color, 1);
      g.fillPoints(pts, true);
      g.fillStyle(hole, 1);
      g.fillCircle(0, 0, s * 0.16);
      g.fillStyle(color, 1);
      g.fillCircle(0, 0, s * 0.08);
      break;
    }
    case "mastery": {
      // Medal na dwóch wstążkach z gwiazdą — RANGA. ⚠ Nie skrzyżowane miecze:
      // w 28 j. czytały się jak ✕ i myliły z „Do widzenia" tuż pod spodem
      // (zrzut 1:1, 2026-10-13).
      const v = (pts: number[][]) => pts.map(([x, y]) => new Phaser.Math.Vector2(x * s, y * s));
      g.fillStyle(color, 1);
      g.fillPoints(v([[-0.3, -0.44], [-0.1, -0.44], [0.04, -0.08], [-0.16, -0.04]]), true);
      g.fillPoints(v([[0.3, -0.44], [0.1, -0.44], [-0.04, -0.08], [0.16, -0.04]]), true);
      g.fillCircle(0, s * 0.15, s * 0.28);
      const star: number[][] = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? 0.17 : 0.07;
        star.push([Math.cos(a) * r, 0.15 + Math.sin(a) * r]);
      }
      g.fillStyle(hole, 1);
      g.fillPoints(v(star), true);
      break;
    }
  }
  return g;
}

/**
 * Moneta o średnicy `size`: lico, obrzeże, wewnętrzny pierścień i odblask.
 * Kolor niesie stopień (`CoinTier`), nie stan — moneta nigdy nie „gaśnie".
 */
export function drawCoin(g: Phaser.GameObjects.Graphics, size: number, tier: CoinTier = "gold"): Phaser.GameObjects.Graphics {
  const c = COIN[tier];
  const r = size / 2;
  g.clear();
  g.fillStyle(c.rim, 1).fillCircle(0, 0, r);
  g.fillStyle(c.face, 1).fillCircle(0, 0, r * 0.8);
  g.lineStyle(Math.max(1, r * 0.1), c.rim, 0.75).strokeCircle(0, 0, r * 0.52);
  g.fillStyle(c.shine, 0.85).fillCircle(-r * 0.3, -r * 0.32, r * 0.16);
  return g;
}
