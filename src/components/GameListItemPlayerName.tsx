import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements';

import { useAppSelector } from '../../redux/hooks';
import { selectPlayerById } from '../../redux/PlayersSlice';
import { useTheme } from '../theme';

interface Props {
    playerId: string;
    last?: boolean;
    isWinner?: boolean;
}

const GameListItemPlayerName: React.FunctionComponent<Props> = ({ playerId, last = false, isWinner = false }) => {
    const theme = useTheme();
    const playerName = useAppSelector(state => selectPlayerById(state, playerId)?.playerName);

    if (isWinner) {
        return (
            <View style={styles.winnerRow}>
                <Icon name="trophy" type="ionicon" size={14} color={theme.warning} style={{ marginRight: 2 }} />
                <Text style={[styles.winnerText, { color: theme.text }]}>
                    {playerName}{!last && ', '}
                </Text>
            </View>
        );
    }

    return (
        <Text style={{ color: theme.text }}>{playerName}{!last && ', '}</Text>
    );
};

const styles = StyleSheet.create({
    winnerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    winnerText: {
        fontWeight: 'bold',
    },
});

export default GameListItemPlayerName;
