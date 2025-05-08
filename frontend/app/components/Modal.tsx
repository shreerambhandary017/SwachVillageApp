import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
  Platform,
  DimensionValue,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';
import { THEME_SIZING, getShadow } from '../utils/theme';
import Button from './Button';

interface ModalProps {
  visible: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  maxHeight?: DimensionValue;
  width?: DimensionValue;
  showCloseButton?: boolean;
  closeOnBackdropPress?: boolean;
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const Modal: React.FC<ModalProps> = ({
  visible,
  title,
  children,
  onClose,
  footer,
  maxHeight = '80%',
  width = '90%',
  showCloseButton = true,
  closeOnBackdropPress = true,
}) => {
  const { colors, theme } = useTheme();
  
  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  maxHeight: maxHeight,
                  width: width,
                  ...getShadow(4, theme),
                },
              ]}
            >
              {/* Modal Header */}
              {(title || showCloseButton) && (
                <View
                  style={[
                    styles.header,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text
                    style={[styles.title, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                  {showCloseButton && (
                    <TouchableOpacity
                      onPress={onClose}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name="close"
                        size={24}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Modal Content */}
              <ScrollView
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>

              {/* Modal Footer */}
              {footer && (
                <View
                  style={[
                    styles.footer,
                    { borderTopColor: colors.border },
                  ]}
                >
                  {footer}
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

// Confirmation Modal Component
interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmVariant?: 'primary' | 'secondary';
  isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'primary',
  isDestructive = false,
}) => {
  const { colors } = useTheme();
  
  return (
    <Modal
      visible={visible}
      title={title}
      onClose={onCancel}
      footer={
        <View style={styles.confirmationFooter}>
          <Button
            title={cancelLabel}
            variant="outline"
            size="medium"
            style={{ flex: 1, marginRight: THEME_SIZING.spacing.m }}
            onPress={onCancel}
          />
          <Button
            title={confirmLabel}
            variant={confirmVariant}
            size="medium"
            style={{ 
              flex: 1,
              backgroundColor: isDestructive ? colors.error : undefined,
              borderColor: isDestructive ? colors.error : undefined,
            }}
            onPress={onConfirm}
          />
        </View>
      }
    >
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderRadius: THEME_SIZING.borderRadius.large,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME_SIZING.spacing.l,
    paddingVertical: THEME_SIZING.spacing.m,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: THEME_SIZING.fontSize.l,
    fontWeight: '600',
    flex: 1,
  },
  contentContainer: {
    padding: THEME_SIZING.spacing.l,
  },
  footer: {
    borderTopWidth: 1,
    padding: THEME_SIZING.spacing.l,
  },
  confirmationFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  message: {
    fontSize: THEME_SIZING.fontSize.m,
    lineHeight: 24,
  },
});

// Export both components
export { ConfirmationModal };

// Default export for Expo Router
export default Modal;
