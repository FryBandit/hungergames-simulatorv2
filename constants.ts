
import { BiomeType, District, Gender, Item, HazardType, ActiveHazard, RelationshipType, WeatherType, GameSettings } from "./types";

export const DISTRICTS = Object.values(District);
export const GENDERS = Object.values(Gender);
export const CAREER_DISTRICTS = [District.D1, District.D2, District.D4];

export const STARTING_HEALTH = 100;
export const STARTING_HUNGER = 100;
export const STARTING_THIRST = 100;

export const STATUS_BLEEDING = "Bleeding";
export const STATUS_POISONED = "Poisoned";
export const STATUS_HYPOTHERMIA = "Hypothermia";
export const STATUS_HEATSTROKE = "Heatstroke";

export const STATUS_CONFIG: Record<string, { icon: string, color: string, description: string }> = {
  [STATUS_BLEEDING]: { icon: "🩸", color: "text-red-500 border-red-500/50 bg-red-950/50", description: "Losing HP over time. Needs bandages." },
  [STATUS_POISONED]: { icon: "🤢", color: "text-green-500 border-green-500/50 bg-green-950/50", description: "Reduced stats. Needs antidote." },
  [STATUS_HYPOTHERMIA]: { icon: "🥶", color: "text-cyan-300 border-cyan-500/50 bg-cyan-950/50", description: "Freezing. Taking damage. Needs fire/warmth." },
  [STATUS_HEATSTROKE]: { icon: "🥵", color: "text-orange-500 border-orange-500/50 bg-orange-950/50", description: "Overheating. High thirst decay. Needs water." }
};

export const WEATHER_CONFIG: Record<WeatherType, { description: string, staminaCost: number, thirstMod: number, hungerMod: number, visibility: number }> = {
  [WeatherType.CLEAR]: { description: "Skies are clear. Visibility is perfect.", staminaCost: 1, thirstMod: 1, hungerMod: 1, visibility: 1.0 },
  [WeatherType.RAIN]: { description: "Rain makes the ground slick and cold.", staminaCost: 1.8, thirstMod: 0.8, hungerMod: 1.2, visibility: 0.7 },
  [WeatherType.STORM]: { description: "Heavy thunder and chaos. High stamina drain.", staminaCost: 3.0, thirstMod: 0.6, hungerMod: 1.3, visibility: 0.4 },
  [WeatherType.SNOW]: { description: "Freezing temperatures. Extreme cold risk.", staminaCost: 2.5, thirstMod: 0.9, hungerMod: 2.0, visibility: 0.5 },
  [WeatherType.FOG]: { description: "Dense fog obscures all movement.", staminaCost: 1.2, thirstMod: 1, hungerMod: 1, visibility: 0.1 },
  [WeatherType.HEATWAVE]: { description: "Blistering heat. Water is crucial.", staminaCost: 2.2, thirstMod: 3.0, hungerMod: 0.7, visibility: 0.9 },
};

export const WEATHER_IDLE_EVENTS: Record<WeatherType, string[]> = {
  [WeatherType.CLEAR]: ["basks in the sunlight.", "watches a cloud shaped like a mutt.", "enjoys the gentle breeze."],
  [WeatherType.RAIN]: ["catches raindrops in their mouth.", "shivers uncontrollably.", "struggles to find dry wood.", "slips in the mud."],
  [WeatherType.STORM]: ["winces at a thunderclap.", "seeks shelter from the lightning.", "is soaked to the bone."],
  [WeatherType.SNOW]: ["tries to warm their freezing hands.", "watches their breath mist in the air.", "shakes snow off their gear."],
  [WeatherType.FOG]: ["can barely see their own hands.", "hears strange noises in the mist.", "feels like they are being watched."],
  [WeatherType.HEATWAVE]: ["sweats profusely.", "hallucinates an oasis.", "feels faint from the heat."],
}

export const GAME_PRESETS: Record<string, GameSettings> = {
  "Standard": {
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
  },
  "Battle Royale": {
    lethality: 'high',
    resourceScarcity: 'normal',
    mapSize: 4,
    tributeCount: 24,
    gameSpeed: 800,
    finaleDay: 4,
    bloodbathDeaths: 8,
    useCareerAlliance: false,
    useAges: false,
    autoContinueOnDeath: true
  },
  "Long Survival": {
    lethality: 'low',
    resourceScarcity: 'starvation',
    mapSize: 7,
    tributeCount: 12,
    gameSpeed: 2000,
    finaleDay: 14,
    bloodbathDeaths: 0,
    useCareerAlliance: true,
    useAges: true,
    autoContinueOnDeath: false
  },
  "Chaos Mode": {
    lethality: 'high',
    resourceScarcity: 'abundant',
    mapSize: 6,
    tributeCount: 36,
    gameSpeed: 1000,
    finaleDay: 6,
    bloodbathDeaths: 12,
    useCareerAlliance: false,
    useAges: true,
    autoContinueOnDeath: true
  }
};

