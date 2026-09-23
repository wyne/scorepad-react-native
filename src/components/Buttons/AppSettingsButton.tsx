import React, { useLayoutEffect, useMemo, useRef } from 'react';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackHeaderItem, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/routers';
import { View } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';

import { useAppSelector } from '../../../redux/hooks';
import { logEvent } from '../../Analytics';
import { FEATURE_KEEP_SCREEN_AWAKE } from '../../constants';
import { useTheme } from '../../theme';

import HeaderButton from './HeaderButton';

type Navigation = NativeStackNavigationProp<ParamListBase>;

const useAppSettingsButton = (navigation: Navigation) => {
    const hasUnseenFeature = useAppSelector(state =>
        !state.settings.seenFeatureNotifications.includes(FEATURE_KEEP_SCREEN_AWAKE)
    );

    const onPress = () => {
        navigation.navigate('AppSettings');
        void logEvent('app_info');
    };

    return { hasUnseenFeature, onPress };
};

/**
 * Native header item for the settings button (iOS only). Native items,
 * unlike React views in `headerLeft`, can be moved by the system into the
 * vertical bar on iPhone Duo.
 */
export const useAppSettingsHeaderItems = (navigation: Navigation): NativeStackHeaderItem[] => {
    const theme = useTheme();
    const { hasUnseenFeature, onPress } = useAppSettingsButton(navigation);

    // Keep the latest handler in a ref so the items only change when what
    // they display changes. Each new items array re-runs setOptions.
    const onPressRef = useRef(onPress);
    useLayoutEffect(() => {
        onPressRef.current = onPress;
    });

    return useMemo(() => [{
        type: 'button',
        label: 'App Settings',
        accessibilityLabel: 'App Settings',
        icon: { type: 'sfSymbol', name: 'gearshape' },
        tintColor: theme.text,
        badge: hasUnseenFeature
            ? { value: 'New', style: { backgroundColor: theme.warning } }
            : undefined,
        onPress: () => onPressRef.current(),
    }], [hasUnseenFeature, theme.text, theme.warning]);
};

const AppSettingsButton: React.FunctionComponent = () => {
    const theme = useTheme();
    const navigation = useNavigation<Navigation>();
    const { hasUnseenFeature, onPress } = useAppSettingsButton(navigation);

    return (
        <HeaderButton accessibilityLabel='App Settings' onPress={onPress}>
            <View testID='app-settings-button'>
                <Icon name="gear"
                    type="font-awesome"
                    size={20}
                    color={theme.text} />
                {hasUnseenFeature && (
                    <View style={{
                        position: 'absolute',
                        top: -2,
                        right: -4,
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.warning,
                        borderWidth: 1,
                        borderColor: theme.backgroundSecondary,
                    }} />
                )}
            </View>
        </HeaderButton >
    );
};

export default AppSettingsButton;
