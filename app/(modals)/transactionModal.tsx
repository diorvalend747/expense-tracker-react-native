import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import Header from '@/components/Header';
import ImageUpload from '@/components/ImageUpload';
import Input from '@/components/Input';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { createOrUpdateWallet, deleteWallet } from '@/services/walletService';
import { WalletType } from '@/types';
import { scale, verticalScale } from '@/utils/styling';
import { router, useLocalSearchParams } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

const TransactionModal = () => {
  const { user, updateUserData } = useAuth();
  const [wallet, setWallet] = useState<WalletType>({
    name: '',
    image: null,
  });
  const [loading, setLoading] = useState(false);

  const oldWallet: { name: string; image: string; id: string } =
    useLocalSearchParams();

  useEffect(() => {
    if (oldWallet?.id) {
      setWallet({
        name: oldWallet?.name,
        image: oldWallet?.image,
      });
    }
  }, []);

  const handleChangeFormWallet = (name: string, value: any) => {
    setWallet((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSubmit = async () => {
    let { name, image } = wallet;
    if (!name.trim() || !image) {
      Alert.alert('User', 'Please fill all the fields!');
      return;
    }

    const data: WalletType = {
      name,
      image,
      uid: user?.uid,
    };

    if (oldWallet?.id) data.id = oldWallet?.id;

    setLoading(true);
    const response = await createOrUpdateWallet(data);
    setLoading(false);

    if (response.success) {
      updateUserData(user?.uid as string);
      router.back();
    } else {
      Alert.alert('Wallet', response.msg);
    }
  };

  const onDelete = async () => {
    if (!oldWallet?.id) return;

    setLoading(true);
    const response = await deleteWallet(oldWallet?.id);
    setLoading(false);
    if (response?.success) {
      router.back();
    } else {
      Alert.alert('Wallet', response?.msg);
    }
  };

  const showDeleteAlert = () => {
    Alert.alert(
      'Confirm',
      'Are you sure you want to do this? \nThis action will remove all the transactions related to this wallet',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('cancel delete'),
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => onDelete(),
          style: 'destructive',
        },
      ]
    );
  };
  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title={oldWallet?.id ? 'Update Wallet' : 'New Wallet'}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Wallet Name</Typo>
            <Input
              placeholder='Name'
              value={wallet.name}
              onChangeText={(value) => handleChangeFormWallet('name', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Wallet Icon</Typo>
            <ImageUpload
              placeholder='Upload Image'
              file={wallet.image}
              onClear={() => handleChangeFormWallet('image', null)}
              onSelect={(file) => handleChangeFormWallet('image', file)}
            />
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        {oldWallet?.id && !loading && (
          <Button
            onPress={showDeleteAlert}
            style={{
              backgroundColor: colors.rose,
              paddingHorizontal: spacingX._15,
            }}
          >
            <Icons.Trash
              color={colors.white}
              size={verticalScale(24)}
              weight='bold'
            />
          </Button>
        )}
        <Button onPress={onSubmit} loading={loading} style={{ flex: 1 }}>
          <Typo color={colors.black} fontWeight='700'>
            {oldWallet?.id ? 'Update Wallet' : 'Add Wallet'}
          </Typo>
        </Button>
      </View>
    </ModalWrapper>
  );
};

export default TransactionModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacingY._20,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    borderTopColor: colors.neutral700,
    marginBottom: spacingY._25,
    borderTopWidth: 1,
  },
  form: {
    gap: spacingY._30,
    marginTop: spacingY._15,
  },
  avatarContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  avatar: {
    alignSelf: 'center',
    backgroundColor: colors.neutral300,
    height: verticalScale(135),
    width: verticalScale(135),
    borderRadius: 200,
    borderWidth: 1,
    borderColor: colors.neutral500,
  },
  editIcon: {
    position: 'absolute',
    bottom: spacingY._5,
    right: spacingY._7,
    borderRadius: 100,
    backgroundColor: colors.neutral100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    padding: spacingY._7,
  },
  inputContainer: {
    gap: spacingY._10,
  },
});
