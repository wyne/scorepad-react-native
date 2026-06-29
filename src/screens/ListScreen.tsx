import React, { memo, useEffect } from 'react';

import { useHeaderHeight } from '@react-navigation/elements';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { Platform, StyleSheet, Text } from 'react-native';
import Animated, { Easing, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { selectGameIds } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { increaseAppOpens, setInstallId, setRollingGameCounter } from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';
import FloatingActionButton, { FAB_BOTTOM_MARGIN, FAB_LIST_CLEARANCE, FAB_SIZE } from '../components/FloatingActionButton';
import GameListItem from '../components/GameListItem';
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

    useEffect(() => {
        if (installId === undefined) {
            const installId = Crypto.randomUUID();
            dispatch(setInstallId(installId));
        }

        // Update rollingGameCounter if it is undefined or less than the current gameIds length
        if (rollingGameCounter === undefined || rollingGameCounter < gameIds.length) {
            dispatch(setRollingGameCounter(gameIds.length));
        }

        logEvent('game_list', {
            game_count: gameIds.length,
            app_opens: appOpens,
            dev_menu_enabled: devMenuEnabled,
            install_id: installId,
            rolling_game_counter: rollingGameCounter,
        });

        dispatch(increaseAppOpens());
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
});

export default memo(ListScreen);
