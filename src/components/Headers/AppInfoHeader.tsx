import React from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import { systemBlue } from '../../constants';
import HeaderButton from '../Buttons/HeaderButton';


interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const AppInfoHeader: React.FunctionComponent<Props> = ({ navigation }: Props) => {

    return (
        <View style={{
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexDirection: 'row',
            backgroundColor: '#F2F2F7',
        }}>
            <HeaderButton
                accessibilityLabel='Save Game'
                onPress={async () => {
                    navigation.goBack();
                }}>
                <Text style={{ color: systemBlue, fontSize: 20 }}>Done</Text>
            </HeaderButton>
        </View>
    );
};

export default AppInfoHeader;
