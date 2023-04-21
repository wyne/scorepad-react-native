import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Icon, Input } from 'react-native-elements';

import { palette, systemBlue } from '../constants';
import { selectGameById, updateGame } from '../../redux/GamesSlice';
import { selectPlayersByIds } from '../../redux/ScoreSelectors';
import { removePlayer, updatePlayer } from '../../redux/PlayersSlice';
import analytics from '@react-native-firebase/analytics';

const EditPlayer = ({ player, index, promptColor, setPlayerWasAdded, playerWasAdded }) => {
    const dispatch = useDispatch();
    const currentGame = useSelector(state => selectGameById(state, state.settings.currentGameId));
    const players = useSelector(state => selectPlayersByIds(state, currentGame.playerIds));

    const setPlayerNameHandler = (index, name) => {
        dispatch(updatePlayer({
            id: player.id,
            changes: {
                playerName: name,
            }
        }));
        // dispatch(playerNameSet(index, name));
        setPlayerWasAdded(false);
    };

    const removePlayerHandler = (index) => {
        // dispatch(playerRemove(index));
        dispatch(updateGame({
            id: currentGame.id,
            changes: {
                playerIds: currentGame.playerIds.filter((id) => id != player.id),
            }
        }));
        dispatch(removePlayer(player.id));
    };

    const onEndEditingHandler = (e) => {
        if (e.nativeEvent.text == "") {
            setPlayerNameHandler(index, 'Player ' + (index + 1));
        }
    };

    const onChangeTextHandler = (text) => {
        setPlayerNameHandler(index, text);
    };

    const deleteHandler = async () => {
        removePlayerHandler(index);
        await analytics().logEvent('remove_player', {
            game_id: currentGame.id,
            player_count: players.length,
            player_index: index,
        });
    };

    const defaultPlayerName = (() => {
        if (index == players.length - 1 && playerWasAdded) {
            return null;
        } else {
            return player.playerName;
        }
    })();

    const DeleteButton = ({ }) => {
        if (index == 0) {
            return <></>;
        };

        return <View flexDirection='column'>
            <TouchableOpacity onPress={deleteHandler}>
                <Icon size={20} name="delete" color="#ff375f" />
                <Text style={{ color: '#ff375f', fontWeight: 'bold' }}>Delete</Text>
            </TouchableOpacity>
        </View>;
    };

    return (
        <View style={styles.playerContainer} key={player.uuid}>
            <Text style={styles.playerNumber}>
                {index + 1}
            </Text>

            <View style={[
                styles.colorBadge,
                { backgroundColor: "#" + palette[index % palette.length] }
            ]} >
            </View>

            <Input
                autoFocus={index == players.length - 1 && playerWasAdded}
                containerStyle={{ flex: 1 }}
                defaultValue={defaultPlayerName}
                maxLength={15}
                onChangeText={onChangeTextHandler}
                onEndEditing={onEndEditingHandler}
                placeholder={'Player ' + (index + 1)}
                renderErrorMessage={false}
                selectTextOnFocus={true}
                style={styles.input}
            />

            <DeleteButton />
        </View>
    );
};

const styles = StyleSheet.create({
    playerContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        margin: 10,
        marginVertical: 5,
    },
    playerNumber: {
        color: systemBlue,
        fontSize: 35,
        fontVariant: ['tabular-nums'],
        fontWeight: "bold",
        padding: 5,
    },
    colorBadge: {
        borderColor: '#eee',
        borderRadius: 25,
        borderWidth: 1,
        height: 30,
        marginHorizontal: 5,
        padding: 5,
        width: 30,
    },
    input: {
        color: '#eee',
    },
});

export default EditPlayer;
