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

The round currently being edited or viewed. Existing Redux state stores this as `roundCurrent`, a zero-based index.

**Round count**

The number of rounds currently visible for a game. Existing Redux state stores this as `roundTotal`, a count value.

**Round score**

One player's score change for one round.

**Previous total**

A player's total before the current round.

**Current total**

A player's previous total plus the current round score.

**Final total**

A player's total across all rounds. Existing selectors also call this `grandTotal`.

**Winner**

A player selected as a winner after a game is locked.

**Locked game**

A game whose scores are finalized. Locked games show winners and prevent normal score entry.

## UI Concepts

**Game list**

The home screen list of saved games.

**Game screen**

The active scoring screen for the selected game.

**Scoring board**

The active score entry surface on the game screen.

**Tile scoring board**

The grid-based scoring board used by half-tap and swipe interactions.

**Dial scoring board**

The row-based scoring board used by the dial interaction.

**Score log**

The round-by-round score history table. It includes player names, total score, and one column per round.

**Game sheet**

The bottom sheet on the game screen that shows the score log and game actions such as edit, share, choose winners, reset, and rematch.

**Edit game**

The flow for changing a game's title, players, player order, and player membership.

**Edit player**

The flow for changing one player's name and color.

**App settings**

The app-level settings/about/data screen. This is separate from editing a game.

## Score Entry Concepts

**Interaction type**

The selected score input mode. Current values are `half-tap`, `swipe-vertical`, and `dial`.

**Primary point step**

The normal score increment. Existing Redux state stores this as `addendOne`.

**Secondary point step**

The alternate score increment used by long press or hold gestures. Existing Redux state stores this as `addendTwo`.

**Point values**

The user-facing label for primary and secondary point steps.

**Power hold**

A hold gesture that switches score entry from the primary point step to the secondary point step.

## Current Compatibility Notes

Some persisted Redux names are historically inconsistent but should not be renamed without a migration plan:

- `roundCurrent` means current round index.
- `roundTotal` means round count.
- `addendOne` means primary point step.
- `addendTwo` means secondary point step.
- `home_fullscreen` currently controls whether the game sheet is hidden on the game screen.
- `ScoreState` is the persisted player entity shape.

