import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerActions } from '@react-navigation/native';

import { systemBlue } from '../constants';

function SettingsHeader({ navigation }) {

    return (
        <SafeAreaView edges={['top']}>
            <View style={[styles.header]}>
                <SafeAreaView edges={['left']} style={{ width: '28%', alignItems: 'flex-start', flexDirection: 'row' }}>
                    <Icon
                        name="bars"
                        type="font-awesome-5"
                        size={25}
                        color={systemBlue}
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                        style={[styles.roundButton]}
                    />
                </SafeAreaView>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '44%' }}>
                    <Text style={styles.title}>
                        Players
                    </Text>
                </View>

                <SafeAreaView edges={['right']} style={{ width: '28%', alignItems: 'flex-end' }}>
                    <Icon name="check"
                        type="font-awesome"
                        size={24}
                        color={systemBlue}
                        style={{ marginRight: 10 }}
                        onPress={() => navigation.navigate('Game')}
                    />
                </SafeAreaView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        alignItems: 'baseline',
        backgroundColor: 'black',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 0,
        textAlign: 'center',
    },
    title: {
        color: 'white',
        fontSize: 25,
        fontVariant: ['tabular-nums'],
        fontWeight: 'bold'
    },
    multiplier: {
        color: systemBlue,
        paddingRight: 5,
        fontSize: 25,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    roundButton: {
        color: systemBlue,
        fontSize: 25,
        fontWeight: 'bold',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
});

export default SettingsHeader;
