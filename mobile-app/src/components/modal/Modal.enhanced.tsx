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
import { FadeIn, SlideIn } from '../../animations';
import { getAccessibilityHint } from '../../utils/accessibility';

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
      animationType="none" // We handle animations ourselves
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      {/* Backdrop with FadeIn animation */}
      <FadeIn duration={200}>
        <Pressable
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: `rgba(0, 0, 0, ${theme.opacity.pressed})`,
          }}
          onPress={onClose}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Close modal"
          accessibilityHint={getAccessibilityHint('close modal')}
        >
          {/* Content with SlideIn animation */}
          <SlideIn direction="up" duration={250}>
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
              accessible
              accessibilityLabel={title || 'Modal content'}
            >
              {title && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: theme.spacing.md,
                  }}
                >
                  <Text
                    style={[
                      theme.typography.titleLarge,
                      {
                        color: theme.colors.onSurface,
                        flex: 1,
                      },
                    ]}
                    accessibilityRole="header"
                  >
                    {title}
                  </Text>
                  <Pressable
                    onPress={onClose}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    accessibilityHint={getAccessibilityHint('close modal')}
                    style={{
                      padding: theme.spacing.sm,
                      minWidth: 44,
                      minHeight: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 24, color: theme.colors.onSurfaceVariant }}>✕</Text>
                  </Pressable>
                </View>
              )}

              <ScrollView
                scrollEnabled
                nestedScrollEnabled
                accessible={false}
              >
                {children}
              </ScrollView>
            </Pressable>
          </SlideIn>
        </Pressable>
      </FadeIn>
    </RNModal>
  );
};
