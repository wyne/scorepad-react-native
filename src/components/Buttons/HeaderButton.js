import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

const HeaderButton = (props) => {
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
        // borderWidth: 1,
        // borderColor: 'red',
    },
});

export default HeaderButton;
