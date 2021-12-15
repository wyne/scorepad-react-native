import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Feather } from '@expo/vector-icons';
import { s, vs, ms, mvs } from 'react-native-size-matters';

import { nextRound, prevRound } from '../../redux/CurrentGameActions';
import { toggleHomeFullscreen, toggleMultiplier } from '../../redux/SettingsActions';

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

    return (
        <SafeAreaView edges={['top']} style={[styles.title]}>
            <SafeAreaView edges={['left']} style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                    style={{ justifyContent: 'center' }}
                    onPress={multiplierHandler} >
                    <Text style={[styles.multiplier]}>{multiplier} pt</Text>
                </TouchableOpacity>
            </SafeAreaView>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                    style={{ justifyContent: 'center' }}
                    onPress={prevRoundHandler} >
                    <View>
                        <Icon name="chevron-left" type="font-awesome-5" size={25} color="#0a84ff" style={[styles.roundButton, { opacity: currentRound == 0 ? 0 : 1 }]} />
                    </View>
                </TouchableOpacity>

                <Text style={{
                    fontSize: 25,
                    color: 'white',
                    fontVariant: ['tabular-nums'],
                    fontWeight: 'bold'
                }}>Round {currentRound + 1}</Text>

                <TouchableOpacity
                    style={{ justifyContent: 'center', }}
                    onPress={nextRoundHandler} >
                    <View>
                        <Icon name="chevron-right" type="font-awesome-5" size={25} color="#0a84ff" style={[styles.roundButton]} />
                    </View>
                </TouchableOpacity>

            </View>
            <SafeAreaView edges={['right']}>
                <Icon size={25} name={fullscreen ? 'compress-alt' : 'expand-alt'} color="#0a84ff" type="font-awesome-5" onPress={expandHandler} />
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    title: {
        textAlign: 'center',
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        backgroundColor: 'black',
        paddingBottom: 10,
    },
    multiplier: {
        color: '#0a84ff',
        paddingHorizontal: 5,
        fontSize: 25,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    roundButton: {
        fontSize: 25,
        paddingHorizontal: 10,
        fontWeight: 'bold',
        color: '#0a84ff',
    },
});

export default RoundTitle;