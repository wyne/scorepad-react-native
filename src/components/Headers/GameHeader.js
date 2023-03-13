import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { roundNext, roundPrevious } from '../../../redux/GamesSlice';
import { selectGameById } from '../../../redux/GamesSlice';
import { systemBlue } from '../../constants';
import { Button } from 'react-native-elements';
import MenuButton from '../Buttons/MenuButton';
import FullscreenButton from '../Buttons/FullscreenButton';
import MultiplierButton from '../Buttons/MultiplierButton';

function GameHeader({ navigation }) {
    const dispatch = useDispatch();

    const currentGameId = useSelector(state => state.settings.currentGameId);
    if (typeof currentGameId == 'undefined') return (
        <Button title="No game selected"
            onPress={() => navigation.navigate('Home')} />
    );
    const currentGame = useSelector(state => selectGameById(state, currentGameId));
    const roundCurrent = useSelector(state => selectGameById(state, currentGameId).roundCurrent);

    const nextRoundHandler = () => {
        dispatch(roundNext(currentGame));
    };

    const prevRoundHandler = () => {
        dispatch(roundPrevious(currentGame));
    };

    const NextRoundButton = ({ }) => {
        return (
            <TouchableOpacity style={[styles.headerButton]}
                onPress={nextRoundHandler}>
                <Icon name="chevron-right"
                    type="font-awesome-5"
                    size={20}
                    color={systemBlue} />
            </TouchableOpacity>
        );
    };

    const PrevRoundButton = ({ }) => {
        return (
            <TouchableOpacity style={[styles.headerButton]}
                onPress={prevRoundHandler}>
                <Icon name="chevron-left"
                    type="font-awesome-5"
                    size={20}
                    color={systemBlue}
                    style={[
                        { opacity: roundCurrent == 0 ? 0 : 1 }
                    ]}
                />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView edges={['top']}>
            <View style={[styles.headerContainer]}>
                <SafeAreaView edges={['left']} style={styles.headerLeft}>
                    <MenuButton navigation={navigation} />
                    <FullscreenButton />
                </SafeAreaView>
                <View style={styles.headerCenter}>
                    <PrevRoundButton />
                    <Text style={styles.title}>Round {roundCurrent + 1}</Text>
                    <NextRoundButton />
                </View>
                <SafeAreaView edges={['right']} style={styles.headerRight}>
                    <MultiplierButton />
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
        padding: 10,
        paddingHorizontal: 12,
    },
});

export default GameHeader;
