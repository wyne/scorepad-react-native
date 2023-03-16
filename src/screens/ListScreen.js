import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import Animated, { Layout, Easing } from 'react-native-reanimated';

import { selectAllGames } from '../../redux/GamesSlice';
import GameListItem from '../components/GameListItem';
import { SafeAreaView } from 'react-native-safe-area-context';

const ListScreen = ({ navigation }) => {
    const gameList = useSelector(state => selectAllGames(state));

    return (
        <SafeAreaView flex={1} edges={['bottom']} style={{ backgroundColor: 'white' }}>
            <Animated.FlatList
                itemLayoutAnimation={Layout.easing(Easing.ease).delay(200)}
                style={styles.list}
                data={gameList}
                renderItem={({ item, index }) =>
                    <GameListItem navigation={navigation} game={item} index={index} />
                }
                keyExtractor={item => item.id}
            >
            </Animated.FlatList>
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

export default memo(ListScreen);
