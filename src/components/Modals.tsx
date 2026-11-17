import React, { useState } from 'react';
import { Check, Coins, Hammer, Moon, RotateCcw, Sparkles, X } from 'lucide-react';
import { CRAFT_RECIPES, ITEMS, RELICS, TEXT } from '../game/data';
import { getItemIconUrl } from '../game/pixelSprites';
import {
  ActiveModal,
  GameState,
  InventoryMap,
  ItemId,
  Language,
  PlayerStats,
  QuestProgress,
  RelicId,
} from '../game/types';

interface TitleScreenProps {
  lang: Language;
  hasSave: boolean;
  onStartNew: () => void;
  onContinue: () => void;
  onToggleLang: () => void;
}

export const TitleScreenOverlay: React.FC<TitleScreenProps> = ({
  lang,
  hasSave,
  onStartNew,
  onContinue,
  onToggleLang,
}) => {
  const t = TEXT[lang];
  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-between bg-gradient-to-b from-slate-950/65 via-slate-950/25 to-slate-950/85 p-6">
      <div className="flex w-full max-w-5xl items-center justify-end">
        <button
          onClick={onToggleLang}
          className="rpg-panel rounded-lg px-3 py-1.5 text-xs font-bold text-amber-200 hover:border-amber-400"
        >
          {lang === 'en' ? 'EN / ID' : 'ID / EN'}
        </button>
      </div>

      {/* Bespoke Inline SVG Title Lockup */}
      <div className="flex flex-col items-center text-center">
        <svg
          viewBox="0 0 420 120"
          className="w-[320px] sm:w-[440px] drop-shadow-[0_6px_16px_rgba(0,0,0,0.75)]"
          role="img"
          aria-label="Runevale: Farm & Abyss"
        >
          <defs>
            <linearGradient id="titleGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          {/* Decorative Pixel Shield + Sprout Crest */}
          <path
            d="M210 6 L224 14 L222 30 L210 38 L198 30 L196 14 Z"
            fill="#1e293b"
            stroke="#fbbf24"
            strokeWidth="2.5"
          />
          <rect x="208" y="13" width="4" height="16" fill="#38bdf8" />
          <rect x="203" y="19" width="14" height="4" fill="#38bdf8" />
          <text
            x="210"
            y="82"
            textAnchor="middle"
            fill="#1e1b4b"
            stroke="#1e1b4b"
            strokeWidth="8"
            className="font-pixel text-[44px] font-bold tracking-wider"
          >
            RUNEVALE
          </text>
          <text
            x="210"
            y="82"
            textAnchor="middle"
            fill="url(#titleGold)"
            className="font-pixel text-[44px] font-bold tracking-wider"
          >
            RUNEVALE
          </text>
          <text
            x="210"
            y="108"
            textAnchor="middle"
            fill="#e2e8f0"
            className="font-pixel text-[14px] tracking-[0.22em]"
          >
            FARM &amp; ABYSS
          </text>
        </svg>

        <p className="mt-2 text-sm font-medium text-amber-100/90 drop-shadow">
          {t.titleSub}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {hasSave && (
            <button
              onClick={onContinue}
              className="rounded-xl border-2 border-emerald-300 bg-emerald-600 px-7 py-3 font-pixel text-sm font-bold text-white shadow-xl transition-transform hover:scale-105 hover:bg-emerald-500 active:scale-95"
            >
              {t.continueGame}
            </button>
          )}
          <button
            onClick={onStartNew}
            className="rounded-xl border-2 border-amber-300 bg-amber-500 px-7 py-3 font-pixel text-sm font-bold text-slate-950 shadow-xl transition-transform hover:scale-105 hover:bg-amber-400 active:scale-95"
          >
            {t.startNew}
          </button>
        </div>
      </div>

      {/* Single flat control hint line */}
      <p className="font-mono-num text-center text-xs text-slate-200/85 drop-shadow">
        {t.controlsHint}
      </p>
    </div>
  );
};

