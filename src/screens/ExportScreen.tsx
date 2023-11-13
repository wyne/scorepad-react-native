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
import { Button } from 'react-native-elements';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ExportScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);

    if (typeof currentGameId == 'undefined') return null;

    const roundCurrent = useAppSelector(state => selectGameById(state, currentGameId)?.roundCurrent || 0);
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
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                            {currentGame?.title}
                        </Text>
                        <Text style={{ color: 'white', paddingVertical: 5 }}>
                            Created: {new Date(currentGame.dateCreated).toLocaleDateString()}
                            &nbsp; {new Date(currentGame.dateCreated).toLocaleTimeString()}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <PlayerNameColumn navigation={navigation} />
                        <TotalScoreColumn />
                        {roundsIterator.map((item, round) => (
                            <View key={round}>
                                <RoundScoreColumn
                                    round={round}
                                    key={round}
                                    isCurrentRound={round == roundCurrent} />
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
            <Button style={{ padding: 20 }} title="Export" onPress={exportImage} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    scoreTableContainer: {
        backgroundColor: 'black',
        padding: 10,
        // flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default ExportScreen;
