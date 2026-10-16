/**
 * Jedno miejsce, w którym powstaje CIAŁO FIZYCZNE czegokolwiek, co się rusza.
 *
 * ⚠ **Powstało z prawdziwego błędu, nie z porządkowania.** Do 2026-08-28
 * `Enemy` deklarował ciało jawnie (`setSize` + offset u stóp), `Player` robił
 * to samo trzecim wariantem offsetu, a **`Critter` nie deklarował go wcale** —
 * wołał `setScale` i zostawał z domyślnym ciałem Arcade, czyli KLATKĄ ARKUSZA
 * przemnożoną przez skalę. Zmierzone skutki: sarna miała ciało **79×57 px**
 * (szersze niż dwa i pół kafla), lis **54×31 px**, a po dodaniu kolizji terenu
 * sarna straciła dostęp do **60 % mapy, rozbitej na 163 wyspy** — i nie mieściła
 * się nawet we własnym punkcie spawnu.
 *
 * To było niewidoczne przez cały czas, w którym świat nie miał ścian: przed
 * pierwszą kolizją kafli (Step 1A) rozmiar ciała nie znaczył nic. Dlatego
 * `tsc` tego nie widział, playtest tego nie widział i żaden raport tego nie
 * zgłaszał.
 *
 * Reguła, która z tego wynika i której pilnuje `auditBodies`:
 * **każde ciało fizyczne w grze jest ZADEKLAROWANE, nigdy odziedziczone po
 * rozmiarze klatki.**
 */
import Phaser from "phaser";

/**
 * Ciało fizyczne jednego stworzenia — to, czym zderza się ono z terenem.
 *
 * ⚠ **To NIE jest hurtbox walki.** Trafialność opisują osobne pola: `hurt`
 * (ślad stopy, z którego `Enemy.combatBody` składa kapsułę) oraz `reach`/`range`
 * konkretnych ciosów — celowo niezwiązane z tym kształtem, bo zwężenie ciała
 * nie może po cichu przestroić zasięgu ciosu.
 * ⚠ Do 2026-09-07 stało tu w tej liście `allowance` — **pole, którego
 * `GameConfig` nigdy nie miał**; była to liczona wartość, usunięta z gry
 * w Fazie 1B-b razem z całym starym modelem zasięgu.
 *
 * ⚠⚠ **`w`/`h` są w pikselach KLATKI, a Arcade mnoży je przez skalę duszka.**
 * `Body.setSize` zapisuje `sourceWidth`, a `updateBounds()` liczy co klatkę
 * `width = sourceWidth × |scaleX|` (potwierdzone w źródle Phasera). Czyli dzik
 * z `bodyWidth: 22` i `scale: 2.1` ma **realne ciało 46,2 px**, nie 22 px.
 *
 * Ta konwencja **zostaje**, mimo że myli: liczby w `GameConfig` są w niej
 * strojone od początku, a przeliczenie ich na piksele świata przestroiłoby
 * ciało każdego stworzenia w grze. `tools/combat_geometry.mjs` liczy tak samo
 * (`cfg.bodyWidth * skala`) i jest w tej sprawie źródłem prawdy.
 *
 * ⚠ Pomyłka na tym mnożniku jest droga i już raz się zdarzyła: analiza
 * prześwitów z 2026-08-27 porównała bramy w lesie z `bodyWidth` **bez skali**,
 * przez co wyszło, że dzik jest o 4 px za szeroki, a naprawdę jest o 28 za
 * szeroki. Pytając „czy się zmieści", pytaj `dev.bodies()`, nie configu.
 */
export interface MoveBodySpec {
  /** Szerokość ciała w pikselach KLATKI — realna to `w × scale`. */
  readonly w: number;
  /** Wysokość ciała w pikselach klatki — realna to `h × scale`. */
  readonly h: number;
  /**
   * Ile pikseli nad dolną krawędzią klatki siedzą stopy.
   *
   * ⚠ Ciało jest kotwiczone U STÓP, nie w środku duszka — cała gra mierzy
   * dystanse w tej konwencji (`hitVectorTo`, `combatOrigin`), a ciało
   * wyśrodkowane w klatce unosiłoby zwierzę nad ziemię o pół sylwetki.
   */
  readonly feetPadding: number;
}

