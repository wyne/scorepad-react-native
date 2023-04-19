import React from 'react';
import analytics from '@react-native-firebase/analytics';

import HeaderButton from './HeaderButton';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { systemBlue } from '../../constants';

const AppInfoButton = ({ navigation }) => {
    return (
        <HeaderButton onPress={
            () => {
                analytics().logEvent('screenInfo', {});
                navigation.navigate('AppInfo');
            }
        }>
            <Icon name="info-circle"
                type="font-awesome-5"
                size={20}
                color={systemBlue} />
        </HeaderButton>
    );
};

export default AppInfoButton;
