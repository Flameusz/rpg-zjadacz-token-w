/**
 * Wykonawca `PresentationCues` — jedyne miejsce, w którym rozstrzygnięcie
 * zamienia się w coś widocznego i słyszalnego.
 *
 * Faza 5A Combat Feel. Świadomie NIE jest częścią `CombatCues.ts`: tamten plik
 * jest czysty i testowalny w Node, ten dotyka Phasera. Podział jest ten sam, co
 * przy `ActionRunner` — **decyzja osobno, wykonanie osobno**.
 *
 * ⚠ **Nic tutaj nie może zmienić pozycji, czasu ani stanu.** To jest warunek,
 * pod którym Faza 5A w ogóle powstała: bramka `tools/combat_regresja.mjs` nie
 * ma drgnąć ani o bit. Jeśli drgnie, znaczy to, że feedback wszedł w symulację.
 *
 * ⚠ **Od 5B ten plik ma BLIŹNIAKA i łatwo je pomylić: `core/CombatImpulse.ts`.**
 * Tamten rusza ciałem i **o to w nim chodzi** — jest wykonawcą
 * `GameplayEffects`, czyli tej strony podziału §5.6, którą docelowo liczy
 * serwer. Reguła kieszonkowa: jeśli piszesz coś, co zmienia POZYCJĘ, jesteś
 * w złym pliku. Recoil był w 5A odłożony właśnie dlatego, że nie mieścił się
 * po tej stronie granicy — i granicy nie przesunięto, tylko przeszło się na
 * drugą stronę i nazwało to wprost.
 *
 * Konsekwencje, których trzeba pilnować:
 *  • **żadnego `physics.world.pause()`** — hit-stop zatrzymuje WSZYSTKIE ciała
 *    i jest stanem gry, nie prezentacją. Legacy przy krytyku zostaje tam,
 *    gdzie był (`GameScene.critHitStop`), i 5A go nie rozwija;
 *  • **żadnego przesuwania sprite'a niezależnie od `CombatBody`** — grafika ma
 *    potwierdzać mechanikę, nie udawać ruch, którego nie ma. Dlatego recoil
 *    NIE jest tu zaimplementowany, mimo że to on daje wrażenie uderzenia.
 */

import Phaser from "phaser";
import { DEPTH } from "../config/GameConfig";
import type { PresentationCues } from "./CombatCues";
import { flashHit, type HitFlashOptions } from "./HitFlash";
import { floatingText } from "./Fx";
import { Sfx } from "./Sfx";
import type { SfxKey } from "./Sfx";

/**
 * Kogo mignąć i co przywrócić po błysku.
 *
 * ⚠ **`restoreTint` jest TUTAJ, a nie w `PresentationCues`, i to jest cała
 * treść tego typu.** Bywa **funkcją** czytaną dopiero na końcu błysku, bo cel
 * może w tym czasie zmienić stan — dzik kończący zamach, wściekający się
 * Szary. Funkcja domykająca się nad encją nie jest danymi i nie przeżyłaby
 * przejścia przez sieć, więc nie ma prawa stać po tamtej stronie granicy.
 * Pełny opis pułapki: `core/HitFlash.ts`.
 */
export interface FlashTarget {
  readonly sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
  readonly restoreTint?: HitFlashOptions["restoreTint"];
}

/**
 * Zagraj to, co opisują `cues`.
 *
 * `at` i `dir` pochodzą z `ActionResolution` — punkt rozstrzygnięcia i kierunek
 * ciosu. `dir` bywa `null` (cios bez kierunku); wtedy ślad świstu jest pomijany,
 * bo nie ma czego narysować.
 */
export function playCues(
  scene: Phaser.Scene,
  cues: PresentationCues,
  at: { x: number; y: number },
  dir: { x: number; y: number } | null,
  flashTarget?: FlashTarget,
): void {
  if (cues.sfx) {
    Sfx.play(cues.sfx.key as SfxKey, {
      detune: cues.sfx.detune,
      volumeMul: cues.sfx.volumeMul,
      throttleKey: cues.sfx.throttleKey,
    });
  }
  if (cues.shake) scene.cameras.main.shake(cues.shake.ms, cues.shake.intensity);
  if (cues.whiff && dir) whiffTrail(scene, at, dir, cues.whiff);
  // ⚠ **Napis wyniku — czysta prezentacja, jak reszta tego pliku.** Powstał,
  // bo „uniknąłem" i „oberwałem za zero" różniły się wyłącznie odcinkiem
  // błysku, a `dodge`/`parry` nie mają nawet plików dźwiękowych. Rysowany tam,
  // gdzie cios się rozstrzygnął, czyli nad broniącym się — `floatingText`
  // sprząta po sobie sam, więc nie ma tu nic do zwolnienia.
  if (cues.label) {
    const l = cues.label;
    floatingText(scene, {
      x: at.x,
      y: at.y + l.offsetY,
      text: l.text,
      color: l.color,
      fontSize: l.fontSize,
      rise: l.rise,
      duration: l.duration,
      depth: DEPTH.entities + at.y + 200,
    });
  }
  if (cues.flash && flashTarget) {
    flashHit(scene, flashTarget.sprite, {
      tint: cues.flash.tint,
      ms: cues.flash.ms,
      pop: cues.flash.pop,
      popScale: cues.flash.popScale,
      restoreTint: flashTarget.restoreTint,
    });
  }
}

/**
 * Ślad chybionego ciosu: krótka kreska wzdłuż kierunku, w miejscu, w którym
 * cios przeszedł.
 *
 * ⚠ **Rysowana tam, gdzie cios BYŁ, a nie gdzie jest cel.** To jest cała treść
 * tego efektu: gracz ma zobaczyć, że zęby zwarły się w powietrzu OBOK niego, i
 * że jego uskok był tym, co o tym zdecydowało.
 *
 * `Graphics`, nie `Image`: to dwa piksele grubości i nie warto na to tekstury.
 * Sprząta się sam po zakończeniu tweena — bez tego każdy chybiony cios
 * zostawiałby obiekt na scenie do końca sesji.
 */
function whiffTrail(
  scene: Phaser.Scene,
  at: { x: number; y: number },
  dir: { x: number; y: number },
  opts: { ms: number; lengthPx: number; color: number; alpha: number },
): void {
  const pol = opts.lengthPx / 2;
  const g = scene.add.graphics({ x: at.x, y: at.y });
  g.lineStyle(2, opts.color, opts.alpha);
  g.beginPath();
  g.moveTo(-dir.x * pol, -dir.y * pol);
  g.lineTo(dir.x * pol, dir.y * pol);
  g.strokePath();
  // Nad encjami, żeby nie ginął pod stworzeniem, które właśnie chybiło.
  g.setDepth(DEPTH.entities + at.y + 50);

  scene.tweens.add({
    targets: g,
    alpha: 0,
    // Ślad ucieka lekko WZDŁUŻ ciosu — czyta się jako zamach, który poleciał
    // dalej, a nie jako znacznik przyklejony do miejsca.
    x: at.x + dir.x * 6,
    y: at.y + dir.y * 6,
    duration: opts.ms,
    ease: "Quad.easeOut",
    onComplete: () => g.destroy(),
  });
}
