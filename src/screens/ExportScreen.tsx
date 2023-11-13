import React, { useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';
import { captureRef } from "react-native-view-shot";
import * as Sharing from 'expo-sharing';

import { selectGameById } from '../../redux/GamesSlice';
import RoundScoreColumn from '../components/ScoreLog/RoundScoreColumn';
import TotalScoreColumn from '../components/ScoreLog/TotalScoreColumn';
import PlayerNameColumn from '../components/ScoreLog/PlayerNameColumn';
import { useAppSelector } from '../../redux/hooks';
import { Button, Icon } from 'react-native-elements';
import { systemBlue } from '../constants';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ExportScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);

    if (typeof currentGameId == 'undefined') return null;

    const roundTotal = useAppSelector(state => selectGameById(state, currentGameId)?.roundTotal || 0);

    const currentGame = useAppSelector(state => selectGameById(state, state.settings.currentGameId));
    if (typeof currentGame == 'undefined') return null;


    const roundsScrollViewEl = useRef<ScrollView>(null);

    const roundsIterator = [...Array(roundTotal + 1).keys()];

    const exportImage = () => {
        if (roundsScrollViewEl.current == null) return;

        captureRef(roundsScrollViewEl, {
            result: 'tmpfile',
            quality: 1,
            format: 'png',
            snapshotContentContainer: true,
            fileName: `${currentGame?.title}.png`,
        }).then(uri => {
            Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: 'Share Scoreboard',
                UTI: 'image/png',
            });
        });
    };

    return (
        <SafeAreaView edges={['right', 'left']}
            style={[styles.scoreTableContainer, { height: 'auto' }]}>
            <ScrollView>

                <Text style={{ color: 'white', paddingVertical: 20 }}>
                    You can edit the game title or player names before sharing.
                    Note that edits will affect the game and be permanent.
                </Text>

                <Button title={' Edit before sharing'} type='clear'
                    icon={<Icon name='edit' color={systemBlue} />}
                    style={{ padding: 10 }}
                    onPress={async () => {
                        navigation.navigate("Settings");
                    }} />

                <View style={{
                    flexDirection: 'row',
                    borderWidth: 2,
                    borderColor: 'white',
                    borderStyle: 'solid',
                }}>
                    <ScrollView horizontal={true}
                        contentContainerStyle={{
                            backgroundColor: 'black',
                            flexDirection: 'column',
                            padding: 10,
                        }}
                        ref={roundsScrollViewEl}>
                        <View style={{ flexDirection: 'column' }}>
                            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', padding: 10 }}>
                                {currentGame?.title}
                            </Text>
                            <Text style={{ color: 'white', paddingHorizontal: 10 }}>
                                Created: {new Date(currentGame.dateCreated).toLocaleDateString()}
                                &nbsp; {new Date(currentGame.dateCreated).toLocaleTimeString()}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <PlayerNameColumn navigation={navigation} disabled={true} />
                            <TotalScoreColumn />
                            {roundsIterator.map((item, round) => (
                                <View key={round}>
                                    <RoundScoreColumn
                                        round={round}
                                        key={round}
                                        isCurrentRound={false}
                                        disabled={true}
                                    />
                                </View>
                            ))}
                        </View>
                        <View>
                            <Text>
                                Created with ScorePad
                            </Text>
                        </View>
                    </ScrollView>
                </View>
                <Button style={{ padding: 20 }} type='clear'
                    icon={<Icon type='evilicon' name='image' color={systemBlue} />}
                    title=" Share as image..." onPress={exportImage} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    scoreTableContainer: {
        backgroundColor: 'black',
        flex: 1,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default ExportScreen;
