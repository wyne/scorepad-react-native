import React from 'react';

import { Platform, Pressable, StyleSheet } from 'react-native';

interface Props {
    children: React.ReactNode;
    accessibilityLabel: string;
    onPress: () => void;
}

const HeaderButton: React.FunctionComponent<Props> = (props) => {
    return (
        <Pressable
            accessibilityRole='button'
            {...props}
            android_ripple={{ borderless: true }}
            style={({ pressed }) => [
                styles.headerButton,
                Platform.OS === 'android' && styles.androidHeaderButton,
                Platform.OS === 'ios' && pressed && styles.iosPressed,
            ]}
        >
            {props.children}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    headerButton: {
        fontSize: 20,
        padding: 10,
        paddingHorizontal: 15,
    },
    androidHeaderButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        paddingHorizontal: 0,
    },
    iosPressed: {
        opacity: 0.45,
    },
});

export default HeaderButton;
