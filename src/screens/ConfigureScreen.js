import React, { useState } from 'react';
import { Platform, Text, View, ScrollView, StyleSheet, TextInput, Button, } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { setPlayerName, newGame, addPlayer, removePlayer } from '../../redux/CurrentGameActions';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const appJson = require('../../app.json');

const ConfigureScreen = ({ navigation }) => {
    const [isNewGame, setIsNewGame] = useState(false)

    const players = useSelector(state => state.currentGame.players);
    const dispatch = useDispatch();

    const setPlayerNameHandler = (index, name) => {
        dispatch(setPlayerName(index, name));
    }

    const newGameHandler = () => {
        dispatch(newGame());
        setIsNewGame(true);
    }

    const addPlayerHandler = () => {
        dispatch(addPlayer('Player ' + (players.length + 1)));
    }

    const removePlayerHandler = (index) => {
        dispatch(removePlayer(index));
    }

    return (
        <KeyboardAwareScrollView style={styles.configContainer}>

            <Text style={styles.text}>Tap the top half of a player's card to add a point. Tap the bottom half to subtract.</Text>
            <Text style={styles.text}>Tip: To add or subtract faster, try tapping with two alternating fingers.</Text>

            <View style={{ margin: 10 }}>
                <Button title="New Game" onPress={newGameHandler} />
                {isNewGame &&
                    <Text style={{ textAlign: 'center' }}>Scores have been reset!</Text>
                }
            </View>

            {players.map((player, index) => (
                <View style={styles.playerContainer} key={player.uuid}>
                    <Text style={{ fontSize: 20, padding: 5 }}>{index + 1}</Text>
                    <TextInput
                        defaultValue={player.name}
                        style={styles.input}
                        maxLength={15}
                        onChangeText={(text) => setPlayerNameHandler(index, text)}
                    />
                    {index > 0 &&
                        <Button title="Delete" onPress={() => removePlayerHandler(index)}></Button>
                    }
                </View>
            ))}

            <View style={{ margin: 10 }}>
                <Button title="Add Player"
                    disabled={players.length >= 8}
                    onPress={addPlayerHandler} />
            </View>

            {players.length >= 8 &&
                <Text style={styles.text}>Max players reached.</Text>
            }

            <View style={{ margin: 70 }}><Text>&nbsp;</Text></View>

            <View style={{ marginVertical: 30 }}>
                <Text style={{ textAlign: 'center' }} >
                    Version {appJson.expo.version}
                </Text>
                {Platform.OS == 'ios' &&
                    <Text style={{ textAlign: 'center' }}>{Platform.OS} build {appJson.expo.ios.buildNumber} </Text>
                }
                {Platform.OS == 'android' &&
                    <Text style={{ textAlign: 'center' }}>{Platform.OS} build {appJson.expo.android.versionCode} </Text>
                }
            </View>

        </KeyboardAwareScrollView>
    );
}

const styles = StyleSheet.create({
    configContainer: {
        flex: 1,
        padding: 20,
        paddingBottom: 50,
        backgroundColor: 'white',
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
        flex: 1,
        borderWidth: 1,
        borderColor: 'black',
        backgroundColor: 'white',
        borderRadius: 5,
        fontSize: 20,
        padding: 5,
        paddingHorizontal: 10,
        margin: 5,
    },
});

export default ConfigureScreen;