import * as React from 'react';

import { View } from 'react-native';
import Svg, { Polyline, Rect } from 'react-native-svg';

import { systemBlue } from '../../constants';

export default function SlideGestureIcon() {
    return (
        <View style={{ paddingHorizontal: 2 }}>
            <Svg height="20" width="18" viewBox="1 1 30 44">
                <Rect x="3" y="3" width="28" height="40" rx="7" ry="7" strokeWidth={4} stroke={systemBlue}></Rect>

                <Polyline fill="none" stroke={systemBlue} strokeWidth="3" strokeLinecap="round" stroke-linejoin="round"
                    points="9,18 17,10 25,18 " />

                <Polyline fill="none" stroke={systemBlue} strokeWidth="3" strokeLinecap="round" stroke-linejoin="round"
                    points="9,28 17,36 25,28 " />
            </Svg>
        </View>
    );
}
