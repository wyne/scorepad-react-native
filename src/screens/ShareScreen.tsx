import React, { useRef } from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Sharing from 'expo-sharing';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Icon } from 'react-native-elements';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { selectGameById } from '../../redux/GamesSlice';
import { useAppSelector } from '../../redux/hooks';
import { selectCurrentGame } from '../../redux/selectors';
import { logEvent } from '../Analytics';
import PlayerNameColumn from '../components/ScoreLog/PlayerNameColumn';
import RoundScoreColumn from '../components/ScoreLog/RoundScoreColumn';
import TotalScoreColumn from '../components/ScoreLog/TotalScoreColumn';
import { useTheme } from '../theme';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ShareScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    if (typeof currentGameId == 'undefined') return null;

    const roundTotal = useAppSelector(state => selectGameById(state, currentGameId)?.roundTotal || 0);
    const currentGame = useAppSelector(selectCurrentGame);
    if (typeof currentGame == 'undefined') return null;

    const scoreboardImageEl = useRef<View>(null);

    const roundsIterator = [...Array(roundTotal).keys()];

    const exportImage = async () => {
        if (scoreboardImageEl.current == null) return;

        try {
            const uri = await captureRef(scoreboardImageEl.current, {
                result: 'tmpfile',
                quality: 1,
                format: 'png',
                fileName: Platform.OS === 'android' ? 'scorepad-scoreboard' : undefined,
            });

            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: 'Share Scoreboard',
                UTI: 'image/png',
            });

            await logEvent('share_image');
        } catch (error) {
            console.error('Failed to capture or share image:', error);
        }
    };

    return (
        <SafeAreaView edges={['right', 'left']}
            style={[styles.contentContainer, { backgroundColor: theme.background }]}>
            <ScrollView
                testID="share-screen-scroll"
                contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>

                <Text style={{ color: theme.text, paddingVertical: 20 }}>
                    You can edit the game title or player names before sharing.
                    Note that edits will affect the game and be permanent.
                </Text>

                <Button title={' Edit before sharing'} type='clear'
                    icon={<Icon name='edit' color={theme.tint} />}
                    style={{ padding: 10 }}
                    onPress={async () => {
                        navigation.navigate('Settings', { source: 'share_screen' });
                    }} />

                <View style={{
                    flexDirection: 'row',
                    borderWidth: 2,
                    borderColor: theme.text,
                    borderStyle: 'solid',
                }}>
                    <ScrollView horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            backgroundColor: theme.background,
                            flexDirection: 'column',
                        }}>
                        <View
                            collapsable={false}
                            ref={scoreboardImageEl}
                            style={{
                                backgroundColor: theme.background,
                                flexDirection: 'column',
                                padding: 20,
                            }}>
                            <View style={{ flexDirection: 'column' }}>
                                <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold', paddingBottom: 10 }}>
                                    {currentGame?.title}
                                </Text>
                                <Text style={{ color: theme.text }}>
                                    Created: {new Date(currentGame.dateCreated).toLocaleDateString()}
                                    &nbsp; {new Date(currentGame.dateCreated).toLocaleTimeString()}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                                <PlayerNameColumn />
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
                        </View>
                    </ScrollView>
                </View>
                <Button style={{ padding: 20 }} type='clear'
                    icon={<Icon type='evilicon' name='image' color={theme.tint} />}
                    title=" Share as image..." onPress={exportImage} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default ShareScreen;
