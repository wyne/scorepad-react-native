import { render, fireEvent, waitFor } from '@testing-library/react-native';
import analytics from '@react-native-firebase/analytics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CheckButton from './CheckButton';

type NativeStackNavigationPropAlias = NativeStackNavigationProp<NonNullable<unknown>>;

describe('CheckButton', () => {
    let navigation: Partial<NativeStackNavigationPropAlias>;

    beforeEach(() => {
        navigation = {
            navigate: jest.fn()
        };
    });

    it('should navigate to Game screen when pressed', () => {
        const { getByRole } = render(<CheckButton navigation={navigation as NativeStackNavigationPropAlias} />);
        const button = getByRole('button');
        fireEvent.press(button);
        expect(navigation.navigate).toHaveBeenCalledWith('Game');
    });

    it('should log an analytics event when pressed', async () => {
        const { getByRole } = render(<CheckButton navigation={navigation as NativeStackNavigationPropAlias} />);
        const button = getByRole('button');
        fireEvent.press(button);

        waitFor(() => {
            expect(analytics().logEvent).toHaveBeenCalledWith('save_game');
        });
    });
});
