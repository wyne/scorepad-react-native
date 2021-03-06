import React from 'react';
import { Provider } from 'react-redux';
import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';

import GameScreen from "./src/screens/GameScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import RoundTitle from './src/components/RoundTitle';

const navigator = createStackNavigator(
    {
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
                headerBackTitle: "Back"
            }),
        },
    },
    {
        initialRouteName: "Game",
        defaultNavigationOptions: {
            title: "",
        },
    }
);

let Navigation = createAppContainer(navigator);

export default class App extends React.Component {
    render() {
        return (
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    <Navigation theme="dark" />
                </PersistGate>
            </Provider>
        );
    }
}
