import { ImageURISource } from 'react-native';
import { SemVer, compare } from 'semver';

import icon from '../../../assets/icon.png';
import sheet from '../../../assets/onboarding/sheet.png';
import gestureSelect from '../../../assets/video/gesture-select.mp4';
import swipeGesture from '../../../assets/video/swipe-gesture.mp4';
import swipePowerhold from '../../../assets/video/swipe-powerhold.mp4';


export type MediaResource = {
    type: 'image' | 'video';
    source: ImageURISource | number;
    width?: number;
    height?: number;
    borderRadius?: number;
};

export type OnboardingScreenItem = {
    title: string;
    media: MediaResource;
    description: string;
    backgroundColor: string;
    color?: string;
    swipeHint?: boolean;
};

type OnboardingScreens = Record<string, OnboardingScreenItem[]>;

const onboardingScreens: OnboardingScreens = {
    '2.2.2': [
        {
            title: 'ScorePad\nwith Rounds',
            media: {
                type: 'image',
                source: icon,
                width: 150,
                height: 150,
                borderRadius: 20,
            },
            description: '',
            backgroundColor: '#8ca2b8',
            color: 'rgba(0,0,0,0.75)',
            swipeHint: true,
        },
        {
            title: 'Swipe for points',
            media: {
                type: 'video',
                source: swipeGesture,
            },
            description: 'Swipe up and down to \nchange points.',
            backgroundColor: '#a0c99a',
        },
        {
            title: 'Hold for more',
            media: {
                type: 'video',
                source: swipePowerhold,
            },
            description: 'Hold first, then swipe \nfor more points.',
            backgroundColor: '#d29898',
        },
        {
            title: 'Change Gestures',
            media: {
                type: 'video',
                source: gestureSelect,
            },
            description: 'Change gestures and point values with the Point Settings on the top right.',
            backgroundColor: '#9896c5',
        },
        {
            title: 'Score History',
            media: {
                type: 'image',
                source: sheet,
            },
            description: 'Pull up the bottom sheet to view score history and edit the game.',
            backgroundColor: '#94c49e',
        },
    ],
    '2.5.0': [
        {
            title: 'New Default:\nSwipe Gestures',
            media: {
                type: 'video',
                source: swipeGesture,
            },
            description: 'Swipe up and down to \nchange points.',
            backgroundColor: '#a0c99a',
        },
        {
            title: 'Hold for more',
            media: {
                type: 'video',
                source: swipePowerhold,
            },
            description: 'Hold first, then swipe \nfor more points.',
            backgroundColor: '#d29898',
        },
        {
            title: 'Change Gestures',
            media: {
                type: 'video',
                source: gestureSelect,
            },
            description: 'Change gestures and point values with the Point Settings on the top right.',
            backgroundColor: '#9896c5',
        },
    ]
};

const finalScreen: OnboardingScreenItem[] = [{
    title: 'That\'s it!',
    media: {
        type: 'image',
        source: icon,
        width: 150,
        height: 150,
        borderRadius: 20,
    },
    description: 'Return to this tutorial \n at any time in the settings.',
    backgroundColor: '#8ca2b8',
}];

export const getPendingOnboardingSemVer = (onboardedSemVer: SemVer | null): string | undefined => {
    const keys = Object.keys(onboardingScreens)
        .sort((a, b) => compare(new SemVer(a), new SemVer(b)));

    if (onboardedSemVer === null) {
        return keys[0];
    }

    const v = keys.find(key => {
        // Is the onboarded version less than the current key?
        const val = compare(onboardedSemVer, new SemVer(key)) === -1;
        return val;
    });

    return v;
};

export const getOnboardingScreens = (onboardedSemVer: SemVer): OnboardingScreenItem[] => {
    const applicableVersion = getPendingOnboardingSemVer(onboardedSemVer);

    if (!applicableVersion) {
        return finalScreen;
    }

    return onboardingScreens[applicableVersion].concat(finalScreen);
};
