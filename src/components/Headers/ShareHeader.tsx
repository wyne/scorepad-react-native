import React from 'react';
import { Text, StyleSheet } from 'react-native';

import CustomHeader from './CustomHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';
import BackButton from '../Buttons/BackButton';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ShareHeader: React.FunctionComponent<Props> = ({ navigation }: Props) => {

    return (
        <CustomHeader navigation={navigation}
            headerLeft={<BackButton navigation={navigation} />}
            headerCenter={<Text style={styles.title}>Share</Text>}
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

export default ShareHeader;
