import type Phaser from "phaser";
import { DEPTH, PLAYER_SILHOUETTE } from "../config/GameConfig";
import { occludersFor } from "./Occluders";

/**
 * **Obrys gracza, gdy świat go zasłoni.**
 *
 * Typowy problem widoku z góry: postać wchodzi pod koronę drzewa albo za dach,
 * sprite znika pod grafiką rysowaną na wierzchu, a gracz **traci orientację,
 * gdzie stoi** — mimo że nic w rozgrywce się nie zmieniło. Ten moduł rysuje
 * wtedy w miejscu postaci jej własną sylwetkę, nad zasłoną.
 *
 * ── Czym to JEST ──────────────────────────────────────────────────────────
 * ⚠ **Wyłącznie PREZENTACJA.** Nie dotyka ruchu, kolizji, geometrii walki ani
 * kolejności rysowania świata: żaden istniejący `setDepth` się nie zmienia,
 * a sam obrys jest jednym `Image` na własnym, NOWYM piętrze (`DEPTH.playerSilhouette`)
 * wstawionym MIĘDZY istniejące `overhead` i `aimPreview`. To jest ta sama para
 * ról co `CombatCues`/`CombatFx`: decyzja jest czysta (`Occluders.covers`),
 * a wykonanie phaserowe siedzi tutaj.
 *
 * ⛔ **To NIE jest stały outline wokół postaci.** Widać go **tylko** w klatkach,
 * w których coś naprawdę leży na graczu; wyjście zza drzewa gasi go w tej samej
 * klatce, bez tweenu i bez pamięci stanu.
 *
 * ── Dlaczego KLATKA GRACZA, a nie rysowany kształt ────────────────────────
 * ⚠ Obrys ma pokazywać **pozycję i kształt postaci**, a jedynym źródłem prawdy
 * o tym kształcie jest klatka, którą gracz właśnie odgrywa. Kopiujemy więc
 * teksturę i klatkę żywcem — dzięki temu sylwetka sama jedzie za animacją,
 * zwrotem i odbiciem, a **nowy arkusz postaci nie wymaga tu ani jednej linijki**.
 * Narysowany osobno owal rozjechałby się z postacią przy pierwszej zmianie
 * grafiki i nikt by tego nie zauważył.
 *
 * ⚠ **Broń w dłoni jest świadomie pomijana.** Obrys odpowiada na „gdzie jestem",
 * a nie „co trzymam"; druga sylwetka obok pierwszej czytałaby się jak dwie
 * postacie.
 */
export class PlayerSilhouette {
  private readonly img: Phaser.GameObjects.Image;
  private widoczny = false;
  /** Bufor zapytania — jeden obiekt na cały czas życia, zero alokacji na klatkę. */
  private readonly rect = { x: 0, y: 0, w: 0, h: 0 };

  constructor(scene: Phaser.Scene) {
    this.img = scene.add
      .image(0, 0, "__DEFAULT")
      .setDepth(DEPTH.playerSilhouette)
      .setTint(PLAYER_SILHOUETTE.tint)
      .setAlpha(PLAYER_SILHOUETTE.alpha)
      .setVisible(false);
    // ⛔ Celowo NIE trafia do `Y_SORTED_WORLD` ani do `RenderCuller`. Do
    // pierwszego, bo cała jego wartość polega na tym, że NIE sortuje się
    // z encjami; do drugiego, bo culler liczy `bounds` raz przy rejestracji
    // dla obiektów STATYCZNYCH, a ten chodzi razem z graczem.
    this.img.setScrollFactor(1);
  }

  /**
   * Skąd brać KSZTAŁT obrysu, gdy postać rysuje model 3D.
   *
   * ⚠ Bez tego obrys przestaje działać w chwili, gdy wchodzi model: `update`
   * gasi się na `!player.visible`, a sprite 2D jest wtedy właśnie niewidoczny.
   * Efektem byłaby cicha utrata całej tej funkcji — postać znikałaby pod koroną
   * drzewa dokładnie tak, jak przed powstaniem tego modułu.
   *
   * Źródłem jest wtedy obrazek, który NAPRAWDĘ rysuje postać, więc obrys dalej
   * sam jedzie za animacją i zwrotem — ta sama zasada, co przy klatce sprite'a.
   */
  private zrodlo: Phaser.GameObjects.Image | null = null;

