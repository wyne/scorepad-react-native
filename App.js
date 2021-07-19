import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import ScoreBoardScreen from "./src/screens/ScoreBoardScreen";

const navigator = createStackNavigator(
  {
    ScoreBoard: ScoreBoardScreen,
  },
  {
    initialRouteName: "ScoreBoard",
    defaultNavigationOptions: {
      title: "KeepScore",
      headerShown: false,
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
