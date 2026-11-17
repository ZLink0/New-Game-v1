import React, { useEffect, useRef } from 'react';
import { CROPS, ITEMS, TILE_SIZE } from '../game/data';
import {
  buildHomesteadGrid,
  HOMESTEAD_INTERACTABLES,
  MAP_H,
  MAP_W,
  TREES,
} from '../game/homesteadMap';
import {
  drawCottage,
  drawDungeonPortal,
  drawEnemySprite,
  drawForgeStation,
  drawHeroSprite,
  drawRuneShrine,
  drawSakuraTree,
} from '../game/pixelSprites';
import {
  AnimalEntity,
  BattleState,
  Direction,
  DungeonEntity,
  DungeonFloor,
  FarmPlot,
  FloatingText,
  GameState,
  ItemId,
  Language,
  Particle,
  ResourceNode,
  SceneZone,
} from '../game/types';

export interface PlayerPosRef {
  x: number;
  y: number;
  dir: Direction;
}

export interface GameCanvasProps {
  gameState: GameState;
  sceneZone: SceneZone;
  lang: Language;
  selectedHotbarItem: ItemId;
  farmPlots: FarmPlot[];
  resourceNodes: ResourceNode[];
  animals: AnimalEntity[];
  dungeonFloor: DungeonFloor | null;
  battleState: BattleState | null;
  playerPosRef: React.MutableRefObject<PlayerPosRef>;
  touchInputRef: React.MutableRefObject<{ dx: number; dy: number }>;
  actionQueueRef: React.MutableRefObject<number>;
  floatingTextsRef: React.MutableRefObject<FloatingText[]>;
  shakeRef: React.MutableRefObject<number>;
  hitstopRef: React.MutableRefObject<number>;
  onPlayerAction: (targetTileX: number, targetTileY: number) => void;
  onSelectBattleTarget: (index: number) => void;
  onTilePositionTick: (x: number, y: number) => void;
  onNearPromptChange: (prompt: string | null) => void;
}

