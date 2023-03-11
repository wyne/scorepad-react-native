import React from 'react';
import { Provider } from 'react-redux';
import { Icon } from 'react-native-elements';
import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';
import {
    createDrawerNavigator,
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem,
    useDrawerProgress,
} from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet, Button } from 'react-native';

import GameScreen from "./src/screens/GameScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import ListScreen from "./src/screens/ListScreen";
import RoundTitle from './src/components/RoundTitle';
import * as Sentry from 'sentry-expo';

Sentry.init({
    dsn: 'https://88dd6d7c83b64ed8870ff21a2a9f1ba7@o1326242.ingest.sentry.io/4504710808076288',
    enableInExpoDevelopment: true,
    debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});

const navigator = createStackNavigator(
    {
        List: {
            screen: ListScreen,
            navigationOptions: ({ navigation }) => ({
                title: "ScorePad with Rounds",
                headerStyle: { backgroundColor: "#000" }
            })
        },
        Game: {
            screen: GameScreen,
            navigationOptions: ({ navigation }) => ({
                headerShown: true,
                header: (navigation) => {
                    return <RoundTitle />;
                }
            }),
        },
        Settings: {
            screen: SettingsScreen,
            navigationOptions: ({ navigation }) => ({
                title: "Settings",
                headerBackTitle: "Back",
                headerStyle: { backgroundColor: "#000" },
            }),
        },
    },
    {
        initialRouteName: "List",
        defaultNavigationOptions: {
        }
    },
);

function CustomDrawerContent(props) {
    return (
        <DrawerContentScrollView {...props}>
            <View>
                <DrawerItem label="ScorePad with Rounds v1.2.0" onPress={() => alert('Hi!')} />
                <DrawerItemList {...props} />
            </View>
        </DrawerContentScrollView>
    );
}

const Drawer = createDrawerNavigator();

export default class App extends React.Component {
    render() {
        return (
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    <NavigationContainer>
                        <Drawer.Navigator
                            initialRouteName="Home"
                            drawerContent={props => <CustomDrawerContent {...props} />
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
                                header={RoundTitle}
                                options={{
                                    header: (navigation) => {
                                        return <RoundTitle />;
                                    },
                                    drawerIcon: ({ tintColor }) => (
                                        <Icon name="gamepad"
                                            type="font-awesome"
                                            tintColor={tintColor}
                                            size={24} />
                                    ),
                                }}
                            />
                            <Drawer.Screen name="Settings" component={SettingsScreen}
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
                    </NavigationContainer>
                </PersistGate>
            </Provider>
        );
    }
}