export const RELATIONSHIP_THRESHOLDS = {
  [RelationshipType.ENEMY]: -20,
  [RelationshipType.NEUTRAL]: 0,
  [RelationshipType.ALLY]: 20,
  [RelationshipType.CLOSE_ALLY]: 60,
  [RelationshipType.LOVE]: 90
};

export const BIOME_COLORS: Record<BiomeType, string> = {
  [BiomeType.CORNUCOPIA]: "#94a3b8", // Slate 400
  [BiomeType.FOREST]: "#166534", // Green 800
  [BiomeType.RIVER]: "#0369a1", // Sky 700
  [BiomeType.MOUNTAIN]: "#475569", // Slate 600
  [BiomeType.MEADOW]: "#15803d", // Green 700
  [BiomeType.DESERT]: "#d97706", // Amber 600
  [BiomeType.SWAMP]: "#3f6212", // Lime 800
  [BiomeType.RUINS]: "#581c87", // Purple 900
  [BiomeType.TUNDRA]: "#0891b2", // Cyan 600
  [BiomeType.VOLCANO]: "#7f1d1d", // Red 900
};

export const BIOME_ICONS: Record<BiomeType, string> = {
  [BiomeType.CORNUCOPIA]: "⚠",
  [BiomeType.FOREST]: "🌲",
  [BiomeType.RIVER]: "🌊",
  [BiomeType.MOUNTAIN]: "⛰",
  [BiomeType.MEADOW]: "🌿",
  [BiomeType.DESERT]: "☀",
  [BiomeType.SWAMP]: "🐊",
  [BiomeType.RUINS]: "🏛",
  [BiomeType.TUNDRA]: "❄",
  [BiomeType.VOLCANO]: "🌋",
};

export const WEAPONS: Item[] = [
  { id: 'knife', name: 'Combat Knife', type: 'weapon', bonus: 15, description: 'Sharp and deadly.' },
  { id: 'bow', name: 'Recurve Bow', type: 'weapon', bonus: 20, description: 'Good for range.' },
  { id: 'spear', name: 'Steel Spear', type: 'weapon', bonus: 25, description: 'Long reach.' },
  { id: 'axe', name: 'Woodsman Axe', type: 'weapon', bonus: 30, description: 'Heavy hitter.' },
  { id: 'sword', name: 'Short Sword', type: 'weapon', bonus: 25, description: 'Balanced combat.' },
  { id: 'trident', name: 'Trident', type: 'weapon', bonus: 35, description: 'Rare and powerful.' },
  { id: 'rock', name: 'Heavy Rock', type: 'weapon', bonus: 5, description: 'Better than nothing.' },
  { id: 'sickle', name: 'Sickle', type: 'weapon', bonus: 22, description: 'Curved blade.' },
  { id: 'mace', name: 'Spiked Mace', type: 'weapon', bonus: 28, description: 'Crushing power.' },
  { id: 'katana', name: 'Katana', type: 'weapon', bonus: 27, description: 'Swift slicing.' },
  { id: 'flamethrower', name: 'Improvised Flamethrower', type: 'weapon', bonus: 40, description: 'Dangerous but effective.' },
  { id: 'club', name: 'Heavy Club', type: 'weapon', bonus: 12, description: 'Brutal blunt force.' },
];

export const CONSUMABLES: Item[] = [
  { id: 'apple', name: 'Dried Fruit', type: 'consumable', bonus: 15, description: 'Restores hunger.' },
  { id: 'bread', name: 'District 9 Bread', type: 'consumable', bonus: 25, description: 'Hearty meal.' },
  { id: 'water', name: 'Water Jug', type: 'consumable', bonus: 30, description: 'Restores thirst.' },
  { id: 'bandage', name: 'Bandages', type: 'consumable', bonus: 20, description: 'Heals Bleeding.' },
  { id: 'antidote', name: 'Antidote', type: 'consumable', bonus: 0, description: 'Cures Poison.' },
  { id: 'medkit', name: 'Medkit', type: 'consumable', bonus: 50, description: 'Major healing.' },
  { id: 'berries', name: 'Unknown Berries', type: 'consumable', bonus: 5, description: 'Risky snack.' },
  { id: 'squirrel', name: 'Cooked Squirrel', type: 'consumable', bonus: 20, description: 'Good protein.' },
  { id: 'herbs', name: 'Medicinal Herbs', type: 'material', bonus: 0, description: 'Used for crafting.' },
  { id: 'wood', name: 'Sturdy Branch', type: 'material', bonus: 0, description: 'Used for crafting.' },
  { id: 'fish', name: 'Raw Fish', type: 'consumable', bonus: 10, description: 'Better if cooked.' },
];

