import { render, fireEvent } from '@testing-library/react-native';
import analytics from '@react-native-firebase/analytics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CheckButton from './CheckButton';

jest.mock('@react-native-firebase/analytics', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        logEvent: jest.fn(),
    })),
}));

jest.mock('@react-navigation/native-stack', () => ({
    __esModule: true,
    NativeStackNavigationProp: jest.fn(),
}));


type NativeStackNavigationPropAlias = NativeStackNavigationProp<{}>;

describe('CheckButton', () => {
    let navigation: Partial<NativeStackNavigationPropAlias>;
    beforeEach(() => {
        navigation = {
            navigate: jest.fn()
        }
    });

    it('should navigate to Game screen when pressed', () => {
        const { getByRole } = render(<CheckButton navigation={navigation as NativeStackNavigationPropAlias} />);
        const button = getByRole('button');
        fireEvent.press(button);
        expect(navigation.navigate).toHaveBeenCalledWith('Game');
    });

    xit('should log an analytics event when pressed', async () => {
        const { getByRole } = render(<CheckButton navigation={navigation as NativeStackNavigationPropAlias} />);
        const button = getByRole('button');
        fireEvent.press(button);
        expect(analytics().logEvent).toHaveBeenCalledWith('app_info');
    });
});