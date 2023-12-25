import React from 'react';

import { Text } from 'react-native';
import {
    Menu,
    MenuOption,
    MenuOptions,
    MenuTrigger,
    renderers,
} from 'react-native-popup-menu';

interface Props {
    children: React.ReactNode;
    gameTitle: string | undefined;
    chooseGameHandler: () => void;
    editGameHandler: () => void;
    shareGameHandler: () => void;
    deleteGameHandler: () => void;
}

const AndroidPopupMenu: React.FC<Props> = (props) => {
    return (
        <Menu renderer={renderers.Popover} rendererProps={{ preferredPlacement: 'bottom' }}>
            <MenuTrigger
                triggerOnLongPress={true}
                onAlternativeAction={props.chooseGameHandler}
            >
                {props.children}
            </MenuTrigger>
            <MenuOptions optionsContainerStyle={{ minWidth: 150 }}
                customStyles={{ optionsContainer: { padding: 5 } }}
            >
                <Text style={{ color: 'grey', padding: 5 }}>{props.gameTitle}</Text>
                <MenuOption onSelect={props.editGameHandler} text='Edit' />
                <MenuOption onSelect={props.deleteGameHandler} >
                    <Text style={{ color: 'red' }}>Delete</Text>
                </MenuOption>
            </MenuOptions>
        </Menu>
    );
};

export default AndroidPopupMenu;
