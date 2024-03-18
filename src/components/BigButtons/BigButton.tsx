import React from "react";

import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";

interface Props {
    onPress: () => void;
    icon: string | JSX.Element;
    text: string;
    color: string;
}

const BigButton: React.FunctionComponent<Props> = ({ icon, text, color, onPress }) => {
    return (
        <Animated.View layout={Layout.duration(400)} entering={FadeIn.delay(400)} exiting={FadeOut}>
            <TouchableOpacity activeOpacity={.5} onPress={onPress}>
                <View style={[styles.bigButton]}>
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
        width: 100,
        margin: 5,
        padding: 10,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,.2)',
        borderRadius: 10,
        alignItems: 'center'
    },
});
