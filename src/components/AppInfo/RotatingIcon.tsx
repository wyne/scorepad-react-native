import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { Image } from 'expo-image';
import analytics from '@react-native-firebase/analytics';

import Animated, {
    Easing,
    PinwheelIn,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

const RotatingIcon: React.FunctionComponent = ({ }) => {
    const rotation = useSharedValue(0);
    const rotationCount = useSharedValue(1);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            transform: [
                { rotate: rotation.value + 'deg' },
            ],
        };
    });

    return <TouchableWithoutFeedback onPress={async () => {
        rotationCount.value = rotationCount.value + 1;
        rotation.value = withTiming((rotationCount.value * 90), { duration: 1000, easing: Easing.elastic(1) });

        await analytics().logEvent('app_icon');
    }}>
        <Animated.View style={[animatedStyles]} entering={PinwheelIn.delay(0).duration(2000).easing(Easing.elastic(1))}>
            <Image source={require('../../../assets/icon.png')}
                contentFit='contain'
                style={{
                    alignSelf: 'center',
                    height: 100,
                    width: 100,
                    margin: 10,
                    borderRadius: 20,
                }}
            />
        </Animated.View>
    </TouchableWithoutFeedback>
}

export default RotatingIcon;