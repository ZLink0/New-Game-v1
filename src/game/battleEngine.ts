import { ENEMY_TEMPLATES, ITEMS, RELICS, RUNE_SKILLS } from './data';
import {
  BattleState,
  EnemyArchetypeId,
  EnemyIntentType,
  EnemyUnit,
  InventoryMap,
  ItemId,
  PlayerStats,
  RelicId,
  RuneSkillId,
} from './types';

function pickIntent(enemy: EnemyUnit, round: number): { intent: EnemyIntentType; value: number } {
  const atk = enemy.atk;
  if (enemy.archetype === 'abyssal_lich') {
    const cycle = round % 3;
    if (cycle === 1) return { intent: 'POISON', value: Math.round(atk * 0.9) };
    if (cycle === 2) return { intent: 'HEAVY', value: Math.round(atk * 1.65) };
    return { intent: 'DEFEND', value: 14 };
  }
  if (enemy.archetype === 'crimson_minotaur') {
    if (round % 2 === 0) return { intent: 'HEAVY', value: Math.round(atk * 1.6) };
    return { intent: 'ATTACK', value: atk };
  }
  if (enemy.archetype === 'crystal_golem') {
    if (round % 3 === 0) return { intent: 'DEFEND', value: 12 };
    if (round % 3 === 2) return { intent: 'HEAVY', value: Math.round(atk * 1.45) };
    return { intent: 'ATTACK', value: atk };
  }
  if (enemy.archetype === 'slime_void' && round % 3 === 2) {
    return { intent: 'POISON', value: Math.round(atk * 0.8) };
  }
  const r = Math.random();
  if (r < 0.2) return { intent: 'HEAVY', value: Math.round(atk * 1.45) };
  if (r < 0.35) return { intent: 'DEFEND', value: 8 };
  return { intent: 'ATTACK', value: atk };
}

export function createBattleState(
  floorNumber: number,
  sourceEntityId: string,
  archetypes: EnemyArchetypeId[],
  isBoss: boolean,
  stats: PlayerStats,
  relics: RelicId[]
): { battle: BattleState; updatedStats: PlayerStats } {
  const scale = 1 + (floorNumber - 1) * 0.22;
  const enemies: EnemyUnit[] = archetypes.map((arch, idx) => {
    const tpl = ENEMY_TEMPLATES[arch];
    const maxHp = Math.round(tpl.baseHp * scale);
    const atk = Math.round(tpl.baseAtk * (1 + (floorNumber - 1) * 0.16));
    const unit: EnemyUnit = {
      uid: `${arch}_${idx}_${Date.now()}`,
      archetype: arch,
      nameEn: tpl.nameEn,
      nameId: tpl.nameId,
      hp: maxHp,
      maxHp,
      atk,
      def: tpl.baseDef + Math.floor((floorNumber - 1) / 2),
      xpReward: Math.round(tpl.xp * scale),
      goldReward: Math.round(tpl.gold * scale),
      isBoss: tpl.isBoss,
      intent: 'ATTACK',
      intentValue: atk,
      shield: 0,
      poisonTurns: 0,
      stunned: false,
      hitFlash: 0,
    };
    const next = pickIntent(unit, 1);
    unit.intent = next.intent;
    unit.intentValue = next.value;
    return unit;
  });

  let nextStats = { ...stats };
  if (relics.includes('harvest_boon')) {
    nextStats.hp = Math.min(nextStats.maxHp, nextStats.hp + 15);
    nextStats.rp = Math.min(nextStats.maxRp, nextStats.rp + 10);
  }

  return {
    battle: {
      floorNumber,
      sourceEntityId,
      isBoss,
      enemies,
      selectedTargetIndex: 0,
      turn: 'PLAYER',
      round: 1,
      runeCharge: 0,
      playerDefending: false,
      playerAtkBuffTurns: 0,
      playerShieldTurns: 0,
      playerPoisonTurns: 0,
      logEn: isBoss
        ? `Boss Encounter: ${enemies[0].nameEn} blocks your path!`
        : `A wild ${enemies[0].nameEn} ambushed you!`,
      logId: isBoss
        ? `Pertarungan Bos: ${enemies[0].nameId} menghadangmu!`
        : `${enemies[0].nameId} menghadang langkahmu!`,
      pendingRelicChoices: null,
      rewardsGold: 0,
      rewardsXp: 0,
      rewardsItems: {},
    },
    updatedStats: nextStats,
  };
}

