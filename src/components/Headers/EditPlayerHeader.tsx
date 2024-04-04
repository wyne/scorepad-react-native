import React from 'react';

import { getAnalytics } from '@react-native-firebase/analytics';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text } from 'react-native';

import { systemBlue } from '../../constants';
import logger from '../../Logger';
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

const EditPlayerHeader: React.FunctionComponent<EditPlayerScreenProps> = ({ navigation, route }) => {
    return (
        <CustomHeader navigation={navigation}
            headerLeft={
                <HeaderButton accessibilityLabel='CancelEditPlayer' onPress={async () => {
                    navigation.goBack();
                    await getAnalytics().logEvent('cancel_edit_player');
                }}>
                    <Text style={{ color: systemBlue, fontSize: 20 }}>Cancel</Text>
                </HeaderButton>
            }
            headerCenter={<Text style={styles.title}>Edit Player</Text>}
            headerRight={
                <HeaderButton accessibilityLabel='SavePlayer' onPress={async () => {

                    // TODO: save player

                    logger.info('Save Player', route.params.playerId);

                    navigation.goBack();
                    await getAnalytics().logEvent('save_player');
                }}>
                    <Text style={{ color: systemBlue, fontSize: 20 }}>Save</Text>
                </HeaderButton>
            }
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
