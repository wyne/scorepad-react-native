import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Feather } from '@expo/vector-icons';
import { s, vs, ms, mvs } from 'react-native-size-matters';

import { nextRound, prevRound } from '../../redux/CurrentGameActions';
import { toggleHomeFullscreen } from '../../redux/SettingsActions';

function RoundTitle({ navigation }) {
    const dispatch = useDispatch();

    const currentRound = useSelector(state => state.currentGame.currentRound);
    const expanded = useSelector(state => state.settings.home_fullscreen);

    const nextRoundHandler = () => {
        dispatch(nextRound());
    }

    const prevRoundHandler = () => {
        dispatch(prevRound());
    }


    const handleExpand = () => {
        dispatch(toggleHomeFullscreen);
    }

    return (
        <SafeAreaView edges={['top']} style={[styles.title]}>
            <SafeAreaView edges={['left']} style={{ flexDirection: 'row' }}>
                {/* <Text style={[styles.multiplier]}>{1} pt</Text> */}
            </SafeAreaView>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                    style={{ justifyContent: 'center' }}
                    onPress={prevRoundHandler} >
                    <View>
                        <Feather name="chevron-left" style={[styles.roundButton]} color="black" />
                    </View>
                </TouchableOpacity>

                <Text style={{
                    fontSize: 20, color: 'white',
                    fontVariant: ['tabular-nums'],
                    fontWeight: 'bold'
                }}>Round {currentRound + 1}</Text>

                <TouchableOpacity
                    style={{ justifyContent: 'center', }}
                    onPress={nextRoundHandler} >
                    <View>
                        <Feather name="chevron-right" style={[styles.roundButton]} color="black" />
                    </View>
                </TouchableOpacity>

            </View>
            <SafeAreaView edges={['right']}>
                <Icon name={expanded ? 'expand-alt' : 'compress-alt'} color="#0a84ff" type="font-awesome-5" onPress={handleExpand}></Icon>
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
        fontSize: 20,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    roundButton: {
        fontSize: 35,
        fontWeight: 'bold',
        color: '#0a84ff',
    },
});

export default RoundTitle;