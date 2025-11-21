

import { GameState, Tribute, GamePhase, HexTile, BiomeType, Stats, Item, GameLog, HazardType, RelationshipType, Relationship, GameSettings, District, ActiveHazard, WeatherType, Trap } from "../types";
import { DISTRICTS, GENDERS, WEAPONS, CONSUMABLES, SPONSOR_ITEMS, HAZARDS_DATA, STARTING_HEALTH, STARTING_HUNGER, STARTING_THIRST, STATUS_BLEEDING, STATUS_POISONED, STATUS_HEATSTROKE, STATUS_HYPOTHERMIA, RELATIONSHIP_THRESHOLDS, CAREER_DISTRICTS, IDLE_EVENTS, BONDING_EVENTS, BETRAYAL_EVENTS, CRAFTING_RECIPES, WEATHER_CONFIG, WEATHER_IDLE_EVENTS } from "../constants";

// --- Helper Functions ---

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateStats = (age: number, district: District): Stats => {
  const isYoung = age <= 13;
  const isOld = age >= 17;
  
  let stats = {
    strength: randomInt(3, 10) + (isOld ? 2 : 0) - (isYoung ? 2 : 0),
    speed: randomInt(3, 10) + (isYoung ? 2 : 0),
    constitution: randomInt(3, 10) + (isOld ? 1 : 0),
    intellect: randomInt(2, 10),
    aggression: randomInt(2, 10),
  };

  // District Bonuses
  if (CAREER_DISTRICTS.includes(district)) {
      stats.strength += 2;
      stats.aggression += 2;
      stats.constitution += 1;
  } else if (district === District.D11 || district === District.D7) { // Agriculture/Lumber
      stats.constitution += 2;
      stats.strength += 1;
  } else if (district === District.D3 || district === District.D5) { // Tech/Power
      stats.intellect += 3;
  } else if (district === District.D12 || district === District.D9) { // Mining/Grain
      stats.constitution += 1; // Resilient
  }

  return stats;
};

const getHexDistance = (a: { q: number, r: number }, b: { q: number, r: number }) => {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
};

const getNeighbors = (hex: {q: number, r: number}, map: HexTile[]) => {
  const potential = [
    { q: hex.q + 1, r: hex.r },
    { q: hex.q - 1, r: hex.r },
    { q: hex.q, r: hex.r + 1 },
    { q: hex.q, r: hex.r - 1 },
    { q: hex.q + 1, r: hex.r - 1 },
    { q: hex.q - 1, r: hex.r + 1 },
  ];
  return potential.filter(p => map.some(m => m.q === p.q && m.r === p.r));
}

const getLethalityMultiplier = (mode: GameSettings['lethality']) => {
    if (mode === 'low') return 0.6;
    if (mode === 'high') return 1.5;
    return 1.0;
}

// --- Weather Logic ---

const determineNextWeather = (current: WeatherType): WeatherType => {
  const roll = randomInt(1, 100);
  
  // Probabilities based on current weather (Markov chain-ish)
  switch (current) {
    case WeatherType.CLEAR:
      if (roll < 50) return WeatherType.CLEAR;
      if (roll < 75) return WeatherType.RAIN;
      if (roll < 85) return WeatherType.HEATWAVE;
      if (roll < 95) return WeatherType.FOG;
      return WeatherType.SNOW;
    case WeatherType.RAIN:
      if (roll < 40) return WeatherType.RAIN;
      if (roll < 60) return WeatherType.STORM;
      if (roll < 85) return WeatherType.CLEAR;
      return WeatherType.FOG;
    case WeatherType.STORM:
      if (roll < 30) return WeatherType.STORM;
      if (roll < 70) return WeatherType.RAIN;
      return WeatherType.CLEAR;
    case WeatherType.FOG:
      if (roll < 30) return WeatherType.FOG;
      if (roll < 60) return WeatherType.RAIN;
      return WeatherType.CLEAR;
    case WeatherType.HEATWAVE:
      if (roll < 40) return WeatherType.HEATWAVE;
      if (roll < 70) return WeatherType.CLEAR;
      return WeatherType.STORM; // Heat storm
    case WeatherType.SNOW:
      if (roll < 40) return WeatherType.SNOW;
      if (roll < 60) return WeatherType.FOG;
      return WeatherType.RAIN;
  }
  return WeatherType.CLEAR;
};

// --- Relationship Logic ---

const getRelationshipType = (trust: number): RelationshipType => {
    if (trust >= RELATIONSHIP_THRESHOLDS[RelationshipType.LOVE]) return RelationshipType.LOVE;
    if (trust >= RELATIONSHIP_THRESHOLDS[RelationshipType.CLOSE_ALLY]) return RelationshipType.CLOSE_ALLY;
    if (trust >= RELATIONSHIP_THRESHOLDS[RelationshipType.ALLY]) return RelationshipType.ALLY;
    if (trust <= RELATIONSHIP_THRESHOLDS[RelationshipType.ENEMY]) return RelationshipType.ENEMY;
    return RelationshipType.NEUTRAL;
}

