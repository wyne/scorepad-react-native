import * as fs from 'fs';
import * as path from 'path';

import { $, $$, browser } from '@wdio/globals';

const RECORDINGS_DIR = path.join(__dirname, '../recordings');
const SCREENSHOTS_DIR = path.join(RECORDINGS_DIR, 'screenshots');

const BUNDLE_ID = 'com.wyne.scorepad.dev';

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
  before(async () => {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    await browser.terminateApp(BUNDLE_ID);
    await browser.activateApp(BUNDLE_ID);
    await browser.startRecordingScreen();
  });

  after(async () => {
    const videoBase64 = await browser.stopRecordingScreen();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const videoPath = path.join(RECORDINGS_DIR, `run_${timestamp}.mp4`);
    fs.writeFileSync(videoPath, videoBase64, 'base64');
    console.log(`Video saved: ${videoPath}`);
  });

  it('navigates through a full game flow', async () => {
    // Wait for app to settle on home screen (or dismiss onboarding first)
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
    await browser.saveScreenshot(path.join(SCREENSHOTS_DIR, 'home.png'));

    console.log('→ tap game (index 2)');
    const thirdGame = $$('~game-list-item')[2];
    await thirdGame.waitForDisplayed({ timeout: 10000 });
    const gameLoc = await thirdGame.getLocation();
    const gameSize = await thirdGame.getSize();
    await browser.execute('mobile: tap', {
      x: Math.round(gameLoc.x + gameSize.width / 2),
      y: Math.round(gameLoc.y + gameSize.height / 2),
    });
    await browser.saveScreenshot(path.join(SCREENSHOTS_DIR, 'game.png'));

    console.log('→ open game sheet');
    await browser.pause(2000);
    await tap('~game-title-button');
    await browser.pause(2000);
    await browser.saveScreenshot(path.join(SCREENSHOTS_DIR, 'game-sheet.png'));

    console.log('→ edit game');
    await tap('~edit-game-and-players');
    await $('~edit-game').waitForDisplayed({ timeout: 15000 });
    await browser.saveScreenshot(path.join(SCREENSHOTS_DIR, 'edit-game.png'));

    console.log('→ save game');
    await tap('-ios predicate string:label == "Save Game"');

    console.log('→ select swipe mode');
    await tap('~game-options-menu');
    await tap('-ios predicate string:label == "Swipe"');

    console.log('→ swipe up (increase score)');
    await swipeUp('~swipe-overlay-1');
    await browser.pause(500);

    console.log('→ next round');
    await tap('~next-round-button');

    console.log('→ select dial mode');
    await tap('~game-options-menu');
    await tap('-ios predicate string:label == "Dial"');

    console.log('→ swipe dial (increase score)');
    await tap('~player-row-2');
    await swipeDialRight(2);
    await browser.pause(500);

    console.log('→ open addend modal');
    await tap('~game-options-menu');
    await tap('-ios predicate string:label CONTAINS "Point Values"');

    console.log('→ dismiss addend modal');
    await tapAt(0.5, 0.37);

    console.log('→ open game sheet');
    await tap('~game-title-button');
    await browser.pause(1000);

    console.log('→ choose winners');
    await tap('~choose-winners-button');
    await browser.pause(1000);
    await browser.saveScreenshot(path.join(SCREENSHOTS_DIR, 'choose-winners.png'));

    console.log('→ select top player');
    await tap('~winner-player-row-0');
  });
});
