import React from 'react';

import { Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { setInteractionType } from '../../../redux/SettingsSlice';
import BigButton from '../BigButtons/BigButton';
import SlideGestureIcon from '../Buttons/SlideGestureIcon';
import TapGestureIcon from '../Buttons/TapGestureIcon';

import { InteractionType } from './InteractionType';

interface InteractionSelectorProps {
    // define your props here
}

const InteractionSelector: React.FunctionComponent<InteractionSelectorProps> = () => {
    const dispatch = useAppDispatch();

    const interactionType = useAppSelector(state => state.settings.interactionType);

    const description = (() => {
        switch (interactionType) {
            case InteractionType.HalfTap:
                return "Tap the top or bottom of each player's tile.";
            case InteractionType.SlideVertical:
                return "Slide the player's tile up or down.";
        }
    })();

    return (
        <>
            <Text style={{ color: 'white', fontSize: 20 }}>Point Gesture</Text>
            <View style={{
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'space-around',
                padding: 10,
            }}>
                <View>
                    <BigButton
                        onPress={() => {
                            dispatch(setInteractionType(InteractionType.HalfTap));
                        }}
                        text="Tap"
                        icon={<TapGestureIcon color={interactionType === InteractionType.HalfTap ? "white" : "grey"} size={40} />}
                        color={interactionType == InteractionType.HalfTap ? "white" : "grey"}
                    />
                </View>
                <View>
                    <BigButton
                        onPress={() => {
                            dispatch(setInteractionType(InteractionType.SlideVertical));
                        }}
                        text="Slide"
                        icon={<SlideGestureIcon color={interactionType === InteractionType.SlideVertical ? "white" : "grey"} size={40} />}
                        color={interactionType == InteractionType.SlideVertical ? "white" : "grey"}
                    />
                </View>
            </View>
            <View style={{ paddingBottom: 25 }}>
                <Text style={{ color: 'white' }}>{description}</Text>
            </View>
        </>
    );
};

export default InteractionSelector;
