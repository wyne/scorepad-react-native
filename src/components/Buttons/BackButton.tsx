import React from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from 'react-native-elements/dist/icons/Icon';

import { logEvent } from '../../Analytics';
import { useTheme } from '../../theme';

import HeaderButton from './HeaderButton';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const BackButton: React.FunctionComponent<Props> = ({ navigation }) => {
    const theme = useTheme();
    return (
        <HeaderButton accessibilityLabel='Home' onPress={async () => {
            navigation.goBack();
            await logEvent('navigate_home');
        }}>
            <Icon name="bars"
                type="font-awesome-5"
                size={20}
                color={theme.tint} />
        </HeaderButton>
    );
};

export default BackButton;
