import React from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from 'react-native-elements/dist/icons/Icon';

import { logEvent } from '../../Analytics';
import { useStoreReviewPrompt } from '../../hooks/useStoreReviewPrompt';
import { useTheme } from '../../theme';

import HeaderButton from './HeaderButton';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const BackButton: React.FunctionComponent<Props> = ({ navigation }) => {
    const theme = useTheme();
    const promptForReview = useStoreReviewPrompt();
    return (
        <HeaderButton accessibilityLabel='Home' onPress={() => {
            navigation.goBack();
            void logEvent('navigate_home');
            // Leaving a game they've been playing is the calmest moment to ask.
            void promptForReview();
        }}>
            <Icon name="bars"
                type="font-awesome-5"
                size={20}
                color={theme.tint} />
        </HeaderButton>
    );
};

export default BackButton;
