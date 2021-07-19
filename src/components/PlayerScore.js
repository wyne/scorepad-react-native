import React, { Component, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';

function PlayerScore({ name, color, round, totalScore, roundScore, onScoreChange }) {
    return (
        <View style={{ flexGrow: 1, justifyContent: 'center', alignContent: 'stretch', backgroundColor: '#' + color }}>
            <Text style={[styles.name]}>
                {name}
            </Text>
            <View>
                <Text style={styles.score}>{totalScore}</Text>
                <View style={{
                    padding: 5,
                    borderRadius: 5,
                    borderWidth: 2,
                    borderColor: 'white',
                    alignSelf: 'center',
                    opacity: 0.7,
                }}>
                    <Text style={[styles.score, styles.roundScore]}>{roundScore}</Text>
                    <Text style={[styles.label, styles.roundLabel]}>Round {round + 1}</Text>
                </View>
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
        fontSize: 90,
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'white',
        fontVariant: ['tabular-nums'],
    },
    roundScore: {
        opacity: .7,
        fontSize: 40,
        margin: 0,
        marginTop: 0,
        padding: 0,
    },
    label: {
        textAlign: 'center',
        color: 'white',
    },
    roundLabel: {
        opacity: .7,
        fontVariant: ['tabular-nums'],
    },
});

export default PlayerScore;