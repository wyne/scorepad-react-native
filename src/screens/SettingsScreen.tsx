import React, { useEffect } from 'react';

import { ParamListBase, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { Button, Icon } from 'react-native-elements';

import { addPlayer, reorderPlayers } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectCurrentGame } from '../../redux/selectors';
import { logEvent } from '../Analytics';
import EditGame from '../components/EditGame';
import PlayerListItem from '../components/PlayerListItem';
import { MAX_PLAYERS, systemBlue } from '../constants';
import logger from '../Logger';

type RouteParams = {
    Settings: {
        source?: string;
    };
};

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    route: RouteProp<RouteParams, 'Settings'>;
}

const SettingsScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const dispatch = useAppDispatch();

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(selectCurrentGame);
    const playerIds = useAppSelector(state => selectCurrentGame(state)?.playerIds);
    const [edit, setEdit] = React.useState(false);

    if (typeof currentGameId == 'undefined') return null;
    if (typeof playerIds == 'undefined') return null;

    const addPlayerHandler = async () => {
        if (currentGame == undefined) return;

        dispatch(addPlayer({
            gameId: currentGameId,
            playerName: `Player ${playerIds.length + 1}`,
        }));

        await logEvent('add_player', {
            game_id: currentGameId,
            player_count: playerIds.length + 1,
        });
    };

    useEffect(() => {
        if (playerIds.length <= 1) {
            setEdit(false);
        }
    }, [playerIds.length]);

    const ListFooter = () => (
        <View style={{ margin: 10, marginBottom: 50, alignSelf: 'center' }}>
            {playerIds.length < MAX_PLAYERS &&
                <Button title="Add Player" type="clear"
                    icon={<Icon name="add" color={systemBlue} />}
                    disabled={playerIds.length >= MAX_PLAYERS}
                    onPress={addPlayerHandler} />
            }
            {playerIds.length >= MAX_PLAYERS &&
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
                {playerIds.length > 1 &&
                    <TouchableOpacity onPress={() => setEdit(!edit)}>
                        <Text style={[styles.heading, { color: systemBlue }]}>{edit ? 'Done' : 'Edit'}</Text>
                    </TouchableOpacity>
                }
            </View>

            <DraggableFlatList
                containerStyle={{ flex: 1 }}
                ListFooterComponent={ListFooter}
                data={playerIds}
                renderItem={({ item: playerId, getIndex, drag, isActive }) => (
                    <ScaleDecorator activeScale={1.05}>
                        <PlayerListItem
                            navigation={navigation}
                            playerId={playerId}
                            edit={edit}
                            drag={drag}
                            isActive={isActive}
                            index={getIndex()}
                            key={playerId}
                        />
                    </ScaleDecorator>
                )}
                keyExtractor={(playerId) => playerId}
                onDragEnd={({ data }) => {
                    // Reorder players
                    dispatch(
                        reorderPlayers({
                            gameId: currentGameId,
                            playerIds: data.map((playerId) => playerId)
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
