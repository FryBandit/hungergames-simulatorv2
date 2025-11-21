
import React from 'react';
import Modal from './Modal';
import { BIOME_ICONS, STATUS_CONFIG } from '../constants';
import { BiomeType } from '../types';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <Modal title="SIMULATION GUIDE" onClose={onClose}>
      <div className="max-h-[60vh] overflow-y-auto space-y-6 text-slate-300 font-mono text-sm pr-2">
        
        <section>
            <h3 className="text-holo-400 font-bold uppercase tracking-wider mb-2 border-b border-holo-800">Objective</h3>
            <p>Be the last Tribute alive. Tributes must manage hunger, thirst, and health while navigating a dangerous arena filled with hostile opponents and environmental hazards.</p>
        </section>

        <section>
            <h3 className="text-holo-400 font-bold uppercase tracking-wider mb-2 border-b border-holo-800">Stats & Vitals</h3>
            <ul className="space-y-2">
                <li><strong className="text-red-400">Strength (STR)</strong>: Increases melee damage.</li>
                <li><strong className="text-blue-400">Speed (SPD)</strong>: Determines escape chance and initiative.</li>
                <li><strong className="text-green-400">Constitution (CON)</strong>: Resistance to disease and injury.</li>
                <li><strong className="text-purple-400">Intellect (INT)</strong>: Increases trap detection and crafting.</li>
                <li><strong className="text-orange-400">Aggression (AGG)</strong>: Likelihood to attack first.</li>
            </ul>
        </section>

        <section>
            <h3 className="text-holo-400 font-bold uppercase tracking-wider mb-2 border-b border-holo-800">Map & Biomes</h3>
            <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2"><span className="text-xl">🌲</span> Forest (Resources)</div>
                <div className="flex items-center gap-2"><span className="text-xl">🌊</span> River (Water)</div>
                <div className="flex items-center gap-2"><span className="text-xl">⛰</span> Mountain (Tactical)</div>
                <div className="flex items-center gap-2"><span className="text-xl">🌿</span> Meadow (Food)</div>
                <div className="flex items-center gap-2"><span className="text-xl">⚠</span> Cornucopia (Weapons)</div>
            </div>
        </section>

        <section>
            <h3 className="text-holo-400 font-bold uppercase tracking-wider mb-2 border-b border-holo-800">Game Phases</h3>
            <ul className="list-disc pl-4 space-y-1">
                <li><strong className="text-white">SETUP</strong>: Generation of tributes and arena.</li>
                <li><strong className="text-red-500">BLOODBATH</strong>: Initial chaotic rush for weapons. High casualties.</li>
                <li><strong className="text-yellow-300">DAY</strong>: Exploration, hunting, and events.</li>
                <li><strong className="text-indigo-300">NIGHT</strong>: Resting, recovery, and stealth attacks. Hunger/Thirst deplete faster.</li>
            </ul>
        </section>
        
         <section>
            <h3 className="text-holo-400 font-bold uppercase tracking-wider mb-2 border-b border-holo-800">Status Effects</h3>
            <div className="space-y-2">
                 {Object.entries(STATUS_CONFIG).map(([name, config]) => (
                     <div key={name} className="flex items-center gap-2">
                         <span className="text-xl">{config.icon}</span>
                         <div>
                             <span className={`font-bold ${config.color.split(' ')[0]}`}>{name}</span>
                             <span className="text-xs text-slate-500 block">{config.description}</span>
                         </div>
                     </div>
                 ))}
            </div>
        </section>

        <section>
            <h3 className="text-holo-400 font-bold uppercase tracking-wider mb-2 border-b border-holo-800">Interactions</h3>
            <p>As a Gamemaker, you can inspect tributes by clicking on them. If two or more tributes are in the same location, you can manually force them to:</p>
            <div className="flex gap-2 mt-2">
                <span className="text-xs bg-blue-900 px-2 py-1 rounded border border-blue-700 text-blue-200">BOND</span>
                <span className="text-xs bg-red-900 px-2 py-1 rounded border border-red-700 text-red-200">ATTACK</span>
                <span className="text-xs bg-green-900 px-2 py-1 rounded border border-green-700 text-green-200">GIFT</span>
            </div>
        </section>

      </div>
    </Modal>
  );
};

export default HelpModal;
