export type AssetKind = "cat-sprite" | "sky" | "interior-atlas" | "reference";

export interface AssetEntry {
  id: string;
  label: string;
  path: string;
  kind: AssetKind;
  source: string;
  license: string;
}

export const ASSET_ENTRIES: readonly AssetEntry[] = [
  { id: "cat-1", label: "Cat variant 01", path: "/assets/cats/cat-1.png", kind: "cat-sprite", source: "assets/Free pack/Free pack/cat 1.png", license: "user-supplied; provenance unverified" },
  { id: "cat-1-6", label: "Cat variant 01.6", path: "/assets/cats/cat-1-6.png", kind: "cat-sprite", source: "assets/Free pack/Free pack/cat 1.6.png", license: "user-supplied; provenance unverified" },
  { id: "cat-1-9", label: "Cat variant 01.9", path: "/assets/cats/cat-1-9.png", kind: "cat-sprite", source: "assets/Free pack/Free pack/cat 1.9.png", license: "user-supplied; provenance unverified" },
  { id: "cat-text", label: "Cat text variant", path: "/assets/cats/cat-text.png", kind: "cat-sprite", source: "assets/Free pack/Free pack/cat 16x16 with text.png", license: "user-supplied; provenance unverified" },
  { id: "cat-frame-indexes", label: "Cat frame index reference", path: "/assets/reference/cat-frame-indexes.png", kind: "reference", source: "assets/Free pack/Free pack/Frame indexes.png", license: "user-supplied reference" },
  { id: "craftpix-coupon", label: "CraftPix source coupon", path: "/assets/reference/craftpix-coupon.png", kind: "reference", source: "assets/New free backgrounds part1/COUPON.png", license: "CraftPix freebie terms" },
  { id: "sky-01-orig", label: "Sky family 01", path: "/assets/sky/sky-01-orig.png", kind: "sky", source: "assets/New free backgrounds part1/background 1/orig.png", license: "CraftPix freebie terms" },
  { id: "sky-01-orig-big", label: "Sky family 01 large", path: "/assets/sky/sky-01-orig-big.png", kind: "sky", source: "assets/New free backgrounds part1/background 1/orig_big.png", license: "CraftPix freebie terms" },
  { id: "sky-01-layer-1", label: "Sky 01 layer 1", path: "/assets/sky/sky-01-layer-1.png", kind: "sky", source: "assets/New free backgrounds part1/background 1/1.png", license: "CraftPix freebie terms" },
  { id: "sky-01-layer-2", label: "Sky 01 layer 2", path: "/assets/sky/sky-01-layer-2.png", kind: "sky", source: "assets/New free backgrounds part1/background 1/2.png", license: "CraftPix freebie terms" },
  { id: "sky-01-layer-3", label: "Sky 01 layer 3", path: "/assets/sky/sky-01-layer-3.png", kind: "sky", source: "assets/New free backgrounds part1/background 1/3.png", license: "CraftPix freebie terms" },
  { id: "sky-01-layer-4", label: "Sky 01 layer 4", path: "/assets/sky/sky-01-layer-4.png", kind: "sky", source: "assets/New free backgrounds part1/background 1/4.png", license: "CraftPix freebie terms" },
  { id: "sky-02-orig", label: "Sky family 02", path: "/assets/sky/sky-02-orig.png", kind: "sky", source: "assets/New free backgrounds part1/background 2/orig.png", license: "CraftPix freebie terms" },
  { id: "sky-02-orig-big", label: "Sky family 02 large", path: "/assets/sky/sky-02-orig-big.png", kind: "sky", source: "assets/New free backgrounds part1/background 2/orig_big.png", license: "CraftPix freebie terms" },
  { id: "sky-02-layer-1", label: "Sky 02 layer 1", path: "/assets/sky/sky-02-layer-1.png", kind: "sky", source: "assets/New free backgrounds part1/background 2/1.png", license: "CraftPix freebie terms" },
  { id: "sky-02-layer-2", label: "Sky 02 layer 2", path: "/assets/sky/sky-02-layer-2.png", kind: "sky", source: "assets/New free backgrounds part1/background 2/2.png", license: "CraftPix freebie terms" },
  { id: "sky-02-layer-3", label: "Sky 02 layer 3", path: "/assets/sky/sky-02-layer-3.png", kind: "sky", source: "assets/New free backgrounds part1/background 2/3.png", license: "CraftPix freebie terms" },
  { id: "sky-02-layer-4", label: "Sky 02 layer 4", path: "/assets/sky/sky-02-layer-4.png", kind: "sky", source: "assets/New free backgrounds part1/background 2/4.png", license: "CraftPix freebie terms" },
  { id: "sky-02-layer-5", label: "Sky 02 layer 5", path: "/assets/sky/sky-02-layer-5.png", kind: "sky", source: "assets/New free backgrounds part1/background 2/5.png", license: "CraftPix freebie terms" },
  { id: "sky-03-orig", label: "Sky family 03", path: "/assets/sky/sky-03-orig.png", kind: "sky", source: "assets/New free backgrounds part1/background 3/orig.png", license: "CraftPix freebie terms" },
  { id: "sky-03-orig-big", label: "Sky family 03 large", path: "/assets/sky/sky-03-orig-big.png", kind: "sky", source: "assets/New free backgrounds part1/background 3/orig_big.png", license: "CraftPix freebie terms" },
  { id: "sky-03-layer-1", label: "Sky 03 layer 1", path: "/assets/sky/sky-03-layer-1.png", kind: "sky", source: "assets/New free backgrounds part1/background 3/1.png", license: "CraftPix freebie terms" },
  { id: "sky-03-layer-2", label: "Sky 03 layer 2", path: "/assets/sky/sky-03-layer-2.png", kind: "sky", source: "assets/New free backgrounds part1/background 3/2.png", license: "CraftPix freebie terms" },
  { id: "sky-03-layer-3", label: "Sky 03 layer 3", path: "/assets/sky/sky-03-layer-3.png", kind: "sky", source: "assets/New free backgrounds part1/background 3/3.png", license: "CraftPix freebie terms" },
  { id: "sky-03-layer-4", label: "Sky 03 layer 4", path: "/assets/sky/sky-03-layer-4.png", kind: "sky", source: "assets/New free backgrounds part1/background 3/4.png", license: "CraftPix freebie terms" },
  { id: "sky-04-orig", label: "Sky family 04", path: "/assets/sky/sky-04-orig.png", kind: "sky", source: "assets/New free backgrounds part1/background 4/orig.png", license: "CraftPix freebie terms" },
  { id: "sky-04-orig-big", label: "Sky family 04 large", path: "/assets/sky/sky-04-orig-big.png", kind: "sky", source: "assets/New free backgrounds part1/background 4/orig_big.png", license: "CraftPix freebie terms" },
  { id: "sky-04-layer-1", label: "Sky 04 layer 1", path: "/assets/sky/sky-04-layer-1.png", kind: "sky", source: "assets/New free backgrounds part1/background 4/1.png", license: "CraftPix freebie terms" },
  { id: "sky-04-layer-2", label: "Sky 04 layer 2", path: "/assets/sky/sky-04-layer-2.png", kind: "sky", source: "assets/New free backgrounds part1/background 4/2.png", license: "CraftPix freebie terms" },
  { id: "sky-04-layer-3", label: "Sky 04 layer 3", path: "/assets/sky/sky-04-layer-3.png", kind: "sky", source: "assets/New free backgrounds part1/background 4/3.png", license: "CraftPix freebie terms" },
  { id: "sky-04-layer-4", label: "Sky 04 layer 4", path: "/assets/sky/sky-04-layer-4.png", kind: "sky", source: "assets/New free backgrounds part1/background 4/4.png", license: "CraftPix freebie terms" },
  { id: "interior-doors", label: "Doors and windows atlas", path: "/assets/interior/doors-windows.png", kind: "interior-atlas", source: "assets/Top-Down_Retro_Interior/TopDownHouse_DoorsAndWindows.png", license: "user-supplied; provenance unverified" },
  { id: "interior-floors", label: "Floors and walls atlas", path: "/assets/interior/floors-walls.png", kind: "interior-atlas", source: "assets/Top-Down_Retro_Interior/TopDownHouse_FloorsAndWalls.png", license: "user-supplied; provenance unverified" },
  { id: "interior-open-doors", label: "Open doors atlas", path: "/assets/interior/floors-walls-open-doors.png", kind: "interior-atlas", source: "assets/Top-Down_Retro_Interior/TopDownHouse_FloorsAndWalls_OpenDoors.png", license: "user-supplied; provenance unverified" },
  { id: "interior-furniture-1", label: "Furniture state 1", path: "/assets/interior/furniture-state-1.png", kind: "interior-atlas", source: "assets/Top-Down_Retro_Interior/TopDownHouse_FurnitureState1.png", license: "user-supplied; provenance unverified" },
  { id: "interior-furniture-2", label: "Furniture state 2", path: "/assets/interior/furniture-state-2.png", kind: "interior-atlas", source: "assets/Top-Down_Retro_Interior/TopDownHouse_FurnitureState2.png", license: "user-supplied; provenance unverified" },
  { id: "interior-small-items", label: "Small items atlas", path: "/assets/interior/small-items.png", kind: "interior-atlas", source: "assets/Top-Down_Retro_Interior/TopDownHouse_SmallItems.png", license: "user-supplied; provenance unverified" }
];

export const PRODUCTION_ASSET_PATHS = ASSET_ENTRIES.map((asset) => asset.path);
