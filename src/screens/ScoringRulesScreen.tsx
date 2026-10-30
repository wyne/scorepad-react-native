import React, { useEffect, useRef, useState } from 'react';

import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setGameScoring } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
    EndCondition,
    MAX_ROUND_LIMIT,
    MAX_TARGET_SCORE,
    ScoringRules,
    WinCondition,
    scoringRulesOrDefault,
} from '../../redux/ScoringRules';
import { selectCurrentGame } from '../../redux/selectors';
import { logEvent } from '../Analytics';
import SectionLabel from '../components/SectionLabel';
import { useTheme } from '../theme';

type EndType = 'none' | EndCondition['type'];

const winnerOptions: { value: WinCondition; label: string; }[] = [
    { value: 'high', label: 'Highest score' },
    { value: 'low', label: 'Lowest score' },
];

const endOptions: { value: EndType; label: string; }[] = [
    { value: 'none', label: 'Never (I\'ll decide)' },
    { value: 'rounds', label: 'After a number of rounds' },
    { value: 'target', label: 'When someone reaches a score' },
];

const DEFAULT_ROUNDS = 10;
const DEFAULT_TARGET = 100;
const TARGET_STEP = 10;

const endValue = (end: EndCondition): number => (end.type === 'rounds' ? end.rounds : end.target);

const withEndValue = (end: EndCondition, value: number): EndCondition => (
    end.type === 'rounds'
        ? { type: 'rounds', rounds: Math.min(Math.max(value, 1), MAX_ROUND_LIMIT) }
        : { type: 'target', target: Math.min(Math.max(value, 1), MAX_TARGET_SCORE) }
);

const endFootnote = (rules: ScoringRules): string => {
    const winner = rules.winner === 'low' ? 'lowest' : 'highest';
    const end = rules.end;
    if (!end) return 'Play as long as you like and choose the winners yourself.';
    if (end.type === 'rounds') {
        return `After round ${end.rounds}, the game offers to end and suggests the ${winner} total as the winner.`;
    }
    return `When anyone reaches ${end.target} at the end of a round, the game offers to end `
        + `and suggests the ${winner} total as the winner.`;
};

