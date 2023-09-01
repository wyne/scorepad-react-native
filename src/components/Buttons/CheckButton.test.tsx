import { render, fireEvent, waitFor } from '@testing-library/react-native';
import analytics from '@react-native-firebase/analytics';
import CheckButton from './CheckButton';
import { useNavigationMock } from '../../../test/test-helpers';

describe('CheckButton', () => {
    const navigation = useNavigationMock();

    it('should navigate to Game screen when pressed', () => {
        const { getByRole } = render(<CheckButton navigation={navigation} />);
        const button = getByRole('button');
        fireEvent.press(button);
        expect(navigation.navigate).toHaveBeenCalledWith('Game');
    });

    it('should log an analytics event when pressed', async () => {
        const { getByRole } = render(<CheckButton navigation={navigation} />);
        const button = getByRole('button');

        fireEvent.press(button);

        await waitFor(() => {
            expect(analytics().logEvent).toHaveBeenCalledWith('save_game');
        });
    });
});
