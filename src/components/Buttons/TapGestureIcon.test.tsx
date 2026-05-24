import React from 'react';

import { render } from '@testing-library/react-native';

import TapGestureIcon from './TapGestureIcon';

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Circle: 'Circle',
  Rect: 'Rect',
}));

describe('TapGestureIcon', () => {
  it('should render without crashing', () => {
    expect(() => render(<TapGestureIcon />)).not.toThrow();
  });

  it('should render with default props', () => {
    const { toJSON } = render(<TapGestureIcon />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should render with custom color', () => {
    const customColor = '#ff0000';
    const { toJSON } = render(<TapGestureIcon color={customColor} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should render with custom size', () => {
    const customSize = 30;
    const { toJSON } = render(<TapGestureIcon size={customSize} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should render with both custom color and size', () => {
    const customColor = '#00ff00';
    const customSize = 25;
    const { toJSON } = render(
      <TapGestureIcon color={customColor} size={customSize} />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