const ScoringRulesScreen: React.FunctionComponent = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const currentGame = useAppSelector(selectCurrentGame);
    // A game is under way once anyone has scored. Changing the rules then
    // re-ranks every round already played, so it asks first.
    const hasScores = useAppSelector(state => (currentGame?.playerIds ?? []).some(
        playerId => (state.players.entities[playerId]?.scores ?? []).some(score => score !== 0)
    ));
    // Asked once per visit: after a confirmed change, adjusting the round
    // limit or target again doesn't ask on every tap.
    const confirmedMidGame = useRef(false);
    // The last limit and target used, so switching between them keeps both.
    const lastRounds = useRef(DEFAULT_ROUNDS);
    const lastTarget = useRef(DEFAULT_TARGET);

    const end = currentGame?.scoring?.end;
    const [draft, setDraft] = useState(end ? String(endValue(end)) : '');
    useEffect(() => {
        if (!end) return;
        setDraft(String(endValue(end)));
        if (end.type === 'rounds') lastRounds.current = end.rounds;
        else lastTarget.current = end.target;
    }, [end]);

    if (!currentGame) return null;

    const rules = scoringRulesOrDefault(currentGame.scoring);

    const applyRules = (next: ScoringRules) => {
        dispatch(setGameScoring({ gameId: currentGame.id, scoring: next }));
        void logEvent('set_game_scoring', {
            game_id: currentGame.id,
            winner: next.winner,
            end: next.end?.type ?? 'none',
            mid_game: hasScores,
        });
    };

    const confirmMidGame = (next: ScoringRules, message: string, onCancel?: () => void) => {
        if (!hasScores || confirmedMidGame.current) {
            applyRules(next);
            return;
        }

        Alert.alert(
            'Change rules mid-game?',
            `This game already has scores. ${message} Scores stay the same, and you can change this back.`,
            [
                { text: 'Keep Current Rules', style: 'cancel', onPress: onCancel },
                {
                    text: 'Change Rules',
                    style: 'destructive',
                    onPress: () => {
                        confirmedMidGame.current = true;
                        applyRules(next);
                    },
                },
            ]
        );
    };

    const selectWinner = (winner: WinCondition) => {
        // Already the saved rule. Picking the default on a free play game
        // still saves it, so the game counts as having a mode from here on.
        if (currentGame.scoring?.winner === winner) return;

        const next: ScoringRules = { ...rules, winner };

        if (rules.winner === winner) {
            applyRules(next);
            return;
        }

        const label = winner === 'low' ? 'lowest' : 'highest';
        confirmMidGame(
            next,
            `The ${label} total will win, which changes who is leading and how players are ranked `
            + 'for every round already played.',
        );
    };

    const endMessage = 'Changing when the game ends can end it sooner or later than everyone planned.';

    const selectEnd = (type: EndType) => {
        const currentType: EndType = rules.end?.type ?? 'none';
        if (type === currentType && currentGame.scoring) return;

        const next: ScoringRules = { winner: rules.winner };
        if (type === 'rounds') next.end = { type: 'rounds', rounds: lastRounds.current };
        if (type === 'target') next.end = { type: 'target', target: lastTarget.current };

        confirmMidGame(next, endMessage);
    };

    const commitValue = (value: number) => {
        if (!rules.end) return;
        const nextEnd = withEndValue(rules.end, value);
        if (endValue(nextEnd) === endValue(rules.end)) {
            setDraft(String(endValue(rules.end)));
            return;
        }
        confirmMidGame(
            { ...rules, end: nextEnd },
            endMessage,
            () => setDraft(String(endValue(rules.end as EndCondition))),
        );
    };

    // The stepper can be tapped while the field is still being edited, so it
    // steps from the typed value when there is one, not the saved one.
    const editedValue = (): number => {
        const typed = parseInt(draft, 10);
        if (!Number.isNaN(typed)) return typed;
        return rules.end ? endValue(rules.end) : 0;
    };

    const commitDraft = () => {
        if (!rules.end) return;
        const value = parseInt(draft, 10);
        if (Number.isNaN(value)) {
            setDraft(String(endValue(rules.end)));
            return;
        }
        commitValue(value);
    };

    const step = rules.end?.type === 'target' ? TARGET_STEP : 1;
    const currentEndType: EndType = rules.end?.type ?? 'none';

    return (
        <ScrollView
            // The value field sits low on the screen: on iOS the keyboard
            // overlays it unless the scroll insets follow the keyboard.
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={{ paddingBottom: 50 }}
            keyboardShouldPersistTaps="handled"
            testID="scoring-rules"
        >
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

                <SectionLabel inset={30}>Game ends</SectionLabel>
                <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
                    {endOptions.map((option, index) => {
                        const selected = currentEndType === option.value;
                        return (
                            <React.Fragment key={option.value}>
                                {index > 0 && <View style={[styles.separator, { backgroundColor: theme.separator }]} />}
                                <TouchableOpacity
                                    testID={`scoring-end-${option.value}`}
                                    accessibilityRole="radio"
                                    accessibilityState={{ selected }}
                                    style={styles.row}
                                    onPress={() => selectEnd(option.value)}
                                >
                                    <Text style={[styles.rowLabel, { color: theme.text }]}>{option.label}</Text>
                                    {selected && <Icon name="checkmark" type="ionicon" color={theme.tint} size={22} />}
                                </TouchableOpacity>
                            </React.Fragment>
                        );
                    })}
                    {rules.end && (
                        <>
                            <View style={[styles.separator, { backgroundColor: theme.separator }]} />
                            <View style={styles.row}>
                                <Text style={[styles.rowLabel, { color: theme.text }]}>
                                    {rules.end.type === 'rounds' ? 'Rounds' : 'Target score'}
                                </Text>
                                <View style={styles.valueControls}>
                                    <TextInput
                                        testID="scoring-end-value"
                                        accessibilityLabel={rules.end.type === 'rounds' ? 'Rounds' : 'Target score'}
                                        keyboardType="number-pad"
                                        returnKeyType="done"
                                        selectTextOnFocus
                                        value={draft}
                                        onChangeText={text => setDraft(text.replace(/[^0-9]/g, ''))}
                                        onEndEditing={commitDraft}
                                        onSubmitEditing={commitDraft}
                                        maxLength={6}
                                        style={[styles.valueInput, {
                                            color: theme.text,
                                            backgroundColor: theme.inputBackground,
                                        }]}
                                    />
                                    <View style={[styles.stepper, { backgroundColor: theme.inputBackground }]}>
                                        <TouchableOpacity
                                            testID="scoring-end-decrease"
                                            accessibilityLabel="Decrease"
                                            accessibilityRole="button"
                                            style={styles.stepperButton}
                                            onPress={() => commitValue(editedValue() - step)}
                                        >
                                            <Text style={[styles.stepperLabel, { color: theme.tint }]}>−</Text>
                                        </TouchableOpacity>
                                        <View style={[styles.stepperDivider, { backgroundColor: theme.separator }]} />
                                        <TouchableOpacity
                                            testID="scoring-end-increase"
                                            accessibilityLabel="Increase"
                                            accessibilityRole="button"
                                            style={styles.stepperButton}
                                            onPress={() => commitValue(editedValue() + step)}
                                        >
                                            <Text style={[styles.stepperLabel, { color: theme.tint }]}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </>
                    )}
                </View>
                <Text testID="scoring-end-footnote" style={[styles.footnote, { color: theme.textSecondary }]}>
                    {endFootnote(rules)}
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
    valueControls: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
    },
    valueInput: {
        borderRadius: 8,
        fontSize: 18,
        fontVariant: ['tabular-nums'],
        minWidth: 64,
        paddingHorizontal: 10,
        paddingVertical: 6,
        textAlign: 'center',
    },
    stepper: {
        alignItems: 'center',
        borderRadius: 8,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    stepperButton: {
        alignItems: 'center',
        height: 34,
        justifyContent: 'center',
        width: 44,
    },
    stepperLabel: {
        fontSize: 22,
        fontWeight: '500',
    },
    stepperDivider: {
        height: 18,
        width: StyleSheet.hairlineWidth,
    },
});

export default ScoringRulesScreen;
