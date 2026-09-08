import React from 'react';

import { StyleProp, TextInput, TextInputProps, TextStyle } from 'react-native';
import Animated, { AnimatedStyle, SharedValue, useAnimatedProps } from 'react-native-reanimated';

type AnimatedTextInputProps = TextInputProps & { text?: string };

const AnimatedTextInput = Animated.createAnimatedComponent(
    TextInput as React.ComponentType<AnimatedTextInputProps>
);

interface Props extends Omit<TextInputProps, 'editable' | 'style' | 'value'> {
    style?: StyleProp<AnimatedStyle<TextStyle>>;
    text: SharedValue<string>;
}

const AnimatedScoreText: React.FC<Props> = ({ text, ...props }) => {
    const animatedProps = useAnimatedProps(() => ({
        text: text.value,
    }));

    return (
        <AnimatedTextInput
            {...props}
            animatedProps={animatedProps}
            defaultValue={text.value}
            editable={false}
            caretHidden={true}
            underlineColorAndroid="transparent"
        />
    );
};

export default AnimatedScoreText;
