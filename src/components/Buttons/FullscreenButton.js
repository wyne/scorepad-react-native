import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import HeaderButton from './HeaderButton';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { systemBlue } from '../../constants';
import { toggleHomeFullscreen } from '../../../redux/SettingsSlice';

const FullscreenButton = (props) => {
    const dispatch = useDispatch();
    const fullscreen = useSelector(state => state.settings.home_fullscreen);

    const expandHandler = () => {
        dispatch(toggleHomeFullscreen());
    };

    return (
        <HeaderButton onPress={expandHandler}>
            <Icon name={fullscreen ? 'compress-alt' : 'expand-alt'}
                type="font-awesome-5"
                size={20}
                color={systemBlue} />
        </HeaderButton>
    );
};

export default FullscreenButton;
