import React from 'react';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useTheme } from '../../theme';

interface Props {
    onPress: () => void;
    icon: string | React.JSX.Element;
    text: string;
    color: string;
    animated?: boolean;
    style?: React.ComponentProps<typeof Animated.View>['style'];
    testID?: string;
}

const BigButton: React.FunctionComponent<Props> = ({ icon, text, color, onPress, animated = true, style, testID }) => {
    const theme = useTheme();
    const isDark = theme.background === '#000000';

    return (
        // `style` may be animated (e.g. collapsing the button), so it lives on an
        // outer view; the entering/exiting layout animations go on the inner one
        // so the two don't fight over opacity.
        <Animated.View style={style}>
            <Animated.View
                entering={animated ? FadeIn.delay(400) : undefined}
                exiting={FadeOut}
            >
                <TouchableOpacity activeOpacity={.5} onPress={onPress} testID={testID}>
                    <View style={[styles.bigButton, { backgroundColor: isDark ? 'rgba(0,0,0,.2)' : '#FFFFFF' }]}>
                        {typeof icon === 'string' ? (<Icon name={icon}
                            type="ionicon" size={30}
                            color={color}
                        />) : (
                            icon
                        )}
                        <Text style={{
                            color: color,
                            fontSize: 15,
                            paddingTop: 5,
                            textAlign: 'center',
                        }}>
                            {text}
                        </Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
};

export default BigButton;

const styles = StyleSheet.create({
    bigButton: {
        padding: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center'
    },
});
