import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { useNavigationMock } from '../../../test/test-helpers';
import { logEvent } from '../../Analytics';

import CheckButton from './CheckButton';

jest.mock('../../Analytics');

describe('CheckButton', () => {
    const navigation = useNavigationMock();

    it.skip('should navigate to Game screen when pressed', async () => {
        const { getByRole } = render(<CheckButton navigation={navigation} route={{ key: 'Settings', name: 'Settings', params: { source: 'new_game' } }} />);
        const button = getByRole('button');
        await waitFor(() => {
            fireEvent.press(button);
            expect(navigation.navigate).toHaveBeenCalledWith('Game');
        });
    });

    it.skip('should navigate back a screen when pressed', async () => {
        const { getByRole } = render(<CheckButton navigation={navigation} route={{ key: 'Settings', name: 'Settings', params: { source: '' } }} />);
        const button = getByRole('button');
        await waitFor(() => {
            fireEvent.press(button);
            expect(navigation.goBack).toHaveBeenCalled();
        });
    });

    it('should log an analytics event when pressed', async () => {
        const { getByRole } = render(<CheckButton navigation={navigation} />);
        const button = getByRole('button');

        fireEvent.press(button);

        await waitFor(() => {
            expect(logEvent).toHaveBeenCalledWith('save_game');
        });
    });
});
