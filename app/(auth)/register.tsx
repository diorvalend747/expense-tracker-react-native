import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import Input from '@/components/Input';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { verticalScale } from '@/utils/styling';
import { useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import React, { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

const Register = () => {
  const usernameRef = useRef('');
  const emailRef = useRef('');
  const passwordRef = useRef('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const { register: registerUser } = useAuth();

  const handleSubmit = async () => {
    if (!usernameRef || !emailRef.current || !passwordRef.current) {
      Alert.alert('Register', 'Please fill all the fields');
      return;
    }

    setIsLoading(true);
    const response = await registerUser(
      emailRef.current,
      passwordRef.current,
      usernameRef.current
    );
    setIsLoading(false);

    if (!response?.success) {
      Alert.alert('Sign Up', response?.message);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <BackButton iconSize={28} />

        <View style={{ gap: 5, marginTop: spacingY._20 }}>
          <Typo size={30} fontWeight='800'>
            Let's
          </Typo>
          <Typo size={30} fontWeight='800'>
            Get Started
          </Typo>
        </View>

        <View style={styles.form}>
          <Typo size={16} color={colors.textLighter}>
            Create account to track all your expenses
          </Typo>
          <Input
            placeholder='Enter your name'
            onChangeText={(value) => (usernameRef.current = value)}
            icon={
              <Icons.User
                size={verticalScale(26)}
                color={colors.neutral300}
                weight='fill'
              />
            }
          />
          <Input
            placeholder='Enter your email'
            onChangeText={(value) => (emailRef.current = value)}
            icon={
              <Icons.At
                size={verticalScale(26)}
                color={colors.neutral300}
                weight='fill'
              />
            }
          />
          <Input
            placeholder='Enter your password'
            onChangeText={(value) => (passwordRef.current = value)}
            secureTextEntry
            icon={
              <Icons.Lock
                size={verticalScale(26)}
                color={colors.neutral300}
                weight='fill'
              />
            }
          />

          <Typo size={14} color={colors.text} style={{ alignSelf: 'flex-end' }}>
            Forgot Password
          </Typo>

          <Button loading={isLoading} onPress={handleSubmit}>
            <Typo fontWeight='700' color={colors.black} size={21}>
              Register
            </Typo>
          </Button>

          <View style={styles.footer}>
            <Typo
              size={14}
              color={colors.text}
              style={{ alignSelf: 'flex-end' }}
            >
              Already have an account?
            </Typo>
            <Pressable onPress={() => router.navigate('/(auth)/login')}>
              <Typo size={15} fontWeight='700' color={colors.primary}>
                Sign In
              </Typo>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacingY._30,
    paddingHorizontal: spacingX._20,
  },
  welcomeText: {
    fontSize: verticalScale(20),
    fontWeight: 'bold',
    color: colors.text,
  },
  form: {
    gap: spacingY._20,
  },
  forgotPassword: {
    textAlign: 'right',
    fontWeight: '500',
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    fontSize: verticalScale(15),
    color: colors.text,
    textAlign: 'center',
  },
});
