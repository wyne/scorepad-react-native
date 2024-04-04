import React, { useState } from 'react';

import analytics from '@react-native-firebase/analytics';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { StyleSheet, Text, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { Button, Icon } from 'react-native-elements';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { reorderPlayers, selectSortedPlayers, updateGame } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { playerAdd } from '../../redux/PlayersSlice';
import { selectCurrentGame } from '../../redux/selectors';
import EditGame from '../components/EditGame';
import PlayerListItem from '../components/PlayerListItem';
import { systemBlue } from '../constants';
import logger from '../Logger';

type RouteParams = {
    Settings: {
        reason?: string;
    };
};

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    route: RouteProp<RouteParams, 'Settings'>;
}

const SettingsScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const dispatch = useAppDispatch();
    const [playerWasAdded, setPlayerWasAdded] = useState(false);

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    if (typeof currentGameId == 'undefined') return null;

    const currentGame = useAppSelector(selectCurrentGame);
    const players = useAppSelector(selectSortedPlayers);

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
        // <KeyboardAwareScrollView style={styles.configScrollContainer}
        //     extraScrollHeight={200}>
        <View style={{ marginBottom: 200 }}>
            <Text style={styles.heading}>Game Title</Text>

            <EditGame />

            <Text style={styles.heading}>Players</Text>

            <Animated.View layout={LinearTransition.duration(200)}>
                <DraggableFlatList
                    data={players}
                    renderItem={({ item: player, getIndex, drag, isActive }) => (
                        <ScaleDecorator activeScale={1.05}>
                            <PlayerListItem
                                navigation={navigation}
                                playerId={player.id}
                                drag={drag}
                                isActive={isActive}
                                index={getIndex() || 0}
                                setPlayerWasAdded={setPlayerWasAdded}
                                playerWasAdded={playerWasAdded}
                                key={player.id}
                            />
                        </ScaleDecorator>
                    )}
                    keyExtractor={(player) => player.id}
                    onDragEnd={({ data }) => {
                        // Reorder players
                        dispatch(
                            reorderPlayers({
                                gameId: currentGameId,
                                playerIds: data.map((player) => player.id)
                            })
                        );

                        logger.info('Reorder players');
                    }}
                />
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
        // </KeyboardAwareScrollView>
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
