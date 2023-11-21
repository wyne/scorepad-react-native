import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';

import HomeButton from '../Buttons/HomeButton';

import CustomHeader from './CustomHeader';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const AppInfoHeader: React.FunctionComponent<Props> = ({ navigation }: Props) => {

    return (
        <CustomHeader navigation={navigation}
            headerLeft={<HomeButton navigation={navigation} />}
            headerCenter={<Text style={styles.title}>Settings</Text>}
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

export default AppInfoHeader;
