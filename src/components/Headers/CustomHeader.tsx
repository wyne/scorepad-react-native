import React from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, StyleSheet } from 'react-native';
import Animated, { Easing, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    headerLeft?: React.ReactNode;
    headerCenter: React.ReactNode;
    headerRight?: React.ReactNode;
    animated?: boolean;
}

const CustomHeader: React.FunctionComponent<Props> = ({ headerLeft, headerCenter, headerRight, animated = false }) => {
    return (
        <Animated.View entering={animated ? FadeInUp.duration(500).easing(Easing.out(Easing.ease)) : undefined}>
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
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: 'black',
        flexDirection: 'row',
        justifyContent: 'space-between',
        textAlign: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '26%',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '42%',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        width: '26%',
    },
});

export default CustomHeader;
