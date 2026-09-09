import React, { memo, useCallback, useEffect, useRef } from 'react';

import { useHeaderHeight } from '@react-navigation/elements';
import { ParamListBase, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { selectGameIds } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { increaseAppOpens, setInstallId, setRollingGameCounter } from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';
import FloatingActionButton, { FAB_BOTTOM_MARGIN, FAB_LIST_CLEARANCE, FAB_SIZE } from '../components/FloatingActionButton';
import GameListItem from '../components/GameListItem';
import { useStoreReviewPrompt } from '../hooks/useStoreReviewPrompt';
import { useTheme } from '../theme';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ListScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const theme = useTheme();
    const appOpens = useAppSelector(state => state.settings.appOpens);
    const devMenuEnabled = useAppSelector(state => state.settings.devMenuEnabled);
    const installId = useAppSelector(state => state.settings.installId);
    const gameIds = useAppSelector(state => selectGameIds(state));
    const dispatch = useAppDispatch();

    const rollingGameCounter = useAppSelector(state => state.settings.rollingGameCounter);
    const headerHeight = useHeaderHeight();
    const listHeaderInset = Platform.OS === 'ios' ? headerHeight : 0;
    const insets = useSafeAreaInsets();
    const listBottomInset = insets.bottom + FAB_BOTTOM_MARGIN + FAB_SIZE + FAB_LIST_CLEARANCE;

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
        <SafeAreaView edges={['left', 'right']} style={{ backgroundColor: theme.backgroundSecondary, flex: 1 }} testID="home-screen">
            <Animated.FlatList
                testID="game-list"
                alwaysBounceVertical
                contentContainerStyle={{ flexGrow: 1, paddingTop: listHeaderInset, paddingBottom: listBottomInset }}
                contentInsetAdjustmentBehavior="never"
                scrollIndicatorInsets={{ top: listHeaderInset, bottom: listBottomInset }}
                itemLayoutAnimation={LinearTransition.easing(Easing.ease)}
                ItemSeparatorComponent={() => (
                    // Inset to the row's leading text rather than run edge to
                    // edge, which is how iOS draws list separators. Lives on the
                    // list so it is not drawn under the final row.
                    <View style={[styles.separator, { backgroundColor: theme.separator }]} />
                )}
                ListEmptyComponent={
                    <>
                        <Text style={{ textAlign: 'center', padding: 30, paddingBottom: 10, fontSize: 16, fontWeight: 'bold', color: theme.text }}>No Games</Text>
                        <Text style={{ textAlign: 'center', padding: 10, color: theme.textSecondary }}>Tap the + button to create a new game.</Text>
                    </>
                }
                style={[styles.list, { backgroundColor: theme.backgroundSecondary }]}
                data={gameIds}
                renderItem={({ item, index }) =>
                    <GameListItem navigation={navigation} gameId={item as string} index={index} />
                }
                keyExtractor={item => item as string}
            >
            </Animated.FlatList>
            <FloatingActionButton navigation={navigation} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    list: {
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 16,
    },
});

export default memo(ListScreen);
