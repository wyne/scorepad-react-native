import React from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from 'react-native-elements/dist/icons/Icon';

import { logEvent } from '../../Analytics';
import { systemBlue } from '../../constants';

import HeaderButton from './HeaderButton';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const AppInfoButton: React.FunctionComponent<Props> = ({ navigation }) => {
    return (
        <HeaderButton accessibilityLabel='App Info' onPress={async () => {
            navigation.navigate('AppInfo');
            await logEvent('app_info');
        }}>
            <Icon name="gear"
                type="font-awesome"
                size={20}
                color={systemBlue} />
        </HeaderButton >
    );
};

export default AppInfoButton;
