import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerActions } from '@react-navigation/native';

import { systemBlue } from '../constants';

function SettingsHeader({ navigation }) {

    return (
        <SafeAreaView edges={['top']}>
            <View style={[styles.headerContainer]}>
                <SafeAreaView edges={['left']} style={styles.headerLeft}>
                    <Icon name="bars"
                        type="font-awesome-5"
                        color={systemBlue}
                        onPress={() =>
                            navigation.dispatch(DrawerActions.openDrawer())
                        }
                        style={[styles.headerButton]}
                    />
                </SafeAreaView>
                <View style={styles.headerCenter}>
                    <Text style={styles.title}>Players</Text>
                </View>
                <SafeAreaView edges={['right']} style={styles.headerRight}>
                    <Icon name="check"
                        type="font-awesome-5"
                        color={systemBlue}
                        onPress={() => navigation.navigate('Game')}
                    />
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
    headerButton: {
        fontSize: 20,
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
});

export default SettingsHeader;
