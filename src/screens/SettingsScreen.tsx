import React, { useState } from 'react';
import { Platform, PlatformIOSStatic, Text, View, StyleSheet, Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Icon, Button } from 'react-native-elements';
import * as Crypto from 'expo-crypto';
import analytics from '@react-native-firebase/analytics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';

import { playerAdd } from '../../redux/PlayersSlice';
import EditPlayer from '../components/EditPlayer';
import { selectGameById, updateGame, } from '../../redux/GamesSlice';
import { selectAllPlayers } from '../../redux/PlayersSlice';
import EditGame from '../components/EditGame';
import { updatePlayer } from '../../redux/PlayersSlice';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const SettingsScreen: React.FunctionComponent<Props> = ({ navigation }) => {
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

    const maxPlayers = (() => {
        if (Platform.OS === 'ios') {
            const platformIOS = Platform as PlatformIOSStatic;
            return platformIOS.isPad ? 12 : 8;
        }
        return 8;
    })();

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

    const resetGameHandler = () => {
        Alert.alert(
            "Reset Game",
            "Are you sure you want to reset this game? This will reset all scores and rounds.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Reset",
                    onPress: () => {
                        if (currentGame == undefined) return;

                        players.forEach((player) => {
                            dispatch(updatePlayer({
                                id: player.id,
                                changes: {
                                    scores: [0],
                                }
                            }
                            ));
                        });
                        dispatch(updateGame({
                            id: currentGame.id,
                            changes: {
                                roundCurrent: 0,
                                roundTotal: 0,
                            }
                        }));
                        navigation.navigate("Game");
                    }
                }
            ]
        );
    };

    return (
        <KeyboardAwareScrollView style={styles.configScrollContainer}
            contentContainerStyle={{ alignItems: 'stretch' }}>
            <View style={{ width: 350, alignSelf: 'center' }}>
                <Text style={styles.heading}>Game Title</Text>

                <EditGame />

                <Button
                    title="Reset Game"
                    onPress={resetGameHandler}
                    type="clear"
                    titleStyle={{
                        color: '#ff375f'
                    }}
                />

                <Text style={styles.heading}>Players</Text>
                {players.map((player, index) => (
                    <EditPlayer
                        playerId={player.id}
                        index={index}
                        setPlayerWasAdded={setPlayerWasAdded}
                        playerWasAdded={playerWasAdded}
                        key={player.id}
                    />
                ))}
                <View style={{ margin: 10 }}>
                    <Button title="Add Player"
                        icon={<Icon name="add" color="white" />}
                        disabled={players.length >= maxPlayers}
                        onPress={addPlayerHandler} />
                </View>
                {players.length >= maxPlayers &&
                    <Text style={styles.text}>Max players reached.</Text>
                }
            </View>
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    configScrollContainer: {
        flex: 1,
        padding: 10,
        paddingBottom: 50,
    },
    text: {
        fontSize: 18,
        margin: 15,
        color: '#eee',
    },
    heading: {
        fontSize: 20,
        marginTop: 20,
        marginBottom: 0,
        color: '#eee',
    }
});

export default SettingsScreen;
