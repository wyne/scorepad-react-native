import React from 'react';

import { Text, View } from 'react-native';

import BigButton from '../BigButtons/BigButton';

interface InteractionSelectorProps {
    // define your props here
}

const InteractionSelector: React.FC<InteractionSelectorProps> = (props) => {
    return (
        <>
            <Text style={{ color: 'white', fontSize: 20 }}>Gesture</Text>
            <View style={{
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'space-around',
                padding: 10,
            }}>
                <View>
                    <Text style={{ color: 'white', textAlign: 'center' }}>Tap</Text>
                    <BigButton
                        onPress={() => { }}
                        text="Tap"
                        icon='add'
                        color="green"
                    />
                </View>
                <View>
                    <Text style={{ color: 'white', textAlign: 'center' }}>Slide</Text>
                    <BigButton
                        onPress={() => { }}
                        text="Slide"
                        icon='arrow-up'
                        color="green"
                    />
                </View>
            </View>
        </>
    );
};

export default InteractionSelector;
