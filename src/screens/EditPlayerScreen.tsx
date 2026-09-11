import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ParamListBase, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    NativeSyntheticEvent,
    Keyboard,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TextInputEndEditingEventData,
    TextInputSubmitEditingEventData,
    TouchableOpacity,
    View
} from 'react-native';
import { Input } from 'react-native-elements';

import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectAllPlayerNames, updatePlayer } from '../../redux/PlayersSlice';
import { selectCurrentGame } from '../../redux/selectors';
import { logEvent } from '../Analytics';
import ColorSelector from '../components/ColorPalettes/ColorSelector';
import SectionLabel from '../components/SectionLabel';
import { useTheme } from '../theme';

type RouteParams = {
    EditPlayer: {
        index: number | undefined;
        playerId: string | undefined;
    };
};

/**
 * Spelled-out player positions. MAX_PLAYERS is 20, so the list covers every
 * position a game can have; the numeral fallback keeps the label sensible if
 * that cap is ever raised.
 */
const NUMBER_WORDS = [
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
    'eighteen', 'nineteen', 'twenty',
];

const playerPositionWord = (position: number) => NUMBER_WORDS[position - 1] ?? String(position);

export interface EditPlayerScreenProps {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    route: RouteProp<RouteParams, 'EditPlayer'>;
}

const EditPlayerScreen: React.FC<EditPlayerScreenProps> = ({
    navigation,
    route,
}) => {

    const theme = useTheme();
    const inputRef = React.useRef<TextInput>(null);
    const selectedNameRef = useRef<string | null>(null);

    const dismissInput = useCallback(() => {
        inputRef.current?.blur();
        Keyboard.dismiss();
    }, []);

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
    const [isFocused, setIsFocused] = useState(false);

    // Latest committed name, kept current so the leave handler isn't a stale closure.
    const latestNameRef = useRef<string>(player?.playerName || '');

    const allPlayerNames = useAppSelector(selectAllPlayerNames);

    useEffect(() => {
        const onBeforeRemove = () => {
            dismissInput();
            void logEvent('edit_player_back');
            // Log a rename once per session, on any exit, if the name actually changed.
            if (latestNameRef.current !== originalPlayerName) {
                logEvent('player_renamed', { game_id: currentGame?.id, player_index: index });
            }
        };
        const unsubscribe = navigation.addListener('beforeRemove', onBeforeRemove);
        return unsubscribe;
    }, [dismissInput, navigation, originalPlayerName, currentGame?.id, index]);

    const suggestions = useMemo(() => {
        if (!isFocused || localPlayerName.length === 0) return [];
        const lower = localPlayerName.toLowerCase();
        return allPlayerNames
            .filter(name => name !== player?.playerName && name.toLowerCase().includes(lower))
            .slice(0, 8);
    }, [isFocused, localPlayerName, allPlayerNames, player?.playerName]);

    if (playerId == null) { return null; }
    if (player == null) return null;
    if (typeof currentGame == 'undefined') return null;
    if (index == null) { return null; }

    const onEndEditingHandler = (e: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
        const text = selectedNameRef.current ?? e.nativeEvent.text;
        selectedNameRef.current = null;

        commitPlayerName(text);
    };

    const onSubmitEditingHandler = (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
        commitPlayerName(e.nativeEvent.text);
    };

    const onChangeHandler = (text: string) => {
        if (text != '') {
            savePlayerName(text);
        }
        setLocalPlayerName(text);
    };

    const commitPlayerName = (text: string) => {
        if (text == '') {
            setLocalPlayerName(originalPlayerName);
            savePlayerName(originalPlayerName);
        } else {
            setLocalPlayerName(text);
            savePlayerName(text);
        }
    };

    const savePlayerName = (text: string) => {
        latestNameRef.current = text;
        dispatch(updatePlayer({
            id: playerId,
            changes: {
                playerName: text,
            }
        }));
    };

    const onFocus = () => setIsFocused(true);
    const onBlur = () => {
        setIsFocused(false);
        if (localPlayerName == '') {
            commitPlayerName(originalPlayerName);
        }
    };
    const onSuggestionSelect = (name: string) => {
        selectedNameRef.current = name;
        setLocalPlayerName(name);
        savePlayerName(name);
        setIsFocused(false);
        inputRef.current?.blur();
    };
    const clearPlayerName = () => {
        setLocalPlayerName('');
        inputRef.current?.focus();
    };

    return (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
        >

            <SectionLabel>{`Player ${playerPositionWord(index + 1)} name`}</SectionLabel>

            <View style={{ position: 'relative', zIndex: 1 }}>
                <Input
                    ref={inputRef}
                    clearButtonMode="while-editing"
                    rightIcon={Platform.OS === 'ios' ? undefined : {
                        style: { padding: 8 },
                        disabled: localPlayerName == '',
                        disabledStyle: { display: 'none' },
                        color: theme.textTertiary,
                        size: 15,
                        name: 'close',
                        onPress: clearPlayerName,
                    }}
                    containerStyle={{ flex: 1 }}
                    inputContainerStyle={{
                        backgroundColor: theme.inputBackground,
                        borderBottomWidth: 0,
                        borderRadius: 10,
                        paddingHorizontal: 10,
                    }}
                    maxLength={15}
                    onChangeText={onChangeHandler}
                    onEndEditing={onEndEditingHandler}
                    onSubmitEditing={onSubmitEditingHandler}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder='Player Name'
                    renderErrorMessage={false}
                    returnKeyType="done"
                    selectTextOnFocus={true}
                    style={[styles.input, { color: theme.textSecondary }]}
                    value={localPlayerName}
                />

                {suggestions.length > 0 && (
                    <View style={[styles.suggestionsContainer, { backgroundColor: theme.backgroundTertiary }]} testID="suggestions-list">
                        {suggestions.map((name, idx) => (
                            <TouchableOpacity key={name} activeOpacity={0.6} onPress={() => onSuggestionSelect(name)}>
                                <View style={[styles.suggestionItem, idx < suggestions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.textTertiary }]}>
                                    <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>{name}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <ColorSelector playerId={playerId} />

        </ScrollView>
    );
};

export default EditPlayerScreen;

const styles = StyleSheet.create({
    scrollContent: {
        // Grow to fill the screen even when the palette is shorter than it, so
        // the empty space below stays part of the scroll view and can be
        // dragged. Without this the content container ends at the palette and
        // only touches landing on the content scroll.
        flexGrow: 1,
        paddingTop: 16,
    },
    input: {
    },
    suggestionsContainer: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        borderRadius: 10,
        marginHorizontal: 20,
        overflow: 'hidden',
    },
    suggestionItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    suggestionText: {
        fontSize: 16,
    },
});
