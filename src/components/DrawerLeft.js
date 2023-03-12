import React, { memo } from 'react';
import { Icon } from 'react-native-elements';
import {
    createDrawerNavigator,
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem,
} from '@react-navigation/drawer';
import { View } from 'react-native';
import { Image } from 'react-native';
import { useSelector } from 'react-redux';

import GameScreen from "../screens/GameScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ListScreen from "../screens/ListScreen";
import RoundTitle from './RoundTitle';
import { selectGameById } from '../../redux/GamesSlice';
import DrawerLeftContent from './DrawerLeftContent';
import SettingsHeader from './SettingsHeader';

const Drawer = createDrawerNavigator();

const DrawerLeft = () => {
    const currentGame = useSelector(state => selectGameById(state, state.settings.currentGameId));
    const loaded = typeof currentGame !== 'undefined';

    return (
        <Drawer.Navigator
            initialRouteName="Home"
            backgroundColor="green"
            options={{
                headerBackgroundContainerStyle: { backgroundColor: 'green' },
                backgroundColor: 'green',
            }}
            drawerContent={props => <DrawerLeftContent {...props} />
            } >
            <Drawer.Screen name="Home" component={ListScreen}
                options={{
                    options: {
                        backgroundColor: 'red',
                    },
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
            {loaded &&
                <>
                    <Drawer.Screen name="Game" component={GameScreen}
                        options={{
                            title: "Current Game",
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
                            title: "Players",
                            headerBackgroundContainerStyle: { backgroundColor: 'white' },
                            backgroundColor: '#000',
                            sceneContainerStyle: {
                                backgroundColor: '#000',
                            },
                            drawerIcon: ({ tintColor }) => (
                                <Icon name="users"
                                    type="font-awesome"
                                    tintColor={tintColor}
                                    size={24} />
                            ),
                            header: ({ navigation }) => {
                                return <SettingsHeader navigation={navigation} />;
                            },
                        }}
                    />
                </>
            }
        </Drawer.Navigator>
    );
};

export default DrawerLeft;