export function computePlayerAtk(stats: PlayerStats, relics: RelicId[], atkBuffTurns: number): number {
  let atk = stats.baseAtk + (stats.swordLevel - 1) * 5 + (stats.level - 1) * 2;
  if (relics.includes('ember_brand')) atk += 5;
  if (atkBuffTurns > 0) atk = Math.round(atk * 1.25);
  return atk;
}

export function computePlayerDef(stats: PlayerStats, relics: RelicId[]): number {
  let def = stats.baseDef + (stats.armorLevel - 1) * 3 + Math.floor((stats.level - 1) / 2);
  if (relics.includes('iron_bark')) def += 4;
  return def;
}

export function getSkillRpCost(skillId: RuneSkillId, relics: RelicId[]): number {
  const skill = RUNE_SKILLS.find((s) => s.id === skillId)!;
  return Math.max(4, skill.rpCost - (relics.includes('arcane_echo') ? 4 : 0));
}

export interface CombatActionResult {
  battle: BattleState;
  stats: PlayerStats;
  inventory: InventoryMap;
  events: {
    targetUid?: string;
    damage?: number;
    crit?: boolean;
    heal?: number;
    playerHit?: number;
    sfx: 'slash' | 'crit' | 'magic' | 'defend' | 'hit' | 'harvest' | 'victory';
  }[];
}

export function performPlayerStrike(
  battle: BattleState,
  stats: PlayerStats,
  inventory: InventoryMap,
  relics: RelicId[]
): CombatActionResult {
  const nextBattle: BattleState = {
    ...battle,
    enemies: battle.enemies.map((e) => ({ ...e })),
    playerDefending: false,
  };
  let nextStats = { ...stats };
  const events: CombatActionResult['events'] = [];

  const target = nextBattle.enemies[nextBattle.selectedTargetIndex] ?? nextBattle.enemies.find((e) => e.hp > 0);
  if (!target || target.hp <= 0) {
    return { battle: nextBattle, stats: nextStats, inventory, events };
  }

  const baseAtk = computePlayerAtk(nextStats, relics, nextBattle.playerAtkBuffTurns);
  const hits = relics.includes('twin_slash') ? 2 : 1;
  const hitMult = relics.includes('twin_slash') ? 0.65 : 1.0;
  const critChance = 0.12 + (relics.includes('crit_mastery') ? 0.25 : 0);

  let totalDealt = 0;
  let anyCrit = false;

  for (let h = 0; h < hits; h++) {
    if (target.hp <= 0) break;
    const isCrit = Math.random() < critChance;
    if (isCrit) anyCrit = true;
    const raw = Math.round(baseAtk * hitMult * (isCrit ? 1.75 : 1));
    const afterDef = Math.max(3, raw - target.def);
    let dmg = afterDef;
    if (target.shield > 0) {
      const absorbed = Math.min(target.shield, dmg);
      target.shield -= absorbed;
      dmg -= absorbed;
    }
    target.hp = Math.max(0, target.hp - dmg);
    target.hitFlash = 0.25;
    totalDealt += dmg;

    if (relics.includes('vampiric_edge')) {
      nextStats.hp = Math.min(nextStats.maxHp, nextStats.hp + 6);
    }
  }

  nextBattle.runeCharge = Math.min(3, nextBattle.runeCharge + 1);
  events.push({
    targetUid: target.uid,
    damage: totalDealt,
    crit: anyCrit,
    sfx: anyCrit ? 'crit' : 'slash',
  });

  nextBattle.logEn = `You struck ${target.nameEn} for ${totalDealt} DMG${anyCrit ? ' (CRIT!)' : ''}!`;
  nextBattle.logId = `Kamu menebas ${target.nameId} sebesar ${totalDealt} DMG${anyCrit ? ' (KRITIS!)' : ''}!`;

  return checkVictoryOrAdvanceTurn(nextBattle, nextStats, inventory, relics, events);
}

