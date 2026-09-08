import { readFileSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";
import sharp from "sharp";

const atlas = JSON.parse(readFileSync("src/game/data/atlas.json", "utf8"));
const room = JSON.parse(readFileSync("src/game/data/room.json", "utf8"));
const source = (path) => `public/assets/${path}`;
const crops = new Map();
async function crop(path, rect, name) {
  const [left, top, width, height] = rect;
  const metadata = await sharp(path).metadata();
  assert(
    left >= 0 &&
      top >= 0 &&
      width > 0 &&
      height > 0 &&
      left + width <= metadata.width &&
      top + height <= metadata.height,
    `${name}: outside sheet`,
  );
  const image = sharp(path).extract({ left, top, width, height });
  const { data, info } = await image
    .clone()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert(
    data.some((value, i) => i % info.channels === 3 && value > 0),
    `${name}: empty frame`,
  );
  return image.png().toBuffer();
}
for (const [name, frame] of Object.entries(atlas.frames)) {
  assert(frame.role, `${name}: missing scene role`);
  crops.set(
    name,
    await crop(source(atlas.textures[frame.texture]), frame.rect, name),
  );
}
let checked = 0;
for (const texture of atlas.cats.textures) {
  for (const [name, clip] of Object.entries(atlas.cats.clips)) {
    assert(clip.duration > 0 && clip.count > 0, name);
    for (let i = 0; i < clip.count; i++) {
      await crop(
        source(`cats/${texture}.png`),
        [(i + (clip.start ?? 0)) * 32, clip.row * 32, 32, 32],
        `${texture}/${name}/${i}`,
      );
      checked++;
    }
  }
}
for (const item of [...room.tiles, ...room.objects])
  assert(crops.has(item.frame), `Unknown frame: ${item.frame}`);
console.log(
  `Validated ${crops.size} interior frames and ${checked} animation frame references: bounds, alpha and roles.`,
);

// The fallback uses exactly the scene's atlas, coordinates and draw order.
if (process.argv.includes("--render")) {
  const layers = [];
  const add = async (frame, x, y, width, height, depth) => {
    const input = await sharp(crops.get(frame))
      .resize(width, height, { kernel: "nearest" })
      .png()
      .toBuffer();
    const clipped = await sharp(input)
      .extract({
        left: 0,
        top: 0,
        width: Math.min(width, room.width - x),
        height: Math.min(height, room.height - y),
      })
      .png()
      .toBuffer();
    layers.push({ input: clipped, left: x, top: y, depth });
  };
  for (const tile of room.tiles)
    for (let y = 0; y < tile.rows; y++)
      for (let x = 0; x < tile.cols; x++)
        await add(
          tile.frame,
          tile.x + x * 32,
          tile.y + y * 32,
          32,
          32,
          tile.depth,
        );
  const [skyX,skyY,skyW,skyH] = room.skyRect;
  const sky = await sharp(source("sky/sky-04-orig.png")).resize(skyW,skyH,{kernel:"nearest"}).png().toBuffer();
  for (const [x, y, width, height] of room.skyWindows)
    layers.push({
      input: await sharp(sky)
        .extract({left:x-skyX,top:y-skyY,width,height})
        .png()
        .toBuffer(),
      left: x,
      top: y,
      depth: 1.5,
    });
  for (const [x, y, w, h] of room.beams) await add("beam", x, y, w, h, 3);
  for (const item of room.objects) {
    const [, , w, h] = atlas.frames[item.frame].rect;
    for (let y = 0; y < (item.repeat?.[1] ?? 1); y++)
      for (let x = 0; x < (item.repeat?.[0] ?? 1); x++)
        await add(
          item.frame,
          item.x + x * w * 2,
          item.y + y * h * 2,
          w * 2,
          h * 2,
          item.depth,
        );
  }
  layers.sort((a, b) => a.depth - b.depth);
  mkdirSync("public/assets/room", { recursive: true });
  await sharp({
    create: { width: 640, height: 360, channels: 4, background: "#33231f" },
  })
    .composite(layers.map(({ depth, ...layer }) => layer))
    .png()
    .toFile("public/assets/room/fallback.png");
  console.log("Rendered fallback from shared room data.");
}
