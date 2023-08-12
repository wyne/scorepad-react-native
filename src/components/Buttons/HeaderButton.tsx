import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
    children: React.ReactNode;
    accessibilityLabel: string;
    onPress: () => void;
}

const HeaderButton: React.FunctionComponent<Props> = (props) => {
    return (
        <TouchableOpacity accessibilityRole='button'  {...props} style={[styles.headerButton]}>
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
