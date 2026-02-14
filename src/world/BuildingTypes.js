// Water requirements grow with level
// Upgrade threshold = next level's maintenance threshold for stability
export const TAX_COOLDOWN = 10;

// Metadata for goods rendering (emoji + bar color)
export const GOODS_META = {
    food: { emoji: '🌾', color: '#DAA520' },
    iron: { emoji: '⛏️', color: '#708090' },
    utensils: { emoji: '🥄', color: '#C0C0C0' }, // Silver/Metal color
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
        taxMultiplier: 1
    },
    {
        // Level 2: Shack
        name: 'Shack',
        color: '#8B4513',  // Brown
        population: 2,
        requirements: { water: 0.4, food: 0.1 },
        upgradeThreshold: 0.8,
        taxMultiplier: 1
    },
    {
        // Level 3: Stone House
        name: 'Stone House',
        color: '#654321',  // Dark brown
        population: 4,
        requirements: { water: 0.6, food: 0.5, religion: 0.2 },
        upgradeThreshold: 0.8,
        taxMultiplier: 2
    },
    {
        // Level 4: Villa
        name: 'Villa',
        color: '#4A3728',  // Very dark brown
        population: 6,
        requirements: { water: 0.8, food: 0.8, religion: 0.5, utensils: 0.2, desirability: 0.4 }, // 0.1 normalized = 10 if max is 100
        upgradeThreshold: null,
        taxMultiplier: 3
    }
];

// Building categories for menu
export const BUILDING_CATEGORIES = {
    roads: { key: '1', name: 'Roads', buildings: ['road'] },
    residential: { key: '2', name: 'Residential', buildings: ['house'] },
    water: { key: '3', name: 'Water', buildings: ['well', 'fountain'] },
    food: { key: '4', name: 'Food', buildings: ['farm', 'market', 'warehouse'] },
    religion: { key: '5', name: 'Religion', buildings: ['temple'] },
    beautification: { key: '6', name: 'Beauty', buildings: ['small_garden', 'large_garden'] },
    administration: { key: '7', name: 'Admin', buildings: ['tax_office'] },
    industry: { key: '8', name: 'Industry', buildings: ['mine', 'workshop'] }
};

// Building type configurations
export const BUILDING_TYPES = {
    house: {
        id: 'house',
        name: 'House',
        width: 2,
        height: 2,
        color: '#A0522D',  // Start as Tent color
        coverageNeeds: ['water', 'food', 'religion', 'utensils', 'desirability'],
        cost: 30,
        goods: {
            storage: { food: 5, utensils: 2 },  // per-inhabitant capacity (lower for utensils)
            dynamicCapacity: true,
            consumes: { food: 0.1, utensils: 0.05 }, // consuming utensils slower than food
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
            receives: ['food', 'utensils'],
            storage: { food: 400, utensils: 200 },
            distributes: ['food', 'utensils']
        },
        deliveryPriority: 10,
        deliveryFillThreshold: 0.5,
        walkers: [
            { type: 'service', max: 1, spawnInterval: 5, coverageType: 'food' },
            { type: 'service', max: 1, spawnInterval: 5, coverageType: 'utensils' }
        ]
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
        ]
    },
    small_garden: {
        id: 'small_garden',
        name: 'Small Garden',
        width: 1,
        height: 1,
        color: '#228B22',  // Forest Green
        needsRoadAccess: false,
        staticCoverage: {
            type: 'desirability',
            distanceAmounts: { 1: 30, 2: 20, 3: 10 }
        },
        cost: 10
    },
    large_garden: {
        id: 'large_garden',
        name: 'Large Garden',
        width: 2,
        height: 2,
        color: '#006400',  // Dark Green
        needsRoadAccess: false,
        staticCoverage: {
            type: 'desirability',
            distanceAmounts: { 1: 50, 2: 40, 3: 30, 4: 20, 5: 10 }
        },
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
            { type: 'cart', max: 1, spawnInterval: 8, speed: 1.5 }
        ]
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
            receives: ['food', 'iron', 'utensils'],
            storage: { food: 800, iron: 400, utensils: 400 },
            emits: ['food', 'iron', 'utensils']
        },
        deliveryPriority: 1,
        walkers: [
            { type: 'cart', max: 1, spawnInterval: 8, speed: 1.5 }
        ]
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
        ]
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
        ]
    },
    workshop: {
        id: 'workshop',
        name: 'Workshop',
        width: 2,
        height: 2,
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
        ]
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
