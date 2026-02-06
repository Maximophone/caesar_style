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
}