export const SPONSOR_ITEMS: Item[] = [
  { id: 'soup', name: 'Hot Broth', type: 'consumable', bonus: 40, description: 'Sponsor gift.' },
  { id: 'morphling', name: 'Morphling', type: 'consumable', bonus: 50, description: 'Powerful painkiller.' },
  { id: 'dagger', name: 'Throwing Dagger', type: 'weapon', bonus: 10, description: 'Small but useful.' },
  { id: 'trident_gift', name: 'Gold Trident', type: 'weapon', bonus: 45, description: 'Expensive gift.' },
  { id: 'armor', name: 'Light Armor', type: 'gear', bonus: 0, description: 'Reduces damage taken.' },
  { id: 'night_vision', name: 'Night Vision Goggles', type: 'gear', bonus: 0, description: 'Safe movement at night.' },
  { id: 'camouflage', name: 'Camo Kit', type: 'gear', bonus: 0, description: 'Reduces encounter rate.' },
  { id: 'poison_vial', name: 'Vial of Poison', type: 'consumable', bonus: 0, description: 'Applies poison to weapon.' },
  { id: 'explosive', name: 'Small Mine', type: 'weapon', bonus: 60, description: 'Trap item.' },
  { id: 'feast', name: 'Lamb Stew', type: 'consumable', bonus: 100, description: 'Full hunger restore.' },
  { id: 'fire_kit', name: 'Flint & Steel', type: 'gear', bonus: 0, description: 'Creates warmth.' },
];

// Recipes
export const CRAFTING_RECIPES: { ingredients: string[], result: Item }[] = [
  { 
    ingredients: ['bandage', 'herbs'], 
    result: { id: 'salve', name: 'Healing Salve', type: 'consumable', bonus: 45, description: 'Potent healing mixture.' } 
  },
  {
    ingredients: ['wood', 'knife'],
    result: { id: 'spear_wood', name: 'Sharpened Spear', type: 'weapon', bonus: 18, description: 'Primitive but effective.' }
  },
  {
    ingredients: ['wood', 'rock'],
    result: { id: 'hammer', name: 'Stone Hammer', type: 'weapon', bonus: 12, description: 'Blunt force.' }
  },
  {
    ingredients: ['wood', 'wood'],
    result: { id: 'fire_kit', name: 'Friction Fire', type: 'gear', bonus: 0, description: 'Primitive fire starter.' }
  }
];

export const HAZARDS_DATA: Record<HazardType, Partial<ActiveHazard>> = {
  [HazardType.NONE]: {},
  [HazardType.ACID_FOG]: {
    description: "A corrosive fog rolls in. It burns the skin and lungs.",
    biomes: [BiomeType.FOREST, BiomeType.MEADOW, BiomeType.RIVER, BiomeType.MOUNTAIN, BiomeType.CORNUCOPIA, BiomeType.SWAMP],
    damage: 5
  },
  [HazardType.WILDFIRE]: {
    description: "A wall of fire sweeps through the arena.",
    biomes: [BiomeType.FOREST, BiomeType.MEADOW, BiomeType.DESERT, BiomeType.RUINS, BiomeType.VOLCANO],
    damage: 25
  },
  [HazardType.FLASH_FLOOD]: {
    description: "Torrential rain causes massive flooding.",
    biomes: [BiomeType.RIVER, BiomeType.SWAMP, BiomeType.TUNDRA],
    damage: 30
  },
  [HazardType.TRACKER_JACKERS]: {
    description: "A nest of Tracker Jackers has been disturbed.",
    biomes: [BiomeType.FOREST, BiomeType.RUINS, BiomeType.SWAMP],
    damage: 15
  },
  [HazardType.WOLF_MUTTS]: {
    description: "Engineered Wolf Mutts are hunting.",
    biomes: [BiomeType.FOREST, BiomeType.MEADOW, BiomeType.CORNUCOPIA, BiomeType.TUNDRA, BiomeType.DESERT], // Roam open areas
    damage: 40
  }
};

export const IDLE_EVENTS = [
    "picks flowers.",
    "practices their weapon handling.",
    "cries silently.",
    "thinks about home.",
    "hums a song from their district.",
    "climbs a tree to get a better view.",
    "sharpens a stick.",
    "tries to sleep but can't.",
    "looks at the sky.",
    "searches for clean water.",
    "camouflages themselves with mud.",
    "hears a cannon fire in the distance.",
    "inspects a strange insect.",
    "whispers a prayer.",
    "rearranges their inventory.",
    "hallucinates a loved one.",
    "trips over a root.",
    "watches a mockingjay fly by.",
    "tastes the air.",
    "checks their pulse.",
    "curls into a ball.",
    "stares blankly at the horizon."
];

export const BONDING_EVENTS = [
    "shares a story about their family with",
    "agrees to take first watch for",
    "shares food with",
    "promises to protect",
    "huddles for warmth with",
    "discusses strategy with",
    "holds hands with",
    "treats a small wound for",
    "jokes about the Capitol with",
    "teaches a survival trick to"
];

export const BETRAYAL_EVENTS = [
    "waited for the perfect moment to strike",
    "shoved",
    "decided they didn't need",
    "stabbed",
    "broke the alliance with",
    "used as bait",
    "stole supplies from",
    "pushed into a trap"
];
