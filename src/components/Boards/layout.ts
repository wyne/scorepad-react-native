/**
 * Tiles have no margins — each draws a border in the board's background colour,
 * so the gutter between two adjacent tiles is twice this.
 *
 * At the board's edge a tile contributes only one border, so TileBoard pads its
 * own edges by the same amount. Every gutter then reads the same, whether it
 * falls between two tiles or between a tile and the header, sheet or screen.
 */
export const TILE_BORDER_WIDTH = 3;
