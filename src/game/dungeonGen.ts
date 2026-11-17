import { DungeonEntity, DungeonFloor, DungeonTileType, EnemyArchetypeId } from './types';

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickEncounterForFloor(floor: number): EnemyArchetypeId[] {
  if (floor === 1) {
    const pools: EnemyArchetypeId[][] = [
      ['slime_void', 'slime_void'],
      ['goblin_raider'],
      ['slime_void', 'shadow_bat'],
      ['goblin_raider', 'slime_void'],
    ];
    return pools[randInt(0, pools.length - 1)];
  }
  if (floor === 2) {
    const pools: EnemyArchetypeId[][] = [
      ['goblin_raider', 'bone_archer'],
      ['shadow_bat', 'shadow_bat', 'slime_void'],
      ['goblin_raider', 'goblin_raider'],
      ['bone_archer', 'slime_void'],
    ];
    return pools[randInt(0, pools.length - 1)];
  }
  if (floor === 3) {
    const pools: EnemyArchetypeId[][] = [
      ['crystal_golem'],
      ['goblin_raider', 'bone_archer', 'shadow_bat'],
      ['crystal_golem', 'slime_void'],
    ];
    return pools[randInt(0, pools.length - 1)];
  }
  if (floor === 4) {
    const pools: EnemyArchetypeId[][] = [
      ['crystal_golem', 'bone_archer'],
      ['goblin_raider', 'goblin_raider', 'shadow_bat'],
      ['crystal_golem', 'shadow_bat'],
    ];
    return pools[randInt(0, pools.length - 1)];
  }
  return ['crystal_golem', 'bone_archer', 'goblin_raider'];
}

