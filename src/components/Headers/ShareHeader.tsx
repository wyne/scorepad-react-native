import React from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, StyleSheet } from 'react-native';

import { useTheme } from '../../theme';
import BackButton from '../Buttons/BackButton';

import CustomHeader from './CustomHeader';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ShareHeader: React.FunctionComponent<Props> = ({ navigation }: Props) => {
    const theme = useTheme();
    return (
        <CustomHeader navigation={navigation}
            headerLeft={<BackButton navigation={navigation} />}
            headerCenter={<Text style={[styles.title, { color: theme.headerText }]}>Share</Text>}
        />
    );
};

const styles = StyleSheet.create({
    title: {
        fontSize: 20,
        fontVariant: ['tabular-nums'],
    },
});

export default ShareHeader;
