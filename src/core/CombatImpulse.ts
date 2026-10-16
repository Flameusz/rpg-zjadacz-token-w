/**
 * Wykonawca `GameplayEffects` — jedyne miejsce, w którym rozstrzygnięcie
 * rusza ciałem.
 *
 * Faza 5B Combat Feel. Ten sam podział, co przy 5A: **decyzja osobno
 * (`core/GameplayEffects.ts`, czysta), wykonanie osobno (tu, z Phaserem)**.
 * Odpowiednikiem po stronie prezentacji jest `core/CombatFx.ts` — i to jest
 * jedyna para plików w tym projekcie, którą łatwo pomylić:
 *
 * | plik | rusza pozycją? | serwer to wykonuje? |
 * |---|---|---|
 * | `CombatFx.ts` | **nie, nigdy** | nie |
 * | `CombatImpulse.ts` (ten) | **tak, i o to chodzi** | docelowo tak |
 *
 * ── ⚠ Ten plik NIE zna kształtu ruchu ────────────────────────────────────
 * Cały przebieg — kierunek, amplituda, czasy, krzywa — mieszka w `Impulse`
 * i rozwija go `impulseOffsetAt`, **czysta funkcja bez Phasera**. Tutaj
 * zostaje wyłącznie zegar i zapis pozycji. Świadomie **nie ma tu tweena
 * z `ease`/`yoyo`**: te dwa łańcuchy opisywałyby ruch po stronie renderera,
 * a autorytatywną regułę ma móc wykonać serwer, który tweenów nie ma.
 *
 * ⚠ Konsekwencja: **nowa własność ruchu NIE POWSTAJE tutaj.** Wygładzenie,
 * odbicie, opóźnienie — wszystko dokłada się do `Impulse` i do
 * `impulseProgressAt`. Ten plik ma zostać głupi.
 *
 * ── ⚠ Dlaczego przesunięcie PRZYROSTOWE ──────────────────────────────────
 * Zapis pozycji BEZWZGLĘDNEJ nadpisywałby wszystko, co ciało robi samo:
 * przeciwnik szarpnięty w trakcie dobiegania zamarłby na czas szarpnięcia
 * i skoczył po jego końcu. Dwa szarpnięcia naraz walczyłyby o ten sam
 * atrybut. Dlatego każdy przebieg pamięta **własny dotychczas przyłożony
 * offset** i dokłada wyłącznie różnicę — ruch własny leci nietknięty pod
 * spodem, przebiegi się sumują, a każdy cofa dokładnie swój wkład.
 *
 * ⚠ **Zapis idzie w `gameObject.x`, nie w `body.position`, i to jest
 * poprawne.** `Arcade.Body.preUpdate()` woła `updateFromGameObject()`, czyli
 * ciało jedzie za obrazkiem w każdym kroku fizyki. Gdyby było odwrotnie, ten
 * plik przesuwałby wyłącznie grafikę względem hitboxa — czyli robiłby
 * dokładnie to, czego autor zakazał i przez co 5A zostało bez recoilu.
 * Sprawdzone w źródle Phasera, nie założone.
 */

import Phaser from "phaser";
import { impulseDurationMs, impulseOffsetAt, type Impulse } from "./GameplayEffects";

/** Cel impulsu: coś, co ma pozycję, ciało i da się zniszczyć w trakcie. */
type Cialo = Phaser.GameObjects.Components.Transform & {
  active: boolean;
  body?: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | null;
};

/**
 * Czy krok `(dx, dy)` wprowadziłby ciało w przeszkodę.
 *
 * ── ⚠ Dlaczego NIE `body.blocked` / `body.touching` ─────────────────────
 * Pierwsza wersja tego zaworu czytała właśnie je i była **martwym kodem** —
 * zmierzone klatka po klatce: przy impulsie wjeżdżającym w statyczną
 * przeszkodę `touching.right` i `blocked.right` **nie zapaliły się ani razu**,
 * a ciało dostawało `embedded: true` i tkwiło w przeszkodzie przez 9 klatek.
 *
 * Powód jest w naturze tego przesunięcia: impuls **wpisuje pozycję**, więc
 * z punktu widzenia Arcade ciało TELEPORTUJE się do środka przeszkody. Silnik
 * rozdziela ciała wzdłuż ich względnego RUCHU; przy zerowej prędkości nie ma
 * osi, wzdłuż której miałby wypchnąć, więc oznacza je jako zagnieżdżone
 * i zostawia. **Flagi kontaktu opisują kolizje, których ten mechanizm nie
 * produkuje.**
 *
 * Dlatego zawór pyta o przyszłość, a nie o przeszłość: sprawdza prostokąt,
 * w który krok chce wejść, i nie wchodzi. Zapobieganie zamiast korekty —
 * korekta po fakcie była nie tylko spóźniona, ale i szkodliwa (patrz
 * komentarz przy zapominaniu offsetu).
 *
 * ⚠ **Pyta wyłącznie o ciała STATYCZNE** (`includeDynamic: false`). To są
 * przeszkody terenu: drzewa, budynki, studnia, przyszłe kolizje kafli.
 * Dynamiczne (drugi wróg, gracz) mają własne prędkości i rozdziela je normalna
 * ścieżka Arcade — a traktowanie ich jako ściany zablokowałoby szarpnięcie za
 * każdym razem, gdy dwa wilki stoją obok siebie, czyli w watasze zawsze.
 */
