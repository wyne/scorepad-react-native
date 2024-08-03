import React from 'react';

import { Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { setInteractionType } from '../../../redux/SettingsSlice';
import { logEvent } from '../../Analytics';
import BigButton from '../BigButtons/BigButton';
import SwipeGestureIcon from '../Buttons/SwipeGestureIcon';
import TapGestureIcon from '../Buttons/TapGestureIcon';

import { InteractionType } from './InteractionType';

interface InteractionSelectorProps {
    // define your props here
}

const InteractionSelector: React.FunctionComponent<InteractionSelectorProps> = () => {
    const dispatch = useAppDispatch();

    const interactionType = useAppSelector(state => state.settings.interactionType);
    const gameId = useAppSelector(state => state.settings.currentGameId);

    const description = (() => {
        switch (interactionType) {
            case InteractionType.HalfTap:
                return 'Tap the top or bottom of each player\'s tile.';
            case InteractionType.SwipeVertical:
                return 'Swipe up or down on the player\'s tile.';
        }
    })();

    return (
        <View style={{ flexDirection: 'column', alignItems: 'center', alignContent: 'flex-start' }}>
            <Text style={{ color: 'white', fontSize: 20 }}>Point Gesture</Text>
            <View style={{ flexDirection: 'row', padding: 10, }}>
                <View>
                    <BigButton
                        animated={false}
                        onPress={() => {
                            dispatch(setInteractionType(InteractionType.HalfTap));
                            logEvent('interaction_type', {
                                interactionType: 'half_tap',
                                gameId,
                            });
                        }}
                        text="Tap"
                        icon={<TapGestureIcon color={interactionType === InteractionType.HalfTap ? 'white' : 'grey'} size={40} />}
                        color={interactionType == InteractionType.HalfTap ? 'white' : 'grey'}
                    />
                </View>
                <View>
                    <BigButton
                        animated={false}
                        onPress={() => {
                            dispatch(setInteractionType(InteractionType.SwipeVertical));
                            logEvent('interaction_type', {
                                interactionType: 'swipe_vertical',
                                gameId,
                            });
                        }}
                        text="Swipe"
                        icon={<SwipeGestureIcon color={interactionType === InteractionType.SwipeVertical ? 'white' : 'grey'} size={40} />}
                        color={interactionType == InteractionType.SwipeVertical ? 'white' : 'grey'}
                    />
                </View>
            </View>

            <View style={{ paddingBottom: 25 }}>
                <Text style={{ color: 'white' }}>{description}</Text>
            </View>
        </View>
    );
};

export default InteractionSelector;
