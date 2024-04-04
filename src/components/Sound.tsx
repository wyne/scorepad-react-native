import { useEffect, useState } from 'react';

import { Audio } from 'expo-av';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { Button } from 'react-native-elements';

export default function Sound() {
    const [sound, setSound] = useState<Audio.Sound>();
    const [rate, setRate] = useState(1);

    async function playSound() {
        const { sound } = await Audio.Sound.createAsync(require('../../assets/sounds/200.wav'));
        setSound(sound);

        setRate(1);
        await sound.playAsync();
    }

    async function stopSound() {
        if (!sound) { return; }
        await sound.stopAsync();
    }

    async function increaseRate() {
        if (!sound) { return; }
        setRate(rate + 0.1);
        await sound.setRateAsync(rate, false);
    }

    useEffect(() => {
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    return (
        <View style={styles.container}>
            <TouchableWithoutFeedback onPressIn={playSound}>
                <View style={styles.button}>
                    <Text>Play Sound</Text>
                </View>
            </TouchableWithoutFeedback>
            <Button title="Increase Rate" onPress={increaseRate} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#ecf0f1',
        padding: 10,
    },
    button: {
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 5,
    },
});
