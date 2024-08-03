import React from 'react';

import { G, Path, Rect, Svg } from 'react-native-svg';

interface Props {
    fill?: string;
}

const RematchIcon: React.FC<Props> = ({ fill }) => {
    return (
        <Svg width="28.8184" height="30.1855" viewBox="-2 0 22 22" fill="none">
            <G>
                <Rect height="30.1855" opacity="0" width="28.8184" x="0" y="0" />
                <Path d="M18.457 13.9551C18.457 10.2246 15.9277 7.64648 11.4746 7.64648L4.91211 7.64648L1.88477 7.7832L2.06055 8.23242L4.47266 6.17188L7.29492 3.41797C7.44141 3.26172 7.5293 3.07617 7.5293 2.82227C7.5293 2.31445 7.1875 1.96289 6.66016 1.96289C6.45508 1.96289 6.20117 2.07031 6.03516 2.23633L0.292969 7.87109C0.0976562 8.05664 0 8.28125 0 8.52539C0 8.75977 0.0976562 8.98438 0.292969 9.16992L6.03516 14.8047C6.20117 14.9805 6.45508 15.0781 6.66016 15.0781C7.1875 15.0781 7.5293 14.7266 7.5293 14.2188C7.5293 13.9648 7.44141 13.7793 7.29492 13.623L4.47266 10.8789L2.06055 8.80859L1.88477 9.25781L4.91211 9.39453L11.6211 9.39453C14.9512 9.39453 16.709 11.2305 16.709 13.8574C16.709 16.4941 14.9512 18.4473 11.6211 18.4473L9.375 18.4473C8.83789 18.4473 8.48633 18.8379 8.48633 19.3164C8.48633 19.7949 8.83789 20.1855 9.375 20.1855L11.6309 20.1855C15.9961 20.1855 18.457 17.6953 18.457 13.9551Z" fill={fill} fill-opacity="0.85" />
            </G>
        </Svg>
    );
};

export default RematchIcon;
