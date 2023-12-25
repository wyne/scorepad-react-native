import React from 'react';

import { MenuAction, MenuView, NativeActionEvent } from '@react-native-menu/menu';
import { Platform } from 'react-native';

interface Props {
    // Define your component's props here
    children: React.ReactNode;
    gameTitle: string | undefined;
    editGameHandler: () => void;
    shareGameHandler: () => void;
    deleteGameHandler: () => void;
}

const IOSPopupMenu: React.FC<Props> = ({
    children,
    gameTitle,
    editGameHandler,
    shareGameHandler,
    deleteGameHandler
}) => {
    // Implement your component logic here

    type MenuActionHandler = (NativeEvent: NativeActionEvent) => void;

    /**
     * Menu Actions for long press
     */
    const actions: MenuAction[] = [
        {
            id: 'edit',
            title: 'Edit',
            image: Platform.select({
                ios: 'pencil',
                android: 'ic_menu_edit',
            }),
        },
        {
            id: 'share',
            title: 'Share',
            image: Platform.select({
                ios: 'square.and.arrow.up',
                android: 'ic_menu_share',
            }),
        },
        {
            id: 'delete',
            title: `Delete`,
            attributes: {
                destructive: true,
            },
            image: Platform.select({
                ios: 'trash',
                android: 'ic_menu_delete',
            }),
        },
    ];

    /**
     * Menu Action Handler - handles long press actions for games
     * @param nativeEvent
     * @returns void
     */
    const menuActionHandler: MenuActionHandler = async ({ nativeEvent }) => {
        switch (nativeEvent.event) {
            case 'edit':
                editGameHandler();
                break;
            case 'share':
                shareGameHandler();
                break;
            case 'delete':
                deleteGameHandler();
                break;
        }
    };

    return (
        // JSX markup goes here
        <MenuView
            title={gameTitle}
            shouldOpenOnLongPress={true}
            onPressAction={menuActionHandler}
            actions={actions}>
            {children}
        </MenuView>
    );
};

export default IOSPopupMenu;