  setSource(img: Phaser.GameObjects.Image | null): void {
    this.zrodlo = img;
  }

  /**
   * Jedna klatka. Woła się z `GameScene.update()`, po ruchu gracza.
   *
   * ⚠ **Cała decyzja mieści się w jednym pytaniu do rejestru zasłon** —
   * `covers(prostokąt sylwetki gracza)`. Nie ma tu żadnej pamięci, żadnego
   * czasu narastania i żadnego progu: stan wynika wyłącznie z bieżącej klatki,
   * więc nie da się go zostawić zapalonego po wyjściu zza drzewa.
   */
  update(player: Phaser.GameObjects.Sprite & { isDead?: boolean }, scene: Phaser.Scene): void {
    const zaslony = occludersFor(scene);
    // Rysowany kształt postaci: sprite 2D albo obrazek modelu 3D.
    const ksztalt: Phaser.GameObjects.Components.Transform &
      Phaser.GameObjects.Components.Origin &
      Phaser.GameObjects.Components.ComputedSize &
      Phaser.GameObjects.Components.Texture &
      Phaser.GameObjects.Components.Flip &
      Phaser.GameObjects.Components.Visible = this.zrodlo ?? player;

    // Martwy gracz ma własną prezentację (nakładka śmierci) — obrys byłby tam
    // drugim komunikatem o tym samym.
    if (!zaslony || player.isDead === true || !ksztalt.visible) {
      this.ukryj();
      return;
    }

    // Prostokąt SYLWETKI w px świata — pełny box klatki wraz z przezroczystym
    // marginesem, świadomie: „częściowo zasłonięty" ma zapalać obrys, a nie
    // dopiero „całkowicie".
    //
    // ⚠ **Liczony ręcznie, a NIE przez `getBounds()`** — ten alokuje nowy
    // `Rectangle` przy każdym wywołaniu, a to jest ścieżka co-klatkowa i
    // projekt ma osobny licznik zacięć (`dev.perf.watch`). Ten sam wzór
    // (`x − displayWidth × originX`), którym liczy `RenderCuller.register`.
    // ⚠ Poprawny, bo gracz się NIE OBRACA: jedyne `setAngle` w `Player` to
    // zerowanie po odrodzeniu. Obracana encja potrzebowałaby prawdziwego AABB.
    this.rect.x = ksztalt.x - ksztalt.displayWidth * ksztalt.originX;
    this.rect.y = ksztalt.y - ksztalt.displayHeight * ksztalt.originY;
    this.rect.w = ksztalt.displayWidth;
    this.rect.h = ksztalt.displayHeight;
    if (!zaslony.covers(this.rect)) {
      this.ukryj();
      return;
    }

    // ⚠ Kopiujemy CO KLATKĘ, bo klatka animacji zmienia się co klatkę. Sam
    // `setTexture` jest w Phaserze no-opem, gdy tekstura i klatka się nie
    // zmieniły, więc nie ma po co tego dławić ręcznie.
    this.img.setTexture(ksztalt.texture.key, ksztalt.frame.name);
    this.img.setPosition(ksztalt.x, ksztalt.y);
    this.img.setOrigin(ksztalt.originX, ksztalt.originY);
    this.img.setScale(ksztalt.scaleX, ksztalt.scaleY);
    this.img.setFlip(ksztalt.flipX, ksztalt.flipY);
    this.img.setAngle(player.angle);
    if (!this.widoczny) {
      this.widoczny = true;
      this.img.setVisible(true);
    }
  }

  private ukryj(): void {
    // ⚠ Zapis tylko przy ZMIANIE — ta sama reguła i ten sam powód co
    // w `RenderCuller`: `setVisible` przechodzi przez `Visible.js` i dirtuje
    // `renderFlags`, więc powtarzanie go co klatkę to koszt bez efektu.
    if (!this.widoczny) return;
    this.widoczny = false;
    this.img.setVisible(false);
  }

  /** Czy obrys jest teraz zapalony — do `dev`, nie do logiki. */
  get active(): boolean {
    return this.widoczny;
  }

  destroy(): void {
    this.img.destroy();
  }
}