const modifyTrust = (subject: Tribute, targetId: string, amount: number): void => {
    if (!subject.relationships[targetId]) {
        subject.relationships[targetId] = { type: RelationshipType.NEUTRAL, trust: 0 };
    } else {
        subject.relationships[targetId] = { ...subject.relationships[targetId] };
    }
    
    subject.relationships[targetId].trust = Math.max(-100, Math.min(100, subject.relationships[targetId].trust + amount));
    subject.relationships[targetId].type = getRelationshipType(subject.relationships[targetId].trust);
};

const propagateHostility = (attackerId: string, victim: Tribute, allTributes: Tribute[]) => {
    Object.keys(victim.relationships).forEach(otherId => {
        const rel = victim.relationships[otherId];
        if (rel.type === RelationshipType.ALLY || rel.type === RelationshipType.CLOSE_ALLY || rel.type === RelationshipType.LOVE) {
            const ally = allTributes.find(t => t.id === otherId);
            if (ally && ally.isAlive) {
                modifyTrust(ally, attackerId, -30); 
            }
        }
    });
};

// --- Generation ---

export const generateMap = (radius: number): HexTile[] => {
  const tiles: HexTile[] = [];
  
  // 1. Generate Grid
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      tiles.push({ q, r, biome: BiomeType.MEADOW }); // Default
    }
  }

  // 2. Place Cornucopia
  const center = tiles.find(t => t.q === 0 && t.r === 0);
  if (center) center.biome = BiomeType.CORNUCOPIA;

  // 3. Biome Seeds & Growth
  const seeds = [
      { type: BiomeType.FOREST, count: Math.max(1, Math.floor(radius * 1.2)), spread: 0.8 },
      { type: BiomeType.MOUNTAIN, count: Math.max(1, Math.floor(radius * 0.8)), spread: 0.7 },
      { type: BiomeType.RIVER, count: Math.max(1, Math.floor(radius * 0.6)), spread: 0.9 },
      { type: BiomeType.SWAMP, count: Math.max(1, Math.floor(radius * 0.5)), spread: 0.7 },
      { type: BiomeType.DESERT, count: Math.max(1, Math.floor(radius * 0.5)), spread: 0.7 },
      { type: BiomeType.RUINS, count: Math.max(1, Math.floor(radius * 0.4)), spread: 0.6 },
      { type: BiomeType.TUNDRA, count: Math.max(1, Math.floor(radius * 0.4)), spread: 0.6 },
      { type: BiomeType.VOLCANO, count: 1, spread: 0.5 },
  ];

  seeds.forEach(seedConfig => {
      for(let i=0; i<seedConfig.count; i++) {
          const candidates = tiles.filter(t => t.biome === BiomeType.MEADOW);
          if (candidates.length === 0) break;
          
          const seedTile = candidates[randomInt(0, candidates.length - 1)];
          seedTile.biome = seedConfig.type;

          let frontier = [seedTile];
          let size = 0;
          const maxSize = randomInt(3, 8);

          while(frontier.length > 0 && size < maxSize) {
              const current = frontier.shift();
              if(!current) break;
              
              const neighbors = getNeighbors(current, tiles);
              neighbors.forEach(nPos => {
                  const nTile = tiles.find(t => t.q === nPos.q && t.r === nPos.r);
                  if (nTile && nTile.biome === BiomeType.MEADOW) {
                      if (Math.random() < seedConfig.spread) {
                          nTile.biome = seedConfig.type;
                          frontier.push(nTile);
                          size++;
                      }
                  }
              });
          }
      }
  });

  return tiles;
};

export const generateTributes = (count: number, useAges: boolean): Tribute[] => {
  const tributes: Tribute[] = [];
  let idCounter = 1;
  
  for (let i = 0; i < count; i++) {
    // Distribute evenly among districts (Pair of M/F usually)
    const district = DISTRICTS[Math.floor(i / 2) % 12];
    const gender = i % 2 === 0 ? GENDERS[0] : GENDERS[1];
    const age = useAges ? randomInt(12, 18) : 16;
    
    const t: Tribute = {
      id: `tribute-${idCounter}`,
      name: `${district}-${gender}`, 
      district,
      gender,
      age,
      stats: generateStats(age, district),
      health: STARTING_HEALTH,
      hunger: STARTING_HUNGER,
      thirst: STARTING_THIRST,
      stamina: 100,
      isAlive: true,
      inventory: [],
      kills: 0,
      location: { q: -99, r: -99 },
      statusEffects: [],
      lastAction: "Waiting for launch...",
      hype: 0,
      relationships: {}
    };
    tributes.push(t);
    idCounter++;
  }
  return tributes;
};

// --- Logic Processors ---

// Changed to push (Chronological order)
const addLog = (logs: GameLog[], message: string, type: GameLog['type'] = 'info', day: number, phase: string) => {
  logs.push({
    id: Math.random().toString(36).substr(2, 9),
    day,
    phase,
    message,
    type
  });
};

const addDeathSummary = (logs: GameLog[], tribute: Tribute, day: number, phase: string) => {
    addLog(logs, `D${tribute.district} ${tribute.name} ELIMINATED // Kills: ${tribute.kills} // Hype: ${tribute.hype} // Cause: ${tribute.causeOfDeath}`, 'death-summary', day, phase);
};

