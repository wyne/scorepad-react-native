import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setPlayerName, removePlayer } from '../../redux/CurrentGameActions';
import { Icon, Input } from 'react-native-elements';

import { palette, systemBlue } from '../constants';

const EditPlayer = ({ player, index, promptColor, setPlayerWasAdded, playerWasAdded }) => {
    const dispatch = useDispatch();
    const players = useSelector(state => state.currentGame.players);

    const setPlayerNameHandler = (index, name) => {
        dispatch(setPlayerName(index, name));
        setPlayerWasAdded(false)
    }

    const removePlayerHandler = (index) => {
        dispatch(removePlayer(index));
    }

    const onEndEditingHandler = (e) => {
        if (e.nativeEvent.text == "") {
            setPlayerNameHandler(index, 'Player ' + (index + 1));
        }
    }

    const onChangeTextHandler = (text) => {
        setPlayerNameHandler(index, text)
    }

    const deleteHandler = () => removePlayerHandler(index)

    const defaultPlayerName = (() => {
        if (index == players.length - 1 && playerWasAdded) {
            return null
        } else {
            return player.name;
        }
    })();

    const DeleteButton = ({ }) => {
        if (index == 0) {
            return <></>;
        };

        return <Icon name="delete" color="#ff375f" onPress={deleteHandler} />;
    }

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
}

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
