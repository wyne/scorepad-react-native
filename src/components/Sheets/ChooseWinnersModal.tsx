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

import { selectGameById, updateGame } from '../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { logEvent } from '../../Analytics';
import { useTheme } from '../../theme';
import HeaderButton from '../Buttons/HeaderButton';

import { useChooseWinnersModalContext } from './ChooseWinnersModalContext';

const ChooseWinnersModal: React.FunctionComponent = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const topInset = insets.top + 50;

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const playerIds = useAppSelector(state => selectGameById(state, currentGameId || '')?.playerIds);
    const allPlayers = useAppSelector((state) =>
        (playerIds || []).map((id) => state.players.entities[id])
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

    const chooseWinnersModalRef = useChooseWinnersModalContext();

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
        setSelectedIds(new Set());
        chooseWinnersModalRef?.current?.close();
    };

    const handleClose = () => {
        setSelectedIds(new Set());
        chooseWinnersModalRef?.current?.close();
    };

    return (
        <BottomSheetModal
            ref={chooseWinnersModalRef}
            index={1}
            enablePanDownToClose={false}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: theme.sheetBackground }}
            handleIndicatorStyle={{ backgroundColor: theme.sheetHandle }}
            topInset={topInset}
            style={theme.background === '#000000' ? undefined : styles.sheetShadow}
        >
            <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
                <SafeAreaView edges={['right', 'left']}>
                    <View style={styles.topBar}>
                        <HeaderButton accessibilityLabel="Cancel" onPress={handleClose}>
                            <Text style={[styles.topBarButtonText, { color: theme.tint }]}>
                                Cancel
                            </Text>
                        </HeaderButton>
                        <Text style={[styles.topBarTitle, { color: theme.text }]}>
                            Choose Winner(s)
                        </Text>
                        <HeaderButton accessibilityLabel="Lock Game" onPress={handleLock}>
                            <Icon
                                name="lock-closed-outline"
                                type="ionicon"
                                size={20}
                                color={theme.tint}
                            />
                            <Text style={[styles.topBarButtonText, { color: theme.tint }]}>
                                {' Lock Game'}
                            </Text>
                        </HeaderButton>
                    </View>

                    <Text style={[styles.subtitle, { color: theme.textTertiary }]}>
                        Select one or more players as winners
                    </Text>

                    <View style={styles.playerList}>
                        {sortedPlayerIds.map((playerId) => {
                            const info = playerInfo[playerId];
                            const isSelected = selectedIds.has(playerId);

                            return (
                                <TouchableOpacity
                                    key={playerId}
                                    style={[
                                        styles.playerRow,
                                        {
                                            backgroundColor: isSelected
                                                ? theme.tint + '20'
                                                : theme.backgroundTertiary,
                                            borderColor: isSelected ? theme.tint : 'transparent',
                                        },
                                    ]}
                                    onPress={() => togglePlayer(playerId)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.playerName, { color: theme.text }]} numberOfLines={1}>
                                        {info?.name}
                                    </Text>
                                    <View style={styles.playerRowRight}>
                                        <Text style={[styles.playerScore, { color: theme.textSecondary }]}>
                                            {info?.totalScore}
                                        </Text>
                                        <Icon
                                            name={isSelected ? 'trophy' : 'trophy-outline'}
                                            type="ionicon"
                                            color={isSelected ? theme.warning : theme.textTertiary}
                                            size={24}
                                        />
                                    </View>
                                </TouchableOpacity>
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
        paddingVertical: 4,
    },
    topBarTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    topBarButtonText: {
        fontSize: 16,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    playerList: {
        gap: 8,
        marginBottom: 40,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 12,
        borderWidth: 2,
    },
    playerName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 12,
    },
    playerRowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    playerScore: {
        fontSize: 16,
        fontWeight: '700',
    },
    sheetShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
        elevation: 8,
    },
});

export default ChooseWinnersModal;
