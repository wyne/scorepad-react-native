import React, { useCallback } from 'react';

import ContextMenu from 'react-native-context-menu-view';

interface Props {
    children: React.ReactNode;
    gameId: string;
    gameTitle: string | undefined;
    chooseGameHandler: () => void;
    rematchGameHandler: () => void;
    editGameHandler: () => void;
    shareGameHandler: () => void;
    deleteGameHandler: () => void;
}

const IOSPopupMenu: React.FC<Props> = ({
    children,
    gameTitle,
    chooseGameHandler,
    rematchGameHandler,
    editGameHandler,
    shareGameHandler,
    deleteGameHandler
}) => {
    const handlePress = useCallback(({ nativeEvent }: { nativeEvent: { index: number } }) => {
        switch (nativeEvent.index) {
            case 0:
                rematchGameHandler();
                break;
            case 1:
                editGameHandler();
                break;
            case 2:
                shareGameHandler();
                break;
            case 3:
                deleteGameHandler();
                break;
        }
    }, [rematchGameHandler, editGameHandler, shareGameHandler, deleteGameHandler]);

    const handlePreviewPress = useCallback(() => {
        chooseGameHandler();
    }, [chooseGameHandler]);

    return (
        <ContextMenu
            title={gameTitle ?? ''}
            actions={[
                {
                    title: 'Rematch',
                    systemIcon: 'arrow.uturn.left',
                },
                {
                    title: 'Edit',
                    systemIcon: 'pencil',
                },
                {
                    title: 'Share',
                    systemIcon: 'square.and.arrow.up',
                },
                {
                    title: 'Delete',
                    systemIcon: 'trash',
                    destructive: true,
                },
            ]}
            onPress={handlePress}
            onPreviewPress={handlePreviewPress}
        >
            {children}
        </ContextMenu>
    );
};

export default IOSPopupMenu;
