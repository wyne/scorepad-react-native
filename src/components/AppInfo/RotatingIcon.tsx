import React, { useRef } from 'react';

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { TouchableOpacity } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

import icon from '../../../assets/icon.png';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { toggleDevMenuEnabled } from '../../../redux/SettingsSlice';
import { logEvent } from '../../Analytics';

const TAP_COUNT_REQUIRED = 10;
const TAP_RESET_TIMEOUT = 2000;

const RotatingIcon: React.FunctionComponent = () => {
    const dispatch = useAppDispatch();
    const tapCountRef = useRef(0);
    const resetTimerRef = useRef<ReturnType<typeof setTimeout>>();

    const installId = useAppSelector(state => state.settings.installId);

    const rotation = useSharedValue(0);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            transform: [
                { rotate: rotation.value + 'deg' },
            ],
        };
    });

    const handleTap = () => {
        tapCountRef.current += 1;

        if (resetTimerRef.current) {
            clearTimeout(resetTimerRef.current);
        }

        if (tapCountRef.current >= TAP_COUNT_REQUIRED) {
            tapCountRef.current = 0;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            dispatch(toggleDevMenuEnabled());
            logEvent('dev_menu', {
                installId,
            });
            rotation.value = withTiming(rotation.value + 360, { duration: 1000, easing: Easing.elastic(1) });
        } else {
            resetTimerRef.current = setTimeout(() => {
                tapCountRef.current = 0;
            }, TAP_RESET_TIMEOUT);
        }
    };

    return <TouchableOpacity testID="app-icon"
        onPress={handleTap}>
        <Animated.View style={[animatedStyles]}>
            <Image source={icon}
                contentFit='contain'
                style={{
                    alignSelf: 'center',
                    height: 100,
                    width: 100,
                    margin: 20,
                    borderRadius: 20,
                }}
            />
        </Animated.View>
    </TouchableOpacity>;
};

export default RotatingIcon;
