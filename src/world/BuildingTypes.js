// Water requirements grow with level
// Upgrade threshold = next level's maintenance threshold for stability
export const TAX_COOLDOWN = 20;

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
        requirements: { water: 0.4 },
        upgradeThreshold: 0.8,
        taxMultiplier: 1
    },
    {
        // Level 3: House
        name: 'House',
        color: '#654321',  // Dark brown
        population: 4,
        requirements: { water: 0.6, food: 0.2 },
        upgradeThreshold: 0.8,
        taxMultiplier: 2
    },
    {
        // Level 4: Villa
        name: 'Villa',
        color: '#4A3728',  // Very dark brown
        population: 6,
        requirements: { water: 0.8, food: 0.6, desirability: 0.4 }, // 0.1 normalized = 10 if max is 100
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
    administration: { key: '7', name: 'Admin', buildings: ['tax_office'] }
};

// Building type configurations
export const BUILDING_TYPES = {
    house: {
        id: 'house',
        name: 'House',
        width: 2,
        height: 2,
        color: '#A0522D',  // Start as Tent color
        spawnsWalker: false,
        coverageNeeds: ['water', 'food', 'religion'],
        cost: 30
    },
    well: {
        id: 'well',
        name: 'Well',
        width: 1,
        height: 1,
        color: '#4169E1',  // Blue
        spawnsWalker: false,
        staticCoverage: {
            type: 'water',
            // Coverage by Manhattan distance: {distance: amount}
            distanceAmounts: { 1: 60, 2: 40, 3: 20 }  // Max coverage at each distance
        },
        cost: 50
    },
    fountain: {
        id: 'fountain',
        name: 'Fountain',
        width: 1,
        height: 1,
        color: '#00BFFF',  // Deep Sky Blue (brighter/richer than Well)
        spawnsWalker: false,
        staticCoverage: {
            type: 'water',
            // Better coverage over longer distance
            distanceAmounts: {
                1: 90,
                2: 70,
                3: 50,
                4: 30,
                5: 10
            }
        },
        cost: 200  // Expensive
    },
    market: {
        id: 'market',
        name: 'Market',
        width: 2,
        height: 2,
        color: '#DAA520',  // Goldenrod
        spawnsWalker: true,
        walkerColor: '#FFD700',  // Gold
        coverageType: 'food',
        workersNeeded: 5,
        maxWalkers: 1,
        cost: 40,
        employees: 5,
        sprite: 'market',
        // Goods storage
        acceptsGoods: ['food'],
        maxStorage: 400
    },
    temple: {
        id: 'temple',
        name: 'Temple',
        width: 3,
        height: 3,
        color: '#9370DB',  // Purple
        spawnsWalker: true,
        walkerColor: '#DDA0DD',  // Plum
        coverageType: 'religion',
        workersNeeded: 8,
        maxWalkers: 2,
        cost: 200
    },
    small_garden: {
        id: 'small_garden',
        name: 'Small Garden',
        width: 1,
        height: 1,
        color: '#228B22',  // Forest Green
        spawnsWalker: false,
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
        spawnsWalker: false,
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
        width: 3,
        height: 3,
        color: '#8B7355',  // Wheat/tan color
        spawnsWalker: false,  // Spawns cart walkers via special logic
        workersNeeded: 6,
        cost: 100,
        sprite: 'farm',
        requiredResource: 'fertility',
        // Goods production
        produces: 'food',
        productionRate: 10,  // Units per second when staffed
        maxStorage: 200
    },
    warehouse: {
        id: 'warehouse',
        name: 'Warehouse',
        width: 3,
        height: 3,
        color: '#8B4513',  // Saddle brown
        spawnsWalker: false,
        workersNeeded: 4,
        cost: 80,
        sprite: 'warehouse',
        // Goods storage - accepts multiple goods
        acceptsGoods: ['food'],
        distributesGoods: true, // Enables spawning cart walkers to move goods
        maxStorage: 800  // Large storage capacity
    },
    tax_office: {
        id: 'tax_office',
        name: 'Tax Office',
        width: 2,
        height: 2,
        color: '#A52A2A',  // Brown
        spawnsWalker: true,
        walkerColor: '#FF4500',  // Orange Red
        coverageType: 'tax',   // Special coverage type
        workersNeeded: 4,
        maxWalkers: 1,
        cost: 150
    }
};

// Road cost (not a building but needs a cost)
export const ROAD_COST = 5;

// Goods transport configuration
export const GOODS_CONFIG = {
    CART_CAPACITY: 100,              // Units per cart trip
    DISTRIBUTOR_CAPACITY: 100,       // Units per market walker
    // House food consumption
    HOUSE_FOOD_PER_INHABITANT: 5,    // Max food storage per inhabitant
    HOUSE_FOOD_DELIVERY_PER_POP: 1,  // Food delivered per inhabitant when walker passes
    HOUSE_FOOD_CONSUMPTION_RATE: 0.1 // Food consumed per inhabitant per second
};

// Get building type by key press
export function getBuildingTypeByKey(key) {
    return Object.values(BUILDING_TYPES).find(t => t.key === key);
}
