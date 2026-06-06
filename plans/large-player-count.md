# Plan: Large Player Count Support

## Context
Currently the app supports up to 20 players (`MAX_PLAYERS` in `src/constants.ts`). The goal is to support dramatically more (e.g., 50+). This touches the gesture system architecture, gesture enforcement logic, performance, and several other areas that need to be addressed before simply bumping the constant.

---

## User-identified concerns (with expanded detail)

### 1. New Game player count selector
**Deferred.** The current FAB menu model (`src/components/FloatingActionButton.tsx:23`) will not be changed as part of this work. The new game flow will be revisited separately once threshold enforcement and performance work is in place.

### 2. Gesture methods must become per-game
**Current**: `interactionType` lives in `SettingsSlice` (`redux/SettingsSlice.ts:13`) — a single global value. `GameScreen.tsx:41–47` uses this to pick `RowsBoard` vs `FlexboxBoard`. `FlexboxTile.tsx:51–52` dynamically loads the interaction component.

**What needs to change**:
- Add `interactionType?: InteractionType` to `GameState` interface (`redux/GamesSlice.ts:13`)
- Add default in `gameDefaults` object (`redux/GamesSlice.ts:34–42`)
- Modify `selectInteractionType` in `redux/selectors.ts:6–16` to accept `gameId`, check game-level setting first, fall back to global (or remove global entirely)
- `GameOptionsButton.tsx:117–145` dispatches `setInteractionType` globally — redirect to a new `setGameInteractionType` action on GamesSlice
- The global setting in SettingsSlice can remain as a "default for new games" preference

### 3. Gesture threshold enforcement (Dial required above N players)
**Threshold**: Need to decide N. FlexboxBoard tiles become unusable (too small for tap/swipe hit targets) above ~12–16 players depending on screen size.

