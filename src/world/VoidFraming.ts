/**
 * ⭐ **Kadr omija pustkę świata** (2026-10-12).
 *
 * Otwarty świat skleja mapy w prostokąt, którego część nie należy do żadnej
 * mapy (`WorldComposer`, warstwa `pustka`): wieś ma 128 kafli szerokości, las
 * 240, więc na wysokości wsi, na wschód od niej, leży pole bez gruntu. Kamera
 * ograniczona do całego świata pokazywała je jako CZARNY pas przy wschodnim
 * skraju wsi (zrzut przy kaflu 118,5: prawa ćwiartka kadru).
 *
 * Funkcja mówi, o ile przesunąć środek kadru, żeby prostokąt widoku nie
 * zachodził na żadną pustkę, nie wyprowadzając kadru poza świat. Scena podaje
 * wynik jako `followOffset` kamery (dojazd kamery wygładza resztę).
 *
 * ⚠⚠ **Reguła jest CIĄGŁA, nie „najkrótsza droga".** Przy wewnętrznym narożniku
 * (róg wsi ↔ las na wschodzie) kadr może zejść z pustki w bok ALBO w dół.
 * Wybór krótszej drogi przełączał się skokowo, gdy obie były równe — kamera
 * przelatywała ~600 px w 0,3 s (zmierzone 2026-10-12). Dziś: krótsza oś
 * dostaje pełną korektę, dłuższa — `max(0, 2·krótsza − dłuższa)`. Przy równych
 * obie są pełne (oba warianty dają to samo), a daleko od narożnika druga oś
 * dostaje zero, więc idąc wzdłuż wschodniego skraju wsi kadr NIE zjeżdża w dół.
 *
 * ⛔ Czysta arytmetyka — bez Phasera, żeby dało się ją sprawdzić w Node.
 */

export type Prost = { x: number; y: number; w: number; h: number };

const EPS = 1e-6;

function zachodzi(a: Prost, b: Prost): boolean {
  return a.x < b.x + b.w - EPS && a.x + a.w > b.x + EPS && a.y < b.y + b.h - EPS && a.y + a.h > b.y + EPS;
}

/** Przesunięcie środka kadru `widok` poza wszystkie `pustki`, w granicach `swiat`. */
export function przesuniecieOdPustki(widok: Prost, pustki: readonly Prost[], swiat: Prost): { dx: number; dy: number } {
  let dx = 0;
  let dy = 0;
  const v = { ...widok };
  // Kilka przebiegów, bo zejście z jednej pustki może wjechać na drugą.
  for (let przebieg = 0; przebieg < 4; przebieg++) {
    let ruszyl = false;
    for (const p of pustki) {
      if (!zachodzi(v, p)) continue;
      const kandydaci = [
        { dx: p.x - (v.x + v.w), dy: 0 },
        { dx: p.x + p.w - v.x, dy: 0 },
        { dx: 0, dy: p.y - (v.y + v.h) },
        { dx: 0, dy: p.y + p.h - v.y },
      ].filter((k) =>
        v.x + k.dx >= swiat.x - EPS && v.x + v.w + k.dx <= swiat.x + swiat.w + EPS &&
        v.y + k.dy >= swiat.y - EPS && v.y + v.h + k.dy <= swiat.y + swiat.h + EPS);
      if (!kandydaci.length) continue;
      const najkrotszy = (lista: { dx: number; dy: number }[]) =>
        lista.sort((a, b) => Math.abs(a.dx) + Math.abs(a.dy) - (Math.abs(b.dx) + Math.abs(b.dy)))[0];
      const poziom = najkrotszy(kandydaci.filter((k) => k.dy === 0));
      const pion = najkrotszy(kandydaci.filter((k) => k.dx === 0));
      let kx = 0;
      let ky = 0;
      if (poziom && pion) {
        const ph = Math.abs(poziom.dx);
        const pv = Math.abs(pion.dy);
        if (ph <= pv) { kx = poziom.dx; ky = Math.sign(pion.dy) * Math.max(0, 2 * ph - pv); }
        else { ky = pion.dy; kx = Math.sign(poziom.dx) * Math.max(0, 2 * pv - ph); }
      } else {
        const k = poziom ?? pion!;
        kx = k.dx; ky = k.dy;
      }
      v.x += kx; v.y += ky; dx += kx; dy += ky;
      ruszyl = true;
    }
    if (!ruszyl) break;
  }
  return { dx, dy };
}
