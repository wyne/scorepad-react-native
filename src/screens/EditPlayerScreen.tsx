import React, { useEffect, useState } from 'react';

import { ParamListBase, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NativeSyntheticEvent, ScrollView, StyleSheet, TextInput, TextInputEndEditingEventData, View } from 'react-native';
import { Input } from 'react-native-elements';

import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { updatePlayer } from '../../redux/PlayersSlice';
import { selectCurrentGame } from '../../redux/selectors';
import { logEvent } from '../Analytics';
import ColorSelector from '../components/ColorPalettes/ColorSelector';

type RouteParams = {
    EditPlayer: {
        index: number | undefined;
        playerId: string | undefined;
    };
};

export interface EditPlayerScreenProps {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    route: RouteProp<RouteParams, 'EditPlayer'>;
}

const EditPlayerScreen: React.FC<EditPlayerScreenProps> = ({
    route,
}) => {

    const dispatch = useAppDispatch();
    const currentGame = useAppSelector(selectCurrentGame);
    const { index, playerId } = route.params;
    const player = useAppSelector(state => {
        if (playerId == null) {
            return null;
        } else {
            return state.players.entities[playerId];
        }
    });

    const [originalPlayerName] = useState<string>(player?.playerName || '');
    const [localPlayerName, setLocalPlayerName] = useState<string>(player?.playerName || '');

    if (playerId == null) { return null; }
    if (player == null) return null;
    if (typeof currentGame == 'undefined') return null;
    if (index == null) { return null; }

    const [nameChanged, setNameChanged] = useState(false);

    useEffect(() => {
        if (nameChanged) {
            logEvent('player_name_changed');
        }
    }, [nameChanged]);

    const onEndEditingHandler = (e: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
        const text = e.nativeEvent.text;

        if (text == '') {
            setLocalPlayerName(originalPlayerName);
            savePlayerName(originalPlayerName);
        } else {
            savePlayerName(text);
        }
    };

    const onChangeHandler = (text: string) => {
        if (text == '') {
            savePlayerName(originalPlayerName);
        } else {
            savePlayerName(text);
        }
        setLocalPlayerName(text);
    };

    const savePlayerName = (text: string) => {
        dispatch(updatePlayer({
            id: playerId,
            changes: {
                playerName: text,
            }
        }));
    };

    const inputRef = React.useRef<TextInput>(null);

    return (
        <ScrollView style={{ flex: 1 }}>

            <Input
                ref={inputRef}
                rightIcon={{
                    style: { padding: 8 },
                    disabled: localPlayerName == '',
                    disabledStyle: { display: 'none' },
                    color: '#555',
                    size: 15,
                    name: 'close',
                    onPress: () => {
                        setLocalPlayerName('');
                        inputRef.current?.focus();
                    }
                }}
                containerStyle={{ flex: 1 }}
                inputContainerStyle={{
                    backgroundColor: '#222',
                    borderBottomWidth: 0,
                    borderRadius: 10,
                    paddingHorizontal: 10,
                }}
                maxLength={15}
                onChangeText={onChangeHandler}
                onEndEditing={onEndEditingHandler}
                onTextInput={() => {
                    setNameChanged(true);
                }}
                placeholder='Player Name'
                renderErrorMessage={false}
                selectTextOnFocus={true}
                style={styles.input}
                value={localPlayerName}
            />

            <View style={{ marginHorizontal: 20 }}>
                <ColorSelector playerId={playerId} />
            </View>

        </ScrollView>
    );
};

export default EditPlayerScreen;

const styles = StyleSheet.create({
    playerContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        backgroundColor: '#222',
        borderRadius: 10,
        padding: 2,
        paddingHorizontal: 10,
        marginVertical: 5,
        marginHorizontal: 10,
    },
    playerNumber: {
        color: '#eee',
        fontSize: 25,
        fontVariant: ['tabular-nums'],
        fontWeight: 'bold',
        padding: 5,
    },
    colorBadge: {
        borderColor: '#eee',
        borderRadius: 25,
        height: 25,
        marginHorizontal: 5,
        padding: 5,
        width: 25,
    },
    input: {
        color: '#eee',
    },
});
