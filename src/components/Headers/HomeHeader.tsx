import React from 'react';
import { Text, StyleSheet } from 'react-native';
import AppInfoButton from '../Buttons/AppInfoButton';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';

import NewGameButton from '../Buttons/NewGameButton';
import CustomHeader from './CustomHeader';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const HomeHeader: React.FunctionComponent<Props> = ({ navigation }) => {

    return (
        <CustomHeader navigation={navigation}
            headerLeft={<AppInfoButton navigation={navigation} />}
            headerCenter={<Text style={styles.title}>ScorePad</Text>}
            headerRight={<NewGameButton navigation={navigation} />}
        />
    );
}

const styles = StyleSheet.create({
    title: {
        color: 'white',
        fontSize: 20,
        fontVariant: ['tabular-nums'],
    },
});

export default HomeHeader;
