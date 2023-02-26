import React from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import { List, ListItem, Icon, Button, Avatar } from 'react-native-elements';
import { FlatList } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { useDispatch } from 'react-redux';
import Moment from 'react-moment';

import { gameNew } from '../../redux/CurrentGameSlice';
import { gameSave, selectGameById } from '../../redux/GameListSlice';
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
        const players = useSelector(state => selectGameById(state, game.uuid).players);
        const scores = useSelector(state => selectGameById(state, game.uuid).scores);
        const rounds = scores[0].length;
        const playerNames = players.map(player => player.name).join(', ');

        return <ListItem key={game.uuid} bottomDivider onPress={() => {
            navigation.navigate("Game")
        }} >
            <ListItem.Content>
                <ListItem.Title>{game.uuid}</ListItem.Title>
                <ListItem.Subtitle style={styles.gameSubtitle}>
                    <Moment fromNow>{game.dateCreated}</Moment>
                </ListItem.Subtitle>
                <ListItem.Subtitle style={styles.gameSubtitle}>
                    {playerNames}
                </ListItem.Subtitle>
            </ListItem.Content>
            <Avatar size={"small"}
                rounded
                title={`${players.length}P`}
                activeOpacity={0.7}
                titleStyle={{ color: '#01497C' }}
            />
            <Avatar size={"small"}
                rounded
                title={`${rounds}R`}
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
