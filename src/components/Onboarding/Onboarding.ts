import { ImageURISource, } from 'react-native';
import { SemVer, compare } from 'semver';

export type OnboardingScreenItem = {
    title: string;
    image: ImageURISource;
    imageHeight?: number;
    imageWidth?: number;
    description: string;
    backgroundColor: string;
};

type OnboardingScreens = Record<string, OnboardingScreenItem[]>;

const onboardingScreens: OnboardingScreens = {
    '2.2.2': [
        {
            title: "ScorePad\nwith Rounds",
            image: require('../../../assets/icon.png'),
            imageHeight: 150,
            imageWidth: 150,
            description: 'Swipe left to begin.',
            backgroundColor: '#8ca2b8',
        },
        {
            title: "Add Points",
            image: require('../../../assets/onboarding/add.png'),
            description: 'Tap the top half of a player’s tile to add points.',
            backgroundColor: '#a0c99a',
        },
        {
            title: "Subtract Points",
            image: require('../../../assets/onboarding/subtract.png'),
            description: 'Tap the bottom half of a player’s tile to subtract points.',
            backgroundColor: '#d29898',
        },
        {
            title: "Adjust Point Values",
            image: require('../../../assets/onboarding/addend-button.png'),
            description: 'Adjust the point value by tapping on the point value selector in the top right.',
            backgroundColor: '#9896c5',
        },
        {
            title: "Swipe Gestures",
            image: require('../../../assets/onboarding/slide.png'),
            description: 'Change gestures from the point settings in the top right.',
            backgroundColor: '#94c49e',
        },
        {
            title: "Change Rounds",
            image: require('../../../assets/onboarding/rounds.png'),
            description: 'Use rounds for score history. \nTap the arrows to cycle rounds.',
            backgroundColor: '#c8b780',
        },
        {
            title: "Score History",
            image: require('../../../assets/onboarding/sheet.png'),
            description: 'Pull up the bottom sheet to view score history and edit the game.',
            backgroundColor: '#94c49e',
        },
        {
            title: "That's it!",
            image: require('../../../assets/icon.png'),
            imageHeight: 150,
            imageWidth: 150,
            description: 'Return to this tutorial \n at any time.',
            backgroundColor: '#8ca2b8',
        },
    ],
    '2.5.0': [
        {
            title: "New: Swipe Gestures",
            image: require('../../../assets/onboarding/slide.png'),
            description: 'Change gesture methods through the point settings in the top right of a game.',
            backgroundColor: '#94c49e',
        },
        {
            title: "That's it!",
            image: require('../../../assets/icon.png'),
            imageHeight: 150,
            imageWidth: 150,
            description: 'Return to this tutorial \n at any time.',
            backgroundColor: '#8ca2b8',
        },
    ]
};

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
        return [];
    }

    return onboardingScreens[applicableVersion];
};
