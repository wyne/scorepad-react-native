import React from 'react';

import { ParamListBase, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import { useAppSelector } from '../../../redux/hooks';
import { selectCurrentGame } from '../../../redux/selectors';
import { logEvent } from '../../Analytics';
import { systemBlue } from '../../constants';

import HeaderButton from './HeaderButton';

type RouteParams = {
    Settings: {
        source?: string;
    };
};
interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    route?: RouteProp<RouteParams, 'Settings'>;
}

const CheckButton: React.FunctionComponent<Props> = ({ navigation, route }) => {
    const currentGame = useAppSelector(state => selectCurrentGame(state));
    if (typeof currentGame == 'undefined') return null;

    return (
        <HeaderButton accessibilityLabel='Save Game' onPress={async () => {
            await logEvent('save_game', {
                source: route?.params?.source,
                gameId: currentGame?.id,
                palette: currentGame.palette,
                player_count: currentGame.playerIds.length,
            });

            if (route?.params?.source === 'list_screen') {
                navigation.navigate('List');
            } else {
                navigation.navigate('Game');
            }
        }}>
            <Text style={{ color: systemBlue, fontSize: 20 }}>Done</Text>
        </HeaderButton>
    );
};


export default CheckButton;
