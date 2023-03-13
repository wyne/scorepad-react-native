import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CheckButton from '../Buttons/CheckButton';
import MenuButton from '../Buttons/MenuButton';

function SettingsHeader({ navigation }) {

    return (
        <SafeAreaView edges={['top']}>
            <View style={[styles.headerContainer]}>
                <SafeAreaView edges={['left']} style={styles.headerLeft}>
                    <MenuButton navigation={navigation} />
                </SafeAreaView>
                <View style={styles.headerCenter}>
                    <Text style={styles.title}>Players</Text>
                </View>
                <SafeAreaView edges={['right']} style={styles.headerRight}>
                    <CheckButton navigation={navigation} />
                </SafeAreaView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        alignItems: 'baseline',
        backgroundColor: 'black',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 0,
        textAlign: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    title: {
        color: 'white',
        fontSize: 20,
        fontVariant: ['tabular-nums'],
    },
});

export default SettingsHeader;
