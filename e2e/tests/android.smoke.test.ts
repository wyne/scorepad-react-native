import { $, browser } from '@wdio/globals';

const androidText = (text: string) => (
  `android=new UiSelector().text("${text}")`
);

const byTestId = (id: string) => (
  `android=new UiSelector().resourceId("${id}")`
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
    console.log('→ wait for home');
    await browser.waitUntil(
      async () => {
        const onboarding = await $('~onboarding').isDisplayed().catch(() => false);
        const home = await $(byTestId('home-screen')).isDisplayed().catch(() => false);
        return onboarding || home;
      },
      { timeout: 20000, timeoutMsg: 'App did not reach onboarding or home' }
    );
    await dismissOnboardingIfPresent();
    await $(byTestId('home-screen')).waitForDisplayed({ timeout: 15000 });

    console.log('→ create game');
    await tap(byTestId('add-game-button'));
    await tap(androidText('2 Players'));
    await $(byTestId('edit-game')).waitForDisplayed({ timeout: 15000 });
    await tap('~Done');
    await $(byTestId('game-screen')).waitForDisplayed({ timeout: 15000 });

    console.log('→ score and advance round');
    await swipeUp(byTestId('swipe-overlay-0'));
    await tap(byTestId('next-round-button'));
    await $(androidText('2 of 2')).waitForDisplayed({ timeout: 10000 });

    console.log('→ open dial');
    await tap(byTestId('game-options-menu'));
    console.log('→ choose dial');
    await tap(androidText('Dial'));
    console.log('→ choose first player');
    await tap(byTestId('player-row-0'));
    console.log('→ wait for dial');
    await $(byTestId('dial-gesture-area')).waitForDisplayed({ timeout: 10000 });
    console.log('→ close dial');
    await tap(byTestId('overlay-backdrop'));

    console.log('→ choose winner and lock game');
    await tap(byTestId('game-title-button'));
    await tap(byTestId('choose-winners-button'));
    await tap(byTestId('winner-player-row-0'));
    await tap(byTestId('lock-game-button'));
    await $(byTestId('final-pill')).waitForDisplayed({ timeout: 10000 });
    console.log('→ game locked');
  });
});
