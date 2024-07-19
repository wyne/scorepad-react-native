import React from 'react';

import { ParamListBase, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text } from 'react-native';

import { logEvent } from '../../Analytics';
import { systemBlue } from '../../constants';
import HeaderButton from '../Buttons/HeaderButton';

import CustomHeader from './CustomHeader';

type RouteParams = {
    EditPlayer: {
        index: number | undefined;
        playerId: string | undefined;
    };
};

interface EditPlayerScreenProps {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    route: RouteProp<RouteParams, 'EditPlayer'>;
}

const EditPlayerHeader: React.FunctionComponent<EditPlayerScreenProps> = ({ navigation }) => {
    return (
        <CustomHeader navigation={navigation}
            headerLeft={
                <HeaderButton accessibilityLabel='EditPlayerBack' onPress={async () => {
                    navigation.goBack();
                    await logEvent('edit_player_back');
                }}>
                    <Text style={{ color: systemBlue, fontSize: 20 }}>Back</Text>
                </HeaderButton>
            }
            headerCenter={<Text style={styles.title}>Edit Player</Text>}
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
