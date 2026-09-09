import { StyleSheet, Text } from 'react-native';
import { Icon } from 'react-native-elements';

import { useAppSelector } from '../../redux/hooks';
import { selectPlayerById } from '../../redux/PlayersSlice';
import { useTheme } from '../theme';

interface Props {
    playerId: string;
    last?: boolean;
    isWinner?: boolean;
}

/**
 * One name in the game row's player line.
 *
 * Returns a nested `Text` rather than a `View`, so names flow and wrap as a
 * single line of text and the parent can truncate the run of them. A winner
 * used to render as a flex row, which made it a block among inline siblings —
 * it sat off the baseline and broke where the line wrapped.
 */
const GameListItemPlayerName: React.FunctionComponent<Props> = ({ playerId, last = false, isWinner = false }) => {
    const theme = useTheme();
    const playerName = useAppSelector(state => selectPlayerById(state, playerId)?.playerName);

    return (
        <Text style={isWinner ? [styles.winner, { color: theme.text }] : undefined}>
            {isWinner && <Icon name="trophy" type="ionicon" size={13} color={theme.warning} />}
            {isWinner && ' '}
            {playerName}{!last && ', '}
        </Text>
    );
};

const styles = StyleSheet.create({
    winner: {
        fontWeight: '600',
    },
});

export default GameListItemPlayerName;
