import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function CustomHeader({ navigation, headerLeft, headerCenter, headerRight }) {
    return (
        <SafeAreaView edges={['top']} style={[styles.headerContainer]}>
            <SafeAreaView edges={['left']} style={styles.headerLeft}>
                {headerLeft}
            </SafeAreaView>
            <View style={styles.headerCenter}>
                {headerCenter}
            </View>
            <SafeAreaView edges={['right']} style={styles.headerRight}>
                {headerRight}
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        alignItems: 'baseline',
        backgroundColor: 'black',
        flexDirection: 'row',
        justifyContent: 'space-between',
        textAlign: 'center',
        // borderWidth: 1,
        // borderColor: 'red',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        width: '33%',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '33%',
    },
    headerRight: {
        alignItems: 'flex-end',
        width: '33%',
    },
});

export default CustomHeader;
