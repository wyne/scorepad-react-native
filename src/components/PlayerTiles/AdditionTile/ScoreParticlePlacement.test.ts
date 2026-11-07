import { estimateParticleTextSize, getFlyPath, getParticlePlacement } from './ScoreParticlePlacement';

// "+1" at 30pt: 36 wide, 36 tall.
const TEXT_W = 36;
const TEXT_H = 36;

const place = (x: number, y: number, direction: 'up' | 'down', w: number, h: number, jitter = 0) =>
    getParticlePlacement(x, y, direction, w, h, jitter, TEXT_W, TEXT_H);

describe('estimateParticleTextSize', () => {
    it('scales with the number of characters and the font size', () => {
        expect(estimateParticleTextSize('+1', 30)).toEqual({ width: 36, height: 36 });
        expect(estimateParticleTextSize('−10', 40)).toEqual({ width: 72, height: 48 });
    });
});

describe('getParticlePlacement', () => {
    it('keeps an interior particle under the touch with its full drift', () => {
        // Box is 140x64, so its left/top sit 70/32 before the touch point.
        expect(place(100, 80, 'up', 240, 160)).toEqual({ left: 30, top: 48, drift: 62 });
    });

    it('keeps a particle near the side edge close to the finger', () => {
        // On a 171pt tile a tap 15pt from the edge stays at 18pt (half the text), not 70pt.
        expect(place(15, 80, 'up', 171, 154).left).toBe(18 - 70);
        expect(place(165, 80, 'up', 171, 154).left).toBe(171 - 18 - 70);
    });

    it('shortens drift only by the text height near the outer edge', () => {
        expect(place(100, 50, 'up', 240, 160).drift).toBe(32);
        expect(place(100, 110, 'down', 240, 160).drift).toBe(32);
    });

    it('clamps an add particle inside the top-left edge', () => {
        expect(place(0, 0, 'up', 240, 160, -7)).toEqual({ left: 18 - 70, top: 18 - 32, drift: 0 });
    });

    it('clamps a subtract particle inside the bottom-right edge', () => {
        expect(place(240, 160, 'down', 240, 160, 7)).toEqual({ left: 222 - 70, top: 142 - 32, drift: 0 });
    });

    it('does not shift a particle away from a touch at the score-side edge', () => {
        expect(place(120, 160, 'up', 240, 160)).toEqual({ left: 50, top: 128, drift: 62 });
        expect(place(120, 0, 'down', 240, 160)).toEqual({ left: 50, top: -32, drift: 62 });
    });

    it('lets particles on narrow tiles follow the finger', () => {
        // A 3-column tile is narrower than the 140pt box but much wider than the text.
        expect(place(20, 60, 'up', 110, 120).left).toBe(20 - 70);
        expect(place(100, 60, 'up', 110, 120).left).toBe(110 - 18 - 70);
    });

    it('centers the text when the surface is narrower than it', () => {
        expect(place(0, 50, 'up', 30, 120).left).toBe(15 - 70);
    });
});

describe('getFlyPath', () => {
    it('ends at the round score, just right of the tile middle', () => {
        const up = place(40, 60, 'up', 200, 150);
        const path = getFlyPath(up, 'up', 200, 150, TEXT_H);
        // Start is the touch (40, 60); the score sits at (120, 150) in the add half.
        expect(path.endX).toBe(80);
        expect(path.endY).toBe(90);

        const down = place(40, 60, 'down', 200, 150);
        expect(getFlyPath(down, 'down', 200, 150, TEXT_H)).toEqual(expect.objectContaining({ endX: 80, endY: -60 }));
    });

    it('arcs up and over from the add half, and scoops up from the subtract half', () => {
        expect(getFlyPath(place(40, 100, 'up', 200, 150), 'up', 200, 150, TEXT_H).controlY).toBe(-50);
        expect(getFlyPath(place(40, 60, 'down', 200, 150), 'down', 200, 150, TEXT_H).controlY).toBe(50);
    });

    it('keeps the arc inside the tile near its outer edge', () => {
        // Touch at y=30 in the add half: the arc may only rise to half the text height.
        expect(getFlyPath(place(40, 30, 'up', 200, 150), 'up', 200, 150, TEXT_H).controlY).toBe(18 - 30);
        expect(getFlyPath(place(40, 130, 'down', 200, 150), 'down', 200, 150, TEXT_H).controlY).toBe(132 - 130);
    });
});