export function performRuneSkill(
  skillId: RuneSkillId,
  battle: BattleState,
  stats: PlayerStats,
  inventory: InventoryMap,
  relics: RelicId[]
): CombatActionResult {
  const skill = RUNE_SKILLS.find((s) => s.id === skillId)!;
  const cost = getSkillRpCost(skillId, relics);
  if (stats.rp < cost) {
    return {
      battle: {
        ...battle,
        logEn: 'Not enough Rune Points (RP)!',
        logId: 'Poin Rune (RP) tidak cukup!',
      },
      stats,
      inventory,
      events: [],
    };
  }

  const nextBattle: BattleState = {
    ...battle,
    enemies: battle.enemies.map((e) => ({ ...e })),
    playerDefending: false,
  };
  let nextStats = { ...stats, rp: stats.rp - cost };
  const events: CombatActionResult['events'] = [];

  const echoMult = relics.includes('arcane_echo') ? 1.25 : 1.0;
  const chargeBonus = nextBattle.runeCharge >= 3 ? 1.35 : 1.0;
  if (nextBattle.runeCharge >= 3) nextBattle.runeCharge = 0;

  const baseAtk = computePlayerAtk(nextStats, relics, nextBattle.playerAtkBuffTurns);

  if (skill.shieldTurns) {
    nextBattle.playerShieldTurns = Math.max(nextBattle.playerShieldTurns, skill.shieldTurns);
  }

  const targets = skill.aoe
    ? nextBattle.enemies.filter((e) => e.hp > 0)
    : [nextBattle.enemies[nextBattle.selectedTargetIndex] ?? nextBattle.enemies.find((e) => e.hp > 0)].filter(
        (e): e is EnemyUnit => Boolean(e && e.hp > 0)
      );

  let totalDamage = 0;
  let stunnedAny = false;

  for (const t of targets) {
    const raw = Math.round(baseAtk * skill.powerMult * echoMult * chargeBonus);
    let dmg = Math.max(4, raw - Math.floor(t.def * 0.5));
    if (t.shield > 0) {
      const absorbed = Math.min(t.shield, dmg);
      t.shield -= absorbed;
      dmg -= absorbed;
    }
    t.hp = Math.max(0, t.hp - dmg);
    t.hitFlash = 0.28;
    totalDamage += dmg;

    if (skill.stunChance && t.hp > 0 && Math.random() < skill.stunChance) {
      t.stunned = true;
      stunnedAny = true;
    }

    events.push({ targetUid: t.uid, damage: dmg, crit: chargeBonus > 1, sfx: 'magic' });
    if (relics.includes('vampiric_edge')) {
      nextStats.hp = Math.min(nextStats.maxHp, nextStats.hp + 5);
    }
  }

  nextBattle.logEn = `${skill.nameEn} dealt ${totalDamage} DMG${stunnedAny ? ' & Stunned!' : ''}!`;
  nextBattle.logId = `${skill.nameId} menghasilkan ${totalDamage} DMG${stunnedAny ? ' & Pingsan!' : ''}!`;

  return checkVictoryOrAdvanceTurn(nextBattle, nextStats, inventory, relics, events);
}

export function performDefend(
  battle: BattleState,
  stats: PlayerStats,
  inventory: InventoryMap,
  relics: RelicId[]
): CombatActionResult {
  const nextStats = {
    ...stats,
    rp: Math.min(stats.maxRp, stats.rp + 10),
  };
  const nextBattle: BattleState = {
    ...battle,
    enemies: battle.enemies.map((e) => ({ ...e })),
    playerDefending: true,
    logEn: 'You raised your Shield (+10 RP, -60% incoming damage & Parry Heavy strikes)!',
    logId: 'Kamu mengangkat Perisai (+10 RP, -60% kerusakan & Tangkis Serangan Berat)!',
  };
  return resolveEnemyTurn(nextBattle, nextStats, inventory, relics, [{ sfx: 'defend' }]);
}

