import { AnimalEntity, FarmPlot, ResourceNode } from './types';

export const MAP_W = 26;
export const MAP_H = 20;

export type HomesteadTile =
  | 'GRASS'
  | 'PATH'
  | 'WATER'
  | 'BRIDGE'
  | 'CLIFF'
  | 'FARM_BED'
  | 'STONE_PAD';

export interface HomesteadInteractable {
  id: string;
  kind:
    | 'COTTAGE_DOOR'
    | 'SHIPPING_BIN'
    | 'QUEST_BOARD'
    | 'FORGE'
    | 'RUNE_SHRINE'
    | 'DUNGEON_PORTAL';
  tileX: number;
  tileY: number;
  radius: number;
  labelEn: string;
  labelId: string;
}

export interface TreeProp {
  x: number;
  y: number;
  kind: 'SAKURA' | 'OAK';
}

export const HOMESTEAD_INTERACTABLES: HomesteadInteractable[] = [
  {
    id: 'cottage_door',
    kind: 'COTTAGE_DOOR',
    tileX: 5,
    tileY: 8,
    radius: 1.5,
    labelEn: 'Sleep / Next Day',
    labelId: 'Tidur / Hari Baru',
  },
  {
    id: 'shipping_bin',
    kind: 'SHIPPING_BIN',
    tileX: 8,
    tileY: 7,
    radius: 1.4,
    labelEn: 'Sell & Seed Shop',
    labelId: 'Jual & Toko Bibit',
  },
  {
    id: 'quest_board',
    kind: 'QUEST_BOARD',
    tileX: 9,
    tileY: 8,
    radius: 1.4,
    labelEn: 'Bounty Board',
    labelId: 'Papan Misi',
  },
  {
    id: 'forge_station',
    kind: 'FORGE',
    tileX: 4,
    tileY: 16,
    radius: 1.7,
    labelEn: 'Blacksmith Forge',
    labelId: 'Bengkel Pandai Besi',
  },
  {
    id: 'rune_shrine',
    kind: 'RUNE_SHRINE',
    tileX: 15,
    tileY: 11,
    radius: 1.5,
    labelEn: 'Heal & Save Shrine',
    labelId: 'Kuil Pulih & Simpan',
  },
  {
    id: 'dungeon_portal',
    kind: 'DUNGEON_PORTAL',
    tileX: 20,
    tileY: 5,
    radius: 1.6,
    labelEn: 'Enter Abyss Dungeon',
    labelId: 'Masuk Dungeon Jurang',
  },
];

export const TREES: TreeProp[] = [
  { x: 1.5, y: 2.5, kind: 'OAK' },
  { x: 1.5, y: 8.5, kind: 'OAK' },
  { x: 10.2, y: 7.2, kind: 'SAKURA' },
  { x: 15.2, y: 2.2, kind: 'OAK' },
  { x: 24.0, y: 3.0, kind: 'OAK' },
  { x: 23.8, y: 9.2, kind: 'OAK' },
  { x: 1.4, y: 13.5, kind: 'OAK' },
  { x: 15.5, y: 18.2, kind: 'SAKURA' },
  { x: 19.5, y: 18.4, kind: 'SAKURA' },
  { x: 24.2, y: 17.5, kind: 'OAK' },
];

