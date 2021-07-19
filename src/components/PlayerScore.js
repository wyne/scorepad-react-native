import React, { Component, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';

function PlayerScore({ name, color, round, totalScore, roundScore, onScoreChange }) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#' + color }}>
            <Text style={[styles.name]}>
                {name}
            </Text>
            <View>
                <Text style={styles.score}>{totalScore}</Text>
                <Text style={styles.label}>Total</Text>
                <Text style={[styles.score, styles.roundScore]}>{roundScore}</Text>
                <Text style={[styles.label, styles.roundLabel]}>Round {round + 1}</Text>
            </View>

            <TouchableOpacity style={[styles.surface, styles.surfaceAdd]}
                onPress={() => {
                    onScoreChange(name, round, roundScore + 1);
                }}
            />
            <TouchableOpacity style={[styles.surface, styles.surfaceSubtract]}
                onPress={() => {
                    onScoreChange(name, round, roundScore - 1);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    surface: {
        position: 'absolute',
        width: '100%',
    },
    surfaceAdd: {
        top: 0,
        bottom: '50%',
    },
    surfaceSubtract: {
        top: '50%',
        bottom: 0,
    },
    name: {
        color: 'white',
        fontSize: 50,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    score: {
        margin: 2,
        marginTop: 15,
        fontSize: 60,
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'white',
    },
    roundScore: {
        opacity: .7,
        fontSize: 40,
    },
    label: {
        textAlign: 'center',
        color: 'white',
    },
    roundLabel: {
        opacity: .7,
    },
});

export default PlayerScore;