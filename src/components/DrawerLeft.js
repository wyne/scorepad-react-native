import React from 'react';
import { Provider } from 'react-redux';
import { Icon } from 'react-native-elements';
import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import { PersistGate } from 'redux-persist/integration/react';
import {
    createDrawerNavigator,
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem,
    useDrawerProgress,
} from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet, Button } from 'react-native';
import * as Sentry from 'sentry-expo';
import { Dimensions, Image } from 'react-native';

import GameScreen from "../screens/GameScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ListScreen from "../screens/ListScreen";
import RoundTitle from './RoundTitle';

function CustomDrawerContent(props) {
    return (
        <DrawerContentScrollView {...props} >
            <View>
                <Image
                    source={require('./assets/adaptive-icon.png')}
                    resizeMode={'cover'}
                    resizeMethod={'resize'}
                    style={{
                        alignSelf: 'center',
                        height: 150,
                        width: '100%',
                    }}
                />
                < DrawerItem label="ScorePad with Rounds v1.2.0" />
                <DrawerItemList {...props} />
            </View>
        </DrawerContentScrollView>
    );
}

const Drawer = createDrawerNavigator();

function DrawerLeft() {
    return (
        <Drawer.Navigator
            initialRouteName="Home"
            drawerContent={props => < CustomDrawerContent {...props} />
            } >
            <Drawer.Screen name="Home" component={ListScreen}
                options={{
                    title: 'Game List',
                    headerTitle: 'ScorePad with Rounds',
                    drawerIcon: ({ tintColor }) => (
                        <Icon name="home"
                            type="font-awesome"
                            tintColor={tintColor}
                            size={24} />
                    ),
                }}
            />
            <Drawer.Screen name="Game" component={GameScreen}
                options={{
                    header: ({ navigation }) => {
                        return <RoundTitle navigation={navigation} />;
                    },
                    drawerIcon: ({ tintColor }) => (
                        <Icon name="gamepad"
                            type="font-awesome"
                            tintColor={tintColor}
                            size={24} />
                    ),
                }}
            />
            < Drawer.Screen name="Settings" component={SettingsScreen}
                options={{
                    headerBackgroundContainerStyle: { backgroundColor: '#000' },
                    backgroundColor: '#000',
                    sceneContainerStyle: {
                        backgroundColor: '#000',
                    },
                    drawerIcon: ({ tintColor }) => (
                        <Icon name="cog"
                            type="font-awesome"
                            tintColor={tintColor}
                            size={24} />
                    ),
                }}
                headerStyle={{ backgroundColor: '#000' }}
            />
        </Drawer.Navigator>
    );
}

export default DrawerLeft;
