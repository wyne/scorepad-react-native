import { render, fireEvent, waitFor } from '@testing-library/react-native';
import analytics from '@react-native-firebase/analytics';
import CheckButton from './CheckButton';
import { useNavigationMock } from '../../../test/test-helpers';

describe('CheckButton', () => {
    const navigation = useNavigationMock();

    it('should navigate back a screen when pressed', async () => {
        const { getByRole } = render(<CheckButton navigation={navigation} />);
        const button = getByRole('button');
        fireEvent.press(button);
        await waitFor(() => {
            expect(navigation.goBack).toHaveBeenCalled();
        });
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
