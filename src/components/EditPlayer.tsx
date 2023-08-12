import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity, NativeSyntheticEvent, TextInputEndEditingEventData } from 'react-native';
import { useDispatch } from 'react-redux';
import { Icon, Input } from 'react-native-elements';

import { palette, systemBlue } from '../constants';
import { selectGameById, updateGame } from '../../redux/GamesSlice';
import { selectPlayerById } from '../../redux/PlayersSlice';
import { removePlayer, updatePlayer } from '../../redux/PlayersSlice';
import analytics from '@react-native-firebase/analytics';
import { useAppSelector } from '../../redux/hooks';

interface Props {
    playerId: string;
    index: number;
    setPlayerWasAdded: React.Dispatch<React.SetStateAction<boolean>>;
    playerWasAdded: boolean;
}

const EditPlayer: React.FunctionComponent<Props> = ({ playerId, index, setPlayerWasAdded, playerWasAdded }) => {
    const dispatch = useDispatch();
    const currentGame = useAppSelector(state => selectGameById(state, state.settings.currentGameId));
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
        // dispatch(playerNameSet(index, name));
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

    const DeleteButton = ({ }) => {
        if (index == 0) {
            return <></>;
        };

        return <View style={{ flexDirection: 'column' }} >
            <TouchableOpacity onPress={deleteHandler}>
                <Icon size={20} name="delete" color="#ff375f" />
                <Text style={{ color: '#ff375f', fontWeight: 'bold' }}>Delete</Text>
            </TouchableOpacity>
        </View>;
    };

    return (
        <View style={styles.playerContainer} key={player?.id}>
            <Text style={styles.playerNumber}>
                {index + 1}
            </Text>

            <View style={[
                styles.colorBadge,
                { backgroundColor: "#" + palette[index % palette.length] }
            ]} >
            </View>

            <Input
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
