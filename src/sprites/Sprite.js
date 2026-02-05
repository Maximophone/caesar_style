/**
 * Base sprite class - interface for rendering
 * Abstracts rendering so we can swap colored rectangles for spritesheets later
 */
export class Sprite {
    render(ctx, x, y, width, height) {
        throw new Error('Sprite.render() must be implemented');
    }
}

/**
 * Simple colored rectangle sprite
 * Used for initial development before pixel art
 */
export class ColorSprite extends Sprite {
    constructor(color) {
        super();
        this.color = color;
    }

    render(ctx, x, y, width, height) {
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, width, height);
    }
}

/**
 * Spritesheet-based sprite for future pixel art
 * Renders a portion of a spritesheet image
 */
export class SheetSprite extends Sprite {
    constructor(image, sx, sy, sw, sh) {
        super();
        this.image = image;   // The spritesheet Image object
        this.sx = sx;         // Source X on spritesheet
        this.sy = sy;         // Source Y on spritesheet
        this.sw = sw;         // Source width
        this.sh = sh;         // Source height
    }

    render(ctx, x, y, width, height) {
        ctx.drawImage(
            this.image,
            this.sx, this.sy, this.sw, this.sh,  // Source rectangle
            x, y, width, height                   // Destination rectangle
        );
    }
}

/**
 * Animated sprite for future use
 * Cycles through frames on a spritesheet
 */
export class AnimatedSprite extends Sprite {
    constructor(image, frames, frameTime = 0.1) {
        super();
        this.image = image;
        this.frames = frames;      // Array of {sx, sy, sw, sh}
        this.frameTime = frameTime;
        this.currentFrame = 0;
        this.elapsed = 0;
    }

    update(deltaTime) {
        this.elapsed += deltaTime;
        if (this.elapsed >= this.frameTime) {
            this.elapsed = 0;
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
        }
    }

    render(ctx, x, y, width, height) {
        const frame = this.frames[this.currentFrame];
        ctx.drawImage(
            this.image,
            frame.sx, frame.sy, frame.sw, frame.sh,
            x, y, width, height
        );
    }
}