export const initializeGame = (settings: GameSettings): GameState => {
  const tributes = generateTributes(settings.tributeCount, settings.useAges);
  const tiles = generateMap(settings.mapSize);
  
  // Initial Relationships
  tributes.forEach(t1 => {
      tributes.forEach(t2 => {
          if (t1.id === t2.id) return;
          
          let initialTrust = 0;
          if (t1.district === t2.district) initialTrust = 65;
          else if (settings.useCareerAlliance && CAREER_DISTRICTS.includes(t1.district) && CAREER_DISTRICTS.includes(t2.district)) initialTrust = 25;

          if (initialTrust !== 0) modifyTrust(t1, t2.id, initialTrust);
      });
  });
  
  const startRing = settings.mapSize - 1;
  const validStarts = tiles.filter(t => getHexDistance({q:0, r:0}, t) === startRing);
  
  tributes.forEach((t, i) => {
    const tile = validStarts.length > 0 ? validStarts[i % validStarts.length] : tiles[0];
    t.location = { q: tile.q, r: tile.r };
    t.lastPos = { q: tile.q, r: tile.r };
  });

  return {
    day: 1,
    phase: GamePhase.SETUP,
    tributes,
    map: tiles,
    logs: [],
    deceasedQueue: [],
    winner: null,
    settings,
    activeHazard: null,
    weather: WeatherType.CLEAR
  };
};

const moveTributeSmart = (
    tribute: Tribute, 
    map: HexTile[], 
    allTributes: Tribute[],
    target: {q: number, r: number} | null, 
    avoidHazardBiome: BiomeType | null, 
    isFinale: boolean,
    weather: WeatherType
) => {
  const neighbors = getNeighbors(tribute.location, map);
  if (neighbors.length === 0) return;

  const shuffledNeighbors = neighbors.sort(() => Math.random() - 0.5);
  let bestMove = shuffledNeighbors[0];
  let bestScore = -99999;

  // --- Desires ---
  const wantsWater = tribute.thirst < 50 || tribute.statusEffects.includes(STATUS_HEATSTROKE);
  const wantsFood = tribute.hunger < 40;
  const wantsWeapon = !tribute.inventory.some(i => i.type === 'weapon');
  const wantsHiding = tribute.health < 40 || tribute.statusEffects.includes(STATUS_BLEEDING);
  
  // Logic for movement
  shuffledNeighbors.forEach(n => {
    let score = randomInt(-10, 10); 
    const tile = map.find(m => m.q === n.q && m.r === n.r);
    if (!tile) return;

    // Anti-oscillation
    if (!isFinale && tribute.lastPos && tribute.lastPos.q === n.q && tribute.lastPos.r === n.r) {
        score -= 500; 
    }

    // Crowding
    const occupants = allTributes.filter(t => t.isAlive && t.id !== tribute.id && t.location.q === n.q && t.location.r === n.r);
    const enemyCount = occupants.filter(o => (tribute.relationships[o.id]?.type === RelationshipType.ENEMY)).length;
    const allyCount = occupants.filter(o => (tribute.relationships[o.id]?.type === RelationshipType.ALLY || tribute.relationships[o.id]?.type === RelationshipType.CLOSE_ALLY)).length;
    
    if (tribute.stats.aggression < 6 && !isFinale) {
        score -= (occupants.length * 20);
        score += (allyCount * 30);
    } else if (tribute.stats.aggression >= 6 && !isFinale) {
        if (occupants.length === 1) score += 20;
        else if (occupants.length > 2) score -= 10;
    }
    if (enemyCount > 0 && tribute.health < 50) score -= 100; // Flee from enemies if hurt

    // Trap Awareness (Intellect)
    if (tile.trap) {
        // High INT detects traps
        if (tribute.stats.intellect > 7 || tile.trap.ownerId === tribute.id) {
            score -= 200; 
        }
    }

    // Target Logic
    if (target) {
       const dist = getHexDistance(n, target);
       score -= dist * (isFinale ? 50 : 15); 
    } else if (isFinale) {
       const dist = getHexDistance(n, {q:0, r:0});
       score -= dist * 100;
    }

    // Desires
    if (!isFinale) {
        if (wantsWater && (tile.biome === BiomeType.RIVER || tile.biome === BiomeType.SWAMP)) score += 100;
        if (wantsFood && (tile.biome === BiomeType.FOREST || tile.biome === BiomeType.MEADOW)) score += 60;
        if (wantsWeapon && (tile.biome === BiomeType.CORNUCOPIA || tile.biome === BiomeType.RUINS)) score += 120;
        if (wantsHiding && (tile.biome === BiomeType.FOREST || tile.biome === BiomeType.MOUNTAIN)) score += 80;

        if (avoidHazardBiome && tile.biome === avoidHazardBiome) score -= 500;

        // Terrain Costs
        if (tile.biome === BiomeType.MOUNTAIN) score -= 15; 
        else if (tile.biome === BiomeType.VOLCANO) score -= 20;
        else if (tile.biome === BiomeType.SWAMP) score -= 10;

        // Weather Preference
        if (weather === WeatherType.HEATWAVE) {
            if (tile.biome === BiomeType.RIVER) score += 40; 
            if (tile.biome === BiomeType.DESERT) score -= 50;
        }
    }

    if (score > bestScore) {
        bestScore = score;
        bestMove = n;
    }
  });

  // Commit Move
  tribute.lastPos = { ...tribute.location };
  tribute.location = bestMove;
  
  const newTile = map.find(t => t.q === bestMove.q && t.r === bestMove.r);
  let stamCost = 5;
  if (newTile?.biome === BiomeType.MOUNTAIN) stamCost += 5;
  if (newTile?.biome === BiomeType.SWAMP) stamCost += 3;
  
  const weatherInfo = WEATHER_CONFIG[weather];
  tribute.stamina = Math.max(0, tribute.stamina - (stamCost * weatherInfo.staminaCost));
};


