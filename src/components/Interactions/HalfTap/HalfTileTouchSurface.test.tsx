/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render } from '@testing-library/react-native';
import { TouchableHighlight } from 'react-native';
import { Provider } from 'react-redux';

import gamesReducer, { roundNext } from '../../../../redux/GamesSlice';
import playersReducer, { playerRoundScoreIncrement } from '../../../../redux/PlayersSlice';
import settingsReducer, { initialState as settingsInitialState } from '../../../../redux/SettingsSlice';

import HalfTap from './HalfTap';
import { HalfTileTouchSurface } from './HalfTileTouchSurface';

jest.mock('../../../Analytics', () => ({ logEvent: function () { } }));
jest.mock('expo-haptics', () => ({
  impactAsync: function () { },
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
}));
const mockScoreParticle = jest.fn();
jest.mock('../../PlayerTiles/AdditionTile/ScoreParticle', () => ({
  PARTICLE_DURATION: 750,
  ScoreParticle: function (props: unknown) { mockScoreParticle(props); return null; },
}));

let mockMenuOpen = false;
jest.mock('../../MenuOpenContext', () => ({
  useMenuOpen: function () { return { menuOpen: mockMenuOpen, setMenuOpen: function () { } }; },
}));

const mockShowLockedHint = jest.fn();
jest.mock('../../LockedHintContext', () => ({
  useLockedHint: function () { return { lockedHintVisible: false, showLockedHint: mockShowLockedHint, hideLockedHint: function () { } }; },
}));

const mockReportMiss = jest.fn();
jest.mock('../../GestureNudgeContext', () => ({
  useGestureNudge: function () { return { nudgeMessage: null, reportMiss: mockReportMiss, reportSuccess: function () { }, hideNudge: function () { } }; },
}));

beforeEach(() => {
  mockReportMiss.mockClear();
  mockScoreParticle.mockClear();
  mockMenuOpen = false;
  mockShowLockedHint.mockClear();
});

type RenderOptions = {
  scoreType?: 'increment' | 'decrement';
  roundCurrent?: number;
  locked?: boolean;
  onRender?: (id: string) => void;
};

const renderSurface = ({ scoreType = 'increment', roundCurrent = 0, locked = false, onRender }: RenderOptions = {}) => {
  const store = configureStore({
    reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
    preloadedState: {
      settings: { ...settingsInitialState, addendOne: 3, addendTwo: 10, currentGameId: 'game-1', showPointParticles: true },
      games: { ids: ['game-1'], entities: { 'game-1': { id: 'game-1', title: 'Test', dateCreated: Date.now(), roundCurrent, roundTotal: roundCurrent + 1, locked, playerIds: ['player-1'] } }, _persist: { version: 0, rehydrated: true } },
      players: { ids: ['player-1'], entities: { 'player-1': { id: 'player-1', playerName: 'Test', scores: [0] } }, _persist: { version: 0, rehydrated: true } },
    },
  });
  const dispatch = jest.spyOn(store, 'dispatch');
  const utils = render(
    <Provider store={store}>
      <HalfTileTouchSurface playerIndex={0} playerId="player-1" fontColor="white" scoreType={scoreType} onRender={onRender} />
    </Provider>
  );
  const surface = utils.UNSAFE_getByType(TouchableHighlight);
  return { dispatch, store, surface };
};

const renderHalfTap = ({ onRender }: { onRender?: (id: string) => void; } = {}) => {
  const store = configureStore({
    reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
    preloadedState: {
      settings: { ...settingsInitialState, currentGameId: 'game-1' },
      games: { ids: ['game-1'], entities: { 'game-1': { id: 'game-1', title: 'Test', dateCreated: Date.now(), roundCurrent: 0, roundTotal: 1, locked: false, playerIds: ['player-1'] } }, _persist: { version: 0, rehydrated: true } },
      players: { ids: ['player-1'], entities: { 'player-1': { id: 'player-1', playerName: 'Test', scores: [0] } }, _persist: { version: 0, rehydrated: true } },
    },
  });

  render(
    <Provider store={store}>
      <HalfTap index={0} playerId="player-1" fontColor="white" onRender={onRender}>
        <></>
      </HalfTap>
    </Provider>
  );

  return { store };
};

