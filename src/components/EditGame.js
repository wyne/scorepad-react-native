import React, { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from 'react-native-elements';

import { selectGameById, updateGame } from '../../redux/GamesSlice';

const UNTITLED = "Untitled";

const EditGame = ({ }) => {
    const dispatch = useDispatch();
    const currentGame = useSelector(state => selectGameById(state, state.settings.currentGameId));
    const [localTitle, setLocalTitle] = useState(currentGame.title);

    const setGameTitleHandler = (title) => {
        setLocalTitle(title);

        dispatch(updateGame({
            id: currentGame.id,
            changes: {
                title: title == "" ? UNTITLED : title,
            }
        }));
    };

    const onEndEditingHandler = (e) => {
        if (e.nativeEvent.text == "") {
            setGameTitleHandler(UNTITLED);
        }
    };

    const onChangeTextHandler = (text) => {
        setGameTitleHandler(text);
    };

    return (
        <View style={styles.container}>
            <Input
                containerStyle={{ flex: 1 }}
                defaultValue={localTitle}
                maxLength={15}
                onChangeText={onChangeTextHandler}
                onEndEditing={onEndEditingHandler}
                onBlur={onEndEditingHandler}
                placeholder={UNTITLED}
                renderErrorMessage={false}
                selectTextOnFocus={true}
                style={styles.input}
            />
            <Text style={styles.creation}>
                Created: {new Date(currentGame.dateCreated).toLocaleDateString()}
                &nbsp; {new Date(currentGame.dateCreated).toLocaleTimeString()}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'flex-start',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        margin: 10,
        marginVertical: 5,
    },
    input: {
        color: '#eee',
    },
    creation: {
        color: '#eee',
        margin: 10,
    }
});

export default EditGame;
