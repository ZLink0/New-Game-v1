import React from 'react';
import {
  Backpack,
  BookOpen,
  Calendar,
  Coins,
  Hammer,
  Heart,
  Menu,
  Shield,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ITEMS } from '../game/data';
import { MAP_H, MAP_W } from '../game/homesteadMap';
import { getItemIconUrl } from '../game/pixelSprites';
import {
  ActiveModal,
  DungeonFloor,
  InventoryMap,
  ItemId,
  Language,
  PlayerStats,
  SceneZone,
} from '../game/types';

interface HudOverlayProps {
  stats: PlayerStats;
  sceneZone: SceneZone;
  dungeonFloor: DungeonFloor | null;
  inventory: InventoryMap;
  hotbarItems: ItemId[];
  selectedSlot: number;
  lang: Language;
  muted: boolean;
  showTouchControls: boolean;
  nearPrompt: string | null;
  playerTile: { x: number; y: number };
  unclaimedQuests: number;
  onSelectSlot: (idx: number) => void;
  onOpenModal: (modal: ActiveModal) => void;
  onOpenPause: () => void;
  onToggleMute: () => void;
  onTriggerAction: () => void;
  onTouchDir: (dx: number, dy: number) => void;
}

function formatClock(totalMinutes: number): string {
  const hrs = Math.floor(totalMinutes / 60) % 24;
  const mins = Math.floor(totalMinutes % 60);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  stats,
  sceneZone,
  dungeonFloor,
  inventory,
  hotbarItems,
  selectedSlot,
  lang,
  muted,
  showTouchControls,
  nearPrompt,
  playerTile,
  unclaimedQuests,
  onSelectSlot,
  onOpenModal,
  onOpenPause,
  onToggleMute,
  onTriggerAction,
  onTouchDir,
}) => {
  const hpPct = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const rpPct = Math.max(0, Math.min(100, (stats.rp / stats.maxRp) * 100));
  const heartCount = Math.max(1, Math.ceil((stats.hp / stats.maxHp) * 3));

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-4">
      {/* TOP BAR: LEFT HERO STATUS & RIGHT CALENDAR / MINIMAP */}
      <div className="flex items-start justify-between gap-3">
        {/* TOP-LEFT STATUS + SIDE QUICK BUTTONS */}
        <div className="flex flex-col gap-2">
          <div className="pointer-events-auto rpg-panel flex items-center gap-3 rounded-xl px-3 py-2">
            {/* Pixel Hero Portrait Badge */}
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-[#2d4a2b]">
              <svg viewBox="0 0 24 24" className="h-9 w-9" aria-hidden="true">
                <rect x="6" y="4" width="12" height="5" fill="#2ea44f" />
                <rect x="6" y="8" width="12" height="4" fill="#facc15" />
                <rect x="7" y="11" width="10" height="8" fill="#ffe4cc" />
                <rect x="9" y="13" width="2" height="2" fill="#1e293b" />
                <rect x="13" y="13" width="2" height="2" fill="#1e293b" />
                <rect x="6" y="19" width="12" height="4" fill="#1f7a38" />
              </svg>
              <span className="font-mono-num absolute -bottom-1.5 rounded border border-amber-300 bg-[#1d1826] px-1.5 py-0.5 text-[10px] font-bold leading-none text-amber-300">
                Lv.{stats.level}
              </span>
            </div>

            {/* Hearts + HP / RP Bars */}
            <div className="flex min-w-[138px] flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <Heart
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < heartCount ? 'fill-rose-500 text-rose-400' : 'fill-slate-700 text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-mono-num text-[11px] font-bold text-slate-300">
                  ATK {stats.baseAtk + (stats.swordLevel - 1) * 5 + (stats.level - 1) * 2}
                </span>
              </div>

              {/* HP Bar */}
              <div className="relative h-3.5 w-full overflow-hidden rounded border border-slate-900 bg-slate-900/90">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-lime-400 transition-all duration-150"
                  style={{ width: `${hpPct}%` }}
                />
                <span className="font-mono-num absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                  HP {stats.hp}/{stats.maxHp}
                </span>
              </div>

              {/* RP Bar */}
              <div className="relative h-3.5 w-full overflow-hidden rounded border border-slate-900 bg-slate-900/90">
                <div
                  className="h-full bg-gradient-to-r from-sky-600 to-cyan-300 transition-all duration-150"
                  style={{ width: `${rpPct}%` }}
                />
                <span className="font-mono-num absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                  RP {stats.rp}/{stats.maxRp}
                </span>
              </div>
            </div>
          </div>

          {/* Left Quick Action Rail */}
          <div className="pointer-events-auto flex flex-col gap-1.5 self-start">
            <button
              onClick={() => onOpenModal('INVENTORY')}
              title={lang === 'id' ? 'Tas & Toko Bibit' : 'Pouch & Seed Shop'}
              className="rpg-panel flex h-10 w-10 items-center justify-center rounded-lg text-amber-200 transition-transform hover:scale-105 active:scale-95"
            >
              <Backpack className="h-5 w-5" />
            </button>
            <button
              onClick={() => onOpenModal('FORGE')}
              title={lang === 'id' ? 'Bengkel Pandai Besi' : 'Blacksmith Forge'}
              className="rpg-panel flex h-10 w-10 items-center justify-center rounded-lg text-orange-300 transition-transform hover:scale-105 active:scale-95"
            >
              <Hammer className="h-5 w-5" />
            </button>
            <button
              onClick={() => onOpenModal('GUIDE')}
              title={lang === 'id' ? 'Panduan Ladang' : 'Field Guide'}
              className="rpg-panel flex h-10 w-10 items-center justify-center rounded-lg text-emerald-300 transition-transform hover:scale-105 active:scale-95"
            >
              <BookOpen className="h-5 w-5" />
            </button>
            <button
              onClick={() => onOpenModal('QUESTS')}
              title={lang === 'id' ? 'Papan Misi' : 'Bounty Board'}
              className="rpg-panel relative flex h-10 w-10 items-center justify-center rounded-lg text-sky-200 transition-transform hover:scale-105 active:scale-95"
            >
              <Calendar className="h-5 w-5" />
              {unclaimedQuests > 0 && (
                <span className="font-mono-num absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded bg-rose-600 text-[10px] font-bold text-white">
                  {unclaimedQuests}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* TOP-RIGHT CALENDAR / GOLD + MINIMAP + MENU */}
        <div className="flex items-start gap-2">
          <div className="pointer-events-auto rpg-panel flex flex-col gap-1 rounded-xl px-3 py-2 text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-amber-100">
              <span>{sceneZone === 'DUNGEON' ? `Abyss F${dungeonFloor?.floorNumber ?? 1}` : `${stats.season} · Day ${stats.day}`}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num text-amber-300">{formatClock(stats.timeMinutes)}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <Coins className="h-4 w-4 text-amber-400" />
              <span className="font-mono-num text-sm font-bold text-amber-300">
                {stats.gold.toLocaleString()} G
              </span>
            </div>
          </div>

          {/* Compact Live Minimap */}
          <div className="pointer-events-auto rpg-panel hidden sm:flex h-[68px] w-[86px] flex-col overflow-hidden rounded-xl p-1">
            <div className="relative h-full w-full overflow-hidden rounded bg-[#1a2e22]">
              {sceneZone === 'HOMESTEAD' ? (
                <>
                  {/* Cottage marker */}
                  <div className="absolute left-[18%] top-[24%] h-2.5 w-3 bg-blue-500" title="Cottage" />
                  {/* Farm marker */}
                  <div className="absolute left-[15%] top-[55%] h-3 w-3 bg-amber-700" title="Farm" />
                  {/* Dungeon portal marker */}
                  <div className="absolute right-[14%] top-[16%] h-2.5 w-2.5 bg-fuchsia-500" title="Dungeon" />
                  {/* River accent */}
                  <div className="absolute left-[54%] top-[10%] h-[75%] w-1 bg-sky-400/70" />
                  {/* Hero position */}
                  <div
                    className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-1 ring-emerald-400"
                    style={{
                      left: `${(playerTile.x / MAP_W) * 100}%`,
                      top: `${(playerTile.y / MAP_H) * 100}%`,
                    }}
                  />
                </>
              ) : (
                dungeonFloor && (
                  <>
                    <div className="absolute inset-0 bg-[#120d1d]" />
                    {dungeonFloor.entities
                      .filter((e) => !e.opened && dungeonFloor.explored[e.tileY]?.[e.tileX])
                      .map((e) => (
                        <div
                          key={e.id}
                          className={`absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 ${
                            e.kind === 'ENEMY'
                              ? 'bg-rose-500'
                              : e.kind === 'STAIRS'
                              ? 'bg-amber-300'
                              : 'bg-sky-400'
                          }`}
                          style={{
                            left: `${(e.tileX / dungeonFloor.width) * 100}%`,
                            top: `${(e.tileY / dungeonFloor.height) * 100}%`,
                          }}
                        />
                      ))}
                    <div
                      className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                      style={{
                        left: `${(playerTile.x / dungeonFloor.width) * 100}%`,
                        top: `${(playerTile.y / dungeonFloor.height) * 100}%`,
                      }}
                    />
                  </>
                )
              )}
            </div>
          </div>

          {/* Mute & Pause */}
          <div className="pointer-events-auto flex flex-col gap-1.5">
            <button
              onClick={onOpenPause}
              aria-label="Pause Menu"
              className="rpg-panel flex h-10 w-10 items-center justify-center rounded-xl text-amber-100 transition-transform hover:scale-105 active:scale-95"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={onToggleMute}
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
              className="rpg-panel flex h-10 w-10 items-center justify-center rounded-xl text-slate-200 transition-transform hover:scale-105 active:scale-95"
            >
              {muted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-300" />}
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM REGION: PROMPT + OPTIONAL TOUCH CONTROLS + 9-SLOT HOTBAR */}
      <div className="flex flex-col items-center gap-2">
        {/* Contextual Interact Prompt */}
        {nearPrompt && (
          <button
            onClick={onTriggerAction}
            className="pointer-events-auto rpg-panel-warm rounded-lg px-3.5 py-1.5 text-xs font-bold tracking-wide text-amber-200 shadow-lg transition-transform hover:scale-105"
          >
            {nearPrompt}
          </button>
        )}

        {/* Touch Controls Row (shown on mobile or when enabled) */}
        {showTouchControls && (
          <div className="flex w-full items-end justify-between px-1 pb-1">
            {/* D-Pad */}
            <div className="pointer-events-auto grid grid-cols-3 gap-1 rounded-xl bg-slate-950/55 p-1.5">
              <div />
              <button
                onPointerDown={() => onTouchDir(0, -1)}
                onPointerUp={() => onTouchDir(0, 0)}
                onPointerLeave={() => onTouchDir(0, 0)}
                className="rpg-slot flex h-11 w-11 items-center justify-center rounded-lg text-sm font-bold text-white active:bg-amber-500/40"
              >
                ▲
              </button>
              <div />
              <button
                onPointerDown={() => onTouchDir(-1, 0)}
                onPointerUp={() => onTouchDir(0, 0)}
                onPointerLeave={() => onTouchDir(0, 0)}
                className="rpg-slot flex h-11 w-11 items-center justify-center rounded-lg text-sm font-bold text-white active:bg-amber-500/40"
              >
                ◀
              </button>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-800/60 text-[10px] text-slate-400">
                •
              </div>
              <button
                onPointerDown={() => onTouchDir(1, 0)}
                onPointerUp={() => onTouchDir(0, 0)}
                onPointerLeave={() => onTouchDir(0, 0)}
                className="rpg-slot flex h-11 w-11 items-center justify-center rounded-lg text-sm font-bold text-white active:bg-amber-500/40"
              >
                ▶
              </button>
              <div />
              <button
                onPointerDown={() => onTouchDir(0, 1)}
                onPointerUp={() => onTouchDir(0, 0)}
                onPointerLeave={() => onTouchDir(0, 0)}
                className="rpg-slot flex h-11 w-11 items-center justify-center rounded-lg text-sm font-bold text-white active:bg-amber-500/40"
              >
                ▼
              </button>
              <div />
            </div>

            {/* A / Bag Buttons */}
            <div className="pointer-events-auto flex items-center gap-2.5">
              <button
                onClick={() => onOpenModal('INVENTORY')}
                className="rpg-panel flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-400/70 text-xs font-bold text-amber-200 active:scale-95"
              >
                <Shield className="h-5 w-5" />
              </button>
              <button
                onClick={onTriggerAction}
                className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-rose-300 bg-rose-600 font-pixel text-base font-bold text-white shadow-lg active:scale-95"
              >
                A
              </button>
            </div>
          </div>
        )}

        {/* 9-SLOT PIXEL HOTBAR */}
        <div className="pointer-events-auto rpg-panel flex items-center gap-1.5 rounded-xl p-1.5">
          {hotbarItems.map((itemId, idx) => {
            const isActive = idx === selectedSlot;
            const def = ITEMS[itemId];
            const count = inventory[itemId] ?? 0;
            const showCount = def.category !== 'tool';
            return (
              <button
                key={`${itemId}_${idx}`}
                onClick={() => onSelectSlot(idx)}
                title={lang === 'id' ? def.nameId : def.nameEn}
                className={`relative flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg transition-transform hover:scale-105 ${
                  isActive ? 'rpg-slot-active' : 'rpg-slot'
                }`}
              >
                <span className="font-mono-num absolute left-1 top-0.5 text-[9px] text-slate-400">
                  {idx + 1}
                </span>
                <img
                  src={getItemIconUrl(itemId)}
                  alt={lang === 'id' ? def.nameId : def.nameEn}
                  referrerPolicy="no-referrer"
                  className="pixelated h-7 w-7 sm:h-8 sm:w-8"
                />
                {showCount && (
                  <span className="font-mono-num absolute bottom-0.5 right-1 text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={() => onOpenModal('INVENTORY')}
            title={lang === 'id' ? 'Buka Tas Lengkap' : 'Open Full Pouch'}
            className="rpg-slot flex h-11 w-10 sm:h-12 sm:w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-amber-200 hover:brightness-125"
          >
            •••
          </button>
        </div>
      </div>
    </div>
  );
};
