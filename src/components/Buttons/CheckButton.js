import React from 'react';
import { DrawerActions } from '@react-navigation/native';

import HeaderButton from './HeaderButton';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { systemBlue } from '../../constants';

const CheckButton = ({ navigation }) => {
    return (
        <HeaderButton onPress={() => navigation.navigate('Game')}>
            <Icon name="check"
                type="font-awesome-5"
                size={20}
                color={systemBlue} />
        </HeaderButton>
    );
};

export default CheckButton;
