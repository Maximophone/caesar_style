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
        desirability: { 1: -10, 2: -5 }
    },
    {
        // Level 2: Shack
        name: 'Shack',
        color: '#8B4513',  // Brown
        population: 2,
        requirements: { water: 0.4, food: 0.1 },
        upgradeThreshold: 0.8,
        taxMultiplier: 1,
        desirability: { 1: -5 }
    },
    {
        // Level 3: Stone House
        name: 'Stone House',
        color: '#654321',  // Dark brown
        population: 4,
        requirements: { water: 0.6, food: 0.5, religion: 0.2, pottery: 0.2, fish: 0.3 },
        upgradeThreshold: 0.8,
        taxMultiplier: 2
        // No desirability — neutral
    },
    {
        // Level 4: Villa
        name: 'Villa',
        color: '#4A3728',  // Very dark brown
        population: 6,
        requirements: { water: 0.8, food: 0.8, religion: 0.5, utensils: 0.2, pottery: 0.4, fish: 0.5, desirability: 0.4 },
        upgradeThreshold: 0.8,
        taxMultiplier: 3,
        desirability: { 1: 15, 2: 10, 3: 5 }
    },
    {
        // Level 5: Palace
        name: 'Palace',
        color: '#2F1B14',  // Near-black brown
        population: 10,
        requirements: { water: 0.9, food: 0.9, religion: 0.7, utensils: 0.5, pottery: 0.6, furniture: 0.4, fish: 0.7, desirability: 0.6 },
        upgradeThreshold: null,
        taxMultiplier: 5,
        desirability: { 1: 25, 2: 20, 3: 15, 4: 10, 5: 5 }
    }
];