const { tiles: HOMESTEAD_TILES, solid: HOMESTEAD_SOLID } = buildHomesteadGrid();

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  sceneZone,
  lang,
  farmPlots,
  resourceNodes,
  animals,
  dungeonFloor,
  battleState,
  playerPosRef,
  touchInputRef,
  actionQueueRef,
  floatingTextsRef,
  shakeRef,
  hitstopRef,
  onPlayerAction,
  onSelectBattleTarget,
  onTilePositionTick,
  onNearPromptChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heldKeysRef = useRef<Set<string>>(new Set());
  const swingTimerRef = useRef<number>(0);
  const walkPhaseRef = useRef<number>(0);
  const cameraRef = useRef<{ x: number; y: number }>({ x: 11.5 * TILE_SIZE, y: 11.5 * TILE_SIZE });
  const particlesRef = useRef<Particle[]>([]);
  const lastPromptRef = useRef<string | null>(null);

  // Store latest props in refs so RAF loop stays stable and never restarts
  const propsRef = useRef({
    gameState,
    sceneZone,
    lang,
    farmPlots,
    resourceNodes,
    animals,
    dungeonFloor,
    battleState,
    onPlayerAction,
    onSelectBattleTarget,
    onTilePositionTick,
    onNearPromptChange,
  });
  propsRef.current = {
    gameState,
    sceneZone,
    lang,
    farmPlots,
    resourceNodes,
    animals,
    dungeonFloor,
    battleState,
    onPlayerAction,
    onSelectBattleTarget,
    onTilePositionTick,
    onNearPromptChange,
  };

  // Keyboard handlers
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
        if (propsRef.current.gameState === 'PLAYING') {
          e.preventDefault();
        }
      }
      heldKeysRef.current.add(code);

      if ((code === 'Space' || code === 'KeyE') && propsRef.current.gameState === 'PLAYING') {
        actionQueueRef.current += 1;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      heldKeysRef.current.delete(e.code);
    };
    const onBlur = () => {
      heldKeysRef.current.clear();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [actionQueueRef]);

  // Seed initial ambient petals
  useEffect(() => {
    const initial: Particle[] = [];
    for (let i = 0; i < 24; i++) {
      initial.push({
        x: Math.random() * MAP_W * TILE_SIZE,
        y: Math.random() * MAP_H * TILE_SIZE,
        vx: -10 - Math.random() * 14,
        vy: 12 + Math.random() * 12,
        size: 3 + Math.random() * 2,
        color: Math.random() > 0.35 ? '#f9a8d4' : '#fbcfe8',
        life: Math.random() * 6,
        maxLife: 8,
        kind: 'petal',
      });
    }
    particlesRef.current = initial;
  }, []);

  // Click handler for battle target selection or homestead action
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const { gameState: gs, battleState: bs, onSelectBattleTarget: selectTarget } = propsRef.current;

    if (gs === 'BATTLE' && bs) {
      // Check enemy hitboxes on battle arena
      const w = rect.width;
      const h = rect.height;
      const aliveCount = bs.enemies.length;
      bs.enemies.forEach((enemy, idx) => {
        if (enemy.hp <= 0) return;
        const ex = w * 0.68 + (idx - (aliveCount - 1) / 2) * Math.min(125, w * 0.14);
        const ey = h * 0.50 + (idx % 2 === 0 ? -10 : 18);
        if (Math.abs(cx - ex) < 55 && Math.abs(cy - ey) < 65) {
          selectTarget(idx);
        }
      });
      return;
    }

    if (gs === 'PLAYING') {
      swingTimerRef.current = 0.22;
      const pos = playerPosRef.current;
      const offX = pos.dir === 'left' ? -0.9 : pos.dir === 'right' ? 0.9 : 0;
      const offY = pos.dir === 'up' ? -0.9 : pos.dir === 'down' ? 0.9 : 0;
      propsRef.current.onPlayerAction(Math.floor(pos.x + offX), Math.floor(pos.y + offY));
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTs = performance.now();
    let elapsed = 0;
    let tickAccum = 0;

    const canWalkHomestead = (nx: number, ny: number): boolean => {
      const margin = 0.28;
      const checks = [
        [nx - margin, ny - margin],
        [nx + margin, ny - margin],
        [nx - margin, ny + margin],
        [nx + margin, ny + margin],
      ];
      for (const [cx, cy] of checks) {
        const tx = Math.floor(cx);
        const ty = Math.floor(cy);
        if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
        if (HOMESTEAD_SOLID[ty][tx]) return false;
        // Check active resource nodes
        const hitNode = propsRef.current.resourceNodes.some(
          (n) => n.depletedDay === null && n.tileX === tx && n.tileY === ty
        );
        if (hitNode) return false;
      }
      return true;
    };

    const canWalkDungeon = (nx: number, ny: number, floor: DungeonFloor): boolean => {
      const margin = 0.28;
      const checks = [
        [nx - margin, ny - margin],
        [nx + margin, ny - margin],
        [nx - margin, ny + margin],
        [nx + margin, ny + margin],
      ];
      for (const [cx, cy] of checks) {
        const tx = Math.floor(cx);
        const ty = Math.floor(cy);
        if (tx < 0 || ty < 0 || tx >= floor.width || ty >= floor.height) return false;
        if (floor.tiles[ty][tx] === 0) return false;
      }
      return true;
    };

    const updateFog = (floor: DungeonFloor, px: number, py: number) => {
      const cx = Math.floor(px);
      const cy = Math.floor(py);
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const tx = cx + dx;
          const ty = cy + dy;
          if (tx >= 0 && ty >= 0 && tx < floor.width && ty < floor.height) {
            if (dx * dx + dy * dy <= 18) {
              floor.explored[ty][tx] = true;
            }
          }
        }
      }
    };

    const frame = (now: number) => {
      const rawDt = (now - lastTs) / 1000;
      lastTs = now;
      const dt = Math.min(rawDt, 0.05);

      if (hitstopRef.current > 0) {
        hitstopRef.current = Math.max(0, hitstopRef.current - dt);
      } else {
        elapsed += dt;
      }

      if (shakeRef.current > 0) {
        shakeRef.current = Math.max(0, shakeRef.current - dt * 28);
      }

      // Resize canvas cleanly to DPR
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const targetW = Math.max(1, Math.floor(rect.width * dpr));
      const targetH = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      const viewW = rect.width;
      const viewH = rect.height;
      const {
        gameState: gs,
        sceneZone: zone,
        lang: currentLang,
        farmPlots: plots,
        resourceNodes: nodes,
        animals: animalList,
        dungeonFloor: floor,
        battleState: bState,
      } = propsRef.current;

      // Update floating texts
      floatingTextsRef.current = floatingTextsRef.current.filter((ft) => {
        ft.life -= dt;
        ft.y += ft.vy * dt;
        return ft.life > 0;
      });

      // Update ambient particles
      if (zone === 'HOMESTEAD') {
        if (Math.random() < dt * 3.5) {
          particlesRef.current.push({
            x: 3.5 * TILE_SIZE + Math.random() * 6,
            y: 2.2 * TILE_SIZE,
            vx: 6 + Math.random() * 8,
            vy: -16 - Math.random() * 10,
            size: 5 + Math.random() * 4,
            color: 'rgba(241, 245, 249, 0.72)',
            life: 2.2,
            maxLife: 2.2,
            kind: 'smoke',
          });
        }
        if (Math.random() < dt * 4) {
          particlesRef.current.push({
            x: 20.5 * TILE_SIZE + (Math.random() - 0.5) * 28,
            y: 4.5 * TILE_SIZE + (Math.random() - 0.5) * 18,
            vx: (Math.random() - 0.5) * 16,
            vy: -18 - Math.random() * 12,
            size: 3,
            color: Math.random() > 0.5 ? '#e879f9' : '#c084fc',
            life: 1.4,
            maxLife: 1.4,
            kind: 'portal',
          });
        }
        for (const p of particlesRef.current) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          if (p.kind === 'petal' && p.life <= 0) {
            p.x = Math.random() * MAP_W * TILE_SIZE;
            p.y = -10;
            p.life = 7 + Math.random() * 3;
          }
        }
        particlesRef.current = particlesRef.current.filter((p) => p.kind === 'petal' || p.life > 0);
      }

      // === RENDER BATTLE ARENA ===
      if (gs === 'BATTLE' && bState) {
        renderBattleArena(ctx, viewW, viewH, elapsed, bState, shakeRef.current, floatingTextsRef.current, currentLang);
        rafId = requestAnimationFrame(frame);
        return;
      }

      // === PLAYER MOVEMENT & ACTIONS (PLAYING) ===
      if (gs === 'PLAYING') {
        if (swingTimerRef.current > 0) {
          swingTimerRef.current = Math.max(0, swingTimerRef.current - dt);
        }

        const keys = heldKeysRef.current;
        let dx = touchInputRef.current.dx;
        let dy = touchInputRef.current.dy;
        if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
        if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
        if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
        if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;

        const len = Math.hypot(dx, dy);
        if (len > 0.05) {
          dx /= Math.max(1, len);
          dy /= Math.max(1, len);
          const pos = playerPosRef.current;

          if (Math.abs(dx) > Math.abs(dy)) {
            pos.dir = dx < 0 ? 'left' : 'right';
          } else {
            pos.dir = dy < 0 ? 'up' : 'down';
          }

          const speed = 4.6;
          const stepX = dx * speed * dt;
          const stepY = dy * speed * dt;

          if (zone === 'HOMESTEAD') {
            if (canWalkHomestead(pos.x + stepX, pos.y)) pos.x += stepX;
            if (canWalkHomestead(pos.x, pos.y + stepY)) pos.y += stepY;
          } else if (floor) {
            if (canWalkDungeon(pos.x + stepX, pos.y, floor)) pos.x += stepX;
            if (canWalkDungeon(pos.x, pos.y + stepY, floor)) pos.y += stepY;
            updateFog(floor, pos.x, pos.y);
          }
          walkPhaseRef.current += dt * 1.4;
        } else {
          walkPhaseRef.current = 0;
        }

        // Update wandering animals in homestead
        if (zone === 'HOMESTEAD') {
          for (const a of animalList) {
            a.bobPhase += dt * 3;
            if (a.waitTimer > 0) {
              a.waitTimer -= dt;
              if (a.waitTimer <= 0) {
                const ang = Math.random() * Math.PI * 2;
                a.vx = Math.cos(ang) * 0.7;
                a.vy = Math.sin(ang) * 0.7;
                a.facing = a.vx < 0 ? 'left' : 'right';
              }
            } else {
              const nx = a.x + a.vx * dt;
              const ny = a.y + a.vy * dt;
              if (Math.hypot(nx - a.homeX, ny - a.homeY) < 1.8 && canWalkHomestead(nx, ny)) {
                a.x = nx;
                a.y = ny;
              } else {
                a.vx = 0;
                a.vy = 0;
                a.waitTimer = 1.5 + Math.random() * 2;
              }
              if (Math.random() < dt * 0.6) {
                a.vx = 0;
                a.vy = 0;
                a.waitTimer = 1.5 + Math.random() * 2;
              }
            }
          }
        }

        // Process action trigger
        if (actionQueueRef.current > 0) {
          actionQueueRef.current = 0;
          swingTimerRef.current = 0.22;
          const pos = playerPosRef.current;
          const offX = pos.dir === 'left' ? -0.85 : pos.dir === 'right' ? 0.85 : 0;
          const offY = pos.dir === 'up' ? -0.85 : pos.dir === 'down' ? 0.85 : 0;
          propsRef.current.onPlayerAction(Math.floor(pos.x + offX), Math.floor(pos.y + offY));
        }

        // Periodic minimap position & context prompt check
        tickAccum += dt;
        if (tickAccum >= 0.12) {
          tickAccum = 0;
          const pos = playerPosRef.current;
          propsRef.current.onTilePositionTick(pos.x, pos.y);

          let nextPrompt: string | null = null;
          if (zone === 'HOMESTEAD') {
            for (const inter of HOMESTEAD_INTERACTABLES) {
              if (Math.hypot(pos.x - (inter.tileX + 0.5), pos.y - (inter.tileY + 0.5)) <= inter.radius) {
                nextPrompt = `[E] ${currentLang === 'id' ? inter.labelId : inter.labelEn}`;
                break;
              }
            }
          } else if (floor) {
            for (const ent of floor.entities) {
              if (ent.opened) continue;
              if (Math.hypot(pos.x - (ent.tileX + 0.5), pos.y - (ent.tileY + 0.5)) <= 1.5) {
                if (ent.kind === 'ENEMY') {
                  nextPrompt = `[E] ${currentLang === 'id' ? 'Lawan Monster' : 'Engage Monster'}`;
                } else if (ent.kind === 'CHEST') {
                  nextPrompt = `[E] ${currentLang === 'id' ? 'Buka Peti' : 'Open Chest'}`;
                } else if (ent.kind === 'ALTAR') {
                  nextPrompt = `[E] ${currentLang === 'id' ? 'Altar Berkah Rune' : 'Rune Blessing Altar'}`;
                } else if (ent.kind === 'FOUNTAIN') {
                  nextPrompt = `[E] ${currentLang === 'id' ? 'Mata Air Pemulih' : 'Healing Spring'}`;
                } else if (ent.kind === 'ORE') {
                  nextPrompt = `[E] ${currentLang === 'id' ? 'Tambang Kristal' : 'Mine Crystal Vein'}`;
                } else if (ent.kind === 'STAIRS') {
                  nextPrompt = `[E] ${currentLang === 'id' ? 'Turun Lantai Berikutnya' : 'Descend Next Floor'}`;
                } else if (ent.kind === 'RETURN_PORTAL') {
                  nextPrompt = `[E] ${currentLang === 'id' ? 'Kembali ke Kebun' : 'Return to Homestead'}`;
                }
                break;
              }
            }
          }
          if (nextPrompt !== lastPromptRef.current) {
            lastPromptRef.current = nextPrompt;
            propsRef.current.onNearPromptChange(nextPrompt);
          }
        }
      }

      // === RENDER WORLD ===
      const zoom = viewW < 700 ? 1.55 : 2.05;
      if (gs === 'TITLE_MENU') {
        // Gentle scenic pan across Homestead on Title screen
        cameraRef.current.x = (12.5 + Math.sin(elapsed * 0.25) * 3.8) * TILE_SIZE;
        cameraRef.current.y = (9.5 + Math.cos(elapsed * 0.2) * 2.2) * TILE_SIZE;
      } else {
        const targetCamX = playerPosRef.current.x * TILE_SIZE;
        const targetCamY = playerPosRef.current.y * TILE_SIZE;
        cameraRef.current.x += (targetCamX - cameraRef.current.x) * Math.min(1, dt * 10);
        cameraRef.current.y += (targetCamY - cameraRef.current.y) * Math.min(1, dt * 10);
      }

      const shakeX = shakeRef.current > 0 ? (Math.random() - 0.5) * shakeRef.current : 0;
      const shakeY = shakeRef.current > 0 ? (Math.random() - 0.5) * shakeRef.current : 0;

      ctx.fillStyle = zone === 'HOMESTEAD' ? '#244b2b' : '#0f0c18';
      ctx.fillRect(0, 0, viewW, viewH);

      ctx.save();
      ctx.translate(
        Math.round(viewW / 2 - cameraRef.current.x * zoom + shakeX),
        Math.round(viewH / 2 - cameraRef.current.y * zoom + shakeY)
      );
      ctx.scale(zoom, zoom);

      if (zone === 'HOMESTEAD') {
        renderHomesteadWorld(
          ctx,
          elapsed,
          plots,
          nodes,
          animalList,
          playerPosRef.current,
          walkPhaseRef.current,
          swingTimerRef.current,
          particlesRef.current,
          floatingTextsRef.current,
          gs
        );
      } else if (floor) {
        renderDungeonWorld(
          ctx,
          elapsed,
          floor,
          playerPosRef.current,
          walkPhaseRef.current,
          swingTimerRef.current,
          floatingTextsRef.current
        );
      }

      ctx.restore();
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [actionQueueRef, floatingTextsRef, hitstopRef, playerPosRef, shakeRef, touchInputRef]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="block w-full h-full pixelated cursor-crosshair"
    />
  );
};

