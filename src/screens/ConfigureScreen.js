import React, { useState } from 'react';
import { Platform, Text, View, StyleSheet, Image, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { newGame, addPlayer } from '../../redux/CurrentGameActions';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Icon, Button } from 'react-native-elements'
import Animated from 'react-native-reanimated';
import BottomSheet from 'reanimated-bottom-sheet';
import EditPlayer from '../components/EditPlayer';

const appJson = require('../../app.json');

const ConfigureScreen = () => {
    const palette = ["01497c", "c25858", "f5c800", "275436", "dc902c", "62516a", "755647", "925561"];
    const [isNewGame, setIsNewGame] = useState(false)
    const [playerWasAdded, setPlayerWasAdded] = useState(false)

    const players = useSelector(state => state.currentGame.players);
    const dispatch = useDispatch();

    const newGameHandler = () => {
        dispatch(newGame());
        setIsNewGame(true);
    }

    const addPlayerHandler = () => {
        dispatch(addPlayer('Player ' + (players.length + 1)));
        setPlayerWasAdded(true)
    }

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

    return (
        <KeyboardAwareScrollView style={styles.configScrollContainer} contentContainerStyle={{ alignItems: 'stretch' }}>

            <BottomSheet
                ref={sheetRef}
                snapPoints={[450, 0]}
                initialSnap={1}
                borderRadius={20}
                renderContent={renderContent}
                onOpenStart={() => null}
                onCloseEnd={() => null}
            />

            <View style={{ width: 350, alignSelf: 'center' }}>
                <Image
                    source={require('../../assets/infographic.png')}
                    resizeMode={'contain'}
                    resizeMethod={'scale'}
                    alignSelf={'center'}
                    style={{
                        width: Dimensions.get('window').width * .4,
                        height: Dimensions.get('window').width * .4,
                        maxWidth: '50%',
                        aspectRatio: 1,
                        margin: 20,
                    }}
                />
                {/* <Text flex={1} style={styles.text}>Tap the top half of a player's card to add a point. Tap the bottom half to subtract.</Text> */}
                {/* <Text flex={1} style={styles.text}>Tip: To add or subtract faster, try tapping with two alternating fingers.</Text> */}

                <View style={{ margin: 10, }}>
                    <Button
                        icon={<Icon name="refresh" color="white" />}
                        title="New Game"
                        onPress={newGameHandler} />
                    {isNewGame &&
                        <Text style={{ textAlign: 'center', paddingTop: 10, color: '#eee' }}>
                            Scores have been reset!
                        </Text>
                    }
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
                        index={index} promptColor={promptColor}
                        setPlayerWasAdded={setPlayerWasAdded}
                        playerWasAdded={playerWasAdded}
                        key={player.uuid}
                    />
                ))}

                <View style={{ margin: 10 }}>
                    <Button title="Add Player"
                        icon={<Icon name="add" color="white" />}
                        disabled={players.length >= 8}
                        onPress={addPlayerHandler} />
                </View>

                {players.length >= 8 &&
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

export default ConfigureScreen;