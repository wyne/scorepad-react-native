import React from 'react';
import { Provider } from 'react-redux';
import { Icon } from 'react-native-elements';
import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';

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

const newGameButton = () => {
    return <Icon name="add" color="white" style={{ marginHorizontal: 10 }} />
}

const settingsButton = () => {
    return <Icon name="settings" color="white" style={{ marginHorizontal: 10 }} />
}

const navigator = createStackNavigator(
    {
        List: {
            screen: ListScreen,
            navigationOptions: ({ navigation }) => ({
                title: "ScorePad with Rounds",
                headerStyle: { backgroundColor: "#000" },
                headerRight: newGameButton,
                headerLeft: settingsButton,
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
