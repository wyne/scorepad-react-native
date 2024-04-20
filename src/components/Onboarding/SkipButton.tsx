import React, { useEffect } from 'react';

import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

type Props = {
    visible: boolean;
    onPress: () => void;
};

const SkipButton: React.FunctionComponent<Props> = ({ visible, onPress }) => {
    const skipButtonOpacity = useSharedValue(1);

    useEffect(() => {
        skipButtonOpacity.value = withTiming(visible ? 1 : 0, { duration: 250 });
    }, [visible]);

    const skipButtonStyles = useAnimatedStyle(() => {
        return {
            opacity: skipButtonOpacity.value,
        };
    });

    return (
        <View pointerEvents='box-none' style={[StyleSheet.absoluteFill]}>
            <Animated.View pointerEvents='box-none'
                style={[{ alignItems: 'flex-end' }, skipButtonStyles]}
            >
                <TouchableOpacity style={{ padding: 10 }} onPress={onPress}>
                    <View style={styles.button}>
                        <Text style={{ fontSize: 20, color: '#fff', }}>
                            Skip
                        </Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

export default SkipButton;

const styles = StyleSheet.create({
    button: {
        padding: 10,
        margin: 10,
        borderRadius: 20,
        borderColor: '#fff',
        backgroundColor: 'rgba(255, 255, 255, .2)',
    }
});
