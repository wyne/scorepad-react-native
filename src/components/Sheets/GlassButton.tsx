import React from 'react';

import { BlurView } from 'expo-blur';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';

interface Props {
    onPress: () => void;
    accessibilityLabel: string;
    testID?: string;
    iconName: string;
    iconType: string;
    iconSize: number;
    iconColor: string;
    blue?: boolean;
}

const GlassButton: React.FunctionComponent<Props> = ({
    onPress,
    accessibilityLabel,
    testID,
    iconName,
    iconType,
    iconSize,
    iconColor,
    blue = false,
}) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.button, blue && styles.buttonBlue]}
            activeOpacity={0.7}
            accessibilityLabel={accessibilityLabel}
            testID={testID}
        >
            <BlurView
                intensity={60}
                tint="systemUltraThinMaterial"
                style={styles.absoluteFill}
            />
            {blue && <View style={[styles.absoluteFill, styles.blueOverlay]} />}
            <Icon name={iconName} type={iconType} size={iconSize} color={iconColor} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    buttonBlue: {
        borderColor: 'rgba(0, 122, 255, 0.4)',
    },
    absoluteFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    blueOverlay: {
        backgroundColor: 'rgba(0, 122, 255, 0.2)',
    },
});

export default GlassButton;
