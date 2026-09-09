import React from 'react';

import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

import { useTheme } from '../theme';

interface Props {
    children: React.ReactNode;
    /**
     * Horizontal inset, matched to the content the label sits above so the two
     * line up. Relative to the label's own parent, not the screen — inside a
     * container that already insets its children, pass only the remainder.
     *
     * Defaults to the app's 20pt gutter.
     */
    inset?: number;
    style?: StyleProp<TextStyle>;
}

/**
 * The single section and field label used across the app.
 *
 * Sentence case rather than the uppercase some screens used before: SwiftUI's
 * own list headers dropped uppercase, and it reads badly on field labels
 * ("PLAYER ONE NAME"). Secondary colour keeps the label below the content it
 * introduces in the hierarchy — one screen had these in the primary colour,
 * which made the header louder than the thing it labelled.
 */
const SectionLabel: React.FunctionComponent<Props> = ({ children, inset = 20, style }) => {
    const theme = useTheme();

    return (
        <Text
            accessibilityRole="header"
            style={[styles.label, { color: theme.textSecondary, marginHorizontal: inset }, style]}
        >
            {children}
        </Text>
    );
};

const styles = StyleSheet.create({
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 6,
    },
});

export default SectionLabel;
