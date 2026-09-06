# HERO RUSH key art

Generate, save, and visually match ONE named character before moving to the next. Never assign filenames to a batch afterward. All designs are original; no names, logos or artwork from external games.

Shared prefix:

```
stylized fantasy mobile-game character, clean bold lineart, cel shading with soft gradients,
2.5–3 head proportion, chunky readable silhouette, saturated palette, single top-left key light,
full body, three-quarter side view facing RIGHT, feet on invisible floor, centered,
plain solid #00FF00 background, no text, no watermark, no frame
```

For enemies use `facing LEFT` and `desaturated murky green-purple`.

| Save as | Descriptor |
|---|---|
| ironwall.png | heavy plate armor, tower shield, war hammer, bearded stoic man |
| lancer.png | light silver lance, blue scarf, athletic woman, ponytail |
| shade.png | hooded assassin, twin curved daggers, purple shadow wisps, young man |
| ember.png | red-orange robe, floating flame orbs, staff with ruby, young woman |
| hawkeye.png | leather ranger, longbow, green cloak, sharp eyes, young man |
| lumen.png | white-gold priestess robe, glowing halo ring, harp, gentle expression |
| grunt.png | goblin soldier, rusty sword, wooden shield |
| slinger.png | goblin with sling and pouch |
| shaman.png | swamp shaman, bone staff, skull mask |
| brute.png | giant ogre, spiked club, scars |

Keep the entire body and weapon inside a 1024 × 1024 canvas. Verify feet and silhouette at 220px height. Enemies face left in the source; do not flip lighting in the renderer.

Processing (Pillow required; `rembg` optional):

```
python3 tools/rembg.py raw/ironwall.png ironwall --background green
python3 tools/pack-atlas.py
```

The single 2048² atlas contains all ten key-art frames and portraits. Existing supplied art is already exported into this format; `public/assets/PROVENANCE.md` lists mappings and remaining visual differences from the brief. Animation is procedural in `UnitView.ts`. Background layers currently use original native canvas scenery (sky, ruins, ground), at 0.1 / 0.4 / 1.0 parallax.

Optional final background prompt: `side-scrolling fantasy goblin marsh, horizontal earthen path at 76 percent canvas height, ancient broken arch, pale warm moon behind teal mist, large mossy trees, foreground reeds, quiet muted green palette, painterly soft edges, no characters, no UI, seamless horizontal composition, 3840x1080`. Export sky, distant vegetation and ground separately if replacing the procedural layers.
