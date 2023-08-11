import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
    children: React.ReactNode;
    onPress: () => void;
}

const HeaderButton: React.FunctionComponent<Props> = (props) => {
    return (
        <TouchableOpacity {...props} style={[styles.headerButton]}>
            {props.children}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    headerButton: {
        fontSize: 20,
        padding: 10,
        paddingHorizontal: 15,
    },
});

export default HeaderButton;
