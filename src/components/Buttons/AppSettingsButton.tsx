import React from 'react';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/routers';
import { View } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';

import { useAppSelector } from '../../../redux/hooks';
import { logEvent } from '../../Analytics';
import { FEATURE_KEEP_SCREEN_AWAKE } from '../../constants';
import { useTheme } from '../../theme';

import HeaderButton from './HeaderButton';

const AppSettingsButton: React.FunctionComponent = () => {
    const theme = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
    const hasUnseenFeature = useAppSelector(state =>
        !state.settings.seenFeatureNotifications.includes(FEATURE_KEEP_SCREEN_AWAKE)
    );

    return (
        <HeaderButton accessibilityLabel='App Settings' onPress={async () => {
            navigation.navigate('AppSettings');
            await logEvent('app_info');
        }}>
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
