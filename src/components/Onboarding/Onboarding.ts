import { ImageURISource } from 'react-native';
import { SemVer, compare } from 'semver';


export type MediaResource = {
    type: 'image' | 'video';
    source: ImageURISource | NodeRequire;
    width?: number;
    height?: number;
};

export type OnboardingScreenItem = {
    title: string;
    media: MediaResource;
    description: string;
    backgroundColor: string;
};

type OnboardingScreens = Record<string, OnboardingScreenItem[]>;

const onboardingScreens: OnboardingScreens = {
    '2.2.2': [
        {
            title: "ScorePad\nwith Rounds",
            media: {
                type: 'image',
                source: require('../../../assets/icon.png'),
                width: 150,
                height: 150,
            },
            description: 'Swipe left to begin.',
            backgroundColor: '#8ca2b8',
        },
        {
            title: "Adding Points",
            media: {
                type: 'video',
                source: require('../../../assets/video/swipe-gesture.mp4'),
            },
            description: 'Swipe up and down to \nchange points.',
            backgroundColor: '#a0c99a',
        },
        {
            title: "Hold and Swipe",
            media: {
                type: 'video',
                source: require('../../../assets/video/swipe-powerhold.mp4'),
            },
            description: 'Hold first, then swipe \nfor more points.',
            backgroundColor: '#d29898',
        },
        {
            title: "Change Gestures",
            media: {
                type: 'video',
                source: require('../../../assets/video/gesture-select.mp4'),
            },
            description: 'Change gesture methods through the point settings in the top right.',
            backgroundColor: '#9896c5',
        },
        {
            title: "Score History",
            media: {
                type: 'image',
                source: require('../../../assets/onboarding/sheet.png'),
            },
            description: 'Pull up the bottom sheet to view score history and edit the game.',
            backgroundColor: '#94c49e',
        },
    ],
    '2.5.0': [
        {
            title: "New Default:\nSwipe Gestures",
            media: {
                type: 'video',
                source: require('../../../assets/video/swipe-gesture.mp4'),
            },
            description: 'Swipe up and down to \nchange points.',
            backgroundColor: '#a0c99a',
        },
        {
            title: "Hold and Swipe",
            media: {
                type: 'video',
                source: require('../../../assets/video/swipe-powerhold.mp4'),
            },
            description: 'Hold first, then swipe \nfor more points.',
            backgroundColor: '#d29898',
        },
        {
            title: "Change Gestures",
            media: {
                type: 'video',
                source: require('../../../assets/video/gesture-select.mp4'),
            },
            description: 'Change gesture methods through the point settings in the top right.',
            backgroundColor: '#9896c5',
        },
    ]
};

const finalScreen: OnboardingScreenItem[] = [{
    title: "That's it!",
    media: {
        type: 'image',
        source: require('../../../assets/icon.png'),
        width: 150,
        height: 150,
    },
    description: 'Return to this tutorial \n at any time in the settings.',
    backgroundColor: '#8ca2b8',
}];

export const getOnboardingSemVer = (onboardedSemVer: SemVer | null): string | undefined => {
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
    const applicableVersion = getOnboardingSemVer(onboardedSemVer);

    if (!applicableVersion) {
        return finalScreen;
    }

    return onboardingScreens[applicableVersion].concat(finalScreen);
};
