import React from 'react';

import { render } from '@testing-library/react-native';

import SwipeGestureIcon from './SwipeGestureIcon';

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Polyline: 'Polyline',
  Rect: 'Rect',
}));

describe('SwipeGestureIcon', () => {
  it('should render without crashing', () => {
    expect(() => render(<SwipeGestureIcon />)).not.toThrow();
  });

  it('should render with default props', () => {
    const { toJSON } = render(<SwipeGestureIcon />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should render with custom color', () => {
    const customColor = '#ff0000';
    const { toJSON } = render(<SwipeGestureIcon color={customColor} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should render with custom size', () => {
    const customSize = 30;
    const { toJSON } = render(<SwipeGestureIcon size={customSize} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should render with both custom color and size', () => {
    const customColor = '#00ff00';
    const customSize = 25;
    const { toJSON } = render(
      <SwipeGestureIcon color={customColor} size={customSize} />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
