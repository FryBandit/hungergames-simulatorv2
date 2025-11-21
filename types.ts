

export enum District {
  D1 = "D1", D2 = "D2", D3 = "D3", D4 = "D4", D5 = "D5", 
  D6 = "D6", D7 = "D7", D8 = "D8", D9 = "D9", D10 = "D10", 
  D11 = "D11", D12 = "D12"
}

export enum Gender {
  M = "M",
  F = "F"
}

export enum BiomeType {
  CORNUCOPIA = "Cornucopia",
  FOREST = "Forest",
  RIVER = "River",
  MOUNTAIN = "Mountain",
  MEADOW = "Meadow",
  DESERT = "Desert",
  SWAMP = "Swamp",
  RUINS = "Ruins",
  TUNDRA = "Tundra",
  VOLCANO = "Volcano"
}

export enum WeatherType {
  CLEAR = "Clear",
  RAIN = "Rain",
  STORM = "Thunderstorm",
  SNOW = "Snowstorm",
  FOG = "Dense Fog",
  HEATWAVE = "Heatwave"
}

export interface Stats {
  strength: number;
  speed: number;
  constitution: number;
  intellect: number;
  aggression: number;
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'consumable' | 'gear' | 'material';
  bonus?: number;
  description: string;
}

export enum RelationshipType {
  ENEMY = "Enemy",
  NEUTRAL = "Neutral",
  ALLY = "Ally",
  CLOSE_ALLY = "Close Ally",
  LOVE = "Soulmate" // Max Ally
}

export interface Relationship {
  type: RelationshipType;
  trust: number; // -100 to 100
}

export interface Tribute {
  id: string;
  name: string;
  district: District;
  gender: Gender;
  age: number; // 12-18
  stats: Stats;
  health: number; // 0-100
  hunger: number; // 0-100 (100 is full)
  thirst: number; // 0-100 (100 is full)
  stamina: number; // 0-100
  isAlive: boolean;
  inventory: Item[];
  kills: number;
  location: { q: number, r: number }; // Hex Axial Coordinates
  lastPos?: { q: number, r: number }; // Previous location to prevent jitter
  statusEffects: string[]; // "Bleeding", "Poisoned", etc.
  lastAction: string;
  causeOfDeath?: string;
  hype: number;
  relationships: Record<string, Relationship>; // Key is other tribute ID
  lastAttackerId?: string; // ID of the last person who attacked this tribute
}

export interface Trap {
  ownerId: string;
  damage: number;
  description: string;
  isHidden: boolean;
}

export interface HexTile {
  q: number;
  r: number;
  biome: BiomeType;
  trap?: Trap;
}

export enum GamePhase {
  SETUP = "SETUP",
  BLOODBATH = "BLOODBATH",
  DAY = "DAY",
  NIGHT = "NIGHT",
  GAME_OVER = "GAME_OVER"
}

export interface GameLog {
  id: string;
  day: number;
  phase: string;
  message: string;
  type: 'combat' | 'death' | 'death-summary' | 'info' | 'gamemaker' | 'hazard' | 'sponsor' | 'crafting' | 'weather' | 'status' | 'trap' | 'alliance' | 'flee' | 'rest';
}

export interface GameSettings {
  lethality: 'low' | 'medium' | 'high';
  resourceScarcity: 'abundant' | 'normal' | 'starvation';
  mapSize: number; // Radius
  tributeCount: number; // 24 usually
  gameSpeed: number;
  finaleDay: number;
  bloodbathDeaths: number;
  useCareerAlliance: boolean;
  useAges: boolean;
  autoContinueOnDeath: boolean;
}

export enum HazardType {
  NONE = "NONE",
  ACID_FOG = "ACID FOG",
  WILDFIRE = "WILDFIRE",
  FLASH_FLOOD = "FLASH FLOOD",
  WOLF_MUTTS = "WOLF MUTTS",
  TRACKER_JACKERS = "TRACKER JACKERS"
}

export interface ActiveHazard {
  type: HazardType;
  description: string;
  biomes: BiomeType[];
  damage: number;
}

export interface GameState {
  day: number;
  phase: GamePhase;
  tributes: Tribute[];
  map: HexTile[];
  logs: GameLog[];
  deceasedQueue: Tribute[]; 
  winner: Tribute | null;
  settings: GameSettings;
  activeHazard: ActiveHazard | null;
  weather: WeatherType;
}