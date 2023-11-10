import React from 'react';
import analytics from '@react-native-firebase/analytics';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import HeaderButton from './HeaderButton';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { systemBlue } from '../../constants';
import { toggleHomeFullscreen } from '../../../redux/SettingsSlice';

const FullscreenButton: React.FunctionComponent = ({ }) => {
    const dispatch = useAppDispatch();
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);

    const expandHandler = async () => {
        dispatch(toggleHomeFullscreen());
        await analytics().logEvent('fullscreen');
    };

    return (
        <HeaderButton accessibilityLabel='Toggle Full Screen' onPress={expandHandler}>
            <Icon name={fullscreen ? 'compress-alt' : 'expand-alt'}
                type="font-awesome-5"
                size={20}
                color={systemBlue} />
        </HeaderButton>
    );
};

export default FullscreenButton;
