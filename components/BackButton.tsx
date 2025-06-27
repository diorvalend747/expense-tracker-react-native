import { colors, radius } from '@/constants/theme';
import { BackButtonProps } from '@/types';
import { verticalScale } from '@/utils/styling';
import { useRouter } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

const BackButton = ({ style, iconSize = 26 }: BackButtonProps) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      style={[styles.button, style]}
    >
      <CaretLeft
        size={verticalScale(iconSize)}
        color={colors.white}
        weight='bold'
      />
    </TouchableOpacity>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  button: {
    padding: 5,
    alignSelf: 'flex-start',
    backgroundColor: colors.neutral600,
    borderCurve: 'continuous',
    borderRadius: radius._12,
  },
});
