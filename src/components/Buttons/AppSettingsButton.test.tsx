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

const createTestStore = () =>
    configureStore({
        reducer: {
            settings: () => ({
                multiplier: 1,
                addendOne: 1,
                addendTwo: 10,
                currentGameId: 'game-1',
                onboarded: undefined,
                showPointParticles: true,
                showPlayerIndex: true,
                interactionType: 'SwipeVertical',
                lastStoreReviewPrompt: 0,
                appOpens: 0,
                installId: 'test-install-id',
                keepScreenAwake: false,
                seenFeatureNotifications: [],
            }),
        },
    });

describe('AppSettingsButton', () => {
  const navigation = useNavigationMock();

  beforeEach(() => {
    (useNavigation as jest.Mock).mockReturnValue(navigation);
  });

  const renderComponent = () => {
    const store = createTestStore();
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
});
