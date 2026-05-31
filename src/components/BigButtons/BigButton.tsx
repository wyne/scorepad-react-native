import React from 'react';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

import { useTheme } from '../../theme';

interface Props {
    onPress: () => void;
    icon: string | JSX.Element;
    text: string;
    color: string;
    animated?: boolean;
    testID?: string;
}

const BigButton: React.FunctionComponent<Props> = ({ icon, text, color, onPress, animated = true, testID }) => {
    const theme = useTheme();
    const isDark = theme.background === '#000000';

    return (
        <Animated.View layout={Layout.duration(400)} entering={animated ? FadeIn.delay(400) : undefined} exiting={FadeOut}>
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
    );
};

export default BigButton;

const styles = StyleSheet.create({
    bigButton: {
        width: 130,
        margin: 5,
        padding: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center'
    },
});
