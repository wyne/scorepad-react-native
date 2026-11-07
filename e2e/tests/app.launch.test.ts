import * as fs from 'fs';
import * as path from 'path';

import { $, $$, browser } from '@wdio/globals';

const RECORDINGS_DIR = path.join(__dirname, '../recordings');

function getDeviceSlug(): string {
  const caps = browser.capabilities as Record<string, unknown>;
  const name = (caps['deviceName'] ?? caps['appium:deviceName'] ?? 'unknown') as string;
  return name.toLowerCase().replace(/[\s()]/g, '-').replace(/-+/g, '-');
}

const BUNDLE_ID = 'com.wyne.scorepad';

// Use mobile: commands so gestures route through XCTest's native layer,
// which is required for simulatorTracePointer traces to appear.

async function tap(selector: string) {
  const el = $(selector);
  await el.waitForDisplayed({ timeout: 10000 });
  const loc = await el.getLocation();
  const size = await el.getSize();
  await browser.execute('mobile: tap', {
    x: Math.round(loc.x + size.width / 2),
    y: Math.round(loc.y + size.height / 2),
  });
}

async function tapAt(xPercent: number, yPercent: number) {
  const { width, height } = await browser.getWindowSize();
  await browser.execute('mobile: tap', {
    x: Math.round(width * xPercent),
    y: Math.round(height * yPercent),
  });
}

async function swipeUp(selector: string) {
  const el = $(selector);
  const loc = await el.getLocation();
  const size = await el.getSize();
  const x = Math.round(loc.x + size.width / 2);
  await browser.execute('mobile: dragFromToForDuration', {
    fromX: x,
    fromY: Math.round(loc.y + size.height * 0.75),
    toX: x,
    toY: Math.round(loc.y + size.height * 0.25),
    duration: 0.5,
  });
}

// Swipes right across the top of the dial for the given player index.
// Uses index into the FlatList of dials (all players rendered, most off-screen).
// Waits until the target dial has a positive x coordinate, meaning the overlay
// animation has settled and the correct page is on screen.
async function swipeDialRight(playerIndex: number) {
  const dialArea = $$('~dial-gesture-area')[playerIndex];
  await browser.waitUntil(
    async () => (await dialArea.getLocation()).x >= 0,
    { timeout: 5000, timeoutMsg: `dial-gesture-area[${playerIndex}] did not reach a positive x position within 5s` }
  );
  const loc = await dialArea.getLocation();
  const size = await dialArea.getSize();
  const y = Math.round(loc.y + size.height * 0.175); // upper 35% midpoint
  await browser.execute('mobile: dragFromToForDuration', {
    fromX: Math.round(loc.x + size.width * 0.25),
    fromY: y,
    toX: Math.round(loc.x + size.width * 0.75),
    toY: y,
    duration: 0.5,
  });
}

async function dismissOnboardingIfPresent() {
  const onboarding = $('~onboarding');
  const isOnboarding = await onboarding.isDisplayed().catch(() => false);
  if (isOnboarding) {
    await tap('-ios predicate string:label == "Skip onboarding"');
    await onboarding.waitForDisplayed({ timeout: 5000, reverse: true });
  }
}

