import React, { useEffect, useState } from 'react';

import { useNavigation } from '@react-navigation/native';
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
    const [localTitle, setLocalTitle] = useState(currentGame?.title ?? '');

    const navigation = useNavigation();

    const commitTitle = (title: string) => {
        const finalTitle = title == '' ? UNTITLED : title;
        setLocalTitle(finalTitle);

        dispatch(updateGame({
            id: currentGame.id,
            changes: {
                title: finalTitle,
            }
        }));
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {
            commitTitle(localTitle);
        });
        return unsubscribe;
    }, [navigation, localTitle]);

    if (typeof currentGame == 'undefined') return null;

    const onEndEditingHandler = (e: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
        const text = e.nativeEvent.text;
        commitTitle(text);
    };

    const onChangeTextHandler = (text: string) => {
        setLocalTitle(text);
    };

    return (
        <>
            <View style={styles.inputContainer}>
                <Input
                    defaultValue={localTitle}
                    maxLength={30}
                    onChangeText={onChangeTextHandler}
                    onEndEditing={onEndEditingHandler}
                    onBlur={() => {
                        if (localTitle == '') {
                            commitTitle(UNTITLED);
                        }
                    }}
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

            <View style={{ marginHorizontal: 10 }}>
                <PaletteSelector />
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
