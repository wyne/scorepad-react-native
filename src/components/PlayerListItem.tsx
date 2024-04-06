import React from 'react';

import analytics from '@react-native-firebase/analytics';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon, ListItem } from 'react-native-elements';

import { updateGame } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { removePlayer, selectPlayerById } from '../../redux/PlayersSlice';
import { selectCurrentGame } from '../../redux/selectors';
import { palette } from '../constants';

interface Props {
    playerId: string;
    index: number | undefined;
    isActive: boolean;
    drag: () => void;
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    edit: boolean;
}

const PlayerListItem: React.FunctionComponent<Props> = ({
    playerId,
    index,
    drag,
    isActive,
    navigation,
    edit,
}) => {
    const currentGame = useAppSelector(selectCurrentGame);
    const player = useAppSelector(state => selectPlayerById(state, playerId));

    if (typeof currentGame == 'undefined') return null;
    if (typeof index == 'undefined') return null;

    const dispatch = useAppDispatch();

    const deleteConfirmHandler = async () => {
        Alert.alert(
            "Delete Player",
            "Are you sure you want to delete this player? This will delete all scores for this player.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    onPress: () => {
                        deleteHandler();
                    }
                }
            ]
        );
    };

    const deleteHandler = async () => {
        removePlayerHandler();

        await analytics().logEvent('remove_player', {
            game_id: currentGame.id,
            player_index: index,
        });
    };

    const removePlayerHandler = () => {
        dispatch(updateGame({
            id: currentGame.id,
            changes: {
                playerIds: currentGame.playerIds.filter((id) => id != playerId),
            }
        }));
        dispatch(removePlayer(playerId));
    };

    const DeleteButton = () => {
        return <View style={{ flexDirection: 'column' }} >
            <TouchableOpacity onPress={deleteConfirmHandler}>
                <Icon size={25} name="remove-circle" color="#ff375f" />
            </TouchableOpacity>
        </View>;
    };

    return (
        <View style={styles.playerContainer} key={player?.id}>
            <TouchableOpacity
                onLongPress={drag}
                onPress={() => {
                    navigation.navigate('EditPlayer', { playerId: playerId, index: index });
                }}
                disabled={isActive}
                style={[{
                    flexDirection: 'row',
                    alignItems: 'center',
                }]} >

                <Text style={styles.playerNumber}>
                    {index + 1}
                </Text>

                <View style={[
                    styles.colorBadge,
                    { backgroundColor: "#" + palette[index % palette.length] }
                ]} >
                </View>

                <Text style={[styles.input]}>
                    {player?.playerName}
                </Text>
                {
                    edit ?
                        <DeleteButton /> :
                        <ListItem.Chevron />
                }
            </TouchableOpacity>

        </View>
    );
};

const styles = StyleSheet.create({
    playerContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        backgroundColor: '#222',
        borderRadius: 10,
        padding: 2,
        paddingHorizontal: 10,
        marginVertical: 5,
        marginHorizontal: 10,
    },
    playerNumber: {
        color: '#eee',
        fontSize: 25,
        fontVariant: ['tabular-nums'],
        fontWeight: "bold",
        padding: 5,
    },
    colorBadge: {
        borderColor: '#eee',
        borderRadius: 25,
        height: 25,
        marginHorizontal: 5,
        padding: 5,
        width: 25,
    },
    input: {
        color: '#eee',
        flex: 1,
        fontSize: 18,
    },
});

export default PlayerListItem;
