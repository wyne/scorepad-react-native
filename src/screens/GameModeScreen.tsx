import React, { useState } from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GamePreset, gamePresets, matchingPreset, searchPresets } from '../../redux/GamePresets';
import { setGameScoring } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { ScoringRules } from '../../redux/ScoringRules';
import { selectCurrentGame } from '../../redux/selectors';
import { logEvent } from '../Analytics';
import { scoringSummary } from '../components/ScoringRow';
import SectionLabel from '../components/SectionLabel';
import { useTheme } from '../theme';

/** What a preset does, in a few words, for its row. */
export const presetDescription = (rules: ScoringRules): string => {
    const end = rules.end;
    if (!end) return rules.winner === 'low' ? 'Lowest wins' : 'Highest wins';
    if (end.type === 'rounds') return `${end.rounds} rounds`;
    const target = end.target.toLocaleString('en-US');
    return rules.winner === 'low' ? `Ends when anyone reaches ${target}` : `First to ${target}`;
};

const groups: { title: string; winner: ScoringRules['winner']; }[] = [
    { title: 'Lowest wins', winner: 'low' },
    { title: 'Highest wins', winner: 'high' },
];

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

/**
 * Picks the game being played. A named game copies its scoring rules into
 * this game; Custom Rules opens the rules to set by hand.
 */
const GameModeScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const currentGame = useAppSelector(selectCurrentGame);
    const hasScores = useAppSelector(state => (currentGame?.playerIds ?? []).some(
        playerId => (state.players.entities[playerId]?.scores ?? []).some(score => score !== 0)
    ));
    const [query, setQuery] = useState('');

    if (!currentGame) return null;

    const scoring = currentGame.scoring;
    const selectedPreset = matchingPreset(scoring);
    const isCustom = scoring !== undefined && selectedPreset === undefined;
    const results = searchPresets(query, gamePresets);
    const searching = query.trim().length > 0;

    const apply = (next: ScoringRules | undefined, mode: string) => {
        dispatch(setGameScoring({ gameId: currentGame.id, scoring: next }));
        void logEvent('set_game_mode', { game_id: currentGame.id, mode, mid_game: hasScores });
        navigation.goBack();
    };

    const choose = (next: ScoringRules | undefined, mode: string, label: string) => {
        if (!hasScores) {
            apply(next, mode);
            return;
        }

        Alert.alert(
            'Change rules mid-game?',
            `This game already has scores. Switching to ${label} changes who is leading, how players `
            + 'are ranked, and when the game ends. Scores stay the same, and you can change this back.',
            [
                { text: 'Keep Current Rules', style: 'cancel' },
                { text: 'Change Rules', style: 'destructive', onPress: () => apply(next, mode) },
            ]
        );
    };

    const choosePreset = (preset: GamePreset) => {
        if (selectedPreset?.id === preset.id) {
            navigation.goBack();
            return;
        }
        choose({ ...preset.rules }, preset.id, preset.name);
    };

    const chooseFreePlay = () => {
        if (!scoring) {
            navigation.goBack();
            return;
        }
        choose(undefined, 'free_play', 'free play');
    };

    const renderRow = (
        testID: string,
        title: string,
        description: string,
        selected: boolean,
        onPress: () => void,
        first: boolean,
    ) => (
        <React.Fragment key={testID}>
            {!first && <View style={[styles.separator, { backgroundColor: theme.separator }]} />}
            <TouchableOpacity
                testID={testID}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${title}, ${description}`}
                style={styles.row}
                onPress={onPress}
            >
                <View style={styles.rowText}>
                    <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
                    <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>{description}</Text>
                </View>
                {selected && <Icon name="checkmark" type="ionicon" color={theme.tint} size={22} />}
            </TouchableOpacity>
        </React.Fragment>
    );

    return (
        <ScrollView
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={{ paddingBottom: 50 }}
            keyboardShouldPersistTaps="handled"
            testID="game-mode"
        >
            <SafeAreaView edges={['left', 'right']}>
                <View style={[styles.search, { backgroundColor: theme.backgroundSecondary }]}>
                    <Icon name="search" type="ionicon" color={theme.textTertiary} size={18} />
                    <TextInput
                        testID="game-mode-search"
                        accessibilityLabel="Search games"
                        placeholder="Search games"
                        placeholderTextColor={theme.textTertiary}
                        autoCorrect={false}
                        clearButtonMode="while-editing"
                        returnKeyType="search"
                        value={query}
                        onChangeText={setQuery}
                        style={[styles.searchInput, { color: theme.text }]}
                    />
                </View>

                {!searching && (
                    <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
                        {renderRow(
                            'game-mode-free-play',
                            'Free play',
                            'Highest wins · No end · You pick winners',
                            scoring === undefined,
                            chooseFreePlay,
                            true,
                        )}
                    </View>
                )}

                {groups.map(group => {
                    const presets = results.filter(preset => preset.rules.winner === group.winner);
                    if (presets.length === 0) return null;
                    return (
                        <View key={group.winner}>
                            <SectionLabel inset={30}>{group.title}</SectionLabel>
                            <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
                                {presets.map((preset, index) => renderRow(
                                    `game-mode-${preset.id}`,
                                    preset.name,
                                    presetDescription(preset.rules),
                                    selectedPreset?.id === preset.id,
                                    () => choosePreset(preset),
                                    index === 0,
                                ))}
                            </View>
                        </View>
                    );
                })}

                {searching && results.length === 0 && (
                    <Text style={[styles.empty, { color: theme.textSecondary }]} testID="game-mode-no-results">
                        No games match “{query.trim()}”. Set the rules yourself with Custom Rules.
                    </Text>
                )}

                <View style={[styles.section, styles.customSection, { backgroundColor: theme.backgroundSecondary }]}>
                    <TouchableOpacity
                        testID="game-mode-custom"
                        accessibilityRole="button"
                        style={styles.row}
                        onPress={() => navigation.navigate('ScoringRules')}
                    >
                        <View style={styles.rowText}>
                            <Text style={[styles.rowTitle, { color: theme.text }]}>Custom Rules…</Text>
                            {isCustom && (
                                <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>
                                    {scoringSummary(scoring)}
                                </Text>
                            )}
                        </View>
                        {isCustom
                            ? <Icon name="checkmark" type="ionicon" color={theme.tint} size={22} />
                            : <Text style={[styles.arrow, { color: theme.separator }]}>›</Text>}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    search: {
        alignItems: 'center',
        borderRadius: 10,
        flexDirection: 'row',
        gap: 8,
        marginHorizontal: 10,
        marginTop: 15,
        marginBottom: 10,
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 17,
        minHeight: 40,
    },
    section: {
        borderRadius: 10,
        marginHorizontal: 10,
        marginVertical: 5,
        paddingHorizontal: 20,
    },
    customSection: {
        marginTop: 25,
    },
    row: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 56,
        paddingVertical: 8,
    },
    rowText: {
        flex: 1,
        gap: 2,
    },
    rowTitle: {
        fontSize: 18,
    },
    rowDescription: {
        fontSize: 13,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
    },
    arrow: {
        fontSize: 22,
    },
    empty: {
        fontSize: 15,
        marginHorizontal: 30,
        marginTop: 20,
    },
});

export default GameModeScreen;
