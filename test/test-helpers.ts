import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NativeStackNavigationPropAlias = NativeStackNavigationProp<NonNullable<unknown>>;

const navigationMock: Partial<NativeStackNavigationPropAlias> = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setParams: jest.fn(),
    reset: jest.fn(),
    isFocused: jest.fn(),
    canGoBack: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    setOptions: jest.fn(),
};

export const useNavigationMock = () => {
    return navigationMock as NativeStackNavigationPropAlias;
};
