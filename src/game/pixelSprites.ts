import { Direction, EnemyArchetypeId, ItemId } from './types';

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

// Cached item icons as data URLs for React HUD
const iconCache: Partial<Record<ItemId, string>> = {};

export function getItemIconUrl(id: ItemId): string {
  if (iconCache[id]) return iconCache[id]!;
  if (typeof document === 'undefined') return '';
  const [c, ctx] = makeCanvas(24, 24);

  switch (id) {
    case 'sword': {
      // Diagonal pixel rune blade
      px(ctx, 16, 3, 4, 4, '#e2e8f0');
      px(ctx, 14, 5, 4, 4, '#cbd5e1');
      px(ctx, 12, 7, 4, 4, '#94a3b8');
      px(ctx, 10, 9, 4, 4, '#cbd5e1');
      px(ctx, 8, 11, 4, 4, '#60a5fa'); // rune glint
      px(ctx, 6, 12, 5, 2, '#f59e0b'); // crossguard
      px(ctx, 8, 13, 2, 5, '#f59e0b');
      px(ctx, 5, 15, 3, 3, '#78350f'); // grip
      px(ctx, 3, 17, 3, 3, '#fbbf24'); // pommel
      break;
    }
    case 'pickaxe': {
      px(ctx, 7, 4, 10, 3, '#94a3b8');
      px(ctx, 5, 6, 4, 3, '#cbd5e1');
      px(ctx, 15, 6, 4, 4, '#cbd5e1');
      px(ctx, 11, 7, 2, 13, '#92400e');
      px(ctx, 11, 5, 3, 3, '#475569');
      break;
    }
    case 'axe': {
      px(ctx, 11, 4, 2, 16, '#92400e');
      px(ctx, 12, 5, 6, 6, '#cbd5e1');
      px(ctx, 16, 6, 3, 5, '#e2e8f0');
      px(ctx, 10, 5, 3, 4, '#64748b');
      break;
    }
    case 'watering_can': {
      px(ctx, 7, 9, 9, 9, '#64748b');
      px(ctx, 8, 10, 7, 7, '#94a3b8');
      px(ctx, 10, 6, 5, 3, '#cbd5e1');
      px(ctx, 4, 11, 3, 5, '#475569');
      px(ctx, 16, 10, 4, 2, '#94a3b8');
      px(ctx, 19, 8, 2, 4, '#cbd5e1');
      px(ctx, 9, 13, 4, 3, '#38bdf8');
      break;
    }
    case 'turnip_seed':
    case 'tomato_seed':
    case 'corn_seed':
    case 'moonherb_seed': {
      const bagColor =
        id === 'turnip_seed'
          ? '#d6b384'
          : id === 'tomato_seed'
          ? '#fca5a5'
          : id === 'corn_seed'
          ? '#fde047'
          : '#c084fc';
      px(ctx, 6, 7, 12, 13, '#854d0e');
      px(ctx, 7, 8, 10, 11, bagColor);
      px(ctx, 8, 5, 8, 3, '#a16207');
      px(ctx, 11, 11, 2, 5, '#16a34a');
      px(ctx, 9, 11, 2, 2, '#22c55e');
      px(ctx, 13, 11, 2, 2, '#22c55e');
      break;
    }
    case 'turnip': {
      px(ctx, 9, 4, 6, 4, '#22c55e');
      px(ctx, 7, 8, 10, 10, '#f8fafc');
      px(ctx, 8, 9, 8, 8, '#f1f5f9');
      px(ctx, 9, 8, 6, 3, '#e879f9');
      px(ctx, 11, 18, 2, 3, '#cbd5e1');
      break;
    }
    case 'tomato': {
      px(ctx, 10, 4, 4, 3, '#16a34a');
      px(ctx, 6, 7, 12, 11, '#dc2626');
      px(ctx, 7, 8, 10, 9, '#ef4444');
      px(ctx, 8, 9, 3, 3, '#fca5a5');
      break;
    }
    case 'corn': {
      px(ctx, 8, 5, 8, 13, '#eab308');
      px(ctx, 9, 6, 6, 11, '#facc15');
      px(ctx, 10, 7, 2, 2, '#fef08a');
      px(ctx, 7, 13, 3, 7, '#16a34a');
      px(ctx, 14, 13, 3, 7, '#16a34a');
      break;
    }
    case 'moonherb': {
      px(ctx, 11, 12, 2, 8, '#15803d');
      px(ctx, 6, 7, 6, 7, '#38bdf8');
      px(ctx, 12, 6, 6, 7, '#818cf8');
      px(ctx, 9, 4, 6, 6, '#e0f2fe');
      break;
    }
    case 'stone': {
      px(ctx, 5, 8, 14, 10, '#475569');
      px(ctx, 6, 7, 12, 9, '#64748b');
      px(ctx, 7, 8, 6, 4, '#94a3b8');
      break;
    }
    case 'wood': {
      px(ctx, 5, 7, 14, 10, '#78350f');
      px(ctx, 6, 8, 12, 8, '#92400e');
      px(ctx, 15, 8, 4, 8, '#d6b384');
      px(ctx, 7, 10, 7, 2, '#b45309');
      break;
    }
    case 'rune_crystal': {
      px(ctx, 10, 3, 4, 18, '#0284c7');
      px(ctx, 7, 6, 10, 12, '#0ea5e9');
      px(ctx, 8, 7, 8, 10, '#38bdf8');
      px(ctx, 9, 8, 4, 6, '#bae6fd');
      break;
    }
    case 'gold_ore': {
      px(ctx, 5, 8, 14, 10, '#57534e');
      px(ctx, 7, 9, 4, 4, '#facc15');
      px(ctx, 13, 12, 4, 4, '#eab308');
      px(ctx, 10, 7, 3, 3, '#fde047');
      break;
    }
    case 'hp_potion': {
      px(ctx, 10, 4, 4, 3, '#a16207');
      px(ctx, 9, 7, 6, 3, '#e2e8f0');
      px(ctx, 6, 10, 12, 9, '#b91c1c');
      px(ctx, 7, 11, 10, 7, '#ef4444');
      px(ctx, 8, 12, 3, 3, '#fca5a5');
      break;
    }
    case 'rp_elixir': {
      px(ctx, 10, 4, 4, 3, '#a16207');
      px(ctx, 9, 7, 6, 3, '#e2e8f0');
      px(ctx, 6, 10, 12, 9, '#0369a1');
      px(ctx, 7, 11, 10, 7, '#38bdf8');
      px(ctx, 8, 12, 3, 3, '#bae6fd');
      break;
    }
  }

  const url = c.toDataURL();
  iconCache[id] = url;
  return url;
}

