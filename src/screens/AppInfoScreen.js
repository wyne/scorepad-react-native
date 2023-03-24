import React, { memo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import Animated, { Layout, Easing } from 'react-native-reanimated';

import { selectAllGames } from '../../redux/GamesSlice';
import GameListItem from '../components/GameListItem';
import { SafeAreaView } from 'react-native-safe-area-context';

const AppInfoScreen = ({ navigation }) => {
    const gameList = useSelector(state => selectAllGames(state));

    return (
        <SafeAreaView flex={1} edges={['bottom', 'left', 'right']} style={{ backgroundColor: 'white' }}>
            <Text>Info</Text>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    list: {
        backgroundColor: 'white',
    },
    gameSubtitle: {
        color: '#999',
    },
    newGame: {
        margin: 20,
        width: 200,
        alignSelf: 'center',
    }
});

export default memo(AppInfoScreen);
