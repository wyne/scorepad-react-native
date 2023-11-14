import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import analytics from '@react-native-firebase/analytics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';

import { roundNext, roundPrevious } from '../../../redux/GamesSlice';
import { selectGameById } from '../../../redux/GamesSlice';
import { systemBlue } from '../../constants';
import { Button } from 'react-native-elements';
import MenuButton from '../Buttons/MenuButton';
import MultiplierButton from '../Buttons/MultiplierButton';
import CustomHeader from './CustomHeader';

interface PrevRoundButtonProps {
    prevRoundHandler: () => void;
    roundCurrent: number;
}

const PrevRoundButton: React.FunctionComponent<PrevRoundButtonProps> = ({ prevRoundHandler, roundCurrent }) => {
    return (
        <TouchableOpacity style={[styles.headerButton]}
            onPress={prevRoundHandler}>
            <Icon name="chevron-left"
                type="font-awesome-5"
                size={20}
                color={systemBlue}
                style={{ opacity: roundCurrent == 0 ? 0 : 1 }}
            />
        </TouchableOpacity>
    );
};

interface NextRoundButtonProps {
    nextRoundHandler: () => void;
}

const NextRoundButton: React.FunctionComponent<NextRoundButtonProps> = ({ nextRoundHandler }) => {
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

    if (currentGame == null) {
        return <CustomHeader navigation={navigation}
            headerLeft={<MenuButton navigation={navigation} />}
            headerCenter={<Text style={styles.title}>Error</Text>}
        />;
    }

    const nextRoundHandler = async () => {
        dispatch(roundNext(currentGame.id));
        await analytics().logEvent('round_change', {
            game_id: currentGameId,
            source: 'next button',
        });
    };

    const prevRoundHandler = async () => {
        dispatch(roundPrevious(currentGame.id));
        await analytics().logEvent('round_change', {
            game_id: currentGameId,
            source: 'previous button',
        });
    };

    return (
        <CustomHeader navigation={navigation}
            headerLeft={<>
                <MenuButton navigation={navigation} />
            </>}
            headerCenter={<>
                <PrevRoundButton prevRoundHandler={prevRoundHandler} roundCurrent={roundCurrent} />
                <Text style={styles.title}>Round {roundCurrent + 1}</Text>
                <NextRoundButton nextRoundHandler={nextRoundHandler} />
            </>}
            headerRight={<MultiplierButton />}
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
