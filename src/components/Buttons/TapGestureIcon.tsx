import * as React from 'react';

import { View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

import { systemBlue } from '../../constants';

export default function TapGestureIcon() {
    return (
        <View style={{ paddingHorizontal: 2 }}>
            <Svg height="20" width="18" viewBox="1 1 30 44">
                <Rect x="3" y="3" width="28" height="40" rx="7" ry="7" strokeWidth={4} stroke={systemBlue}></Rect>
                <Circle cx="17" cy="17" r="5" fill={systemBlue} />
                <Circle cx="17" cy="31" r="5" fill={systemBlue} />
            </Svg>
        </View>
    );
}
