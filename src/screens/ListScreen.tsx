import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Layout, Easing } from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';

import { selectAllGames } from '../../redux/GamesSlice';
import GameListItem from '../components/GameListItem';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../../redux/hooks';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ListScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const gameList = useAppSelector(state => selectAllGames(state));

    return (
        <SafeAreaView edges={['bottom', 'left', 'right']} style={{ backgroundColor: 'white', flex: 1 }}>
            <Animated.FlatList
                itemLayoutAnimation={Layout.easing(Easing.ease).delay(200)}
                // https://github.com/software-mansion/react-native-reanimated/pull/4074
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
