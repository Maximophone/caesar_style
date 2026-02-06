// House evolution levels - thresholds create stable equilibrium points
// Water requirements grow with level
// Upgrade threshold = next level's maintenance threshold for stability
export const HOUSE_LEVELS = [
    null, // Index 0 unused
    {
        // Level 1: Tent
        name: 'Tent',
        color: '#A0522D',  // Sienna (lighter brown)
        population: 5,
        requirements: { water: 0.1 },  // Survival needs
        upgradeThreshold: 0.4
    },
    {
        // Level 2: Shack
        name: 'Shack',
        color: '#8B4513',  // Brown
        population: 10,
        requirements: { water: 0.4 },
        upgradeThreshold: 0.8
    },
    {
        // Level 3: House
        name: 'House',
        color: '#654321',  // Dark brown
        population: 20,
        requirements: { water: 0.6, food: 0.2 },
        upgradeThreshold: 0.8
    },
    {
        // Level 4: Villa
        name: 'Villa',
        color: '#4A3728',  // Very dark brown
        population: 40,
        requirements: { water: 0.8, food: 0.6, desirability: 0.1 }, // 0.1 normalized = 10 if max is 100
        upgradeThreshold: null
    }
];

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
        cost: 30,
        key: '2'
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
        cost: 50,
        key: '3'
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
        cost: 200,  // Expensive
        key: '6'
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
        key: '4'
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
        cost: 200,
        key: '5'
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
        cost: 10,
        key: '7'
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
        cost: 30,
        key: '8'
    }
};

// Road cost (not a building but needs a cost)
export const ROAD_COST = 5;

// Get building type by key press
export function getBuildingTypeByKey(key) {
    return Object.values(BUILDING_TYPES).find(t => t.key === key);
}
