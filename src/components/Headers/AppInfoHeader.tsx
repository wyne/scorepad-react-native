import React from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { systemBlue } from '../../constants';
import HeaderButton from '../Buttons/HeaderButton';


interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const AppInfoHeader: React.FunctionComponent<Props> = ({ navigation }: Props) => {

    const Wrapper = Platform.OS == 'ios' ? View : SafeAreaView;

    return (
        <Wrapper style={Platform.OS == 'ios' ? undefined : styles.headerContainer} >
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
        </Wrapper>
    );
};

export default AppInfoHeader;

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: '#F2F2F7',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        textAlign: 'center',
    },
});
