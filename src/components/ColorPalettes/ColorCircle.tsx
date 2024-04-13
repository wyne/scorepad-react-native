import React from 'react';

import { View } from 'react-native';

interface Props {
    colors: string[];
}

const ColorCircle: React.FunctionComponent<Props> = ({ colors }) => {
    const width = 50 / colors.length;

    return (
        <View style={{
            width: 40, height: 40, borderRadius: 0, overflow: 'hidden',
            transform: [{ rotate: '45deg' }]
        }}>
            {colors.map((color, index) => (
                <View
                    key={index}
                    style={{
                        backgroundColor: color,
                        width: width,
                        height: '100%',
                        position: 'absolute',
                        transform: [
                            { rotate: `${Math.floor(Math.random() * 10) + 1}deg` },
                            // { rotate: `${sectorDegree}deg` },
                            { translateX: index * width },
                            // { rotate: `${90 - sectorDegree / 2}deg` },
                        ],
                    }}
                />
            ))}
        </View>
    );
};

export default ColorCircle;
