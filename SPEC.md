# Trees previews

Separate static review site, independent of the Trees game repository and deployment.

## Painted roots

`painted-roots/index.html` is a self-contained browser prototype with embedded PNG layers from actual Cherry Sprout, Sapling and Young Tree game-rendered specimens and one generated feeder-root extension sprite. Extend Root adds up to four overlays; Reset removes them. Each specimen maintains fixed framing during additions. No game saves, gameplay rules, external services or storage are used.

Revision 2 replaces the universal golden root with two generated sprite families: soft ivory for Sprout and reddish-brown woody forks for Sapling and Young Tree. Display length varies by stage; attachment width is capped at 80% of measured parent-root width. Source PNGs are retained under `painted-roots/assets/`.

This is a compositor study, not a complete root-growth implementation. The fade is not final tip-growth animation. Between-stage continuity remains unvalidated. The three stage cards are independent examples, not sequential transitions. Mature and Ancient stage-specific families are not part of this three-stage study.

Hosted through GitHub Pages from main, repository root. No dependency on or mutation of the live game's version or files.

## Root-tip branching

`painted-roots-short-stem/` compares the shipped connector, the earlier 65%-shorter study, and a tip-attached concept across Sapling, Young Tree, Mature Tree, and Ancient Cherry paintings. The tip-attached concept removes the narrow extension stem entirely and overlaps the extension's first fork slightly beneath the detected painted-root endpoint. The stage painting masks the seam, while the fork/fine-root artwork, scale, angles, counts, and framing remain unchanged. This is a prototype only; the production game is unchanged.
