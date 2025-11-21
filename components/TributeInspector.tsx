
import React, { useState } from 'react';
import { Tribute, RelationshipType, Relationship } from '../types';
import { STATUS_CONFIG } from '../constants';
import Modal from './Modal';

interface TributeInspectorProps {
  tribute: Tribute | null;
  allTributes: Tribute[];
  tributesAtLoc: Tribute[];
  onClose: () => void;
  onInteraction: (action: 'alliance' | 'betray' | 'gift', targetId: string) => void;
  onSelectTribute: (t: Tribute) => void;
}

const ProgressBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="mb-2">
    <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
      <span>{label}</span>
      <span>{Math.floor(value)}%</span>
    </div>
    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${Math.max(0, value)}%` }}></div>
    </div>
  </div>
);

const StatBlock = ({ label, value }: { label: string, value: number }) => (
  <div className="flex flex-col items-center bg-slate-900 p-2 rounded border border-slate-800">
    <span className="text-xs text-slate-500 font-mono uppercase">{label}</span>
    <span className="text-lg font-bold text-holo-300">{value}</span>
  </div>
);

const RelationshipBadge = ({ type, trust }: { type: RelationshipType, trust: number }) => {
    let color = "text-slate-400 bg-slate-800";
    if (type === RelationshipType.ENEMY) color = "text-red-200 bg-red-900/50 border-red-800";
    if (type === RelationshipType.ALLY) color = "text-blue-200 bg-blue-900/50 border-blue-800";
    if (type === RelationshipType.CLOSE_ALLY) color = "text-purple-200 bg-purple-900/50 border-purple-800";
    if (type === RelationshipType.LOVE) color = "text-pink-200 bg-pink-900/50 border-pink-800 animate-pulse";
    
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded border ${color} min-w-[60px] text-center`}>
           {type} ({trust})
        </span>
    );
}

