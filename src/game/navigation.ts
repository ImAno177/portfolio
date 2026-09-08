import room from "./data/room.json";
import type { ZoneId } from "./types";

export type Point = { x: number; y: number };
export const CELL = 16;
const key = (p: Point): string =>
  `${Math.floor(p.x / CELL)},${Math.floor(p.y / CELL)}`;
export const cellCenter = (p: Point): Point => ({
  x: Math.floor(p.x / CELL) * CELL + 8,
  y: Math.floor(p.y / CELL) * CELL + 8,
});
export function walkable(p: Point): boolean {
  if (
    !room.walkableAreas.some(
      ([x, y, w, h]) => p.x >= x && p.x < x + w && p.y >= y && p.y < y + h,
    )
  )
    return false;
  if (
    room.barriers.some(
      ([x, y, w, h]) => p.x >= x && p.x < x + w && p.y >= y && p.y < y + h,
    )
  )
    return false;
  return !room.objects.some(
    (item) =>
      item.footprint &&
      p.x >= item.footprint[0] &&
      p.x < item.footprint[0] + item.footprint[2] &&
      p.y >= item.footprint[1] &&
      p.y < item.footprint[1] + item.footprint[3],
  );
}
export function findPath(
  from: Point,
  to: Point,
  occupied: Point[] = [],
): Point[] {
  const start = cellCenter(from),
    goal = cellCenter(to);
  if (!walkable(start) || !walkable(goal)) return [];
  const open = [start],
    came = new Map<string, Point>(),
    cost = new Map([[key(start), 0]]);
  const estimate = (p: Point) =>
    Math.abs(p.x - goal.x) + Math.abs(p.y - goal.y);
  // ponytail: sorting at most 800 cells is sufficient for six cats; heap only for larger worlds.
  while (open.length) {
    open.sort(
      (a, b) =>
        cost.get(key(a))! + estimate(a) - (cost.get(key(b))! + estimate(b)),
    );
    const current = open.shift()!;
    if (key(current) === key(goal)) {
      const path: Point[] = [];
      let cursor = current;
      while (key(cursor) !== key(start)) {
        path.unshift(cursor);
        cursor = came.get(key(cursor))!;
      }
      if (!path.length && (from.x !== goal.x || from.y !== goal.y))
        path.push(goal);
      return path;
    }
    for (const [dx, dy] of [
      [16, 0],
      [-16, 0],
      [0, 16],
      [0, -16],
    ]) {
      const next = { x: current.x + dx, y: current.y + dy },
        id = key(next),
        g = cost.get(key(current))! + 16;
      if (
        !walkable(next) ||
        occupied.some((p) => Math.hypot(p.x - next.x, p.y - next.y) < 20) ||
        g >= (cost.get(id) ?? Infinity)
      )
        continue;
      cost.set(id, g);
      came.set(id, current);
      if (!open.some((p) => key(p) === id)) open.push(next);
    }
  }
  return [];
}
export function zoneSlots(zone: ZoneId): Point[] {
  return room.zones[zone].map(([x, y]) => ({ x, y }));
}
export function reserveDestination(
  zone: ZoneId,
  from: Point,
  occupied: Point[],
): { point: Point; path: Point[] } | undefined {
  for (const point of zoneSlots(zone)) {
    if (occupied.some((p) => key(p) === key(point))) continue;
    const path = findPath(from, point);
    if (path.length || (from.x === point.x && from.y === point.y))
      return { point, path };
  }
  return undefined;
}
