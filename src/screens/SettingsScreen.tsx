import React, { useEffect, useLayoutEffect } from 'react';

import { ParamListBase, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { Button, Icon } from 'react-native-elements';

import { addPlayer, reorderPlayers } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectCurrentGame } from '../../redux/selectors';
import { logEvent } from '../Analytics';
import HeaderButton from '../components/Buttons/HeaderButton';
import EditGame from '../components/EditGame';
import PlayerListItem from '../components/PlayerListItem';
import { MAX_PLAYERS } from '../constants';
import { useTheme } from '../theme';

type RouteParams = {
    Settings: {
        source?: string;
    };
};

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    route: RouteProp<RouteParams, 'Settings'>;
}

const SettingsScreen: React.FunctionComponent<Props> = ({ navigation, route }) => {
    const dispatch = useAppDispatch();

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(state => selectCurrentGame(state));
    const playerIds = currentGame?.playerIds;
    const theme = useTheme();
    const [edit, setEdit] = React.useState(false);

    useEffect(() => {
        if (playerIds !== undefined && playerIds.length <= 1) {
            setEdit(false);
        }
    }, [playerIds]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <HeaderButton accessibilityLabel='Save Game' onPress={async () => {
                    await logEvent('save_game', {
                        source: route?.params?.source,
                        gameId: currentGame?.id,
                        palette: currentGame?.palette,
                        player_count: currentGame?.playerIds.length,
                    });

                    if (route?.params?.source === 'new_game') {
                        navigation.replace('Game');
                    } else {
                        navigation.goBack();
                    }
                }}>
                    <Text style={{ color: theme.tint, fontSize: 20 }} allowFontScaling={false}>Done</Text>
                </HeaderButton>
            ),
        });
    }, [navigation, route, currentGame, theme.tint]);

    if (typeof currentGameId == 'undefined') return null;
    if (typeof playerIds == 'undefined') return null;

    const addPlayerHandler = async () => {
        dispatch(addPlayer({
            gameId: currentGameId,
            playerName: `Player ${playerIds.length + 1}`,
        }));

        await logEvent('add_player', {
            game_id: currentGameId,
            player_count: playerIds.length + 1,
        });
    };

    const ListFooter = () => (
        <View style={{ margin: 10, marginBottom: 50, alignSelf: 'center' }}>
            {playerIds.length < MAX_PLAYERS &&
                <Button title="Add Player" type="clear"
                    icon={<Icon name="add" color={theme.tint} />}
                    disabled={playerIds.length >= MAX_PLAYERS}
                    onPress={addPlayerHandler} />
            }
            {playerIds.length >= MAX_PLAYERS &&
                <Text style={[styles.text, { color: theme.textSecondary }]}>Max players reached.</Text>
            }
        </View>
    );

    return (
        <View style={{ flex: 1 }}>

            <Text style={[styles.heading, { color: theme.textSecondary }]}>Game Title</Text>
            <EditGame />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[styles.heading, { color: theme.textSecondary }]}>Players</Text>
                {playerIds.length > 1 &&
                    <TouchableOpacity onPress={() => {
                        setEdit(!edit);
                        logEvent('edit_players', {
                            game_id: currentGameId,
                            player_count: playerIds.length,
                        });
                    }}>
                        <Text style={[styles.heading, { color: theme.tint }]}>{edit ? 'Done' : 'Edit'}</Text>
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

                    logEvent('reorder_players', {
                        game_id: currentGameId,
                        player_count: data.length,
                    });
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
    },
    heading: {
        fontSize: 14,
        textTransform: 'uppercase',
        marginHorizontal: 20,
        marginVertical: 5,
        marginTop: 20,
    }
});

export default SettingsScreen;
