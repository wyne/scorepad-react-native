import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { toggleHomeFullscreen } from '../../redux/SettingsActions';

function RoundTitle({ navigation }) {
    const dispatch = useDispatch();

    const currentRound = useSelector(state => state.currentGame.currentRound);
    const expanded = useSelector(state => state.settings.home_fullscreen);

    const handleExpand = () => {
        dispatch(toggleHomeFullscreen);
    }

    return (
        <SafeAreaView edges={['top']} style={[styles.title]}>
            <Text style={{ fontSize: 20, color: 'white' }}>Round {currentRound + 1}</Text>
            <SafeAreaView edges={['right']}>
                <Icon name={expanded ? 'expand-alt' : 'compress-alt'} color="#0a84ff" type="font-awesome-5" onPress={handleExpand}></Icon>
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    title: {
        textAlign: 'center',
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        backgroundColor: 'black',
        paddingBottom: 10,
    }
});

export default RoundTitle;