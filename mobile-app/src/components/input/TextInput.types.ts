import { TextInputProps as RNTextInputProps } from 'react-native';

export interface TextInputProps extends RNTextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
}
