import React, { useEffect } from 'react';

import analytics from '@react-native-firebase/analytics';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { Button, Icon } from 'react-native-elements';

import { reorderPlayers, selectSortedPlayers, updateGame } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { playerAdd } from '../../redux/PlayersSlice';
import { selectCurrentGame } from '../../redux/selectors';
import EditGame from '../components/EditGame';
import PlayerListItem from '../components/PlayerListItem';
import { MAX_PLAYERS, systemBlue } from '../constants';
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

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    if (typeof currentGameId == 'undefined') return null;

    const currentGame = useAppSelector(selectCurrentGame);
    const players = useAppSelector(selectSortedPlayers);

    const [edit, setEdit] = React.useState(false);

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

        await analytics().logEvent('add_player', {
            game_id: currentGameId,
            player_count: players.length + 1,
        });
    };

    useEffect(() => {
        if (players.length <= 1) {
            setEdit(false);
        }
    }, [players]);

    const ListFooter = () => (
        <View style={{ margin: 10, marginBottom: 200, alignSelf: 'center' }}>
            {players.length < MAX_PLAYERS &&
                <Button title="Add Player" type="clear"
                    icon={<Icon name="add" color={systemBlue} />}
                    disabled={players.length >= MAX_PLAYERS}
                    onPress={addPlayerHandler} />
            }
            {players.length >= MAX_PLAYERS &&
                <Text style={styles.text}>Max players reached.</Text>
            }
        </View>
    );

    return (
        <View style={{ flex: 1 }}>

            <Text style={styles.heading}>Game Title</Text>
            <EditGame />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.heading}>Players</Text>
                {players.length > 1 &&
                    <TouchableOpacity onPress={() => setEdit(!edit)}>
                        <Text style={[styles.heading, { color: systemBlue }]}>{edit ? 'Done' : 'Edit'}</Text>
                    </TouchableOpacity>
                }
            </View>

            <DraggableFlatList
                ListFooterComponent={ListFooter}
                data={players}
                renderItem={({ item: player, getIndex, drag, isActive }) => (
                    <ScaleDecorator activeScale={1.05}>
                        <PlayerListItem
                            navigation={navigation}
                            playerId={player.id}
                            edit={edit}
                            drag={drag}
                            isActive={isActive}
                            index={getIndex()}
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
        </View>
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
