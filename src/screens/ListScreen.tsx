import React, { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Layout, Easing } from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';

import { asyncCreateGame, selectAllGames } from '../../redux/GamesSlice';
import GameListItem from '../components/GameListItem';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setOnboardedVersion } from '../../redux/SettingsSlice';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ListScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const gameList = useAppSelector(state => selectAllGames(state));
    const dispatch = useAppDispatch();

    // If no games, create one and navigate to it
    useEffect(() => {
        dispatch(setOnboardedVersion());

        if (gameList.length == 0) {
            dispatch(asyncCreateGame(gameList.length + 1)).then(() => {
                setTimeout(() => {
                    navigation.navigate("Game");
                }, 500);
            });
        }
    }, [gameList.length]);

    return (
        <SafeAreaView edges={['bottom', 'left', 'right']} style={{ backgroundColor: 'white', flex: 1 }}>
            <Animated.FlatList
                itemLayoutAnimation={Layout.easing(Easing.ease)}
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
