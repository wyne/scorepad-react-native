// How far the number drifts away from the score over its life.
const PARTICLE_DRIFT = 62;
// The box the number is centered in, so it can be placed by its center.
export const PARTICLE_BOX_WIDTH = 140;
export const PARTICLE_BOX_HEIGHT = 64;

// Bold tabular digits and signs are about 0.6em wide, and a line is about 1.2em tall.
const GLYPH_WIDTH_EM = 0.6;
const LINE_HEIGHT_EM = 1.2;

type ParticlePlacement = {
    left: number;
    top: number;
    drift: number;
};

/** The drawn size of a particle's text, which is what has to stay inside the tile. */
export const estimateParticleTextSize = (value: string, fontSize: number) => ({
    width: value.length * fontSize * GLYPH_WIDTH_EM,
    height: fontSize * LINE_HEIGHT_EM,
});

export const getParticlePlacement = (
    x: number,
    y: number,
    direction: 'up' | 'down',
    containerWidth: number,
    containerHeight: number,
    jitter: number,
    textWidth: number,
    textHeight: number
): ParticlePlacement => {
    const width = Math.max(0, containerWidth);
    const height = Math.max(0, containerHeight);
    const halfTextWidth = Math.min(textWidth / 2, width / 2);
    const halfTextHeight = Math.min(textHeight / 2, height / 2);
    const centerX = Math.min(
        Math.max(x + jitter, halfTextWidth),
        Math.max(width - halfTextWidth, halfTextWidth)
    );
    // Only the outer edge clips: a particle drifts away from the score, so
    // the edge toward the score never cuts it off.
    const centerY = direction === 'up'
        ? Math.max(y, halfTextHeight)
        : Math.min(y, Math.max(height - halfTextHeight, halfTextHeight));
    const availableDrift = direction === 'up'
        ? centerY - halfTextHeight
        : height - centerY - halfTextHeight;

    return {
        left: centerX - PARTICLE_BOX_WIDTH / 2,
        top: centerY - PARTICLE_BOX_HEIGHT / 2,
        drift: Math.min(PARTICLE_DRIFT, Math.max(0, availableDrift)),
    };
};
