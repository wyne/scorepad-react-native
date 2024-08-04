import React from 'react';
import { View } from 'react-native';

const MockVideo = (props) => {
    return React.createElement('View', props, props.children);
};

MockVideo.Constants = {
    // Add any constants your code might use
};

export default MockVideo;
