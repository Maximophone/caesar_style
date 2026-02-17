import { BUILDING_TYPES, BUILDING_CATEGORIES, ROAD_COST, BRIDGE_COST } from '../world/BuildingTypes.js';

/**
 * BuildingMenu - Manages categorized building selection
 */
export class BuildingMenu {
    constructor() {
        this.currentCategory = null;  // Currently selected category key
        this.selectedBuilding = null; // Currently selected building type
        this.placementMode = null;    // 'road' or 'building'
    }

    /**
     * Handle keypress for menu navigation
     * @returns {boolean} true if key was handled
     */
    handleKeyPress(key) {
        const upperKey = key.toUpperCase();

        // ESC - go back to category list or deselect
        if (upperKey === 'ESCAPE' || key === 'Escape') {
            if (this.currentCategory) {
                this.currentCategory = null;
                this.selectedBuilding = null;
                this.placementMode = null;
                return true;
            }
            return false;
        }

        // If no category selected, check for category keys
        if (!this.currentCategory) {
            const category = Object.values(BUILDING_CATEGORIES).find(c => c.key === key);
            if (category) {
                this.selectCategory(category);
                return true;
            }
            return false;
        }

        // Category is selected - check for building number
        const category = Object.values(BUILDING_CATEGORIES).find(c => c.key === this.currentCategory);
        if (!category) return false;

        const buildingIndex = parseInt(key) - 1;
        if (buildingIndex >= 0 && buildingIndex < category.buildings.length) {
            const buildingId = category.buildings[buildingIndex];
            this.selectBuilding(buildingId);
            return true;
        }

        // Check if pressing a different category key
        const newCategory = Object.values(BUILDING_CATEGORIES).find(c => c.key === key);
        if (newCategory) {
            this.selectCategory(newCategory);
            return true;
        }

        return false;
    }

    selectCategory(category) {
        this.currentCategory = category.key;

        // Auto-select if only one building in category
        if (category.buildings.length === 1) {
            this.selectBuilding(category.buildings[0]);
        } else {
            this.selectedBuilding = null;
            this.placementMode = null;
        }
    }

    selectBuilding(buildingId) {
        if (buildingId === 'road') {
            this.placementMode = 'road';
            this.selectedBuilding = null;
        } else if (buildingId === 'bridge') {
            this.placementMode = 'bridge';
            this.selectedBuilding = null;
        } else if (buildingId === 'wall') {
            this.placementMode = 'wall';
            this.selectedBuilding = BUILDING_TYPES[buildingId];
        } else {
            this.placementMode = 'building';
            this.selectedBuilding = BUILDING_TYPES[buildingId];
        }
    }

    /**
     * Get display data for rendering the menu
     */
    getDisplayData() {
        if (!this.currentCategory) {
            // Show all categories
            return {
                mode: 'categories',
                items: Object.values(BUILDING_CATEGORIES).map(cat => ({
                    key: cat.key,
                    name: cat.name,
                    buildingCount: cat.buildings.length
                }))
            };
        }

        // Show buildings in current category
        const category = Object.values(BUILDING_CATEGORIES).find(c => c.key === this.currentCategory);
        if (!category) return { mode: 'categories', items: [] };

        return {
            mode: 'buildings',
            categoryName: category.name,
            items: category.buildings.map((buildingId, index) => {
                if (buildingId === 'road') {
                    return {
                        key: String(index + 1),
                        name: 'Road',
                        cost: ROAD_COST,
                        selected: this.placementMode === 'road'
                    };
                }
                if (buildingId === 'bridge') {
                    return {
                        key: String(index + 1),
                        name: 'Bridge',
                        cost: BRIDGE_COST,
                        selected: this.placementMode === 'bridge'
                    };
                }
                if (buildingId === 'wall') {
                    const wallType = BUILDING_TYPES[buildingId];
                    return {
                        key: String(index + 1),
                        name: wallType.name,
                        cost: wallType.cost,
                        selected: this.placementMode === 'wall'
                    };
                }
                const building = BUILDING_TYPES[buildingId];
                return {
                    key: String(index + 1),
                    name: building.name,
                    cost: building.cost,
                    selected: this.selectedBuilding?.id === buildingId
                };
            })
        };
    }

    /**
     * Get current selection description for status display
     */
    getSelectionText() {
        if (this.placementMode === 'road') {
            return `Road (${ROAD_COST} Dn)`;
        }
        if (this.placementMode === 'bridge') {
            return `Bridge (${BRIDGE_COST} Dn)`;
        }
        if (this.selectedBuilding) {
            return `${this.selectedBuilding.name} (${this.selectedBuilding.cost} Dn)`;
        }
        if (this.currentCategory) {
            const category = Object.values(BUILDING_CATEGORIES).find(c => c.key === this.currentCategory);
            return category ? `Select ${category.name}...` : '';
        }
        return 'Select category...';
    }
}
