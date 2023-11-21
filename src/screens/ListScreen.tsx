import React, { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Layout, Easing } from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { asyncCreateGame, selectAllGames } from '../../redux/GamesSlice';
import GameListItem from '../components/GameListItem';
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
            dispatch(asyncCreateGame({ gameCount: gameList.length + 1, playerCount: 2 })).then(() => {
                setTimeout(() => {
                    navigation.navigate("Game");
                }, 500);
            });
        }
    }, [gameList.length]);

    return (
        <SafeAreaView edges={['bottom', 'left', 'right']} style={{ backgroundColor: 'white', flex: 1 }}>
            <Animated.FlatList
                ListFooterComponent={<View style={{ paddingBottom: 25 }}></View>}
                itemLayoutAnimation={Layout.easing(Easing.ease)}
                style={styles.list}
                data={gameList}
                renderItem={({ item, index }) =>
                    <GameListItem navigation={navigation} gameId={item.id} index={index} />
                }
                keyExtractor={item => item.id}
            >
            </Animated.FlatList>
            <BlurView intensity={20} style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
                justifyContent: 'flex-start', alignItems: 'center',
                borderTopWidth: 1, borderColor: '#ccc',
            }}>
                <Text style={{ paddingTop: 10, color: '#555', fontSize: 12 }}>Long press for more options.</Text>
            </BlurView>
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