const processCombat = (
    t1: Tribute, 
    t2: Tribute, 
    logs: GameLog[], 
    day: number, 
    phase: string, 
    lethality: number, 
    weather: WeatherType,
    allTributes: Tribute[],
    deceasedQueue: Tribute[]
) => {
    if (!t1.isAlive || !t2.isAlive) return;

    // Flee Check
    const canFlee1 = t1.stats.speed > t2.stats.speed && t1.health < 30;
    if (canFlee1 && Math.random() < 0.5) {
        addLog(logs, `${t1.name} fled from ${t2.name}!`, 'flee', day, phase);
        return;
    }
    
    const w1 = t1.inventory.find(i => i.type === 'weapon')?.bonus || 0;
    const w2 = t2.inventory.find(i => i.type === 'weapon')?.bonus || 0;

    const s1 = (t1.stats.strength * 2) + t1.stats.speed + w1 + (t1.stats.aggression / 2) + randomInt(0, 20);
    const s2 = (t2.stats.strength * 2) + t2.stats.speed + w2 + (t2.stats.aggression / 2) + randomInt(0, 20);

    let dmg1 = Math.max(5, (s2 - s1) * 0.5); 
    let dmg2 = Math.max(5, (s1 - s2) * 0.5);

    dmg1 *= lethality;
    dmg2 *= lethality;

    if (t1.inventory.some(i => i.id === 'armor')) dmg1 *= 0.7;
    if (t2.inventory.some(i => i.id === 'armor')) dmg2 *= 0.7;

    t1.health -= dmg1;
    t2.health -= dmg2;

    let verb = "fought";
    if (s1 > s2 + 20) verb = "dominated";
    if (s2 > s1 + 20) verb = "was crushed by";
    if (Math.abs(s1 - s2) < 10) verb = "clashed evenly with";

    const weaponName = t1.inventory.find(i => i.type === 'weapon')?.name || "fists";
    addLog(logs, `${t1.name} ${verb} ${t2.name} using ${weaponName}.`, 'combat', day, phase);

    modifyTrust(t1, t2.id, -50);
    modifyTrust(t2, t1.id, -50);
    t1.lastAttackerId = t2.id;
    t2.lastAttackerId = t1.id;

    // Double Death Prevention (if HP very low, one might survive if faster)
    if (t1.health <= 0 && t2.health <= 0) {
        // Faster tribute strikes fatal blow first?
        if (t1.stats.speed > t2.stats.speed + 2) {
             t1.health = 1; // Clings to life
             t2.health = 0;
        } else if (t2.stats.speed > t1.stats.speed + 2) {
             t2.health = 1;
             t1.health = 0;
        }
    }

    if (t1.health <= 0 && t2.health > 0) {
        t1.isAlive = false;
        t1.causeOfDeath = `Slain by ${t2.name}`;
        t2.kills++;
        t2.hype += 5;
        addLog(logs, `${t1.name} was killed by ${t2.name}.`, 'death', day, phase);
        addDeathSummary(logs, t1, day, phase);
        deceasedQueue.push(t1);
        propagateHostility(t2.id, t1, allTributes);
    } else if (t2.health <= 0 && t1.health > 0) {
        t2.isAlive = false;
        t2.causeOfDeath = `Slain by ${t1.name}`;
        t1.kills++;
        t1.hype += 5;
        addLog(logs, `${t2.name} was killed by ${t1.name}.`, 'death', day, phase);
        addDeathSummary(logs, t2, day, phase);
        deceasedQueue.push(t2);
        propagateHostility(t1.id, t2, allTributes);
    } else if (t1.health <= 0 && t2.health <= 0) {
        t1.isAlive = false;
        t2.isAlive = false;
        t1.causeOfDeath = `Died fighting ${t2.name}`;
        t2.causeOfDeath = `Died fighting ${t1.name}`;
        addLog(logs, `${t1.name} and ${t2.name} killed each other in a brutal duel.`, 'death', day, phase);
        addDeathSummary(logs, t1, day, phase);
        addDeathSummary(logs, t2, day, phase);
        deceasedQueue.push(t1);
        deceasedQueue.push(t2);
    }
};

