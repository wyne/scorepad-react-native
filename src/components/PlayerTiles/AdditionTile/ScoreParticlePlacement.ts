// How far the number drifts away from the score over its life.
const PARTICLE_DRIFT = 62;
// The box the number is centered in, so it can be placed by its center.
export const PARTICLE_BOX_WIDTH = 140;
export const PARTICLE_BOX_HEIGHT = 64;

type ParticlePlacement = {
    left: number;
    top: number;
    drift: number;
};

export const getParticlePlacement = (
    x: number,
    y: number,
    direction: 'up' | 'down',
    containerWidth: number,
    containerHeight: number,
    jitter: number
): ParticlePlacement => {
    const width = Math.max(0, containerWidth);
    const height = Math.max(0, containerHeight);
    const halfVisibleWidth = Math.min(PARTICLE_BOX_WIDTH / 2, width / 2);
    const halfVisibleHeight = Math.min(PARTICLE_BOX_HEIGHT / 2, height / 2);
    const centerX = Math.min(
        Math.max(x + jitter, halfVisibleWidth),
        Math.max(width - halfVisibleWidth, halfVisibleWidth)
    );
    const centerY = direction === 'up'
        ? Math.max(y, halfVisibleHeight)
        : Math.min(y, Math.max(height - halfVisibleHeight, halfVisibleHeight));
    const availableDrift = direction === 'up'
        ? centerY - PARTICLE_BOX_HEIGHT / 2
        : height - centerY - PARTICLE_BOX_HEIGHT / 2;

    return {
        left: centerX - PARTICLE_BOX_WIDTH / 2,
        top: centerY - PARTICLE_BOX_HEIGHT / 2,
        drift: Math.min(PARTICLE_DRIFT, Math.max(0, availableDrift)),
    };
};