function zablokowaneW(scene: Phaser.Scene, cialo: Cialo, dx: number, dy: number): boolean {
  const b = cialo.body as Phaser.Physics.Arcade.Body | undefined | null;
  if (!b || !("blocked" in b)) return false;

  // Granice świata — jedyny przypadek, w którym `blocked` DZIAŁA, bo Arcade
  // domyka je bez udziału drugiego ciała.
  if (b.collideWorldBounds) {
    const bl = b.blocked;
    if (dx > 0 && bl.right) return true;
    if (dx < 0 && bl.left) return true;
    if (dy > 0 && bl.down) return true;
    if (dy < 0 && bl.up) return true;
  }

  // Prostokąt, w który impuls chce wejść w tej klatce.
  const px = b.x + dx;
  const py = b.y + dy;
  const trafione = scene.physics.overlapRect(px, py, b.width, b.height, false, true) as
    | Phaser.Physics.Arcade.Body[]
    | Phaser.Physics.Arcade.StaticBody[];
  for (const inne of trafione) {
    if (inne === (b as unknown as typeof inne)) continue;
    return true;
  }
  return false;
}

/**
 * Odegraj `imp` na `target`.
 *
 * ⚠ **Sterowane zdarzeniem `Scenes.Events.UPDATE`, nie tweenem** — patrz
 * nagłówek. `UPDATE` leci PRZED `scene.update()`, czyli przed tym, w czym
 * `GameScene` czyta pozycje, więc szarpnięcie jest widoczne dla wszystkiego
 * w tej samej klatce (zmierzone: pierścień celu nadąża co do piksela).
 *
 * ⚠ **Wypięcie ma DWIE drogi i obie są konieczne**: koniec przebiegu oraz
 * `SHUTDOWN` sceny. Bez pierwszej rósłby licznik listenerów, bez drugiej
 * przejście bramą zostawiałoby wywołanie na zniszczonym obiekcie.
 */
export function applyImpulse(scene: Phaser.Scene, target: Cialo, imp: Impulse): void {
  const total = impulseDurationMs(imp);
  if (total <= 0 || imp.distancePx <= 0) return;
  if (Math.hypot(imp.dirX, imp.dirY) < 0.0001) return;

  let elapsed = 0;
  let ax = 0;
  let ay = 0;

  const przyloz = (x: number, y: number): void => {
    target.x += x - ax;
    target.y += y - ay;
    ax = x;
    ay = y;
  };

  const koniec = (): void => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, krok);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, koniec);
  };

  const krok = (_t: number, delta: number): void => {
    // Cel zniknął w trakcie (śmierć, restart sceny) — nie ma czego cofać
    // i nie wolno pisać po zniszczonym obiekcie.
    if (!target.active) {
      koniec();
      return;
    }
    elapsed += delta;
    if (elapsed >= total) {
      przyloz(0, 0);
      koniec();
      return;
    }
    const chciany = impulseOffsetAt(imp, elapsed);
    const dx = chciany.x - ax;
    const dy = chciany.y - ay;
    if ((dx !== 0 || dy !== 0) && zablokowaneW(scene, target, dx, dy)) {
      // ⚠ **Odkręć offset — i ta decyzja RAZ JUŻ BYŁA ODWROTNA.**
      // Dopóki zawór czytał `body.blocked`, reagował PO wepchnięciu ciała
      // w przeszkodę: fizyka zdążyła je wypchnąć, więc cofnięcie pełnego
      // offsetu sumowało się z tym wypchnięciem i dawało zmierzony dryf
      // **+8,65 px** po jednym ciosie pod ścianą. Wtedy poprawne było
      // ZAPOMNIENIE offsetu.
      //
      // Zawór pyta teraz o przyszłość i **nie wchodzi w przeszkodę wcale**,
      // więc fizyka niczego nie koryguje, a przyłożony offset jest w całości
      // nasz. Odkręcenie go wraca dokładnie do punktu startu — czyli
      // niezmiennik „netto zero" obowiązuje także pod ścianą.
      //
      // ⚠ Zapisane, bo z samego kodu nie widać, że ta gałąź zależy od tego,
      // CZY zawór zapobiega, czy koryguje. Zmiana jednego bez drugiego
      // przywraca tamten dryf.
      przyloz(0, 0);
      koniec();
      return;
    }
    przyloz(chciany.x, chciany.y);
  };

  scene.events.on(Phaser.Scenes.Events.UPDATE, krok);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, koniec);
}
