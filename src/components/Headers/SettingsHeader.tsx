import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';

import { useAppSelector } from '../../../redux/hooks';
import { selectGameById } from '../../../redux/GamesSlice';
import CheckButton from '../Buttons/CheckButton';
import MenuButton from '../Buttons/MenuButton';
import CustomHeader from './CustomHeader';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const SettingsHeader: React.FunctionComponent<Props> = ({ navigation }) => {
    const currentGame = useAppSelector(state => selectGameById(state, state.settings.currentGameId));

    return (
        <CustomHeader navigation={navigation}
            headerLeft={<MenuButton navigation={navigation} />}
            headerCenter={<Text style={styles.title}>{currentGame?.title}</Text>}
            headerRight={<CheckButton navigation={navigation} />}
        />
    );
};

const styles = StyleSheet.create({
    title: {
        color: 'white',
        fontSize: 20,
        fontVariant: ['tabular-nums'],
    },
});

export default SettingsHeader;
