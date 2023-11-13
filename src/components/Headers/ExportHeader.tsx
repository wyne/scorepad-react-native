import React from 'react';
import { Text, StyleSheet } from 'react-native';

import MenuButton from '../Buttons/MenuButton';
import CustomHeader from './CustomHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ExportHeader: React.FunctionComponent<Props> = ({ navigation }: Props) => {

    return (
        <CustomHeader navigation={navigation}
            headerLeft={<MenuButton navigation={navigation} />}
            headerCenter={<Text style={styles.title}>Export</Text>}
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

export default ExportHeader;
