import React, { Component, useState } from 'react';
import { Text, View, StyleSheet, TextInput, Button, } from 'react-native';
import Constants from 'expo-constants';
import Select from 'react-native-picker-select';

const ConfigureScreen = ({ navigation }) => {
    const [playerCount, setPlayerCount] = useState('2');

    const options = [
        { value: '1', label: 'One' },
        { value: '2', label: 'Two' },
        { value: '3', label: 'Three' },
        { value: '4', label: 'Four' },
    ];

    const handleChange = val => {
        setPlayerCount(val)
    }

    return (<>
        <View style={{
            backgroundColor: 'white',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'space-evenly',
            alignContent: 'center'
        }}>

            <Button title="Reset Scores" style={{ padding: 50 }} />

            <Text style={{ fontSize: 30, }}>
                Number of Players:
            </Text>

            <Select
                placeholder={{}}
                useNativeAndroidPickerStyle={false}
                style={{ ...pickerSelectStyles, alignSelf: 'center' }}
                value={playerCount}
                onValueChange={handleChange}
                items={options} />

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

const pickerSelectCommonStyles = StyleSheet.create({
    fontSize: 30,
    paddingRight: 30, // to ensure the text is never behind the icon
    margin: 10,
});

const pickerSelectStyles = StyleSheet.create({
    inputWeb: {
        fontSize: 30,
        margin: 10,
    },
    inputIOS: {
        ...pickerSelectCommonStyles,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 4,
        color: 'black',
        margin: 10,
    },
    inputAndroid: {
        ...pickerSelectCommonStyles,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 0.5,
        borderColor: 'purple',
        borderRadius: 8,
        color: 'black',
        margin: 10,
    },
});

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
        // paddingTop: Constants.statusBarHeight,
        padding: 50,
        flex: 1,
        borderColor: 'red',
        borderWidth: 3,
        justifyContent: 'center',
        alignContent: 'center',
    },
});

export default ConfigureScreen;