describe('HalfTileTouchSurface', () => {
  it('tap on the increment surface dispatches +addendOne for the current round', () => {
    const { dispatch, surface } = renderSurface({ scoreType: 'increment' });
    fireEvent.press(surface);
    expect(dispatch).toHaveBeenCalledWith(
      playerRoundScoreIncrement('player-1', 0, 3)
    );
  });

  it('tap on the decrement surface dispatches -addendOne', () => {
    const { dispatch, surface } = renderSurface({ scoreType: 'decrement' });
    fireEvent.press(surface);
    expect(dispatch).toHaveBeenCalledWith(
      playerRoundScoreIncrement('player-1', 0, -3)
    );
  });

  it('long press dispatches +addendTwo', () => {
    const { dispatch, surface } = renderSurface({ scoreType: 'increment' });
    fireEvent(surface, 'longPress');
    expect(dispatch).toHaveBeenCalledWith(
      playerRoundScoreIncrement('player-1', 0, 10)
    );
  });

  it('long press on the decrement surface dispatches -addendTwo', () => {
    const { dispatch, surface } = renderSurface({ scoreType: 'decrement' });
    fireEvent(surface, 'longPress');
    expect(dispatch).toHaveBeenCalledWith(
      playerRoundScoreIncrement('player-1', 0, -10)
    );
  });

  it('draws the particle where the finger touched, drifting up on the add half', () => {
    const { surface } = renderSurface({ scoreType: 'increment' });
    fireEvent(surface, 'layout', { nativeEvent: { layout: { width: 200, height: 100 } } });
    fireEvent.press(surface, { nativeEvent: { locationX: 40, locationY: 22 } });
    expect(mockScoreParticle).toHaveBeenLastCalledWith(expect.objectContaining({
      value: '+3', x: 40, y: 22, direction: 'up', color: 'white', large: false,
      containerWidth: 200, containerHeight: 100,
    }));
  });

  it('draws a larger particle drifting down for a hold on the subtract half', () => {
    const { surface } = renderSurface({ scoreType: 'decrement' });
    fireEvent(surface, 'layout', { nativeEvent: { layout: { width: 200, height: 100 } } });
    fireEvent(surface, 'longPress', { nativeEvent: { locationX: 12, locationY: 90 } });
    expect(mockScoreParticle).toHaveBeenLastCalledWith(expect.objectContaining({
      value: '−10', x: 12, y: 90, direction: 'down', large: true,
      containerWidth: 200, containerHeight: 100,
    }));
  });

  it('centers a particle for a non-pointer press', () => {
    const { surface } = renderSurface();
    fireEvent(surface, 'layout', { nativeEvent: { layout: { width: 200, height: 100 } } });
    fireEvent.press(surface);
    expect(mockScoreParticle).toHaveBeenLastCalledWith(expect.objectContaining({
      x: 100, y: 50,
    }));
  });

  it('targets the game\'s current round', () => {
    const { dispatch, surface } = renderSurface({ roundCurrent: 2 });
    fireEvent.press(surface);
    expect(dispatch).toHaveBeenCalledWith(
      playerRoundScoreIncrement('player-1', 2, 3)
    );
  });

  it('does not re-render solely because the current round changes', () => {
    const onRender = jest.fn();
    const { store } = renderSurface({ onRender });

    expect(onRender).toHaveBeenCalledTimes(1);
    onRender.mockClear();

    act(() => {
      store.dispatch(roundNext('game-1'));
    });

    expect(onRender).not.toHaveBeenCalled();
  });

  it('targets the latest round after a round change', () => {
    const { dispatch, store, surface } = renderSurface();

    act(() => {
      store.dispatch(roundNext('game-1'));
    });
    dispatch.mockClear();

    fireEvent.press(surface);

    expect(dispatch).toHaveBeenCalledWith(
      playerRoundScoreIncrement('player-1', 1, 3)
    );
  });

  it('does not dispatch when the game is locked', () => {
    const { dispatch, surface } = renderSurface({ locked: true });
    fireEvent.press(surface);
    fireEvent(surface, 'longPress');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('explains how to unlock when tapped in a locked game', () => {
    const { surface } = renderSurface({ locked: true });
    fireEvent.press(surface);
    expect(mockShowLockedHint).toHaveBeenCalledTimes(1);
  });

  it('does not show the locked hint in an unlocked game', () => {
    const { surface } = renderSurface();
    fireEvent.press(surface);
    expect(mockShowLockedHint).not.toHaveBeenCalled();
  });

  it('does not dispatch while the menu is open', () => {
    mockMenuOpen = true;
    const { dispatch, surface } = renderSurface();
    fireEvent.press(surface);
    fireEvent(surface, 'longPress');
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('HalfTap', () => {
  it('does not re-render solely because the current round changes', () => {
    const onRender = jest.fn();
    const { store } = renderHalfTap({ onRender });

    expect(onRender).toHaveBeenCalledTimes(1);
    onRender.mockClear();

    act(() => {
      store.dispatch(roundNext('game-1'));
    });

    expect(onRender).not.toHaveBeenCalled();
  });
});

describe('HalfTileTouchSurface swipe nudge', () => {
  const touch = (x: number, y: number) => ({ nativeEvent: { pageX: x, pageY: y, locationX: x, locationY: y } });

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('reports a miss when a touch drags away without scoring', () => {
    const { surface, dispatch } = renderSurface();
    dispatch.mockClear();
    act(() => {
      surface.props.onPressIn(touch(50, 50));
      surface.props.onPressOut(touch(50, 120));
      jest.runAllTimers();
    });
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: playerRoundScoreIncrement.type }));
    expect(mockReportMiss).toHaveBeenCalledWith('half-tap');
  });

  it('does not report a miss for a tap that scores', () => {
    const { surface } = renderSurface();
    act(() => {
      surface.props.onPressIn(touch(50, 50));
      surface.props.onPressOut(touch(52, 51));
      surface.props.onPress(touch(52, 51));
      jest.runAllTimers();
    });
    expect(mockReportMiss).not.toHaveBeenCalled();
  });

  it('does not report a miss when a drag still scores', () => {
    const { surface } = renderSurface();
    act(() => {
      surface.props.onPressIn(touch(50, 50));
      surface.props.onPressOut(touch(50, 90));
      surface.props.onPress(touch(50, 90));
      jest.runAllTimers();
    });
    expect(mockReportMiss).not.toHaveBeenCalled();
  });

  it('does not report a miss in a locked game', () => {
    const { surface } = renderSurface({ locked: true });
    act(() => {
      surface.props.onPressIn(touch(50, 50));
      surface.props.onPressOut(touch(50, 120));
      jest.runAllTimers();
    });
    expect(mockReportMiss).not.toHaveBeenCalled();
  });
});
