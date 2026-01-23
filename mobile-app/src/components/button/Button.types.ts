export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'outlined' | 'text';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  accessibilityLabel?: string;
}
