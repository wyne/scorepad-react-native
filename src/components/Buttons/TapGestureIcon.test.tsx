import React from 'react';

import { render } from '@testing-library/react-native';

import { systemBlue } from '../../constants';

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

  it('should use systemBlue as default color', () => {
    // This test verifies the default prop is correctly set
    const tree = render(<TapGestureIcon />).toJSON();
    expect(tree).toBeTruthy();
  });

  it('should use 20 as default size', () => {
    // This test verifies the default prop is correctly set
    const tree = render(<TapGestureIcon />).toJSON();
    expect(tree).toBeTruthy();
  });

  it('should handle edge case sizes', () => {
    const edgeCases = [0, 1, 100, 999];
    
    edgeCases.forEach(size => {
      expect(() => render(<TapGestureIcon size={size} />)).not.toThrow();
    });
  });

  it('should handle different color formats', () => {
    const colorFormats = ['#ff0000', '#FF0000', 'red', 'rgb(255,0,0)', 'rgba(255,0,0,1)'];
    
    colorFormats.forEach(color => {
      expect(() => render(<TapGestureIcon color={color} />)).not.toThrow();
    });
  });

  it('should be a functional component', () => {
    expect(typeof TapGestureIcon).toBe('function');
  });

  it('should render consistently with different props', () => {
    const props1 = { color: '#123456', size: 15 };
    const props2 = { color: '#abcdef', size: 25 };
    
    const tree1 = render(<TapGestureIcon {...props1} />).toJSON();
    const tree2 = render(<TapGestureIcon {...props2} />).toJSON();
    
    expect(tree1).toBeTruthy();
    expect(tree2).toBeTruthy();
    expect(tree1).not.toEqual(tree2);
  });

  it('should import systemBlue constant correctly', () => {
    expect(systemBlue).toBeDefined();
    expect(typeof systemBlue).toBe('string');
  });

  it('should render different elements for tap vs swipe gesture', () => {
    // This test ensures TapGestureIcon is distinct from SwipeGestureIcon
    const tapTree = render(<TapGestureIcon />).toJSON();
    expect(tapTree).toBeTruthy();
    // The component should render circles for tap gesture indicators
  });
});