function renderHomesteadWorld(
  ctx: CanvasRenderingContext2D,
  time: number,
  plots: FarmPlot[],
  nodes: ResourceNode[],
  animals: AnimalEntity[],
  player: PlayerPosRef,
  walkPhase: number,
  swingTimer: number,
  particles: Particle[],
  floatingTexts: FloatingText[],
  gameState: GameState
) {
  // 1. Tiles
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const tile = HOMESTEAD_TILES[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      if (tile === 'GRASS' || tile === 'FARM_BED') {
        const checker = (x + y) % 2 === 0;
        ctx.fillStyle = checker ? '#5ab844' : '#50ad3c';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        // Subtle grass tufts & flowers
        if ((x * 7 + y * 13) % 11 === 0) {
          ctx.fillStyle = '#84e15c';
          ctx.fillRect(px + 6, py + 8, 3, 4);
          ctx.fillRect(px + 10, py + 6, 3, 6);
        }
        if ((x * 17 + y * 5) % 19 === 0) {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#fbcfe8' : '#fef08a';
          ctx.fillRect(px + 20, py + 18, 4, 4);
        }
      } else if (tile === 'PATH') {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#d8a86e' : '#cea065';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#b9864c';
        ctx.fillRect(px + 6, py + 10, 4, 3);
        ctx.fillRect(px + 20, py + 22, 5, 3);
      } else if (tile === 'STONE_PAD') {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, 2);
        ctx.fillRect(px + 1, py + 1, 2, TILE_SIZE - 2);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px + 6, py + 6, 8, 4);
      } else if (tile === 'CLIFF') {
        ctx.fillStyle = '#57534e';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#44403c';
        ctx.fillRect(px + 2, py + 16, TILE_SIZE - 4, 14);
        ctx.fillStyle = '#4aa83b';
        ctx.fillRect(px, py, TILE_SIZE, 8);
      } else if (tile === 'WATER') {
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#38bdf8';
        const wave = Math.sin(time * 3 + x + y) * 3;
        ctx.fillRect(px + 4 + wave, py + 8, 12, 3);
        ctx.fillRect(px + 12 - wave, py + 22, 10, 2);
        // Waterfall foam on top tiles
        if (y <= 4 && x >= 10 && x <= 12) {
          const drop = ((time * 40 + y * 10) % 28);
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(px + 5, py + drop, 6, 8);
          ctx.fillRect(px + 18, py + ((drop + 12) % 26), 7, 8);
        }
        // Lily pads
        if (x === 15 && y === 10) {
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(px + 8, py + 10, 12, 10);
          ctx.fillStyle = '#f9a8d4';
          ctx.fillRect(px + 12, py + 12, 4, 4);
        }
      } else if (tile === 'BRIDGE') {
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(px, py + 2, TILE_SIZE, TILE_SIZE - 4);
        ctx.fillStyle = '#b45309';
        for (let plank = 2; plank < TILE_SIZE - 4; plank += 8) {
          ctx.fillRect(px + plank, py + 4, 6, TILE_SIZE - 8);
        }
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px, py + 2, TILE_SIZE, 3);
        ctx.fillRect(px, py + TILE_SIZE - 5, TILE_SIZE, 3);
      }
    }
  }

  // 2. Wooden Fence around Farm Garden (x: 2..9, y: 9..15)
  ctx.fillStyle = '#78350f';
  for (let x = 2; x <= 8; x++) {
    ctx.fillRect(x * TILE_SIZE + 2, 9 * TILE_SIZE + 12, TILE_SIZE - 4, 6);
    ctx.fillRect(x * TILE_SIZE + 12, 9 * TILE_SIZE + 6, 8, 18);
    ctx.fillRect(x * TILE_SIZE + 2, 15 * TILE_SIZE + 12, TILE_SIZE - 4, 6);
    ctx.fillRect(x * TILE_SIZE + 12, 15 * TILE_SIZE + 6, 8, 18);
  }
  for (let y = 9; y <= 15; y++) {
    ctx.fillRect(2 * TILE_SIZE + 12, y * TILE_SIZE + 4, 8, TILE_SIZE - 4);
    if (y !== 11 && y !== 12) {
      ctx.fillRect(9 * TILE_SIZE + 12, y * TILE_SIZE + 4, 8, TILE_SIZE - 4);
    }
  }

  // 3. Farm Plots & Growing Crops
  for (const plot of plots) {
    const px = plot.tileX * TILE_SIZE;
    const py = plot.tileY * TILE_SIZE;
    ctx.fillStyle = plot.watered ? '#4a2c18' : '#7c4a26';
    ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    ctx.fillStyle = plot.watered ? '#361f10' : '#63391b';
    ctx.fillRect(px + 4, py + 8, TILE_SIZE - 8, 3);
    ctx.fillRect(px + 4, py + 17, TILE_SIZE - 8, 3);
    ctx.fillRect(px + 4, py + 25, TILE_SIZE - 8, 3);

    if (plot.cropId) {
      const def = CROPS[plot.cropId];
      const isMature = plot.stage >= def.growDays;
      if (plot.stage === 1) {
        // Tiny sprouts
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(px + 9, py + 14, 4, 5);
        ctx.fillRect(px + 19, py + 14, 4, 5);
      } else if (!isMature) {
        // Leafy mid-growth
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(px + 7, py + 10, 18, 12);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(px + 10, py + 7, 12, 8);
      } else {
        // Mature crop sprite!
        if (plot.cropId === 'turnip') {
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(px + 9, py + 4, 14, 9);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(px + 10, py + 13, 12, 12);
          ctx.fillStyle = '#e879f9';
          ctx.fillRect(px + 11, py + 13, 10, 4);
        } else if (plot.cropId === 'tomato') {
          ctx.fillStyle = '#15803d';
          ctx.fillRect(px + 7, py + 5, 18, 18);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(px + 8, py + 12, 7, 7);
          ctx.fillRect(px + 17, py + 9, 7, 7);
          ctx.fillStyle = '#fca5a5';
          ctx.fillRect(px + 9, py + 13, 2, 2);
          ctx.fillRect(px + 18, py + 10, 2, 2);
        } else if (plot.cropId === 'corn') {
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(px + 8, py + 4, 16, 22);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(px + 11, py + 5, 10, 14);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(px + 13, py + 7, 3, 8);
        } else {
          // Moonherb
          ctx.fillStyle = '#0ea5e9';
          ctx.fillRect(px + 8, py + 7, 16, 15);
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(px + 11, py + 4, 10, 10);
        }
        // Subtle ready-to-harvest sparkle
        if (Math.sin(time * 5 + plot.tileX) > 0.6) {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(px + 23, py + 4, 3, 3);
        }
      }
    }
  }

  // 4. Shipping Bin & Quest Notice Board
  // Shipping bin at (8, 6)
  ctx.fillStyle = '#78350f';
  ctx.fillRect(8 * TILE_SIZE + 3, 6 * TILE_SIZE + 4, 26, 24);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(8 * TILE_SIZE + 5, 6 * TILE_SIZE + 6, 22, 10);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(8 * TILE_SIZE + 13, 6 * TILE_SIZE + 14, 6, 4);

  // Quest Board at (9, 7)
  ctx.fillStyle = '#78350f';
  ctx.fillRect(9 * TILE_SIZE + 13, 7 * TILE_SIZE + 14, 6, 16);
  ctx.fillStyle = '#92400e';
  ctx.fillRect(9 * TILE_SIZE + 4, 7 * TILE_SIZE + 2, 24, 18);
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(9 * TILE_SIZE + 7, 7 * TILE_SIZE + 5, 10, 11);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(9 * TILE_SIZE + 19, 7 * TILE_SIZE + 5, 6, 6);

  // 5. Major Landmarks
  drawCottage(ctx, 5.5 * TILE_SIZE, 6.2 * TILE_SIZE, time);
  drawDungeonPortal(ctx, 20.5 * TILE_SIZE, 4.4 * TILE_SIZE, time);
  drawRuneShrine(ctx, 15.5 * TILE_SIZE, 11.4 * TILE_SIZE, time);
  drawForgeStation(ctx, 4.5 * TILE_SIZE, 16.4 * TILE_SIZE, time);

  // 6. Resource Nodes
  for (const node of nodes) {
    if (node.depletedDay !== null) continue;
    const nx = node.tileX * TILE_SIZE;
    const ny = node.tileY * TILE_SIZE;
    if (node.kind === 'CRYSTAL_ROCK') {
      ctx.fillStyle = '#475569';
      ctx.fillRect(nx + 4, ny + 10, 24, 18);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(nx + 6, ny + 8, 18, 12);
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(nx + 10, ny + 3, 7, 13);
      ctx.fillRect(nx + 18, ny + 7, 6, 10);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(nx + 12, ny + 5, 3, 7);
    } else if (node.kind === 'STONE_ROCK') {
      ctx.fillStyle = '#475569';
      ctx.fillRect(nx + 5, ny + 11, 22, 16);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(nx + 7, ny + 9, 16, 10);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(nx + 18, ny + 15, 4, 4);
    } else {
      // Timber stump
      ctx.fillStyle = '#78350f';
      ctx.fillRect(nx + 6, ny + 10, 20, 18);
      ctx.fillStyle = '#d6b384';
      ctx.fillRect(nx + 8, ny + 9, 16, 6);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(nx + 12, ny + 11, 8, 2);
    }
  }

  // 7. Animals
  for (const a of animals) {
    const ax = a.x * TILE_SIZE;
    const ay = a.y * TILE_SIZE;
    const hop = Math.abs(Math.sin(a.bobPhase)) * 3;
    if (a.kind === 'CHICKEN') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ax - 6, ay - 6 - hop, 12, 10);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(ax - 2, ay - 9 - hop, 4, 3);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(a.facing === 'right' ? ax + 5 : ax - 8, ay - 4 - hop, 4, 3);
    } else if (a.kind === 'SHEEP') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(ax - 10, ay - 9 - hop * 0.5, 20, 14);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(ax - 8, ay - 11 - hop * 0.5, 16, 4);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(a.facing === 'right' ? ax + 6 : ax - 11, ay - 7 - hop * 0.5, 6, 7);
      ctx.fillStyle = '#334155';
      ctx.fillRect(ax - 7, ay + 4, 3, 5);
      ctx.fillRect(ax + 4, ay + 4, 3, 5);
    } else {
      // Cute friendly Blue Slime buddy!
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(ax - 9, ay - 5 - hop, 18, 13);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(ax - 7, ay - 8 - hop, 14, 14);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(ax - 5, ay - 6 - hop, 4, 3);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ax - 4, ay - 2 - hop, 2, 3);
      ctx.fillRect(ax + 2, ay - 2 - hop, 2, 3);
    }
  }

  // 8. Hero
  if (gameState !== 'TITLE_MENU') {
    drawHeroSprite(
      ctx,
      player.x * TILE_SIZE,
      player.y * TILE_SIZE,
      player.dir,
      walkPhase,
      swingTimer
    );
  } else {
    // On Title screen, Hero stands heroically near the Rune Shrine!
    drawHeroSprite(ctx, 11.5 * TILE_SIZE, 11.5 * TILE_SIZE, 'down', Math.sin(time) * 0.1, 0);
  }

  // 9. Trees (drawn after hero for cozy depth around edges)
  for (const t of TREES) {
    drawSakuraTree(ctx, t.x * TILE_SIZE, t.y * TILE_SIZE, t.kind);
  }

  // 10. Particles & Floating Texts
  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.ceil(p.size), Math.ceil(p.size));
  }
  renderFloatingTexts(ctx, floatingTexts);
}

