# Painted join atlas — source and scope

Requested by Nicolas on 2026-10-23 after approval of the Mature Cherry localized join study. This gallery expands that **artwork treatment**, not the production game, across six species and four woody stages.

## Inventory

- Species: Cherry, Plum, Apricot, Peach, Pear, Citrus.
- Stages: Sapling, Young Tree, Mature Tree, Ancient.
- Seed, Sprout and Seedling are deliberately unchanged.
- Mature Cherry reuses the exact [previously approved patch](../../../cherry-root-join/assets/cherry-join-patch.png). All other entries are new review candidates, not assumed user-approved.

## Reproducible inputs

`source/` contains unmodified full tree paintings copied from the Trees assets. `references/` contains actual 1024×1024 renderer captures of each painting with the five-axis root scaffold. `contracts.json` records the measured source cut, collar centre, collar width, normalized scale, and cubic attachment geometry for every specimen. `edit-prompt.txt` is the shared instruction; `prompts/` retains each exact species/stage prompt.

Each reference is rendered at root growth 0.5. The primary paths and bark sampling are fixed during growth, so only the outer tips and laterals change. The local patch covers the proximal wood where those paths are already established.

## Generation and preservation

Provider/model: OpenAI `gpt-image-2`, through the configured OpenClaw image editor. Nicolas explicitly approved the non-posting command-line route to keep bulk outputs out of Telegram. Requests use one reference, 1024×1024 target, high quality, PNG, opaque background. `donors/` preserves raw returned PNGs and provider metadata. Raw output dimensions may differ; only the derivative is normalized to the reference dimensions.

`patches/` contains the normalized donor with a spatial alpha mask. For reference pixel `(x,y)`, radius is `hypot((x−512)/345,(y−418)/225)`. Alpha is 1 inside radius 0.72, then smoothsteps to zero at radius 1. The mask is **not** a generated root silhouette or a solid connector. It restricts the donor to the join region while retaining original upper trunk, canopy and distal procedural wood outside it. The master PNGs are never edited. The static backdrop is shared by the reference and review renderer.

`provenance.json` records SHA-256 hashes of the masters, references, donors and final patches. The existing Mature Cherry donor and prompt remain in the original study rather than being regenerated.

## Review boundary

The gallery shows the actual masked patch over procedural roots, with a before/after dialog, whole-tree framing and a growth scrubber. Each stage is an **independent artwork/attachment specimen**. Root geometry scales to that stage's source collar; these cards are not a save migration or proof of persistent roots between stages. Production integration must retain earned root identity and resolve that stage handoff separately.

The distal roots still have the existing angular/textured appearance. This batch repairs trunk joins, not all root anatomy. No production assets, game saves, mechanics or deployment are changed.

## Verification

`verification.json` records all 24 specimens in Chromium and WebKit at actual 390×844 and 1400×1000 viewports. All patches load, all specimens show visible growth, no page/asset errors or horizontal overflow occur, and before/after pixel comparison finds zero differences outside the feathered patch boundary (with a two-percent raster-edge guard). Masters match their production source hashes. Visual review covers each species/stage join, short and long roots, and whole-tree framing. These checks do not establish continuity between independent stage cards.
