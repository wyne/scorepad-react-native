import React from 'react';
import analytics from '@react-native-firebase/analytics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';

import HeaderButton from './HeaderButton';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { systemBlue } from '../../constants';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const BackButton: React.FunctionComponent<Props> = ({ navigation }) => {
    return (
        <HeaderButton accessibilityLabel='Home' onPress={async () => {
            navigation.goBack();
            await analytics().logEvent('menu');
        }}>
            <Icon name="bars"
                type="font-awesome-5"
                size={20}
                color={systemBlue} />
        </HeaderButton>
    );
};

export default BackButton;