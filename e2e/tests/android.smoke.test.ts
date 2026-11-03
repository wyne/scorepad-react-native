import { $, browser } from '@wdio/globals';

const androidText = (text: string) => (
  `android=new UiSelector().text("${text}")`
);

async function tap(selector: string) {
  const element = $(selector);
  await element.waitForDisplayed({ timeout: 10000 });
  await element.click();
}

async function dismissOnboardingIfPresent() {
  const onboarding = $('~onboarding');
  if (await onboarding.isDisplayed().catch(() => false)) {
    await tap('~Skip onboarding');
    await onboarding.waitForDisplayed({ timeout: 5000, reverse: true });
  }
}

async function swipeUp(selector: string) {
  const element = $(selector);
  await element.waitForDisplayed({ timeout: 10000 });
  const location = await element.getLocation();
  const size = await element.getSize();

  await browser.execute('mobile: swipeGesture', {
    left: location.x,
    top: location.y,
    width: size.width,
    height: size.height,
    direction: 'up',
    percent: 0.5,
  });
}

describe('Android smoke flow', () => {
  it('creates, scores, and finishes a game', async () => {
    await browser.waitUntil(
      async () => {
        const onboarding = await $('~onboarding').isDisplayed().catch(() => false);
        const home = await $('~home-screen').isDisplayed().catch(() => false);
        return onboarding || home;
      },
      { timeout: 20000, timeoutMsg: 'App did not reach onboarding or home' }
    );
    await dismissOnboardingIfPresent();
    await $('~home-screen').waitForDisplayed({ timeout: 15000 });

    await tap('~add-game-button');
    await tap(androidText('2 Players'));
    await $('~edit-game').waitForDisplayed({ timeout: 15000 });
    await tap('~Done');
    await $('~game-screen').waitForDisplayed({ timeout: 15000 });

    await swipeUp('~swipe-overlay-0');
    await tap('~next-round-button');
    await $('~Round 2. Select round').waitForDisplayed({ timeout: 10000 });

    await tap('~game-options-menu');
    await tap(androidText('Dial'));
    await tap('~player-row-0');
    await $('~dial-gesture-area').waitForDisplayed({ timeout: 10000 });
    await tap('~overlay-backdrop');

    await tap('~game-title-button');
    await tap('~choose-winners-button');
    await tap('~winner-player-row-0');
    await tap('~lock-game-button');
    await $('~final-pill').waitForDisplayed({ timeout: 10000 });
  });
});
