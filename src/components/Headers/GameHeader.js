import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { useDispatch, useSelector } from 'react-redux';
import analytics from '@react-native-firebase/analytics';

import { roundNext, roundPrevious } from '../../../redux/GamesSlice';
import { selectGameById } from '../../../redux/GamesSlice';
import { systemBlue } from '../../constants';
import { Button } from 'react-native-elements';
import MenuButton from '../Buttons/MenuButton';
import FullscreenButton from '../Buttons/FullscreenButton';
import MultiplierButton from '../Buttons/MultiplierButton';
import CustomHeader from './CustomHeader';

const PrevRoundButton = ({ prevRoundHandler, roundCurrent }) => {
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

const NextRoundButton = ({ nextRoundHandler }) => {
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

function GameHeader({ navigation }) {
    const dispatch = useDispatch();

    const currentGameId = useSelector(state => state.settings.currentGameId);
    if (typeof currentGameId == 'undefined') return (
        <Button title="No game selected"
            onPress={() => navigation.navigate('Home')} />
    );
    const currentGame = useSelector(state => selectGameById(state, currentGameId));
    const roundCurrent = useSelector(state => selectGameById(state, currentGameId).roundCurrent);

    const nextRoundHandler = async () => {
        dispatch(roundNext(currentGame));
        await analytics().logEvent('round_change', {
            game_id: currentGameId,
            source: 'next button',
        });
    };

    const prevRoundHandler = async () => {
        dispatch(roundPrevious(currentGame));
        await analytics().logEvent('round_change', {
            game_id: currentGameId,
            source: 'previous button',
        });
    };

    return (
        <CustomHeader navigation={navigation}
            headerLeft={<>
                <MenuButton navigation={navigation} />
                <FullscreenButton />
            </>}
            headerCenter={<>
                <PrevRoundButton prevRoundHandler={prevRoundHandler} roundCurrent={roundCurrent} />
                <Text style={styles.title}>Round {roundCurrent + 1}</Text>
                <NextRoundButton nextRoundHandler={nextRoundHandler} />
            </>}
            headerRight={<MultiplierButton />}
        />
    );
}

const styles = StyleSheet.create({
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
