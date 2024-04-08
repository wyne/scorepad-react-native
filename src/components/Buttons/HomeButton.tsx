import React from 'react';

import analytics from '@react-native-firebase/analytics';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { selectCurrentGame, selectLastStoreReviewPrompt } from '../../../redux/selectors';
import { setLastStoreReviewPrompt } from '../../../redux/SettingsSlice';
import { systemBlue } from '../../constants';

import HeaderButton from './HeaderButton';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const HomeButton: React.FunctionComponent<Props> = ({ navigation }) => {
    const gameCount = useAppSelector((state) => state.games.ids.length);
    const currentGame = useAppSelector(selectCurrentGame);
    const roundCurrent = currentGame?.roundCurrent || 0;
    const lastStoreReviewPrompt = useAppSelector(selectLastStoreReviewPrompt);
    const dispatch = useAppDispatch();

    const storePrompt = async () => {
        const now = Date.now();
        const daysSinceLastPrompt = (now - lastStoreReviewPrompt) / (1000 * 60 * 60 * 24);

        if (gameCount < 3) { return; }
        if (roundCurrent < 1) { return; }
        if (daysSinceLastPrompt < 180) { return; }

        await analytics().logEvent('review_prompt');

        dispatch(setLastStoreReviewPrompt(Date.now()));

        const isAvailable = await StoreReview.isAvailableAsync();
        if (isAvailable) {
            const platform = Platform.OS;
            if (platform === 'ios') {
                StoreReview.requestReview();
            } else if (platform === 'android') {
                StoreReview.requestReview();
            }
        }
    };

    return (
        <HeaderButton accessibilityLabel='Home' onPress={async () => {
            navigation.navigate('List');
            await analytics().logEvent('menu');

            storePrompt();
        }}>
            <Icon name="bars"
                type="font-awesome-5"
                size={20}
                color={systemBlue} />
        </HeaderButton>
    );
};

export default HomeButton;
