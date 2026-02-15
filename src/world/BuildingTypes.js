// Water requirements grow with level
// Upgrade threshold = next level's maintenance threshold for stability
export const TAX_COOLDOWN = 10;

// Terrain types — impassable tiles generated during map creation
export const TERRAIN_TYPES = {
    water: {
        id: 'water',
        name: 'Water',
        color: '#1E64B4',
        spawn: [
            { strategy: 'cluster', count: 2, radiusMin: 6, radiusMax: 12 },
            { strategy: 'river', count: 2, widthMin: 2, widthMax: 4, segments: 8, drift: 6 }
        ]
    }
};

// Map resource definitions — each entry drives spawning and rendering
export const RESOURCE_TYPES = {
    fertility: {
        id: 'fertility',
        name: 'Fertile Land',
        color: 'rgba(218, 165, 32, 0.3)',
        spawn: {
            strategy: 'cluster',
            density: 1 / 150,
            radiusMin: 2,
            radiusMax: 4,
            allowOverlap: true,
        }
    },
    iron_ore: {
        id: 'iron_ore',
        name: 'Iron Ore',
        color: 'rgba(112, 128, 144, 0.35)',
        spawn: {
            strategy: 'cluster',
            density: 1 / 250,
            radiusMin: 1,
            radiusMax: 2,
            allowOverlap: false,
        }
    },
    clay: {
        id: 'clay',
        name: 'Clay Deposits',
        color: 'rgba(180, 120, 60, 0.3)',
        spawn: {
            strategy: 'cluster',
            density: 1 / 200,
            radiusMin: 1,
            radiusMax: 3,
            allowOverlap: false,
        }
    },
    timber: {
        id: 'timber',
        name: 'Forest',
        color: 'rgba(10, 60, 10, 0.45)',
        spawn: {
            strategy: 'cluster',
            density: 1 / 180,
            radiusMin: 2,
            radiusMax: 4,
            allowOverlap: false,
        }
    },
};

// Metadata for goods rendering (emoji + bar color)
export const GOODS_META = {
    food: { emoji: '🌾', color: '#DAA520' },
    iron: { emoji: '⛏️', color: '#708090' },
    utensils: { emoji: '🥄', color: '#C0C0C0' },
    clay: { emoji: '🧱', color: '#B4783C' },
    pottery: { emoji: '🏺', color: '#CD853F' },
    timber: { emoji: '🪵', color: '#8B6914' },
    furniture: { emoji: '🪑', color: '#DEB887' },
    fish: { emoji: '🐟', color: '#1E90FF' },
};

export const HOUSE_LEVELS = [
    null, // Index 0 unused
    {
        // Level 1: Tent
        name: 'Tent',
        color: '#A0522D',  // Sienna (lighter brown)
        population: 1,
        requirements: { water: 0.1 },  // Survival needs
        upgradeThreshold: 0.4,
        taxMultiplier: 1,
        desirability: { 1: -10, 2: -8, 3: -5, 4: -2 },
        consumes: {} // Tents require no goods, so they consume none
    },
    {
        // Level 2: Shack
        name: 'Shack',
        color: '#8B4513',  // Brown
        population: 2,
        requirements: { water: 0.4, food: 0.1 },
        upgradeThreshold: 0.8,
        taxMultiplier: 1,
        desirability: { 1: -5, 2: -3, 3: -1 },
        consumes: { food: 0.05 } // Shacks only require food
    },
    {
        // Level 3: Stone House
        name: 'Stone House',
        color: '#654321',  // Dark brown
        population: 4,
        requirements: { water: 0.6, food: 0.3, religion: 0.2, pottery: 0.1, fish: 0.3 },
        upgradeThreshold: 0.8,
        taxMultiplier: 2,
        consumes: { food: 0.08, fish: 0.05, pottery: 0.02 }
        // No desirability — neutral
    },
    {
        // Level 4: Villa
        name: 'Villa',
        color: '#4A3728',  // Very dark brown
        population: 6,
        requirements: { water: 0.8, food: 0.5, religion: 0.4, utensils: 0.1, pottery: 0.2, fish: 0.5, desirability: 0.4 },
        upgradeThreshold: 0.8,
        taxMultiplier: 3,
        desirability: { 1: 15, 2: 12, 3: 10, 4: 7, 5: 4, 6: 2 },
        consumes: { food: 0.1, fish: 0.1, utensils: 0.05, pottery: 0.05 }
    },
    {
        // Level 5: Palace
        name: 'Palace',
        color: '#2F1B14',  // Near-black brown
        population: 10,
        requirements: { water: 0.9, food: 0.7, religion: 0.6, utensils: 0.5, pottery: 0.4, furniture: 0.4, fish: 0.7, desirability: 0.6 },
        upgradeThreshold: null,
        taxMultiplier: 5,
        desirability: { 1: 25, 2: 22, 3: 18, 4: 14, 5: 10, 6: 7, 7: 4, 8: 2 },
        consumes: { food: 0.15, fish: 0.2, utensils: 0.1, pottery: 0.1, furniture: 0.08 }
    }
];

