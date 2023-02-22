import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import { List, ListItem, Icon, Button, Avatar } from 'react-native-elements';
import { newGame } from '../../redux/CurrentGameActions';
import { v4 as uuidv4 } from 'uuid';
import { storeGames, retrieveGames } from '../../asyncstorage/GamesListStorage';

const ListScreen = ({ navigation }) => {
    const [gameList, setGameList] = useState([])

    const newGameHandler = () => {
        dispatch(newGame());
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
        return <ListItem key={i} bottomDivider onPress={() => {
            navigation.navigate("Game")
        }} >
            <ListItem.Content>
                <ListItem.Title>{game.title}</ListItem.Title>
                <ListItem.Subtitle style={{ color: '#999' }}>
                    {game.created}
                </ListItem.Subtitle>
                <ListItem.Subtitle style={{ color: '#999' }}>
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
        <View style={{
            flex: 1,
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute'
        }}>
            <Button title="New Game" onPress={addGameHandler} />
            <ScrollView style={{ backgroundColor: 'white', flex: 1 }}>
                {
                    gameList.map((game, i) => (
                        <GameRow game={game} index={i} />
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