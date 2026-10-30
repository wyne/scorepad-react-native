export const systemBlue = '#0a84ff';
export const STORAGE_KEY = {
    GAMES_LIST: '@games_list',
};
export const MAX_PLAYERS = 20;
export const FEATURE_KEEP_SCREEN_AWAKE = 'keep_screen_awake';
export const FEATURE_DIAL_GESTURE = 'dial_gesture';
// Every feature that can show a "new" badge. Fresh installs start with all of
// these marked seen, so badges only reach existing users who update.
export const FEATURE_NOTIFICATIONS = [FEATURE_KEEP_SCREEN_AWAKE, FEATURE_DIAL_GESTURE];
