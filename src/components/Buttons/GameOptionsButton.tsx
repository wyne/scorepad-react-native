import React, { useLayoutEffect, useMemo, useRef } from 'react';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MenuAction, MenuView } from '@react-native-menu/menu';
import type { NativeStackHeaderItem, NativeStackHeaderItemMenuAction } from '@react-navigation/native-stack';
import { type SFSymbol, SymbolView } from 'expo-symbols';
import { StyleSheet, View, Text, Platform } from 'react-native';

import { setGameInteractionType } from '../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { selectInteractionType } from '../../../redux/selectors';
import { toggleHomeFullscreen, setInteractionType, markFeatureNotificationSeen } from '../../../redux/SettingsSlice';
import { logEvent } from '../../Analytics';
import { FEATURE_DIAL_GESTURE } from '../../constants';
import { useTheme } from '../../theme';
import { InteractionType } from '../Interactions/InteractionType';
import { useMenuOpen } from '../MenuOpenContext';
import { useGameSheetContext } from '../Sheets/GameSheetContext';
import { useGestureInfoSheetContext } from '../Sheets/GestureInfoSheetContext';
import { usePointValuesSheetContext } from '../Sheets/PointValuesSheetContext';

type GameOptionAction = {
    id: string;
    title: string;
    subtitle?: string;
    image: SFSymbol;
    state?: 'on' | 'off';
};

/**
 * Shared state and handlers for the game options menu. Rendered as a React
 * `MenuView` on Android, and as a native `UIBarButtonItem` menu on iOS so the
 * system can move it into the vertical bar on iPhone Duo.
 */
const useGameOptions = () => {
    const dispatch = useAppDispatch();

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const interactionType = useAppSelector(state => selectInteractionType(state, currentGameId));
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const installId = useAppSelector(state => state.settings.installId);
    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);
    const showDialDot = useAppSelector(state =>
        !state.settings.seenFeatureNotifications.includes(FEATURE_DIAL_GESTURE)
    );

    const pointValuesSheetRef = usePointValuesSheetContext();
    const gameSheetRef = useGameSheetContext();
    const gestureInfoSheetRef = useGestureInfoSheetContext();

    const isSwipe = interactionType === InteractionType.SwipeVertical;
    const isTap = interactionType === InteractionType.HalfTap;
    const isDial = interactionType === InteractionType.Dial;

    const pointValuesSubtitle = isTap
        ? `Tap: ${addendOne} / Hold: ${addendTwo}`
        : isDial
            ? `Spin: ${addendOne} / Hold: ${addendTwo}`
            : `Swipe: ${addendOne} / Hold: ${addendTwo}`;

    const gestureActions: GameOptionAction[] = [
        { id: 'swipe', title: 'Swipe', image: 'hand.draw', state: isSwipe ? 'on' : 'off' },
        { id: 'tap', title: 'Tap', image: 'hand.point.up', state: isTap ? 'on' : 'off' },
        {
            id: 'dial',
            title: 'Dial',
            subtitle: showDialDot ? 'New' : undefined,
            image: 'dial.min',
            state: isDial ? 'on' : 'off',
        },
        { id: 'about-gestures', title: 'About Gestures', image: 'info.circle' },
    ];

    const settingsActions: GameOptionAction[] = [
        { id: 'point-values', title: 'Point Values', subtitle: pointValuesSubtitle, image: 'plusminus' },
        {
            id: 'fullscreen',
            title: 'Fullscreen',
            image: fullscreen
                ? 'arrow.down.right.and.arrow.up.left'
                : 'arrow.up.left.and.arrow.down.right',
            state: fullscreen ? 'on' : 'off',
        },
    ];

    // Set the gesture for the current game, and update the global default so
    // new games inherit the most recently chosen gesture.
    const applyInteractionType = (type: InteractionType, eventName: string) => {
        if (currentGameId) {
            dispatch(setGameInteractionType({ gameId: currentGameId, interactionType: type }));
        }
        dispatch(setInteractionType(type));
        logEvent('set_interaction', { interaction_type: eventName, game_id: currentGameId });
    };

    const handleAction = (event: string) => {
        switch (event) {
            case 'swipe':
                applyInteractionType(InteractionType.SwipeVertical, 'swipe_vertical');
                break;
            case 'tap':
                applyInteractionType(InteractionType.HalfTap, 'half_tap');
                break;
            case 'dial':
                applyInteractionType(InteractionType.Dial, 'radial_gesture');
                break;
            case 'point-values':
                gameSheetRef?.current?.snapToIndex(0);
                pointValuesSheetRef?.current?.present();
                logEvent('addend_sheet', { install_id: installId });
                break;
            case 'fullscreen':
                dispatch(toggleHomeFullscreen());
                logEvent('fullscreen', { fullscreen: !fullscreen });
                break;
            case 'about-gestures':
                gestureInfoSheetRef?.current?.present();
                logEvent('about_gestures');
                break;
        }
    };

    const markDialSeen = () => {
        if (showDialDot) dispatch(markFeatureNotificationSeen(FEATURE_DIAL_GESTURE));
    };

    return {
        currentGameId,
        addendOne,
        addendTwo,
        isSwipe,
        isDial,
        showDialDot,
        gestureActions,
        settingsActions,
        handleAction,
        markDialSeen,
    };
};

