import type Phaser from "phaser";

/**
 * Rekwizyty `DECOR_PROPS` postawione na bieżącej mapie sceny — nazwa obiektu
 * z Tiled (pierwsza z `names`), punkt w gruncie i obrazek.
 *
 * Czyta to WYŁĄCZNIE widok 3D (`Trees3D`), żeby postawić model zamiast
 * billboardu. ⛔ Logika (kolizje, NavGrid) z tego nie korzysta — tak samo jak
 * `treeInstancesFor` w `TreeLayer`.
 *
 * ⚠ Scena jest REUŻYWANA przy `scene.restart()`, więc lista musi być
 * czyszczona przy każdym budowaniu mapy (`resetPropInstances`), inaczej po
 * przejściu bramą zostałyby w niej obrazki poprzedniej mapy.
 */
export interface PropInstance {
  name: string;
  x: number;
  y: number;
  /** Obrazek rekwizytu albo duszek encji (studnia, koło, ognisko) — widok 3D
   *  gasi mu wyłącznie rysowanie; dotyk i ciało zostają. */
  image: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
}

const INSTANCES = new WeakMap<Phaser.Scene, PropInstance[]>();

export function resetPropInstances(scene: Phaser.Scene): void {
  INSTANCES.set(scene, []);
}

export function registerPropInstance(scene: Phaser.Scene, p: PropInstance): void {
  let lista = INSTANCES.get(scene);
  if (!lista) INSTANCES.set(scene, (lista = []));
  lista.push(p);
}

export const propInstancesFor = (scene: Phaser.Scene): readonly PropInstance[] => INSTANCES.get(scene) ?? [];
