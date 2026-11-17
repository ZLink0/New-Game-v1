import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BattleHud } from './components/BattleHud';
import { GameCanvas, PlayerPosRef } from './components/GameCanvas';
import { HudOverlay } from './components/HudOverlay';
import { Modals, TitleScreenOverlay } from './components/Modals';
import { sound } from './game/audio';
import {
  createBattleState,
  performDefend,
  performPlayerStrike,
  performRuneSkill,
  performUseItemInBattle,
} from './game/battleEngine';
import {
  CRAFT_RECIPES,
  CROPS,
  HOTBAR_SLOTS,
  INITIAL_QUESTS,
  ITEMS,
  RELICS,
  TEXT,
  TILE_SIZE,
} from './game/data';
import { generateDungeonFloor } from './game/dungeonGen';
import {
  createInitialAnimals,
  createInitialFarmPlots,
  createInitialResourceNodes,
  HOMESTEAD_INTERACTABLES,
} from './game/homesteadMap';
import {
  ActiveModal,
  AnimalEntity,
  BattleState,
  DungeonFloor,
  FarmPlot,
  FloatingText,
  GameState,
  InventoryMap,
  ItemId,
  Language,
  PlayerStats,
  QuestProgress,
  RelicId,
  ResourceNode,
  RuneSkillId,
  SceneZone,
} from './game/types';

const SAVE_KEY = 'runevale_save_v1';

function createInitialStats(): PlayerStats {
  return {
    level: 1,
    xp: 0,
    xpToNext: 60,
    hp: 100,
    maxHp: 100,
    rp: 50,
    maxRp: 50,
    baseAtk: 14,
    baseDef: 3,
    swordLevel: 1,
    armorLevel: 1,
    pickaxeLevel: 1,
    axeLevel: 1,
    canLevel: 1,
    gold: 250,
    day: 1,
    season: 'Spring',
    timeMinutes: 480, // 08:00
  };
}