const evaluateInteraction = (
    t1: Tribute, 
    t2: Tribute, 
    logs: GameLog[], 
    day: number, 
    phase: string, 
    weather: WeatherType,
    allTributes: Tribute[]
): 'fight' | 'bond' | 'alliance' | 'ignore' => {
    const rel = t1.relationships[t2.id] || { type: RelationshipType.NEUTRAL, trust: 0 };
    const survivors = allTributes.filter(t => t.isAlive).length;
    
    // Betrayal
    if ((rel.type === RelationshipType.ALLY || rel.type === RelationshipType.CLOSE_ALLY) && survivors <= 4) {
         const betrayalChance = (t1.stats.intellect * 3) + (t1.stats.aggression * 2) - rel.trust;
         if (Math.random() * 100 < betrayalChance) {
            const method = BETRAYAL_EVENTS[randomInt(0, BETRAYAL_EVENTS.length - 1)];
            addLog(logs, `${t1.name} ${method} ${t2.name}!`, 'combat', day, phase);
            modifyTrust(t1, t2.id, -100);
            modifyTrust(t2, t1.id, -100);
            return 'fight';
         }
    }

    // Alliance Formation (Neutral -> Ally)
    if (rel.type === RelationshipType.NEUTRAL && t1.stats.aggression < 7 && t2.stats.aggression < 7) {
        if (Math.random() < 0.15) return 'alliance';
    }

    if (rel.type === RelationshipType.ENEMY) return 'fight';

    if (t1.stats.aggression > 7 && survivors > 2) return 'fight';
    
    if (Math.random() < 0.2) return 'bond';

    return 'ignore';
};


const processWeatherEffects = (tribute: Tribute, weather: WeatherType, currentTile: HexTile, logs: GameLog[], day: number, phase: string) => {
    if (weather === WeatherType.SNOW || (weather === WeatherType.RAIN && phase === GamePhase.NIGHT)) {
        const hasWarmth = tribute.inventory.some(i => i.id === 'fire_kit') || tribute.inventory.some(i => i.id === 'flamethrower');
        const hasShelter = currentTile.biome === BiomeType.FOREST || currentTile.biome === BiomeType.RUINS || currentTile.biome === BiomeType.CORNUCOPIA;
        
        if (!hasWarmth && !hasShelter) {
             if (Math.random() < 0.3 && !tribute.statusEffects.includes(STATUS_HYPOTHERMIA)) {
                 tribute.statusEffects.push(STATUS_HYPOTHERMIA);
                 addLog(logs, `${tribute.name} is developing Hypothermia from the cold.`, 'status', day, phase);
             }
        } else if (tribute.statusEffects.includes(STATUS_HYPOTHERMIA)) {
            tribute.statusEffects = tribute.statusEffects.filter(e => e !== STATUS_HYPOTHERMIA);
            addLog(logs, `${tribute.name} warmed up and cured their Hypothermia.`, 'status', day, phase);
        }
    } else {
        if (tribute.statusEffects.includes(STATUS_HYPOTHERMIA)) {
             tribute.statusEffects = tribute.statusEffects.filter(e => e !== STATUS_HYPOTHERMIA);
        }
    }

    if (weather === WeatherType.HEATWAVE) {
        const hasWater = tribute.inventory.some(i => i.id === 'water');
        const nearWater = currentTile.biome === BiomeType.RIVER || currentTile.biome === BiomeType.SWAMP;
        
        if (!hasWater && !nearWater) {
             if (Math.random() < 0.2 && !tribute.statusEffects.includes(STATUS_HEATSTROKE)) {
                 tribute.statusEffects.push(STATUS_HEATSTROKE);
                 addLog(logs, `${tribute.name} collapsed from Heatstroke.`, 'status', day, phase);
             }
        }
        if ((hasWater || nearWater) && tribute.statusEffects.includes(STATUS_HEATSTROKE)) {
            tribute.statusEffects = tribute.statusEffects.filter(e => e !== STATUS_HEATSTROKE);
            if (hasWater) {
                const idx = tribute.inventory.findIndex(i => i.id === 'water');
                if (idx > -1) tribute.inventory.splice(idx, 1); 
                addLog(logs, `${tribute.name} drank water to cure Heatstroke.`, 'status', day, phase);
            }
        }
    } else {
        if (tribute.statusEffects.includes(STATUS_HEATSTROKE)) {
             tribute.statusEffects = tribute.statusEffects.filter(e => e !== STATUS_HEATSTROKE);
        }
    }
};

