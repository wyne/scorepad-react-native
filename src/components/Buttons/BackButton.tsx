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

const BackButton: React.FunctionComponent<Props> = ({ navigation }) => {
    return (
        <HeaderButton accessibilityLabel='Home' onPress={async () => {
            navigation.goBack();
            await logEvent('menu');
        }}>
            <Icon name="bars"
                type="font-awesome-5"
                size={20}
                color={systemBlue} />
        </HeaderButton>
    );
};

export default BackButton;
