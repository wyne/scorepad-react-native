import React, { useRef } from 'react';

import analytics from '@react-native-firebase/analytics';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Sharing from 'expo-sharing';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from "react-native-view-shot";

import { selectGameById, selectSortSelectorKey } from '../../redux/GamesSlice';
import { useAppSelector } from '../../redux/hooks';
import { selectCurrentGame } from '../../redux/selectors';
import PlayerNameColumn from '../components/ScoreLog/PlayerNameColumn';
import RoundScoreColumn from '../components/ScoreLog/RoundScoreColumn';
import { sortSelectors } from '../components/ScoreLog/SortHelper';
import TotalScoreColumn from '../components/ScoreLog/TotalScoreColumn';
import { systemBlue } from '../constants';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ShareScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    if (typeof currentGameId == 'undefined') return null;

    const roundTotal = useAppSelector(state => selectGameById(state, currentGameId)?.roundTotal || 0);
    const currentGame = useAppSelector(selectCurrentGame);
    if (typeof currentGame == 'undefined') return null;

    const roundsScrollViewEl = useRef<ScrollView>(null);

    const roundsIterator = [...Array(roundTotal).keys()];

    const exportImage = async () => {
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

        await analytics().logEvent('share_image');
    };

    const sortSelectorKey = useAppSelector(state => selectSortSelectorKey(state, currentGameId));
    const sortSelector = sortSelectors[sortSelectorKey];

    return (
        <SafeAreaView edges={['right', 'left']}
            style={[styles.contentContainer, { height: 'auto' }]}>
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
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            backgroundColor: 'black',
                            flexDirection: 'column',
                            padding: 20,
                        }}
                        ref={roundsScrollViewEl}>
                        <View style={{ flexDirection: 'column' }}>
                            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', paddingBottom: 10 }}>
                                {currentGame?.title}
                            </Text>
                            <Text style={{ color: 'white' }}>
                                Created: {new Date(currentGame.dateCreated).toLocaleDateString()}
                                &nbsp; {new Date(currentGame.dateCreated).toLocaleTimeString()}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <PlayerNameColumn sortSelector={sortSelector} sortSelectorKey={sortSelectorKey} />
                            <TotalScoreColumn sortSelector={sortSelector} sortSelectorKey={sortSelectorKey} />
                            {roundsIterator.map((item, round) => (
                                <View key={round}>
                                    <RoundScoreColumn
                                        sortSelector={sortSelector}
                                        round={round}
                                        key={round}
                                        isCurrentRound={false}
                                        disabled={true}
                                    />
                                </View>
                            ))}
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
    contentContainer: {
        backgroundColor: 'black',
        flex: 1,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default ShareScreen;
