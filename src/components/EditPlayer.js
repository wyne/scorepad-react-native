import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setPlayerName, removePlayer } from '../../redux/CurrentGameActions';
import { Icon, Input } from 'react-native-elements';

import { palette } from '../constants';

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

    return (
        <View style={styles.playerContainer} key={player.uuid}>
            <Text style={styles.playerNumber}>
                {index + 1}
            </Text>

            <View
                style={styles.colorBadge}
                // onTouchStart={promptColor}
                backgroundColor={"#" + palette[index]}>
                {/*<Icon
                    name="edit"
                    size={20}
                    color={getContrastRatio('#' + palette[index], '#000').number > 7 ? "black" : "white"}
                ></Icon> */}
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

            {index > 0 &&
                <Icon name="delete" color="#ff375f" onPress={deleteHandler} />
            }
        </View>
    );
}

const styles = StyleSheet.create({
    playerContainer: {
        margin: 10,
        marginVertical: 5,
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexDirection: 'row',
    },
    playerNumber: {
        fontVariant: ['tabular-nums'],
        fontSize: 35,
        padding: 5,
        fontWeight: "bold",
        color: "#0a84ff"
    },
    colorBadge: {
        width: 30,
        height: 30,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#eee',
        padding: 5,
        marginHorizontal: 5
    },
    input: {
        color: '#eee',
    },
});

export default EditPlayer;
