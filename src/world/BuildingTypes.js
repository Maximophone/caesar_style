// Building type configurations
export const BUILDING_TYPES = {
    house: {
        id: 'house',
        name: 'House',
        width: 2,
        height: 2,
        color: '#8B4513',  // Brown
        spawnsWalker: false,
        coverageNeeds: ['water', 'food', 'religion'],
        key: '2'
    },
    well: {
        id: 'well',
        name: 'Well',
        width: 1,
        height: 1,
        color: '#4169E1',  // Blue
        spawnsWalker: true,
        walkerColor: '#87CEEB',  // Light blue
        coverageType: 'water',
        key: '3'
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
        key: '5'
    }
};

// Get building type by key press
export function getBuildingTypeByKey(key) {
    return Object.values(BUILDING_TYPES).find(t => t.key === key);
}
