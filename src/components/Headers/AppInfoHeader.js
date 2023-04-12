import React from 'react';
import { Text, StyleSheet } from 'react-native';

import MenuButton from '../Buttons/MenuButton';
import CustomHeader from './CustomHeader';

function AppInfoHeader({ navigation }) {

    return (
        <CustomHeader navigation={navigation}
            headerLeft={<MenuButton navigation={navigation} />}
            headerCenter={<Text style={styles.title}>Info</Text>}
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

export default AppInfoHeader;
