# Hunter — PRE-CUT Spine Asset Package

This package fixes the main problem with the previous handoff:
**Claude Code does NOT need to crop or isolate anything.**

Every relevant modular source component is already a separate transparent PNG.

## What is what?

- `base/head/` — head/hair components.
- `base/torso/` — front/back/side torso references.
- `base/arms/` — isolated arm pieces.
- `base/hands/` — isolated hand variants.
- `base/legs/` — isolated leg pieces.
- `base/feet/` — feet.
- `base/hip_wrap/` — the minimal base clothing.
- `reference/` — the original sheet and assembled references. These are NOT production attachments.

## Rigging target

Create ONE shared rigid cutout skeleton.

Recommended:
root
└─ body
   ├─ head
   ├─ arm_L_upper → arm_L_forearm → hand_L
   ├─ arm_R_upper → arm_R_forearm → hand_R
   ├─ leg_L_thigh → leg_L_shin → foot_L
   └─ leg_R_thigh → leg_R_shin → foot_R

## Source scale

Do not reduce the PNGs before rigging. The larger source resolution is intentional:
it improves pivot placement, joint overlap and animation quality.

The game can render the character at roughly half the source size.

## Important

Some components are alternate/reference variants rather than layers that must all be visible simultaneously.
Choose the appropriate variant when constructing the canonical front-facing base.

The base character should remain:
- simple
- rural/commoner
- minimal clothing
- no armor
- no weapon attached by default

Equipment should later be separate skins/attachments.
