import React, { Component, useState } from 'react';
import { Text, View, StyleSheet, } from 'react-native';
import Constants from 'expo-constants';

const ConfigureScreen = ({ navigation }) => {
    return (<View stlye={styles.container}>
        <Text>Configurator Screen</Text>
    </View>);
}

const styles = StyleSheet.create({
    container: {
        paddingTop: Constants.statusBarHeight,
    }
});

export default ConfigureScreen;