export function buildHomesteadGrid(): {
  tiles: HomesteadTile[][];
  solid: boolean[][];
} {
  const tiles: HomesteadTile[][] = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => 'GRASS' as HomesteadTile)
  );
  const solid: boolean[][] = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => false)
  );

  const paintRect = (
    x0: number,
    y0: number,
    w: number,
    h: number,
    tile: HomesteadTile,
    isSolid = false
  ) => {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W) {
          tiles[y][x] = tile;
          solid[y][x] = isSolid;
        }
      }
    }
  };

  // Perimeter cliffs at top
  paintRect(0, 0, MAP_W, 2, 'CLIFF', true);
  paintRect(9, 0, 5, 4, 'CLIFF', true);
  paintRect(17, 1, 7, 3, 'CLIFF', true);

  // Waterfall & winding blue river (matching reference layout)
  paintRect(10, 1, 3, 4, 'WATER', true);
  paintRect(11, 5, 5, 2, 'WATER', true);
  paintRect(15, 7, 2, 7, 'WATER', true);
  paintRect(12, 13, 5, 2, 'WATER', true);
  paintRect(11, 15, 2, 5, 'WATER', true);

  // Bridges over the river
  paintRect(13, 5, 2, 2, 'BRIDGE', false); // Upper bridge toward dungeon
  paintRect(11, 15, 2, 2, 'BRIDGE', false); // Lower bridge

  // Dirt paths connecting Cottage, Farm, Crossroads, Forge, and Dungeon Bridge
  paintRect(5, 8, 2, 2, 'PATH', false);
  paintRect(6, 9, 7, 2, 'PATH', false);
  paintRect(10, 7, 4, 2, 'PATH', false);
  paintRect(11, 10, 2, 9, 'PATH', false);
  paintRect(7, 15, 5, 2, 'PATH', false);
  paintRect(13, 7, 2, 2, 'PATH', false); // Up to bridge
  paintRect(15, 5, 5, 2, 'STONE_PAD', false); // Approach to dungeon portal

  // Dungeon stone platform & skull arch
  paintRect(18, 3, 5, 3, 'STONE_PAD', false);
  solid[3][18] = true;
  solid[3][19] = true;
  solid[3][20] = true; // Arch back wall
  solid[3][21] = true;
  solid[3][22] = true;
  solid[4][18] = true;
  solid[4][22] = true;

  // Cottage footprint (solid) at x: 3..7, y: 4..7
  for (let y = 4; y <= 7; y++) {
    for (let x = 3; x <= 7; x++) {
      solid[y][x] = true;
    }
  }
  // Shipping bin & Quest board solid
  solid[6][8] = true;
  solid[7][9] = true;

  // Farm Bed visual area (walkable soil inside fence)
  paintRect(3, 10, 6, 5, 'FARM_BED', false);
  // Wooden fence perimeter around farm (leaving gate open at x=8..9, y=12)
  for (let x = 2; x <= 8; x++) {
    solid[9][x] = true;
    solid[15][x] = true;
  }
  for (let y = 9; y <= 15; y++) {
    solid[y][2] = true;
    if (y !== 12 && y !== 11) {
      solid[y][9] = true;
    }
  }

  // Blacksmith furnace & anvil solid spots
  solid[16][3] = true;
  solid[16][5] = true;

  // Rune Shrine solid crystal pedestal
  solid[11][15] = true;

  // Tree trunk collisions
  for (const t of TREES) {
    const tx = Math.floor(t.x);
    const ty = Math.floor(t.y);
    if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H) {
      solid[ty][tx] = true;
    }
  }

  // Border bounds
  for (let x = 0; x < MAP_W; x++) {
    solid[0][x] = true;
    solid[MAP_H - 1][x] = true;
  }
  for (let y = 0; y < MAP_H; y++) {
    solid[y][0] = true;
    solid[y][MAP_W - 1] = true;
  }

  return { tiles, solid };
}

