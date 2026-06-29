import React, { useCallback, useMemo, useState } from 'react';

import {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetModal,
    BottomSheetScrollView
} from '@gorhom/bottom-sheet';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { shallowEqual } from 'react-redux';

import { selectGameById, updateGame } from '../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { selectInteractionType } from '../../../redux/selectors';
import { logEvent } from '../../Analytics';
import { useTheme } from '../../theme';

import { useChooseWinnersSheetContext } from './ChooseWinnersSheetContext';
import GlassButton from './GlassButton';

const ChooseWinnersSheet: React.FunctionComponent = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const topInset = insets.top + 50;

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(state => selectGameById(state, currentGameId || ''));
    const interactionType = useAppSelector(state => selectInteractionType(state, currentGameId));
    const playerIds = currentGame?.playerIds;
    const allPlayers = useAppSelector((state) =>
        (playerIds || []).map((id) => state.players.entities[id]),
        shallowEqual
    );
    const sortedPlayerIds = useMemo(() => {
        const withScores = (playerIds || []).map((id) => {
            const p = allPlayers.find((ap) => ap?.id === id);

            return {
                id,
                totalScore: (p?.scores || []).reduce((a, b) => a + b, 0),
            };
        });

        withScores.sort((a, b) => b.totalScore - a.totalScore);

        return withScores.map((p) => p.id);
    }, [allPlayers, playerIds]);
    const playerInfo = useMemo(
        () =>
            Object.fromEntries(
                allPlayers.map((p) => [
                    p?.id,
                    {
                        name: p?.playerName || '',
                        totalScore: (p?.scores || []).reduce((a, b) => a + b, 0),
                    },
                ])),
        [allPlayers]
    );

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const chooseWinnersSheetRef = useChooseWinnersSheetContext();

    const snapPoints = useMemo(() => ['50%', '80%'], []);

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                pressBehavior={0}
            />
        ),
        []
    );

    const togglePlayer = (playerId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(playerId)) {
                next.delete(playerId);
            } else {
                next.add(playerId);
            }
            return next;
        });
    };

    const handleLock = () => {
        if (!currentGameId) return;

        dispatch(
            updateGame({
                id: currentGameId,
                changes: {
                    locked: true,
                    winnerIds: Array.from(selectedIds),
                },
            })
        );
        logEvent('lock_game', {
            game_id: currentGameId,
            locked: true,
            winner_count: selectedIds.size,
        });

        logEvent('game_complete', {
            game_id: currentGameId,
            player_count: (playerIds ?? []).length,
            round_count: currentGame?.roundTotal ?? 0,
            winner_count: selectedIds.size,
            duration_sec: currentGame?.dateCreated
                ? Math.round((Date.now() - currentGame.dateCreated) / 1000)
                : 0,
            palette: currentGame?.palette,
            interaction: interactionType,
        });

        setSelectedIds(new Set());
        chooseWinnersSheetRef?.current?.close();
    };

    const handleClose = () => {
        setSelectedIds(new Set());
        chooseWinnersSheetRef?.current?.close();
    };

    return (
        <BottomSheetModal
            ref={chooseWinnersSheetRef}
            index={1}
            enablePanDownToClose={false}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: theme.sheetBackground }}
            handleIndicatorStyle={{ backgroundColor: theme.sheetHandle }}
            topInset={topInset}
            style={theme.background === '#000000' ? undefined : styles.sheetShadow}
            accessible={false}
            accessibilityViewIsModal={false}
        >
            {/* Fixed header — does not scroll */}
            <View style={styles.topBar}>
                <GlassButton
                    onPress={handleClose}
                    accessibilityLabel="Cancel"
                    iconName="close"
                    iconType="ionicon"
                    iconSize={18}
                    iconColor={theme.text}
                />

                <Text style={[styles.topBarTitle, { color: theme.text }]}>
                    Choose Winner(s)
                </Text>

                <GlassButton
                    onPress={handleLock}
                    accessibilityLabel="Lock Game"
                    testID="lock-game-button"
                    iconName="checkmark"
                    iconType="ionicon"
                    iconSize={20}
                    iconColor="#007AFF"
                    blue
                />
            </View>

            <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
                <SafeAreaView edges={['right', 'left']}>
                    <Text style={[styles.subtitle, { color: theme.textTertiary }]}>
                        Select winners (optional) to end the game.
                    </Text>

                    <View style={[styles.playerList, { backgroundColor: theme.backgroundSecondary }]}>
                        {sortedPlayerIds.map((playerId, index) => {
                            const info = playerInfo[playerId];
                            const isSelected = selectedIds.has(playerId);
                            const isLast = index === sortedPlayerIds.length - 1;

                            return (
                                <React.Fragment key={playerId}>
                                    <TouchableOpacity
                                        style={styles.playerRow}
                                        onPress={() => togglePlayer(playerId)}
                                        activeOpacity={0.6}
                                        testID={`winner-player-row-${index}`}
                                    >
                                        <Icon
                                            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                                            type="ionicon"
                                            color={isSelected ? theme.tint : theme.textTertiary}
                                            size={22}
                                        />
                                        <Text style={[styles.playerName, { color: theme.text }]} numberOfLines={1}>
                                            {info?.name}
                                        </Text>
                                        <Text style={[styles.playerScore, { color: theme.textSecondary }]}>
                                            {info?.totalScore}
                                        </Text>
                                    </TouchableOpacity>
                                    {!isLast && (
                                        <View style={[styles.rowSeparator, { backgroundColor: theme.separator }]} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </View>
                </SafeAreaView>
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        padding: 24,
        paddingBottom: 100,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 8,
    },
    topBarTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    playerList: {
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 40,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 16,
        gap: 12,
    },
    rowSeparator: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 50,
    },
    playerName: {
        fontSize: 16,
        flex: 1,
    },
    playerScore: {
        fontSize: 16,
        fontWeight: '600',
    },
    sheetShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
        elevation: 8,
    },
});

export default ChooseWinnersSheet;