// Draw hero sprite in crisp 2D Pixel HD style (blonde hair, green tunic, sword & shield)
export function drawHeroSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: Direction,
  walkPhase: number,
  swingTimer: number,
  scale = 1
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);

  const bob = Math.sin(walkPhase * 8) * 1.5;

  // Shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const legOff = Math.sin(walkPhase * 8) * 2.5;
  // Boots
  px(ctx, -6, 6 + legOff * 0.4, 5, 6, '#5c3416');
  px(ctx, 1, 6 - legOff * 0.4, 5, 6, '#5c3416');

  // Green tunic body
  px(ctx, -7, -4 + bob, 14, 12, '#1f7a38');
  px(ctx, -6, -3 + bob, 12, 10, '#2ea44f');
  // Belt & gold buckle
  px(ctx, -7, 3 + bob, 14, 2, '#6b3e1b');
  px(ctx, -2, 3 + bob, 4, 2, '#fbbf24');

  // Head
  px(ctx, -7, -17 + bob, 14, 13, '#fcd5b5');
  px(ctx, -6, -16 + bob, 12, 11, '#ffe4cc');

  // Blonde Hair & Green Hood
  if (dir === 'up') {
    px(ctx, -8, -20 + bob, 16, 13, '#1f7a38');
    px(ctx, -6, -18 + bob, 12, 8, '#2ea44f');
    px(ctx, -6, -10 + bob, 12, 3, '#facc15');
  } else {
    // Hood back tip
    px(ctx, -8, -20 + bob, 16, 6, '#1f7a38');
    px(ctx, -6, -21 + bob, 12, 5, '#2ea44f');
    // Blonde bangs
    px(ctx, -7, -17 + bob, 14, 5, '#eab308');
    px(ctx, -5, -16 + bob, 10, 4, '#fde047');
    // Eyes
    if (dir === 'down') {
      px(ctx, -4, -11 + bob, 2, 3, '#1e293b');
      px(ctx, 2, -11 + bob, 2, 3, '#1e293b');
    } else if (dir === 'left') {
      px(ctx, -5, -11 + bob, 2, 3, '#1e293b');
    } else {
      px(ctx, 3, -11 + bob, 2, 3, '#1e293b');
    }
  }

  // Shield (left side)
  if (dir !== 'right') {
    px(ctx, -11, -3 + bob, 6, 8, '#b45309');
    px(ctx, -10, -2 + bob, 4, 6, '#fbbf24');
    px(ctx, -9, -1 + bob, 2, 4, '#38bdf8');
  }

  // Sword (right side or swinging)
  if (swingTimer > 0) {
    const progress = 1 - swingTimer / 0.22;
    ctx.save();
    ctx.translate(6, 0 + bob);
    ctx.rotate(-1.2 + progress * 2.5);
    px(ctx, 0, -14, 3, 13, '#e2e8f0');
    px(ctx, -2, -2, 7, 2, '#f59e0b');
    ctx.restore();
  } else {
    px(ctx, 7, -8 + bob, 3, 11, '#cbd5e1');
    px(ctx, 8, -7 + bob, 1, 9, '#f8fafc');
    px(ctx, 6, 2 + bob, 5, 2, '#f59e0b');
  }

  ctx.restore();
}