const processTributeTick = (
    tribute: Tribute, 
    gameState: GameState, 
    logs: GameLog[],
    deceasedQueue: Tribute[]
) => {
    if (!tribute.isAlive) return;

    const weatherInfo = WEATHER_CONFIG[gameState.weather];
    const tile = gameState.map.find(t => t.q === tribute.location.q && t.r === tribute.location.r);
    
    if (!tile) return;

    let hungerDecay = 3 * weatherInfo.hungerMod;
    let thirstDecay = 4 * weatherInfo.thirstMod;

    if (gameState.phase === GamePhase.NIGHT) {
        hungerDecay *= 0.5; 
        thirstDecay *= 0.5;
        tribute.stamina = Math.min(100, tribute.stamina + 20); 
    }

    // Status Effects
    if (tribute.statusEffects.includes(STATUS_BLEEDING)) {
        tribute.health -= 5;
        if (Math.random() < 0.2) addLog(logs, `${tribute.name} is bleeding out.`, 'status', gameState.day, gameState.phase);
    }
    if (tribute.statusEffects.includes(STATUS_POISONED)) {
        tribute.stamina = Math.max(0, tribute.stamina - 10);
        tribute.health -= 2;
    }
    if (tribute.statusEffects.includes(STATUS_HYPOTHERMIA)) {
        tribute.health -= 4;
        tribute.stamina = Math.max(0, tribute.stamina - 10);
    }
    if (tribute.statusEffects.includes(STATUS_HEATSTROKE)) {
        thirstDecay *= 2;
        tribute.health -= 2;
    }

    tribute.hunger = Math.max(0, tribute.hunger - hungerDecay);
    tribute.thirst = Math.max(0, tribute.thirst - thirstDecay);

    if (tribute.hunger <= 0) tribute.health -= 5;
    if (tribute.thirst <= 0) tribute.health -= 8;

    if (gameState.activeHazard) {
        if (gameState.activeHazard.biomes.includes(tile.biome)) {
             tribute.health -= gameState.activeHazard.damage;
             addLog(logs, `${tribute.name} was hurt by the ${gameState.activeHazard.type}.`, 'hazard', gameState.day, gameState.phase);
        }
    }

    processWeatherEffects(tribute, gameState.weather, tile, logs, gameState.day, gameState.phase);

    // Crafting
    if (tribute.isAlive) {
        for (const recipe of CRAFTING_RECIPES) {
             // Check if we have ingredients
             const hasIngredients = recipe.ingredients.every(ing => tribute.inventory.some(i => i.id === ing));
             if (hasIngredients) {
                 // Remove ingredients
                 recipe.ingredients.forEach(ing => {
                     const idx = tribute.inventory.findIndex(i => i.id === ing);
                     if (idx > -1) tribute.inventory.splice(idx, 1);
                 });
                 // CLONE ITEM TO PREVENT REF BUGS
                 tribute.inventory.push({...recipe.result});
                 addLog(logs, `${tribute.name} crafted a ${recipe.result.name}.`, 'crafting', gameState.day, gameState.phase);
                 break; // One craft per tick
             }
        }
    }
    
    // Trap Setting
    if (tribute.isAlive && !tile.trap && tribute.inventory.some(i => i.id === 'explosive')) {
        const mine = tribute.inventory.find(i => i.id === 'explosive');
        if (mine) {
            tile.trap = {
                ownerId: tribute.id,
                damage: 60,
                description: "stepped on a Landmine",
                isHidden: true
            };
            // Use filter carefully, or just splice index
            const idx = tribute.inventory.indexOf(mine);
            if (idx > -1) tribute.inventory.splice(idx, 1);

            addLog(logs, `${tribute.name} set a trap in the ${tile.biome}.`, 'trap', gameState.day, gameState.phase);
        }
    }

    // Auto-Healing
    if (tribute.health < 60) {
        const med = tribute.inventory.find(i => i.id === 'medkit' || i.id === 'bandage' || i.id === 'salve');
        if (med) {
            tribute.health = Math.min(100, tribute.health + (med.bonus || 20));
             const idx = tribute.inventory.indexOf(med);
            if (idx > -1) tribute.inventory.splice(idx, 1);
            addLog(logs, `${tribute.name} used ${med.name} to heal.`, 'info', gameState.day, gameState.phase);
            if (med.id === 'bandage') tribute.statusEffects = tribute.statusEffects.filter(e => e !== STATUS_BLEEDING);
        }
    }

    // Auto-Eat/Drink
    if (tribute.hunger < 50) {
        const food = tribute.inventory.find(i => i.type === 'consumable' && i.bonus && i.bonus > 0 && i.id !== 'water' && i.id !== 'poison_vial');
        if (food) {
            tribute.hunger = Math.min(100, tribute.hunger + (food.bonus || 10));
            const idx = tribute.inventory.indexOf(food);
            if (idx > -1) tribute.inventory.splice(idx, 1);
            addLog(logs, `${tribute.name} ate ${food.name}.`, 'info', gameState.day, gameState.phase);
        }
    }
    if (tribute.thirst < 50) {
        const drink = tribute.inventory.find(i => i.id === 'water');
        if (tile.biome === BiomeType.RIVER) {
             tribute.thirst = 100;
             addLog(logs, `${tribute.name} drank from the river.`, 'info', gameState.day, gameState.phase);
        } else if (drink) {
            tribute.thirst = Math.min(100, tribute.thirst + 50);
            const idx = tribute.inventory.indexOf(drink);
            if (idx > -1) tribute.inventory.splice(idx, 1);
            addLog(logs, `${tribute.name} drank their water.`, 'info', gameState.day, gameState.phase);
        }
    }

    // Death Check
    if (tribute.health <= 0) {
        tribute.isAlive = false;
        if (!tribute.causeOfDeath) tribute.causeOfDeath = "Succumbed to the elements";
        addLog(logs, `${tribute.name} died of ${tribute.causeOfDeath}.`, 'death', gameState.day, gameState.phase);
        addDeathSummary(logs, tribute, gameState.day, gameState.phase);
        deceasedQueue.push(tribute);
    }
};

