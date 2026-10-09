# Flappy Sarah sprites

The active default is `sarah-flap-denim.png`, an alternate atlas based on the user's denim-jacket/dress photo. The original `sarah-flap.png` hiking set is preserved unchanged. Use **Outfit: Denim / Hiking** on the start, pause, or game-over panel to compare them; the browser remembers the selection. Both were generated with the built-in imagegen tool.

## Denim generation prompt

```text
Use case: stylized-concept
Asset type: alternate transparent pixel-art sprite atlas for Flappy Sarah.
Image 1: NEW subject/outfit reference. Image 2: STYLE AND ANIMATION LAYOUT reference, the previous four-frame Sarah sprite atlas. Create a new sprite set, matching its small retro pixel-art style and natural adult proportions.
One transparent square canvas with a precise 2 by 2 grid of four equally sized square cells, no gutters or labels. Each cell shows the same full-body adult woman hovering facing three-quarter RIGHT. Use the NEW photo: medium brown hair tied loosely back with strands framing her smiling face, uncovered eyes, blue denim jacket worn open with rolled sleeves, dark brown/purple sleeveless calf-length dress, small black crossbody bag with strap, gray/taupe strappy sandals and bare hands. Capture her cheerful open-mouth expression. No hat, glasses, hiking vest or hiking gear from the old sprite.
Use simple crisp pixel clusters and a limited palette, dark outlines, hard square edges. Aim for 64 by 64 logical pixels per cell enlarged cleanly. No smooth painted gradients or antialiasing.
Four arm-flap poses in reading order:
top-left: both arms diagonally UP overhead, preparing a downstroke;
top-right: arms stretched horizontally OUT;
bottom-left: arms swept diagonally DOWN and out, powerful downstroke;
bottom-right: arms relaxed diagonally outward for recovery.
Her jacketed arms are the wings: no bird wings or added props. Keep head, torso, bag, dress and legs at exactly the SAME position and size in every cell; only arms change pose. Center torso on each cell's exact center, keep feet trailing a little left in a hovering pose, with calf-length dress and sandals clearly readable. Natural full-body proportions, no giant head or chibi look. The entire character including extended hands must fit comfortably within each cell, with transparent margins. Each cell exactly the same framing. Genuinely transparent alpha background. No scenery, shadows, gridlines, text, labels, watermarks or extra characters.
```

## Hiking set

`sarah-flap.png` is a transparent 2 × 2 atlas generated with the built-in imagegen tool, using the user's hiking photo for Sarah's outfit and the original Sarah Jumps sprite for pixel-art style. Sarah Jumps keeps its original art.

Frames, in reading order: arms up, arms out, downstroke, recovery. The renderer plays a single stroke after each input, then holds the recovery pose. Pausing freezes the pose with the simulation. Reduced motion uses the recovery pose without rotation.

## Generation prompt

```text
Use case: stylized-concept
Asset type: transparent pixel-art sprite atlas for the browser game Flappy Sarah.
Input images: image 1 is the subject/outfit reference photo. Image 2 is the existing Sarah Jumps sprite and is the STYLE reference only.
Create ONE production-ready 2 by 2 sprite sheet on a genuinely transparent 1024 by 1024 canvas. Four equal 512 by 512 cells, no gutters, no labels. Each cell shows exactly the same small full-body adult woman in a hovering pose, facing three-quarter RIGHT. Match the small low-resolution retro pixel-art look of the style reference: simple angular clusters, limited palette, hard square pixel edges, natural adult proportions (not chibi), dark outline. Design each cell on a 64 by 64 pixel grid, enlarged 8 times with crisp nearest-neighbor edges. No antialiasing or smooth painted detail.
Use the new photo's recognizable outfit: vivid red hiking rain jacket, black hydration vest, dark charcoal trousers, gray hiking boots, gray gloves, navy patterned bandana and large dark sunglasses, brown hair, smiling face. Omit trekking poles. Her jacketed ARMS act as wings: this is a woman flapping her own arms, with no added bird wings.
Animation poses, reading left to right then top to bottom:
1 top-left: both arms lifted diagonally UP, ready for a downstroke.
2 top-right: both arms fully extended horizontally OUT.
3 bottom-left: both arms swept diagonally DOWN and outward, powerful downstroke.
4 bottom-right: arms relaxed diagonally outward halfway up, recovery/gliding.
Keep head, torso, legs, face, outfit, scale, perspective and position EXACTLY identical across all four cells; ONLY arms change pose. Torso center is at local x=256,y=256 in every cell. Head top is local y=112, feet end local y=416. Bent knees/feet trailing subtly to the left. Keep each sprite entirely inside its cell with generous transparent margins. Arms are clearly visible separated from torso. No scenery, shadows, ground, words, numbers, gridlines, extra characters or props. Preserve real alpha transparency everywhere outside the four figures.
```
