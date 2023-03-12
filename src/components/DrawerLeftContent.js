import React, { memo } from 'react';
import { Icon } from 'react-native-elements';
import {
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem,
} from '@react-navigation/drawer';
import { View, Image, Text, StyleSheet, Alert } from 'react-native';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { selectGameById } from '../../redux/GamesSlice';

const appJson = require('../../app.json');

function DrawerLeftContent(props) {
    const currentGame = useSelector(state => selectGameById(state, state.settings.currentGameId));

    const buildNumber = Platform.OS == 'ios' ? appJson.expo.ios.buildNumber : appJson.expo.android.versionCode;
    const appVersion = appJson.expo.version;

    return (
        <DrawerContentScrollView {...props} >
            <View>
                <Image
                    source={require('../../assets/adaptive-icon.png')}
                    resizeMode={'cover'}
                    resizeMethod={'resize'}
                    style={{
                        alignSelf: 'center',
                        height: 150,
                        width: '100%',
                    }}
                />
                <DrawerItem
                    label={`ScorePad with Rounds v${appVersion}`}
                    onPress={() => {
                        Alert.alert(`ScorePad with Rounds\n` +
                            `v${appVersion} (${buildNumber})\n` +
                            `${Platform.OS} ${Platform.Version}`
                        );
                    }}
                />
                <DrawerItemList {...props} />
            </View>
        </DrawerContentScrollView>
    );
}

const styles = StyleSheet.create({
    configScrollContainer: {
        flex: 1,
        padding: 10,
        paddingBottom: 50,
    },
    text: {
        fontSize: 18,
        margin: 15,
        color: '#eee',
    },
});


export default DrawerLeftContent;
