import React from 'react';

import { MenuAction, MenuView } from '@react-native-menu/menu';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View, Text } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { toggleHomeFullscreen, setInteractionType, markFeatureNotificationSeen } from '../../../redux/SettingsSlice';
import { logEvent } from '../../Analytics';
import { FEATURE_DIAL_GESTURE } from '../../constants';
import { useTheme } from '../../theme';
import { InteractionType } from '../Interactions/InteractionType';
import { useMenuOpen } from '../MenuOpenContext';
import { useAddendModalContext } from '../Sheets/AddendModalContext';
import { useGameSheetContext } from '../Sheets/GameSheetContext';
import { useGestureInfoModalContext } from '../Sheets/GestureInfoModalContext';

const GameOptionsButton: React.FunctionComponent = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const { setMenuOpen } = useMenuOpen();

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const interactionType = useAppSelector(state => state.settings.interactionType);
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const installId = useAppSelector(state => state.settings.installId);
    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);
    const showDialDot = useAppSelector(state =>
        !state.settings.seenFeatureNotifications.includes(FEATURE_DIAL_GESTURE)
    );

    const addendModalRef = useAddendModalContext();
    const gameSheetRef = useGameSheetContext();
    const gestureInfoModalRef = useGestureInfoModalContext();

    if (currentGameId == null) return null;

    const isSwipe = interactionType === InteractionType.SwipeVertical;
    const isTap = interactionType === InteractionType.HalfTap;
    const isDial = interactionType === InteractionType.RadialGesture;

    const pointValuesSubtitle = isTap
        ? `Tap: ${addendOne} / Long: ${addendTwo}`
        : isDial
            ? `Drag: ${addendOne} / Hold: ${addendTwo}`
            : `Swipe: ${addendOne} / Hold: ${addendTwo}`;

    const menuActions: MenuAction[] = [
        {
            id: 'gestures',
            title: 'Point Gestures',
            displayInline: true,
            subactions: [
                {
                    id: 'swipe',
                    title: 'Swipe',
                    image: 'hand.draw',
                    imageColor: theme.text,
                    state: isSwipe ? 'on' : 'off',
                },
                {
                    id: 'tap',
                    title: 'Tap',
                    image: 'hand.point.up',
                    imageColor: theme.text,
                    state: isTap ? 'on' : 'off',
                },
                {
                    id: 'dial',
                    title: 'Dial',
                    subtitle: showDialDot ? 'New' : undefined,
                    image: 'dial.min',
                    imageColor: theme.text,
                    state: isDial ? 'on' : 'off',
                },
                {
                    id: 'about-gestures',
                    title: 'About Gestures',
                    image: 'info.circle',
                    imageColor: theme.text,
                },
            ],
        },
        {
            id: 'settings',
            title: 'Settings',
            displayInline: true,
            subactions: [
                {
                    id: 'point-values',
                    title: 'Point Values',
                    subtitle: pointValuesSubtitle,
                    image: 'plusminus',
                    imageColor: theme.text,
                },
                {
                    id: 'fullscreen',
                    title: 'Fullscreen',
                    image: fullscreen
                        ? 'arrow.down.right.and.arrow.up.left'
                        : 'arrow.up.left.and.arrow.down.right',
                    imageColor: theme.text,
                    state: fullscreen ? 'on' : 'off',
                },
            ],
        },
    ];

    const handleAction = (event: string) => {
        switch (event) {
            case 'swipe':
                dispatch(setInteractionType(InteractionType.SwipeVertical));
                logEvent('interaction_type', { interactionType: 'swipe_vertical', gameId: currentGameId });
                break;
            case 'tap':
                dispatch(setInteractionType(InteractionType.HalfTap));
                logEvent('interaction_type', { interactionType: 'half_tap', gameId: currentGameId });
                break;
            case 'dial':
                dispatch(setInteractionType(InteractionType.RadialGesture));
                logEvent('interaction_type', { interactionType: 'radial_gesture', gameId: currentGameId });
                break;
            case 'point-values':
                gameSheetRef?.current?.snapToIndex(0);
                addendModalRef?.current?.present();
                logEvent('addend_sheet', { installId });
                break;
            case 'fullscreen':
                dispatch(toggleHomeFullscreen());
                logEvent('fullscreen', { fullscreen: !fullscreen });
                break;
            case 'about-gestures':
                gestureInfoModalRef?.current?.present();
                logEvent('about_gestures');
                break;
        }
    };

    return (
        <MenuView
            actions={menuActions}
            onOpenMenu={() => setMenuOpen(true)}
            onCloseMenu={() => {
                setMenuOpen(false);
                if (showDialDot) dispatch(markFeatureNotificationSeen(FEATURE_DIAL_GESTURE));
            }}
            onPressAction={({ nativeEvent }) => {
                handleAction(nativeEvent.event);
                setMenuOpen(false);
            }}
            testID="game-options-menu"
        >
            <View style={styles.button}>
                <View style={styles.content}>
                    <View style={styles.addendColumn}>
                        <Text style={[styles.addendText, { color: theme.text }]}>{addendOne}</Text>
                        <Text style={[styles.addendText, { color: theme.text }]}>{addendTwo}</Text>
                    </View>
                    <View>
                        <SymbolView
                            name={isDial ? 'dial.min' : isSwipe ? 'hand.draw' : 'hand.point.up'}
                            size={30}
                            tintColor={theme.text}
                        />
                        {showDialDot && (
                            <View testID="dial-notification-dot" style={{
                                position: 'absolute',
                                top: -2,
                                right: -4,
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: theme.warning,
                                borderWidth: 1,
                                borderColor: theme.backgroundSecondary,
                            }} />
                        )}
                    </View>
                </View>
            </View>
        </MenuView>
    );
};

const styles = StyleSheet.create({
    button: {
        padding: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addendColumn: {
        marginRight: 4,
    },
    addendText: {
        fontSize: 10,
        lineHeight: 11,
        textAlign: 'center',
    },
});

export default GameOptionsButton;
