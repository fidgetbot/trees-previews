# Cherry join provenance

One Mature Cherry experiment, 2026-10-23. No production game files modified.

- `cherry-mature-master.png`: unchanged original from Trees `assets/trees/cherry-mature-tree-v1.png`, 655×512.
- `cherry-join-reference.png`: 1024² actual Canvas reference with original painted trunk and fixed procedural roots. World bounds x −128..128, y −90..166; 4 source pixels/world unit.
- `cherry-join-generated.png`: untouched built-in image_gen edit result, retained at native dimensions. This donor is NOT the replacement tree.
- `../cherry-join-patch.png`: donor normalized to 1024², with an alpha mask. For pixel (x,y), d = hypot((x−512)/345, (y−418)/225), alpha = 1 − smoothstep(.72,1,d). Pixels outside d=1 have zero alpha. Runtime placement is x=−128,y=−90,width=256,height=256. The original tree and live roots remain the base.

All source artwork above/beyond the mask remains original. The patch is a fixed local painted root crown; distal roots extend procedurally. No claims of species-wide or cross-stage correctness. Remaining angularity/repetitive bark in distal procedural roots is outside this join experiment.

## Generation method and prompt

SHA-256 provenance:

```text
8c753f01d6986103247c29d5950a6d5995e1db275adf388d4779da467cdee245  cherry-mature-master.png
ac297951eb9cffaf4ba265f7867f5a7851a40ca47d0869d86f0cc91a80e4e1ec  cherry-join-reference.png
6c4c71a7f4bb9da8b0fd3b34a6d3bbc3f7930a25d115cc11a869982387bc80b8  cherry-join-generated.png
9269373262d8883580a922224e9019569f82108049d6158ea3f39aa786f88f6b  ../cherry-join-patch.png
```

Built-in image_gen, one reference edit, opaque background. Exact prompt:

Use case: precise-object-edit. Edit target: the supplied 1024×1024 close-up of the actual game composite. This is a LOCAL retouch for a game asset, not a new tree illustration. Keep canvas 1024×1024 and ALL content outside the central trunk-to-root junction unchanged. Preserve the upper trunk above y=250, all roots and twigs below y=660, and root geometry at the left and right image borders. Keep the exact flat dark brown background (#281d15); no soil, ground line, haze, vignette, labels or extra elements. Repair only the junction in approximately x=185..845, y=250..620. The current trunk has a conspicuous hard horizontal cut at y=447 and mismatched pasted root strips. Repaint this region as one anatomically continuous, asymmetric Cherry root flare: rich reddish-brown cherry bark with subtle pale horizontal lenticels flowing over rounded woody buttresses, highlights/shadows matching the original trunk. Connect the trunk into the existing five structural root paths: leftward shallow root, lower-left root, descending slightly right-of-center root, lower-right root, and rightward shallow root. MATCH the exact existing widths, centerlines and directions where they leave the edited region; do not invent or reposition the outgoing roots. Remove the horizontal seam, squared ends, abrupt width steps and geometric pasted collar. Let the trunk gradually divide into separately tapering rounded roots with naturally shaped dark negative spaces between them. Keep the source's painted botanical style, scale and illumination. No new roots or branches. The edit must look like continuous organic wood, not a flat polygon cap or a cluster of tubes.