export function performUseItemInBattle(
  itemId: ItemId,
  battle: BattleState,
  stats: PlayerStats,
  inventory: InventoryMap,
  relics: RelicId[]
): CombatActionResult {
  const count = inventory[itemId] ?? 0;
  const item = ITEMS[itemId];
  if (count <= 0 || (!item.healHp && !item.healRp)) {
    return { battle, stats, inventory, events: [] };
  }

  const nextInv: InventoryMap = { ...inventory, [itemId]: count - 1 };
  const nextStats: PlayerStats = {
    ...stats,
    hp: Math.min(stats.maxHp, stats.hp + (item.healHp ?? 0)),
    rp: Math.min(stats.maxRp, stats.rp + (item.healRp ?? 0)),
  };
  const nextBattle: BattleState = {
    ...battle,
    enemies: battle.enemies.map((e) => ({ ...e })),
    playerAtkBuffTurns: item.atkBuff ? Math.max(battle.playerAtkBuffTurns, item.atkBuff) : battle.playerAtkBuffTurns,
    playerDefending: false,
    logEn: `Ate ${item.nameEn}! Restored ${item.healHp ?? 0} HP & ${item.healRp ?? 0} RP.`,
    logId: `Memakan ${item.nameId}! Pulih ${item.healHp ?? 0} HP & ${item.healRp ?? 0} RP.`,
  };

  return resolveEnemyTurn(nextBattle, nextStats, nextInv, relics, [
    { heal: item.healHp ?? 0, sfx: 'harvest' },
  ]);
}

function checkVictoryOrAdvanceTurn(
  battle: BattleState,
  stats: PlayerStats,
  inventory: InventoryMap,
  relics: RelicId[],
  events: CombatActionResult['events']
): CombatActionResult {
  const alive = battle.enemies.filter((e) => e.hp > 0);
  if (alive.length === 0) {
    // Victory!
    let totalGold = 0;
    let totalXp = 0;
    const rewardsItems: Partial<Record<ItemId, number>> = {};

    for (const e of battle.enemies) {
      totalGold += e.goldReward;
      totalXp += e.xpReward;
    }
    if (relics.includes('lucky_pouch')) {
      totalGold = Math.round(totalGold * 1.4);
    }

    // Loot drops
    if (Math.random() < 0.65 || battle.isBoss) {
      rewardsItems.rune_crystal = (rewardsItems.rune_crystal ?? 0) + (battle.isBoss ? 3 : 1);
    }
    if (Math.random() < 0.45) {
      rewardsItems.gold_ore = (rewardsItems.gold_ore ?? 0) + 1;
    }
    if (battle.isBoss) {
      rewardsItems.hp_potion = 1;
    }

    // Offer 3 random unowned relics
    const allRelicIds = Object.keys(RELICS) as RelicId[];
    const unowned = allRelicIds.filter((r) => !relics.includes(r));
    const shuffled = [...unowned].sort(() => Math.random() - 0.5);
    const pendingRelicChoices = shuffled.length > 0 ? shuffled.slice(0, 3) : null;

    const nextInv = { ...inventory };
    for (const [k, v] of Object.entries(rewardsItems)) {
      const id = k as ItemId;
      nextInv[id] = (nextInv[id] ?? 0) + (v ?? 0);
    }

    let nextStats = {
      ...stats,
      gold: stats.gold + totalGold,
      xp: stats.xp + totalXp,
    };

    while (nextStats.xp >= nextStats.xpToNext) {
      nextStats.xp -= nextStats.xpToNext;
      nextStats.level += 1;
      nextStats.xpToNext = Math.round(nextStats.xpToNext * 1.35);
      nextStats.maxHp += 15;
      nextStats.maxRp += 8;
      nextStats.hp = nextStats.maxHp;
      nextStats.rp = nextStats.maxRp;
      nextStats.baseAtk += 2;
      nextStats.baseDef += 1;
    }

    battle.turn = 'VICTORY';
    battle.rewardsGold = totalGold;
    battle.rewardsXp = totalXp;
    battle.rewardsItems = rewardsItems;
    battle.pendingRelicChoices = pendingRelicChoices;
    battle.logEn = `Victory! Gained ${totalGold}G & ${totalXp} XP.`;
    battle.logId = `Menang! Mendapat ${totalGold}G & ${totalXp} XP.`;
    events.push({ sfx: 'victory' });

    return { battle, stats: nextStats, inventory: nextInv, events };
  }

  // Re-select valid target if current target died
  if (!battle.enemies[battle.selectedTargetIndex] || battle.enemies[battle.selectedTargetIndex].hp <= 0) {
    battle.selectedTargetIndex = battle.enemies.findIndex((e) => e.hp > 0);
  }

  return resolveEnemyTurn(battle, stats, inventory, relics, events);
}

