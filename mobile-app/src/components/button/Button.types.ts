export interface ButtonProps {
  label?: string;
  children?: React.ReactNode;
  title?: string;
  onPress: () => void;
  variant?: 'filled' | 'outlined' | 'text';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  style?: any;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}