// Draw Monster / Creature sprites in crisp 2D Pixel HD
export function drawEnemySprite(
  ctx: CanvasRenderingContext2D,
  archetype: EnemyArchetypeId,
  x: number,
  y: number,
  time: number,
  hitFlash = 0,
  scale = 1
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);

  const bob = Math.sin(time * 4) * 2;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (hitFlash > 0) {
    ctx.filter = 'brightness(2.4)';
  }

  switch (archetype) {
    case 'slime_void': {
      px(ctx, -11, -4 + bob, 22, 16, '#6d28d9');
      px(ctx, -9, -8 + bob, 18, 18, '#8b5cf6');
      px(ctx, -6, -6 + bob, 6, 4, '#c4b5fd');
      px(ctx, -5, 1 + bob, 3, 4, '#fef08a');
      px(ctx, 3, 1 + bob, 3, 4, '#fef08a');
      break;
    }
    case 'goblin_raider': {
      px(ctx, -8, -4 + bob, 16, 15, '#78350f');
      px(ctx, -7, -15 + bob, 14, 12, '#4d7c0f');
      px(ctx, -11, -13 + bob, 4, 4, '#65a30d'); // left ear
      px(ctx, 7, -13 + bob, 4, 4, '#65a30d'); // right ear
      px(ctx, -4, -10 + bob, 2, 2, '#ef4444');
      px(ctx, 2, -10 + bob, 2, 2, '#ef4444');
      // Club
      px(ctx, -12, -8 + bob, 4, 13, '#92400e');
      break;
    }
    case 'bone_archer': {
      px(ctx, -6, -3 + bob, 12, 13, '#334155');
      px(ctx, -5, -2 + bob, 10, 2, '#e2e8f0');
      px(ctx, -5, 2 + bob, 10, 2, '#e2e8f0');
      px(ctx, -6, -16 + bob, 12, 12, '#f1f5f9');
      px(ctx, -4, -11 + bob, 3, 3, '#0f172a');
      px(ctx, 1, -11 + bob, 3, 3, '#0f172a');
      // Bow
      px(ctx, -11, -12 + bob, 3, 18, '#b45309');
      px(ctx, -12, -8 + bob, 2, 10, '#f59e0b');
      break;
    }
    case 'shadow_bat': {
      const flap = Math.sin(time * 12) * 4;
      px(ctx, -16, -8 + flap, 10, 7, '#312e81');
      px(ctx, 6, -8 + flap, 10, 7, '#312e81');
      px(ctx, -7, -10 + bob, 14, 12, '#4338ca');
      px(ctx, -4, -6 + bob, 2, 3, '#f43f5e');
      px(ctx, 2, -6 + bob, 2, 3, '#f43f5e');
      px(ctx, -3, -1 + bob, 2, 3, '#ffffff');
      px(ctx, 1, -1 + bob, 2, 3, '#ffffff');
      break;
    }
    case 'crystal_golem': {
      px(ctx, -14, -12 + bob, 28, 24, '#334155');
      px(ctx, -12, -10 + bob, 24, 20, '#475569');
      px(ctx, -8, -18 + bob, 16, 10, '#64748b');
      px(ctx, -5, -15 + bob, 4, 3, '#38bdf8');
      px(ctx, 2, -15 + bob, 4, 3, '#38bdf8');
      px(ctx, -4, -4 + bob, 8, 8, '#0ea5e9');
      px(ctx, -2, -2 + bob, 4, 4, '#bae6fd');
      break;
    }
    case 'crimson_minotaur': {
      px(ctx, -16, -14 + bob, 32, 26, '#7f1d1d');
      px(ctx, -14, -12 + bob, 28, 22, '#991b1b');
      px(ctx, -10, -24 + bob, 20, 14, '#b91c1c');
      // Horns
      px(ctx, -16, -26 + bob, 6, 5, '#fef3c7');
      px(ctx, 10, -26 + bob, 6, 5, '#fef3c7');
      px(ctx, -5, -18 + bob, 3, 3, '#facc15');
      px(ctx, 2, -18 + bob, 3, 3, '#facc15');
      // Great axe
      px(ctx, -20, -16 + bob, 6, 24, '#cbd5e1');
      break;
    }
    case 'abyssal_lich': {
      const floatY = Math.sin(time * 3) * 4;
      // Floating dark cloak
      px(ctx, -14, -16 + floatY, 28, 30, '#3b0764');
      px(ctx, -11, -14 + floatY, 22, 26, '#581c87');
      // Crown & skull
      px(ctx, -8, -28 + floatY, 16, 13, '#f1f5f9');
      px(ctx, -9, -32 + floatY, 18, 5, '#f59e0b');
      px(ctx, -5, -23 + floatY, 3, 3, '#e879f9');
      px(ctx, 2, -23 + floatY, 3, 3, '#e879f9');
      // Arcane staff
      px(ctx, -19, -24 + floatY, 3, 34, '#78350f');
      px(ctx, -21, -28 + floatY, 7, 7, '#d946ef');
      px(ctx, -19, -26 + floatY, 3, 3, '#fae8ff');
      break;
    }
  }

  ctx.restore();
}