export const advanceGamePhase = (state: GameState): GameState => {
  // Deep clone state to prevent mutation issues
  const newState = { ...state }; 
  newState.logs = [...state.logs];
  newState.deceasedQueue = [...state.deceasedQueue];
  // Critical: Deep clone tributes to break references to previous state
  newState.tributes = state.tributes.map(t => JSON.parse(JSON.stringify(t)));
  // Clone Map to prevent mutation of history (especially for traps)
  newState.map = state.map.map(tile => ({ ...tile, trap: tile.trap ? { ...tile.trap } : undefined }));
  
  let nextPhase = state.phase;
  let nextDay = state.day;

  if (state.phase === GamePhase.SETUP) {
      nextPhase = GamePhase.BLOODBATH;
      addLog(newState.logs, "THE GAMES HAVE BEGUN!", 'gamemaker', 1, "BLOODBATH");
      addLog(newState.logs, "Weather is " + newState.weather, 'weather', 1, "BLOODBATH");
  } else if (state.phase === GamePhase.BLOODBATH) {
      nextPhase = GamePhase.DAY;
      newState.activeHazard = null;
  } else if (state.phase === GamePhase.DAY) {
      nextPhase = GamePhase.NIGHT;
      newState.weather = determineNextWeather(newState.weather);
      addLog(newState.logs, `Weather changed to ${newState.weather}`, 'weather', nextDay, "NIGHT");
  } else if (state.phase === GamePhase.NIGHT) {
      nextPhase = GamePhase.DAY;
      nextDay += 1;
      if (Math.random() < 0.3) {
          const hazardTypes = Object.values(HazardType).filter(h => h !== HazardType.NONE);
          const type = hazardTypes[randomInt(0, hazardTypes.length - 1)];
          newState.activeHazard = { 
              type, 
              description: HAZARDS_DATA[type].description || "", 
              biomes: HAZARDS_DATA[type].biomes || [],
              damage: HAZARDS_DATA[type].damage || 0
          } as ActiveHazard;
          addLog(newState.logs, `GAMEMAKER EVENT: ${type}`, 'gamemaker', nextDay, "DAY");
          addLog(newState.logs, newState.activeHazard.description, 'hazard', nextDay, "DAY");
      } else {
          newState.activeHazard = null;
      }
      newState.weather = determineNextWeather(newState.weather);
      addLog(newState.logs, `Weather changed to ${newState.weather}`, 'weather', nextDay, "DAY");
  }

  newState.phase = nextPhase;
  newState.day = nextDay;

  const livingTributes = newState.tributes.filter(t => t.isAlive);
  
  // 1. Tick Processing
  livingTributes.forEach(t => processTributeTick(t, newState, newState.logs, newState.deceasedQueue));

  // 2. Movement Phase
  newState.tributes.filter(t => t.isAlive).forEach(t => {
      if (t.stamina > 10) {
          const isFinale = newState.day >= newState.settings.finaleDay;
          moveTributeSmart(
              t, 
              newState.map, 
              newState.tributes, 
              isFinale ? {q:0, r:0} : null, 
              newState.activeHazard ? newState.activeHazard.biomes[0] : null,
              isFinale,
              newState.weather
          );
          
          // Trigger Traps on entry
          const tile = newState.map.find(x => x.q === t.location.q && x.r === t.location.r);
          if (tile && tile.trap && tile.trap.ownerId !== t.id) {
              t.health -= tile.trap.damage;
              t.statusEffects.push(STATUS_BLEEDING);
              addLog(newState.logs, `${t.name} ${tile.trap.description}!`, 'trap', nextDay, nextPhase);
              tile.trap = undefined; // Trap consumed
              
              if (t.health <= 0) {
                  t.isAlive = false;
                  t.causeOfDeath = "Caught in a trap";
                  addLog(newState.logs, `${t.name} died from a trap.`, 'death', nextDay, nextPhase);
                  addDeathSummary(newState.logs, t, nextDay, nextPhase);
                  newState.deceasedQueue.push(t);
              }
          } else {
             t.lastAction = `Moved to (${t.location.q}, ${t.location.r})`;
          }
      } else {
          t.lastAction = "Resting to recover stamina";
          t.stamina = Math.min(100, t.stamina + 30);
          addLog(newState.logs, `${t.name} is resting.`, 'rest', nextDay, nextPhase);
      }
  });

  // 3. Interaction Phase
  const locations: Record<string, Tribute[]> = {};
  newState.tributes.filter(t => t.isAlive).forEach(t => {
      const key = `${t.location.q},${t.location.r}`;
      if (!locations[key]) locations[key] = [];
      locations[key].push(t);
  });

  Object.values(locations).forEach(group => {
      if (group.length > 1) {
          const shuffled = group.sort(() => Math.random() - 0.5);
          
          // Improved iteration to ensure everyone gets a chance if odd number
          for (let i = 0; i < shuffled.length; i += 2) {
              const t1 = shuffled[i];
              const t2 = shuffled[i+1];
              
              if (!t1) break;
              if (!t2) {
                 // Odd one out - maybe just idle or observe
                 t1.lastAction = "Watching from the shadows";
                 continue;
              }
              
              if (!t1.isAlive || !t2.isAlive) continue;

              const interaction = evaluateInteraction(t1, t2, newState.logs, nextDay, nextPhase, newState.weather, newState.tributes);
              
              if (interaction === 'fight') {
                  processCombat(t1, t2, newState.logs, nextDay, nextPhase, getLethalityMultiplier(newState.settings.lethality), newState.weather, newState.tributes, newState.deceasedQueue);
              } else if (interaction === 'bond') {
                  const event = BONDING_EVENTS[randomInt(0, BONDING_EVENTS.length - 1)];
                  addLog(newState.logs, `${t1.name} ${event} ${t2.name}.`, 'info', nextDay, nextPhase);
                  modifyTrust(t1, t2.id, 10);
                  modifyTrust(t2, t1.id, 10);
                  t1.lastAction = "Bonding";
                  t2.lastAction = "Bonding";
              } else if (interaction === 'alliance') {
                  addLog(newState.logs, `${t1.name} and ${t2.name} formed an alliance!`, 'alliance', nextDay, nextPhase);
                  modifyTrust(t1, t2.id, 40);
                  modifyTrust(t2, t1.id, 40);
              }
          }
      } else if (group.length === 1) {
          const t = group[0];
          // Only idle if didn't rest
          if (t.isAlive && !t.lastAction.includes("Resting") && Math.random() < 0.15) {
              const weatherEvents = WEATHER_IDLE_EVENTS[newState.weather];
              const useWeatherEvent = Math.random() < 0.6;
              
              let event = "";
              if (useWeatherEvent && weatherEvents) {
                  event = weatherEvents[randomInt(0, weatherEvents.length - 1)];
                  addLog(newState.logs, `${t.name} ${event}`, 'weather', nextDay, nextPhase);
              } else {
                  event = IDLE_EVENTS[randomInt(0, IDLE_EVENTS.length - 1)];
                  addLog(newState.logs, `${t.name} ${event}`, 'info', nextDay, nextPhase);
              }
              t.lastAction = "Idle";
          } else if (t.isAlive && t.lastAction.includes("Moved")) {
              const tile = newState.map.find(m => m.q === t.location.q && m.r === t.location.r);
              if (tile && (tile.biome === BiomeType.FOREST || tile.biome === BiomeType.CORNUCOPIA || tile.biome === BiomeType.RUINS)) {
                  if (Math.random() < 0.2) {
                      const itemPool = tile.biome === BiomeType.CORNUCOPIA ? WEAPONS : CONSUMABLES;
                      const item = itemPool[randomInt(0, itemPool.length - 1)];
                      // Clone item
                      t.inventory.push({...item});
                      addLog(newState.logs, `${t.name} found a ${item.name} in the ${tile.biome}.`, 'crafting', nextDay, nextPhase);
                  }
              }
          }
      }
  });

  // Check Game Over
  const survivors = newState.tributes.filter(t => t.isAlive);
  if (survivors.length <= 1) {
      newState.phase = GamePhase.GAME_OVER;
      newState.winner = survivors.length === 1 ? survivors[0] : null;
      addLog(newState.logs, "--- GAME OVER ---", 'gamemaker', nextDay, nextPhase);
  }

  return newState;
};

