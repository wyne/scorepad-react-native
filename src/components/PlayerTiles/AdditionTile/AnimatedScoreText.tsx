import React from 'react';

import { TextInput, TextInputProps } from 'react-native';
import Animated, { SharedValue, useAnimatedProps } from 'react-native-reanimated';

type AnimatedTextInputProps = TextInputProps & { text?: string };

const AnimatedTextInput = Animated.createAnimatedComponent(
    TextInput as React.ComponentType<AnimatedTextInputProps>
);

interface Props extends Omit<TextInputProps, 'editable' | 'value'> {
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
