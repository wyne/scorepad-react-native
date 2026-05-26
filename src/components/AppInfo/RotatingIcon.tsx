import React, { useRef } from 'react';

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { TouchableWithoutFeedback } from 'react-native';
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

const RotatingIcon: React.FunctionComponent = () => {
    const dispatch = useAppDispatch();

    const installId = useAppSelector(state => state.settings.installId);

    const rotation = useSharedValue(0);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            transform: [
                { rotate: rotation.value + 'deg' },
            ],
        };
    });

    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

    const clearAllTimers = () => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
    };

    const scheduleTimer = (fn: () => void, delay: number) => {
        const id = setTimeout(fn, delay);
        timers.current.push(id);
    };

    const onPressIn = () => {
        scheduleTimer(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 1000);
        scheduleTimer(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 2000);
        scheduleTimer(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 3000);
        scheduleTimer(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 4000);
        scheduleTimer(() => {
            dispatch(toggleDevMenuEnabled());
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            logEvent('dev_menu', {
                installId,
            });
            rotation.value = withTiming(rotation.value + 360, { duration: 1000, easing: Easing.elastic(1) });
        }, 5000);
    };

    const onPressOut = () => {
        clearAllTimers();
    };

    return <TouchableWithoutFeedback
        onPressIn={onPressIn}
        onPressOut={onPressOut}>
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
    </TouchableWithoutFeedback>;
};

export default RotatingIcon;
