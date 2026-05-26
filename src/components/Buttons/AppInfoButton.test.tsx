import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { useNavigationMock } from '../../../test/test-helpers';
import { logEvent } from '../../Analytics';

import AppInfoButton from './AppInfoButton';

jest.mock('../../Analytics');
jest.mock('expo-font'); // https://github.com/callstack/react-native-paper/issues/4561

const createTestStore = () =>
    configureStore({
        reducer: {
            settings: () => ({
                home_fullscreen: false,
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

describe('AppInfoButton', () => {
  const navigation = useNavigationMock();

  const renderComponent = () => {
    const store = createTestStore();
    return render(
      <Provider store={store}>
        <AppInfoButton navigation={navigation} />
      </Provider>
    );
  };

  it('should navigate to AppInfo screen when pressed', () => {
    const { getByRole } = renderComponent();
    const button = getByRole('button');
    fireEvent.press(button);
    expect(navigation.navigate).toHaveBeenCalledWith('AppInfo');
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
