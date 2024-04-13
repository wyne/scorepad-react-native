import React from 'react';

import { createSelector } from '@reduxjs/toolkit';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';

import { useAppSelector } from '../../../redux/hooks';
import { selectCurrentGame } from '../../../redux/selectors';
import { RootState } from '../../../redux/store';
import { palette, systemBlue } from '../../constants';

const selectPlayerEntities = (state: RootState) => state.players.entities;

const selectPlayerIds = (_: RootState, playerIds: string[]) => playerIds;

const selectPlayerNamesByIds = createSelector(
    [selectPlayerEntities, selectPlayerIds],
    (players, playerIds) => playerIds.map(id => players[id]?.playerName)
);

const PlayerNameColumn: React.FunctionComponent = () => {
    const playerIds = useAppSelector(state => selectCurrentGame(state)?.playerIds) || [];
    const playerNames = useAppSelector(state => selectPlayerNamesByIds(state, playerIds));


    return (
        <View style={{ paddingVertical: 10 }}>
            <Text style={styles.editRow}>
                &nbsp;
                <Icon name="users"
                    type="font-awesome-5"
                    size={19}
                    color='white' />
            </Text>
            {playerNames.map((name, index) => (
                <View key={index} style={{ paddingLeft: 5, borderLeftWidth: 5, borderColor: '#' + palette[index % palette.length] }}>
                    <Text key={index} style={{ color: 'white', maxWidth: 100, fontSize: 20, }}
                        numberOfLines={1}
                    >{name}</Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    editRow: {
        color: systemBlue,
        fontSize: 20,
        textAlign: 'center',
    }
});

export default PlayerNameColumn;