// Building categories for menu
export const BUILDING_CATEGORIES = {
    roads: { key: '1', name: 'Roads', buildings: ['road', 'bridge'] },
    residential: { key: '2', name: 'Residential', buildings: ['house'] },
    water: { key: '3', name: 'Water', buildings: ['well', 'fountain'] },
    food: { key: '4', name: 'Food', buildings: ['farm', 'fishing_wharf', 'granary', 'market'] },
    religion: { key: '5', name: 'Religion', buildings: ['temple'] },
    beautification: { key: '6', name: 'Beauty', buildings: ['small_garden', 'large_garden'] },
    administration: { key: '7', name: 'Admin', buildings: ['tax_office'] },
    industry: { key: '8', name: 'Industry', buildings: ['mine', 'forge', 'clay_pit', 'potter', 'lumber_camp', 'carpenter', 'warehouse', 'bazaar'] }
};

// Building type configurations
export const BUILDING_TYPES = {
    house: {
        id: 'house',
        name: 'House',
        width: 2,
        height: 2,
        color: '#A0522D',  // Start as Tent color
        coverageNeeds: ['water', 'food', 'fish', 'religion', 'utensils', 'pottery', 'furniture', 'desirability'],
        cost: 30,
        goods: {
            storage: { food: 5, fish: 5, utensils: 2, pottery: 2, furniture: 2 },
            dynamicCapacity: true,
            // consumes moved to HOUSE_LEVELS for per-level tuning
        }
    },
    well: {
        id: 'well',
        name: 'Well',
        width: 1,
        height: 1,
        color: '#4169E1',  // Blue
        staticCoverage: {
            type: 'water',
            distanceAmounts: { 1: 60, 2: 50, 3: 40, 4: 30, 5: 20, 6: 20 }
        },
        desirability: { 1: -5, 2: -3, 3: -1 },
        cost: 20
    },
    fountain: {
        id: 'fountain',
        name: 'Fountain',
        width: 1,
        height: 1,
        color: '#00BFFF',  // Deep Sky Blue
        staticCoverage: {
            type: 'water',
            distanceAmounts: { 1: 90, 2: 70, 3: 60, 4: 50, 5: 40, 6: 30, 7: 20, 8: 20, 9: 20, 10: 20 }
        },
        desirability: { 1: 15, 2: 12, 3: 10, 4: 7, 5: 4, 6: 2 },
        cost: 60
    },
    market: {
        id: 'market',
        name: 'Market',
        width: 3,
        height: 3,
        color: '#DAA520',  // Goldenrod
        workersNeeded: 2,
        cost: 60,
        goods: {
            receives: ['food', 'fish'],
            storage: { food: 400, fish: 400 },
            distributes: ['food', 'fish']
        },
        deliveryPriority: 10,
        deliveryFillThreshold: 0.5,
        walkers: [
            { type: 'service', spawnInterval: 5, coverageType: 'food' },
            { type: 'service', spawnInterval: 5, coverageType: 'fish' }
        ],
        desirability: { 1: -5, 2: -3, 3: -2, 4: -1 }
    },
    temple: {
        id: 'temple',
        name: 'Temple',
        width: 4,
        height: 4,
        color: '#9370DB',  // Purple
        workersNeeded: 4,  // Reduced from 8
        cost: 200,
        walkers: [
            { type: 'service', spawnInterval: 5, coverageType: 'religion' }
        ],
        desirability: { 1: 20, 2: 18, 3: 15, 4: 12, 5: 8, 6: 5, 7: 3, 8: 1 }
    },
    small_garden: {
        id: 'small_garden',
        name: 'Small Garden',
        width: 1,
        height: 1,
        color: '#228B22',  // Forest Green
        needsRoadAccess: false,
        desirability: { 1: 30, 2: 22, 3: 15, 4: 8, 5: 3 },
        cost: 10
    },
    large_garden: {
        id: 'large_garden',
        name: 'Large Garden',
        width: 2,
        height: 2,
        color: '#006400',  // Dark Green
        needsRoadAccess: false,
        desirability: { 1: 50, 2: 42, 3: 34, 4: 26, 5: 18, 6: 10, 7: 4 },
        cost: 30
    },
    farm: {
        id: 'farm',
        name: 'Farm',
        width: 5,
        height: 5,
        color: '#8B7355',  // Wheat/tan color
        workersNeeded: 3,  // Reduced from 6
        cost: 120,
        requiredResource: 'fertility',
        goods: {
            produces: { food: 10 },    // food at 10 units/sec when staffed
            storage: { food: 200 },
            emits: ['food']
        },
        walkers: [
            { type: 'cart', spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -10, 2: -8, 3: -6, 4: -4, 5: -2, 6: -1 }
    },
    fishing_wharf: {
        id: 'fishing_wharf',
        name: 'Fishing Wharf',
        width: 4,
        height: 4,
        color: '#1E90FF',  // Dodger blue
        workersNeeded: 2,
        cost: 80,
        requiredTerrain: 'water',
        goods: {
            produces: { fish: 8 },
            storage: { fish: 150 },
            emits: ['fish']
        },
        walkers: [
            { type: 'cart', spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -5, 2: -3, 3: -2, 4: -1 }
    },
    granary: {
        id: 'granary',
        name: 'Granary',
        width: 4,
        height: 4,
        color: '#B8860B',  // Dark goldenrod (food storage)
        workersNeeded: 2,
        cost: 100,
        goods: {
            receives: ['food', 'fish'],
            storage: { food: 800, fish: 400 },
            emits: ['food', 'fish']
        },
        deliveryPriority: 1,
        walkers: [
            { type: 'cart', spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -10, 2: -7, 3: -4, 4: -2, 5: -1 }
    },
    warehouse: {
        id: 'warehouse',
        name: 'Warehouse',
        width: 4,
        height: 3,
        color: '#8B4513',  // Saddle brown
        workersNeeded: 4,
        cost: 100,
        goods: {
            receives: ['iron', 'utensils', 'clay', 'pottery', 'timber', 'furniture'],
            storage: { iron: 400, utensils: 400, clay: 400, pottery: 400, timber: 400, furniture: 400 },
            emits: ['iron', 'utensils', 'clay', 'pottery', 'timber', 'furniture']
        },
        deliveryPriority: 1,
        walkers: [
            { type: 'cart', spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -10, 2: -7, 3: -4, 4: -2, 5: -1 }
    },
    mine: {
        id: 'mine',
        name: 'Mine',
        width: 3,
        height: 3,
        color: '#555555',  // Dark gray
        workersNeeded: 5,  // Reduced from 8
        cost: 150,
        requiredResource: 'iron_ore',
        goods: {
            produces: { iron: 6 },     // iron at 6 units/sec when staffed
            storage: { iron: 200 },
            emits: ['iron']
        },
        walkers: [
            { type: 'cart', spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -30, 2: -25, 3: -20, 4: -15, 5: -10, 6: -6, 7: -3, 8: -1 }
    },
    tax_office: {
        id: 'tax_office',
        name: 'Tax Office',
        width: 3,
        height: 3,
        color: '#A52A2A',  // Brown
        workersNeeded: 2,  // Reduced from 4
        cost: 100,
        walkers: [
            { type: 'service', spawnInterval: 5, coverageType: 'tax' }
        ],
        desirability: { 1: -5, 2: -3, 3: -2, 4: -1 }
    },
    forge: {
        id: 'forge',
        name: 'Forge',
        width: 4,
        height: 4,
        color: '#CD853F',  // Peru (bronze-ish)
        workersNeeded: 3,  // Reduced from 6
        cost: 120,
        goods: {
            receives: ['iron'],
            storage: { iron: 100, utensils: 100 },
            produces: { utensils: 10 },
            productionCost: { iron: 1 }, // Consumes 1 Iron per 1 Utensil produced
            emits: ['utensils']
        },
        deliveryPriority: 10,
        deliveryFillThreshold: 0.5,
        walkers: [
            { type: 'cart', spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -20, 2: -16, 3: -12, 4: -8, 5: -5, 6: -3, 7: -1 }
    },
    clay_pit: {
        id: 'clay_pit',
        name: 'Clay Pit',
        width: 5,
        height: 5,
        color: '#B4783C',  // Terracotta
        workersNeeded: 3,
        cost: 100,
        requiredResource: 'clay',
        goods: {
            produces: { clay: 8 },
            storage: { clay: 150 },
            emits: ['clay']
        },
        walkers: [
            { type: 'cart', spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -10, 2: -8, 3: -6, 4: -4, 5: -2, 6: -1 }
    },
    potter: {
        id: 'potter',
        name: 'Potter',
        width: 3,
        height: 2,
        color: '#CD853F',  // Peru
        workersNeeded: 3,
        cost: 100,
        goods: {
            receives: ['clay'],
            storage: { clay: 100, pottery: 100 },
            produces: { pottery: 8 },
            productionCost: { clay: 1 },
            emits: ['pottery']
        },
        deliveryPriority: 10,
        deliveryFillThreshold: 0.5,
        walkers: [
            { type: 'cart', spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -10, 2: -7, 3: -4, 4: -2, 5: -1 }
    },
    lumber_camp: {
        id: 'lumber_camp',
        name: 'Lumber Camp',
        width: 5,
        height: 5,
        color: '#8B6914',  // Dark goldenrod
        workersNeeded: 3,
        cost: 100,
        requiredResource: 'timber',
        goods: {
            produces: { timber: 8 },
            storage: { timber: 150 },
            emits: ['timber']
        },
        walkers: [
            { type: 'cart', spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -10, 2: -8, 3: -6, 4: -4, 5: -2, 6: -1 }
    },
    carpenter: {
        id: 'carpenter',
        name: 'Carpenter',
        width: 3,
        height: 3,
        color: '#DEB887',  // Burlywood
        workersNeeded: 3,
        cost: 120,
        goods: {
            receives: ['timber'],
            storage: { timber: 100, furniture: 100 },
            produces: { furniture: 6 },
            productionCost: { timber: 1 },
            emits: ['furniture']
        },
        deliveryPriority: 10,
        deliveryFillThreshold: 0.5,
        walkers: [
            { type: 'cart', spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -5, 2: -3, 3: -2, 4: -1 }
    },
    bazaar: {
        id: 'bazaar',
        name: 'Bazaar',
        width: 4,
        height: 3,
        color: '#CD853F',  // Peru (craft/trade)
        workersNeeded: 3,
        cost: 80,
        goods: {
            receives: ['utensils', 'pottery', 'furniture'],
            storage: { utensils: 200, pottery: 200, furniture: 200 },
            distributes: ['utensils', 'pottery', 'furniture']
        },
        deliveryPriority: 10,
        deliveryFillThreshold: 0.5,
        walkers: [
            { type: 'service', spawnInterval: 5, coverageType: 'utensils' },
            { type: 'service', spawnInterval: 5, coverageType: 'pottery' },
            { type: 'service', spawnInterval: 5, coverageType: 'furniture' }
        ],
        desirability: { 1: -5, 2: -3, 3: -2, 4: -1 }
    }
};

// Road cost (not a building but needs a cost)
export const ROAD_COST = 5;
export const BRIDGE_COST = 30;

// Walker configuration
export const WALKER_CONFIG = {
    DEFAULT_PATH_LENGTH: 40,         // Default max steps for service walkers before returning
};

// Goods transport configuration
export const GOODS_CONFIG = {
    CART_CAPACITY: 100,              // Units per cart trip
    DISTRIBUTOR_CAPACITY: 100,       // Units per market walker
    HOUSE_GOOD_DELIVERY_PER_POP: 1,  // Goods delivered per inhabitant when walker passes
};

// Get building type by key press
export function getBuildingTypeByKey(key) {
    return Object.values(BUILDING_TYPES).find(t => t.key === key);
}
