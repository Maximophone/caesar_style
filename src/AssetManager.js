export class AssetManager {
    constructor() {
        this.images = {};
    }

    loadImages(sources) {
        const promises = [];
        for (const [name, src] of Object.entries(sources)) {
            promises.push(new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.images[name] = img;
                    resolve(img);
                };
                img.onerror = () => reject(`Failed to load image: ${src}`);
                img.src = src;
            }));
        }
        return Promise.all(promises);
    }

    getImage(name) {
        return this.images[name];
    }

    /**
     * Try to load an image, but don't fail if it doesn't exist.
     * Returns a promise that resolves to true if loaded, false otherwise.
     */
    tryLoadImage(name, src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.images[name] = img;
                resolve(true);
            };
            img.onerror = () => resolve(false);
            img.src = src;
        });
    }

    /**
     * Get the appropriate sprite for a building based on direction.
     * Precedence:
     * 1. Exact directional match: {baseName}_{direction}
     * 2. Any available directional sprite as fallback
     * 3. Base spritesheet: {baseName}
     * 
     * @param {string} baseName - Base asset name (e.g., 'house_level_1')
     * @param {string} direction - Direction string: 'south', 'north', 'east', 'west'
     * @returns {{ image: Image|HTMLCanvasElement, isSheet: boolean } | null}
     */
    getBuildingSprite(baseName, direction) {
        const directionSuffixes = ['south', 'north', 'east', 'west'];

        // 1. Try exact directional match
        const exactKey = `${baseName}_${direction}`;
        if (this.images[exactKey]) {
            return { image: this.images[exactKey], isSheet: false };
        }

        // 2. Fallback: use any available directional sprite
        for (const suffix of directionSuffixes) {
            const fallbackKey = `${baseName}_${suffix}`;
            if (this.images[fallbackKey]) {
                return { image: this.images[fallbackKey], isSheet: false };
            }
        }

        // 3. Fall back to base spritesheet
        const baseImg = this.images[baseName];
        if (baseImg) {
            return { image: baseImg, isSheet: true };
        }

        return null;
    }

    // Replace a specific color (r,g,b) with transparency, within a tolerance
    applyFuzzyTransparency(name, r, g, b, tolerance = 10) {
        const img = this.images[name];
        if (!img) return;

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // DEBUG: Log the first pixel's color to find the actual background color
        console.log(`[AssetManager] ${name} pixel(0,0): R=${data[0]} G=${data[1]} B=${data[2]} A=${data[3]}`);

        for (let i = 0; i < data.length; i += 4) {
            const dr = Math.abs(data[i] - r);
            const dg = Math.abs(data[i + 1] - g);
            const db = Math.abs(data[i + 2] - b);

            if (dr <= tolerance && dg <= tolerance && db <= tolerance) {
                data[i + 3] = 0; // Set alpha to 0
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // Store the canvas as the new image source
        this.images[name] = canvas;
    }
    // Automatically detect background color from top-left pixel (0,0) and remove it
    applyTransparencyFromCorner(name, tolerance = 10) {
        const img = this.images[name];
        if (!img) return;

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Get key color from top-left pixel
        const r = data[0];
        const g = data[1];
        const b = data[2];

        console.log(`[AssetManager] Auto-Transparency for ${name}: KeyColor=[${r},${g},${b}]`);

        for (let i = 0; i < data.length; i += 4) {
            const dr = Math.abs(data[i] - r);
            const dg = Math.abs(data[i + 1] - g);
            const db = Math.abs(data[i + 2] - b);

            if (dr <= tolerance && dg <= tolerance && db <= tolerance) {
                data[i + 3] = 0; // Set alpha to 0
            }
        }

        ctx.putImageData(imageData, 0, 0);
        this.images[name] = canvas;
    }
}
