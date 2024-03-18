import * as React from 'react';

import { View } from 'react-native';
import Svg, { Polyline, Rect } from 'react-native-svg';

import { systemBlue } from '../../constants';

export default function TapGestureIcon() {
    return (
        <View style={{ paddingHorizontal: 2 }}>
            <Svg height="20" width="18" viewBox="1 1 30 44">
                <Rect x="3" y="3" width="28" height="40" rx="7" ry="7" strokeWidth={4} stroke={systemBlue}></Rect>

                <Polyline fill="none" stroke={systemBlue} strokeWidth="3" strokeLinecap="round" stroke-linejoin="round"
                    points="9,16 17,8 25,16 " />

                <Polyline fill="none" stroke={systemBlue} strokeWidth="3" strokeLinecap="round" stroke-linejoin="round"
                    points="17,8 17,38 " />

                <Polyline fill="none" stroke={systemBlue} strokeWidth="3" strokeLinecap="round" stroke-linejoin="round"
                    points="9,30 17,38 25,30 " />
            </Svg>
        </View>
    );
}
