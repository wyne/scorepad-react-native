import React, { useState } from 'react';
import { Text, View, StyleSheet, NativeSyntheticEvent, TextInputEndEditingEventData } from 'react-native';
import { Input } from 'react-native-elements';

import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectGameById, updateGame } from '../../redux/GamesSlice';

const UNTITLED = "Untitled";

const EditGame = ({ }) => {
    const dispatch = useAppDispatch();
    const currentGame = useAppSelector(state => selectGameById(state, state.settings.currentGameId));

    if (typeof currentGame == 'undefined') return null;

    const [localTitle, setLocalTitle] = useState(currentGame.title);

    const setGameTitleHandler = (title: string) => {
        setLocalTitle(title);

        dispatch(updateGame({
            id: currentGame.id,
            changes: {
                title: title == "" ? UNTITLED : title,
            }
        }));
    };

    const onEndEditingHandler = (e: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
        if (e.nativeEvent.text == "") {
            setGameTitleHandler(UNTITLED);
        }
    };

    const onChangeTextHandler = (text: string) => {
        setGameTitleHandler(text);
    };

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
                    selectTextOnFocus={true}
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
