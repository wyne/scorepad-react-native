import React, { memo } from 'react';
import {
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem,
} from '@react-navigation/drawer';
import { View, Image, Alert } from 'react-native';
import { Platform } from 'react-native';

const appJson = require('../../app.json');

function DrawerLeftContent(props) {
    const buildNumber = Platform.OS == 'ios' ?
        appJson.expo.ios.buildNumber : appJson.expo.android.versionCode;
    const appVersion = appJson.expo.version;

    return (
        <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
            <View>
                <Image
                    source={require('../../assets/adaptive-icon.png')}
                    resizeMode={'cover'}
                    resizeMethod={'resize'}
                    style={{
                        alignSelf: 'center',
                        height: 200,
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

export default DrawerLeftContent;
