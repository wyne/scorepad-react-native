export function readableTextColor(hex: string): '#000' | '#fff' {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return L > 0.42 ? '#000' : '#fff';
}

export function withInkOpacity(ink: string, opacity: number): string {
    return ink === '#000' ? `rgba(0,0,0,${opacity})` : `rgba(255,255,255,${opacity})`;
}
