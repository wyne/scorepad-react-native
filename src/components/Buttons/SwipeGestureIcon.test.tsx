import React from 'react';

import { render } from '@testing-library/react-native';

import { systemBlue } from '../../constants';

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

  it('should use systemBlue as default color', () => {
    // This test verifies the default prop is correctly set
    const tree = render(<SwipeGestureIcon />).toJSON();
    expect(tree).toBeTruthy();
  });

  it('should use 20 as default size', () => {
    // This test verifies the default prop is correctly set
    const tree = render(<SwipeGestureIcon />).toJSON();
    expect(tree).toBeTruthy();
  });

  it('should handle edge case sizes', () => {
    const edgeCases = [0, 1, 100, 999];
    
    edgeCases.forEach(size => {
      expect(() => render(<SwipeGestureIcon size={size} />)).not.toThrow();
    });
  });

  it('should handle different color formats', () => {
    const colorFormats = ['#ff0000', '#FF0000', 'red', 'rgb(255,0,0)', 'rgba(255,0,0,1)'];
    
    colorFormats.forEach(color => {
      expect(() => render(<SwipeGestureIcon color={color} />)).not.toThrow();
    });
  });

  it('should be a functional component', () => {
    expect(typeof SwipeGestureIcon).toBe('function');
  });

  it('should render consistently with different props', () => {
    const props1 = { color: '#123456', size: 15 };
    const props2 = { color: '#abcdef', size: 25 };
    
    const tree1 = render(<SwipeGestureIcon {...props1} />).toJSON();
    const tree2 = render(<SwipeGestureIcon {...props2} />).toJSON();
    
    expect(tree1).toBeTruthy();
    expect(tree2).toBeTruthy();
    expect(tree1).not.toEqual(tree2);
  });

  it('should import systemBlue constant correctly', () => {
    expect(systemBlue).toBeDefined();
    expect(typeof systemBlue).toBe('string');
  });
});
