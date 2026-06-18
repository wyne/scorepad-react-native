/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer, { roundNext } from '../../../../redux/GamesSlice';
import playersReducer, { playerRoundScoreIncrement } from '../../../../redux/PlayersSlice';
import settingsReducer, { initialState as settingsInitialState } from '../../../../redux/SettingsSlice';

import SwipeVertical from './Swipe';

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  useSharedValue: function (i: unknown) { return { value: i }; },
  useAnimatedStyle: function (fn: () => unknown) { return fn(); },
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

beforeEach(() => {
  (globalThis as any).__ph = {};
  jest.useRealTimers();
});

const renderSwipe = ({ onRender }: { onRender?: (id: string) => void; } = {}) => {
  const store = configureStore({
    reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
    preloadedState: {
      settings: { ...settingsInitialState, addendOne: 1, addendTwo: 10, currentGameId: 'game-1', showPointParticles: true },
      games: { ids: ['game-1'], entities: { 'game-1': { id: 'game-1', title: 'Test', dateCreated: Date.now(), roundCurrent: 0, roundTotal: 1, locked: false, playerIds: ['player-1'] } }, _persist: { version: 0, rehydrated: true } },
      players: { ids: ['player-1'], entities: { 'player-1': { id: 'player-1', playerName: 'Test', scores: [0] } }, _persist: { version: 0, rehydrated: true } },
    },
  });
  const dispatch = jest.spyOn(store, 'dispatch');
  render(
    <Provider store={store}>
      <SwipeVertical fontColor="white" index={0} playerId="player-1" onRender={onRender}><></></SwipeVertical>
    </Provider>
  );
  return { dispatch, store };
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
    expect(dispatch).not.toHaveBeenCalledWith(
      playerRoundScoreIncrement('player-1', 0, 2)
    );

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
    act(() => {
      ph.onEnd({ translationY: -250 });
      ph.onFinalize();
    });

    expect(dispatch).toHaveBeenCalledWith(
      playerRoundScoreIncrement('player-1', 0, 5)
    );
  });

  it('uses addendTwo when secondaryHold is active', () => {
    const { dispatch } = renderSwipe();
    const ph = (globalThis as any).__ph;
    jest.useFakeTimers();

    ph.onBegin();
    act(() => { jest.advanceTimersByTime(401); });

    ph.onUpdate({ translationY: -100 });
    act(() => {
      ph.onEnd({ translationY: -100 });
      ph.onFinalize();
    });

    expect(dispatch).toHaveBeenCalledWith(
      playerRoundScoreIncrement('player-1', 0, 20)
    );
  });

  it('cancels secondaryHold if user swipes before timer fires', () => {
    const { dispatch } = renderSwipe();
    const ph = (globalThis as any).__ph;
    jest.useFakeTimers();

    ph.onBegin();
    ph.onUpdate({ translationY: -2 });

    act(() => { jest.advanceTimersByTime(401); });

    ph.onUpdate({ translationY: -100 });
    act(() => {
      ph.onEnd({ translationY: -100 });
      ph.onFinalize();
    });

    expect(dispatch).toHaveBeenCalledWith(
      playerRoundScoreIncrement('player-1', 0, 2)
    );
  });

  it('flushes only once when onEnd and onFinalize both run', () => {
    const { dispatch } = renderSwipe();
    const ph = (globalThis as any).__ph;
    const expectedAction = playerRoundScoreIncrement('player-1', 0, 2);

    ph.onBegin();
    ph.onUpdate({ translationY: -100 });

    act(() => {
      ph.onEnd({ translationY: -100 });
      ph.onFinalize();
    });

    expect(dispatch.mock.calls.filter(([action]) => {
      const dispatchedAction = action as typeof expectedAction;
      return (
        dispatchedAction.type === expectedAction.type &&
        dispatchedAction.payload === expectedAction.payload &&
        dispatchedAction.meta.round === expectedAction.meta.round &&
        dispatchedAction.meta.multiplier === expectedAction.meta.multiplier
      );
    })).toHaveLength(1);
  });

  it('does not re-render solely because the current round changes', () => {
    const onRender = jest.fn();
    const { store } = renderSwipe({ onRender });

    expect(onRender).toHaveBeenCalledTimes(1);
    onRender.mockClear();

    act(() => {
      store.dispatch(roundNext('game-1'));
    });

    expect(onRender).not.toHaveBeenCalled();
  });

  it('scores against the latest round after a round change', () => {
    const { dispatch, store } = renderSwipe();
    const ph = (globalThis as any).__ph;

    act(() => {
      store.dispatch(roundNext('game-1'));
    });
    dispatch.mockClear();

    ph.onBegin();
    ph.onUpdate({ translationY: -100 });
    act(() => {
      ph.onEnd({ translationY: -100 });
      ph.onFinalize();
    });

    expect(dispatch).toHaveBeenCalledWith(
      playerRoundScoreIncrement('player-1', 1, 2)
    );
  });
});
