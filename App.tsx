
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, GamePhase, Tribute, GameSettings, WeatherType } from './types';
import { initializeGame, advanceGamePhase, manualInteraction } from './services/gameEngine';
import HexMap from './components/HexMap';
import EventLog from './components/EventLog';
import TributeList from './components/TributeList';
import TributeInspector from './components/TributeInspector';
import Modal from './components/Modal';
import HelpModal from './components/HelpModal';
import { WEATHER_CONFIG, GAME_PRESETS } from './constants';

const App: React.FC = () => {
  const [configMode, setConfigMode] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    lethality: 'medium',
    resourceScarcity: 'normal',
    mapSize: 5,
    tributeCount: 24,
    gameSpeed: 1500,
    finaleDay: 7,
    bloodbathDeaths: 5,
    useCareerAlliance: true,
    useAges: true,
    autoContinueOnDeath: false
  });

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTributeId, setSelectedTributeId] = useState<string | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showFallen, setShowFallen] = useState(false);
  const [viewingMapAfterGameOver, setViewingMapAfterGameOver] = useState(false);
  
  // Start Game
  const handleStartGame = () => {
    const newGame = initializeGame(settings);
    setGameState(newGame);
    setConfigMode(false);
    setIsAutoPlaying(false);
    setViewingMapAfterGameOver(false);
  };

  const handleNextPhase = useCallback(() => {
    setGameState(prevState => {
      if (!prevState || prevState.phase === GamePhase.GAME_OVER) return prevState;
      return advanceGamePhase(prevState);
    });
  }, []);

  // Correct Auto Play Loop using setTimeout to prevent drift and overlaps
  useEffect(() => {
    if (!isAutoPlaying || gameState?.phase === GamePhase.GAME_OVER) return;

    const timeoutId = setTimeout(() => {
      handleNextPhase();
    }, settings.gameSpeed);

    return () => clearTimeout(timeoutId);
  }, [gameState, isAutoPlaying, settings.gameSpeed, handleNextPhase]);

  // Fallen Tribute Effect
  useEffect(() => {
    if (gameState && gameState.deceasedQueue.length > 0) {
       if (settings.autoContinueOnDeath) {
           // Automatically clear the queue without interrupting flow
           setGameState(prev => prev ? ({ ...prev, deceasedQueue: [] }) : null);
       } else {
           setShowFallen(true);
           setIsAutoPlaying(false); 
       }
    }
  }, [gameState?.deceasedQueue, settings.autoContinueOnDeath]);

  const handleSelectTribute = (t: Tribute) => {
      setSelectedTributeId(t.id);
  };

  const handleManualInteraction = (action: 'alliance' | 'betray' | 'gift', targetId: string) => {
      if (!gameState || !selectedTributeId) return;
      const newState = manualInteraction(action, selectedTributeId, targetId, gameState);
      setGameState(newState);
  }

  const handleCloseFallen = () => {
    if (!gameState) return;
    setGameState(prev => prev ? ({ ...prev, deceasedQueue: [] }) : null);
    setShowFallen(false);
  };

  const handleRestart = () => {
     if (window.confirm("Are you sure you want to abort the current simulation?")) {
        setIsAutoPlaying(false);
        setGameState(null);
        setConfigMode(true);
     }
  };

  // --- CONFIG SCREEN ---
  if (configMode) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-holo-200 font-mono overflow-auto relative z-30">
            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
            <div className="w-full max-w-3xl bg-slate-900 border border-holo-600 p-8 rounded-xl shadow-[0_0_40px_rgba(14,165,233,0.2)] my-8 relative z-50">
                <button 
                   onClick={() => setShowHelp(true)}
                   className="absolute top-6 right-6 text-holo-500 hover:text-white text-sm font-bold uppercase tracking-wide border border-holo-700 px-3 py-1 rounded hover:bg-holo-900"
                >
                   ? How To Play
                </button>
                <h1 className="text-3xl font-bold text-white mb-2 text-center tracking-[0.2em]">THE ARENA SIMULATOR</h1>
                <p className="text-center text-holo-500 mb-6">CONFIGURE PARAMETERS</p>
                
                {/* PRESETS */}
                <div className="flex gap-2 justify-center mb-8 border-b border-slate-800 pb-6">
                    {Object.keys(GAME_PRESETS).map(key => (
                        <button 
                            key={key}
                            onClick={() => setSettings(GAME_PRESETS[key])}
                            className="px-3 py-2 text-xs bg-slate-800 hover:bg-holo-900 border border-slate-600 hover:border-holo-500 rounded transition-colors uppercase font-bold"
                        >
                            {key}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block mb-2 text-sm uppercase text-holo-400">Map Radius ({settings.mapSize})</label>
                        <input 
                            type="range" min="3" max="8" value={settings.mapSize} 
                            onChange={(e) => setSettings({...settings, mapSize: Number(e.target.value)})}
                            className="w-full accent-holo-500"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm uppercase text-holo-400">Tribute Count ({settings.tributeCount})</label>
                        <input 
                            type="range" min="4" max="48" step="2" value={settings.tributeCount} 
                            onChange={(e) => setSettings({...settings, tributeCount: Number(e.target.value)})}
                            className="w-full accent-holo-500"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm uppercase text-holo-400">Simulation Speed</label>
                        <select 
                            value={settings.gameSpeed}
                            onChange={(e) => setSettings({...settings, gameSpeed: Number(e.target.value)})}
                            className="w-full bg-slate-800 border border-slate-600 p-2 rounded"
                        >
                            <option value={3000}>Slow</option>
                            <option value={1500}>Normal</option>
                            <option value={800}>Fast</option>
                            <option value={100}>Hyper</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm uppercase text-holo-400">Lethality</label>
                        <select 
                            value={settings.lethality}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'low' || val === 'medium' || val === 'high') {
                                    setSettings({...settings, lethality: val});
                                }
                            }}
                            className="w-full bg-slate-800 border border-slate-600 p-2 rounded"
                        >
                            <option value="low">Low (0.6x DMG)</option>
                            <option value="medium">Medium (1.0x DMG)</option>
                            <option value="high">High (1.5x DMG)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block mb-2 text-sm uppercase text-holo-400">Finale Day ({settings.finaleDay})</label>
                        <input 
                            type="range" min="3" max="16" value={settings.finaleDay} 
                            onChange={(e) => setSettings({...settings, finaleDay: Number(e.target.value)})}
                            className="w-full accent-holo-500"
                        />
                         <p className="text-[10px] text-slate-500 mt-1">Day when map shrinks to center.</p>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm uppercase text-holo-400">Bloodbath Deaths ({settings.bloodbathDeaths})</label>
                        <input 
                            type="range" min="0" max={settings.tributeCount} value={settings.bloodbathDeaths} 
                            onChange={(e) => setSettings({...settings, bloodbathDeaths: Number(e.target.value)})}
                            className="w-full accent-holo-500"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">Target deaths in initial rush.</p>
                    </div>
                    
                    <div className="col-span-2 flex flex-wrap gap-6 justify-center border-t border-slate-800 pt-6">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={settings.useCareerAlliance} 
                                onChange={(e) => setSettings({...settings, useCareerAlliance: e.target.checked})}
                                className="w-5 h-5 accent-holo-500 rounded cursor-pointer"
                            />
                            <span className="text-sm uppercase group-hover:text-white">Career Alliance (D1, D2, D4)</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={settings.useAges} 
                                onChange={(e) => setSettings({...settings, useAges: e.target.checked})}
                                className="w-5 h-5 accent-holo-500 rounded cursor-pointer"
                            />
                            <span className="text-sm uppercase group-hover:text-white">Varying Ages (12-18)</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={settings.autoContinueOnDeath} 
                                onChange={(e) => setSettings({...settings, autoContinueOnDeath: e.target.checked})}
                                className="w-5 h-5 accent-holo-500 rounded cursor-pointer"
                            />
                            <span className="text-sm uppercase group-hover:text-white">Auto-Continue On Death</span>
                        </label>
                    </div>
                </div>

                <button 
                    onClick={handleStartGame}
                    className="w-full py-4 bg-holo-600 hover:bg-holo-500 text-white font-bold text-xl tracking-widest rounded shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all hover:scale-[1.02]"
                >
                    INITIALIZE SIMULATION
                </button>
            </div>
        </div>
      );
  }

  if (!gameState) return null;

  // Derive selected tribute from current state to ensure live updates
  const selectedTribute = gameState.tributes.find(t => t.id === selectedTributeId) || null;

  // Find others in same hex for inspector
  const tributesAtSelectedLoc = selectedTribute 
    ? gameState.tributes.filter(t => t.location.q === selectedTribute.location.q && t.location.r === selectedTribute.location.r)
    : [];

  const weatherInfo = WEATHER_CONFIG[gameState.weather];

  return (
    <div className="h-screen w-screen flex flex-col p-4 gap-4 max-w-[1600px] mx-auto relative z-30">
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* Header / Status Bar */}
      <header className="flex justify-between items-center bg-slate-900/80 border border-holo-700 p-4 rounded-lg shadow-lg backdrop-blur-md relative overflow-hidden shrink-0">
        {/* Hazard Warning Background */}
        {gameState.activeHazard && (
          <div className="absolute inset-0 bg-red-500/10 animate-pulse-slow pointer-events-none z-0"></div>
        )}

        <div className="z-10 flex items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-holo-300 to-white font-mono tracking-tight">
                    THE ARENA SIMULATOR
                </h1>
                <p className="text-xs text-holo-600 tracking-[0.3em] uppercase">Gamemaker Control Console</p>
            </div>
            <button onClick={() => setShowHelp(true)} className="text-slate-500 hover:text-white text-xs border border-slate-700 px-2 py-1 rounded z-50 relative">
                HELP
            </button>
            {viewingMapAfterGameOver && (
                 <button onClick={() => setViewingMapAfterGameOver(false)} className="text-holo-400 hover:text-white text-xs border border-holo-700 px-2 py-1 rounded z-50 relative bg-holo-950/50">
                    RETURN TO SUMMARY
                </button>
            )}
        </div>

        {/* Weather Widget */}
        <div className="z-10 flex items-center gap-4 bg-slate-950/50 px-4 py-2 rounded border border-slate-700/50 min-w-[200px]">
             <div className="text-center">
                 <p className="text-[10px] text-slate-500 uppercase font-bold">Forecast</p>
                 <p className={`font-bold ${gameState.weather === WeatherType.STORM ? 'text-yellow-400 animate-pulse' : 'text-white'}`}>
                    {gameState.weather}
                 </p>
             </div>
             <div className="h-8 w-[1px] bg-slate-700"></div>
             <div className="text-[10px] text-slate-400 leading-tight max-w-[140px]">
                 {weatherInfo.description}
             </div>
        </div>

        {/* Active Hazard Warning */}
        {gameState.activeHazard && (
          <div className="z-10 flex flex-col items-center animate-pulse text-red-500">
             <span className="text-3xl">⚠</span>
             <span className="text-xs font-bold tracking-widest uppercase">{gameState.activeHazard.type}</span>
          </div>
        )}

        <div className="flex items-center gap-8 z-10">
          <div className="text-center">
             <span className="text-xs text-slate-500 uppercase block">Day</span>
             <span className="text-2xl font-mono font-bold text-white">{gameState.day}</span>
          </div>
          <div className="text-center w-32">
             <span className="text-xs text-slate-500 uppercase block">Time of Day</span>
             <span className={`text-xl font-mono font-bold ${gameState.phase === GamePhase.NIGHT ? 'text-indigo-400' : 'text-yellow-400'}`}>
               {gameState.phase}
             </span>
          </div>
          
          <div className="flex gap-2 z-50 relative">
            <button 
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              disabled={gameState.phase === GamePhase.GAME_OVER}
              className={`px-6 py-2 rounded border font-mono text-sm transition-all ${isAutoPlaying ? 'bg-amber-500/20 border-amber-500 text-amber-400 animate-pulse' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}
            >
              {isAutoPlaying ? 'PAUSE' : 'PLAY'}
            </button>
            <button 
              onClick={handleNextPhase}
              disabled={isAutoPlaying || gameState.phase === GamePhase.GAME_OVER}
              className="px-6 py-2 rounded bg-holo-600 hover:bg-holo-500 text-white font-bold border border-holo-400 shadow-[0_0_10px_rgba(14,165,233,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              NEXT
            </button>
             <button 
              onClick={handleRestart}
              className="px-4 py-2 rounded bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-800 text-xs font-bold uppercase tracking-wider ml-4"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden z-20 relative">
        
        {/* Map Area (Center) */}
        <div className="lg:col-span-6 h-full min-h-0 relative z-30">
           <HexMap 
             map={gameState.map} 
             tributes={gameState.tributes} 
             onTributeClick={handleSelectTribute} 
           />
        </div>

        {/* Right Side: Tributes and Log */}
        <div className="lg:col-span-3 h-full min-h-0 overflow-hidden z-30">
           <TributeList 
             tributes={gameState.tributes} 
             onSelect={handleSelectTribute} 
           />
        </div>
        
        <div className="lg:col-span-3 h-full min-h-0 overflow-hidden z-30">
           <EventLog logs={gameState.logs} />
        </div>
      </div>

      {/* Modals / Floating Panels */}
      {selectedTribute && (
        <TributeInspector 
          tribute={selectedTribute} 
          allTributes={gameState.tributes}
          tributesAtLoc={tributesAtSelectedLoc}
          onClose={() => setSelectedTributeId(null)} 
          onInteraction={handleManualInteraction}
          onSelectTribute={handleSelectTribute}
        />
      )}

      {showFallen && gameState.deceasedQueue.length > 0 && (
        <div className="z-50 relative">
        <Modal title="THE FALLEN" onClose={handleCloseFallen}>
          <div className="text-center space-y-4">
            <p className="text-slate-400 mb-4">Cannons fire in the distance...</p>
            <div className="grid grid-cols-3 gap-4 max-h-[300px] overflow-y-auto">
              {gameState.deceasedQueue.map(t => (
                <div key={t.id} className="flex flex-col items-center animate-in zoom-in duration-500">
                   <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-600 grayscale mb-2">
                     <span className="text-2xl">💀</span>
                   </div>
                   <span className="font-mono text-white font-bold text-xs">{t.name}</span>
                   <span className="text-xs text-red-500">{t.district}</span>
                </div>
              ))}
            </div>
            <button onClick={handleCloseFallen} className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-white w-full">
              Respect the Dead (Continue)
            </button>
          </div>
        </Modal>
        </div>
      )}

      {gameState.phase === GamePhase.GAME_OVER && !viewingMapAfterGameOver && (
         <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur">
            <div className="text-center p-10 border-2 border-holo-400 rounded-xl bg-slate-900 shadow-[0_0_50px_rgba(14,165,233,0.5)]">
               <h2 className="text-4xl font-bold text-white mb-2 tracking-widest">GAME OVER</h2>
               <div className="w-32 h-1 bg-holo-500 mx-auto mb-6"></div>
               {gameState.winner ? (
                 <>
                   <p className="text-holo-300 uppercase tracking-widest mb-4">The Victor Is</p>
                   <div className="text-5xl font-black text-white mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                     {gameState.winner.name}
                   </div>
                   <p className="text-slate-400 font-mono">Kills: {gameState.winner.kills} | Health Remaining: {Math.floor(gameState.winner.health)}%</p>
                 </>
               ) : (
                 <p className="text-red-500 text-2xl font-bold">NO SURVIVORS</p>
               )}
               <div className="flex gap-4 mt-8 justify-center">
                 <button 
                   onClick={() => setViewingMapAfterGameOver(true)}
                   className="px-8 py-3 border border-holo-600 hover:bg-holo-900 text-white rounded font-bold tracking-wider transition-colors"
                 >
                   VIEW MAP
                 </button>
                 <button 
                   onClick={() => setConfigMode(true)}
                   className="px-8 py-3 bg-holo-600 hover:bg-holo-500 text-white rounded font-bold tracking-wider transition-colors"
                 >
                   RETURN TO CONFIG
                 </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default App;
