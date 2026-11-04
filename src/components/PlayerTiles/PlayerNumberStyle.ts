/** How a game shows each player's seat number on the board. */
export type PlayerNumberStyle = 'off' | 'badge' | 'big';

export const PLAYER_NUMBER_STYLES: readonly PlayerNumberStyle[] = ['off', 'badge', 'big'];

export const isPlayerNumberStyle = (value: unknown): value is PlayerNumberStyle =>
    typeof value === 'string' && (PLAYER_NUMBER_STYLES as readonly string[]).includes(value);