interface ModalsProps {
  gameState: GameState;
  activeModal: ActiveModal;
  lang: Language;
  stats: PlayerStats;
  inventory: InventoryMap;
  relics: RelicId[];
  quests: QuestProgress[];
  activeSeedId: ItemId;
  activeFoodId: ItemId;
  muted: boolean;
  showTouchControls: boolean;
  altarRelicChoices: RelicId[] | null;
  runStats: { monstersDefeated: number; cropsHarvested: number; maxFloor: number };
  onCloseModal: () => void;
  onResume: () => void;
  onSaveGame: () => void;
  onQuitToTitle: () => void;
  onToggleLang: () => void;
  onToggleMute: () => void;
  onToggleTouch: () => void;
  onSelectActiveSeed: (id: ItemId) => void;
  onSelectActiveFood: (id: ItemId) => void;
  onEatItem: (id: ItemId) => void;
  onSellItem: (id: ItemId, qty: number) => void;
  onBuyItem: (id: ItemId, qty: number) => void;
  onCraft: (recipeId: string) => void;
  onClaimQuest: (questId: string) => void;
  onConfirmSleep: () => void;
  onPickAltarRelic: (relicId: RelicId) => void;
  onReturnHomeFromEnd: () => void;
  onRestartNewGame: () => void;
}

