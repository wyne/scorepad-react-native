import React from 'react';
import { Text } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { DimensionValue } from 'react-native';

type Props = {
    id: string;
    value: string;
};

export const ScoreParticle: React.FunctionComponent<Props> = React.memo(({ id, value }) => {
    const randomTop: DimensionValue = `${Math.floor(Math.random() * 10)}%`;
    const randomLeft: number = Math.floor(Math.random() * 100);
    const randomRotation: string = `${Math.floor(Math.random() * 30) - 15}deg`;

    let left: DimensionValue | undefined, right: DimensionValue | undefined;

    if (randomLeft > 50) {
        right = `${100 - randomLeft}%`;
        console.log(right);
    } else {
        left = `${randomLeft}%`;
    }

    return <Animated.View exiting={FadeOut.withInitialValues({ opacity: 0.7 })}
        key={id}
        style={{
            position: 'absolute',
            top: randomTop,
            left: left,
            right: right,
            transform: [{ rotate: randomRotation }],
            backgroundColor: 'white',
            opacity: 0.7,
            borderRadius: 100,
            borderWidth: 2,
            borderColor: 'black',
            padding: 5,
        }}
    >
        <Text style={{
            color: 'black', fontSize: 25, fontWeight: 'bold'
        }}>{value}</Text>
    </Animated.View>;
});
