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

function GameHeader({ navigation }) {
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
                    size={20}
                    color={systemBlue}
                    style={[styles.headerButton]}
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
                    size={20}
                    color={systemBlue}
                    style={[
                        styles.headerButton,
                        { opacity: roundCurrent == 0 ? 0 : 1 }
                    ]}
                />
            </TouchableOpacity>
        );
    };

    const FullscreenButton = ({ }) => {
        return (
            <Icon
                size={20}
                name={fullscreen ? 'compress-alt' : 'expand-alt'}
                color={systemBlue}
                type="font-awesome-5"
                onPress={expandHandler}
                style={[styles.headerButton]}
            />
        );
    };

    const MultiplierButton = ({ }) => {
        return (
            <TouchableOpacity style={[styles.headerButton]}
                onPress={multiplierHandler}>
                <Text style={styles.multiplierButton}>{multiplier} pt</Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView edges={['top']}>
            <View style={[styles.header]}>
                <SafeAreaView edges={['left']} style={{ width: '28%', alignItems: 'flex-start', flexDirection: 'row' }}>
                    <Icon name="bars"
                        type="font-awesome-5"
                        size={20}
                        color={systemBlue}
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                        style={[styles.headerButton]}
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
        backgroundColor: 'black',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 0,
        textAlign: 'center',
        // borderColor: 'red',
        // borderWidth: 1,
    },
    title: {
        color: 'white',
        fontSize: 20,
        fontVariant: ['tabular-nums'],
    },
    headerButton: {
        fontSize: 20,
        padding: 10,
        paddingHorizontal: 12,
        // borderColor: 'red',
        // borderWidth: 1,
    },
    multiplierButton: {
        color: systemBlue,
        fontSize: 20,
        fontVariant: ['tabular-nums'],
    },
});

export default GameHeader;
