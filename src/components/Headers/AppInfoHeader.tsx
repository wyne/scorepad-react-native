import React from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import HeaderButton from '../Buttons/HeaderButton';


interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const AppInfoHeader: React.FunctionComponent<Props> = ({ navigation }: Props) => {
    const theme = useTheme();

    const Wrapper = Platform.OS == 'ios' ? View : SafeAreaView;

    return (
        <Wrapper style={Platform.OS == 'ios' ? undefined : { backgroundColor: theme.headerBackground }} >
            <View style={{
                justifyContent: 'flex-end',
                alignItems: 'center',
                flexDirection: 'row',
                backgroundColor: theme.headerBackground,
            }}>
                <HeaderButton
                    accessibilityLabel='Save Game'
                    onPress={async () => {
                        navigation.goBack();
                    }}>
                    <Text style={{ color: theme.tint, fontSize: 20 }} allowFontScaling={false}>Done</Text>
                </HeaderButton>
            </View>
        </Wrapper>
    );
};

export default AppInfoHeader;
