<img src="assets/icon.png" height="25">
ScorePad with Rounds
---

> An open-source, multi-platform score keeping app with per-round score history.

## Website

https://wyne.github.io/scorepad/
## Download

- [Apple App Store (iPhone, iPad, and M1 Mac)](https://apps.apple.com/us/app/scorepad-with-rounds/id1577906063)
- [Google Play Store (Android phones and tablets)](https://play.google.com/store/apps/details?id=com.wyne.scorepad)
- [Web App](https://wyne.github.io/scorepad-app/)

## Screen Shots
<img src="assets-stores/pixel4xl/Screenshot_20210725-021238.png" width="150">
<img src="assets-stores/pixel4xl/Screenshot_20210725-021323.png" width="150">
<img src="assets-stores/pixel4xl/Screenshot_20210725-021245.png" width="150">

## Contributing

### Run

`expo start`

Then use the expo UI to run on iOS, Android, or web.

### Workflows

Beta Workflow

1. Increment `expo.version` number in `app.json`.
2. Commit and merge to `beta` branch.
3. Github action will publish to `beta` channel.
4. Clients built with `beta` channel will receive the udpate.