export const Modals: React.FC<ModalsProps> = ({
  gameState,
  activeModal,
  lang,
  stats,
  inventory,
  relics,
  quests,
  activeSeedId,
  activeFoodId,
  muted,
  showTouchControls,
  altarRelicChoices,
  runStats,
  onCloseModal,
  onResume,
  onSaveGame,
  onQuitToTitle,
  onToggleLang,
  onToggleMute,
  onToggleTouch,
  onSelectActiveSeed,
  onSelectActiveFood,
  onEatItem,
  onSellItem,
  onBuyItem,
  onCraft,
  onClaimQuest,
  onConfirmSleep,
  onPickAltarRelic,
  onReturnHomeFromEnd,
  onRestartNewGame,
}) => {
  const [invTab, setInvTab] = useState<'POUCH' | 'SHOP'>('POUCH');
  const t = TEXT[lang];

  // Victory or Game Over Modal
  if (gameState === 'VICTORY' || gameState === 'GAME_OVER') {
    const isWin = gameState === 'VICTORY';
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4">
        <div className="rpg-panel w-full max-w-md rounded-2xl p-6 text-center">
          <h2
            className={`font-pixel text-2xl ${
              isWin ? 'text-amber-300' : 'text-rose-400'
            }`}
          >
            {isWin ? t.victoryTitle : t.defeatTitle}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {isWin ? t.victoryDesc : t.defeatDesc}
          </p>
          <div className="font-mono-num mt-5 grid grid-cols-3 gap-2 rounded-xl bg-slate-950/60 p-3 text-xs">
            <div>
              <div className="text-slate-400">{lang === 'id' ? 'Hari' : 'Day'}</div>
              <div className="mt-1 font-bold text-amber-300">{stats.day}</div>
            </div>
            <div>
              <div className="text-slate-400">{lang === 'id' ? 'Monster' : 'Slain'}</div>
              <div className="mt-1 font-bold text-rose-300">{runStats.monstersDefeated}</div>
            </div>
            <div>
              <div className="text-slate-400">{lang === 'id' ? 'Lantai' : 'Best Floor'}</div>
              <div className="mt-1 font-bold text-fuchsia-300">F{runStats.maxFloor}</div>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <button
              onClick={onReturnHomeFromEnd}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500"
            >
              {t.returnHome}
            </button>
            <button
              onClick={onRestartNewGame}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-700 px-5 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-600"
            >
              <RotateCcw className="h-4 w-4" />
              {t.playAgain}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pause Modal
  if (gameState === 'PAUSED') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4">
        <div className="rpg-panel w-full max-w-sm rounded-2xl p-6">
          <h2 className="font-pixel text-center text-xl text-amber-300">{t.pauseTitle}</h2>
          <div className="mt-5 flex flex-col gap-2.5">
            <button
              onClick={onResume}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500"
            >
              {t.resume}
            </button>
            <button
              onClick={onSaveGame}
              className="rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-600"
            >
              {t.saveGame}
            </button>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={onToggleLang}
                className="rpg-slot rounded-lg py-2 text-xs font-bold text-amber-200"
              >
                {t.language}: {lang.toUpperCase()}
              </button>
              <button
                onClick={onToggleMute}
                className="rpg-slot rounded-lg py-2 text-xs font-bold text-slate-200"
              >
                {t.soundToggle}: {muted ? 'OFF' : 'ON'}
              </button>
              <button
                onClick={onToggleTouch}
                className="rpg-slot rounded-lg py-2 text-xs font-bold text-slate-200"
              >
                Pad: {showTouchControls ? 'ON' : 'OFF'}
              </button>
            </div>
            <button
              onClick={onQuitToTitle}
              className="mt-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700"
            >
              {t.quitTitle}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!activeModal) return null;

  // Sleep Confirm Modal
  if (activeModal === 'SLEEP_CONFIRM') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4">
        <div className="rpg-panel-warm w-full max-w-md rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Moon className="h-6 w-6 text-amber-300" />
            <h2 className="font-pixel text-lg text-amber-200">{t.sleepTitle}</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">{t.sleepDesc}</p>
          <div className="mt-5 flex justify-end gap-2.5">
            <button
              onClick={onCloseModal}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-600"
            >
              {t.cancel}
            </button>
            <button
              onClick={onConfirmSleep}
              className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400"
            >
              {t.sleepConfirm}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dungeon Altar Relic Draft
  if (activeModal === 'RELIC_DRAFT' && altarRelicChoices) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4">
        <div className="rpg-panel w-full max-w-2xl rounded-2xl p-6">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <Sparkles className="h-5 w-5 text-sky-300" />
            <h2 className="font-pixel text-lg text-sky-200">{t.chooseRelic}</h2>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {altarRelicChoices.map((rid) => {
              const r = RELICS[rid];
              return (
                <button
                  key={rid}
                  onClick={() => onPickAltarRelic(rid)}
                  className="rpg-slot flex flex-col items-start rounded-xl p-4 text-left hover:border-sky-400"
                >
                  <span className="font-pixel text-sm" style={{ color: r.color }}>
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
      </div>
    );
  }

  const allItemIds = Object.keys(ITEMS) as ItemId[];
  const ownedItems = allItemIds.filter(
    (id) => ITEMS[id].category !== 'tool' && (inventory[id] ?? 0) > 0
  );
  const shopItems = allItemIds.filter((id) => Boolean(ITEMS[id].buyPrice));

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4">
      <div className="rpg-panel flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <h2 className="font-pixel text-lg text-amber-300">
            {activeModal === 'INVENTORY'
              ? t.bag
              : activeModal === 'FORGE'
              ? t.forge
              : activeModal === 'QUESTS'
              ? t.quests
              : t.guide}
          </h2>
          <div className="flex items-center gap-3">
            <span className="font-mono-num flex items-center gap-1 text-sm font-bold text-amber-300">
              <Coins className="h-4 w-4" />
              {stats.gold.toLocaleString()} G
            </span>
            <button
              onClick={onCloseModal}
              aria-label="Close"
              className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* INVENTORY & SEED SHOP */}
          {activeModal === 'INVENTORY' && (
            <div>
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setInvTab('POUCH')}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold ${
                    invTab === 'POUCH'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {lang === 'id' ? 'Isi Tas & Jual' : 'Pouch & Ship'}
                </button>
                <button
                  onClick={() => setInvTab('SHOP')}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold ${
                    invTab === 'SHOP'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {lang === 'id' ? 'Toko Bibit & Ramuan' : 'Seed & Supply Shop'}
                </button>
              </div>

              {invTab === 'POUCH' ? (
                <div className="space-y-2.5">
                  {ownedItems.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">
                      {lang === 'id' ? 'Tas masih kosong.' : 'Your pouch is empty.'}
                    </p>
                  ) : (
                    ownedItems.map((id) => {
                      const def = ITEMS[id];
                      const count = inventory[id] ?? 0;
                      const isSeed = def.category === 'seed';
                      const isFood = Boolean(def.healHp || def.healRp);
                      return (
                        <div
                          key={id}
                          className="rpg-slot flex flex-wrap items-center justify-between gap-2 rounded-xl px-3.5 py-2.5"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={getItemIconUrl(id)}
                              alt={def.nameEn}
                              referrerPolicy="no-referrer"
                              className="pixelated h-8 w-8"
                            />
                            <div>
                              <div className="text-sm font-bold text-white">
                                {lang === 'id' ? def.nameId : def.nameEn}{' '}
                                <span className="font-mono-num text-amber-300">x{count}</span>
                              </div>
                              <div className="text-xs text-slate-300">
                                {lang === 'id' ? def.descId : def.descEn}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isSeed && (
                              <button
                                onClick={() => onSelectActiveSeed(id)}
                                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                                  activeSeedId === id
                                    ? 'bg-emerald-500 text-slate-950'
                                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                }`}
                              >
                                {activeSeedId === id
                                  ? lang === 'id'
                                    ? 'Bibit Aktif'
                                    : 'Equipped'
                                  : lang === 'id'
                                  ? 'Pakai Bibit'
                                  : 'Equip Seed'}
                              </button>
                            )}
                            {isFood && (
                              <>
                                <button
                                  onClick={() => onSelectActiveFood(id)}
                                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                                    activeFoodId === id
                                      ? 'bg-amber-400 text-slate-950'
                                      : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                  }`}
                                >
                                  {lang === 'id' ? 'Slot 6' : 'Slot 6'}
                                </button>
                                <button
                                  onClick={() => onEatItem(id)}
                                  className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                                >
                                  {lang === 'id' ? 'Makan' : 'Eat'}
                                </button>
                              </>
                            )}
                            {def.sellPrice > 0 && (
                              <button
                                onClick={() => onSellItem(id, 1)}
                                className="font-mono-num rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-amber-500"
                              >
                                {lang === 'id' ? 'Jual' : 'Sell'} +{def.sellPrice}G
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {relics.length > 0 && (
                    <div className="mt-4 border-t border-white/10 pt-3">
                      <h3 className="text-xs font-bold text-sky-300">
                        {lang === 'id' ? 'Berkah Rune Ekspedisi Ini' : 'Active Run Blessings'}
                      </h3>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {relics.map((rid) => (
                          <div key={rid} className="rpg-slot rounded-lg p-2.5">
                            <div className="text-xs font-bold" style={{ color: RELICS[rid].color }}>
                              {lang === 'id' ? RELICS[rid].nameId : RELICS[rid].nameEn}
                            </div>
                            <div className="text-[11px] text-slate-300">
                              {lang === 'id' ? RELICS[rid].descId : RELICS[rid].descEn}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {shopItems.map((id) => {
                    const def = ITEMS[id];
                    const price = def.buyPrice ?? 50;
                    const canBuy1 = stats.gold >= price;
                    const canBuy5 = stats.gold >= price * 5;
                    return (
                      <div
                        key={id}
                        className="rpg-slot flex flex-wrap items-center justify-between gap-2 rounded-xl px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={getItemIconUrl(id)}
                            alt={def.nameEn}
                            referrerPolicy="no-referrer"
                            className="pixelated h-8 w-8"
                          />
                          <div>
                            <div className="text-sm font-bold text-white">
                              {lang === 'id' ? def.nameId : def.nameEn}
                            </div>
                            <div className="text-xs text-slate-300">
                              {lang === 'id' ? def.descId : def.descEn}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={!canBuy1}
                            onClick={() => onBuyItem(id, 1)}
                            className={`font-mono-num rounded-lg px-3 py-1.5 text-xs font-bold ${
                              canBuy1
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            x1 ({price}G)
                          </button>
                          <button
                            disabled={!canBuy5}
                            onClick={() => onBuyItem(id, 5)}
                            className={`font-mono-num rounded-lg px-3 py-1.5 text-xs font-bold ${
                              canBuy5
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            x5 ({price * 5}G)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* BLACKSMITH FORGE */}
          {activeModal === 'FORGE' && (
            <div className="space-y-3">
              <div className="font-mono-num flex flex-wrap gap-4 rounded-xl bg-slate-950/55 px-4 py-2.5 text-xs text-slate-200">
                <span>Sword Lv.{stats.swordLevel}</span>
                <span>Armor Lv.{stats.armorLevel}</span>
                <span>Pickaxe Lv.{stats.pickaxeLevel}</span>
              </div>
              {CRAFT_RECIPES.map((rec) => {
                const tier =
                  rec.upgradeTool === 'sword'
                    ? stats.swordLevel
                    : rec.upgradeTool === 'armor'
                    ? stats.armorLevel
                    : rec.upgradeTool === 'pickaxe'
                    ? stats.pickaxeLevel
                    : 1;
                const goldCost = rec.goldCost * tier;
                const hasGold = stats.gold >= goldCost;
                const hasIng = rec.ingredients.every(
                  (ing) => (inventory[ing.id] ?? 0) >= ing.count
                );
                const canCraft = hasGold && hasIng;
                return (
                  <div
                    key={rec.id}
                    className="rpg-slot flex flex-wrap items-center justify-between gap-3 rounded-xl p-3.5"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-orange-200">
                        <Hammer className="h-4 w-4" />
                        <span>
                          {lang === 'id' ? rec.nameId : rec.nameEn}
                          {rec.kind === 'UPGRADE' ? ` (Lv.${tier} -> ${tier + 1})` : ''}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-300">
                        {lang === 'id' ? rec.descId : rec.descEn}
                      </div>
                      <div className="font-mono-num mt-2 flex flex-wrap gap-3 text-[11px]">
                        <span className={hasGold ? 'text-amber-300' : 'text-rose-400'}>
                          {goldCost} G
                        </span>
                        {rec.ingredients.map((ing) => {
                          const have = inventory[ing.id] ?? 0;
                          const ok = have >= ing.count;
                          return (
                            <span
                              key={ing.id}
                              className={ok ? 'text-emerald-300' : 'text-rose-400'}
                            >
                              {lang === 'id' ? ITEMS[ing.id].nameId : ITEMS[ing.id].nameEn}{' '}
                              {have}/{ing.count}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      disabled={!canCraft}
                      onClick={() => onCraft(rec.id)}
                      className={`rounded-lg px-4 py-2 text-xs font-bold ${
                        canCraft
                          ? 'bg-orange-500 text-slate-950 hover:bg-orange-400'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {lang === 'id' ? 'Tempa' : 'Forge'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* QUESTS / BOUNTY BOARD */}
          {activeModal === 'QUESTS' && (
            <div className="space-y-3">
              {quests.map((q) => {
                const done = q.progress >= q.target;
                return (
                  <div
                    key={q.id}
                    className="rpg-slot flex flex-wrap items-center justify-between gap-3 rounded-xl p-3.5"
                  >
                    <div>
                      <div className="text-sm font-bold text-amber-200">
                        {lang === 'id' ? q.titleId : q.titleEn}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-300">
                        {lang === 'id' ? q.descId : q.descEn}
                      </div>
                      <div className="font-mono-num mt-1.5 text-xs text-sky-300">
                        Progress: {Math.min(q.progress, q.target)}/{q.target} · Reward: {q.rewardGold}G
                        {q.rewardItem
                          ? ` + ${q.rewardItem.count} ${
                              lang === 'id'
                                ? ITEMS[q.rewardItem.id].nameId
                                : ITEMS[q.rewardItem.id].nameEn
                            }`
                          : ''}
                      </div>
                    </div>
                    {q.claimed ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                        <Check className="h-4 w-4" />
                        {lang === 'id' ? 'Selesai' : 'Claimed'}
                      </span>
                    ) : (
                      <button
                        disabled={!done}
                        onClick={() => onClaimQuest(q.id)}
                        className={`rounded-lg px-4 py-2 text-xs font-bold ${
                          done
                            ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {lang === 'id' ? 'Klaim' : 'Claim'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* FIELD GUIDE */}
          {activeModal === 'GUIDE' && (
            <div className="space-y-4 text-sm leading-relaxed text-slate-200">
              <div className="rpg-slot rounded-xl p-4">
                <h3 className="font-pixel text-sm text-emerald-300">
                  {lang === 'id' ? '1. Bertani & Homestead' : '1. Farming & Homestead'}
                </h3>
                <p className="mt-1.5 text-xs text-slate-300">
                  {lang === 'id'
                    ? 'Pilih Bibit (Slot 5) dan tekan Spasi / E di petak tanah untuk menanam. Gunakan Penyiram (Slot 4) setiap hari agar tanaman tumbuh saat kamu tidur di Pondok (kiri atas). Petik tanaman matang untuk dimakan di dungeon atau dijual di Peti Pengiriman!'
                    : 'Select Seeds (Slot 5) and press Space / E on garden soil to plant. Use the Watering Can (Slot 4) daily so crops grow overnight when you sleep at the Cottage (top-left). Harvest mature crops to eat in dungeon battles or sell at the Shipping Bin!'}
                </p>
              </div>
              <div className="rpg-slot rounded-xl p-4">
                <h3 className="font-pixel text-sm text-orange-300">
                  {lang === 'id' ? '2. Tambang & Pandai Besi' : '2. Quarry & Blacksmith Forge'}
                </h3>
                <p className="mt-1.5 text-xs text-slate-300">
                  {lang === 'id'
                    ? 'Gunakan Beliung (Slot 2) di batu Kristal Rune kanan bawah dan Kapak (Slot 3) pada tunggul kayu. Tempa Pedang & Zirah di Bengkel (kiri bawah), dan pulihkan HP/RP di Kuil Kristal Biru.'
                    : 'Use Pickaxe (Slot 2) on blue Rune Crystal nodes in the lower-right quarry and Axe (Slot 3) on timber stumps. Upgrade your Blade & Mail at the Blacksmith Forge (bottom-left), and heal HP/RP at the Blue Rune Shrine.'}
                </p>
              </div>
              <div className="rpg-slot rounded-xl p-4">
                <h3 className="font-pixel text-sm text-fuchsia-300">
                  {lang === 'id' ? '3. Dungeon Jurang Turn-Based Roguelike' : '3. Turn-Based Roguelike Abyss Dungeon'}
                </h3>
                <p className="mt-1.5 text-xs text-slate-300">
                  {lang === 'id'
                    ? 'Seberangi jembatan kayu kanan atas menuju Gerbang Tengkorak Ungu! Jelajahi Lantai 1–5, buka Peti, pilih Berkah Rune roguelike, dan perhatikan niat serangan musuh (Tangkis serangan CRIT musuh dengan Bertahan untuk serangan balik!).'
                    : 'Cross the upper-right wooden bridge into the Purple Skull Portal! Explore procedural Floors 1–5, draft Roguelike Rune Blessings, watch enemy Intent telegraphs above their heads (Defend against CRIT windups to Parry!), and conquer the Abyssal Rune Lich on Floor 5.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
