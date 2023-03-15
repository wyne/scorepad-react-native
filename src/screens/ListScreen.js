import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import Animated, { Layout, Easing } from 'react-native-reanimated';

import { selectAllGames } from '../../redux/GamesSlice';
import GameListItem from '../components/GameListItem';

const ListScreen = ({ navigation }) => {
    const gameList = useSelector(state => selectAllGames(state));

    const GamesFooter = () => {
        return (
            <View style={{
                paddingVertical: 20,
                backgroundColor: 'white'
            }}>
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }} backgroundColor={'white'}>
            <Animated.FlatList
                itemLayoutAnimation={Layout.easing(Easing.ease).delay(200)}
                style={styles.list}
                data={gameList}
                renderItem={({ item, index }) =>
                    <GameListItem navigation={navigation} game={item} index={index} />
                }
                keyExtractor={item => item.id}
            // ListFooterComponent={GamesFooter}
            >
            </Animated.FlatList>
        </View>
    );
};

const styles = StyleSheet.create({
    list: {
        borderTopWidth: 1,
        borderColor: '#eee',
        backgroundColor: 'white',
        flex: 1,
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
