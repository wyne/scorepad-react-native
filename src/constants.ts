export const systemBlue = '#0a84ff';
export const STORAGE_KEY = {
    GAMES_LIST: '@games_list',
};
export const MAX_PLAYERS = 50;
// The tile board fits every player on one screen, so past this many the tiles
// get too small to read and tap. Bigger games use the Dial gesture, whose list
// scrolls.
export const MAX_TILE_PLAYERS = 20;
export const FEATURE_KEEP_SCREEN_AWAKE = 'keep_screen_awake';
export const FEATURE_DIAL_GESTURE = 'dial_gesture';
export const FEATURE_GAME_MODES = 'game_modes';
// Features whose "new" dot sits on a row of the App Settings screen. Any of
// them unseen badges the settings button so people find the row.
export const SETTINGS_FEATURE_NOTIFICATIONS = [FEATURE_KEEP_SCREEN_AWAKE, FEATURE_GAME_MODES];
// Every feature that can show a "new" badge. Fresh installs start with all of
// these marked seen, so badges only reach existing users who update.
export const FEATURE_NOTIFICATIONS = [FEATURE_KEEP_SCREEN_AWAKE, FEATURE_DIAL_GESTURE, FEATURE_GAME_MODES];
