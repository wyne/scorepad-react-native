import React from 'react';
import analytics from '@react-native-firebase/analytics';

import HeaderButton from './HeaderButton';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { systemBlue } from '../../constants';

const CheckButton = ({ navigation }) => {
    return (
        <HeaderButton onPress={async () => {
            navigation.navigate('Game');
            await analytics().logEvent('save_game');
        }}>
            <Icon name="check"
                type="font-awesome-5"
                size={20}
                color={systemBlue} />
        </HeaderButton>
    );
};

export default CheckButton;
