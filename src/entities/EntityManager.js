export class EntityManager {
    constructor() {
        this.entities = [];
        this.toRemove = [];
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    removeEntity(entity) {
        this.toRemove.push(entity);
    }

    update(deltaTime, roadNetwork, grid, economy) {
        // Update all entities
        for (const entity of this.entities) {
            entity.update(deltaTime, roadNetwork, this, grid, economy);
        }

        // Remove marked entities
        for (const entity of this.toRemove) {
            const index = this.entities.indexOf(entity);
            if (index !== -1) {
                this.entities.splice(index, 1);
            }
        }
        this.toRemove = [];
    }
}
