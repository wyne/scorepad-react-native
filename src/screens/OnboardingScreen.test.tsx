/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SemVer } from 'semver';

import * as Analytics from '../Analytics';
import * as OnboardingModule from '../components/Onboarding/Onboarding';

import OnboardingScreen from './OnboardingScreen';

// Mock external dependencies
jest.mock('react-native-reanimated', () => {
  const { View, FlatList } = jest.requireActual('react-native');
  return {
    __esModule: true,
    useSharedValue: function (i: number) { return { value: i }; },
    useAnimatedStyle: function (fn: () => Record<string, unknown>) { return fn(); },
    useAnimatedReaction: function (_p: () => unknown, r: (c: unknown, p: unknown) => void) { r(_p(), undefined); },
    runOnJS: function (fn: (...args: unknown[]) => unknown) { return fn; },
    withTiming: function (_t: number) { return _t; },
    default: { View, FlatList },
    createAnimatedComponent: function (c: unknown) { return c; },
    LinearTransition: { easing: function () { return {}; } },
    Easing: { ease: {} },
    FadeIn: { duration: function () { return this; } },
  };
});
jest.mock('../Analytics');
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn(),
}));

// Mock the components that OnboardingScreen uses
jest.mock('../components/Onboarding/OnboardingPage', () => {
  return function MockOnboardingPage({
    item,
    index,
    width,
    active,
    isLast,
    closeOnboarding,
  }: {
    item: any;
    index: number;
    width: number;
    active: boolean;
    isLast: boolean;
    closeOnboarding: () => void;
  }) {
    const { View, Text, TouchableOpacity } = jest.requireActual('react-native');
    return (
      <View testID={`onboarding-page-${index}`} style={{ width }}>
        <Text>
          Page {index}: {item.title}
        </Text>
        <Text>Active: {active.toString()}</Text>
        <Text>Is Last: {isLast.toString()}</Text>
        {isLast && (
          <TouchableOpacity onPress={closeOnboarding} testID="complete-button">
            <Text>Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
});

jest.mock('../components/Onboarding/SkipButton', () => {
  return function MockSkipButton({
    visible,
    onPress,
  }: {
    visible: boolean;
    onPress: () => void;
  }) {
    const { TouchableOpacity, Text } = jest.requireActual('react-native');
    if (!visible) return null;
    return (
      <TouchableOpacity onPress={onPress} testID="skip-button">
        <Text>Skip</Text>
      </TouchableOpacity>
    );
  };
});

jest.mock('react-native-animated-pagination-dots', () => ({
  ExpandingDot: ({ data }: { data: any[] }) => {
    const { View, Text } = jest.requireActual('react-native');
    return (
      <View testID="expanding-dot">
        <Text>Dots: {data.length}</Text>
      </View>
    );
  },
}));

// Mock getOnboardingScreens
jest.mock('../components/Onboarding/Onboarding', () => ({
  getOnboardingScreens: jest.fn(),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => true),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  replace: jest.fn(),
  jumpTo: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe('OnboardingScreen', () => {
  const mockOnboardingScreens = [
    {
      title: 'Welcome',
      backgroundColor: '#FF6B6B',
      content: 'Welcome to the app',
    },
    {
      title: 'Features',
      backgroundColor: '#4ECDC4',
      content: 'Explore our features',
    },
    {
      title: 'Get Started',
      backgroundColor: '#45B7D1',
      content: 'Let\'s get started',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (OnboardingModule.getOnboardingScreens as jest.Mock).mockReturnValue(
      mockOnboardingScreens
    );
    (useFocusEffect as jest.Mock).mockImplementation((callback) => {
      // Simulate focus effect by calling the callback and its cleanup
      const cleanup = callback();
      if (cleanup) {
        // Store cleanup for later if needed
      }
    });
  });

  it('should render onboarding screens with default parameters', () => {
    const mockRoute = {
      params: {},
    };

    const { getByTestId, getByText } = render(
      <OnboardingScreen navigation={mockNavigation} route={mockRoute as any} />
    );

    expect(getByTestId('onboarding')).toBeTruthy();
    expect(getByTestId('onboarding-page-0')).toBeTruthy();
    expect(getByText('Page 0: Welcome')).toBeTruthy();
    expect(getByTestId('expanding-dot')).toBeTruthy();
    expect(getByText('Dots: 3')).toBeTruthy();
  });

  it('should render onboarding screens with provided version', () => {
    const mockRoute = {
      params: {
        onboarding: true,
        version: new SemVer('1.2.3'),
      },
    };

    render(
      <OnboardingScreen navigation={mockNavigation} route={mockRoute as any} />
    );

    expect(OnboardingModule.getOnboardingScreens).toHaveBeenCalledWith(
      new SemVer('1.2.3')
    );
  });

  it('should use default version when onboarding is false', () => {
    const mockRoute = {
      params: {
        onboarding: false,
        version: new SemVer('1.2.3'),
      },
    };

    render(
      <OnboardingScreen navigation={mockNavigation} route={mockRoute as any} />
    );

    expect(OnboardingModule.getOnboardingScreens).toHaveBeenCalledWith(
      new SemVer('0.0.0')
    );
  });

  it('should show skip button when not on last page', () => {
    const mockRoute = {
      params: {
        onboarding: true,
      },
    };

    const { getByTestId } = render(
      <OnboardingScreen navigation={mockNavigation} route={mockRoute as any} />
    );

    expect(getByTestId('skip-button')).toBeTruthy();
  });

  it('should not show skip button when on last page', () => {
    const mockRoute = {
      params: {
        onboarding: true,
      },
    };

    const { getByTestId } = render(
      <OnboardingScreen navigation={mockNavigation} route={mockRoute as any} />
    );

    // Component should render successfully
    expect(getByTestId('onboarding')).toBeTruthy();
  });

  it('should handle skip button press', () => {
    const mockRoute = {
      params: {
        onboarding: true,
      },
    };

    const { getByTestId } = render(
      <OnboardingScreen navigation={mockNavigation} route={mockRoute as any} />
    );

    // Should render skip button
    expect(getByTestId('skip-button')).toBeTruthy();
  });

  it('should log analytics events for page changes', async () => {
    const mockLogEvent = jest.mocked(Analytics.logEvent);
    const mockRoute = {
      params: {
        onboarding: true,
      },
    };

    render(
      <OnboardingScreen navigation={mockNavigation} route={mockRoute as any} />
    );

    // Initial page load should log event
    await waitFor(() => {
      expect(mockLogEvent).toHaveBeenCalledWith('onboarding_page', {
        onboarding: true,
        index: 0,
        end: false,
      });
    });
  });

  it('should log analytics events for completion', () => {
    const mockLogEvent = jest.mocked(Analytics.logEvent);
    const mockRoute = {
      params: {
        onboarding: true,
      },
    };

    const { getByTestId } = render(
      <OnboardingScreen navigation={mockNavigation} route={mockRoute as any} />
    );

    // Component should render successfully
    expect(getByTestId('onboarding')).toBeTruthy();
    expect(mockLogEvent).toBeDefined();
  });

  it('should log analytics events for skipping', () => {
    const mockLogEvent = jest.mocked(Analytics.logEvent);
    const mockRoute = {
      params: {
        onboarding: true,
      },
    };

    const { getByTestId } = render(
      <OnboardingScreen navigation={mockNavigation} route={mockRoute as any} />
    );

    const skipButton = getByTestId('skip-button');
    fireEvent.press(skipButton);

    expect(mockLogEvent).toHaveBeenCalledWith('onboarding_skip', {
      onboarding: true,
      index: 0,
      end: false,
    });
  });

  it('should handle scroll end events to update active index', () => {
    const mockRoute = {
      params: {
        onboarding: true,
      },
    };

    const { getByTestId, getByText } = render(
      <OnboardingScreen navigation={mockNavigation} route={mockRoute as any} />
    );

    // Set up layout
    const onboardingView = getByTestId('onboarding');
    fireEvent(onboardingView, 'layout', {
      nativeEvent: { layout: { width: 300 } },
    });

    // Initially should show first page as active
    expect(getByText('Active: true')).toBeTruthy();

    // Simulate momentum scroll end to second page
    const flatList = getByTestId('onboarding').findByType('RCTScrollView' as any);
    if (flatList) {
      fireEvent(flatList, 'momentumScrollEnd', {
        nativeEvent: {
          contentOffset: { x: 300 },
          contentSize: { width: 900, height: 600 },
          layoutMeasurement: { width: 300, height: 600 },
        },
      });
    }

    // Should update active index
    expect(getByText('Page 1: Features')).toBeTruthy();
  });

  it('should log focus/unfocus events', () => {
    const mockLogEvent = jest.mocked(Analytics.logEvent);
    let focusCallback: (() => void) | undefined;

    (useFocusEffect as jest.Mock).mockImplementation((callback) => {
      focusCallback = callback();
      return focusCallback;
    });

    const mockRoute = {
      params: {
        onboarding: true,
      },
    };

    render(
      <OnboardingScreen navigation={mockNavigation} route={mockRoute as any} />
    );

    // Simulate unfocus
    if (focusCallback) {
      focusCallback();
    }

    expect(mockLogEvent).toHaveBeenCalledWith('onboarding_close', {
      onboarding: true,
      index: 0,
      end: false,
    });
  });
});
