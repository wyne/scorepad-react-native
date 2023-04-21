import React from 'react';
import analytics from '@react-native-firebase/analytics';

import HeaderButton from './HeaderButton';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { systemBlue } from '../../constants';

const MenuButton = ({ navigation }) => {
    return (
        <HeaderButton onPress={async () => {
            navigation.navigate('List');
            await analytics().logEvent('menu');
        }}>
            <Icon name="bars"
                type="font-awesome-5"
                size={20}
                color={systemBlue} />
        </HeaderButton>
    );
};

export default MenuButton;
