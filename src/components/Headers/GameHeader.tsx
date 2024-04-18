import React from 'react';

import analytics from '@react-native-firebase/analytics';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-elements';
import { Icon } from 'react-native-elements/dist/icons/Icon';

import { roundNext, roundPrevious, selectGameById } from '../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { systemBlue } from '../../constants';
import AddendButton from '../Buttons/AddendButton';
import FullscreenButton from '../Buttons/FullscreenButton';
import HomeButton from '../Buttons/HomeButton';

import CustomHeader from './CustomHeader';

interface PrevRoundButtonProps {
    prevRoundHandler: () => void;
    visible: boolean;
}

const PrevRoundButton: React.FunctionComponent<PrevRoundButtonProps> = ({ prevRoundHandler, visible }) => {
    return (
        <TouchableOpacity style={[styles.headerButton]}
            onPress={prevRoundHandler}>
            <Icon name="chevron-left"
                type="font-awesome-5"
                size={20}
                color={systemBlue}
                style={{ opacity: visible ? 0 : 1 }}
            />
        </TouchableOpacity>
    );
};

interface NextRoundButtonProps {
    nextRoundHandler: () => void;
    visible: boolean;
}

const NextRoundButton: React.FunctionComponent<NextRoundButtonProps> = ({ nextRoundHandler, visible }) => {
    return (
        <TouchableOpacity style={[styles.headerButton]}
            onPress={nextRoundHandler}>
            <Icon name="chevron-right"
                type="font-awesome-5"
                size={20}
                color={systemBlue}
                style={{ opacity: visible ? 0 : 1 }}
            />
        </TouchableOpacity>
    );
};

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const GameHeader: React.FunctionComponent<Props> = ({ navigation }) => {
    const dispatch = useAppDispatch();

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    if (typeof currentGameId == 'undefined') return (
        <Button title="No game selected"
            onPress={() => navigation.navigate('Home')} />
    );
    const currentGame = useAppSelector(state => selectGameById(state, currentGameId));
    const roundCurrent = useAppSelector(state => selectGameById(state, currentGameId)?.roundCurrent || 0);
    const lastRoundIndex = useAppSelector(state => selectGameById(state, currentGameId)?.roundTotal || 0);

    if (currentGame == null) {
        return <CustomHeader navigation={navigation}
            headerLeft={<HomeButton navigation={navigation} />}
            headerCenter={<Text style={styles.title}>Error</Text>}
        />;
    }

    const isFirstRound = roundCurrent == 0;
    const isLastRound = roundCurrent + 1 >= lastRoundIndex;

    const nextRoundHandler = async () => {
        if (isLastRound && currentGame.locked) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        dispatch(roundNext(currentGame.id));
        analytics().logEvent('round_change', {
            game_id: currentGameId,
            source: 'next button',
            round: roundCurrent,
        });
    };

    const prevRoundHandler = async () => {
        if (isFirstRound) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        dispatch(roundPrevious(currentGame.id));
        analytics().logEvent('round_change', {
            game_id: currentGameId,
            source: 'previous button',
            round: roundCurrent,
        });
    };

    return (
        <CustomHeader navigation={navigation}
            headerLeft={<>
                <HomeButton navigation={navigation} />
                <FullscreenButton />
            </>}
            headerCenter={<>
                <PrevRoundButton prevRoundHandler={prevRoundHandler} visible={isFirstRound} />
                <Text style={styles.title}>Round {roundCurrent + 1}</Text>
                <NextRoundButton nextRoundHandler={nextRoundHandler} visible={isLastRound && (currentGame.locked || false)} />
            </>}
            headerRight={!currentGame.locked && <AddendButton />}
        />
    );
};

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
