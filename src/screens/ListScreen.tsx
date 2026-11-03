import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { useHeaderHeight } from '@react-navigation/elements';
import { ParamListBase, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { Platform, StyleSheet, Text } from 'react-native';
import Animated, { Easing, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { shallowEqual } from 'react-redux';

import { selectGameIds } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { increaseAppOpens, setInstallId, setRollingGameCounter } from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';
import { useAppSettingsHeaderItems } from '../components/Buttons/AppSettingsButton';
import FloatingActionButton, { FAB_BOTTOM_MARGIN, FAB_LIST_CLEARANCE, FAB_SIZE } from '../components/FloatingActionButton';
import GameListItem from '../components/GameListItem';
import { useVerticalBarLayout } from '../hooks/useExpandedGameLayout';
import { useNewGameHeaderItems } from '../hooks/useNewGameMenu';
import { useStoreReviewPrompt } from '../hooks/useStoreReviewPrompt';
import { useTheme } from '../theme';

export type ListRow =
    | { kind: 'header'; key: string; label: string; }
    | { kind: 'game'; key: string; index: number; first: boolean; last: boolean; };

/**
 * The list's rows: games in inset groups by day, with a header for each.
 * Today's games get their own group so the one you're in the middle of is
 * easy to find. When nothing is from today there's a single group and no
 * header, since "Earlier" on its own says nothing.
 */
export function buildListRows(gameIds: string[], dates: number[], now: number = Date.now()): ListRow[] {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const today: number[] = [];
    const earlier: number[] = [];
    gameIds.forEach((_, i) => ((dates[i] ?? 0) >= startOfToday.getTime() ? today : earlier).push(i));

    const groups = today.length > 0
        ? [{ label: 'Today', games: today }, { label: 'Earlier', games: earlier }]
        : [{ label: undefined, games: earlier }];

    const rows: ListRow[] = [];
    groups.forEach(({ label, games }) => {
        if (games.length === 0) return;
        if (label) rows.push({ kind: 'header', key: `header-${label}`, label });
        games.forEach((gameIndex, i) => rows.push({
            kind: 'game',
            key: gameIds[gameIndex],
            index: gameIndex,
            first: i === 0,
            last: i === games.length - 1,
        }));
    });
    return rows;
}

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ListScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const theme = useTheme();
    const appOpens = useAppSelector(state => state.settings.appOpens);
    const devMenuEnabled = useAppSelector(state => state.settings.devMenuEnabled);
    const installId = useAppSelector(state => state.settings.installId);
    const gameIds = useAppSelector(state => selectGameIds(state));
    const gameDates = useAppSelector(
        state => selectGameIds(state).map(id => state.games.entities[id]?.dateCreated ?? 0),
        shallowEqual,
    );
    const rows = useMemo(() => buildListRows(gameIds as string[], gameDates), [gameIds, gameDates]);
    const dispatch = useAppDispatch();

    const rollingGameCounter = useAppSelector(state => state.settings.rollingGameCounter);
    const headerHeight = useHeaderHeight();
    const listHeaderInset = Platform.OS === 'ios' ? headerHeight : 0;
    const insets = useSafeAreaInsets();
    // With vertical bars (iPhone Duo), iOS scrolls the header title away with
    // the content, so the title is part of the list and the header collapses
    // (see Navigation). The new game button moves from the floating action
    // button into the vertical bar, next to the other controls.
    const verticalBars = useVerticalBarLayout();
    const listBottomInset = verticalBars
        ? insets.bottom + FAB_LIST_CLEARANCE
        : insets.bottom + FAB_BOTTOM_MARGIN + FAB_SIZE + FAB_LIST_CLEARANCE;

    // On iOS the settings button is a native bar item so iPhone Duo can move
    // it into the vertical bar. Android keeps the React `headerLeft`.
    const headerLeftItems = useAppSettingsHeaderItems(navigation);
    useLayoutEffect(() => {
        if (Platform.OS !== 'ios') return;
        navigation.setOptions({ unstable_headerLeftItems: () => headerLeftItems });
    }, [navigation, headerLeftItems]);

    const newGameItems = useNewGameHeaderItems(navigation);
    useLayoutEffect(() => {
        navigation.setOptions({ unstable_headerRightItems: verticalBars ? () => newGameItems : undefined });
    }, [navigation, newGameItems, verticalBars]);

    // Ask for a review when the user comes back to the list from a game — the
    // same moment the pre-3.0.0 prompt used, when it hung off the header's home
    // button. The first focus is the app launching into the list, which is not
    // that moment, so it is skipped.
    const promptForReview = useStoreReviewPrompt();
    const hasFocusedOnce = useRef(false);
    useFocusEffect(
        useCallback(() => {
            if (!hasFocusedOnce.current) {
                hasFocusedOnce.current = true;
                return;
            }
            void promptForReview();
        }, [promptForReview]),
    );

    useEffect(() => {
        // Resolve what this launch will report before logging it. Reading these
        // straight from the render closure logged pre-dispatch state, so a
        // brand-new install reported no install_id and app_opens: 0, and
        // rolling_game_counter trailed game_count by a render.
        const resolvedInstallId = installId ?? Crypto.randomUUID();
        if (installId === undefined) {
            dispatch(setInstallId(resolvedInstallId));
        }

        // Update rollingGameCounter if it is undefined or less than the current gameIds length
        const resolvedRollingGameCounter = Math.max(rollingGameCounter ?? 0, gameIds.length);
        if (rollingGameCounter === undefined || rollingGameCounter < gameIds.length) {
            dispatch(setRollingGameCounter(gameIds.length));
        }

        dispatch(increaseAppOpens());

        logEvent('game_list', {
            game_count: gameIds.length,
            // Counts this launch, so a first open reports 1 rather than 0.
            app_opens: appOpens + 1,
            // Coerced: a settings backup predating the seeded default restores undefined.
            dev_menu_enabled: devMenuEnabled ?? false,
            install_id: resolvedInstallId,
            rolling_game_counter: resolvedRollingGameCounter,
        });
    }, []);

    return (
        <SafeAreaView edges={['left', 'right']} style={{ backgroundColor: theme.background, flex: 1 }} testID="home-screen">
            <Animated.FlatList
                testID="game-list"
                alwaysBounceVertical
                contentContainerStyle={{ flexGrow: 1, paddingTop: listHeaderInset + (rows[0]?.kind === 'game' ? 12 : 0), paddingBottom: listBottomInset }}
                contentInsetAdjustmentBehavior="never"
                scrollIndicatorInsets={{ top: listHeaderInset, bottom: listBottomInset }}
                itemLayoutAnimation={LinearTransition.easing(Easing.ease)}
                ListHeaderComponent={verticalBars
                    ? <Text accessibilityRole="header" style={[styles.listTitle, { color: theme.text }]}>ScorePad</Text>
                    : undefined}
                ListEmptyComponent={
                    <>
                        <Text style={{ textAlign: 'center', padding: 30, paddingBottom: 10, fontSize: 16, fontWeight: 'bold', color: theme.text }}>No Games</Text>
                        <Text style={{ textAlign: 'center', padding: 10, color: theme.textSecondary }}>Tap the + button to create a new game.</Text>
                    </>
                }
                overScrollMode="always"
                style={{ backgroundColor: theme.background }}
                data={rows}
                renderItem={({ item }) => item.kind === 'header'
                    ? <Text accessibilityRole="header" style={[styles.sectionHeader, { color: theme.textSecondary }]}>{item.label.toUpperCase()}</Text>
                    : <GameListItem navigation={navigation} gameId={item.key} index={item.index} first={item.first} last={item.last} showSeparator={!item.first} />
                }
                keyExtractor={item => item.key}
            >
            </Animated.FlatList>
            {!verticalBars && <FloatingActionButton navigation={navigation} />}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    sectionHeader: {
        fontSize: 13,
        letterSpacing: 0.3,
        paddingHorizontal: 32,
        paddingTop: 18,
        paddingBottom: 6,
    },
    // Matches the native header title it stands in for.
    listTitle: {
        fontSize: 17,
        fontWeight: '600',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
});

export default memo(ListScreen);
