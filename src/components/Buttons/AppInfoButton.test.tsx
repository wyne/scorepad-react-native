import { render, fireEvent, waitFor } from '@testing-library/react-native';
import analytics from '@react-native-firebase/analytics';
import AppInfoButton from './AppInfoButton';
import { useNavigationMock } from '../../../test/test-helpers';

describe('AppInfoButton', () => {
    const navigation = useNavigationMock();

    it('should navigate to AppInfo screen when pressed', () => {
        const { getByRole } = render(<AppInfoButton navigation={navigation} />);
        const button = getByRole('button');
        fireEvent.press(button);
        expect(navigation.navigate).toHaveBeenCalledWith('AppInfo');
    });

    it('should log an analytics event when pressed', async () => {
        const { getByRole } = render(<AppInfoButton navigation={navigation} />);
        const button = getByRole('button');

        fireEvent.press(button);

        await waitFor(() => {
            expect(analytics().logEvent).toHaveBeenCalledWith('app_info');
        });
    });
});
