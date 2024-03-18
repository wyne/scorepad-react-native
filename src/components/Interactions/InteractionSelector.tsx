import React from 'react';

import { Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { setInteractionType } from '../../../redux/SettingsSlice';
import BigButton from '../BigButtons/BigButton';

import { InteractionType } from './InteractionType';

interface InteractionSelectorProps {
    // define your props here
}

const InteractionSelector: React.FunctionComponent<InteractionSelectorProps> = () => {
    const dispatch = useAppDispatch();

    const interactionType = useAppSelector(state => state.settings.interactionType);

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
                    <BigButton
                        onPress={() => {
                            dispatch(setInteractionType(InteractionType.HalfTap));
                        }}
                        text="Tap"
                        icon='add'
                        color={interactionType == InteractionType.HalfTap ? "white" : "grey"}
                    />
                </View>
                <View>
                    <BigButton
                        onPress={() => {
                            dispatch(setInteractionType(InteractionType.SlideVertical));
                        }}
                        text="Slide"
                        icon='arrow-up'
                        color={interactionType == InteractionType.SlideVertical ? "white" : "grey"}
                    />
                </View>
            </View>
        </>
    );
};

export default InteractionSelector;
