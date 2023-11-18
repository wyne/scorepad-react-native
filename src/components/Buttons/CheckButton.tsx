import React from 'react';
import analytics from '@react-native-firebase/analytics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';

import HeaderButton from './HeaderButton';
import { systemBlue } from '../../constants';
import { Text } from 'react-native';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const CheckButton: React.FunctionComponent<Props> = ({ navigation }) => {
    return (
        <HeaderButton accessibilityLabel='Save Game' onPress={async () => {
            await analytics().logEvent('save_game');
            navigation.goBack();
        }}>
            <Text style={{ color: systemBlue, fontSize: 20 }}>Done</Text>
        </HeaderButton>
    );
};


export default CheckButton;