export const manualInteraction = (action: 'alliance' | 'betray' | 'gift', actorId: string, targetId: string, state: GameState): GameState => {
    const newState = { ...state };
    newState.logs = [...state.logs]; 
    newState.deceasedQueue = [...state.deceasedQueue];
    newState.tributes = state.tributes.map(t => JSON.parse(JSON.stringify(t)));

    const actor = newState.tributes.find(t => t.id === actorId);
    const target = newState.tributes.find(t => t.id === targetId);
    
    if (!actor || !target || !actor.isAlive || !target.isAlive) return state;

    if (action === 'alliance') {
        modifyTrust(actor, target.id, 30);
        modifyTrust(target, actor.id, 10); 
        addLog(newState.logs, `GAMEMAKER: Forced ${actor.name} to attempt alliance with ${target.name}.`, 'gamemaker', state.day, state.phase);
    }
    if (action === 'betray') {
        modifyTrust(actor, target.id, -100);
        addLog(newState.logs, `GAMEMAKER: Forced ${actor.name} to attack ${target.name}!`, 'gamemaker', state.day, state.phase);
        processCombat(actor, target, newState.logs, state.day, state.phase, 1.0, newState.weather, newState.tributes, newState.deceasedQueue);
    }
    if (action === 'gift') {
        if (actor.inventory.length > 0) {
            const item = actor.inventory[0];
            actor.inventory.shift();
            target.inventory.push(item);
            modifyTrust(target, actor.id, 40);
            addLog(newState.logs, `${actor.name} was forced to give ${item.name} to ${target.name}.`, 'info', state.day, state.phase);
        }
    }
    
    return newState;
}