export function generateDungeonFloor(floorNumber: number): DungeonFloor {
  const width = 32;
  const height = 24;
  const tiles: DungeonTileType[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => 0)
  );
  const explored: boolean[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => false)
  );

  const rooms: Room[] = [];
  const attempts = 38;

  for (let i = 0; i < attempts && rooms.length < 7; i++) {
    const w = randInt(5, 7);
    const h = randInt(5, 6);
    const x = randInt(2, width - w - 3);
    const y = randInt(2, height - h - 3);

    const overlaps = rooms.some(
      (r) => x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y
    );
    if (overlaps) continue;

    for (let ry = y; ry < y + h; ry++) {
      for (let rx = x; rx < x + w; rx++) {
        tiles[ry][rx] = 1;
      }
    }
    rooms.push({
      x,
      y,
      w,
      h,
      cx: Math.floor(x + w / 2),
      cy: Math.floor(y + h / 2),
    });
  }

  // Fallback guaranteed 2 rooms if random placement was sparse
  if (rooms.length < 3) {
    const fallback: Room[] = [
      { x: 3, y: 9, w: 6, h: 6, cx: 6, cy: 12 },
      { x: 13, y: 9, w: 6, h: 6, cx: 16, cy: 12 },
      { x: 23, y: 9, w: 6, h: 6, cx: 26, cy: 12 },
    ];
    for (const r of fallback) {
      for (let ry = r.y; ry < r.y + r.h; ry++) {
        for (let rx = r.x; rx < r.x + r.w; rx++) {
          tiles[ry][rx] = 1;
        }
      }
      rooms.push(r);
    }
  }

  // Connect rooms sequentially with wide stone corridors
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1];
    const b = rooms[i];
    let x = a.cx;
    let y = a.cy;
    while (x !== b.cx) {
      tiles[y][x] = 1;
      if (y + 1 < height - 1) tiles[y + 1][x] = 1;
      x += x < b.cx ? 1 : -1;
    }
    while (y !== b.cy) {
      tiles[y][x] = 1;
      if (x + 1 < width - 1) tiles[y][x + 1] = 1;
      y += y < b.cy ? 1 : -1;
    }
  }

  const startRoom = rooms[0];
  const lastRoom = rooms[rooms.length - 1];
  const entities: DungeonEntity[] = [];

  // Return portal in start room
  entities.push({
    id: `ret_${floorNumber}`,
    kind: 'RETURN_PORTAL',
    tileX: startRoom.x + 1,
    tileY: startRoom.y + 1,
  });

  // Boss or Stairs in final room
  if (floorNumber === 3 || floorNumber === 5) {
    const bossType: EnemyArchetypeId =
      floorNumber === 3 ? 'crimson_minotaur' : 'abyssal_lich';
    entities.push({
      id: `boss_${floorNumber}`,
      kind: 'ENEMY',
      tileX: lastRoom.cx,
      tileY: lastRoom.cy,
      enemyGroup: floorNumber === 5 ? ['abyssal_lich'] : ['crimson_minotaur', 'slime_void'],
      isBoss: true,
    });
    if (floorNumber < 5) {
      entities.push({
        id: `stairs_${floorNumber}`,
        kind: 'STAIRS',
        tileX: lastRoom.x + lastRoom.w - 2,
        tileY: lastRoom.y + 1,
      });
    }
    // Add boss room treasure chest
    entities.push({
      id: `chest_boss_${floorNumber}`,
      kind: 'CHEST',
      tileX: lastRoom.x + 1,
      tileY: lastRoom.y + lastRoom.h - 2,
      opened: false,
    });
    void bossType;
  } else {
    entities.push({
      id: `stairs_${floorNumber}`,
      kind: 'STAIRS',
      tileX: lastRoom.cx,
      tileY: lastRoom.cy,
    });
  }

  // Populate middle rooms with Enemies, Rune Blessing Altar, Chests, Fountain, and Ore
  for (let i = 1; i < rooms.length - 1; i++) {
    const r = rooms[i];
    if (i === 1) {
      // Combat + Chest
      entities.push({
        id: `enemy_${floorNumber}_${i}`,
        kind: 'ENEMY',
        tileX: r.cx,
        tileY: r.cy,
        enemyGroup: pickEncounterForFloor(floorNumber),
      });
      entities.push({
        id: `chest_${floorNumber}_${i}`,
        kind: 'CHEST',
        tileX: r.x + 1,
        tileY: r.y + 1,
        opened: false,
      });
    } else if (i === 2) {
      // Rune Blessing Altar + Ore
      entities.push({
        id: `altar_${floorNumber}`,
        kind: 'ALTAR',
        tileX: r.cx,
        tileY: r.cy,
        opened: false,
      });
      entities.push({
        id: `ore_${floorNumber}_${i}`,
        kind: 'ORE',
        tileX: r.x + r.w - 2,
        tileY: r.y + 1,
        opened: false,
      });
    } else if (i === 3) {
      // Enemy + Healing Fountain
      entities.push({
        id: `enemy_${floorNumber}_${i}`,
        kind: 'ENEMY',
        tileX: r.cx,
        tileY: r.cy,
        enemyGroup: pickEncounterForFloor(floorNumber),
      });
      entities.push({
        id: `fountain_${floorNumber}`,
        kind: 'FOUNTAIN',
        tileX: r.x + 1,
        tileY: r.y + r.h - 2,
        opened: false,
      });
    } else {
      entities.push({
        id: `enemy_${floorNumber}_${i}`,
        kind: 'ENEMY',
        tileX: r.cx,
        tileY: r.cy,
        enemyGroup: pickEncounterForFloor(floorNumber),
      });
      if (i % 2 === 0) {
        entities.push({
          id: `ore_${floorNumber}_${i}`,
          kind: 'ORE',
          tileX: r.x + 1,
          tileY: r.y + 1,
          opened: false,
        });
      }
    }
  }

  return {
    floorNumber,
    width,
    height,
    tiles,
    explored,
    entities,
    spawnX: startRoom.cx + 0.5,
    spawnY: startRoom.cy + 0.5,
  };
}
