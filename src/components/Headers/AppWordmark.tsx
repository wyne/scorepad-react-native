import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';

const AppWordmark: React.FC = () => {
    const theme = useTheme();
    return (
        <View style={styles.row}>
            <Image
                source={require('../../../assets/icon.png')}
                style={styles.icon}
                resizeMode="cover"
            />
            <View style={styles.lockup}>
                <Text style={[styles.name, { color: theme.headerText }]}>Scorepad</Text>
                <Text style={styles.sub}>with rounds</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
    },
    icon: {
        width: 28,
        height: 28,
        borderRadius: 7,
    },
    lockup: {
        flexDirection: 'column',
        gap: 2,
    },
    name: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: -0.2,
        lineHeight: 18,
    },
    sub: {
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 1.6,
        textTransform: 'uppercase',
        color: '#F5C800',
        lineHeight: 10,
    },
});

export default AppWordmark;
