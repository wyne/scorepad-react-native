import { render, fireEvent, waitFor } from '@testing-library/react-native';
import analytics from '@react-native-firebase/analytics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppInfoButton from './AppInfoButton';

jest.mock('@react-navigation/native-stack', () => ({
    __esModule: true,
    NativeStackNavigationProp: jest.fn(),
}));


type NativeStackNavigationPropAlias = NativeStackNavigationProp<NonNullable<unknown>>;

describe('AppInfoButton', () => {
    let navigation: Partial<NativeStackNavigationPropAlias>;
    beforeEach(() => {
        navigation = {
            navigate: jest.fn()
        };
    });

    it('should navigate to AppInfo screen when pressed', () => {
        const { getByRole } = render(<AppInfoButton navigation={navigation as NativeStackNavigationPropAlias} />);
        const button = getByRole('button');
        fireEvent.press(button);
        expect(navigation.navigate).toHaveBeenCalledWith('AppInfo');
    });

    it('should log an analytics event when pressed', async () => {
        const { getByRole } = render(<AppInfoButton navigation={navigation as NativeStackNavigationPropAlias} />);
        const button = getByRole('button');

        fireEvent.press(button);

        await waitFor(() => {
            expect(analytics().logEvent).toHaveBeenCalledWith('app_info');
        });
    });
});
