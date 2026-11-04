import { getParticlePlacement } from './ScoreParticlePlacement';

describe('getParticlePlacement', () => {
    it('keeps an interior particle under the touch and uses the available outward drift', () => {
        expect(getParticlePlacement(100, 80, 'up', 240, 160, 0)).toEqual({
            left: 30,
            top: 48,
            drift: 48,
        });
    });

    it('clamps an add particle inside the top-left edge', () => {
        expect(getParticlePlacement(0, 0, 'up', 240, 160, -7)).toEqual({
            left: 0,
            top: 0,
            drift: 0,
        });
    });

    it('clamps a subtract particle inside the bottom-right edge', () => {
        expect(getParticlePlacement(240, 160, 'down', 240, 160, 7)).toEqual({
            left: 100,
            top: 96,
            drift: 0,
        });
    });

    it('does not shift a particle away from a touch at the score-side edge', () => {
        expect(getParticlePlacement(120, 160, 'up', 240, 160, 0)).toEqual({
            left: 50,
            top: 128,
            drift: 62,
        });
        expect(getParticlePlacement(120, 0, 'down', 240, 160, 0)).toEqual({
            left: 50,
            top: -32,
            drift: 62,
        });
    });

    it('centers the particle box when the surface is narrower than it', () => {
        expect(getParticlePlacement(0, 50, 'up', 100, 120, 0)).toEqual({
            left: -20,
            top: 18,
            drift: 18,
        });
    });
});
