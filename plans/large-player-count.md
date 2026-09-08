# Plan: Large Player Count Support

## Context
Currently the app supports up to 20 players (`MAX_PLAYERS` in `src/constants.ts`). The goal is to support dramatically more (e.g., 50+). This touches the gesture system architecture, gesture enforcement logic, performance, and several other areas that need to be addressed before simply bumping the constant.

---

## User-identified concerns (with expanded detail)

### 1. New Game player count selector
**Deferred.** The current FAB menu model (`src/components/FloatingActionButton.tsx:23`) will not be changed as part of this work. The new game flow will be revisited separately once threshold enforcement and performance work is in place.

### 2. Gesture methods must become per-game
**✅ Completed in [PR #655](https://github.com/wyne/scorepad-react-native/pull/655) (merged 2026-06-16).**

As shipped:
- `interactionType?: InteractionType` added to the `GameState` interface, with a `setGameInteractionType` action on GamesSlice.
- `selectInteractionType(state, gameId?)` now prefers the game-level gesture and falls back to the global `settings.interactionType`, then validates.
- `GameOptionsButton` reads the per-game gesture; on change it dispatches `setGameInteractionType` for the current game **and** updates the global default (`setInteractionType`), preserving "sticky last choice" so new games inherit the most recently picked gesture while each game keeps its own.
- All read paths route through the game-scoped selector: `GameScreen`, `PlayerTile`, `useGestureHint`, `PointValuesSheet`.

Deviation from the original plan: `interactionType` was intentionally **not** added to `gameDefaults` — leaving it unset lets new games resolve to the global default via the selector fallback (a fixed default there would defeat that). No persist migration was needed for the optional field. Threshold enforcement (§3) is intentionally **not** part of this work.

**Gesture hint rework** (also PR #655): `useGestureHint` now shows the hint when the active gesture differs from a new persisted, global `lastUsedInteractionType` ("the gesture the user last actually used"), replacing the previous per-game score "fingerprint" logic. `lastUsedInteractionType` is updated only when a gesture is *used* (at the three score-commit chokepoints — HalfTap, Swipe, and the Dial deferred flush), never on a gesture change — so switching gestures re-shows the hint until the new one is used once, and opening a game whose gesture differs from the last-used one shows a subtle "different mode here" cue. Settings persist version bumped 3→4 with a migration seeding `lastUsedInteractionType` from the existing global gesture so returning users aren't re-nagged.

### 3. Gesture threshold enforcement (Dial required above N players)
**Still pending — now unblocked.** The per-game gesture prerequisite (§2) is merged (PR #655), so enforcement can set a game's gesture directly via `setGameInteractionType`.

**Threshold**: Need to decide N. FlexboxBoard tiles become unusable (too small for tap/swipe hit targets) above ~12–16 players depending on screen size.

**Events that trigger enforcement**:
- Creating a new game above threshold → force Dial
- Adding a player via `EditGameScreen` that pushes count over threshold → auto-switch + inform user
- Removing a player via `EditGameScreen` that drops count below threshold → offer to switch back (don't force)

**UI implications**:
- `GameOptionsButton` gesture menu: disable Tap/Swipe options with explanatory text when above threshold
- `EditGameScreen` `addPlayerHandler`: after dispatch, check new count against threshold and dispatch gesture change + show toast/alert
- The threshold itself should be a named constant (e.g., `MAX_PLAYERS_FLEXBOX = 12`)

### 4. Performance with large player counts

**✅ Completed across [PR #621](https://github.com/wyne/scorepad-react-native/pull/621) (merged 2026-06-07) and [PR #633](https://github.com/wyne/scorepad-react-native/pull/633) (merged 2026-06-09)** — Dial/RowsBoard path is now large-player-count ready:

| Metric | Before | After |
|--------|--------|-------|
| Score commit cost | ~2,500ms | ~5ms (~500×) |
| React renders during drag | ~2 per frame | 0 |
| Players mounted in FlatList | All N | 3 (windowSize=3) |
| `PlayerRow` re-renders per score | 20 | 1 |
| `PlayerDialPage` re-renders per score | 20 | 1 |
| `DialControl` re-renders per score | 20 | **0** |
| Redux writes during dial drag | 1 per notch | **0 until gesture end** |
| RowsBoard commit on overlay open | 63ms (all rows) | 37ms (rows bail out) |
| Overlay visible at first paint | ~172ms post-tap | ~0ms (mid-animation) |

Specific changes merged:
- `PlayerRow`, `PlayerDialPage`, `DialOverlay` wrapped in `React.memo` with stable `useCallback` references
- `DialControl` score text driven by `SharedValue<number>` + `useAnimatedProps` — bypasses React reconciliation entirely
- `dimmed` boolean prop replaced with `SharedValue<boolean>` — all rows bail out on overlay open
- `FlatList` capped to `windowSize=3` + `initialScrollIndex` — eliminates player-count proportional lag
- All drag visual state (notch, trail arc, full-circle) moved to Reanimated UI thread via `useAnimatedProps` worklets
- [PR #633](https://github.com/wyne/scorepad-react-native/pull/633) moved live dial score and total updates to shared values during fast spins, then flushes the final pending round score to Redux once on gesture end/finalize
- `playerRoundScoreSet` now bails out when the requested round score already matches the stored score, avoiding unchanged writes from forcing downstream selector/re-render work
- Dial center value text now scales for larger signed values so fast score changes do not overflow the control
- `GameSheet` conditionally renders score columns — eliminates all ScoreLog Redux subscriptions when sheet is collapsed
- `useGestureHint` lifted to `GameScreen` (PR #621), then **reworked in [PR #655](https://github.com/wyne/scorepad-react-native/pull/655)** to derive purely from the persisted `lastUsedInteractionType` vs. the active gesture — this removed its per-game score subscription entirely (see §2)

**Still pending** (FlexboxBoard path and EditGameScreen):
- `AdditionTile` (`src/components/PlayerTiles/AdditionTile/AdditionTile.tsx`) is **not memoized** — every score change re-renders all N tiles (less critical now that Dial is enforced above threshold)
- ✅ `PlayerListItem` (`src/components/PlayerListItem.tsx`) is now memoized with `React.memo`
- `EditGameScreen.tsx` (formerly `SettingsScreen.tsx`) — the drag-list `renderItem` and `addPlayerHandler` are not wrapped in `useCallback`, which defeats the now-memoized `PlayerListItem`
- `selectSortedPlayerIdsByScore` in `src/components/ScoreLog/SortHelper.ts` — audit input selector granularity for O(N²) risk

---

## Additional side effects to address

### 5. FlexboxBoard tile size — font & touch target scaling
The grid algorithm (`FlexboxBoard.tsx:37–62`) finds a near-square layout. At 50 players on a phone: ~7×8 grid ≈ 45px wide tiles. The `AdditionTile` font size logic and the tap/swipe hit targets would fail at this size — but since Dial is enforced above threshold, FlexboxBoard won't render for large counts. **Document as a hard constraint, no fix needed.**

### 6. Player color palette wrapping
**No action needed.** All color assignment code paths use modulo wrapping (`index % palette.length`) — confirmed in `GamesSlice.ts:217`, `:257`, `:191`, `:304`, and `SeedData.ts:60`. Colors repeat for large counts (smallest palette is 5 colors, default is 9), but there are no crashes or null-index risks. Color repetition at 50 players is expected and acceptable.

### 7. EditGameScreen player list — setup UX for large counts
**Deferred — UX decision, no blocking technical issue.** The current `EditGameScreen` (formerly `SettingsScreen`) works for 50 players; it's tedious but functional. Default names work and players can be renamed in-session. If bulk-rename is desired later, that is a separate feature request.

### 8. ScoreLog view
**Known limitation — defer virtualization.** ScoreLog is not virtualized in either dimension. `ScoreLogTable.tsx` (formerly `Rounds.tsx`) uses a plain `ScrollView` with all rounds rendered via `.map()`. `RoundScoreColumn.tsx` and `PlayerNameColumn.tsx` each render all N players via `.map()`. For 50 players × 20 rounds = ~1,050 cells rendered at once. Individual cells (`MemoizedRoundScoreColumn`, `MemoizedPlayerNameCell`, `RoundScoreCell`) are memoized, which prevents unnecessary re-renders but not the initial render cost.

If profiling shows ScoreLog is a bottleneck, the fix is replacing the horizontal `ScrollView` wrapping rounds with a `FlatList` and the vertical player maps with `FlatList`s as well — a significant refactor tracked separately.

### 9. Game list item display
**Action needed.** `GameListItem.tsx:95–106` renders all player names inline with `flexWrap: 'wrap'` and no truncation. For 50 players this produces a verbose multi-line block. A player count badge already exists on line 101–103.

**Fix:** Two-file change:

1. **`GameListItemPlayerName.tsx`** — remove the `View` wrapper from the winner case and replace the `Icon` component with the `🏆` emoji so the component always returns a `Text` (never a `View`). This makes it safe to use as an inline child of a parent `Text`.

   ```jsx
   // Winner case — after:
   <Text style={[styles.winnerText, { color: theme.text }]}>
     🏆 {playerName}{!last && ', '}
   </Text>
   ```

2. **`GameListItem.tsx:95–106`** — replace the `View` wrapper with a `<Text numberOfLines={2} ellipsizeMode="tail">` parent, and sort `playerIds` so winners (from `winnerIds`) come first before mapping.

Note: `🏆` renders in its native gold color regardless of `theme.warning`. Acceptable for now; can be revisited with an Ionicons font character if strict theme matching is needed later.

### 10. Settings screen reorder (drag-and-drop)
**Partially addressed (see item 4).** The reorder list (now `EditGameScreen.tsx`) uses `react-native-draggable-flatlist` (v4.0.3). ✅ `PlayerListItem` is now memoized with `React.memo`. Still pending: `renderItem` is recreated on every render (defeating that memoization) — wrap it (and `addPlayerHandler`) in `useCallback`. On drag end, `reorderPlayers` updates the full `playerIds` array.

### 11. Redux Persist payload size
With 50 players × many rounds of scores, the serialized state size grows. Unlikely to be a practical problem for dozens of rounds, but worth noting for very long games.

---

## Key files
| Concern | File |
|---|---|
| Max players constant | `src/constants.ts:5` |
| Gesture global default + last-used | `redux/SettingsSlice.ts` (`interactionType`, `lastUsedInteractionType`) |
| Gesture selector (per-game) | `redux/selectors.ts` — `selectInteractionType(state, gameId?)` |
| Game state interface | `redux/GamesSlice.ts` (`interactionType?`, `setGameInteractionType`) |
| Gesture menu UI | `src/components/Buttons/GameOptionsButton.tsx` |
| Board selection by gesture | `src/screens/GameScreen.tsx` |
| Add player handler | `src/screens/EditGameScreen.tsx` |
| Grid layout algorithm | `src/components/Boards/FlexboxBoard.tsx:37–62` |
| AdditionTile (unmemoized) | `src/components/PlayerTiles/AdditionTile/AdditionTile.tsx` |
| PlayerListItem (memoized ✅) | `src/components/PlayerListItem.tsx` |
| EditGameScreen drag-list renderItem | `src/screens/EditGameScreen.tsx` |
| Sort selector (perf risk) | `src/components/ScoreLog/SortHelper.ts` |
| Player color assignment | `redux/GamesSlice.ts` |
| Game list item names | `src/components/GameListItem.tsx:95–106` |
| ScoreLog render (no virt.) | `src/components/ScoreLogTable.tsx` |
| Seed data (for profiling) | `src/components/AppInfo/SeedData.ts` |

---

## Suggested implementation order
1. Define constants: `MAX_PLAYERS_FLEXBOX` threshold, new `MAX_PLAYERS` ceiling
2. **Profile baseline**: extend `SeedData.ts` to generate a 50-player game, then use React DevTools Profiler (via Flipper or standalone) to measure render counts and timing during a score update, a ScoreLog open, and an `EditGameScreen` drag-reorder. Capture these numbers before any fixes as a baseline. *(Baseline captured as part of PR #621 work — see metrics in section 4 above)*
3. ✅ **Done ([PR #655](https://github.com/wyne/scorepad-react-native/pull/655))**: Added `interactionType` to `GameState`, made `selectInteractionType` game-aware, updated `GameOptionsButton` (per-game + sticky global default), and reworked the gesture hint to key off `lastUsedInteractionType` (see §2)
4. Gesture threshold enforcement in add/remove player flows + `GameOptionsButton` UI *(now unblocked — per-game gesture from step 3 is in place)*
5. **Performance** (partially complete):
   - ✅ **Done (PR #621)**: Dial/RowsBoard path — `PlayerRow`, `PlayerDialPage`, `DialOverlay` memoized; `DialControl` score display via Reanimated SharedValues; FlatList windowed to 3 pages; drag state on UI thread; overlay entrance animation pre-fired; `useGestureHint` lifted to `GameScreen` (later reworked in PR #655 — see §2/§4)
   - ✅ **Done (PR #633)**: Dial drag no longer dispatches Redux updates for every notch; visible round score/new total stay on shared values during the gesture and only the final score is committed at gesture end/finalize. Unchanged round score writes are skipped in `PlayersSlice`.
   - 🔲 **Remaining**: memoize `AdditionTile`; `useCallback` for the drag-list `renderItem`/`addPlayerHandler` in `EditGameScreen` (`PlayerListItem` is already memoized ✅); audit `selectSortedPlayerIdsByScore` input selectors; re-profile to validate
6. Fix `GameListItem` player name truncation (`GameListItem.tsx:95–106`)
7. *(Deferred)* New game player count picker UI
8. *(Deferred, if profiling shows need)* ScoreLog virtualization

---

## Verification
- Extend seed data to generate a 50-player game and use it throughout testing
- Profile with React DevTools before and after performance fixes (step 2 → step 5) to confirm memoization reduces re-render count
- Create a new game with 50 players → verify Dial is forced, RowsBoard renders
- Add players past threshold mid-game → verify gesture auto-switches with user feedback
- Remove players below threshold → verify option to switch back is offered
- Score changes with 50 players → verify no visible lag on gesture interaction
- Fast dial spins with 50 players → verify the dial value/total update smoothly during the gesture and Redux receives only the final score after release
- Open ScoreLog with 50 players × 10 rounds → verify no jank
- View game list with 50-player game → verify list item does not overflow