/**
 * Wpisz ciało w duszka. Jedyna droga — `setSize`/`setOffset` wołane gdzie
 * indziej znaczy, że ktoś obszedł `auditBodies`.
 */
export function applyBody(
  sprite: Phaser.Physics.Arcade.Sprite,
  spec: MoveBodySpec,
): void {
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  body.setSize(spec.w, spec.h);
  body.setOffset((sprite.width - spec.w) / 2, sprite.height - spec.h - spec.feetPadding);
  declared.add(sprite);
}

/**
 * Kto przeszedł przez `applyBody`.
 *
 * ⚠ **Znacznik, nie heurystyka — i to jest różnica nośna.** Pierwsza wersja
 * audytu porównywała rozmiar ciała z `klatka × skala` i zgadywała. Taki test
 * milczy dokładnie wtedy, gdy zadeklarowane ciało przypadkiem wyjdzie równe
 * klatce — czyli w jedynym przypadku, w którym pomyłka jest nieodróżnialna od
 * poprawności. Znacznik odpowiada na pytanie, które naprawdę zadajemy: **czy
 * ktokolwiek podjął tu decyzję.**
 */
const declared = new WeakSet<Phaser.GameObjects.GameObject>();

/** Jeden podejrzany wpis z audytu ciał. */
export interface BodyAudit {
  /** Tekstura duszka — jedyna rzecz, po której da się go rozpoznać w konsoli. */
  readonly texture: string;
  readonly bodyW: number;
  readonly bodyH: number;
  readonly frameW: number;
  readonly frameH: number;
  readonly scaleX: number;
  readonly scaleY: number;
  /** Czy ciało przeszło przez `applyBody`, czy zostało odziedziczone po klatce. */
  readonly declared: boolean;
}

/**
 * Przemieć wszystkie żywe ciała Arcade i zgłoś te, których nikt nie
 * zadeklarował — czyli takie, których wymiary są dokładnie `klatka × skala`.
 *
 * ⚠ **Asercja, która nie potrafi zaświecić na czerwono, jest dekoracją.**
 * Sprawdzenie negatywne: wypnij `applyBody` z konstruktora `Enemy`, wejdź do
 * lasu i zawołaj `dev.bodies()` — jelenie i lisy MUSZĄ się pojawić na liście.
 * (Do 2026-10-04 test szedł przez konstruktor `Critter`, dziś usunięty.)
 *
 * ⚠ Trafienie nie zawsze jest błędem: ciało może wyjść równe klatce przez
 * przypadek. Dlatego to jest RAPORT do obejrzenia, a nie wyjątek — ma zwrócić
 * pustą tablicę na dzisiejszym rosterze i to jest jego kryterium.
 */
export function auditBodies(scene: Phaser.Scene): BodyAudit[] {
  return listBodies(scene).filter((b) => !b.declared);
}

/**
 * Wszystkie żywe ciała Arcade z ich PRAWDZIWYMI wymiarami w pikselach świata.
 *
 * ⚠ Istnieje, bo `GameConfig` **nie odpowiada** na pytanie „jak szerokie jest
 * to zwierzę" — liczba w configu jest w pikselach klatki i trzeba ją pomnożyć
 * przez skalę (patrz `MoveBodySpec`). Jedno wywołanie z konsoli zamiast
 * mnożenia w pamięci przy każdym pytaniu o prześwit.
 */
export function listBodies(scene: Phaser.Scene): BodyAudit[] {
  const out: BodyAudit[] = [];
  const bodies = scene.physics.world.bodies.getArray();
  for (const body of bodies) {
    const go = body.gameObject as Phaser.GameObjects.Sprite | undefined;
    if (!go || typeof go.width !== "number") continue;
    // `body.width` jest już w pikselach ŚWIATA (Arcade przemnożyło je przez
    // skalę), `go.width` — w pikselach klatki.
    out.push({
      texture: go.texture?.key ?? "?",
      bodyW: body.width,
      bodyH: body.height,
      frameW: go.width,
      frameH: go.height,
      scaleX: go.scaleX,
      scaleY: go.scaleY,
      declared: declared.has(go),
    });
  }
  return out;
}
