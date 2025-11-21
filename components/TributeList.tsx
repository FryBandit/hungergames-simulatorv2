import React from 'react';
import { Tribute } from '../types';

interface TributeListProps {
  tributes: Tribute[];
  onSelect: (t: Tribute) => void;
}

const TributeList: React.FC<TributeListProps> = ({ tributes, onSelect }) => {
  const alive = tributes.filter(t => t.isAlive);
  const dead = tributes.filter(t => !t.isAlive);

  return (
    <div className="h-full flex flex-col bg-slate-900/90 border border-holo-700 rounded-lg overflow-hidden shadow-lg">
      <div className="bg-slate-950 p-3 border-b border-holo-800">
        <h3 className="text-holo-400 font-bold text-sm tracking-widest">TRIBUTES ALIVE ({alive.length})</h3>
      </div>
      
      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        {alive.map(t => (
          <div 
            key={t.id} 
            onClick={() => onSelect(t)}
            className="flex justify-between items-center p-2 hover:bg-holo-900/30 cursor-pointer rounded border border-transparent hover:border-holo-500/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${t.health > 70 ? 'bg-green-500' : t.health > 30 ? 'bg-yellow-500' : 'bg-red-500'} shadow-[0_0_5px_currentColor]`}></div>
               <span className="text-slate-200 font-mono text-sm group-hover:text-white">{t.name}</span>
            </div>
            <div className="flex gap-2 text-xs text-slate-500">
                {t.kills > 0 && <span className="text-red-400">⚔ {t.kills}</span>}
                <span>{t.district}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-950 p-2 border-t border-holo-800">
        <h3 className="text-slate-500 font-bold text-xs tracking-widest">DECEASED ({dead.length})</h3>
      </div>
    </div>
  );
};

export default TributeList;