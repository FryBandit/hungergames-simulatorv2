
import React, { useEffect, useRef } from 'react';
import { GameLog } from '../types';

interface EventLogProps {
  logs: GameLog[];
}

const EventLog: React.FC<EventLogProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-slate-950/80 border border-holo-700 rounded-lg overflow-hidden p-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
      <h3 className="text-holo-400 font-bold mb-2 border-b border-holo-800 pb-2 flex justify-between">
        <span>EVENT LOG</span>
        <span className="text-xs animate-pulse text-red-500">LIVE FEED</span>
      </h3>
      <div className="overflow-y-auto flex-1 space-y-1.5 pr-2 font-mono text-sm">
        {logs.length === 0 && <div className="text-slate-500 italic">Waiting for simulation start...</div>}
        {logs.map((log) => {
          let colorClass = "text-slate-300";
          let icon = "";
          let containerClass = "flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 items-start";

          switch (log.type) {
            case 'combat':
              colorClass = "text-orange-400";
              icon = "⚔";
              break;
            case 'death':
              colorClass = "text-red-500 font-bold bg-red-950/30 p-1 border-l-2 border-red-500";
              icon = "💀";
              break;
            case 'death-summary':
              containerClass += " justify-center";
              colorClass = "text-red-300 bg-slate-900/80 border border-red-900 p-1 my-1 text-center text-xs font-mono uppercase tracking-wider w-full shadow-inner";
              break;
            case 'gamemaker':
              containerClass += " justify-center";
              colorClass = "text-cyan-300 border-y border-cyan-900 py-1 my-2 text-center uppercase tracking-widest bg-cyan-950/20 w-full";
              break;
            case 'hazard':
              colorClass = "text-yellow-400 font-bold bg-yellow-400/10 p-1 border-l-2 border-yellow-500";
              icon = "⚠";
              break;
            case 'sponsor':
              colorClass = "text-pink-400 italic";
              icon = "🎁";
              break;
            case 'crafting':
              colorClass = "text-emerald-400";
              icon = "🛠";
              break;
            case 'weather':
              colorClass = "text-blue-300 italic bg-blue-950/30 p-1 border-l-2 border-blue-500";
              icon = "☁";
              break;
            case 'status':
              colorClass = "text-slate-400 italic text-xs";
              break;
            case 'trap':
              colorClass = "text-purple-400 font-bold";
              icon = "🕸";
              break;
            case 'alliance':
              colorClass = "text-blue-400 font-bold";
              icon = "🤝";
              break;
            case 'flee':
              colorClass = "text-slate-400 italic";
              icon = "💨";
              break;
            case 'rest':
              colorClass = "text-indigo-300 text-xs";
              icon = "💤";
              break;
            default:
              colorClass = "text-slate-300";
          }

          return (
            <div key={log.id} className={containerClass}>
              {log.type !== 'gamemaker' && log.type !== 'death-summary' && log.type !== 'hazard' && log.type !== 'weather' && log.type !== 'death' && (
                <span className="text-slate-600 whitespace-nowrap text-[10px] mt-0.5 font-bold">
                  D{log.day}
                </span>
              )}
              <div className={colorClass}>
                {icon && <span className="mr-2 opacity-80">{icon}</span>}
                {log.message}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default EventLog;