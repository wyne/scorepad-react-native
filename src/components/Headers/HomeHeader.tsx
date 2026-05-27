import React from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme';
import AppInfoButton from '../Buttons/AppInfoButton';
import NewGameButton from '../Buttons/NewGameButton';

import CustomHeader from './CustomHeader';

interface Props {
  navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const HomeHeader: React.FunctionComponent<Props> = ({ navigation }) => {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.headerBackground }}>
      <CustomHeader
        navigation={navigation}
        headerLeft={<AppInfoButton navigation={navigation} />}
        headerCenter={
          <Text style={[styles.title, { color: theme.headerText }]} allowFontScaling={false}>
            ScorePad
          </Text>
        }
        headerRight={<NewGameButton navigation={navigation} />}
        animated={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontVariant: ['tabular-nums'],
  },
});

export default HomeHeader;
