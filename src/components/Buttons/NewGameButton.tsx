import React from 'react';
import { Icon } from 'react-native-elements';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';

import { useAppSelector, useAppDispatch } from '../../../redux/hooks';
import { systemBlue } from '../../constants';
import HeaderButton from './HeaderButton';
import { asyncCreateGame, selectAllGames } from '../../../redux/GamesSlice';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const NewGameButton: React.FunctionComponent<Props> = ({ navigation }) => {
    const dispatch = useAppDispatch();

    const gameList = useAppSelector(state => selectAllGames(state));

    const addGameHandler = async () => {
        dispatch(asyncCreateGame(gameList.length + 1)).then(() => {
            setTimeout(() => {
                navigation.navigate("Game");
            }, 500);
        });
    };

    return (
        <HeaderButton accessibilityLabel='Add Game' onPress={addGameHandler}>
            <Icon name="plus"
                type="font-awesome-5"
                size={20}
                color={systemBlue} />
        </HeaderButton>
    );
};

export default NewGameButton;