describe('App Flow', () => {
  let screenshotsDir: string;

  before(async () => {
    const slug = getDeviceSlug();
    screenshotsDir = path.join(RECORDINGS_DIR, 'screenshots', slug);
    fs.mkdirSync(screenshotsDir, { recursive: true });
    await browser.terminateApp(BUNDLE_ID);
    await browser.activateApp(BUNDLE_ID);
    await browser.startRecordingScreen();
  });

  after(async () => {
    const videoBase64 = await browser.stopRecordingScreen();
    const slug = getDeviceSlug();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const videoPath = path.join(RECORDINGS_DIR, `${slug}_run_${timestamp}.mp4`);
    fs.writeFileSync(videoPath, videoBase64, 'base64');
    console.log(`Video saved: ${videoPath}`);
  });

  it('creates a known three-player game from a clean install', async () => {
    // e2e:install removes the previous app first, so every run starts with the
    // same empty store instead of depending on whichever games a simulator had.
    await browser.waitUntil(
      async () => {
        const onboarding = await $('~onboarding').isDisplayed().catch(() => false);
        const homeScreen = await $('~home-screen').isDisplayed().catch(() => false);
        return onboarding || homeScreen;
      },
      { timeout: 20000, timeoutMsg: 'App did not reach onboarding or home screen within 20s' }
    );
    await dismissOnboardingIfPresent();

    console.log('→ home screen');
    await $('~home-screen').waitForDisplayed({ timeout: 15000 });
    await browser.saveScreenshot(path.join(screenshotsDir, 'home.png'));

    console.log('→ create a three-player game');
    await tap('~add-game-button');
    await tap('-ios predicate string:label == "3 Players"');
    await $('~edit-game').waitForDisplayed({ timeout: 15000 });
    const titleInput = $('~game-title-input');
    await titleInput.waitForDisplayed({ timeout: 10000 });
    await titleInput.clearValue();
    await titleInput.setValue('E2E Game');
    await tap('-ios predicate string:label == "Done"');
    await $('~game-screen').waitForDisplayed({ timeout: 15000 });
    await browser.saveScreenshot(path.join(screenshotsDir, 'game.png'));
  });

  it('scores with swipe and dial gestures across rounds', async () => {
    console.log('→ select swipe mode');
    await tap('~Game Options');
    await tap('-ios predicate string:label == "Swipe"');

    console.log('→ swipe up (increase score)');
    await swipeUp('~swipe-overlay-1');
    await browser.pause(500);
    await browser.saveScreenshot(path.join(screenshotsDir, 'swipe.png'));

    console.log('→ next round');
    await tap('~next-round-button');
    await $('-ios predicate string:label == "Round 2. Select round"').waitForDisplayed({ timeout: 10000 });

    console.log('→ select dial mode');
    await tap('~Game Options');
    await tap('-ios predicate string:label == "Dial"');

    console.log('→ swipe dial (increase score)');
    await tap('~player-row-2');
    await $('~dial-card').waitForDisplayed({ timeout: 10000 });
    await swipeDialRight(2);
    await browser.pause(500);
    await browser.saveScreenshot(path.join(screenshotsDir, 'dial.png'));

    console.log('→ open addend modal');
    await tap('~Game Options');
    await browser.saveScreenshot(path.join(screenshotsDir, 'game-options-menu.png'));
    await tap('-ios predicate string:label CONTAINS "Point Values"');
    await browser.pause(500);
    await browser.saveScreenshot(path.join(screenshotsDir, 'point-values.png'));

    console.log('→ dismiss addend modal');
    await tapAt(0.5, 0.37);
  });

  it('locks a winner and restores the finished game after relaunch', async () => {
    console.log('→ open game sheet');
    await tap('~game-title-button');
    await $('~choose-winners-button').waitForDisplayed({ timeout: 10000 });

    console.log('→ choose winners');
    await tap('~choose-winners-button');
    await browser.pause(1000);
    await browser.saveScreenshot(path.join(screenshotsDir, 'choose-winners.png'));

    console.log('→ select top player');
    await tap('~winner-player-row-0');
    await tap('~lock-game-button');
    await $('~final-pill').waitForDisplayed({ timeout: 10000 });

    console.log('→ relaunch and verify the locked game persists');
    await browser.terminateApp(BUNDLE_ID);
    await browser.activateApp(BUNDLE_ID);
    await browser.waitUntil(
      async () => (
        await $('~game-screen').isDisplayed().catch(() => false)
        || await $('~home-screen').isDisplayed().catch(() => false)
      ),
      { timeout: 20000, timeoutMsg: 'App did not restore to the game or home screen' }
    );

    if (await $('~home-screen').isDisplayed().catch(() => false)) {
      const onlyGame = $$('~game-list-item')[0];
      await onlyGame.waitForDisplayed({ timeout: 10000 });
      const gameLoc = await onlyGame.getLocation();
      const gameSize = await onlyGame.getSize();
      await browser.execute('mobile: tap', {
        x: Math.round(gameLoc.x + gameSize.width / 2),
        y: Math.round(gameLoc.y + gameSize.height / 2),
      });
    }

    await $('~game-screen').waitForDisplayed({ timeout: 15000 });
    await $('~final-pill').waitForDisplayed({ timeout: 10000 });
  });
});
