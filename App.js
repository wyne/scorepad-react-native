import React from 'react';
import { Provider } from 'react-redux';

import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import { DefaultTheme, DarkTheme } from "@react-navigation/native";
import ScoreBoardScreen from "./src/screens/ScoreBoardScreen";
import ConfigureScreen from "./src/screens/ConfigureScreen";
import { useDispatch, useSelector } from 'react-redux';

import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';

const navigator = createStackNavigator(
    {
        ScoreBoard: {
            screen: ScoreBoardScreen,
            navigationOptions: ({ navigation }) => ({
                headerShown: true,
            }),
        },
        Configure: {
            screen: ConfigureScreen,
            navigationOptions: ({ navigation }) => ({
                title: "Configure",
                headerBackTitle: "Back"
            }),
        },
    },
    {
        initialRouteName: "ScoreBoard",
        defaultNavigationOptions: {
            title: "Round ",
        },
    }
);

let Navigation = createAppContainer(navigator);

// Render the app container component with the provider around it
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
