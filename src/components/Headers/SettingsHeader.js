import React from 'react';
import { Text, StyleSheet } from 'react-native';

import CheckButton from '../Buttons/CheckButton';
import MenuButton from '../Buttons/MenuButton';
import CustomHeader from './CustomHeader';

function SettingsHeader({ navigation }) {

    return (
        <CustomHeader navigation={navigation}
            headerLeft={<MenuButton navigation={navigation} />}
            headerCenter={<Text style={styles.title}>Players</Text>}
            headerRight={<CheckButton navigation={navigation} />}
        />
    );
}

const styles = StyleSheet.create({
    title: {
        color: 'white',
        fontSize: 20,
        fontVariant: ['tabular-nums'],
    },
});

export default SettingsHeader;
