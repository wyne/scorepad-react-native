import { useNavigation } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { useNavigationMock } from '../../../test/test-helpers';
import { logEvent } from '../../Analytics';

import AppSettingsButton from './AppSettingsButton';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: jest.fn(),
}));

jest.mock('../../Analytics');
jest.mock('expo-font'); // https://github.com/callstack/react-native-paper/issues/4561

const createTestStore = (seenFeatureNotifications: string[] = []) =>
    configureStore({
        reducer: {
            settings: () => ({
                multiplier: 1,
                addendOne: 1,
                addendTwo: 10,
                currentGameId: 'game-1',
                onboarded: undefined,
                showPointParticles: true,
                playerNumbers: 'badge',
                interactionType: 'SwipeVertical',
                lastStoreReviewPrompt: 0,
                appOpens: 0,
                installId: 'test-install-id',
                keepScreenAwake: false,
                seenFeatureNotifications,
            }),
        },
    });

describe('AppSettingsButton', () => {
  const navigation = useNavigationMock();

  beforeEach(() => {
    (useNavigation as jest.Mock).mockReturnValue(navigation);
  });

  const renderComponent = (seen?: string[]) => {
    const store = createTestStore(seen);
    return render(
      <Provider store={store}>
        <AppSettingsButton />
      </Provider>
    );
  };

  it('should navigate to AppSettings screen when pressed', () => {
    const { getByRole } = renderComponent();
    const button = getByRole('button');
    fireEvent.press(button);
    expect(navigation.navigate).toHaveBeenCalledWith('AppSettings');
  });

  it('should log an analytics event when pressed', async () => {
    const { getByRole } = renderComponent();
    const button = getByRole('button');

    fireEvent.press(button);

    await waitFor(() => {
      expect(logEvent).toHaveBeenCalledWith('app_info');
    });
  });

  it('shows the new dot while Game Modes is unseen', () => {
    const { getByTestId } = renderComponent(['keep_screen_awake', 'dial_gesture']);
    expect(getByTestId('app-settings-button').children.length).toBeGreaterThan(1);
  });

  it('hides the new dot once every settings feature is seen', () => {
    const { getByTestId } = renderComponent(['keep_screen_awake', 'dial_gesture', 'game_modes']);
    expect(getByTestId('app-settings-button').children).toHaveLength(1);
  });
});
