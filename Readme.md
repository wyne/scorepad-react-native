<img src="assets/icon.png" height="25"> ScorePad with Rounds
---

An open-source, multi-platform score keeping app with per-round score history.

## Website

https://wyne.github.io/scorepad/
## Download

- [Apple App Store (iPhone, iPad, and M1 Mac)](https://apps.apple.com/us/app/scorepad-with-rounds/id1577906063)
- [Google Play Store (Android phones and tablets)](https://play.google.com/store/apps/details?id=com.wyne.scorepad)
- [Web App](https://wyne.github.io/scorepad-app/)

## Screen Shots
| Device | Two Players                                                           | More Players                                                            | Fullscreen                                                                       | Settings                                                                   |
| ------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Phone  | <img src="assets-stores/iphone13pro/home-2-players.png" height="150"> | <img src="assets-stores/iphone13pro/home-4-players.png" height="150">   | <img src="assets-stores/iphone13pro/home-4-players-expanded.png" height="150">   | <img src="assets-stores/iphone13pro/configure-4-players.png" height="150"> |
| Tablet | <img src="assets-stores/ipadpro-11/home-2-players.png" height="150">  | <img src="assets-stores/ipadpro-11/home-many-players.png" height="150"> | <img src="assets-stores/ipadpro-11/home-many-players-expanded.png" height="150"> | <img src="assets-stores/ipadpro-11/configure.png" height="150">            |


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

### Local Build

Prerequisite: `SENTRY_AUTH_TOKEN` in `.env`

```
npx expo run:ios
```

Check eas config settings

```
npx eas config --platform=ios --profile=development
```

Buid .ipa

```
npx eas build --platform ios --profile development --local
```

### Remote Build

```
npx eas build --platform ios
```

### Publish

```
npx eas submit --platform ios --non-interactive
```

Android

```npx eas submit -p android --changes-not-sent-for-review```