/**
 * Native header items for the game options menu (iOS only). Native items,
 * unlike React views in `headerRight`, can be moved by the system into the
 * vertical bar on iPhone Duo.
 */
export const useGameOptionsHeaderItems = (): NativeStackHeaderItem[] => {
    const theme = useTheme();
    const {
        currentGameId, isSwipe, isDial, showDialDot,
        gestureActions, settingsActions, handleAction, markDialSeen,
    } = useGameOptions();

    // Keep the latest handlers in a ref so the items below only change when
    // what they display changes. Each new items array re-runs setOptions.
    const onActionRef = useRef<(id: string) => void>(() => {});
    useLayoutEffect(() => {
        onActionRef.current = (id: string) => {
            handleAction(id);
            // UIMenu has no open/close callbacks here, so the "new" badge is
            // cleared when the user picks any action from the menu.
            markDialSeen();
        };
    });

    const actionsKey = JSON.stringify([gestureActions, settingsActions]);

    return useMemo(() => {
        if (currentGameId == null) return [];

        const toNativeAction = (action: GameOptionAction): NativeStackHeaderItemMenuAction => ({
            type: 'action',
            label: action.title,
            description: action.subtitle,
            icon: { type: 'sfSymbol', name: action.image },
            state: action.state,
            onPress: () => onActionRef.current(action.id),
        });

        return [{
            type: 'menu',
            label: 'Game Options',
            accessibilityLabel: 'Game Options',
            icon: { type: 'sfSymbol', name: isDial ? 'dial.min' : isSwipe ? 'hand.draw' : 'hand.point.up' },
            tintColor: theme.text,
            badge: showDialDot
                ? { value: 'New', style: { backgroundColor: theme.warning } }
                : undefined,
            menu: {
                items: [
                    {
                        type: 'submenu',
                        label: 'Point Gestures',
                        inline: true,
                        items: gestureActions.map(toNativeAction),
                    },
                    {
                        type: 'submenu',
                        label: 'Settings',
                        inline: true,
                        items: settingsActions.map(toNativeAction),
                    },
                ],
            },
        }];
        // gestureActions/settingsActions are rebuilt every render; actionsKey tracks their content.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentGameId, isDial, isSwipe, showDialDot, theme.text, theme.warning, actionsKey]);
};

const GameOptionsButton: React.FunctionComponent = () => {
    const theme = useTheme();
    const { setMenuOpen } = useMenuOpen();
    const {
        currentGameId, addendOne, addendTwo, isSwipe, isDial, showDialDot,
        gestureActions, settingsActions, handleAction, markDialSeen,
    } = useGameOptions();

    if (currentGameId == null) return null;

    const toMenuAction = (action: GameOptionAction): MenuAction => ({
        ...action,
        imageColor: theme.text,
    });

    const menuActions: MenuAction[] = Platform.OS === 'android'
        ? [...gestureActions, ...settingsActions].map(toMenuAction)
        : [
            {
                id: 'gestures',
                title: 'Point Gestures',
                displayInline: true,
                subactions: gestureActions.map(toMenuAction),
            },
            {
                id: 'settings',
                title: 'Settings',
                displayInline: true,
                subactions: settingsActions.map(toMenuAction),
            },
        ];

    return (
        <MenuView
            actions={menuActions}
            onOpenMenu={() => setMenuOpen(true)}
            onCloseMenu={() => {
                setMenuOpen(false);
                markDialSeen();
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
                        {Platform.OS === 'ios' ? (
                            <SymbolView
                                name={isDial ? 'dial.min' : isSwipe ? 'hand.draw' : 'hand.point.up'}
                                size={30}
                                tintColor={theme.text}
                            />
                        ) : (
                            <MaterialCommunityIcons
                                name={isDial ? 'knob' : isSwipe ? 'gesture-swipe-up' : 'gesture-tap'}
                                size={30}
                                color={theme.text}
                            />
                        )}
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
