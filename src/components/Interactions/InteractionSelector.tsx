import React from 'react';

import { Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { setInteractionType } from '../../../redux/SettingsSlice';
import { logEvent } from '../../Analytics';
import { useTheme } from '../../theme';
import BigButton from '../BigButtons/BigButton';
import RadialGestureIcon from '../Buttons/RadialGestureIcon';
import SwipeGestureIcon from '../Buttons/SwipeGestureIcon';
import TapGestureIcon from '../Buttons/TapGestureIcon';


import { InteractionType } from './InteractionType';

const InteractionSelector: React.FunctionComponent = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const interactionType = useAppSelector(state => state.settings.interactionType);
    const gameId = useAppSelector(state => state.settings.currentGameId);

    const description = (() => {
        switch (interactionType) {
            case InteractionType.HalfTap:
                return 'Tap the top or bottom of each player\'s tile.';
            case InteractionType.SwipeVertical:
                return 'Swipe up or down on the player\'s tile.';
            case InteractionType.RadialGesture:
                return 'Tap a player row to open the radial dial and set their score.';
        }
    })();

    return (
        <View style={{ flexDirection: 'column', alignItems: 'center', alignContent: 'flex-start' }}>
            <Text style={{ color: theme.text, fontSize: 20 }}>Point Gesture</Text>
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
                        icon={<TapGestureIcon color={interactionType === InteractionType.HalfTap ? theme.text : theme.textTertiary} size={40} />}
                        color={interactionType == InteractionType.HalfTap ? theme.text : theme.textTertiary}
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
                        icon={<SwipeGestureIcon color={interactionType === InteractionType.SwipeVertical ? theme.text : theme.textTertiary} size={40} />}
                        color={interactionType == InteractionType.SwipeVertical ? theme.text : theme.textTertiary}
                    />
                </View>
                <View>
                    <BigButton
                        animated={false}
                        onPress={() => {
                            dispatch(setInteractionType(InteractionType.RadialGesture));
                            logEvent('interaction_type', {
                                interactionType: 'radial_gesture',
                                gameId,
                            });
                        }}
                        text="Dial"
                        icon={<RadialGestureIcon color={interactionType === InteractionType.RadialGesture ? theme.text : theme.textTertiary} size={40} />}
                        color={interactionType == InteractionType.RadialGesture ? theme.text : theme.textTertiary}
                    />
                </View>
            </View>

            <View style={{ paddingBottom: 25 }}>
                <Text style={{ color: theme.text }}>{description}</Text>
            </View>
        </View>
    );
};

export default InteractionSelector;
