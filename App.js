import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import ScoreBoardScreen from "./src/screens/ScoreBoardScreen";
import ConfigureScreen from "./src/screens/ConfigureScreen";

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

export default createAppContainer(navigator);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
