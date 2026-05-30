import React from 'react';

import { MenuAction, MenuView } from '@react-native-menu/menu';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View, Text } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { toggleHomeFullscreen, setInteractionType } from '../../../redux/SettingsSlice';
import { logEvent } from '../../Analytics';
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

    const addendModalRef = useAddendModalContext();
    const gameSheetRef = useGameSheetContext();
    const gestureInfoModalRef = useGestureInfoModalContext();

    if (currentGameId == null) return null;

    const isSwipe = interactionType === InteractionType.SwipeVertical;
    const isTap = interactionType === InteractionType.HalfTap;

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
                    subtitle: isTap
                        ? `Tap: ${addendOne} / Long: ${addendTwo}`
                        : `Swipe: ${addendOne} / Hold: ${addendTwo}`,
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
            onCloseMenu={() => setMenuOpen(false)}
            onPressAction={({ nativeEvent }) => {
                handleAction(nativeEvent.event);
                setMenuOpen(false);
            }}
        >
            <View style={styles.button}>
                <View style={styles.content}>
                    <View style={styles.addendColumn}>
                        <Text style={[styles.addendText, { color: theme.text }]}>{addendOne}</Text>
                        <Text style={[styles.addendText, { color: theme.text }]}>{addendTwo}</Text>
                    </View>
                    <SymbolView
                        name={isSwipe ? 'hand.draw' : 'hand.point.up'}
                        size={30}
                        tintColor={theme.text}
                    />
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
