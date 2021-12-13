import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setPlayerName, removePlayer } from '../../redux/CurrentGameActions';
import { s, vs, ms, mvs } from 'react-native-size-matters';
import { Icon, Input } from 'react-native-elements'
import { getContrastRatio } from 'colorsheet';

const EditPlayer = ({ player, index, promptColor, setPlayerWasAdded, playerWasAdded }) => {
    const palette = ["01497c", "c25858", "f5c800", "275436", "dc902c", "62516a", "755647", "925561"];
    const dispatch = useDispatch();
    const players = useSelector(state => state.currentGame.players);

    const setPlayerNameHandler = (index, name) => {
        dispatch(setPlayerName(index, name));
        setPlayerWasAdded(false)
    }

    const removePlayerHandler = (index) => {
        dispatch(removePlayer(index));
    }

    return (
        <View style={styles.playerContainer} key={player.uuid}>
            <Text style={{
                fontVariant: ['tabular-nums'],
                fontSize: 35,
                padding: 5,
                fontWeight: "bold",
                color: "#0a84ff"
            }}>{index + 1}</Text>

            <View style={{
                width: 30,
                height: 30,
                borderRadius: 25,
                borderWidth: 1,
                borderColor: '#eee',
                padding: 5,
                marginHorizontal: 5
            }}
                // onTouchStart={promptColor}
                backgroundColor={"#" + palette[index]}>
                {/*<Icon
                    name="edit"
                    size={20}
                    color={getContrastRatio('#' + palette[index], '#000').number > 7 ? "black" : "white"}
                ></Icon> */}
            </View>

            <Input style={styles.input}
                containerStyle={{ flex: 1 }}
                defaultValue={index == players.length - 1 && playerWasAdded ? null : player.name}
                autoFocus={index == players.length - 1 && playerWasAdded}
                placeholder={'Player ' + (index + 1)}
                selectTextOnFocus={true}
                renderErrorMessage={false}
                // label={"Player  " + (index + 1) + " Name"}
                onEndEditing={(e) => {
                    if (e.nativeEvent.text == "") {
                        setPlayerNameHandler(index, 'Player ' + (index + 1));
                    }
                }}
                maxLength={15}
                onChangeText={(text) => setPlayerNameHandler(index, text)} />

            {index > 0 &&
                <Icon name="delete" color="#ff375f" onPress={() => removePlayerHandler(index)}></Icon>
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
    input: {
        color: '#eee',
    },
});

export default EditPlayer;
