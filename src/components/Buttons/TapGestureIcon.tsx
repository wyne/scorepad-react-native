import * as React from 'react';

import { View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

import { systemBlue } from '../../constants';

interface TapGestureIconProps {
    color?: string;
    size?: number;
}

const TapGestureIcon: React.FunctionComponent<TapGestureIconProps> = ({
    color = systemBlue,
    size = 20,
}) => {
    return (
        <View style={{ paddingHorizontal: 2 }}>
            <Svg height={size} width={size} viewBox="1 1 30 44">
                <Rect x="3" y="3" width="28" height="40" rx="7" ry="7" strokeWidth={4} stroke={color}></Rect>
                <Circle cx="17" cy="17" r="5" fill={color} />
                <Circle cx="17" cy="31" r="5" fill={color} />
            </Svg>
        </View>
    );
};

export default TapGestureIcon;
