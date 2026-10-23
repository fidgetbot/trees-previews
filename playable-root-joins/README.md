# Playable painted-root review

[Open with review controls](https://fidgetbot.github.io/trees-previews/playable-root-joins/?review=1) · [normal Seed opening](https://fidgetbot.github.io/trees-previews/playable-root-joins/) · [source commit](https://github.com/fidgetbot/trees/commit/5467a49)

Use **Root review · controls** to load any species, stage and season. Close the panel and spend resources with the normal **Extend Root** and **Deepen Roots** actions. **Meet requirements & age up** supplies the current milestone requirements, then runs the game's real transition while retaining root investments. It is a review shortcut, not a change to ordinary game rules.

All six species and all seven stages are playable. The 24 new joins affect Sapling through Ancient; juvenile art remains unchanged. Root IDs/curves survive woody handoffs in collar-relative coordinates and scale with the growing tree. The known angular distal-root style remains; this integration implements the approved painted join treatment.

Local verification before publication:
- 231 Node tests passed, including patch/master hashes, persistent graph paths, attachment rules, growth and JSON compatibility.
- All six species inspected in actual spring/winter game views and all 24 woody joins inspected close-up.
- Chromium and WebKit, 390×844 and 1280×900: stage matrices and real root-action clicks, no page errors/overflow.
- Real Seed action and milestone-assisted transitions through Ancient for every species, both engines.
- Fixed-camera composites distinguish visible root growth from camera/weather changes; JSON round trips produce identical pixels.
- Animated Cherry growth at all four woody stages, both engines; camera adjustment allowed only when measured tissue overflows. Menu-close layer recovery checked.
- Eighteen seeded simulations (three per species, seed 20, 96-turn cap) exactly matched production mechanics.

This build is isolated. Nothing has been merged into or deployed over the production game.
