import React from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';

import { useAppSelector } from '../../../redux/hooks';
import { logEvent } from '../../Analytics';
import { FEATURE_KEEP_SCREEN_AWAKE } from '../../constants';
import { useTheme } from '../../theme';

import HeaderButton from './HeaderButton';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const AppInfoButton: React.FunctionComponent<Props> = ({ navigation }) => {
    const theme = useTheme();
    const hasUnseenFeature = useAppSelector(state =>
        !state.settings.seenFeatureNotifications.includes(FEATURE_KEEP_SCREEN_AWAKE)
    );

    return (
        <HeaderButton accessibilityLabel='App Info' onPress={async () => {
            navigation.navigate('AppInfo');
            await logEvent('app_info');
        }}>
            <View>
                <Icon name="gear"
                    type="font-awesome"
                    size={20}
                    color={theme.tint} />
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

export default AppInfoButton;
