import React from 'react';

import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setGameScoring } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { ScoringRules, WinCondition, scoringRulesOrDefault } from '../../redux/ScoringRules';
import { selectCurrentGame } from '../../redux/selectors';
import { logEvent } from '../Analytics';
import SectionLabel from '../components/SectionLabel';
import { useTheme } from '../theme';

const winnerOptions: { value: WinCondition; label: string; }[] = [
    { value: 'high', label: 'Highest score' },
    { value: 'low', label: 'Lowest score' },
];

const ScoringRulesScreen: React.FunctionComponent = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const currentGame = useAppSelector(selectCurrentGame);
    // A game is under way once anyone has scored. Changing the rules then
    // re-ranks every round already played, so it asks first.
    const hasScores = useAppSelector(state => (currentGame?.playerIds ?? []).some(
        playerId => (state.players.entities[playerId]?.scores ?? []).some(score => score !== 0)
    ));

    if (!currentGame) return null;

    const rules = scoringRulesOrDefault(currentGame.scoring);

    const applyRules = (next: ScoringRules) => {
        dispatch(setGameScoring({ gameId: currentGame.id, scoring: next }));
        void logEvent('set_game_scoring', {
            game_id: currentGame.id,
            winner: next.winner,
            mid_game: hasScores,
        });
    };

    const selectWinner = (winner: WinCondition) => {
        // Already the saved rule. Picking the default on a free play game
        // still saves it, so the game counts as having a mode from here on.
        if (currentGame.scoring?.winner === winner) return;

        const next: ScoringRules = { ...rules, winner };

        if (!hasScores || rules.winner === winner) {
            applyRules(next);
            return;
        }

        const label = winner === 'low' ? 'lowest' : 'highest';
        Alert.alert(
            'Change rules mid-game?',
            `This game already has scores. The ${label} total will win, which changes `
            + 'who is leading and how players are ranked for every round already played. '
            + 'Scores stay the same, and you can change this back.',
            [
                { text: 'Keep Current Rules', style: 'cancel' },
                { text: 'Change Rules', style: 'destructive', onPress: () => applyRules(next) },
            ]
        );
    };

    return (
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} testID="scoring-rules">
            {/* Left/right insets keep the rows clear of landscape notches and the
                iPhone Duo's vertical bar, as on Edit Game. */}
            <SafeAreaView edges={['left', 'right']}>
                <SectionLabel inset={30}>Winner</SectionLabel>
                <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
                    {winnerOptions.map((option, index) => {
                        const selected = rules.winner === option.value;
                        return (
                            <React.Fragment key={option.value}>
                                {index > 0 && <View style={[styles.separator, { backgroundColor: theme.separator }]} />}
                                <TouchableOpacity
                                    testID={`scoring-winner-${option.value}`}
                                    accessibilityRole="radio"
                                    accessibilityState={{ selected }}
                                    style={styles.row}
                                    onPress={() => selectWinner(option.value)}
                                >
                                    <Text style={[styles.rowLabel, { color: theme.text }]}>{option.label}</Text>
                                    {selected && <Icon name="checkmark" type="ionicon" color={theme.tint} size={22} />}
                                </TouchableOpacity>
                            </React.Fragment>
                        );
                    })}
                </View>
                <Text style={[styles.footnote, { color: theme.textSecondary }]}>
                    Sets who leads, how players are ranked by score, and who is suggested when you choose winners.
                </Text>
            </SafeAreaView>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    section: {
        borderRadius: 10,
        marginHorizontal: 10,
        marginVertical: 5,
        paddingHorizontal: 20,
    },
    row: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 48,
    },
    rowLabel: {
        fontSize: 18,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
    },
    footnote: {
        fontSize: 13,
        marginHorizontal: 30,
        marginTop: 6,
    },
});

export default ScoringRulesScreen;
