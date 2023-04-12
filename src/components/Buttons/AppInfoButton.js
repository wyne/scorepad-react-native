import React from 'react';

import HeaderButton from './HeaderButton';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { systemBlue } from '../../constants';

const AppInfoButton = ({ navigation }) => {
    return (
        <HeaderButton onPress={
            () => navigation.navigate('AppInfo')
        }>
            <Icon name="info-circle"
                type="font-awesome-5"
                size={20}
                color={systemBlue} />
        </HeaderButton>
    );
};

export default AppInfoButton;
