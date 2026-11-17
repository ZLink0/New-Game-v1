import React, { useState } from 'react';
import { Backpack, Flame, LogOut, Shield, Sparkles, Swords } from 'lucide-react';
import { getSkillRpCost } from '../game/battleEngine';
import { ITEMS, RELICS, RUNE_SKILLS, TEXT } from '../game/data';
import { getItemIconUrl } from '../game/pixelSprites';
import {
  BattleState,
  InventoryMap,
  ItemId,
  Language,
  PlayerStats,
  RelicId,
  RuneSkillId,
} from '../game/types';

interface BattleHudProps {
  battle: BattleState;
  stats: PlayerStats;
  inventory: InventoryMap;
  relics: RelicId[];
  lang: Language;
  onStrike: () => void;
  onSkill: (skillId: RuneSkillId) => void;
  onDefend: () => void;
  onUseItem: (itemId: ItemId) => void;
  onRetreat: () => void;
  onPickRelic: (relicId: RelicId) => void;
  onFinishVictoryNoRelic: () => void;
}

export const BattleHud: React.FC<BattleHudProps> = ({
  battle,
  stats,
  inventory,
  relics,
  lang,
  onStrike,
  onSkill,
  onDefend,
  onUseItem,
  onRetreat,
  onPickRelic,
  onFinishVictoryNoRelic,
}) => {
  const [subMenu, setSubMenu] = useState<'NONE' | 'SKILLS' | 'POUCH'>('NONE');
  const t = TEXT[lang];

  const consumables = (Object.keys(ITEMS) as ItemId[]).filter((id) => {
    const item = ITEMS[id];
    return (item.healHp || item.healRp) && (inventory[id] ?? 0) > 0;
  });

  // Victory Relic Draft Overlay
  if (battle.turn === 'VICTORY') {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/75 p-4">
        <div className="rpg-panel w-full max-w-2xl rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="font-pixel text-xl text-amber-300">
                {lang === 'id' ? 'Pertarungan Menang!' : 'Encounter Cleared!'}
              </h2>
              <p className="font-mono-num mt-1 text-xs text-slate-300">
                +{battle.rewardsGold} G · +{battle.rewardsXp} XP
                {Object.entries(battle.rewardsItems)
                  .map(([id, cnt]) => ` · +${cnt} ${lang === 'id' ? ITEMS[id as ItemId].nameId : ITEMS[id as ItemId].nameEn}`)
                  .join('')}
              </p>
            </div>
            <Sparkles className="h-6 w-6 text-amber-300" />
          </div>

          {battle.pendingRelicChoices && battle.pendingRelicChoices.length > 0 ? (
            <div className="mt-4">
              <p className="mb-3 text-sm font-semibold text-slate-200">{t.chooseRelic}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {battle.pendingRelicChoices.map((rid) => {
                  const r = RELICS[rid];
                  return (
                    <button
                      key={rid}
                      onClick={() => onPickRelic(rid)}
                      className="rpg-slot flex flex-col items-start rounded-xl p-3.5 text-left transition-transform hover:scale-[1.02] hover:border-amber-400"
                    >
                      <span
                        className="font-pixel text-sm"
                        style={{ color: r.color }}
                      >
                        {lang === 'id' ? r.nameId : r.nameEn}
                      </span>
                      <span className="mt-2 text-xs leading-relaxed text-slate-300">
                        {lang === 'id' ? r.descId : r.descEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-5 flex justify-end">
              <button
                onClick={onFinishVictoryNoRelic}
                className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400"
              >
                {lang === 'id' ? 'Lanjut Jelajah' : 'Continue Exploring'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-4">
      {/* TOP STRIP: HERO STATS + FLOOR + ACTIVE RELICS */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="pointer-events-auto rpg-panel flex items-center gap-4 rounded-xl px-4 py-2">
          <div>
            <div className="text-[11px] font-semibold text-amber-200">
              Lv.{stats.level} · Abyss F{battle.floorNumber} · Turn {battle.round}
            </div>
            <div className="font-mono-num mt-1 flex items-center gap-3 text-xs font-bold">
              <span className="text-emerald-400">
                HP {stats.hp}/{stats.maxHp}
              </span>
              <span className="text-sky-400">
                RP {stats.rp}/{stats.maxRp}
              </span>
              <span className="text-fuchsia-300">
                Charge {battle.runeCharge}/3
              </span>
            </div>
          </div>
        </div>

        {/* Active Relics summary */}
        {relics.length > 0 && (
          <div className="pointer-events-auto rpg-panel flex max-w-md flex-wrap items-center gap-2 rounded-xl px-3 py-1.5 text-xs">
            <span className="font-semibold text-amber-300">
              {lang === 'id' ? 'Berkah:' : 'Blessings:'}
            </span>
            {relics.map((rid) => (
              <span key={rid} className="font-medium text-slate-200" title={lang === 'id' ? RELICS[rid].descId : RELICS[rid].descEn}>
                {lang === 'id' ? RELICS[rid].nameId : RELICS[rid].nameEn}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM TACTICAL BAR */}
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        {/* Submenu Drawer for Rune Arts or Pouch */}
        {subMenu === 'SKILLS' && (
          <div className="pointer-events-auto rpg-panel grid grid-cols-1 gap-2 rounded-xl p-3 sm:grid-cols-2">
            {RUNE_SKILLS.map((skill) => {
              const cost = getSkillRpCost(skill.id, relics);
              const canAfford = stats.rp >= cost;
              return (
                <button
                  key={skill.id}
                  disabled={!canAfford}
                  onClick={() => {
                    setSubMenu('NONE');
                    onSkill(skill.id);
                  }}
                  className={`rpg-slot flex items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                    canAfford ? 'hover:border-sky-400' : 'opacity-45 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-sky-200">
                      {lang === 'id' ? skill.nameId : skill.nameEn}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {lang === 'id' ? skill.descId : skill.descEn}
                    </div>
                  </div>
                  <span className="font-mono-num ml-2 shrink-0 text-xs font-bold text-sky-300">
                    {cost} RP
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {subMenu === 'POUCH' && (
          <div className="pointer-events-auto rpg-panel rounded-xl p-3">
            {consumables.length === 0 ? (
              <p className="text-center text-xs text-slate-300">
                {lang === 'id'
                  ? 'Tidak ada makanan atau ramuan di tas! Panen tanaman atau racik ramuan di Bengkel.'
                  : 'No crops or potions in your pouch! Harvest crops or brew potions at the Forge.'}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {consumables.map((id) => {
                  const def = ITEMS[id];
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setSubMenu('NONE');
                        onUseItem(id);
                      }}
                      className="rpg-slot flex items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:border-emerald-400"
                    >
                      <img
                        src={getItemIconUrl(id)}
                        alt={def.nameEn}
                        referrerPolicy="no-referrer"
                        className="pixelated h-7 w-7 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-white">
                          {lang === 'id' ? def.nameId : def.nameEn} x{inventory[id]}
                        </div>
                        <div className="font-mono-num text-[10px] text-emerald-300">
                          {def.healHp ? `+${def.healHp}HP ` : ''}
                          {def.healRp ? `+${def.healRp}RP` : ''}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Combat Log + Main Action Buttons */}
        <div className="pointer-events-auto rpg-panel flex flex-col gap-2.5 rounded-2xl p-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 text-xs text-amber-100">
            <span>{lang === 'id' ? battle.logId : battle.logEn}</span>
            <span className="font-mono-num shrink-0 text-[11px] text-slate-400">
              {battle.runeCharge >= 3
                ? lang === 'id'
                  ? 'RUNE PENUH (+35% SKILL)'
                  : 'RUNE OVERCHARGE (+35%)'
                : ''}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                setSubMenu('NONE');
                onStrike();
              }}
              className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-2 text-xs sm:text-sm font-bold text-white hover:bg-rose-500 active:scale-95"
            >
              <Swords className="h-4 w-4 shrink-0" />
              <span className="truncate">{t.strike}</span>
            </button>

            <button
              onClick={() => setSubMenu(subMenu === 'SKILLS' ? 'NONE' : 'SKILLS')}
              className={`flex h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-xs sm:text-sm font-bold text-white active:scale-95 ${
                subMenu === 'SKILLS' ? 'bg-sky-500' : 'bg-sky-700 hover:bg-sky-600'
              }`}
            >
              <Flame className="h-4 w-4 shrink-0" />
              <span className="truncate">{t.runeArts}</span>
            </button>

            <button
              onClick={() => {
                setSubMenu('NONE');
                onDefend();
              }}
              className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-2 text-xs sm:text-sm font-bold text-white hover:bg-amber-500 active:scale-95"
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span className="truncate">{t.defend}</span>
            </button>

            <button
              onClick={() => setSubMenu(subMenu === 'POUCH' ? 'NONE' : 'POUCH')}
              className={`flex h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-xs sm:text-sm font-bold text-white active:scale-95 ${
                subMenu === 'POUCH' ? 'bg-emerald-500' : 'bg-emerald-700 hover:bg-emerald-600'
              }`}
            >
              <Backpack className="h-4 w-4 shrink-0" />
              <span className="truncate">{t.pouch}</span>
            </button>

            <button
              disabled={battle.isBoss}
              onClick={onRetreat}
              className={`flex h-11 items-center justify-center gap-1.5 rounded-lg bg-slate-700 px-2 text-xs sm:text-sm font-bold text-slate-200 ${
                battle.isBoss ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-600 active:scale-95'
              }`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="truncate">{t.retreat}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