function resolveEnemyTurn(
  battle: BattleState,
  stats: PlayerStats,
  inventory: InventoryMap,
  relics: RelicId[],
  events: CombatActionResult['events']
): CombatActionResult {
  let nextStats = { ...stats };
  const playerDef = computePlayerDef(nextStats, relics);
  let totalPlayerDmg = 0;
  const actionLogsEn: string[] = [];
  const actionLogsId: string[] = [];

  for (const enemy of battle.enemies) {
    if (enemy.hp <= 0) continue;

    if (enemy.stunned) {
      enemy.stunned = false;
      actionLogsEn.push(`${enemy.nameEn} is stunned!`);
      actionLogsId.push(`${enemy.nameId} pingsan!`);
    } else if (enemy.intent === 'DEFEND') {
      enemy.shield += enemy.intentValue;
      actionLogsEn.push(`${enemy.nameEn} gained ${enemy.intentValue} Shield.`);
      actionLogsId.push(`${enemy.nameId} memasang ${enemy.intentValue} Perisai.`);
    } else {
      let incoming = enemy.intentValue;
      if (battle.playerDefending) {
        incoming = Math.round(incoming * 0.4);
      }
      if (battle.playerShieldTurns > 0) {
        incoming = Math.round(incoming * 0.55);
      }
      const finalDmg = Math.max(1, incoming - playerDef);
      nextStats.hp = Math.max(0, nextStats.hp - finalDmg);
      totalPlayerDmg += finalDmg;

      // Parry counter on heavy strike
      if (battle.playerDefending && enemy.intent === 'HEAVY') {
        const counter = Math.max(6, Math.round(computePlayerAtk(nextStats, relics, 0) * 0.7));
        enemy.hp = Math.max(0, enemy.hp - counter);
        enemy.hitFlash = 0.25;
        events.push({ targetUid: enemy.uid, damage: counter, crit: true, sfx: 'slash' });
        actionLogsEn.push(`Parried ${enemy.nameEn} for ${counter} counter DMG!`);
        actionLogsId.push(`Menangkis ${enemy.nameId} dan membalas ${counter} DMG!`);
      }

      // Thorns relic
      if (relics.includes('thorns_ward') && enemy.hp > 0) {
        enemy.hp = Math.max(0, enemy.hp - 8);
        events.push({ targetUid: enemy.uid, damage: 8, sfx: 'hit' });
      }
    }

    // Prepare next round's telegraphed intent
    if (enemy.hp > 0) {
      const next = pickIntent(enemy, battle.round + 1);
      enemy.intent = next.intent;
      enemy.intentValue = next.value;
    }
  }

  if (totalPlayerDmg > 0) {
    events.push({ playerHit: totalPlayerDmg, sfx: 'hit' });
    actionLogsEn.unshift(`Took ${totalPlayerDmg} DMG.`);
    actionLogsId.unshift(`Terkena ${totalPlayerDmg} DMG.`);
  }

  // Tick buffs
  battle.round += 1;
  battle.playerDefending = false;
  if (battle.playerAtkBuffTurns > 0) battle.playerAtkBuffTurns -= 1;
  if (battle.playerShieldTurns > 0) battle.playerShieldTurns -= 1;

  if (nextStats.hp <= 0) {
    battle.turn = 'DEFEAT';
    battle.logEn = 'You collapsed from your wounds...';
    battle.logId = 'Kamu tumbang kehabisan tenaga...';
  } else {
    // Check if thorns/counter killed all enemies
    const remaining = battle.enemies.filter((e) => e.hp > 0);
    if (remaining.length === 0) {
      return checkVictoryOrAdvanceTurn(battle, nextStats, inventory, relics, events);
    }
    battle.turn = 'PLAYER';
    if (actionLogsEn.length > 0) {
      battle.logEn = actionLogsEn.join(' ');
      battle.logId = actionLogsId.join(' ');
    }
  }

  return { battle, stats: nextStats, inventory, events };
}
