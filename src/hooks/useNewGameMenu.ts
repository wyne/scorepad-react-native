import { useLayoutEffect, useMemo, useRef } from 'react';

import { ParamListBase } from '@react-navigation/native';
import type { NativeStackHeaderItem, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Keyboard } from 'react-native';

import { asyncCreateGame, selectGameIds } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { MAX_PLAYERS } from '../constants';

type Navigation = NativeStackNavigationProp<ParamListBase, string, undefined>;

export const playerCountOptions = Array.from(Array(MAX_PLAYERS).keys(), n => n + 1);

export const playerCountLabel = (count: number) => `${count}${count == 1 ? ' Player' : ' Players'}`;

/**
 * The new game menu: pick a player count, create the game and open it for
 * editing. Shared by the floating action button and, with vertical bars
 * (iPhone Duo), the header item that replaces it.
 */
export const useNewGameMenu = (navigation: Navigation) => {
    const dispatch = useAppDispatch();
    const gameCount = useAppSelector(state => selectGameIds(state).length);

    const selectPlayerCount = (playerCount: number) => {
        Keyboard.dismiss();
        dispatch(
            asyncCreateGame({ gameCount, playerCount })
        ).then(() => {
            setTimeout(() => {
                navigation.navigate('EditGame', { source: 'new_game' });
            }, 500);
        });
    };

    return { selectPlayerCount };
};

/**
 * The new game menu as a native header item (iOS), so the system can place it
 * in the vertical bar on iPhone Duo as the screen's primary action.
 */
export const useNewGameHeaderItems = (navigation: Navigation): NativeStackHeaderItem[] => {
    const { selectPlayerCount } = useNewGameMenu(navigation);

    // Keep the latest handler in a ref so the items stay stable across
    // renders. Each new items array re-runs setOptions.
    const selectRef = useRef(selectPlayerCount);
    useLayoutEffect(() => {
        selectRef.current = selectPlayerCount;
    });

    return useMemo(() => [{
        type: 'menu',
        label: 'New Game',
        accessibilityLabel: 'New Game',
        icon: { type: 'sfSymbol', name: 'plus' },
        variant: 'prominent',
        menu: {
            title: 'Players',
            items: playerCountOptions.map((count) => ({
                type: 'action',
                label: playerCountLabel(count),
                onPress: () => selectRef.current(count),
            })),
        },
    }], []);
};
