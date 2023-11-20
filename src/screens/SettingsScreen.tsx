import React, { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Icon, Button } from 'react-native-elements';
import * as Crypto from 'expo-crypto';
import analytics from '@react-native-firebase/analytics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase, RouteProp } from '@react-navigation/native';

import { playerAdd } from '../../redux/PlayersSlice';
import EditPlayer from '../components/EditPlayer';
import { selectGameById, updateGame, } from '../../redux/GamesSlice';
import { selectAllPlayers } from '../../redux/PlayersSlice';
import EditGame from '../components/EditGame';
import { systemBlue } from '../constants';
import Animated, { Layout } from 'react-native-reanimated';

type RouteParams = {
    Settings: {
        reason?: string;
    };
};

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    route: RouteProp<RouteParams, 'Settings'>;
}

const SettingsScreen: React.FunctionComponent<Props> = ({ }) => {
    const dispatch = useAppDispatch();
    const [playerWasAdded, setPlayerWasAdded] = useState(false);

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    if (typeof currentGameId == 'undefined') return null;

    const currentGame = useAppSelector(state => selectGameById(state, state.settings.currentGameId));
    const players = useAppSelector(state => selectAllPlayers(state)
        .filter(player => currentGame?.playerIds.includes(player.id))
    ).sort((a, b) => {
        if (currentGame?.playerIds == undefined) return 0;
        return currentGame.playerIds.indexOf(a.id) - currentGame.playerIds.indexOf(b.id);
    });

    const maxPlayers = 12;

    const addPlayerHandler = async () => {
        if (currentGame == undefined) return;

        const newPlayerId = Crypto.randomUUID();

        dispatch(playerAdd({
            id: newPlayerId,
            playerName: `Player ${players.length + 1}`,
            scores: [0],
        }));

        dispatch(updateGame({
            id: currentGame.id,
            changes: {
                playerIds: [...currentGame.playerIds, newPlayerId],
            }
        }));

        setPlayerWasAdded(true);

        await analytics().logEvent('add_player', {
            game_id: currentGameId,
            player_count: players.length + 1,
        });
    };

    return (
        <KeyboardAwareScrollView style={styles.configScrollContainer}
            extraScrollHeight={200}>
            <View style={{ marginBottom: 200 }}>
                <Text style={styles.heading}>Game Title</Text>

                <EditGame />

                <Text style={styles.heading}>Player Names</Text>
                <Animated.View layout={Layout.duration(200)}>
                    {players.map((player, index) => (
                        <EditPlayer
                            playerId={player.id}
                            index={index}
                            setPlayerWasAdded={setPlayerWasAdded}
                            playerWasAdded={playerWasAdded}
                            key={player.id}
                        />
                    ))}
                </Animated.View>
                <Animated.View style={{ margin: 10 }}>
                    {players.length < maxPlayers &&
                        <Button title="Add Player" type="clear"
                            icon={<Icon name="add" color={systemBlue} />}
                            disabled={players.length >= maxPlayers}
                            onPress={addPlayerHandler} />
                    }
                    {players.length >= maxPlayers &&
                        <Text style={styles.text}>Max players reached.</Text>
                    }
                </Animated.View>
            </View>
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    configScrollContainer: {
        flex: 1,
    },
    text: {
        fontSize: 18,
        margin: 15,
        color: '#eee',
    },
    heading: {
        fontSize: 14,
        textTransform: 'uppercase',
        marginHorizontal: 20,
        marginVertical: 5,
        marginTop: 20,
        color: '#eee',
    }
});

export default SettingsScreen;
