import React, { useState } from 'react';
import { Text, View, ScrollView, StyleSheet, TextInput, Button, } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { setPlayerName } from '../../store/actions/Players';

const ConfigureScreen = ({ navigation }) => {
    const [gameLock, setGameLock] = useState(true);

    const players = useSelector(state => state.players);

    const dispatch = useDispatch();
    const setPlayerNameHandler = (index, name) => {
        dispatch(setPlayerName(index, name));
    }

    return (<>
        <ScrollView style={styles.configContainer}>

            <Text>Tap the top half of a player's card to add a point. Tap the bottom half subtract.</Text>
            <Text>Tip: To add or subtract faster, try tapping with two alternating fingers.</Text>

            <Button title="New Game"
                onPress={() => (
                    setGameLock(false)
                )} />

            {players.map((name, index) => (
                <View style={styles.playerContainer} key={index}>
                    <Text>Player {index + 1}</Text>
                    <TextInput
                        defaultValue={name}
                        style={styles.input}
                        maxLength={20}
                        onChangeText={(text) => setPlayerNameHandler(index, text)}
                    />
                    <Button title="Delete"></Button>
                </View>
            ))}

            <Button title="Add Player" disabled={gameLock}
                onPress={() => (
                    false
                    // setPlayerNameHandler(players.length, 'Player')
                    // SET NEW PLAYER SCORES HERE
                )}
            />

            {gameLock &&
                <Text>Press "New Game" to change number of players.</Text>
            }

        </ScrollView>
    </>);
}

const styles = StyleSheet.create({
    playerContainer: {
        margin: 10,
        width: '50%',
        justifyContent: 'center',
        alignContent: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: 'black',
        backgroundColor: 'white',
        borderRadius: 5,
        fontSize: 25,
        padding: 5,
        paddingHorizontal: 10,
        marginVertical: 20,
    },
    configContainer: {
        flex: 1,
        alignContent: 'center'
    },
});

export default ConfigureScreen;