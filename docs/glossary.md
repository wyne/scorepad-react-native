# ScorePad Glossary

This glossary names the main product and code concepts used throughout ScorePad. It is intended to keep UI text, component names, tests, analytics, and future refactors aligned.

## Product Concepts

**Game**

A saved score keeping session. A game has a title, creation date, ordered players, round position, round count, lock state, winners, sorting preferences, and a color palette.

**Player**

A participant in a game. Players are stored independently from games and are linked to a game by id.

**Round**

One score entry per player at a shared index. Internally, rounds are represented by indexes into each player's score array.

**Current round**

The round currently being edited or viewed. Code refers to its zero-based index as `currentRoundIndex`. Persisted Redux state stores this as `roundCurrent`.

**Round count**

The number of rounds currently visible for a game. Code refers to this as `roundCount`. Persisted Redux state stores this as `roundTotal`.

**Current round score**

One player's score change for the current round. Code name: `currentRoundScore`.

**Previous total**

A player's total before the current round. Code name: `previousTotal`.

**Current round total score**

A player's previous total plus the current round score. Code name: `currentRoundTotalScore`.

**Grand total score**

A player's score across all rounds. Code name: `grandTotalScore`. This is the single term for a player's overall total; do not introduce variants such as "final total".

**Winner**

A player selected as a winner after a game is locked.

**Locked game**

A game whose scores are finalized. Locked games show winners and prevent normal score entry.

## UI Concepts

### Screens

**Game list**

The home screen that lists saved games.

**Game screen**

The active scoring screen for the selected game.

**Edit game screen**

The screen for changing a game's title, players, player order, and player membership.

**Edit player screen**

The screen for changing one player's name and color.

**Share screen**

The screen for previewing and sharing a game's score log.

**App settings screen**

The app-level settings, about, and data screen. This is separate from editing a game.

### Sheets

A sheet is a panel that slides up from the bottom of the screen. All current ScorePad sheets are bottom sheets; "modal" is reserved for centered dialog windows, and ScorePad currently has none.

**Game sheet**

The bottom sheet on the game screen that shows the score log and game actions such as edit, share, choose winners, reset, and rematch.

**Point values sheet**

The sheet for changing the two addends. Component: `PointValuesSheet`, named after its on-screen title "Point Values".

**Choose winners sheet**

The sheet for selecting winners and locking a game. Component: `ChooseWinnersSheet`.

**Gesture info sheet**

The sheet that explains the currently selected score entry interaction. Component: `GestureInfoSheet`.

### Boards, Tables, and Overlays

**Scoring board**

The active score entry surface on the game screen.

**Tile grid**

A grid layout for player scoring tiles. This is a board layout concept, not a score entry interaction.

**Player rows**

A row layout for players on the scoring board. This is a board layout concept, not a score entry interaction.

**Score log**

The round-by-round score history table. It includes player names, grand total score, and one column per round.

**Dial overlay**

The overlay that presents the dial control for one player at a time.

## Score Entry Concepts

**Interaction type**

The selected score input mode. Current values are `half-tap`, `swipe-vertical`, and `dial`.

**Half-tap interaction**

The score entry interaction that splits each player's scoring surface into increment and decrement tap zones.

**Swipe interaction**

The score entry interaction that changes score by vertical drag distance.

**Dial interaction**

The score entry interaction that changes score by rotating a dial control. This is independent from whether the board is arranged as tiles or rows.

**Addend**

A score increment. There are two: `addendOne` is the normal increment applied by a tap, swipe notch, or dial step; `addendTwo` is the alternate (usually larger) increment used while a long press or secondary hold is active. These names are used end-to-end — persisted Redux state, actions, analytics, and component code all spell them the same way.

**Point values**

The user-facing label for the addend pair (`addendOne` and `addendTwo`).

**Secondary hold**

A hold gesture that switches score entry from `addendOne` to `addendTwo`. Code name: `secondaryHold` (formerly "power hold").

## Current Compatibility Notes

Some persisted Redux names and analytics keys are historically inconsistent. They must keep their stored spelling (renaming persisted keys requires a migration plan, and renaming analytics keys breaks reporting continuity), but new code should use the glossary term on the right:

- `roundCurrent` (persisted) → `currentRoundIndex`
- `roundTotal` (persisted) → `roundCount`
- `power_hold` (analytics param) → secondary hold
- `home_fullscreen` (persisted) currently controls whether the game sheet is hidden on the game screen.
- `ScoreState` is the persisted player entity shape.

Non-persisted selector outputs were renamed directly: `currentTotal` → `currentRoundTotalScore`, `grandTotal` → `grandTotalScore`, `roundScore` → `currentRoundScore`.
