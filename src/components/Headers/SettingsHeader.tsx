import React from 'react';

import { ParamListBase, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, StyleSheet } from 'react-native';

import CheckButton from '../Buttons/CheckButton';

import CustomHeader from './CustomHeader';

type RouteParams = {
    Settings: {
        source?: string;
    };
};

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    route: RouteProp<RouteParams, 'Settings'>;
}

const SettingsHeader: React.FunctionComponent<Props> = ({ navigation, route }) => {
    return (
        <CustomHeader navigation={navigation}
            headerLeft={<></>}
            headerCenter={<Text style={styles.title} allowFontScaling={false}>Edit Game</Text>}
            headerRight={<CheckButton navigation={navigation} route={route} />}
        />
    );
};

const styles = StyleSheet.create({
    title: {
        color: 'white',
        fontSize: 20,
        fontVariant: ['tabular-nums'],
    },
});

export default SettingsHeader;
