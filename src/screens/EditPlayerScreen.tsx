import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

interface EditPlayerScreenProps {
    // define your props here
}

const EditPlayerScreen: React.FC<EditPlayerScreenProps> = (props) => {
    return (
        <View style={styles.container}>
            <Text>Edit Player Screen</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default EditPlayerScreen;