function renderDungeonWorld(
  ctx: CanvasRenderingContext2D,
  time: number,
  floor: DungeonFloor,
  player: PlayerPosRef,
  walkPhase: number,
  swingTimer: number,
  floatingTexts: FloatingText[]
) {
  for (let y = 0; y < floor.height; y++) {
    for (let x = 0; x < floor.width; x++) {
      if (!floor.explored[y][x]) continue;
      const t = floor.tiles[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;
      if (t === 0) {
        ctx.fillStyle = '#271e38';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#3b2d54';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, 8);
      } else {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#1e192b' : '#241e33';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#2f2742';
        ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, 1);
        ctx.fillRect(px + 1, py + 1, 1, TILE_SIZE - 2);
      }
    }
  }

  // Entities
  for (const ent of floor.entities) {
    if (!floor.explored[ent.tileY]?.[ent.tileX]) continue;
    if (ent.opened) continue;
    drawDungeonEntity(ctx, ent, time);
  }

  // Hero
  drawHeroSprite(
    ctx,
    player.x * TILE_SIZE,
    player.y * TILE_SIZE,
    player.dir,
    walkPhase,
    swingTimer
  );

  renderFloatingTexts(ctx, floatingTexts);
}

function drawDungeonEntity(ctx: CanvasRenderingContext2D, ent: DungeonEntity, time: number) {
  const cx = (ent.tileX + 0.5) * TILE_SIZE;
  const cy = (ent.tileY + 0.5) * TILE_SIZE;

  switch (ent.kind) {
    case 'RETURN_PORTAL': {
      ctx.fillStyle = '#7e22ce';
      ctx.fillRect(cx - 12, cy - 12, 24, 24);
      ctx.fillStyle = '#e879f9';
      const s = 6 + Math.sin(time * 5) * 2;
      ctx.fillRect(cx - s, cy - s, s * 2, s * 2);
      break;
    }
    case 'STAIRS': {
      ctx.fillStyle = '#475569';
      ctx.fillRect(cx - 13, cy - 13, 26, 26);
      ctx.fillStyle = '#1e293b';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(cx - 10, cy - 10 + i * 6, 20 - i * 3, 4);
      }
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(cx - 2, cy - 18 + Math.sin(time * 4) * 2, 4, 4);
      break;
    }
    case 'CHEST': {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - 10, cy - 8, 20, 16);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(cx - 9, cy - 7, 18, 6);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 2, cy - 2, 4, 5);
      break;
    }
    case 'ALTAR': {
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 12, cy - 6, 24, 16);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx - 6, cy - 16 + Math.sin(time * 4) * 2, 12, 14);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(cx - 3, cy - 13 + Math.sin(time * 4) * 2, 6, 8);
      break;
    }
    case 'FOUNTAIN': {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(cx - 12, cy - 10, 24, 20);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(cx - 9, cy - 7, 18, 14);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(cx - 4, cy - 4 + Math.sin(time * 5) * 2, 8, 8);
      break;
    }
    case 'ORE': {
      ctx.fillStyle = '#475569';
      ctx.fillRect(cx - 10, cy - 6, 20, 14);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx - 6, cy - 12, 6, 10);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx + 2, cy - 8, 5, 8);
      break;
    }
    case 'ENEMY': {
      const lead = ent.enemyGroup?.[0] ?? 'slime_void';
      drawEnemySprite(ctx, lead, cx, cy, time, 0, ent.isBoss ? 1.25 : 0.95);
      break;
    }
  }
}

