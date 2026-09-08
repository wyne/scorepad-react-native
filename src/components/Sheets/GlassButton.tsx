import React from 'react';

import { GlassView } from 'expo-glass-effect';
import { Pressable, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';

import { LIQUID_GLASS } from '../../platform';
import { useTheme } from '../../theme';

/** Diameter of the capsule, and the standard iOS touch target. */
const SIZE = 44;

interface Props {
    onPress: () => void;
    accessibilityLabel: string;
    testID?: string;
    iconName: string;
    iconType: string;
    iconSize: number;
    iconColor: string;
    /**
     * Tint for a prominent action — a sheet's confirm button, say. Left off,
     * the button is plain glass and reads as the secondary control it is.
     */
    tintColor?: string;
}

/**
 * A round sheet-header button: a Liquid Glass capsule on iOS 26, a filled disc
 * anywhere else.
 *
 * Press feedback splits with the material. `isInteractive` hands it to UIKit,
 * which morphs the glass under the finger, while the flat disc keeps the
 * opacity dip a filled button expects.
 */
const GlassButton: React.FunctionComponent<Props> = ({
    onPress,
    accessibilityLabel,
    testID,
    iconName,
    iconType,
    iconSize,
    iconColor,
    tintColor,
}) => {
    const theme = useTheme();

    const icon = <Icon name={iconName} type={iconType} size={iconSize} color={iconColor} />;

    if (!LIQUID_GLASS) {
        return (
            <Pressable
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="button"
                onPress={onPress}
                style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: tintColor ?? theme.backgroundSecondary },
                    pressed && styles.pressed,
                ]}
                testID={testID}
            >
                {icon}
            </Pressable>
        );
    }

    return (
        <Pressable
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            onPress={onPress}
            testID={testID}
        >
            {/*
              * The glass is the shape, so the circle lives on the GlassView — a
              * `borderRadius` on the Pressable would leave the effect square.
              */}
            <GlassView isInteractive style={styles.button} tintColor={tintColor}>
                {icon}
            </GlassView>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressed: {
        opacity: 0.7,
    },
});

export default GlassButton;
