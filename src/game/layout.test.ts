import { expect, it } from "vitest";
import room from "./data/room.json";
import atlas from "./data/atlas.json";
import { findPath } from "./navigation";

it("the studio has usable kitchen appliances and distinct dining furniture", () => {
  for (const id of [
    "fridge",
    "stove",
    "sink",
    "kitchen-counter",
    "dining-table",
    "dining-chair",
  ]) {
    const item = room.objects.find((o) => o.id === id);
    expect(item, id).toBeDefined();
    expect(item?.footprint, id).toBeDefined();
  }
  // Clear aisle in front of the kitchen, reachable from the central floor.
  for (const point of [
    { x: 88, y: 184 },
    { x: 152, y: 184 },
    { x: 216, y: 184 },
  ])
    expect(findPath({ x: 312, y: 328 }, point).length).toBeGreaterThan(0);
});

const bounds = (item: (typeof room.objects)[number]) => {
  const [, , w, h] = atlas.frames[item.frame as keyof typeof atlas.frames].rect;
  return [item.x, item.y, w * room.scale, h * room.scale];
};
const overlaps = ([x, y, w, h]: number[], [a, b, c, d]: number[]) =>
  x < a + c && x + w > a && y < b + d && y + h > b;

it("kitchen work surfaces separate the sink from the cooker", () => {
  const ids = ["fridge", "sink", "kitchen-counter", "stove"];
  const items = ids.map((id) => room.objects.find((o) => o.id === id)!);
  for (let i = 1; i < items.length; i++)
    expect(items[i].x).toBeGreaterThanOrEqual(
      items[i - 1].x + bounds(items[i - 1])[2],
    );
});

it("bookcase and sofa backs are supported by visible wall, not open floor", () => {
  for (const id of ["shelf", "clock", "sofa"]) {
    const item = room.objects.find((o) => o.id === id)!;
    const [x, y, w] = bounds(item);
    expect(
      room.tiles.some(
        (t) =>
          t.frame === "wall" &&
          x >= t.x &&
          x + w <= t.x + t.cols * 32 &&
          y >= t.y &&
          y < t.y + t.rows * 32,
      ),
      id,
    ).toBe(true);
  }
});

it("dining chairs belong to the table and leave the central aisle open", () => {
  const table = room.objects.find((o) => o.id === "dining-table")!;
  for (const chair of room.objects.filter((o) =>
    o.id.startsWith("dining-chair"),
  )) {
    expect(chair.x + bounds(chair)[2] / 2).toBe(table.x + bounds(table)[2] / 2);
    expect(
      Math.abs(chair.footprint![1] - table.footprint![1]),
    ).toBeLessThanOrEqual(64);
  }
  expect(
    findPath({ x: 312, y: 328 }, { x: 312, y: 216 }).every((p) => p.x === 312),
  ).toBe(true);
});

it("bookcases stand on the floor against solid wall, not over glass", () => {
  for (const item of room.objects.filter(
    (o) => o.frame === "shelf" || o.frame === "books",
  )) {
    const rect = bounds(item);
    expect(rect[1] + rect[3], item.id).toBeGreaterThanOrEqual(160);
    for (const window of room.skyWindows)
      expect(overlaps(rect, window), item.id).toBe(false);
  }
});

it("lamp bases rest on a table, outside sofa seating", () => {
  const sofa = bounds(room.objects.find((o) => o.id === "sofa")!);
  const tables = room.objects.filter(
    (o) => o.frame === "desk" || o.frame === "table",
  );
  for (const lamp of room.objects.filter((o) => o.frame === "lamp")) {
    // Hand-inspected lamp crop: pedestal at source (8,28); tables have a top in their first 12px.
    const foot = [lamp.x + 16, lamp.y + 56];
    expect(overlaps(bounds(lamp), sofa), lamp.id).toBe(false);
    expect(
      tables.some((t) => {
        const [x, y, w] = bounds(t);
        return (
          foot[0] >= x && foot[0] < x + w && foot[1] >= y && foot[1] <= y + 24
        );
      }),
      lamp.id,
    ).toBe(true);
  }
});

it("solid furniture bases do not occupy each other", () => {
  const solids = room.objects.filter((o) => o.footprint);
  for (let i = 0; i < solids.length; i++)
    for (let j = i + 1; j < solids.length; j++)
      expect(
        overlaps(solids[i].footprint!, solids[j].footprint!),
        `${solids[i].id}/${solids[j].id}`,
      ).toBe(false);
});
