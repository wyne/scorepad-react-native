import React from 'react';

import { View } from 'react-native';

interface Props {
    colors: string[];
    selected?: boolean;
}

const PalettePreview: React.FunctionComponent<Props> = ({ colors, selected }) => {
    const numColumns = Math.ceil(Math.sqrt(colors.length));
    const numRows = Math.ceil(colors.length / numColumns);

    return (
        <View style={{
            width: 40, height: 40,
            flexDirection: 'row',
            flexWrap: 'wrap',
            borderColor: selected ? 'white' : 'transparent',
            borderWidth: 1,
            borderRadius: 3,
            padding: 1,
        }}>
            {colors.map((color, index) => (
                <View
                    key={index}
                    style={{
                        width: `${100 / numColumns}%`,
                        height: `${100 / numRows}%`,
                        flexGrow: 1,
                        padding: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <View style={{
                        position: 'absolute',
                        borderRadius: 3,
                        width: '100%',
                        height: '100%',
                        backgroundColor: color,
                    }} />
                </View>

            ))}
        </View>
    );
};

export default PalettePreview;