export function createInitialFarmPlots(): FarmPlot[] {
  const plots: FarmPlot[] = [];
  // Four 2x2 beds matching the reference image's neat wooden garden squares
  const bedCoords = [
    // Top-left bed (tomatoes pre-growing!)
    { x: 3, y: 10, crop: 'tomato' as const, stage: 3, watered: false },
    { x: 4, y: 10, crop: 'tomato' as const, stage: 3, watered: false },
    { x: 3, y: 11, crop: 'tomato' as const, stage: 2, watered: false },
    { x: 4, y: 11, crop: 'tomato' as const, stage: 2, watered: false },
    // Top-right bed (corn pre-growing!)
    { x: 6, y: 10, crop: 'corn' as const, stage: 3, watered: false },
    { x: 7, y: 10, crop: 'corn' as const, stage: 3, watered: false },
    { x: 6, y: 11, crop: null, stage: 0, watered: false },
    { x: 7, y: 11, crop: null, stage: 0, watered: false },
    // Bottom-left bed (turnips ready to harvest!)
    { x: 3, y: 13, crop: 'turnip' as const, stage: 3, watered: false },
    { x: 4, y: 13, crop: 'turnip' as const, stage: 3, watered: false },
    { x: 3, y: 14, crop: null, stage: 0, watered: false },
    { x: 4, y: 14, crop: null, stage: 0, watered: false },
    // Bottom-right bed (empty fertile beds ready to plant)
    { x: 6, y: 13, crop: null, stage: 0, watered: false },
    { x: 7, y: 13, crop: null, stage: 0, watered: false },
    { x: 6, y: 14, crop: null, stage: 0, watered: false },
    { x: 7, y: 14, crop: null, stage: 0, watered: false },
  ];

  bedCoords.forEach((b, i) => {
    plots.push({
      id: `plot_${i}`,
      tileX: b.x,
      tileY: b.y,
      cropId: b.crop,
      stage: b.stage,
      watered: b.watered,
    });
  });
  return plots;
}

export function createInitialResourceNodes(): ResourceNode[] {
  return [
    { id: 'crys_1', tileX: 20, tileY: 12, kind: 'CRYSTAL_ROCK', hp: 3, maxHp: 3, depletedDay: null },
    { id: 'crys_2', tileX: 22, tileY: 13, kind: 'CRYSTAL_ROCK', hp: 3, maxHp: 3, depletedDay: null },
    { id: 'crys_3', tileX: 21, tileY: 15, kind: 'CRYSTAL_ROCK', hp: 3, maxHp: 3, depletedDay: null },
    { id: 'stone_1', tileX: 19, tileY: 14, kind: 'STONE_ROCK', hp: 2, maxHp: 2, depletedDay: null },
    { id: 'stone_2', tileX: 23, tileY: 11, kind: 'STONE_ROCK', hp: 2, maxHp: 2, depletedDay: null },
    { id: 'stump_1', tileX: 18, tileY: 10, kind: 'TIMBER_STUMP', hp: 2, maxHp: 2, depletedDay: null },
    { id: 'stump_2', tileX: 20, tileY: 17, kind: 'TIMBER_STUMP', hp: 2, maxHp: 2, depletedDay: null },
    { id: 'stump_3', tileX: 8, tileY: 18, kind: 'TIMBER_STUMP', hp: 2, maxHp: 2, depletedDay: null },
  ];
}

export function createInitialAnimals(): AnimalEntity[] {
  return [
    {
      id: 'chicken_1',
      kind: 'CHICKEN',
      x: 7.5,
      y: 16.8,
      homeX: 7.5,
      homeY: 16.8,
      vx: 0,
      vy: 0,
      waitTimer: 1.2,
      facing: 'right',
      bobPhase: 0,
      readyToPetDay: 0,
    },
    {
      id: 'sheep_1',
      kind: 'SHEEP',
      x: 9.2,
      y: 17.5,
      homeX: 9.2,
      homeY: 17.5,
      vx: 0,
      vy: 0,
      waitTimer: 2.0,
      facing: 'left',
      bobPhase: 1.5,
      readyToPetDay: 0,
    },
    {
      id: 'slime_buddy',
      kind: 'SLIME_BUDDY',
      x: 13.6,
      y: 11.4,
      homeX: 13.6,
      homeY: 11.4,
      vx: 0,
      vy: 0,
      waitTimer: 0.8,
      facing: 'left',
      bobPhase: 0.6,
      readyToPetDay: 0,
    },
  ];
}