// Building categories for menu
export const BUILDING_CATEGORIES = {
    roads: { key: '1', name: 'Roads', buildings: ['road'] },
    residential: { key: '2', name: 'Residential', buildings: ['house'] },
    water: { key: '3', name: 'Water', buildings: ['well', 'fountain'] },
    food: { key: '4', name: 'Food', buildings: ['farm', 'fishing_wharf', 'market', 'warehouse'] },
    religion: { key: '5', name: 'Religion', buildings: ['temple'] },
    beautification: { key: '6', name: 'Beauty', buildings: ['small_garden', 'large_garden'] },
    administration: { key: '7', name: 'Admin', buildings: ['tax_office'] },
    industry: { key: '8', name: 'Industry', buildings: ['mine', 'workshop', 'clay_pit', 'potter', 'lumber_camp', 'carpenter'] }
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
            consumes: { food: 0.1, fish: 0.08, utensils: 0.05, pottery: 0.05, furniture: 0.04 },
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
            distanceAmounts: { 1: 60, 2: 40, 3: 20 }
        },
        desirability: { 1: -5 },
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
            distanceAmounts: { 1: 90, 2: 70, 3: 50, 4: 30, 5: 10 }
        },
        desirability: { 1: 15, 2: 10, 3: 5 },
        cost: 70
    },
    market: {
        id: 'market',
        name: 'Market',
        width: 2,
        height: 2,
        color: '#DAA520',  // Goldenrod
        workersNeeded: 3,  // Reduced from 5
        cost: 60,
        goods: {
            receives: ['food', 'fish', 'utensils', 'pottery', 'furniture'],
            storage: { food: 400, fish: 400, utensils: 200, pottery: 200, furniture: 200 },
            distributes: ['food', 'fish', 'utensils', 'pottery', 'furniture']
        },
        deliveryPriority: 10,
        deliveryFillThreshold: 0.5,
        walkers: [
            { type: 'service', max: 1, spawnInterval: 5, coverageType: 'food' },
            { type: 'service', max: 1, spawnInterval: 5, coverageType: 'fish' },
            { type: 'service', max: 1, spawnInterval: 5, coverageType: 'utensils' },
            { type: 'service', max: 1, spawnInterval: 5, coverageType: 'pottery' },
            { type: 'service', max: 1, spawnInterval: 5, coverageType: 'furniture' }
        ],
        desirability: { 1: -5 }
    },
    temple: {
        id: 'temple',
        name: 'Temple',
        width: 3,
        height: 3,
        color: '#9370DB',  // Purple
        workersNeeded: 4,  // Reduced from 8
        cost: 200,
        walkers: [
            { type: 'service', max: 2, spawnInterval: 5, coverageType: 'religion', pathLength: 15 }
        ],
        desirability: { 1: 20, 2: 15, 3: 10, 4: 5 }
    },
    small_garden: {
        id: 'small_garden',
        name: 'Small Garden',
        width: 1,
        height: 1,
        color: '#228B22',  // Forest Green
        needsRoadAccess: false,
        desirability: { 1: 30, 2: 20, 3: 10 },
        cost: 10
    },
    large_garden: {
        id: 'large_garden',
        name: 'Large Garden',
        width: 2,
        height: 2,
        color: '#006400',  // Dark Green
        needsRoadAccess: false,
        desirability: { 1: 50, 2: 40, 3: 30, 4: 20, 5: 10 },
        cost: 30
    },
    farm: {
        id: 'farm',
        name: 'Farm',
        width: 4,
        height: 4,
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
            { type: 'cart', max: 2, spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -10, 2: -5 }
    },
    fishing_wharf: {
        id: 'fishing_wharf',
        name: 'Fishing Wharf',
        width: 2,
        height: 2,
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
            { type: 'cart', max: 1, spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -5 }
    },
    warehouse: {
        id: 'warehouse',
        name: 'Warehouse',
        width: 3,
        height: 3,
        color: '#8B4513',  // Saddle brown
        workersNeeded: 2,  // Reduced from 4
        cost: 100,
        goods: {
            receives: ['food', 'fish', 'iron', 'utensils', 'clay', 'pottery', 'timber', 'furniture'],
            storage: { food: 800, fish: 400, iron: 400, utensils: 400, clay: 400, pottery: 400, timber: 400, furniture: 400 },
            emits: ['food', 'fish', 'iron', 'utensils', 'clay', 'pottery', 'timber', 'furniture']
        },
        deliveryPriority: 1,
        walkers: [
            { type: 'cart', max: 1, spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -10, 2: -5 }
    },
    mine: {
        id: 'mine',
        name: 'Mine',
        width: 3,
        height: 3,
        color: '#555555',  // Dark gray
        workersNeeded: 4,  // Reduced from 8
        cost: 150,
        requiredResource: 'iron_ore',
        goods: {
            produces: { iron: 6 },     // iron at 6 units/sec when staffed
            storage: { iron: 200 },
            emits: ['iron']
        },
        walkers: [
            { type: 'cart', max: 1, spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -30, 2: -20, 3: -10, 4: -5 }
    },
    tax_office: {
        id: 'tax_office',
        name: 'Tax Office',
        width: 2,
        height: 2,
        color: '#A52A2A',  // Brown
        workersNeeded: 2,  // Reduced from 4
        cost: 100,
        walkers: [
            { type: 'service', max: 1, spawnInterval: 5, coverageType: 'tax', pathLength: 15 }
        ],
        desirability: { 1: -5 }
    },
    workshop: {
        id: 'workshop',
        name: 'Workshop',
        width: 3,
        height: 3,
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
            { type: 'cart', max: 1, spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -15, 2: -10, 3: -5 }
    },
    clay_pit: {
        id: 'clay_pit',
        name: 'Clay Pit',
        width: 3,
        height: 3,
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
            { type: 'cart', max: 1, spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -10, 2: -5 }
    },
    potter: {
        id: 'potter',
        name: 'Potter',
        width: 2,
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
            { type: 'cart', max: 1, spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -10, 2: -5 }
    },
    lumber_camp: {
        id: 'lumber_camp',
        name: 'Lumber Camp',
        width: 3,
        height: 3,
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
            { type: 'cart', max: 1, spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -10, 2: -5 }
    },
    carpenter: {
        id: 'carpenter',
        name: 'Carpenter',
        width: 2,
        height: 2,
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
            { type: 'cart', max: 1, spawnInterval: 8, speed: 1.5 }
        ],
        desirability: { 1: -5 }
    }
};

// Road cost (not a building but needs a cost)
export const ROAD_COST = 5;

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
