/**
 * Catalog of every analytics event and its parameter shape.
 *
 * Conventions (enforced by `logEvent`'s generics — see Analytics.ts):
 *  - Event names and param keys are snake_case (GA4 convention).
 *  - One logical field, one name everywhere (e.g. always `game_id`, never `gameId`).
 *  - Params whose source can be undefined are optional; the wrapper strips
 *    null/undefined before sending, so optional params simply drop out.
 *
 * Add new events here. A wrong event name or a mistyped/camelCase param key
 * becomes a compile error at the call site.
 */
export interface AnalyticsEventParams {
    // ── Scoring ─────────────────────────────────────────────────────────────
    score_change: {
        player_index: number;
        game_id?: string;
        /** Which configured step was used (addendOne/addendTwo), not the magnitude. */
        addend: number;
        round: number;
        type: 'increment' | 'decrement';
        power_hold: boolean;
        notches?: number;
        interaction: 'half-tap' | 'swipe-vertical' | 'dial';
    };
    round_change: {
        game_id?: string;
        /** What triggered the change: 'next button' | 'previous button' | 'direct select'. */
        source: string;
        from_round: number;
        to_round: number;
        /** True when advancing created a brand-new round (was on the last round). */
        created_round?: boolean;
    };

    // ── Game lifecycle ──────────────────────────────────────────────────────
    new_game: { game_count: number; player_count: number };
    save_game: { source?: string; game_id?: string; palette?: string; player_count?: number };
    select_game: { list_index: number; game_id: string; player_count: number; round_count: number };
    rematch_game: { game_id: string };
    reset_game: { game_id?: string };
    delete_game: { list_index: number; round_count: number; player_count: number };
    lock_game: { game_id?: string; locked: boolean; winner_count?: number };
    edit_game: { game_id?: string };

    // ── Players ─────────────────────────────────────────────────────────────
    add_player: { game_id?: string; player_count: number };
    remove_player: { game_id?: string; player_index: number };
    edit_player: { game_id?: string; player_index: number };
    edit_players: { game_id?: string; player_count: number };
    reorder_players: { game_id?: string; player_count: number };
    edit_player_back: Record<string, never>;

    // ── Appearance / config ─────────────────────────────────────────────────
    set_player_color: { game_id?: string; palette?: string; color: string; in_current_palette: boolean };
    set_game_palette: { game_id?: string; palette: string };
    /** Fired when the user switches the scoring interaction (swipe / half-tap / dial). */
    set_interaction: { interaction_type: string; game_id?: string };
    fullscreen: { fullscreen: boolean };
    addend_sheet: { install_id?: string };
    addend_one_change: { addend_one: number };
    addend_two_change: { addend_two: number };

    // ── Score log ───────────────────────────────────────────────────────────
    sort_by_index: { game_id?: string };
    sort_by_score: { game_id?: string };

    // ── Game sheet ──────────────────────────────────────────────────────────
    game_sheet_close: Record<string, never>;
    game_sheet_snap: { snap_point_index: number };

    // ── Menus / navigation ──────────────────────────────────────────────────
    /** Header home/back button (the "bars" icon). */
    navigate_home: Record<string, never>;
    menu_share: { round_count: number; player_count: number };
    menu_edit: { round_count: number; player_count: number };
    about_gestures: Record<string, never>;
    app_info: Record<string, never>;
    share_image: Record<string, never>;

    // ── App-level ───────────────────────────────────────────────────────────
    game_list: {
        game_count: number;
        app_opens?: number;
        dev_menu_enabled?: boolean;
        install_id?: string;
        rolling_game_counter?: number;
    };
    toggle_feature: { feature: string; value: boolean; install_id?: string };
    view_version: Record<string, never>;
    dev_menu: { install_id?: string };
}

export type AnalyticsEventName = keyof AnalyticsEventParams;
