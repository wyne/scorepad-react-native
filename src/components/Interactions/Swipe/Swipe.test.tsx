/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { playerRoundScoreIncrement } from '../../../../redux/PlayersSlice';

import SwipeVertical from './Swipe';

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  useSharedValue: function (i: unknown) { return { value: i }; },
  useAnimatedStyle: function (fn: () => unknown) { return fn(); },
  useAnimatedReaction: function (_p: () => unknown, r: (c: unknown, p: unknown) => void) {
    (globalThis as any).__react = r;
    r(_p(), undefined);
  },
  runOnJS: function (fn: (...args: unknown[]) => unknown) { return fn; },
  withTiming: function (_t: number) { return _t; },
  default: { View: function () { return null; } },
  createAnimatedComponent: function (c: unknown) { return c; },
}));

jest.mock('../../../Analytics', () => ({ logEvent: function () { } }));
jest.mock('expo-haptics', () => ({
  impactAsync: function () { },
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
}));

jest.mock('react-native-gesture-handler', () => ({
  __esModule: true,
  Gesture: {
    Pan: function () {
      const ph: any = {};
      (globalThis as any).__ph = ph;
      const b: any = {};
      b.enabled = function () { return b; };
      b.minDistance = function () { return b; };
      b.onBegin = function (fn: any) { ph.onBegin = fn; return b; };
      b.onUpdate = function (fn: any) { ph.onUpdate = fn; return b; };
      b.onEnd = function (fn: any) { ph.onEnd = fn; return b; };
      b.onFinalize = function (fn: any) { ph.onFinalize = fn; return b; };
      return b;
    },
  },
  GestureDetector: function (p: any) {
    const ch = p.children;
    return Array.isArray(ch) ? ch[0] : ch;
  },
  State: {},
}));

const stub = function (s: any = {}) { return s; };

beforeEach(() => {
  (globalThis as any).__ph = {};
  (globalThis as any).__react = undefined;
  jest.useRealTimers();
});

const renderSwipe = () => {
  const store = configureStore({
    reducer: { settings: stub, games: stub, players: stub },
    preloadedState: {
      settings: { addendOne: 1, addendTwo: 10, currentGameId: 'game-1', home_fullscreen: false, multiplier: '1', onboarded: null, interactionType: null, showPointParticles: true, _persist: { version: 0, rehydrated: true } },
      games: { ids: ['game-1'], entities: { 'game-1': { id: 'game-1', title: 'Test', dateCreated: Date.now(), roundCurrent: 0, roundTotal: 1, locked: false, playerIds: ['player-1'] } }, _persist: { version: 0, rehydrated: true } },
      players: { ids: ['player-1'], entities: { 'player-1': { id: 'player-1', playerName: 'Test', scores: [0] } }, _persist: { version: 0, rehydrated: true } },
    },
  });
  const dispatch = jest.spyOn(store, 'dispatch');
  render(
    <Provider store={store}>
      <SwipeVertical fontColor="white" index={0} playerId="player-1"><></></SwipeVertical>
    </Provider>
  );
  return { dispatch };
};

const triggerReaction = (totalOffset: number, prevTotalOffset: number) => {
  const react = (globalThis as any).__react;
  if (react) react(totalOffset, prevTotalOffset);
};

describe('SwipeVertical', () => {
  it('renders and captures gesture callbacks', () => {
    renderSwipe();
    expect(typeof (globalThis as any).__ph.onBegin).toBe('function');
    expect(typeof (globalThis as any).__ph.onUpdate).toBe('function');
    expect(typeof (globalThis as any).__ph.onEnd).toBe('function');
    expect(typeof (globalThis as any).__ph.onFinalize).toBe('function');
  });

  it('swiping up dispatches score increment', () => {
    const { dispatch } = renderSwipe();
    const ph = (globalThis as any).__ph;

    ph.onBegin();
    ph.onUpdate({ translationY: -100 });
    triggerReaction(100, 0);
    act(() => {
      ph.onEnd({ translationY: -100 });
      ph.onFinalize();
    });

    expect(dispatch).toHaveBeenCalledWith(
      playerRoundScoreIncrement('player-1', 0, 2)
    );
  });

  it('swiping down dispatches score decrement', () => {
    const { dispatch } = renderSwipe();
    const ph = (globalThis as any).__ph;

    ph.onBegin();
    ph.onUpdate({ translationY: 100 });
    triggerReaction(-100, 0);
    act(() => {
      ph.onEnd({ translationY: 100 });
      ph.onFinalize();
    });

    expect(dispatch).toHaveBeenCalledWith(
      playerRoundScoreIncrement('player-1', 0, -2)
    );
  });

  it('swiping farther dispatches proportionally more', () => {
    const { dispatch } = renderSwipe();
    const ph = (globalThis as any).__ph;

    ph.onBegin();
    ph.onUpdate({ translationY: -250 });
    triggerReaction(250, 0);
    act(() => {
      ph.onEnd({ translationY: -250 });
      ph.onFinalize();
    });

    expect(dispatch).toHaveBeenCalledWith(
      playerRoundScoreIncrement('player-1', 0, 5)
    );
  });

  it('uses addendTwo when powerHold is active', () => {
    const { dispatch } = renderSwipe();
    const ph = (globalThis as any).__ph;
    jest.useFakeTimers();

    ph.onBegin();
    act(() => { jest.advanceTimersByTime(401); });

    ph.onUpdate({ translationY: -100 });
    triggerReaction(100, 0);
    act(() => {
      ph.onEnd({ translationY: -100 });
      ph.onFinalize();
    });

    expect(dispatch).toHaveBeenCalledWith(
      playerRoundScoreIncrement('player-1', 0, 20)
    );
  });

  it('cancels powerHold if user swipes before timer fires', () => {
    const { dispatch } = renderSwipe();
    const ph = (globalThis as any).__ph;
    jest.useFakeTimers();

    ph.onBegin();
    ph.onUpdate({ translationY: -2 });
    triggerReaction(2, 0);

    act(() => { jest.advanceTimersByTime(401); });

    ph.onUpdate({ translationY: -100 });
    triggerReaction(100, 2);
    act(() => {
      ph.onEnd({ translationY: -100 });
      ph.onFinalize();
    });

    expect(dispatch).toHaveBeenCalledWith(
      playerRoundScoreIncrement('player-1', 0, 2)
    );
  });
});