**Events that trigger enforcement**:
- Creating a new game above threshold → force Dial
- Adding a player via SettingsScreen that pushes count over threshold → auto-switch + inform user
- Removing a player via SettingsScreen that drops count below threshold → offer to switch back (don't force)

**UI implications**:
- `GameOptionsButton` gesture menu: disable Tap/Swipe options with explanatory text when above threshold
- SettingsScreen `addPlayerHandler`: after dispatch, check new count against threshold and dispatch gesture change + show toast/alert
- The threshold itself should be a named constant (e.g., `MAX_PLAYERS_FLEXBOX = 12`)

### 4. Performance with large player counts
**Known gaps** (from codebase analysis):
- `AdditionTile` (`src/components/PlayerTiles/AdditionTile/AdditionTile.tsx:24`) is **not memoized** — every score change re-renders all N tiles
- `PlayerListItem` (`src/components/PlayerListItem.tsx:24`) is **not memoized** — re-renders all rows on drag reorder
- `selectSortedPlayerIdsByScore` in `src/components/ScoreLog/SortHelper.ts:30` reduces all scores on every call — O(N) per player = O(N²) total per render
- `FlexboxTile` IS memoized (`src/components/Boards/FlexboxTile.tsx:26`) — this is the right layer; the fix is ensuring props passed to it are stable
- Score update actions (`playerRoundScoreIncrement`, `playerRoundScoreSet`) fire one at a time — fine for interactive gestures

**Recommendations**:
- Wrap `AdditionTile` in `React.memo`
- Wrap `PlayerListItem` in `React.memo`; memoize `renderItem` and `addPlayerHandler` in `SettingsScreen.tsx:121–132` with `useCallback`
- Ensure interaction component dispatch callbacks use `useCallback` (check Swipe, HalfTap, Dial handlers)
- `selectSortedPlayerIdsByScore` already uses `createSelector` — verify the input selectors are granular enough to only recompute when scores actually change
- For RowsBoard (Dial mode, which is the required mode above threshold) — verify each row component subscribes only to its own player's selector, not the full player list

---

## Additional side effects to address

### 5. FlexboxBoard tile size — font & touch target scaling
The grid algorithm (`FlexboxBoard.tsx:37–62`) finds a near-square layout. At 50 players on a phone: ~7×8 grid ≈ 45px wide tiles. The `AdditionTile` font size logic and the tap/swipe hit targets would fail at this size — but since Dial is enforced above threshold, FlexboxBoard won't render for large counts. **Document as a hard constraint, no fix needed.**

### 6. Player color palette wrapping
**No action needed.** All color assignment code paths use modulo wrapping (`index % palette.length`) — confirmed in `GamesSlice.ts:217`, `:257`, `:191`, `:304`, and `SeedData.ts:60`. Colors repeat for large counts (smallest palette is 5 colors, default is 9), but there are no crashes or null-index risks. Color repetition at 50 players is expected and acceptable.

### 7. SettingsScreen player list — setup UX for large counts
**Deferred — UX decision, no blocking technical issue.** The current SettingsScreen works for 50 players; it's tedious but functional. Default names work and players can be renamed in-session. If bulk-rename is desired later, that is a separate feature request.

### 8. ScoreLog view
**Known limitation — defer virtualization.** ScoreLog is not virtualized in either dimension. `Rounds.tsx` uses a plain `ScrollView` with all rounds rendered via `.map()`. `RoundScoreColumn.tsx` and `PlayerNameColumn.tsx` each render all N players via `.map()`. For 50 players × 20 rounds = ~1,050 cells rendered at once. Individual cells (`MemoizedRoundScoreColumn`, `MemoizedPlayerNameCell`, `RoundScoreCell`) are memoized, which prevents unnecessary re-renders but not the initial render cost.

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
**Addressed in item 4.** Uses `react-native-draggable-flatlist` (v4.0.3). `PlayerListItem` is not memoized and `renderItem` is recreated on every render. On drag end, `reorderPlayers` updates the full `playerIds` array causing all rows to re-render. Fix: memoize `PlayerListItem` with `React.memo` and `renderItem` with `useCallback` (same class of fix as `AdditionTile`).

### 11. Redux Persist payload size
With 50 players × many rounds of scores, the serialized state size grows. Unlikely to be a practical problem for dozens of rounds, but worth noting for very long games.

---

## Key files
| Concern | File |
|---|---|
| Max players constant | `src/constants.ts:5` |
| Gesture global setting | `redux/SettingsSlice.ts:13,68–70` |
| Gesture selector | `redux/selectors.ts:6–16` |
| Game state interface | `redux/GamesSlice.ts:13–42` |
| Gesture menu UI | `src/components/Buttons/GameOptionsButton.tsx:50–145` |
| Board selection by gesture | `src/screens/GameScreen.tsx:41–47` |
| Add player handler | `src/screens/SettingsScreen.tsx:71–94` |
| Grid layout algorithm | `src/components/Boards/FlexboxBoard.tsx:37–62` |
| AdditionTile (unmemoized) | `src/components/PlayerTiles/AdditionTile/AdditionTile.tsx:24` |
| PlayerListItem (unmemoized) | `src/components/PlayerListItem.tsx:24` |
| SettingsScreen renderItem | `src/screens/SettingsScreen.tsx:121–132` |
| Sort selector (perf risk) | `src/components/ScoreLog/SortHelper.ts:30` |
| Player color assignment | `redux/GamesSlice.ts:246–275` |
| Game list item names | `src/components/GameListItem.tsx:95–106` |
| ScoreLog render (no virt.) | `src/components/Rounds.tsx` |
| Seed data (for profiling) | `src/components/AppInfo/SeedData.ts` |

---

## Suggested implementation order
1. Define constants: `MAX_PLAYERS_FLEXBOX` threshold, new `MAX_PLAYERS` ceiling
2. **Profile baseline**: extend `SeedData.ts` to generate a 50-player game, then use React DevTools Profiler (via Flipper or standalone) to measure render counts and timing during a score update, a ScoreLog open, and a SettingsScreen drag-reorder. Capture these numbers before any fixes as a baseline.
3. Add `interactionType` to `GameState`, migrate selector, update `GameOptionsButton`
4. Gesture threshold enforcement in add/remove player flows + `GameOptionsButton` UI
5. Performance: memoize `AdditionTile` and `PlayerListItem`; add `useCallback` to `renderItem` and interaction handlers; audit `selectSortedPlayerIdsByScore` input granularity; re-profile to validate improvement
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
- Open ScoreLog with 50 players × 10 rounds → verify no jank
- View game list with 50-player game → verify list item does not overflow
