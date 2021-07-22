import React, { useState } from 'react';
import { Platform, Text, View, ScrollView, StyleSheet, TextInput, Button, } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { setPlayerName, newGame, addPlayer, removePlayer } from '../../redux/CurrentGameActions';

const ConfigureScreen = ({ navigation }) => {
    const [gameLock, setGameLock] = useState(true);

    const players = useSelector(state => state.currentGame.players);

    const dispatch = useDispatch();

    const setPlayerNameHandler = (index, name) => {
        dispatch(setPlayerName(index, name));
    }

    const newGameHandler = () => {
        dispatch(newGame());
        setGameLock(false);
    }

    const addPlayerHandler = () => {
        dispatch(addPlayer('Player'));
    }

    const removePlayerHandler = (index) => {
        dispatch(removePlayer(index));
    }

    const saveHandler = () => {
        dispatch(removePlayer(index));
    }

    return (<>
        <ScrollView style={styles.configContainer}>

            <Text style={styles.text}>Tap the top half of a player's card to add a point. Tap the bottom half to subtract.</Text>
            <Text style={styles.text}>Tip: To add or subtract faster, try tapping with two alternating fingers.</Text>

            <View style={{ margin: 10 }}>
                <Button title="New Game" onPress={newGameHandler} />
            </View>

            {players.map((player, index) => (
                <View style={styles.playerContainer} key={index}>
                    <Text style={{ fontSize: 20, padding: 5 }}>Player {index + 1}</Text>
                    <TextInput
                        defaultValue={player.name}
                        style={styles.input}
                        maxLength={20}
                        onChangeText={(text) => setPlayerNameHandler(index, text)}
                    />
                    {index > 0 &&
                        <Button title="Delete" onPress={() => removePlayerHandler(index)}></Button>
                    }
                </View>
            ))}

            <Button title="Add Player" disabled={gameLock || players.length >= 12} onPress={addPlayerHandler} />
            {players.length >= 12 &&
                <Text style={styles.text}>Max players reached.</Text>
            }
            {gameLock && players.length < 12 &&
                <Text style={styles.text}>Press "New Game" to add players.</Text>
            }

            <View style={{ margin: 70 }}><Text>&nbsp;</Text></View>

        </ScrollView>
    </>);
}

const styles = StyleSheet.create({
    configContainer: {
        flex: 1,
        padding: 20,
        paddingBottom: 50,
    },
    text: {
        textAlign: 'center',
        fontSize: 20,
        margin: 5,
    },
    playerContainer: {
        margin: 10,
        marginVertical: 5,
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexDirection: 'row',
    },
    input: {
        borderWidth: 1,
        borderColor: 'black',
        backgroundColor: 'white',
        borderRadius: 5,
        fontSize: 25,
        padding: 5,
        paddingHorizontal: 10,
        margin: 10,
        width: 200,
    },
});

export default ConfigureScreen;