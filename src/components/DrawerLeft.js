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

function CustomDrawerContent(props) {
    return (
        <DrawerContentScrollView {...props} >
            <View>
                <Image
                    source={require('../../assets/adaptive-icon.png')}
                    resizeMode={'cover'}
                    resizeMethod={'resize'}
                    style={{
                        alignSelf: 'center',
                        height: 150,
                        width: '100%',
                    }}
                />
                < DrawerItem label="ScorePad with Rounds v1.2.0" />
                <DrawerItemList {...props} />
            </View>
        </DrawerContentScrollView>
    );
}

const Drawer = createDrawerNavigator();

const DrawerLeft = () => {
    const currentGame = useSelector(state => selectGameById(state, state.settings.currentGameId));
    const loaded = typeof currentGame !== 'undefined';

    return (
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
            {loaded &&
                <>
                    <Drawer.Screen name="Game" component={GameScreen}
                        options={{
                            title: `Current Game`,
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
                        headerStyle={{ backgroundColor: '#000' }} />
                </>
            }
        </Drawer.Navigator>
    );
};

export default DrawerLeft;
