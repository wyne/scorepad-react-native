import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getContrastRatio } from 'colorsheet';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';
import BottomSheet from '@gorhom/bottom-sheet';

import { useAppSelector } from '../../redux/hooks';
import PlayerTile from '../components/PlayerTile';
import Rounds from '../components/Rounds';
import { selectGameById } from '../../redux/GamesSlice';
import { ScrollView } from 'react-native-gesture-handler';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ScoreBoardScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    if (typeof currentGameId == 'undefined') return null;

    const palette = ["01497c", "c25858", "f5c800", "275436", "dc902c", "62516a", "755647", "925561"];
    const [rows, setRows] = useState<number>(1);
    const [cols, setCols] = useState<number>(1);
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const currentGame = useAppSelector(state => selectGameById(state, state.settings.currentGameId));

    const [width, setWidth] = useState<number | null>(null);
    const [height, setHeight] = useState<number | null>(null);

    if (currentGame == undefined) return null;

    const playerIds = currentGame.playerIds;

    const desiredAspectRatio = 0.8;

    const layoutHandler = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;

        setWidth(Math.round(width));
        setHeight(Math.round(height));

        let closestAspectRatio = Number.MAX_SAFE_INTEGER;
        let bestRowCount = 1;

        for (let rows = 1; rows <= playerIds.length; rows++) {
            const cols = Math.ceil(playerIds.length / rows);

            if (playerIds.length % rows > 0 && rows - playerIds.length % rows > 1) {
                continue;
            }

            const w = width / cols;
            const h = height / rows;
            const ratio = w / h;

            if (Math.abs(desiredAspectRatio - ratio) < Math.abs(desiredAspectRatio - closestAspectRatio)) {
                closestAspectRatio = ratio;
                bestRowCount = rows;
            }
        }

        setRows(bestRowCount);
        setCols(Math.ceil(playerIds.length / bestRowCount));
    };

    type DimensionValue = (rows: number, cols: number) => {
        width: number;
        height: number;
    }

    const calculateDimensions: DimensionValue = (rows: number, cols: number) => {
        if (width == null || height == null) return { width: 0, height: 0 };

        return {
            width: Math.round(width / cols),
            height: Math.round(height / rows)
        };
    };

    // ref
    const bottomSheetRef = useRef<BottomSheet>(null);

    // variables
    const snapPoints = useMemo(() => [75, '60%', '100%'], []);

    // callbacks
    const handleSheetChanges = useCallback((index: number) => {
        console.log('handleSheetChanges', index);
    }, []);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={[StyleSheet.absoluteFillObject]}>
                <View style={styles.contentStyle} onLayout={layoutHandler} >
                    {playerIds.map((id, index) => (
                        width != null && height != null &&
                        <PlayerTile
                            key={id}
                            playerId={id}
                            color={'#' + palette[index % palette.length]}
                            fontColor={getContrastRatio('#' + palette[index % palette.length], '#000').number > 7 ? "#000000" : "#FFFFFF"}
                            cols={(rows != 0 && cols != 0) ? cols : 0}
                            rows={(rows != 0 && cols != 0) ? rows : 0}
                            width={calculateDimensions(rows, cols).width}
                            height={calculateDimensions(rows, cols).height}
                            index={index}
                        />
                    ))}
                </View>

                <BottomSheet
                    ref={bottomSheetRef}
                    index={0}
                    snapPoints={snapPoints}
                    onChange={handleSheetChanges}
                    backgroundStyle={{ backgroundColor: 'rgb(30,40,50)' }}
                    handleIndicatorStyle={{ backgroundColor: 'white' }}
                >
                    <View style={styles.contentContainer}>
                        <Text style={{ color: 'white', fontSize: 20, padding: 20, paddingTop: 0, fontWeight: 'bold' }}>History</Text>
                        <ScrollView>
                            <Rounds navigation={navigation} show={!fullscreen} />
                        </ScrollView>
                    </View>
                </BottomSheet>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    contentStyle: {
        flex: 1,
        flexGrow: 1,
        flexWrap: 'wrap',
        alignContent: 'stretch',
        flexDirection: 'row',
        maxWidth: '100%',
        backgroundColor: '#000000',
        paddingBottom: 75,
    },
    contentContainer: {
        flex: 1,
    },
});

export default ScoreBoardScreen;
