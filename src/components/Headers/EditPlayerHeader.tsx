import React from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text } from 'react-native';


import CustomHeader from './CustomHeader';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const EditPlayerHeader: React.FunctionComponent<Props> = ({ navigation }) => {
    return (
        <CustomHeader navigation={navigation}
            headerLeft={<></>}
            headerCenter={<Text style={styles.title}>Edit Player</Text>}
            headerRight={<></>}
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

export default EditPlayerHeader;
