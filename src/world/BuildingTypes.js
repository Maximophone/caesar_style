// House evolution levels - thresholds create stable equilibrium points
// Water requirements grow with level
// Upgrade threshold = next level's maintenance threshold for stability
export const HOUSE_LEVELS = [
    null, // Index 0 unused
    {
        // Level 1: Tent
        name: 'Tent',
        color: '#A0522D',  // Sienna (lighter brown)
        population: 1,
        requirements: { water: 0.1 },  // Survival needs
        upgradeThreshold: 0.4          // Can think about upgrading with decent water (dist 2)
    },
    {
        // Level 2: Shack
        name: 'Shack',
        color: '#8B4513',  // Brown
        population: 2,
        // Allows upgrading here with just good water (e.g. cumulative dist 1+2 = 60+40=100)
        requirements: { water: 0.4 },
        upgradeThreshold: 0.8          // Need VERY high water to think about Level 3
    },
    {
        // Level 3: House
        name: 'House',
        color: '#654321',  // Dark brown
        population: 4,
        // Introduces Food requirement. 
        requirements: { water: 0.6, food: 0.2 },
        upgradeThreshold: 0.8
    },
    {
        // Level 4: Villa (max level)
        name: 'Villa',
        color: '#4A3728',  // Very dark brown
        population: 6,
        // Introduces Religion
        requirements: { water: 0.8, food: 0.6, religion: 0.4 },
        upgradeThreshold: null  // Can't upgrade further
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
        cost: 100,
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
    }
};

// Road cost (not a building but needs a cost)
export const ROAD_COST = 5;

// Get building type by key press
export function getBuildingTypeByKey(key) {
    return Object.values(BUILDING_TYPES).find(t => t.key === key);
}
