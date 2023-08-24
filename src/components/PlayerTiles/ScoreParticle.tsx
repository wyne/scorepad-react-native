import React from 'react';
import { Text } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { DimensionValue } from 'react-native';

export const ScoreParticle: React.FunctionComponent = React.memo(({ id, value }) => {
    const randomTop: DimensionValue = `${Math.floor(Math.random() * 30 + 0)}%`;
    const randomLeft: DimensionValue = `${Math.floor(Math.random() * 70 + 10)}%`;
    const randomRotation: string = `${Math.floor(Math.random() * 30) - 15}deg`;
    let color = 'white';

    return <Animated.View exiting={FadeOut.withInitialValues({ opacity: 0.7 })}
        style={{
            position: 'absolute',
            top: randomTop,
            left: randomLeft,
            transform: [{ rotate: randomRotation }],
            backgroundColor: color,
            opacity: 0.7,
            borderRadius: 100,
            borderWidth: 2,
            borderColor: 'black',
            padding: 5,
        }}
    >
        <Text style={{
            color: 'black', fontSize: 30, fontWeight: 'bold'
        }}>{value}</Text>
    </Animated.View>;
});
