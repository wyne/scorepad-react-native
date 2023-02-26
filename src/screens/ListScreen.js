import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import { List, ListItem, Icon, Button, Avatar } from 'react-native-elements';
import { FlatList } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { useDispatch } from 'react-redux';

import { gameNew } from '../../redux/CurrentGameSlice';
import { gameSave } from '../../redux/GameListSlice';
import { storeGames, retrieveGames } from '../../asyncstorage/GamesListStorage';
import { selectGameIds, selectAllGames } from '../../redux/GameListSlice';

const ListScreen = ({ navigation }) => {
    const dispatch = useDispatch();

    const selectCurrentGame = useSelector(state => state.currentGame);
    const gameList = useSelector(state => selectAllGames(state));

    const addGameHandler = () => {
        dispatch(gameSave(selectCurrentGame));
        dispatch(gameNew());
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
        return <ListItem key={game.uuid} bottomDivider onPress={() => {
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
                keyExtractor={item => item.uuid}
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