function createInitialInventory(): InventoryMap {
  return {
    sword: 1,
    pickaxe: 1,
    axe: 1,
    watering_can: 1,
    turnip_seed: 12,
    tomato_seed: 4,
    turnip: 3,
    stone: 10,
    wood: 8,
    rune_crystal: 2,
    hp_potion: 2,
  };
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [sceneZone, setSceneZone] = useState<SceneZone>('HOMESTEAD');
  const [lang, setLang] = useState<Language>('en');
  const [muted, setMuted] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 820 : false
  );

  const [stats, setStats] = useState<PlayerStats>(createInitialStats);
  const [inventory, setInventory] = useState<InventoryMap>(createInitialInventory);
  const [farmPlots, setFarmPlots] = useState<FarmPlot[]>(createInitialFarmPlots);
  const [resourceNodes, setResourceNodes] = useState<ResourceNode[]>(createInitialResourceNodes);
  const [animals, setAnimals] = useState<AnimalEntity[]>(createInitialAnimals);
  const [quests, setQuests] = useState<QuestProgress[]>(INITIAL_QUESTS);
  const [relics, setRelics] = useState<RelicId[]>([]);

  const [activeSeedId, setActiveSeedId] = useState<ItemId>('turnip_seed');
  const [activeFoodId, setActiveFoodId] = useState<ItemId>('turnip');
  const [selectedSlot, setSelectedSlot] = useState<number>(0);

  const [dungeonFloor, setDungeonFloor] = useState<DungeonFloor | null>(null);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [altarRelicChoices, setAltarRelicChoices] = useState<RelicId[] | null>(null);
  const [altarEntityId, setAltarEntityId] = useState<string | null>(null);

  const [nearPrompt, setNearPrompt] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [playerTile, setPlayerTile] = useState<{ x: number; y: number }>({ x: 11.5, y: 11.5 });
  const [runStats, setRunStats] = useState({ monstersDefeated: 0, cropsHarvested: 0, maxFloor: 1 });
  const [hasSave, setHasSave] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(SAVE_KEY));
    } catch {
      return false;
    }
  });

  // High-frequency refs for the 60fps canvas loop
  const playerPosRef = useRef<PlayerPosRef>({ x: 11.5, y: 11.5, dir: 'down' });
  const touchInputRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const actionQueueRef = useRef<number>(0);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const shakeRef = useRef<number>(0);
  const hitstopRef = useRef<number>(0);
  const floatIdRef = useRef<number>(1);
  const toastTimerRef = useRef<number | null>(null);

  const hotbarItems = useMemo<ItemId[]>(() => {
    const slots = [...HOTBAR_SLOTS];
    slots[4] = activeSeedId;
    slots[5] = activeFoodId;
    return slots;
  }, [activeSeedId, activeFoodId]);

  const selectedHotbarItem = hotbarItems[selectedSlot] ?? 'sword';

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  const spawnFloatingText = useCallback((x: number, y: number, text: string, color = '#fef08a') => {
    floatingTextsRef.current.push({
      id: floatIdRef.current++,
      x,
      y,
      text,
      color,
      life: 1.0,
      maxLife: 1.0,
      vy: -24,
    });
  }, []);

  const saveProgress = useCallback(
    (overrideStats?: PlayerStats) => {
      try {
        const payload = {
          stats: overrideStats ?? stats,
          inventory,
          farmPlots,
          resourceNodes,
          quests,
          activeSeedId,
          activeFoodId,
          runStats,
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
        setHasSave(true);
        showToast(TEXT[lang].savedToast);
      } catch {
        // Ignore storage errors
      }
    },
    [activeFoodId, activeSeedId, farmPlots, inventory, lang, quests, resourceNodes, runStats, showToast, stats]
  );

  const loadProgress = useCallback(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.stats) setStats(data.stats);
      if (data.inventory) setInventory(data.inventory);
      if (data.farmPlots) setFarmPlots(data.farmPlots);
      if (data.resourceNodes) setResourceNodes(data.resourceNodes);
      if (data.quests) setQuests(data.quests);
      if (data.activeSeedId) setActiveSeedId(data.activeSeedId);
      if (data.activeFoodId) setActiveFoodId(data.activeFoodId);
      if (data.runStats) setRunStats(data.runStats);
      playerPosRef.current = { x: 11.5, y: 11.5, dir: 'down' };
      setSceneZone('HOMESTEAD');
      setDungeonFloor(null);
      setRelics([]);
      setBattleState(null);
      setActiveModal(null);
      setGameState('PLAYING');
    } catch {
      // Fallback if save corrupted
    }
  }, []);

  const startNewGame = useCallback(() => {
    setStats(createInitialStats());
    setInventory(createInitialInventory());
    setFarmPlots(createInitialFarmPlots());
    setResourceNodes(createInitialResourceNodes());
    setAnimals(createInitialAnimals());
    setQuests(INITIAL_QUESTS);
    setRelics([]);
    setActiveSeedId('turnip_seed');
    setActiveFoodId('turnip');
    setSelectedSlot(0);
    setDungeonFloor(null);
    setBattleState(null);
    setActiveModal(null);
    setRunStats({ monstersDefeated: 0, cropsHarvested: 0, maxFloor: 1 });
    playerPosRef.current = { x: 11.5, y: 11.5, dir: 'down' };
    setSceneZone('HOMESTEAD');
    setGameState('PLAYING');
    sound.playPortal();
  }, []);

  // Global keyboard shortcuts (1-9 hotbar, Escape pause, Enter start)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'TITLE_MENU') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          if (hasSave) loadProgress();
          else startNewGame();
        }
        return;
      }

      if (e.code === 'Escape') {
        if (activeModal) {
          setActiveModal(null);
        } else if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
        }
        return;
      }

      if (gameState === 'PLAYING' && !activeModal) {
        if (e.key >= '1' && e.key <= '9') {
          setSelectedSlot(Number(e.key) - 1);
        } else if (e.code === 'KeyB' || e.code === 'KeyI') {
          setActiveModal('INVENTORY');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModal, gameState, hasSave, loadProgress, startNewGame]);

  // Gentle daylight clock tick while Playing
  useEffect(() => {
    if (gameState !== 'PLAYING' || activeModal) return;
    const timer = window.setInterval(() => {
      setStats((prev) => ({
        ...prev,
        timeMinutes: prev.timeMinutes >= 1380 ? 360 : prev.timeMinutes + 5,
      }));
    }, 3500);
    return () => window.clearInterval(timer);
  }, [activeModal, gameState]);

  const advanceQuest = useCallback((kind: QuestProgress['kind'], amount = 1) => {
    setQuests((prev) =>
      prev.map((q) => (q.kind === kind && !q.claimed ? { ...q, progress: q.progress + amount } : q))
    );
  }, []);

  const enterDungeonFloor = useCallback(
    (floorNum: number) => {
      const floor = generateDungeonFloor(floorNum);
      setDungeonFloor(floor);
      setSceneZone('DUNGEON');
      playerPosRef.current = { x: floor.spawnX, y: floor.spawnY, dir: 'down' };
      setRunStats((r) => ({ ...r, maxFloor: Math.max(r.maxFloor, floorNum) }));
      sound.playPortal();
      showToast(lang === 'id' ? `Memasuki Abyss Lantai ${floorNum}` : `Entered Abyss Floor ${floorNum}`);
    },
    [lang, showToast]
  );

  const returnToHomestead = useCallback(() => {
    setSceneZone('HOMESTEAD');
    setDungeonFloor(null);
    setBattleState(null);
    setRelics([]);
    playerPosRef.current = { x: 19.5, y: 6.2, dir: 'down' };
    sound.playPortal();
  }, []);

  const startEncounter = useCallback(
    (floor: DungeonFloor, entId: string, group: NonNullable<DungeonFloor['entities'][0]['enemyGroup']>, isBoss: boolean) => {
      const { battle, updatedStats } = createBattleState(
        floor.floorNumber,
        entId,
        group,
        isBoss,
        stats,
        relics
      );
      setStats(updatedStats);
      setBattleState(battle);
      setGameState('BATTLE');
      sound.playPortal();
    },
    [relics, stats]
  );

  // Check proximity auto-engage with Dungeon Enemies
  const handleTilePositionTick = useCallback(
    (px: number, py: number) => {
      setPlayerTile({ x: px, y: py });
      if (sceneZone === 'DUNGEON' && dungeonFloor && gameState === 'PLAYING' && !activeModal) {
        const enemyEnt = dungeonFloor.entities.find(
          (e) =>
            e.kind === 'ENEMY' &&
            !e.opened &&
            Math.hypot(px - (e.tileX + 0.5), py - (e.tileY + 0.5)) < 0.72
        );
        if (enemyEnt && enemyEnt.enemyGroup) {
          startEncounter(dungeonFloor, enemyEnt.id, enemyEnt.enemyGroup, Boolean(enemyEnt.isBoss));
        }
      }
    },
    [activeModal, dungeonFloor, gameState, sceneZone, startEncounter]
  );

  // Contextual Action Handler (Space / E / Click / A Button)
  const handlePlayerAction = useCallback(
    (targetTileX: number, targetTileY: number) => {
      if (gameState !== 'PLAYING' || activeModal) return;
      const pos = playerPosRef.current;

      if (sceneZone === 'DUNGEON' && dungeonFloor) {
        const nearby = dungeonFloor.entities.find(
          (e) => !e.opened && Math.hypot(pos.x - (e.tileX + 0.5), pos.y - (e.tileY + 0.5)) <= 1.55
        );
        if (!nearby) return;

        if (nearby.kind === 'ENEMY' && nearby.enemyGroup) {
          startEncounter(dungeonFloor, nearby.id, nearby.enemyGroup, Boolean(nearby.isBoss));
        } else if (nearby.kind === 'CHEST') {
          nearby.opened = true;
          setDungeonFloor({ ...dungeonFloor });
          const bonusGold = 55 + dungeonFloor.floorNumber * 25;
          setStats((s) => ({ ...s, gold: s.gold + bonusGold }));
          setInventory((inv) => ({
            ...inv,
            hp_potion: (inv.hp_potion ?? 0) + 1,
            rune_crystal: (inv.rune_crystal ?? 0) + 1,
          }));
          sound.playCoin();
          spawnFloatingText((nearby.tileX + 0.5) * TILE_SIZE, nearby.tileY * TILE_SIZE, `+${bonusGold}G +Potion`, '#fde047');
        } else if (nearby.kind === 'FOUNTAIN') {
          nearby.opened = true;
          setDungeonFloor({ ...dungeonFloor });
          setStats((s) => ({
            ...s,
            hp: Math.min(s.maxHp, s.hp + Math.round(s.maxHp * 0.55)),
            rp: Math.min(s.maxRp, s.rp + Math.round(s.maxRp * 0.65)),
          }));
          sound.playHarvest();
          spawnFloatingText((nearby.tileX + 0.5) * TILE_SIZE, nearby.tileY * TILE_SIZE, 'HP/RP Restored!', '#4ade80');
        } else if (nearby.kind === 'ORE') {
          nearby.opened = true;
          setDungeonFloor({ ...dungeonFloor });
          setInventory((inv) => ({
            ...inv,
            rune_crystal: (inv.rune_crystal ?? 0) + 2,
            gold_ore: (inv.gold_ore ?? 0) + 1,
          }));
          sound.playMine();
          advanceQuest('MINE', 1);
          spawnFloatingText((nearby.tileX + 0.5) * TILE_SIZE, nearby.tileY * TILE_SIZE, '+2 Crystal +1 Gold', '#38bdf8');
        } else if (nearby.kind === 'ALTAR') {
          const allRelicIds = Object.keys(RELICS) as RelicId[];
          const unowned = allRelicIds.filter((r) => !relics.includes(r));
          if (unowned.length > 0) {
            setAltarEntityId(nearby.id);
            setAltarRelicChoices([...unowned].sort(() => Math.random() - 0.5).slice(0, 3));
            setActiveModal('RELIC_DRAFT');
            sound.playMagic();
          } else {
            nearby.opened = true;
            setDungeonFloor({ ...dungeonFloor });
            setStats((s) => ({ ...s, rp: s.maxRp }));
          }
        } else if (nearby.kind === 'STAIRS') {
          const bossAlive = dungeonFloor.entities.some((e) => e.kind === 'ENEMY' && e.isBoss && !e.opened);
          if (bossAlive) {
            showToast(lang === 'id' ? 'Kalahkan Bos lantai ini dulu!' : 'Defeat the Floor Boss first!');
            return;
          }
          enterDungeonFloor(dungeonFloor.floorNumber + 1);
        } else if (nearby.kind === 'RETURN_PORTAL') {
          returnToHomestead();
        }
        return;
      }

      // === HOMESTEAD INTERACTIONS ===
      // 1. Landmarks
      for (const inter of HOMESTEAD_INTERACTABLES) {
        if (Math.hypot(pos.x - (inter.tileX + 0.5), pos.y - (inter.tileY + 0.5)) <= inter.radius) {
          if (inter.kind === 'COTTAGE_DOOR') {
            setActiveModal('SLEEP_CONFIRM');
          } else if (inter.kind === 'SHIPPING_BIN') {
            setActiveModal('INVENTORY');
          } else if (inter.kind === 'QUEST_BOARD') {
            setActiveModal('QUESTS');
          } else if (inter.kind === 'FORGE') {
            setActiveModal('FORGE');
          } else if (inter.kind === 'RUNE_SHRINE') {
            const healed = { ...stats, hp: stats.maxHp, rp: stats.maxRp };
            setStats(healed);
            sound.playMagic();
            spawnFloatingText(pos.x * TILE_SIZE, (pos.y - 0.8) * TILE_SIZE, 'Full HP & RP!', '#38bdf8');
            saveProgress(healed);
          } else if (inter.kind === 'DUNGEON_PORTAL') {
            enterDungeonFloor(1);
          }
          return;
        }
      }

      // 2. Animals petting
      const nearAnimal = animals.find((a) => Math.hypot(pos.x - a.x, pos.y - a.y) < 1.25);
      if (nearAnimal) {
        if (nearAnimal.readyToPetDay < stats.day) {
          nearAnimal.readyToPetDay = stats.day;
          setAnimals([...animals]);
          setStats((s) => ({
            ...s,
            rp: Math.min(s.maxRp, s.rp + 6),
            gold: s.gold + (nearAnimal.kind === 'SLIME_BUDDY' ? 0 : 20),
          }));
          if (nearAnimal.kind === 'SLIME_BUDDY') {
            setInventory((inv) => ({ ...inv, rune_crystal: (inv.rune_crystal ?? 0) + 1 }));
            spawnFloatingText(nearAnimal.x * TILE_SIZE, nearAnimal.y * TILE_SIZE - 14, '+1 Rune Crystal ♥', '#38bdf8');
          } else {
            spawnFloatingText(nearAnimal.x * TILE_SIZE, nearAnimal.y * TILE_SIZE - 14, '+20G +6RP ♥', '#f472b6');
          }
          sound.playHarvest();
        } else {
          spawnFloatingText(nearAnimal.x * TILE_SIZE, nearAnimal.y * TILE_SIZE - 14, '♥', '#f9a8d4');
        }
        return;
      }

      // 3. Farm Plots (check player standing tile first, then faced tile)
      const pTileX = Math.floor(pos.x);
      const pTileY = Math.floor(pos.y);
      const plot =
        farmPlots.find((p) => p.tileX === pTileX && p.tileY === pTileY) ??
        farmPlots.find((p) => p.tileX === targetTileX && p.tileY === targetTileY);

      if (plot) {
        if (plot.cropId) {
          const def = CROPS[plot.cropId];
          // Harvest if mature
          if (plot.stage >= def.growDays) {
            const cropId = plot.cropId;
            setFarmPlots((prev) =>
              prev.map((p) =>
                p.id === plot.id
                  ? {
                      ...p,
                      cropId: def.regrows ? cropId : null,
                      stage: def.regrows ? 2 : 0,
                    }
                  : p
              )
            );
            setInventory((inv) => ({ ...inv, [cropId]: (inv[cropId] ?? 0) + 1 }));
            setActiveFoodId(cropId);
            setRunStats((r) => ({ ...r, cropsHarvested: r.cropsHarvested + 1 }));
            advanceQuest('HARVEST', 1);
            sound.playHarvest();
            spawnFloatingText(
              (plot.tileX + 0.5) * TILE_SIZE,
              plot.tileY * TILE_SIZE,
              `+1 ${lang === 'id' ? def.nameId : def.nameEn}`,
              '#4ade80'
            );
            return;
          }
          // Water if unwatered
          if (!plot.watered) {
            if (stats.rp < 2) {
              showToast(lang === 'id' ? 'RP habis! Pulihkan di Kuil atau makan panen.' : 'Low RP! Heal at Shrine or eat crops.');
              return;
            }
            setStats((s) => ({ ...s, rp: Math.max(0, s.rp - 2) }));
            setFarmPlots((prev) => prev.map((p) => (p.id === plot.id ? { ...p, watered: true } : p)));
            sound.playWater();
            spawnFloatingText((plot.tileX + 0.5) * TILE_SIZE, plot.tileY * TILE_SIZE, 'Watered', '#38bdf8');
            return;
          }
        } else {
          // Empty soil -> Plant selected seed (or activeSeedId if holding watering can/seed)
          const seedToPlant = ITEMS[selectedHotbarItem].category === 'seed' ? selectedHotbarItem : activeSeedId;
          const seedCount = inventory[seedToPlant] ?? 0;
          if (seedCount > 0 && ITEMS[seedToPlant].cropId) {
            const cropId = ITEMS[seedToPlant].cropId!;
            setInventory((inv) => ({ ...inv, [seedToPlant]: seedCount - 1 }));
            setFarmPlots((prev) =>
              prev.map((p) => (p.id === plot.id ? { ...p, cropId, stage: 1 } : p))
            );
            sound.playPlant();
            spawnFloatingText((plot.tileX + 0.5) * TILE_SIZE, plot.tileY * TILE_SIZE, 'Planted!', '#a3e635');
          } else {
            showToast(lang === 'id' ? 'Bibit habis! Beli di Peti Pengiriman.' : 'Out of seeds! Buy more at the Shipping Bin.');
          }
          return;
        }
      }

      // 4. Resource Nodes (Crystal Rock, Stone Rock, Timber Stump)
      const node = resourceNodes.find(
        (n) =>
          n.depletedDay === null &&
          ((n.tileX === targetTileX && n.tileY === targetTileY) ||
            Math.hypot(pos.x - (n.tileX + 0.5), pos.y - (n.tileY + 0.5)) <= 1.35)
      );
      if (node) {
        if (stats.rp < 3) {
          showToast(lang === 'id' ? 'RP habis! Pulihkan di Kuil Biru.' : 'Out of RP! Restore at the Blue Rune Shrine.');
          return;
        }
        const dmg =
          node.kind === 'TIMBER_STUMP'
            ? selectedHotbarItem === 'axe'
              ? stats.axeLevel + 1
              : 1
            : selectedHotbarItem === 'pickaxe'
            ? stats.pickaxeLevel + 1
            : 1;
        const nextHp = node.hp - dmg;
        setStats((s) => ({ ...s, rp: Math.max(0, s.rp - 3) }));
        shakeRef.current = 4;

        if (node.kind === 'TIMBER_STUMP') sound.playChop();
        else sound.playMine();

        if (nextHp <= 0) {
          setResourceNodes((prev) =>
            prev.map((n) => (n.id === node.id ? { ...n, hp: 0, depletedDay: stats.day } : n))
          );
          if (node.kind === 'CRYSTAL_ROCK') {
            const crystalGain = stats.pickaxeLevel >= 2 ? 2 : 1;
            setInventory((inv) => ({
              ...inv,
              rune_crystal: (inv.rune_crystal ?? 0) + crystalGain,
              stone: (inv.stone ?? 0) + 2,
            }));
            advanceQuest('MINE', 1);
            spawnFloatingText((node.tileX + 0.5) * TILE_SIZE, node.tileY * TILE_SIZE, `+${crystalGain} Crystal +2 Stone`, '#38bdf8');
          } else if (node.kind === 'STONE_ROCK') {
            setInventory((inv) => ({
              ...inv,
              stone: (inv.stone ?? 0) + 3,
              gold_ore: (inv.gold_ore ?? 0) + (Math.random() < 0.45 ? 1 : 0),
            }));
            advanceQuest('MINE', 1);
            spawnFloatingText((node.tileX + 0.5) * TILE_SIZE, node.tileY * TILE_SIZE, '+3 Stone', '#cbd5e1');
          } else {
            setInventory((inv) => ({ ...inv, wood: (inv.wood ?? 0) + 3 }));
            spawnFloatingText((node.tileX + 0.5) * TILE_SIZE, node.tileY * TILE_SIZE, '+3 Wood', '#d97706');
          }
        } else {
          setResourceNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, hp: nextHp } : n)));
        }
      }
    },
    [
      activeModal,
      activeSeedId,
      advanceQuest,
      animals,
      dungeonFloor,
      enterDungeonFloor,
      farmPlots,
      gameState,
      inventory,
      lang,
      relics,
      resourceNodes,
      returnToHomestead,
      saveProgress,
      sceneZone,
      selectedHotbarItem,
      showToast,
      spawnFloatingText,
      startEncounter,
      stats,
    ]
  );

  // Sleep & Advance Day
  const handleConfirmSleep = useCallback(() => {
    const nextDay = stats.day + 1;
    setStats((s) => ({
      ...s,
      day: nextDay,
      timeMinutes: 360,
      hp: s.maxHp,
      rp: s.maxRp,
    }));
    setFarmPlots((prev) =>
      prev.map((p) => {
        if (!p.cropId) return { ...p, watered: false };
        const def = CROPS[p.cropId];
        const nextStage = p.watered ? Math.min(def.growDays, p.stage + 1) : p.stage;
        return { ...p, stage: nextStage, watered: false };
      })
    );
    setResourceNodes((prev) =>
      prev.map((n) =>
        n.depletedDay !== null && nextDay > n.depletedDay
          ? { ...n, hp: n.maxHp, depletedDay: null }
          : n
      )
    );
    setActiveModal(null);
    sound.playLevelUp();
    showToast(lang === 'id' ? `Hari ke-${nextDay} dimulai!` : `Day ${nextDay} begins!`);
  }, [lang, showToast, stats.day]);

  // Battle UI Event Processor
  const applyCombatResult = useCallback(
    (res: ReturnType<typeof performPlayerStrike>) => {
      setBattleState(res.battle);
      setStats(res.stats);
      setInventory(res.inventory);

      const w = typeof window !== 'undefined' ? window.innerWidth : 1000;
      const h = typeof window !== 'undefined' ? window.innerHeight : 700;

      for (const ev of res.events) {
        if (ev.sfx === 'slash') sound.playSlash();
        else if (ev.sfx === 'crit') sound.playCrit();
        else if (ev.sfx === 'magic') sound.playMagic();
        else if (ev.sfx === 'defend') sound.playDefend();
        else if (ev.sfx === 'hit') sound.playHit();
        else if (ev.sfx === 'harvest') sound.playHarvest();
        else if (ev.sfx === 'victory') sound.playVictory();

        if (ev.damage && ev.targetUid) {
          const idx = res.battle.enemies.findIndex((e) => e.uid === ev.targetUid);
          const count = res.battle.enemies.length;
          const ex = w * 0.68 + (idx - (count - 1) / 2) * Math.min(130, w * 0.15);
          const ey = h * 0.42;
          spawnFloatingText(ex, ey, ev.crit ? `CRIT -${ev.damage}!` : `-${ev.damage}`, ev.crit ? '#fde047' : '#fb7185');
          if (ev.crit) {
            hitstopRef.current = 0.055;
            shakeRef.current = 8;
          } else {
            shakeRef.current = 4;
          }
        }
        if (ev.playerHit) {
          spawnFloatingText(w * 0.26, h * 0.42, `-${ev.playerHit}`, '#ef4444');
          shakeRef.current = 6;
        }
        if (ev.heal) {
          spawnFloatingText(w * 0.26, h * 0.4, `+${ev.heal} HP`, '#4ade80');
        }
      }

      if (res.battle.turn === 'DEFEAT') {
        sound.playDefeat();
        setGameState('GAME_OVER');
      }
    },
    [spawnFloatingText]
  );

  const finishBattleVictory = useCallback(
    (chosenRelic: RelicId | null) => {
      if (!battleState || !dungeonFloor) return;
      if (chosenRelic) {
        setRelics((prev) => [...prev, chosenRelic]);
        if (chosenRelic === 'crystal_heart') {
          setStats((s) => ({
            ...s,
            maxHp: s.maxHp + 25,
            hp: s.hp + 25,
            maxRp: s.maxRp + 15,
            rp: s.rp + 15,
          }));
        }
      }

      const defeatedCount = battleState.enemies.length;
      setRunStats((r) => ({ ...r, monstersDefeated: r.monstersDefeated + defeatedCount }));
      advanceQuest('DEFEAT', defeatedCount);

      // Mark enemy group cleared on floor
      const nextEntities = dungeonFloor.entities.map((e) =>
        e.id === battleState.sourceEntityId ? { ...e, opened: true } : e
      );
      setDungeonFloor({ ...dungeonFloor, entities: nextEntities });

      const clearedFloor5Boss = battleState.isBoss && battleState.floorNumber === 5;
      setBattleState(null);

      if (clearedFloor5Boss) {
        advanceQuest('FLOOR', 1);
        setGameState('VICTORY');
      } else {
        setGameState('PLAYING');
      }
    },
    [advanceQuest, battleState, dungeonFloor]
  );

  // Crafting & Shop Handlers
  const handleCraft = useCallback(
    (recipeId: string) => {
      const rec = CRAFT_RECIPES.find((r) => r.id === recipeId);
      if (!rec) return;
      const tier =
        rec.upgradeTool === 'sword'
          ? stats.swordLevel
          : rec.upgradeTool === 'armor'
          ? stats.armorLevel
          : rec.upgradeTool === 'pickaxe'
          ? stats.pickaxeLevel
          : 1;
      const goldCost = rec.goldCost * tier;
      if (stats.gold < goldCost) return;
      if (!rec.ingredients.every((i) => (inventory[i.id] ?? 0) >= i.count)) return;

      const nextInv = { ...inventory };
      for (const ing of rec.ingredients) {
        nextInv[ing.id] = (nextInv[ing.id] ?? 0) - ing.count;
      }
      if (rec.outputItem) {
        nextInv[rec.outputItem.id] = (nextInv[rec.outputItem.id] ?? 0) + rec.outputItem.count;
      }

      setInventory(nextInv);
      setStats((s) => {
        const next = { ...s, gold: s.gold - goldCost };
        if (rec.upgradeTool === 'sword') next.swordLevel += 1;
        if (rec.upgradeTool === 'armor') {
          next.armorLevel += 1;
          next.maxHp += 20;
          next.hp += 20;
        }
        if (rec.upgradeTool === 'pickaxe') next.pickaxeLevel += 1;
        return next;
      });
      sound.playForge();
      showToast(lang === 'id' ? 'Berhasil ditempa!' : 'Forged successfully!');
    },
    [inventory, lang, showToast, stats]
  );

  const handleEatItem = useCallback(
    (id: ItemId) => {
      const def = ITEMS[id];
      const count = inventory[id] ?? 0;
      if (count <= 0) return;
      setInventory((inv) => ({ ...inv, [id]: count - 1 }));
      setStats((s) => ({
        ...s,
        hp: Math.min(s.maxHp, s.hp + (def.healHp ?? 0)),
        rp: Math.min(s.maxRp, s.rp + (def.healRp ?? 0)),
      }));
      sound.playHarvest();
    },
    [inventory]
  );

  const handleSellItem = useCallback(
    (id: ItemId, qty: number) => {
      const def = ITEMS[id];
      const count = inventory[id] ?? 0;
      const sellQty = Math.min(count, qty);
      if (sellQty <= 0 || def.sellPrice <= 0) return;
      setInventory((inv) => ({ ...inv, [id]: count - sellQty }));
      setStats((s) => ({ ...s, gold: s.gold + def.sellPrice * sellQty }));
      sound.playCoin();
    },
    [inventory]
  );

  const handleBuyItem = useCallback(
    (id: ItemId, qty: number) => {
      const def = ITEMS[id];
      if (!def.buyPrice) return;
      const cost = def.buyPrice * qty;
      if (stats.gold < cost) return;
      setStats((s) => ({ ...s, gold: s.gold - cost }));
      setInventory((inv) => ({ ...inv, [id]: (inv[id] ?? 0) + qty }));
      if (def.category === 'seed') setActiveSeedId(id);
      sound.playCoin();
    },
    [stats.gold]
  );

  const handleClaimQuest = useCallback(
    (questId: string) => {
      const q = quests.find((x) => x.id === questId);
      if (!q || q.claimed || q.progress < q.target) return;
      setQuests((prev) => prev.map((x) => (x.id === questId ? { ...x, claimed: true } : x)));
      setStats((s) => ({ ...s, gold: s.gold + q.rewardGold }));
      if (q.rewardItem) {
        const reward = q.rewardItem;
        setInventory((inv) => ({ ...inv, [reward.id]: (inv[reward.id] ?? 0) + reward.count }));
      }
      sound.playLevelUp();
    },
    [quests]
  );

  const unclaimedQuests = quests.filter((q) => !q.claimed && q.progress >= q.target).length;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#0e131f]">
      {/* 60FPS ISOLATED 2D PIXEL HD CANVAS */}
      <GameCanvas
        gameState={gameState}
        sceneZone={sceneZone}
        lang={lang}
        selectedHotbarItem={selectedHotbarItem}
        farmPlots={farmPlots}
        resourceNodes={resourceNodes}
        animals={animals}
        dungeonFloor={dungeonFloor}
        battleState={battleState}
        playerPosRef={playerPosRef}
        touchInputRef={touchInputRef}
        actionQueueRef={actionQueueRef}
        floatingTextsRef={floatingTextsRef}
        shakeRef={shakeRef}
        hitstopRef={hitstopRef}
        onPlayerAction={handlePlayerAction}
        onSelectBattleTarget={(idx) =>
          setBattleState((b) => (b ? { ...b, selectedTargetIndex: idx } : b))
        }
        onTilePositionTick={handleTilePositionTick}
        onNearPromptChange={setNearPrompt}
      />

      {/* TITLE SCREEN */}
      {gameState === 'TITLE_MENU' && (
        <TitleScreenOverlay
          lang={lang}
          hasSave={hasSave}
          onStartNew={startNewGame}
          onContinue={loadProgress}
          onToggleLang={() => setLang((l) => (l === 'en' ? 'id' : 'en'))}
        />
      )}

      {/* OVERWORLD / DUNGEON HUD */}
      {gameState === 'PLAYING' && (
        <HudOverlay
          stats={stats}
          sceneZone={sceneZone}
          dungeonFloor={dungeonFloor}
          inventory={inventory}
          hotbarItems={hotbarItems}
          selectedSlot={selectedSlot}
          lang={lang}
          muted={muted}
          showTouchControls={showTouchControls}
          nearPrompt={nearPrompt}
          playerTile={playerTile}
          unclaimedQuests={unclaimedQuests}
          onSelectSlot={setSelectedSlot}
          onOpenModal={setActiveModal}
          onOpenPause={() => setGameState('PAUSED')}
          onToggleMute={() => {
            sound.muted = !muted;
            setMuted(!muted);
          }}
          onTriggerAction={() => {
            actionQueueRef.current += 1;
          }}
          onTouchDir={(dx, dy) => {
            touchInputRef.current = { dx, dy };
          }}
        />
      )}

      {/* TURN-BASED ROGUELIKE BATTLE HUD */}
      {gameState === 'BATTLE' && battleState && (
        <BattleHud
          battle={battleState}
          stats={stats}
          inventory={inventory}
          relics={relics}
          lang={lang}
          onStrike={() =>
            applyCombatResult(performPlayerStrike(battleState, stats, inventory, relics))
          }
          onSkill={(skillId: RuneSkillId) =>
            applyCombatResult(performRuneSkill(skillId, battleState, stats, inventory, relics))
          }
          onDefend={() =>
            applyCombatResult(performDefend(battleState, stats, inventory, relics))
          }
          onUseItem={(itemId) =>
            applyCombatResult(performUseItemInBattle(itemId, battleState, stats, inventory, relics))
          }
          onRetreat={() => {
            setBattleState(null);
            setGameState('PLAYING');
            // Push hero slightly back from enemy tile
            playerPosRef.current.y = Math.min(
              (dungeonFloor?.height ?? 20) - 2,
              playerPosRef.current.y + 1.2
            );
          }}
          onPickRelic={(rid) => finishBattleVictory(rid)}
          onFinishVictoryNoRelic={() => finishBattleVictory(null)}
        />
      )}

      {/* MODALS (PAUSE, INVENTORY/SHOP, FORGE, QUESTS, GUIDE, SLEEP, ALTAR, END) */}
      <Modals
        gameState={gameState}
        activeModal={activeModal}
        lang={lang}
        stats={stats}
        inventory={inventory}
        relics={relics}
        quests={quests}
        activeSeedId={activeSeedId}
        activeFoodId={activeFoodId}
        muted={muted}
        showTouchControls={showTouchControls}
        altarRelicChoices={altarRelicChoices}
        runStats={runStats}
        onCloseModal={() => setActiveModal(null)}
        onResume={() => setGameState('PLAYING')}
        onSaveGame={() => saveProgress()}
        onQuitToTitle={() => {
          setActiveModal(null);
          setGameState('TITLE_MENU');
        }}
        onToggleLang={() => setLang((l) => (l === 'en' ? 'id' : 'en'))}
        onToggleMute={() => {
          sound.muted = !muted;
          setMuted(!muted);
        }}
        onToggleTouch={() => setShowTouchControls((v) => !v)}
        onSelectActiveSeed={(id) => {
          setActiveSeedId(id);
          setSelectedSlot(4);
        }}
        onSelectActiveFood={(id) => {
          setActiveFoodId(id);
          setSelectedSlot(5);
        }}
        onEatItem={handleEatItem}
        onSellItem={handleSellItem}
        onBuyItem={handleBuyItem}
        onCraft={handleCraft}
        onClaimQuest={handleClaimQuest}
        onConfirmSleep={handleConfirmSleep}
        onPickAltarRelic={(rid) => {
          setRelics((prev) => [...prev, rid]);
          if (rid === 'crystal_heart') {
            setStats((s) => ({
              ...s,
              maxHp: s.maxHp + 25,
              hp: s.hp + 25,
              maxRp: s.maxRp + 15,
              rp: s.rp + 15,
            }));
          }
          if (dungeonFloor && altarEntityId) {
            setDungeonFloor({
              ...dungeonFloor,
              entities: dungeonFloor.entities.map((e) =>
                e.id === altarEntityId ? { ...e, opened: true } : e
              ),
            });
          }
          setAltarRelicChoices(null);
          setAltarEntityId(null);
          setActiveModal(null);
          sound.playLevelUp();
        }}
        onReturnHomeFromEnd={() => {
          setStats((s) => ({ ...s, hp: s.maxHp, rp: s.maxRp }));
          returnToHomestead();
          setGameState('PLAYING');
        }}
        onRestartNewGame={startNewGame}
      />

      {/* DISCRETE TOAST FEEDBACK */}
      {toast && (
        <div className="pointer-events-none fixed left-1/2 top-16 z-50 -translate-x-1/2">
          <div className="rpg-panel rounded-lg px-4 py-2 text-xs font-bold text-amber-200 shadow-xl">
            {toast}
          </div>
        </div>
      )}
    </main>
  );
}