export function drawSakuraTree(ctx: CanvasRenderingContext2D, x: number, y: number, kind: 'SAKURA' | 'OAK') {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  // Shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 20, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trunk
  px(ctx, -6, -10, 12, 22, '#6b3e1b');
  px(ctx, -4, -10, 6, 20, '#854d27');

  const c1 = kind === 'SAKURA' ? '#db2777' : '#15803d';
  const c2 = kind === 'SAKURA' ? '#f472b6' : '#22c55e';
  const c3 = kind === 'SAKURA' ? '#fbcfe8' : '#86efac';

  // Layered lush pixel foliage
  px(ctx, -24, -36, 48, 28, c1);
  px(ctx, -28, -30, 56, 18, c1);
  px(ctx, -20, -44, 40, 28, c2);
  px(ctx, -24, -34, 48, 16, c2);
  px(ctx, -14, -46, 28, 12, c3);
  px(ctx, -18, -36, 14, 8, c3);
  px(ctx, 6, -34, 12, 8, c3);

  ctx.restore();
}

export function drawCottage(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  // Shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
  ctx.fillRect(-68, 42, 138, 16);

  // Stone foundation & cream plaster walls
  px(ctx, -64, -10, 128, 56, '#78716c');
  px(ctx, -60, -8, 120, 50, '#fef3c7');
  // Timber beams
  px(ctx, -60, -8, 6, 50, '#78350f');
  px(ctx, 54, -8, 6, 50, '#78350f');
  px(ctx, -60, 14, 120, 4, '#92400e');

  // Chimney (left)
  px(ctx, -48, -68, 18, 34, '#78716c');
  px(ctx, -50, -70, 22, 6, '#a8a29e');

  // Blue tiled gabled roof (matching reference image!)
  for (let row = 0; row < 12; row++) {
    const rw = 148 - row * 8;
    const rx = -rw / 2;
    const ry = -12 - row * 4;
    px(ctx, rx, ry, rw, 5, row % 2 === 0 ? '#1d4ed8' : '#2563eb');
    px(ctx, rx + 4, ry, rw - 8, 2, '#60a5fa');
  }
  // Roof trim
  px(ctx, -74, -12, 148, 5, '#78350f');

  // Wooden door
  px(ctx, -14, 14, 24, 30, '#78350f');
  px(ctx, -11, 17, 18, 27, '#b45309');
  px(ctx, 2, 29, 3, 3, '#fbbf24');

  // Warm glowing windows
  const glow = Math.sin(time * 3) * 0.1 + 0.9;
  ctx.fillStyle = `rgba(251, 191, 36, ${glow})`;
  ctx.fillRect(-46, 16, 20, 16);
  ctx.fillRect(26, 16, 20, 16);
  // Window mullions
  px(ctx, -37, 16, 2, 16, '#78350f');
  px(ctx, -46, 23, 20, 2, '#78350f');
  px(ctx, 35, 16, 2, 16, '#78350f');
  px(ctx, 26, 23, 20, 2, '#78350f');

  // Red crest banner by porch
  px(ctx, 48, 24, 16, 24, '#dc2626');
  px(ctx, 54, 28, 4, 12, '#fef3c7');
  px(ctx, 51, 32, 10, 4, '#fef3c7');

  ctx.restore();
}

