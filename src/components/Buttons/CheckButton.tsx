import React from 'react';

import analytics from '@react-native-firebase/analytics';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import { systemBlue } from '../../constants';

import HeaderButton from './HeaderButton';

type RouteParams = {
    Settings: {
        reason?: string;
    };
};
interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    route?: RouteProp<RouteParams, 'Settings'>;
}

const CheckButton: React.FunctionComponent<Props> = ({ navigation, route }) => {

    return (
        <HeaderButton accessibilityLabel='Save Game' onPress={async () => {
            await analytics().logEvent('save_game');
            if (route?.params?.reason === 'new_game') {
                navigation.navigate("Game");
            } else {
                navigation.goBack();
            }
        }}>
            <Text style={{ color: systemBlue, fontSize: 20 }}>Done</Text>
        </HeaderButton>
    );
};


export default CheckButton;
