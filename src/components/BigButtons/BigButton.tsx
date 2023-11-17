import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements";

interface Props {
    onPress: () => void;
    icon: string;
    text: string;
    color: string;
}

const BigButton: React.FunctionComponent<Props> = ({ icon, text, color, onPress }) => {
    return (
        <TouchableOpacity activeOpacity={.5} onPress={onPress}>
            <View style={[styles.bigButton]}>
                <Icon name={icon}
                    type="ionicon" size={30}
                    color={color}
                />
                <Text style={{
                    color: color,
                    fontSize: 15,
                    paddingTop: 5,
                    textAlign: 'center',
                }}>
                    {text}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export default BigButton;

const styles = StyleSheet.create({
    bigButton: {
        width: 100,
        margin: 5,
        padding: 10,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,.2)',
        borderRadius: 10,
        alignItems: 'center'
    },
});