export function drawDungeonPortal(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  // Stone ruin archway
  px(ctx, -46, -54, 92, 68, '#475569');
  px(ctx, -42, -50, 84, 62, '#64748b');
  px(ctx, -28, -36, 56, 50, '#1e1b4b');

  // Swirling arcane purple portal vortex
  const pulse = Math.sin(time * 4) * 3;
  ctx.fillStyle = '#7e22ce';
  ctx.fillRect(-24, -32, 48, 46);
  ctx.fillStyle = '#a855f7';
  ctx.fillRect(-18 - pulse * 0.4, -26, 36 + pulse * 0.8, 36);
  ctx.fillStyle = '#e879f9';
  ctx.fillRect(-10, -18 + pulse * 0.3, 20, 22);
  ctx.fillStyle = '#fae8ff';
  ctx.fillRect(-4, -10, 8, 10);

  // Skull keystone on top
  px(ctx, -10, -58, 20, 16, '#cbd5e1');
  px(ctx, -7, -53, 4, 4, '#0f172a');
  px(ctx, 3, -53, 4, 4, '#0f172a');
  px(ctx, -4, -45, 8, 3, '#94a3b8');

  // Purple sword banners
  px(ctx, -56, -34, 12, 28, '#6b21a8');
  px(ctx, 44, -34, 12, 28, '#6b21a8');
  px(ctx, -52, -26, 4, 12, '#fbbf24');
  px(ctx, 48, -26, 4, 12, '#fbbf24');

  // Twin flickering torches
  const f = Math.sin(time * 14) * 2;
  px(ctx, -38, -6, 6, 16, '#78350f');
  px(ctx, 32, -6, 6, 16, '#78350f');
  px(ctx, -39, -15 + f * 0.5, 8, 9, '#f97316');
  px(ctx, 31, -15 - f * 0.5, 8, 9, '#f97316');
  px(ctx, -37, -13 + f * 0.5, 4, 5, '#fef08a');
  px(ctx, 33, -13 - f * 0.5, 4, 5, '#fef08a');

  ctx.restore();
}

export function drawRuneShrine(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  // Mossy stone pedestal
  px(ctx, -18, 2, 36, 14, '#475569');
  px(ctx, -14, -4, 28, 8, '#64748b');
  px(ctx, -16, 8, 10, 4, '#22c55e');

  // Floating glowing Rune Crystal
  const floatY = Math.sin(time * 3) * 3;
  px(ctx, -9, -32 + floatY, 18, 26, '#0284c7');
  px(ctx, -6, -36 + floatY, 12, 32, '#38bdf8');
  px(ctx, -3, -30 + floatY, 6, 18, '#bae6fd');
  px(ctx, -1, -24 + floatY, 2, 10, '#ffffff');

  ctx.restore();
}

export function drawForgeStation(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  // Brick Furnace (left)
  px(ctx, -34, -22, 32, 32, '#57534e');
  px(ctx, -32, -20, 28, 28, '#78716c');
  px(ctx, -26, -34, 14, 14, '#57534e');
  // Glowing coals
  const flicker = Math.sin(time * 12) * 2;
  px(ctx, -26, -4, 16, 12, '#ea580c');
  px(ctx, -24, -2 + flicker * 0.3, 12, 8, '#facc15');

  // Anvil (right)
  px(ctx, 14, -2, 24, 8, '#334155');
  px(ctx, 18, 6, 16, 8, '#475569');
  px(ctx, 12, -6, 28, 5, '#94a3b8');

  ctx.restore();
}
