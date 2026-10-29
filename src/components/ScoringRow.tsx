import React from 'react';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppSelector } from '../../redux/hooks';
import { ScoringRules } from '../../redux/ScoringRules';
import { selectCurrentGame, selectGameModesVisible } from '../../redux/selectors';
import { useTheme } from '../theme';

import SectionLabel from './SectionLabel';

/** How the game ends, or undefined when the players decide. */
export const endSummary = (rules: ScoringRules | undefined): string | undefined => {
    const end = rules?.end;
    if (!end) return undefined;
    if (end.type === 'rounds') return `${end.rounds} ${end.rounds === 1 ? 'round' : 'rounds'}`;
    return `ends at ${end.target}`;
};

const withEnd = (winner: string, rules: ScoringRules): string => {
    const end = endSummary(rules);
    return end ? `${winner} · ${end}` : winner;
};

export const scoringSummary = (rules: ScoringRules | undefined): string => {
    if (!rules) return 'Free play';
    return withEnd(rules.winner === 'low' ? 'Lowest score wins' : 'Highest score wins', rules);
};

/** The rule in a few words, for tight spots like the game sheet header. */
export const scoringShortSummary = (rules: ScoringRules | undefined): string => {
    if (!rules) return 'Free play';
    return withEnd(rules.winner === 'low' ? 'Lowest wins' : 'Highest wins', rules);
};

/**
 * The Scoring row on Edit Game. Opens the game's scoring rules. Hidden unless
 * the game modes flag is on or the game already has rules.
 */
interface Props {
    onPress: () => void;
}

const ScoringRow: React.FunctionComponent<Props> = ({ onPress }) => {
    const theme = useTheme();
    const currentGame = useAppSelector(selectCurrentGame);
    const visible = useAppSelector(state => selectGameModesVisible(state, currentGame?.id));

    if (!currentGame || !visible) return null;

    return (
        <View>
            <SectionLabel inset={30}>Scoring</SectionLabel>
            <TouchableOpacity
                testID="scoring-row"
                accessibilityRole="button"
                accessibilityLabel={`Scoring: ${scoringSummary(currentGame.scoring)}`}
                style={[styles.row, { backgroundColor: theme.inputBackground }]}
                onPress={onPress}
            >
                <Text style={[styles.label, { color: theme.text }]}>
                    {scoringSummary(currentGame.scoring)}
                </Text>
                <Text style={[styles.arrow, { color: theme.separator }]}>›</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginVertical: 5,
        marginHorizontal: 10,
    },
    label: {
        fontSize: 18,
    },
    arrow: {
        fontSize: 22,
    },
});

export default ScoringRow;
