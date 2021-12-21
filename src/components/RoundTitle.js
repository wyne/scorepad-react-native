import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { nextRound, prevRound } from '../../redux/CurrentGameActions';
import { toggleHomeFullscreen, toggleMultiplier } from '../../redux/SettingsActions';
import { systemBlue } from '../constants';

function RoundTitle({ navigation }) {
    const dispatch = useDispatch();

    const currentRound = useSelector(state => state.currentGame.currentRound);
    const fullscreen = useSelector(state => state.settings.home_fullscreen);
    const multiplier = useSelector(state => state.settings.multiplier);

    const nextRoundHandler = () => {
        dispatch(nextRound());
    }

    const prevRoundHandler = () => {
        dispatch(prevRound());
    }

    const expandHandler = () => {
        dispatch(toggleHomeFullscreen);
    }

    const multiplierHandler = () => {
        dispatch(toggleMultiplier);
    }

    const NextRoundButton = ({ }) => {
        return (
            <TouchableOpacity onPress={nextRoundHandler}>
                <Icon
                    name="chevron-right"
                    type="font-awesome-5"
                    size={25}
                    color={systemBlue}
                    style={[styles.titleButton]}
                />
            </TouchableOpacity>
        );
    }

    const PrevRoundButton = ({ }) => {
        return (
            <TouchableOpacity onPress={prevRoundHandler}>
                <Icon
                    name="chevron-left"
                    type="font-awesome-5"
                    size={25}
                    color={systemBlue}
                    style={[
                        styles.titleButton,
                        { opacity: currentRound == 0 ? 0 : 1 }
                    ]}
                />
            </TouchableOpacity>
        );
    }

    const FullscreenButton = ({ }) => {
        return (
            <Icon
                size={25}
                name={fullscreen ? 'compress-alt' : 'expand-alt'}
                color={systemBlue}
                type="font-awesome-5"
                onPress={expandHandler}
                style={[styles.titleButton]}
            />
        )
    }

    const MultiplierButton = ({ }) => {
        return (
            <TouchableOpacity
                style={[styles.titleButton]}
                onPress={multiplierHandler}>
                <Text style={[styles.multiplier]}>{multiplier} pt</Text>
            </TouchableOpacity>
        )
    }

    return (
        <SafeAreaView edges={['top']} style={[styles.header]}>
            <SafeAreaView edges={['left']} style={{ width: '25%' }}>
                <MultiplierButton />
            </SafeAreaView>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '50%' }}>
                <PrevRoundButton />

                <Text style={styles.title}>
                    Round {currentRound + 1}
                </Text>

                <NextRoundButton />
            </View>

            <SafeAreaView edges={['right']} style={{ width: '25%' }}>
                <FullscreenButton />
            </SafeAreaView>
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
        paddingHorizontal: 5,
        fontSize: 25,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    titleButton: {
        color: systemBlue,
        fontSize: 25,
        fontWeight: 'bold',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
});

export default RoundTitle;