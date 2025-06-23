import { colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

const index = () => {
  const router = useRouter();
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/(auth)/welcome');
    }, 2000);

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/splashImage.png')}
        style={styles.logo}
        resizeMode='contain'
      />
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral900,
  },
  logo: {
    aspectRatio: 1,
    height: '20%',
  },
});
