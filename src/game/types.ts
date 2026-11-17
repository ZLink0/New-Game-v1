export type GameState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'BATTLE'
  | 'VICTORY'
  | 'GAME_OVER';

export type SceneZone = 'HOMESTEAD' | 'DUNGEON';

export type Language = 'en' | 'id';

export type Direction = 'down' | 'up' | 'left' | 'right';

export type ItemCategory = 'tool' | 'seed' | 'crop' | 'resource' | 'consumable';

export type ItemId =
  | 'sword'
  | 'pickaxe'
  | 'axe'
  | 'watering_can'
  | 'turnip_seed'
  | 'tomato_seed'
  | 'corn_seed'
  | 'moonherb_seed'
  | 'turnip'
  | 'tomato'
  | 'corn'
  | 'moonherb'
  | 'stone'
  | 'wood'
  | 'rune_crystal'
  | 'gold_ore'
  | 'hp_potion'
  | 'rp_elixir';

export interface ItemDef {
  id: ItemId;
  nameEn: string;
  nameId: string;
  category: ItemCategory;
  sellPrice: number;
  buyPrice?: number;
  healHp?: number;
  healRp?: number;
  atkBuff?: number;
  cropId?: CropId;
  descEn: string;
  descId: string;
}

export type CropId = 'turnip' | 'tomato' | 'corn' | 'moonherb';

export interface CropDef {
  id: CropId;
  seedId: ItemId;
  nameEn: string;
  nameId: string;
  growDays: number;
  sellPrice: number;
  seedPrice: number;
  healHp: number;
  healRp: number;
  regrows?: boolean;
}

export interface FarmPlot {
  id: string;
  tileX: number;
  tileY: number;
  cropId: CropId | null;
  stage: number; // 0 = empty soil, 1..growDays = growing, growDays+1 = mature
  watered: boolean;
}

export interface ResourceNode {
  id: string;
  tileX: number;
  tileY: number;
  kind: 'CRYSTAL_ROCK' | 'STONE_ROCK' | 'TIMBER_STUMP';
  hp: number;
  maxHp: number;
  depletedDay: number | null;
}

export interface AnimalEntity {
  id: string;
  kind: 'CHICKEN' | 'SHEEP' | 'SLIME_BUDDY';
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  waitTimer: number;
  facing: 'left' | 'right';
  bobPhase: number;
  readyToPetDay: number;
}

export type InventoryMap = Partial<Record<ItemId, number>>;

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  rp: number; // Rune Points (Stamina / Magic)
  maxRp: number;
  baseAtk: number;
  baseDef: number;
  swordLevel: number;
  armorLevel: number;
  pickaxeLevel: number;
  axeLevel: number;
  canLevel: number;
  gold: number;
  day: number;
  season: 'Spring' | 'Summer' | 'Autumn';
  timeMinutes: number; // 360 = 06:00
}

export type RelicId =
  | 'vampiric_edge'
  | 'iron_bark'
  | 'arcane_echo'
  | 'harvest_boon'
  | 'twin_slash'
  | 'thorns_ward'
  | 'ember_brand'
  | 'crystal_heart'
  | 'crit_mastery'
  | 'lucky_pouch';

export interface RelicDef {
  id: RelicId;
  nameEn: string;
  nameId: string;
  descEn: string;
  descId: string;
  color: string;
}

export type RuneSkillId = 'cyclone' | 'ignis' | 'frost_guard' | 'earthshaker';

export interface RuneSkillDef {
  id: RuneSkillId;
  nameEn: string;
  nameId: string;
  rpCost: number;
  powerMult: number;
  element: 'wind' | 'fire' | 'ice' | 'earth';
  aoe?: boolean;
  stunChance?: number;
  shieldTurns?: number;
  descEn: string;
  descId: string;
}

export type EnemyArchetypeId =
  | 'slime_void'
  | 'goblin_raider'
  | 'bone_archer'
  | 'shadow_bat'
  | 'crystal_golem'
  | 'crimson_minotaur'
  | 'abyssal_lich';

export type EnemyIntentType = 'ATTACK' | 'HEAVY' | 'DEFEND' | 'POISON' | 'BUFF';

export interface EnemyUnit {
  uid: string;
  archetype: EnemyArchetypeId;
  nameEn: string;
  nameId: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  xpReward: number;
  goldReward: number;
  isBoss?: boolean;
  intent: EnemyIntentType;
  intentValue: number;
  shield: number;
  poisonTurns: number;
  stunned: boolean;
  hitFlash: number;
}

export interface DungeonEntity {
  id: string;
  kind: 'ENEMY' | 'CHEST' | 'ALTAR' | 'FOUNTAIN' | 'ORE' | 'STAIRS' | 'RETURN_PORTAL';
  tileX: number;
  tileY: number;
  enemyGroup?: EnemyArchetypeId[];
  opened?: boolean;
  isBoss?: boolean;
}

export type DungeonTileType = 0 | 1 | 2; // 0 = void/wall, 1 = stone floor, 2 = corridor/pillar decor

export interface DungeonFloor {
  floorNumber: number;
  width: number;
  height: number;
  tiles: DungeonTileType[][];
  explored: boolean[][];
  entities: DungeonEntity[];
  spawnX: number;
  spawnY: number;
}

export interface BattleState {
  floorNumber: number;
  sourceEntityId: string;
  isBoss: boolean;
  enemies: EnemyUnit[];
  selectedTargetIndex: number;
  turn: 'PLAYER' | 'ANIMATING' | 'ENEMY' | 'VICTORY' | 'DEFEAT';
  round: number;
  runeCharge: number; // 0..3 charges
  playerDefending: boolean;
  playerAtkBuffTurns: number;
  playerShieldTurns: number;
  playerPoisonTurns: number;
  logEn: string;
  logId: string;
  pendingRelicChoices: RelicId[] | null;
  rewardsGold: number;
  rewardsXp: number;
  rewardsItems: Partial<Record<ItemId, number>>;
}

export interface QuestProgress {
  id: string;
  titleEn: string;
  titleId: string;
  descEn: string;
  descId: string;
  target: number;
  progress: number;
  rewardGold: number;
  rewardItem?: { id: ItemId; count: number };
  claimed: boolean;
  kind: 'HARVEST' | 'MINE' | 'DEFEAT' | 'CRAFT' | 'FLOOR';
}

export interface CraftRecipe {
  id: string;
  kind: 'UPGRADE' | 'ITEM';
  nameEn: string;
  nameId: string;
  descEn: string;
  descId: string;
  goldCost: number;
  ingredients: { id: ItemId; count: number }[];
  upgradeTool?: 'sword' | 'pickaxe' | 'axe' | 'watering_can' | 'armor';
  outputItem?: { id: ItemId; count: number };
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  kind: 'petal' | 'smoke' | 'spark' | 'water' | 'slash' | 'portal';
}

export type ActiveModal =
  | null
  | 'INVENTORY'
  | 'FORGE'
  | 'QUESTS'
  | 'GUIDE'
  | 'SLEEP_CONFIRM'
  | 'RELIC_DRAFT';
