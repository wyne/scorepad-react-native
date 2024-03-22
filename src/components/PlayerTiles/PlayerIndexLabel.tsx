import React from 'react';

import { Text, View } from 'react-native';

interface PlayerIndexLabelProps {
    index: number;
    fontColor: string;
    enabled: boolean;
}

const PlayerIndexLabel: React.FC<PlayerIndexLabelProps> = ({ index, fontColor, enabled }) => {
    if (!enabled) return null;

    return (
        <View style={{ position: 'absolute', bottom: 3, left: 5 }}>
            <Text style={{ color: fontColor + '80', fontSize: 12 }}>
                {index + 1}
            </Text>
        </View>
    );
};

export default PlayerIndexLabel;
