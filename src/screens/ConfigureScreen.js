import { set } from 'lodash';
import React, { Component, useState } from 'react';
import { Text, View, StyleSheet, TextInput, Button, } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { setPlayerName } from '../../store/actions/Players';

const ConfigureScreen = ({ navigation }) => {
    const players = useSelector(state => state.players);

    const dispatch = useDispatch();
    const setPlayerNameHandler = () => {
        dispatch(setPlayerName(2, 'Justin'));
    }

    return (<>
        <View style={styles.container}>

            <Button title="Reset Scores" style={{ padding: 50 }} />

            <Button title="Change name" style={{ padding: 50 }}
                onPress={setPlayerNameHandler}
            />

            <Text>Player 1</Text>
            <TextInput defaultValue="Player 1" style={styles.input}></TextInput>

            <Text>Player 2</Text>
            <TextInput defaultValue="Player 2" style={styles.input}></TextInput>

            <Text>Player 3</Text>
            <TextInput defaultValue="Player 3" style={styles.input}></TextInput>

            <Text>Player 4</Text>
            <TextInput defaultValue="Player 4" style={styles.input}></TextInput>
        </View>
    </>);
}

const styles = StyleSheet.create({
    input: {
        borderWidth: 1,
        borderColor: 'black',
        backgroundColor: 'white',
        borderRadius: 5,
        fontSize: 25,
        padding: 5,
        paddingHorizontal: 10,
        margin: 10,
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