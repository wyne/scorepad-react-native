import React from 'react';

import analytics from '@react-native-firebase/analytics';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, NativeSyntheticEvent, StyleSheet, Text, TextInputEndEditingEventData, TouchableOpacity, View } from 'react-native';
import { Icon, ListItem } from 'react-native-elements';
import Animated from 'react-native-reanimated';

import { updateGame } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { removePlayer, selectPlayerById, updatePlayer } from '../../redux/PlayersSlice';
import { selectCurrentGame } from '../../redux/selectors';
import { palette } from '../constants';

interface Props {
    playerId: string;
    index: number;
    setPlayerWasAdded: React.Dispatch<React.SetStateAction<boolean>>;
    playerWasAdded: boolean;
    isActive: boolean;
    drag: () => void;
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const PlayerListItem: React.FunctionComponent<Props> = ({
    playerId,
    index,
    setPlayerWasAdded,
    playerWasAdded,
    drag,
    isActive,
    navigation
}) => {
    const dispatch = useAppDispatch();
    const currentGame = useAppSelector(selectCurrentGame);
    const player = useAppSelector(state => selectPlayerById(state, playerId));

    if (typeof currentGame == 'undefined') return null;

    const playerIds = currentGame.playerIds;

    const setPlayerNameHandler = (index: number, name: string) => {
        dispatch(updatePlayer({
            id: playerId,
            changes: {
                playerName: name,
            }
        }));
        setPlayerWasAdded(false);
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

    const onEndEditingHandler = (e: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
        if (e.nativeEvent.text == "") {
            setPlayerNameHandler(index, 'Player ' + (index + 1));
        }
    };

    const onChangeTextHandler = (text: string) => {
        setPlayerNameHandler(index, text);
    };

    const deleteHandler = async () => {
        removePlayerHandler();
        await analytics().logEvent('remove_player', {
            game_id: currentGame.id,
            player_count: playerIds.length,
            player_index: index,
        });
    };

    const defaultPlayerName = (() => {
        if (index == playerIds.length - 1 && playerWasAdded) {
            return undefined;
        } else {
            return player?.playerName;
        }
    })();

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

    const DeleteButton = ({ }) => {
        if (index == 0) {
            return <></>;
        };

        return <View style={{ flexDirection: 'column' }} >
            <TouchableOpacity onPress={deleteConfirmHandler}>
                <Icon size={25} name="remove-circle" color="#ff375f" />
            </TouchableOpacity>
        </View>;
    };

    return (
        <Animated.View style={styles.playerContainer} key={player?.id}>
            <TouchableOpacity
                onLongPress={drag}
                onPress={() => {
                    navigation.navigate('EditPlayer', { playerId: playerId });
                }}
                disabled={isActive}
                style={[
                    // styles.rowItem,
                    // { backgroundColor: isActive ? "red" : item.backgroundColor },
                    {
                        flexDirection: 'row',
                        alignItems: 'center',
                    }
                ]}
            >
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
                <ListItem.Chevron />
            </TouchableOpacity>

            {/* <Input
                autoFocus={index == playerIds.length - 1 && playerWasAdded}
                containerStyle={{ flex: 1 }}
                defaultValue={defaultPlayerName}
                maxLength={15}
                onChangeText={onChangeTextHandler}
                onEndEditing={onEndEditingHandler}
                placeholder={'Player ' + (index + 1)}
                renderErrorMessage={false}
                selectTextOnFocus={true}
                style={styles.input}
                inputContainerStyle={{ borderBottomWidth: 0 }}
            /> */}

            {/* <DeleteButton /> */}
        </Animated.View>
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
