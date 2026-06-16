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
jest.mock('../../PlayerTiles/AdditionTile/ScoreParticle', () => ({
  ScoreParticle: function () { return null; },
}));

let mockMenuOpen = false;
jest.mock('../../MenuOpenContext', () => ({
  useMenuOpen: function () { return { menuOpen: mockMenuOpen, setMenuOpen: function () { } }; },
}));

beforeEach(() => {
  mockMenuOpen = false;
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
