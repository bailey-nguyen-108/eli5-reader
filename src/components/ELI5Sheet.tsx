import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { ELI5Term } from '../types/ELI5';
import ELI5Sticker from './ELI5Sticker';
import Svg, { Path, Polyline, Line } from 'react-native-svg';

interface ELI5SheetProps {
  term: ELI5Term;
  onSave?: () => void;
  onShare?: () => void;
  onMore?: () => void;
  onClose?: () => void;
}

export default function ELI5Sheet({ term, onSave, onShare, onMore, onClose }: ELI5SheetProps) {
  // Render ELI5 explanation sheet
  return (
    <TouchableOpacity
      style={styles.overlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <View style={styles.container} onStartShouldSetResponder={() => true}>
      {/* Sticker Badge */}
      <View style={styles.stickerContainer}>
        <ELI5Sticker />
      </View>

      {/* Sheet Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.termContainer}>
            <Text style={styles.termText}>
              {(() => {
                const words = term.term.split(' ');
                if (words.length === 1) {
                  return term.term;
                }
                return (
                  <>
                    {words[0]}{' '}
                    <Text style={styles.simpleTermText}>
                      {words.slice(1).join(' ')}
                    </Text>
                  </>
                );
              })()}
            </Text>
          </View>
        </View>

        {/* Explanation */}
        <Text style={styles.explanation}>{term.explanation}</Text>

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
            <Text style={styles.primaryButtonText}>Got it, thanks!</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onSave}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z" stroke="#000" fill="none" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>
    </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  stickerContainer: {
    position: 'absolute',
    top: -40,
    left: 20,
    zIndex: 5,
  },
  content: {
    gap: 24,
  },
  header: {
    gap: 4,
    marginTop: 12,
  },
  termContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  termText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.96,
    lineHeight: 36,
    color: '#000',
  },
  simpleTermText: {
    fontFamily: 'Playfair Display, serif',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  explanation: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    fontWeight: '400',
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 100,
    backgroundColor: '#4DFF7E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 100,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});
