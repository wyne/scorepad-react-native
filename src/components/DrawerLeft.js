import React, { memo } from 'react';
import { Icon } from 'react-native-elements';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSelector } from 'react-redux';

import GameScreen from "../screens/GameScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ListScreen from "../screens/ListScreen";
import GameHeader from './GameHeader';
import { selectGameById } from '../../redux/GamesSlice';
import DrawerLeftContent from './DrawerLeftContent';
import SettingsHeader from './SettingsHeader';
import HomeHeader from './HomeHeader';

const Drawer = createDrawerNavigator();

const DrawerLeft = () => {
    const currentGame = useSelector(state => selectGameById(state, state.settings.currentGameId));
    const loaded = typeof currentGame !== 'undefined';

    return (
        <Drawer.Navigator
            initialRouteName="Home"
            drawerContent={props => <DrawerLeftContent {...props} />} >
            <Drawer.Screen name="Home" component={ListScreen}
                options={{
                    title: 'Home',
                    headerTitle: 'ScorePad with Rounds',
                    backgroundColor: '#000',
                    sceneContainerStyle: {
                        backgroundColor: '#000',
                    },
                    header: ({ navigation }) => {
                        return <HomeHeader navigation={navigation} />;
                    },
                    drawerIcon: ({ tintColor }) => (
                        <Icon name="home"
                            type="font-awesome-5"
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
                            backgroundColor: '#000',
                            sceneContainerStyle: {
                                backgroundColor: '#000',
                            },
                            header: ({ navigation }) => {
                                return <GameHeader navigation={navigation} />;
                            },
                            drawerIcon: ({ tintColor }) => (
                                <Icon name="gamepad"
                                    type="font-awesome-5"
                                    tintColor={tintColor}
                                    size={24} />
                            ),
                        }}
                    />
                    < Drawer.Screen name="Settings" component={SettingsScreen}
                        options={{
                            title: "Current Players",
                            backgroundColor: '#000',
                            sceneContainerStyle: {
                                backgroundColor: '#000',
                            },
                            drawerIcon: ({ tintColor }) => (
                                <Icon name="users"
                                    type="font-awesome-5"
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
