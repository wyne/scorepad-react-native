import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { DrawerActions } from '@react-navigation/native';

import { roundNext, roundPrevious } from '../../redux/GamesSlice';
import { selectGameById } from '../../redux/GamesSlice';
import { toggleHomeFullscreen, toggleMultiplier } from '../../redux/SettingsSlice';
import { systemBlue } from '../constants';
import { Button } from 'react-native-elements';

function RoundTitle({ navigation }) {
    const dispatch = useDispatch();

    const fullscreen = useSelector(state => state.settings.home_fullscreen);
    const multiplier = useSelector(state => state.settings.multiplier);

    const currentGameId = useSelector(state => state.settings.currentGameId);
    if (typeof currentGameId == 'undefined') return (
        <Button
            title="No game selected"
            onPress={() => navigation.navigate('Home')}
        ></Button>
    );
    const currentGame = useSelector(state => selectGameById(state, currentGameId));
    const roundCurrent = useSelector(state => selectGameById(state, currentGameId).roundCurrent);

    const nextRoundHandler = () => {
        dispatch(roundNext(currentGame));
    };

    const prevRoundHandler = () => {
        dispatch(roundPrevious(currentGame));
    };

    const expandHandler = () => {
        dispatch(toggleHomeFullscreen());
    };

    const multiplierHandler = () => {
        dispatch(toggleMultiplier());
    };

    const NextRoundButton = ({ }) => {
        return (
            <TouchableOpacity onPress={nextRoundHandler}>
                <Icon
                    name="chevron-right"
                    type="font-awesome-5"
                    size={25}
                    color={systemBlue}
                    style={[styles.roundButton]}
                />
            </TouchableOpacity>
        );
    };

    const PrevRoundButton = ({ }) => {
        return (
            <TouchableOpacity onPress={prevRoundHandler}>
                <Icon
                    name="chevron-left"
                    type="font-awesome-5"
                    size={25}
                    color={systemBlue}
                    style={[
                        styles.roundButton,
                        { opacity: roundCurrent == 0 ? 0 : 1 }
                    ]}
                />
            </TouchableOpacity>
        );
    };

    const FullscreenButton = ({ }) => {
        return (
            <Icon
                size={25}
                name={fullscreen ? 'compress-alt' : 'expand-alt'}
                color={systemBlue}
                type="font-awesome-5"
                onPress={expandHandler}
                style={[styles.roundButton]}
            />
        );
    };

    const MultiplierButton = ({ }) => {
        return (
            <TouchableOpacity
                style={[styles.roundButton]}
                onPress={multiplierHandler}>
                <Text style={[styles.multiplier]}>{multiplier} pt</Text>
            </TouchableOpacity>
        );
    };

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
                    <FullscreenButton />
                </SafeAreaView>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '44%' }}>
                    <PrevRoundButton />

                    <Text style={styles.title}>
                        Round {roundCurrent + 1}
                    </Text>

                    <NextRoundButton />
                </View>

                <SafeAreaView edges={['right']} style={{ width: '28%', alignItems: 'flex-end' }}>
                    <MultiplierButton />
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

export default RoundTitle;