function renderBattleArena(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  battle: BattleState,
  shake: number,
  floatingTexts: FloatingText[],
  lang: Language
) {
  const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
  const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
  ctx.save();
  ctx.translate(sx, sy);

  // Atmospheric dark violet dungeon backdrop
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#140e24');
  grad.addColorStop(0.55, '#22173a');
  grad.addColorStop(1, '#15121e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Pixel stone pillars & torches
  const pillarX = [w * 0.14, w * 0.36, w * 0.64, w * 0.86];
  for (const px of pillarX) {
    ctx.fillStyle = '#2d2345';
    ctx.fillRect(px - 18, h * 0.12, 36, h * 0.42);
    ctx.fillStyle = '#3c3059';
    ctx.fillRect(px - 14, h * 0.12, 10, h * 0.42);
    // Wall torch
    const fl = Math.sin(time * 12 + px) * 3;
    ctx.fillStyle = '#f97316';
    ctx.fillRect(px - 6, h * 0.25 + fl * 0.3, 12, 14);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px - 3, h * 0.26 + fl * 0.3, 6, 8);
  }

  // Stone arena floor
  ctx.fillStyle = '#272038';
  ctx.fillRect(0, h * 0.48, w, h * 0.52);
  ctx.fillStyle = '#362d4d';
  ctx.fillRect(0, h * 0.48, w, 6);

  // Subtle floor grid lines
  ctx.fillStyle = '#1d172c';
  for (let i = 1; i < 6; i++) {
    ctx.fillRect(0, h * (0.48 + i * 0.08), w, 2);
  }

  // Hero standing on left side
  const heroX = w * 0.26;
  const heroY = h * 0.54;
  drawHeroSprite(ctx, heroX, heroY, 'right', Math.sin(time * 2) * 0.1, 0, 2.7);

  if (battle.playerDefending || battle.playerShieldTurns > 0) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(heroX - 38, heroY - 58, 76, 98);
  }

  // Enemies on right side
  const count = battle.enemies.length;
  battle.enemies.forEach((enemy, idx) => {
    if (enemy.hp <= 0) return;
    const ex = w * 0.68 + (idx - (count - 1) / 2) * Math.min(130, w * 0.15);
    const ey = h * 0.52 + (idx % 2 === 0 ? -10 : 20);
    const selected = idx === battle.selectedTargetIndex;

    if (selected) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(ex, ey + 34, 34, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawEnemySprite(
      ctx,
      enemy.archetype,
      ex,
      ey,
      time + idx,
      enemy.hitFlash,
      enemy.isBoss ? 2.9 : 2.35
    );

    // Enemy name + HP bar + Telegraphed Intent above enemy
    const barW = 92;
    const barX = ex - barW / 2;
    const barY = ey - (enemy.isBoss ? 112 : 84);

    // Intent pill-free clean indicator
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    let intentStr = `ATK ${enemy.intentValue}`;
    let intentColor = '#fca5a5';
    if (enemy.stunned) {
      intentStr = lang === 'id' ? 'PINGSAN' : 'STUNNED';
      intentColor = '#fde047';
    } else if (enemy.intent === 'HEAVY') {
      intentStr = `CRIT ${enemy.intentValue}!`;
      intentColor = '#fb923c';
    } else if (enemy.intent === 'DEFEND') {
      intentStr = `SHIELD +${enemy.intentValue}`;
      intentColor = '#7dd3fc';
    } else if (enemy.intent === 'POISON') {
      intentStr = `VENOM ${enemy.intentValue}`;
      intentColor = '#d8b4fe';
    }
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(barX, barY - 20, barW, 16);
    ctx.fillStyle = intentColor;
    ctx.fillText(intentStr, ex, barY - 8);

    // Enemy HP bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, 10);
    const ratio = Math.max(0, enemy.hp / enemy.maxHp);
    ctx.fillStyle = enemy.isBoss ? '#d946ef' : '#ef4444';
    ctx.fillRect(barX, barY, Math.round(barW * ratio), 8);

    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(
      `${lang === 'id' ? enemy.nameId : enemy.nameEn} ${enemy.hp}/${enemy.maxHp}${enemy.shield > 0 ? ` (+${enemy.shield})` : ''}`,
      ex,
      barY + 22
    );
  });

  // Render floating damage numbers in screen space during battle
  ctx.font = 'bold 18px "Silkscreen", monospace';
  ctx.textAlign = 'center';
  for (const ft of floatingTexts) {
    ctx.globalAlpha = Math.max(0, Math.min(1, ft.life / ft.maxLife));
    ctx.fillStyle = '#0f172a';
    ctx.fillText(ft.text, ft.x + 2, ft.y + 2);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function renderFloatingTexts(ctx: CanvasRenderingContext2D, floatingTexts: FloatingText[]) {
  ctx.font = 'bold 10px "Silkscreen", monospace';
  ctx.textAlign = 'center';
  for (const ft of floatingTexts) {
    ctx.globalAlpha = Math.max(0, Math.min(1, ft.life / ft.maxLife));
    ctx.fillStyle = '#0f172a';
    ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
  }
  ctx.globalAlpha = 1;
}
