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
- `useGestureHint` fixed to use `useHasAnyScore` (stable boolean) instead of score fingerprint sum
- `useGestureHint` lifted to `GameScreen` so state survives gesture-type switches

**Still pending** (FlexboxBoard path and SettingsScreen):
- `AdditionTile` (`src/components/PlayerTiles/AdditionTile/AdditionTile.tsx:24`) is **not memoized** — every score change re-renders all N tiles (less critical now that Dial is enforced above threshold)
- `PlayerListItem` (`src/components/PlayerListItem.tsx:24`) is **not memoized** — re-renders all rows on drag reorder
- `SettingsScreen.tsx:121–132` — `renderItem` and `addPlayerHandler` not wrapped in `useCallback`
- `selectSortedPlayerIdsByScore` in `src/components/ScoreLog/SortHelper.ts:30` — audit input selector granularity for O(N²) risk

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
2. **Profile baseline**: extend `SeedData.ts` to generate a 50-player game, then use React DevTools Profiler (via Flipper or standalone) to measure render counts and timing during a score update, a ScoreLog open, and a SettingsScreen drag-reorder. Capture these numbers before any fixes as a baseline. *(Baseline captured as part of PR #621 work — see metrics in section 4 above)*
3. Add `interactionType` to `GameState`, migrate selector, update `GameOptionsButton`
4. Gesture threshold enforcement in add/remove player flows + `GameOptionsButton` UI
5. **Performance** (partially complete):
   - ✅ **Done (PR #621)**: Dial/RowsBoard path — `PlayerRow`, `PlayerDialPage`, `DialOverlay` memoized; `DialControl` score display via Reanimated SharedValues; FlatList windowed to 3 pages; drag state on UI thread; overlay entrance animation pre-fired; `useGestureHint` fixed and lifted
   - ✅ **Done (PR #633)**: Dial drag no longer dispatches Redux updates for every notch; visible round score/new total stay on shared values during the gesture and only the final score is committed at gesture end/finalize. Unchanged round score writes are skipped in `PlayersSlice`.
   - 🔲 **Remaining**: memoize `AdditionTile`; memoize `PlayerListItem` + `useCallback` for `renderItem`/`addPlayerHandler` in `SettingsScreen`; audit `selectSortedPlayerIdsByScore` input selectors; re-profile to validate
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
