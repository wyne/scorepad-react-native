import React, { useState } from 'react';
import { Text, View, StyleSheet, FlatList, ScrollView, SectionList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { getContrastRatio } from 'colorsheet';
import { List, ListItem, Icon, Button, SearchBar, Avatar } from 'react-native-elements';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { newGame, addPlayer } from '../../redux/CurrentGameActions';

const ListScreen = ({ navigation }) => {
    const newGameHandler = () => {
        dispatch(newGame());
        setIsNewGame(true);
    }

    const games = [
        { id: '58694a0f-3da1-471f-bd96-145571e29d82', title: 'Game 13', created: '2020-01-01 12:00:00' },
        { id: '58694a0f-3da1-471f-bd96-145571e29d81', title: 'Game 12', created: '2020-01-01 12:00:00' },
        { id: '58694a0f-3da1-471f-bd96-145571e29d80', title: 'Game 11', created: '2020-01-01 12:00:00' },
        { id: '58694a0f-3da1-471f-bd96-145571e29d79', title: 'Game 10', created: '2020-01-01 12:00:00' },
        { id: '58694a0f-3da1-471f-bd96-145571e29d78', title: 'Game 9', created: '2020-01-01 12:00:00' },
        { id: '58694a0f-3da1-471f-bd96-145571e29d77', title: 'Game 8', created: '2020-01-01 12:00:00' },
        { id: '58694a0f-3da1-471f-bd96-145571e29d76', title: 'Game 7', created: '2020-01-01 12:00:00' },
        { id: '58694a0f-3da1-471f-bd96-145571e29d75', title: 'Game 6', created: '2020-01-01 12:00:00' },
        { id: '58694a0f-3da1-471f-bd96-145571e29d74', title: 'Game 5', created: '2020-01-01 12:00:00' },
        { id: '58694a0f-3da1-471f-bd96-145571e29d73', title: 'Game 4', created: '2020-01-01 12:00:00' },
        { id: '58694a0f-3da1-471f-bd96-145571e29d72', title: 'Game 3', created: '2020-01-01 12:00:00' },
        { id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63', title: 'Game 2', created: '2020-01-01 12:00:00' },
        { id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba', title: 'Game 1', created: '2020-01-01 12:00:00' },
    ]

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
            <ScrollView style={[styles.gamesList, { flexShrink: 1 }]}>
                {
                    games.map((game, i) => (
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