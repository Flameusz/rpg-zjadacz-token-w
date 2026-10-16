---
typ: OPERACYJNE
domena: assets
tytul: Prompt do Gemini — moduły ścian
stan: zywy
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-19
---

# Prompt do Gemini — moduły ścian (runda 1 z 2, dachy osobno)

Użyj razem z załączonym obrazem `public/assets/sciany_wzor_gemini.png` jako
**obrazem wejściowym** (image input, nie tylko opis) — to jest ISTNIEJĄCY,
już wpięty w grę styl ściany, wycięty czysto z dachu specjalnie na potrzeby
tego promptu.

---

```
Create additional modular wall pieces for an EXISTING top-down 2D RPG
building tileset. This is not a new style — it is a direct extension of
the attached reference image.

ATTACHED REFERENCE IMAGE — MATCH IT EXACTLY:
The attached image shows two wall types already in use: a log-wall
construction (left) and a plank-wall construction (right), each with a
door, a small window, and its own foundation course. Match this reference
exactly: same wood tones, same log/plank silhouette, same lighting
direction (light from top, slightly left), same pixel density, same
32x32 tile grid, same flat/front-elevation perspective. Do not introduce
a new art style, a new color temperature, or a new level of detail.

ALREADY EXISTS — do not regenerate these:
- plain log wall section, plain plank wall section
- log wall with door, plank wall with door
- log wall with one small shuttered window, plank wall with same
- stone foundation course (log wall), plank foundation course (plank wall)
- corner log-ends where the wall meets its own edge

GENERATE ONLY THESE NEW PIECES, in both the log-wall and plank-wall
material shown in the reference:

Wall variants:
- a LARGE window variant (wider/taller opening than the reference window,
  same shutter style)
- a damaged / weathered wall section (a few broken or missing
  planks/logs, patched or splintered — same idea as a "worn" tile in an
  existing tileset, not a full ruin)
- a lighter wood color variant of the same wall (bleached/aged wood, a
  distinct color family, not just a texture-noise variant)
- a darker wood color variant of the same wall (weathered/stained wood,
  a distinct color family)

Corner / junction pieces (this is the important new part):
- an INSIDE corner wall piece — where two wall faces of the SAME
  building meet at a 90-degree inside angle (like the inner corner of an
  L-shaped house), drawn FLAT, top-down/front-elevation, matching the
  reference's perspective exactly
- an OUTSIDE corner wall piece for the same L-shaped junction, also flat,
  same perspective

STRICT PERSPECTIVE RULE — READ CAREFULLY:
Every tile must be drawn in the EXACT SAME flat, front-elevation,
top-down-game perspective as the reference image. Absolutely NO
isometric angles. Absolutely NO 3/4 view. Absolutely NO diagonal
corner rendering where a wall appears to recede into depth. A corner
piece is still a FLAT tile — it shows where two flat wall textures meet
at a seam, not a rendered 3D corner of a building. If a piece looks like
it belongs in an isometric game, it is wrong — discard and redraw flat.

Technical requirements:
- 32x32 pixel tile grid, tiles aligned perfectly, designed for Tiled
- seamless edges — a tile must tile cleanly against its neighbors
- exact #00FF00 chroma green, flat opaque background
- limited palette, no gradients, no anti-aliasing, no smooth edges, no
  dithering, no tiny noise pixels
- must survive Pixel Art Snapper palette reduction cleanly
- large, readable pixel clusters — small RPG gameplay scale, not
  high-detail illustration

Do not include: characters, furniture, animals, decorations, roads,
trees, fences, text, UI, roof pieces of any kind, complete assembled
houses, chimneys. Roofs are a separate follow-up prompt — do not
generate any roof geometry in this pass, even resting on top of a wall.

The output should read as a small, cleanly cropped sprite sheet of
individual wall tiles on flat green — not a scene, not concept art, not
a finished building.
```

---

## Po wygenerowaniu

1. Przepuść wynik przez **spritefusion.com** (pixel snapper) przed odesłaniem —
   `gejmini.png` tego nie przeszedł i dlatego miał 54 685 unikalnych kolorów
   zamiast prawdziwej palety pikselowej.
2. Jeśli którykolwiek kafel wyjdzie w rzucie izometrycznym mimo zakazu w
   promptcie — odrzucamy tylko ten kafel, nie cały arkusz. Tak było zrobione
   przy poprzednich rundach (kowal, dzik, wilk) — patrz `docs/prompty_gemini.md`.
3. Dachy — osobny prompt, dopiero gdy ten komplet ścian wyląduje w grze.
