import React, { useState } from 'react';
import { Text, View, StyleSheet, FlatList, ScrollView, SectionList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { getContrastRatio } from 'colorsheet';
import { List, ListItem, Icon, Button, SearchBar, Avatar } from 'react-native-elements';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { newGame, addPlayer } from '../../redux/CurrentGameActions';

const ListScreen = ({ navigation }) => {
    const layoutHandler = (e) => {
    }
    const [isNewGame, setIsNewGame] = useState(false)

    const newGameHandler = () => {
        dispatch(newGame());
        setIsNewGame(true);
    }

    const games = [
        { id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba', title: 'Game 1', created: '2020-01-01 12:00:00' },
        { id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63', title: 'Game 2', created: '2020-01-01 12:00:00' },
        { id: '58694a0f-3da1-471f-bd96-145571e29d72', title: 'Game 3', created: '2020-01-01 12:00:00' },
        { id: '58694a0f-3da1-471f-bd96-145571e29d73', title: 'Game 4', created: '2020-01-01 12:00:00' },
        { id: '58694a0f-3da1-471f-bd96-145571e29d74', title: 'Game 5', created: '2020-01-01 12:00:00' },
    ]

    const renderSeparator = () => {
        return (
            <View
                style={{
                    height: 1,
                    width: "86%",
                    backgroundColor: "#CED0CE",
                    marginLeft: "14%"
                }}
            />
        );
    };

    const GamesFooter = () => {
        // if (!this.state.loading) return null;

        return (
            <View
                style={{
                    paddingVertical: 20,
                    borderTopWidth: 1,
                    borderColor: "#CED0CE"
                }}
            >
                {/* <ActivityIndicator animating size="large" /> */}
            </View>
        );
    };

    const GamesHeader = () => {
        return <SearchBar placeholder="Type Here..." lightTheme round />;
    };

    return (
        <SafeAreaView contentContainerStyle={{ alignItems: 'stretch' }}
            backgroundColor="#01497C"
        >
            <ScrollView>
                <GamesHeader />
                {
                    games.map((game, i) => (
                        <ListItem key={i} bottomDivider onPress={() => { navigation.navigate("Game") }} >
                            <ListItem.Content>
                                <ListItem.Title>{game.title}</ListItem.Title>
                                <ListItem.Subtitle style={{ color: '#999' }}>{game.created}</ListItem.Subtitle>
                            </ListItem.Content>
                            <Avatar size={"small"}
                                rounded
                                title="4P"
                                activeOpacity={0.7}
                                titleStyle={{ color: '#01497C', fontWeight: 'bold' }}
                            />
                            <Avatar size={"small"}
                                rounded
                                title="6R"
                                activeOpacity={0.7}
                                titleStyle={{ color: '#01497C', fontWeight: 'bold' }}
                            />
                            <ListItem.Chevron />
                        </ListItem>
                    ))
                }
                <GamesFooter />
            </ScrollView>
            <View style={{ margin: 10, }}>
                <Button
                    icon={<Icon name="add" color="white" />}
                    title="New Game"
                    onPress={newGameHandler} />
                {isNewGame &&
                    <Text style={{ textAlign: 'center', paddingTop: 10, color: '#eee' }}>
                        Scores have been reset!
                    </Text>
                }
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    gamesList: {
        backgroundColor: 'white',
        paddingVertical: 20,
        width: '100%',
        alignContent: 'center',
        alignSelf: 'center',
    },
    gameItem: {
        backgroundColor: '#E6F4FF',
        borderRadius: 20,
        margin: 30,
        marginVertical: 15,
        fontSize: 20,
        textAlign: 'center',
        padding: 20,
    },
    gameTitle: {
        textTransform: 'uppercase',
        marginBottom: 5,
        color: 'black',
        fontWeight: 'bold',
        fontSize: 25
    },
    gameTimestamp: {
        color: '#01469C',
        fontSize: 15
    },
    newGame: {
        textTransform: 'uppercase',
        marginBottom: 5,
        backgroundColor: '#DEB673',
        color: '#1E1E1D',
        alignContent: 'center',
        textAlign: 'center',
        borderRadius: 20,
        fontWeight: 'bold',
        fontSize: 35
    }
});

export default ListScreen;