import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, FlatList, ScrollView, SectionList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { getContrastRatio } from 'colorsheet';
import { List, ListItem, Icon, Button, SearchBar, Avatar } from 'react-native-elements';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { newGame, addPlayer } from '../../redux/CurrentGameActions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY } from '../constants';
import { v4 as uuidv4 } from 'uuid';

const ListScreen = ({ navigation }) => {
    const [gameList, setGameList] = useState([])

    const newGameHandler = () => {
        dispatch(newGame());
        setIsNewGame(true);
    }

    const storeGames = async (value) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY.GAMES_LIST, JSON.stringify(value))
        } catch (e) {
            // saving error
        }
    }

    const getData = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY.GAMES_LIST)
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (e) {
            // error reading value
        }
    }

    useEffect(() => {
        getData().then((value) => {
            if (value != null) {
                setGameList(value);
            }
        })
    }, [])

    const addGameHandler = () => {
        getData().then((value) => {
            const newGame = {
                id: uuidv4(),
                title: 'Game ' + (value.length + 1),
                created: '2020-01-01 12:00:00',
            }
            const newGamesList = [newGame].concat(value);

            setGameList(newGamesList);
            storeGames(newGamesList);
        })
    }

    const GamesFooter = () => {
        return (
            <View style={{
                paddingVertical: 20,
                backgroundColor: 'white'
            }} >
            </View>
        );
    };

    return (
        <View>
            <Button title="New Game" onPress={addGameHandler} />
            <ScrollView style={[styles.gamesList, { flexShrink: 1 }]}>
                {
                    gameList.map((game, i) => (
                        <ListItem key={i} bottomDivider onPress={() => { navigation.navigate("Game") }} >
                            <ListItem.Content>
                                <ListItem.Title>{game.title}</ListItem.Title>
                                <ListItem.Subtitle style={{ color: '#999' }}>{game.created}</ListItem.Subtitle>
                                <ListItem.Subtitle style={{ color: '#999' }}>Rick, Morty, Summer</ListItem.Subtitle>
                            </ListItem.Content>
                            <Avatar size={"small"}
                                rounded
                                title="4P"
                                activeOpacity={0.7}
                                titleStyle={{ color: '#01497C' }}
                            />
                            <Avatar size={"small"}
                                rounded
                                title="6R"
                                activeOpacity={0.7}
                                titleStyle={{ color: '#c25858' }}
                            />
                            <ListItem.Chevron />
                        </ListItem>
                    ))
                }
                <GamesFooter />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
});

export default ListScreen;