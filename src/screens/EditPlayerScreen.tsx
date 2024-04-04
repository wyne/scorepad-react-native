import React from 'react';

import { RouteProp } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { Input } from 'react-native-elements';

import { palette } from '../constants';

type RouteParams = {
    EditPlayer: {
        index: number | undefined;
        playerId: string | undefined;
    };
};

export interface EditPlayerScreenProps {
    route: RouteProp<RouteParams, 'EditPlayer'>;
}

const EditPlayerScreen: React.FC<EditPlayerScreenProps> = ({
    route
}) => {

    const { index, playerId } = route.params;

    if (index == null) { return null; }
    if (playerId == null) { return null; }

    console.log('EditPlayerScreen: ', playerId);

    return (
        <View>
            <Text>Edit Player Screen</Text>
            <Text style={styles.playerNumber}>
                {index + 1}
            </Text>

            <View style={[
                styles.colorBadge,
                { backgroundColor: "#" + palette[index % palette.length] }
            ]} >
            </View>

            <Input
                autoFocus={true}
                containerStyle={{ flex: 1 }}
                // defaultValue={defaultPlayerName}
                maxLength={15}
                // onChangeText={onChangeTextHandler}
                // onEndEditing={onEndEditingHandler}
                placeholder={'Player ' + (index + 1)}
                renderErrorMessage={false}
                selectTextOnFocus={true}
                style={styles.input}
                inputContainerStyle={{ borderBottomWidth: 0 }}
            />

        </View>
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
        fontWeight: "bold",
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
