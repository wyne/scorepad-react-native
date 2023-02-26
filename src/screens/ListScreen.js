import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import { List, ListItem, Icon, Button, Avatar } from 'react-native-elements';
import { gameNew } from '../../redux/CurrentGameSlice';
import { v4 as uuidv4 } from 'uuid';
import { storeGames, retrieveGames } from '../../asyncstorage/GamesListStorage';
import { FlatList } from 'react-native-gesture-handler';

const ListScreen = ({ navigation }) => {
    const [gameList, setGameList] = useState([])

    const newGameHandler = () => {
        dispatch(gameNew());
        setIsNewGame(true);
    }

    useEffect(() => {
        retrieveGames().then((value) => {
            if (value != null) {
                setGameList(value);
            }
        })
    }, [])

    const addGameHandler = () => {
        retrieveGames().then((value) => {
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

    const GameRow = ({ game, i }) => {
        return <ListItem key={game.id} bottomDivider onPress={() => {
            navigation.navigate("Game")
        }} >
            <ListItem.Content>
                <ListItem.Title>{game.title}</ListItem.Title>
                <ListItem.Subtitle style={styles.gameSubtitle}>
                    {game.created}
                </ListItem.Subtitle>
                <ListItem.Subtitle style={styles.gameSubtitle}>
                    Rick, Morty, Summer
                </ListItem.Subtitle>
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
    }

    return (
        <View style={{ flex: 1 }}>
            <Button title="New Game" onPress={addGameHandler} />
            <FlatList
                style={styles.list}
                data={gameList}
                renderItem={({ item }) =>
                    <GameRow game={item} />
                }
                keyExtractor={item => item.id}
                ListFooterComponent={GamesFooter}>
            </FlatList>
        </View>
    );
}

const styles = StyleSheet.create({
    list: {
        backgroundColor: 'white',
        flex: 1,
    },
    gameSubtitle: {
        color: '#999',
    }
});

export default ListScreen;
