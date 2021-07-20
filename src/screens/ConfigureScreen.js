import { set } from 'lodash';
import React, { Component, useState } from 'react';
import { Text, View, StyleSheet, TextInput, Button, } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { setPlayerName } from '../../store/actions/Players';

const ConfigureScreen = ({ navigation }) => {
    const players = useSelector(state => state.players);

    const dispatch = useDispatch();
    const setPlayerNameHandler = (index, name) => {
        dispatch(setPlayerName(index, name));
    }

    return (<>
        <View style={styles.container}>

            <Text>Reset scores to change number of players.</Text>
            <Button title="Reset Scores" />

            {players.map((name, index) => (
                <View style={styles.playerContainer}>
                    <Text>Player {index + 1}</Text>
                    <TextInput
                        defaultValue={name}
                        style={styles.input}
                        maxLength={20}
                        onChangeText={(text) => setPlayerNameHandler(index, text)}
                    />
                </View>
            ))}

            <Button title="Add Player" />

        </View>
    </>);
}

const styles = StyleSheet.create({
    playerContainer: {
        margin: 10,
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
        backgroundColor: 'white',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        alignContent: 'center'
    },
});

export default ConfigureScreen;