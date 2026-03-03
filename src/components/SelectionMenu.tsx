import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface SelectionMenuProps {
  onELI5: () => void;
  onCopy: () => void;
  onRemove?: () => void;
  onClose: () => void;
  position?: { x: number; y: number };
  showRemove?: boolean;
}

export default function SelectionMenu({ onELI5, onCopy, onRemove, onClose, position, showRemove }: SelectionMenuProps) {
  return (
    <View style={[styles.container, position && { top: position.y, left: position.x }]}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onELI5}>
        <Text style={styles.buttonText}>ELI5</Text>
      </TouchableOpacity>
      <View style={styles.divider} />
      <TouchableOpacity style={styles.button} onPress={onCopy}>
        <Text style={styles.buttonText}>Copy</Text>
      </TouchableOpacity>
      {showRemove && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.button} onPress={onRemove}>
            <Text style={styles.buttonText}>Remove</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'fixed',
    backgroundColor: '#8E94F2',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 9999,
  },
  closeButton: {
    position: 'absolute',
    top: 2,
    right: 4,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeText: {
    fontSize: 20,
    fontWeight: '400',
    color: '#000',
    lineHeight: 18,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
});
