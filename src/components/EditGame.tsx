import React, { useState } from 'react';

import { NativeSyntheticEvent, StyleSheet, Text, TextInputEndEditingEventData, View } from 'react-native';
import { Input } from 'react-native-elements';

import { updateGame } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectCurrentGame } from '../../redux/selectors';

import PaletteSelector from './ColorPalettes/PaletteSelector';

const UNTITLED = 'Untitled';

const EditGame = ({ }) => {
    const dispatch = useAppDispatch();
    const currentGame = useAppSelector(selectCurrentGame);

    if (typeof currentGame == 'undefined') return null;

    const [localTitle, setLocalTitle] = useState(currentGame.title);

    const onEndEditingHandler = (e: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
        const text = e.nativeEvent.text;

        if (text == '') {
            setLocalTitle(UNTITLED);
            saveGameTitle(UNTITLED);
        } else {
            saveGameTitle(text);
        }
    };

    const onChangeTextHandler = (text: string) => {
        if (text == '') {
            saveGameTitle(UNTITLED);
        } else {
            saveGameTitle(text);
        }
        setLocalTitle(text);
    };

    const saveGameTitle = (title: string) => {
        setLocalTitle(title);

        dispatch(updateGame({
            id: currentGame.id,
            changes: {
                title: title == '' ? UNTITLED : title,
            }
        }));
    };

    const showColorPalettes = useAppSelector(state => state.settings.showColorPalettes);

    return (
        <>
            <View style={styles.inputContainer}>
                <Input
                    defaultValue={localTitle}
                    maxLength={30}
                    onChangeText={onChangeTextHandler}
                    onEndEditing={onEndEditingHandler}
                    onBlur={onEndEditingHandler}
                    placeholder={UNTITLED}
                    renderErrorMessage={false}
                    style={styles.input}
                    inputContainerStyle={{ borderBottomWidth: 0 }}
                />
            </View>
            <View style={{ marginHorizontal: 20 }}>
                <Text style={styles.creation}>
                    Created: {new Date(currentGame.dateCreated).toLocaleDateString()}
                    &nbsp; {new Date(currentGame.dateCreated).toLocaleTimeString()}
                </Text>
            </View>

            <View>
                {showColorPalettes &&
                    <PaletteSelector />
                }
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        alignItems: 'flex-start',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        backgroundColor: '#222',
        borderRadius: 10,
        padding: 2,
        paddingHorizontal: 10,
        marginVertical: 5,
        marginHorizontal: 10,
    },
    input: {
        color: '#EEE',
    },
    creation: {
        color: '#999',
    }
});

export default EditGame;
