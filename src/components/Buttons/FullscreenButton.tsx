import React from 'react';

import { Icon } from 'react-native-elements/dist/icons/Icon';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { toggleHomeFullscreen } from '../../../redux/SettingsSlice';
import { logEvent } from '../../Analytics';
import { systemBlue } from '../../constants';

import HeaderButton from './HeaderButton';

const FullscreenButton: React.FunctionComponent = ({ }) => {
    const dispatch = useAppDispatch();
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);

    const expandHandler = async () => {
        dispatch(toggleHomeFullscreen());
        await logEvent('fullscreen');
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
