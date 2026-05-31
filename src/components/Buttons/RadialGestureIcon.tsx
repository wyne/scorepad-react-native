import * as React from 'react';

import { View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { systemBlue } from '../../constants';

interface Props {
    color?: string;
    size?: number;
}

const RadialGestureIcon: React.FunctionComponent<Props> = ({
    color = systemBlue,
    size = 20,
}) => {
    const C = 22;
    const R = 15;
    const SW = 3.5;
    // Handle at ~45° (top-right)
    const angle = 45 * Math.PI / 180;
    const hx = C + R * Math.sin(angle);
    const hy = C - R * Math.cos(angle);

    return (
        <View style={{ paddingHorizontal: 2 }}>
            <Svg height={size} width={size} viewBox="0 0 44 44">
                {/* Track ring */}
                <Circle cx={C} cy={C} r={R} fill="none" stroke={color} strokeWidth={SW} strokeOpacity={0.35} />
                {/* Handle dot */}
                <Circle cx={hx} cy={hy} r={5.5} fill={color} />
                {/* Center pip */}
                <Circle cx={C} cy={C} r={3} fill={color} fillOpacity={0.5} />
                {/* Tick at top */}
                <Line x1={C} y1={C - R + SW} x2={C} y2={C - R + SW + 5}
                    stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeOpacity={0.5} />
            </Svg>
        </View>
    );
};

export default RadialGestureIcon;
