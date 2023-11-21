import React from 'react';

import { Text , DimensionValue } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

type Props = {
    id: string;
    value: string;
};

export const ScoreParticle: React.FunctionComponent<Props> = React.memo(({ id, value }) => {
    const randomRotation: string = `${Math.floor(Math.random() * 30) - 15}deg`;
    const randomTop = Math.floor(Math.random() * 10);
    const randomLeft = Math.floor(Math.random() * 100);

    let left: DimensionValue | undefined, right: DimensionValue | undefined;
    let top: DimensionValue | undefined, bottom: DimensionValue | undefined;

    if (value.indexOf('-') > -1) {
        bottom = `${randomTop}%`;
    } else {
        top = `${randomTop}%`;
    }

    if (randomLeft > 50) {
        right = `${100 - randomLeft}%`;
    } else {
        left = `${randomLeft}%`;
    }

    return <Animated.View exiting={FadeOut.withInitialValues({ opacity: 0.7 })}
        key={id}
        style={{
            position: 'absolute',
            top: top,
            bottom: bottom,
            left: left,
            right: right,
            transform: [{ rotate: randomRotation }],
            backgroundColor: 'white',
            opacity: 0.7,
            borderRadius: 100,
            borderWidth: 2,
            borderColor: 'black',
            padding: 8,
        }}
    >
        <Text style={{
            color: 'black',
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center',
            fontVariant: ['tabular-nums'],
        }}>{value}</Text>
    </Animated.View>;
});
