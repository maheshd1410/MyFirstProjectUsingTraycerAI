import React from 'react';
import {
  Modal as RNModal,
  View,
  Pressable,
  ScrollView,
  Text,
  StyleSheet,
} from 'react-native';
import { useAppTheme } from '../../theme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  animationType?: 'slide' | 'fade';
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  title,
  animationType = 'slide',
}) => {
  const theme = useAppTheme();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: `rgba(0, 0, 0, ${theme.opacity.pressed})`,
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            padding: theme.spacing.lg,
            maxHeight: '80%',
            zIndex: theme.zIndex.modal,
          }}
          onPress={() => {}}
        >
          {title && (
            <Text
              style={[
                theme.typography.titleLarge,
                {
                  color: theme.colors.onSurface,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              {title}
            </Text>
          )}

          <ScrollView
            scrollEnabled
            nestedScrollEnabled
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </RNModal>
  );
};
