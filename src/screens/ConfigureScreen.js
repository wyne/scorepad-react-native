import React, { Component, useState } from 'react';
import { Text, View, StyleSheet, } from 'react-native';
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

    return (<View stlye={styles.container}>
        <Text style={{ fontSize: 30, alignSelf: 'center' }}>
            Number of Players:
        </Text>
        <Select
            placeholder={{}}
            useNativeAndroidPickerStyle={false}
            style={{ ...pickerSelectStyles, alignSelf: 'center' }}
            value={playerCount}
            onValueChange={handleChange}
            items={options} />
    </View>);
}

const pickerSelectCommonStyles = StyleSheet.create({
    fontSize: 30,
    paddingRight: 30, // to ensure the text is never behind the icon
});

const pickerSelectStyles = StyleSheet.create({
    inputWeb: {
        fontSize: 30,
    },
    inputIOS: {
        ...pickerSelectCommonStyles,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 4,
        color: 'black',
    },
    inputAndroid: {
        ...pickerSelectCommonStyles,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 0.5,
        borderColor: 'purple',
        borderRadius: 8,
        color: 'black',
    },
});

const styles = StyleSheet.create({
    container: {
        paddingTop: Constants.statusBarHeight,
        flex: 1,
        justifyContent: 'center',
        alignContent: 'center',
    },
});

export default ConfigureScreen;