import React, { useState } from 'react';
import { Platform, Text, View, StyleSheet, Image, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Icon, Button } from 'react-native-elements'

import { playerAdd } from '../../redux/CurrentGameSlice';
import EditPlayer from '../components/EditPlayer';
import { gameSave } from '../../redux/GamesSlice';

const appJson = require('../../app.json');

const SettingsScreen = ({ navigation }) => {
    const [playerWasAdded, setPlayerWasAdded] = useState(false)

    const players = useSelector(state => state.currentGame.players);
    const currentGameId = useSelector(state => state.currentGame.uuid);
    const selectCurrentGame = useSelector(state => state.currentGame);
    const dispatch = useDispatch();

    const maxPlayers = Platform.isPad ? 12 : 8;

    const addPlayerHandler = () => {
        dispatch(playerAdd('Player ' + (players.length + 1)));
        setPlayerWasAdded(true)
    }

    const mainMenuHandler = () => {
        dispatch(gameSave(selectCurrentGame));
        navigation.navigate("List")
    }

    {/* 
    const sheetRef = React.useRef(null);

    const renderContent = () => (
        <View style={{
            backgroundColor: 'rgb(44, 44, 46)',
            padding: 0,
        }}>
            <Text style={styles.text}>Swipe down to close</Text>
            {palette.map((color) => (
                <View width={"100%"} height={100} backgroundColor={'#' + color} key={color}
                    onTouchEnd={chooseColor}
                ></View>
            ))}
        </View>
    );

    const promptColor = () => { sheetRef.current.snapTo(0) }
    const chooseColor = () => { sheetRef.current.snapTo(1) }
            */}

    return (
        <KeyboardAwareScrollView
            style={styles.configScrollContainer}
            contentContainerStyle={{ alignItems: 'stretch' }}
        >
            <View style={{ width: 350, alignSelf: 'center' }}>
                <Image
                    source={require('../../assets/infographic.png')}
                    resizeMode={'contain'}
                    resizeMethod={'scale'}
                    style={{
                        alignSelf: 'center',
                        width: Math.min(Dimensions.get('window').width * .4, Dimensions.get('window').height * .4),
                        height: Math.min(Dimensions.get('window').width * .4, Dimensions.get('window').height * .4),
                        maxWidth: '50%',
                        aspectRatio: 1,
                        margin: 20,
                    }}
                />

                <View style={{ margin: 10, }}>
                    <Button
                        icon={<Icon name="menu" color="white" />}
                        title="Back to Main Menu"
                        onPress={mainMenuHandler} />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'baseline', padding: 10, justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 30, color: '#eee', marginTop: 20 }}>
                        Players
                    </Text>

                    {/* <Text style={{ fontSize: 18, color: '#0a84ff', marginTop: 20, textAlign: 'right' }}>Edit</Text> */}
                </View>

                {players.map((player, index) => (
                    <EditPlayer
                        player={player}
                        index={index}
                        // promptColor={promptColor}
                        setPlayerWasAdded={setPlayerWasAdded}
                        playerWasAdded={playerWasAdded}
                        key={player.uuid}
                    />
                ))}

                <View style={{ margin: 10 }}>
                    <Button title="Add Player"
                        icon={<Icon name="add" color="white" />}
                        disabled={players.length >= maxPlayers}
                        onPress={addPlayerHandler} />
                </View>

                {players.length >= maxPlayers &&
                    <Text style={styles.text}>Max players reached.</Text>
                }

                <View style={{ margin: 50 }}><Text>&nbsp; </Text></View>

                <View style={{ marginVertical: 30 }}>
                    <Text style={styles.text}>
                        Version {appJson.expo.version}
                    </Text>
                    {Platform.OS == 'ios' &&
                        <Text style={styles.text}>{Platform.OS} build {appJson.expo.ios.buildNumber}</Text>
                    }
                    {Platform.OS == 'android' &&
                        <Text style={styles.text}>{Platform.OS} build {appJson.expo.android.versionCode}</Text>
                    }
                    <Text>{currentGameId}</Text>
                </View>
            </View>

        </KeyboardAwareScrollView>
    );
}

const styles = StyleSheet.create({
    configScrollContainer: {
        flex: 1,
        padding: 10,
        paddingBottom: 50,
    },
    text: {
        fontSize: 18,
        margin: 15,
        color: '#eee',
    },
});

export default SettingsScreen;
