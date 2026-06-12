/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
import { TouchableHighlight } from 'react-native';
import { Provider } from 'react-redux';

import { playerRoundScoreIncrement } from '../../../../redux/PlayersSlice';

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

const stub = function (s: any = {}) { return s; };

beforeEach(() => {
  mockMenuOpen = false;
});

type RenderOptions = {
  scoreType?: 'increment' | 'decrement';
  roundCurrent?: number;
  locked?: boolean;
};

const renderSurface = ({ scoreType = 'increment', roundCurrent = 0, locked = false }: RenderOptions = {}) => {
  const store = configureStore({
    reducer: { settings: stub, games: stub, players: stub },
    preloadedState: {
      settings: { addendOne: 3, addendTwo: 10, currentGameId: 'game-1', multiplier: '1', onboarded: null, interactionType: null, showPointParticles: true, _persist: { version: 0, rehydrated: true } },
      games: { ids: ['game-1'], entities: { 'game-1': { id: 'game-1', title: 'Test', dateCreated: Date.now(), roundCurrent, roundTotal: roundCurrent + 1, locked, playerIds: ['player-1'] } }, _persist: { version: 0, rehydrated: true } },
      players: { ids: ['player-1'], entities: { 'player-1': { id: 'player-1', playerName: 'Test', scores: [0] } }, _persist: { version: 0, rehydrated: true } },
    },
  });
  const dispatch = jest.spyOn(store, 'dispatch');
  const utils = render(
    <Provider store={store}>
      <HalfTileTouchSurface playerIndex={0} playerId="player-1" fontColor="white" scoreType={scoreType} />
    </Provider>
  );
  const surface = utils.UNSAFE_getByType(TouchableHighlight);
  return { dispatch, surface };
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
