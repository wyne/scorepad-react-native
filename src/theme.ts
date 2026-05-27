import { useColorScheme } from 'react-native';

import { useAppSelector } from '../redux/hooks';

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  tint: string;
  separator: string;
  sheetBackground: string;
  sheetHandle: string;
  destructive: string;
  success: string;
  warning: string;
  headerBackground: string;
  headerText: string;
  inputBackground: string;
  inputText: string;
  badgeBlue: string;
  badgeRed: string;
}

const lightColors: ThemeColors = {
  background: '#F2F2F7',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#F9F9F9',
  text: '#000000',
  textSecondary: '#555555',
  textTertiary: '#999999',
  tint: '#0a84ff',
  separator: '#C8C8CC',
  sheetBackground: '#F2F2F7',
  sheetHandle: '#D1D1D6',
  destructive: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  headerBackground: '#F2F2F7',
  headerText: '#000000',
  inputBackground: '#FFFFFF',
  inputText: '#000000',
  badgeBlue: '#01497C',
  badgeRed: '#c25858',
};

const darkColors: ThemeColors = {
  background: '#000000',
  backgroundSecondary: '#1C1C1E',
  backgroundTertiary: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#EEEEEE',
  textTertiary: '#8E8E93',
  tint: '#0a84ff',
  separator: '#38383A',
  sheetBackground: 'rgb(30,40,50)',
  sheetHandle: '#FFFFFF',
  destructive: '#FF453A',
  success: '#30D158',
  warning: '#FF9F0A',
  headerBackground: '#000000',
  headerText: '#FFFFFF',
  inputBackground: '#222222',
  inputText: '#FFFFFF',
  badgeBlue: '#4DA6E8',
  badgeRed: '#E07070',
};

export function useTheme(): ThemeColors {
  const preference = useAppSelector(state => state.settings.colorScheme);
  const systemScheme = useColorScheme();

  // Treat undefined/missing persisted value as 'system' for backwards compatibility
  const resolved = preference ?? 'system';
  const isDark = resolved === 'dark' || (resolved === 'system' && systemScheme === 'dark');

  return isDark ? darkColors : lightColors;
}
