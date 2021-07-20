import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Provider } from 'react-redux';

import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import ScoreBoardScreen from "./src/screens/ScoreBoardScreen";
import ConfigureScreen from "./src/screens/ConfigureScreen";

import { store } from './redux/store';

const navigator = createStackNavigator(
    {
        ScoreBoard: {
            screen: ScoreBoardScreen,
            navigationOptions: ({ navigation }) => ({
                headerShown: false,
            }),
        },
        Configure: {
            screen: ConfigureScreen,
            // Optional: Override the `navigationOptions` for the screen
            navigationOptions: ({ navigation }) => ({
                title: "Configure",
                headerBackTitle: "Back"
            }),
        },
    },
    {
        initialRouteName: "ScoreBoard",
        defaultNavigationOptions: {
            title: "Home",
        },
    }
);

let Navigation = createAppContainer(navigator);

// Render the app container component with the provider around it
export default class App extends React.Component {
    render() {
        return (
            <Provider store={store}>
                <Navigation />
            </Provider>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
