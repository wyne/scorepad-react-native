import React, { useState } from 'react';
import { Platform, Text, View, StyleSheet, Image, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Icon, Button } from 'react-native-elements';

import { playerAdd } from '../../redux/PlayersSlice';
import EditPlayer from '../components/EditPlayer';
import { selectGameById, updateGame, } from '../../redux/GamesSlice';
import { selectPlayersByIds } from '../../redux/ScoreSelectors';
import { v4 as uuidv4 } from 'uuid';

const SettingsScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const [playerWasAdded, setPlayerWasAdded] = useState(false);

    const currentGameId = useSelector(state => state.settings.currentGameId);
    if (typeof currentGameId == 'undefined') return null;

    const currentGame = useSelector(state => selectGameById(state, state.settings.currentGameId));
    const players = useSelector(state => selectPlayersByIds(state, currentGame.playerIds));

    const maxPlayers = Platform.isPad ? 12 : 8;

    const addPlayerHandler = () => {
        const newPlayerId = uuidv4();

        dispatch(playerAdd({
            id: newPlayerId,
            playerName: `Player ${players.length + 1}`,
            scores: [0],
        }));

        dispatch(updateGame({
            id: currentGame.id,
            changes: {
                playerIds: [...currentGame.playerIds, newPlayerId],
            }
        }));

        setPlayerWasAdded(true);
    };

    const mainMenuHandler = () => {
        // dispatch(gameSave(selectCurrentGame));
        navigation.navigate("List");
    };

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
                {players.map((player, index) => (
                    <EditPlayer
                        player={player}
                        index={index}
                        // promptColor={promptColor}
                        setPlayerWasAdded={setPlayerWasAdded}
                        playerWasAdded={playerWasAdded}
                        key={player.id}
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
            </View>

        </KeyboardAwareScrollView>
    );
};

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