const TributeInspector: React.FC<TributeInspectorProps> = ({ tribute, allTributes, tributesAtLoc, onClose, onInteraction, onSelectTribute }) => {
  const [tab, setTab] = useState<'stats' | 'relationships'>('stats');

  if (!tribute) return null;

  // Determine others in same hex
  const others = tributesAtLoc.filter(t => t.id !== tribute.id && t.isAlive);

  // Get name map for relationships
  const getName = (id: string) => {
      const t = allTributes.find(at => at.id === id);
      return t ? t.name : id;
  };

  const isAlive = (id: string) => {
     const t = allTributes.find(at => at.id === id);
     return t ? t.isAlive : false;
  };

  return (
    <Modal title={`IDENT: ${tribute.name}`} onClose={onClose}>
      <div className="space-y-4 min-h-[400px]">
        
        {/* Header Info */}
        <div className="flex justify-between items-start">
           <div className="text-sm text-slate-400 font-mono">
             <p>DISTRICT: <span className="text-white">{tribute.district}</span></p>
             <p>AGE: <span className="text-white">{tribute.age}</span></p>
             <p>STATUS: <span className={tribute.isAlive ? "text-green-400" : "text-red-500"}>{tribute.isAlive ? "ACTIVE" : "DECEASED"}</span></p>
             {!tribute.isAlive && <p className="text-red-400 text-xs mt-1">CAUSE: {tribute.causeOfDeath}</p>}
             <p>KILLS: <span className="text-red-400 font-bold">{tribute.kills}</span></p>
           </div>
           {/* Inventory Grid */}
           <div className="flex gap-1 flex-wrap max-w-[150px] justify-end">
              {tribute.inventory.map((item, i) => (
                <div key={i} className="w-8 h-8 bg-slate-800 border border-slate-600 rounded flex items-center justify-center text-xs cursor-help hover:bg-slate-700 hover:border-holo-400 transition-colors" title={item.name}>
                   {item.type === 'weapon' ? '⚔' : item.id === 'sponsor' ? '🎁' : '🍎'}
                </div>
              ))}
              {tribute.inventory.length === 0 && <span className="text-xs text-slate-600 italic">No Items</span>}
           </div>
        </div>

        <div className="flex border-b border-holo-800/50 mb-2">
            <button 
                onClick={() => setTab('stats')}
                className={`flex-1 py-2 text-xs font-bold uppercase ${tab === 'stats' ? 'text-holo-400 border-b-2 border-holo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Vitals & Stats
            </button>
            <button 
                onClick={() => setTab('relationships')}
                className={`flex-1 py-2 text-xs font-bold uppercase ${tab === 'relationships' ? 'text-holo-400 border-b-2 border-holo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Relationships
            </button>
        </div>

        {tab === 'stats' && (
            <div className="animate-in fade-in duration-300">
                {/* Status Effects Section */}
                {tribute.statusEffects.length > 0 && (
                    <div className="mb-4 p-2 bg-slate-900/50 rounded border border-dashed border-slate-700">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Active Conditions</p>
                        <div className="flex gap-2 flex-wrap">
                            {tribute.statusEffects.map((effect) => {
                                const config = STATUS_CONFIG[effect] || { icon: "⚠️", color: "text-yellow-400 border-yellow-500 bg-yellow-950", description: "Unknown Effect" };
                                return (
                                    <div key={effect} className={`flex items-center gap-2 px-2 py-1 rounded border ${config.color}`} title={config.description}>
                                        <span>{config.icon}</span>
                                        <span className="text-xs font-bold">{effect}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-5 gap-2 mb-4">
                <StatBlock label="STR" value={tribute.stats.strength} />
                <StatBlock label="SPD" value={tribute.stats.speed} />
                <StatBlock label="CON" value={tribute.stats.constitution} />
                <StatBlock label="INT" value={tribute.stats.intellect} />
                <StatBlock label="AGG" value={tribute.stats.aggression} />
                </div>

                <div>
                <ProgressBar label="HEALTH" value={tribute.health} color="bg-red-500" />
                <ProgressBar label="HUNGER" value={tribute.hunger} color="bg-yellow-500" />
                <ProgressBar label="STAMINA" value={tribute.stamina} color="bg-blue-500" />
                
                <div className={`mt-4 p-3 rounded border-2 transition-all duration-1000 relative overflow-hidden ${tribute.hype >= 20 ? 'bg-pink-950/30 border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.4)]' : 'bg-slate-950 border-pink-900/30'}`}>
                    <div className="flex justify-between items-center text-xs font-mono text-pink-400 mb-2 relative z-10">
                    <span className="font-bold tracking-widest flex items-center gap-2">
                        {tribute.hype >= 20 && <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-pink-400 opacity-75"></span>}
                        AUDIENCE HYPE
                    </span>
                    <span className={`text-lg ${tribute.hype >= 20 ? "text-white font-black drop-shadow-lg" : ""}`}>{tribute.hype}/20</span>
                    </div>
                    
                    <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden relative border border-pink-900/50 z-10">
                    <div 
                        className={`h-full bg-gradient-to-r from-pink-800 via-pink-500 to-pink-300 transition-all duration-500 ease-out ${tribute.hype >= 20 ? 'animate-pulse' : ''}`} 
                        style={{ width: `${Math.min(100, (tribute.hype / 20) * 100)}%` }}
                    ></div>
                    </div>
                </div>
                </div>
            </div>
        )}

        {tab === 'relationships' && (
             <div className="animate-in fade-in duration-300 h-[300px] overflow-y-auto pr-2">
                 {Object.keys(tribute.relationships).length === 0 ? (
                     <p className="text-slate-500 italic text-center text-sm mt-10">No established relationships yet.</p>
                 ) : (
                     <div className="space-y-2">
                         {Object.entries(tribute.relationships)
                            .sort(([,a], [,b]) => (b as Relationship).trust - (a as Relationship).trust)
                            .map(([targetId, rel]) => {
                             const r = rel as Relationship;
                             return (
                                 <div key={targetId} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
                                     <div className="flex flex-col">
                                        <span className={`text-sm font-bold ${isAlive(targetId) ? 'text-white' : 'text-slate-600 line-through'}`}>
                                            {getName(targetId)}
                                        </span>
                                        {!isAlive(targetId) && <span className="text-[10px] text-red-800">DECEASED</span>}
                                     </div>
                                     <RelationshipBadge type={r.type} trust={r.trust} />
                                 </div>
                             )
                         })}
                     </div>
                 )}
             </div>
        )}

        {/* Manual Interaction Section */}
        {tribute.isAlive && others.length > 0 && tab === 'stats' && (
            <div className="bg-slate-900/80 p-3 rounded-lg border border-holo-500 shadow-inner mt-4">
                <div className="flex items-center justify-between mb-2 border-b border-slate-700 pb-1">
                   <p className="text-xs text-holo-400 font-bold uppercase tracking-wider">⚠ Encounter in Progress</p>
                   <span className="text-[10px] text-slate-500">{others.length} Contact(s)</span>
                </div>
                
                <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                    {others.map(o => {
                        const myRel = tribute.relationships[o.id];
                        const type = myRel ? myRel.type : RelationshipType.NEUTRAL;
                        
                        return (
                        <div key={o.id} className="flex flex-col bg-slate-950 p-2 rounded border border-slate-800">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-white">{o.name}</span>
                                <RelationshipBadge type={type} trust={myRel?.trust || 0} />
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                                <button 
                                    onClick={() => onSelectTribute(o)}
                                    className="text-[10px] py-1.5 font-bold uppercase tracking-wide bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 rounded"
                                    title="Inspect this tribute"
                                >
                                    🔍
                                </button>
                                <button 
                                    onClick={() => onInteraction('alliance', o.id)}
                                    className="text-[10px] py-1.5 font-bold uppercase tracking-wide bg-blue-900 hover:bg-blue-700 text-blue-100 border border-blue-700 rounded"
                                >
                                    Bond
                                </button>
                                <button 
                                    onClick={() => onInteraction('betray', o.id)}
                                    className="text-[10px] py-1.5 font-bold uppercase tracking-wide bg-red-900 hover:bg-red-700 text-red-100 border border-red-700 rounded transition-colors"
                                >
                                    Attack
                                </button>
                                <button 
                                    onClick={() => onInteraction('gift', o.id)}
                                    disabled={tribute.inventory.length === 0}
                                    className="text-[10px] py-1.5 font-bold uppercase tracking-wide bg-green-900 hover:bg-green-700 text-green-100 border border-green-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Gift
                                </button>
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        )}

        <div className="bg-slate-950 p-2 rounded text-xs font-mono text-slate-500 border border-slate-800 truncate mt-4 shadow-inner">
          <span className="text-slate-600 mr-2">LAST ACTION:</span>
          {tribute.lastAction}
        </div>
      </div>
    </Modal>
  );
};

export default TributeInspector;
