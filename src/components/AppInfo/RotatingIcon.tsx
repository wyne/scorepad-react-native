import React from 'react';

import analytics from '@react-native-firebase/analytics';
import { Image } from 'expo-image';
import { TouchableWithoutFeedback } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

import { useAppDispatch } from '../../../redux/hooks';
import { toggleDevMenuEnabled } from '../../../redux/SettingsSlice';

const RotatingIcon: React.FunctionComponent = ({ }) => {
    const dispatch = useAppDispatch();

    const rotation = useSharedValue(0);
    const rotationCount = useSharedValue(1);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            transform: [
                { rotate: rotation.value + 'deg' },
            ],
        };
    });

    let holdCallback: NodeJS.Timeout;
    const onPressIn = () => {
        holdCallback = setTimeout(() => {
            dispatch(toggleDevMenuEnabled());
            // spring expand animate the Animated.View
        }, 5000);
    };

    const onPressOut = () => {
        if (holdCallback == null) return;
        clearTimeout(holdCallback);
    };

    return <TouchableWithoutFeedback
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={async () => {
            rotationCount.value = rotationCount.value + 1;
            rotation.value = withTiming((rotationCount.value * 90), { duration: 1000, easing: Easing.elastic(1) });

            await analytics().logEvent('app_icon');
        }}>
        <Animated.View style={[animatedStyles]}>
            <Image source={require('../../../assets/icon.png')}
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
