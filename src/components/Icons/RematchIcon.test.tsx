import React from 'react';

import { render } from '@testing-library/react-native';

import RematchIcon from './RematchIcon';

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  G: 'G',
  Path: 'Path',
  Rect: 'Rect',
}));

describe('RematchIcon', () => {
  it('should render without crashing', () => {
    expect(() => render(<RematchIcon />)).not.toThrow();
  });

  it('should render with default props', () => {
    const { toJSON } = render(<RematchIcon />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should render with custom fill color', () => {
    const customFill = '#ff0000';
    const { toJSON } = render(<RematchIcon fill={customFill} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should render with undefined fill', () => {
    const { toJSON } = render(<RematchIcon fill={undefined} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should accept different fill color formats', () => {
    const colorFormats = ['#ff0000', '#FF0000', 'red', 'rgb(255,0,0)', 'rgba(255,0,0,1)'];
    
    colorFormats.forEach(color => {
      expect(() => render(<RematchIcon fill={color} />)).not.toThrow();
    });
  });

  it('should be a functional component', () => {
    expect(typeof RematchIcon).toBe('function');
  });

  it('should accept valid Props interface', () => {
    const validProps = { fill: '#000000' };
    expect(() => render(<RematchIcon {...validProps} />)).not.toThrow();
  });

  it('should handle empty props', () => {
    expect(() => render(<RematchIcon />)).not.toThrow();
  });

  it('should render consistently with different props', () => {
    const props1 = { fill: '#123456' };
    const props2 = { fill: '#abcdef' };
    
    const tree1 = render(<RematchIcon {...props1} />).toJSON();
    const tree2 = render(<RematchIcon {...props2} />).toJSON();
    
    expect(tree1).toBeTruthy();
    expect(tree2).toBeTruthy();
    expect(tree1).not.toEqual(tree2); // Different fills should produce different trees
  });
});
