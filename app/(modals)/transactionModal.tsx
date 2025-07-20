import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import Header from '@/components/Header';
import ImageUpload from '@/components/ImageUpload';
import Input from '@/components/Input';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { expenseCategories, transactionTypes } from '@/constants/data';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import useFetchData from '@/hooks/useFetchData';
import {
  createOrUpdateTransaction,
  deleteTransaction,
} from '@/services/transactionService';
import { TransactionType, WalletType } from '@/types';
import { scale, verticalScale } from '@/utils/styling';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { orderBy, where } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';

const TransactionModal = () => {
  const { user } = useAuth();
  const [transaction, setTransaction] = useState<TransactionType>({
    image: null,
    type: 'expense',
    amount: 0,
    description: '',
    date: new Date(),
    walletId: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    data: wallets,
    loading: walletLoading,
    error: walletError,
  } = useFetchData<WalletType>('wallets', [
    where('uid', '==', user?.uid),
    orderBy('created', 'desc'),
  ]);

  type paramType = {
    id: string;
    type: string;
    image?: any;
    amount: string;
    description?: string;
    category?: string;
    date: string;
    walletId: string;
    uid?: string;
  };

  const oldTransaction: paramType = useLocalSearchParams();

  useEffect(() => {
    if (oldTransaction?.id) {
      setTransaction({
        type: oldTransaction?.type,
        image: oldTransaction?.image,
        amount: Number(oldTransaction?.amount),
        description: oldTransaction?.description || '',
        category: oldTransaction?.category || '',
        date: new Date(oldTransaction?.date),
        walletId: oldTransaction?.walletId,
      });
    }
  }, []);

  const handleChangeFormTransaction = (name: string, value: any) => {
    setTransaction((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSubmit = async () => {
    let { type, image, amount, description, category, date, walletId } =
      transaction;
    if (!walletId || !amount || !date || (type === 'expense' && !category)) {
      Alert.alert('User', 'Please fill all the fields!');
      return;
    }

    const data: TransactionType = {
      type,
      amount,
      description,
      category,
      date,
      walletId,
      image: image || null,
      uid: user?.uid,
    };

    if (oldTransaction?.id) {
      data.id = oldTransaction?.id;
    }

    setLoading(true);
    const response = await createOrUpdateTransaction(data);

    setLoading(false);
    if (response?.success) {
      router.back();
    } else {
      Alert.alert('Transaction', response?.msg || 'Failed to save transaction');
    }
  };

  const onDelete = async () => {
    if (!oldTransaction?.id) return;

    setLoading(true);
    const response = await deleteTransaction(
      oldTransaction?.id,
      oldTransaction?.walletId
    );
    setLoading(false);
    if (response?.success) {
      router.back();
    } else {
      Alert.alert('Transaction', response?.msg);
    }
  };

  const showDeleteAlert = () => {
    Alert.alert(
      'Confirm',
      'Are you sure you want to do delete this transaction?',
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
          title={oldTransaction?.id ? 'Update Transaction' : 'New Transaction'}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              Transaction Name
            </Typo>
            <Dropdown
              style={styles.dropdownContainer}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelectedText}
              iconStyle={styles.dropdownIcon}
              data={transactionTypes}
              maxHeight={300}
              labelField='label'
              valueField='value'
              value={transaction.type}
              itemTextStyle={styles.dropdownItemText}
              itemContainerStyle={styles.dropdownItemContainer}
              containerStyle={styles.dropdownListContainer}
              activeColor={colors.neutral700}
              placeholder='Select Type'
              onChange={(item) =>
                handleChangeFormTransaction('type', item.value)
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              Wallet
            </Typo>
            <Dropdown
              style={styles.dropdownContainer}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelectedText}
              iconStyle={styles.dropdownIcon}
              data={wallets.map((wallet) => ({
                label: `${wallet.name} - ($${wallet.amount})`,
                value: wallet.id,
              }))}
              maxHeight={300}
              labelField='label'
              valueField='value'
              value={transaction.walletId}
              itemTextStyle={styles.dropdownItemText}
              itemContainerStyle={styles.dropdownItemContainer}
              containerStyle={styles.dropdownListContainer}
              activeColor={colors.neutral700}
              placeholder='Select Wallet'
              onChange={(item) =>
                handleChangeFormTransaction('walletId', item.value)
              }
            />
          </View>

          {/* Expense Category */}

          {transaction.type === 'expense' && (
            <View style={styles.inputContainer}>
              <Typo color={colors.neutral200} size={16}>
                Expense Category
              </Typo>
              <Dropdown
                style={styles.dropdownContainer}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownSelectedText}
                iconStyle={styles.dropdownIcon}
                data={Object.values(expenseCategories)}
                maxHeight={300}
                labelField='label'
                valueField='value'
                itemTextStyle={styles.dropdownItemText}
                itemContainerStyle={styles.dropdownItemContainer}
                containerStyle={styles.dropdownListContainer}
                activeColor={colors.neutral700}
                placeholder='Select Category'
                value={transaction.category}
                onChange={(item) =>
                  handleChangeFormTransaction('category', item.value)
                }
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              Date
            </Typo>
            {!showDatePicker && (
              <Pressable
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Typo size={14}>
                  {(transaction.date as Date).toLocaleDateString()}
                </Typo>
              </Pressable>
            )}

            {showDatePicker && (
              <View style={Platform.OS === 'ios' && styles.iosDatePicker}>
                <DateTimePicker
                  value={transaction.date as Date}
                  mode='date'
                  display='spinner'
                  textColor={colors.white}
                  onChange={(_, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      handleChangeFormTransaction('date', date);
                    } else {
                      handleChangeFormTransaction('date', transaction.date);
                    }
                  }}
                />

                {Platform.OS === 'ios' && (
                  <Pressable
                    style={styles.datepickerButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Typo size={15} fontWeight='500'>
                      OK
                    </Typo>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* Amount */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>
              Amount
            </Typo>
            <Input
              keyboardType='numeric'
              // placeholder='Enter Amount'
              value={transaction.amount.toString()}
              onChangeText={(value) =>
                handleChangeFormTransaction(
                  'amount',
                  Number(value.replace(/[^0-9.-]+/g, ''))
                )
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.flexRow}>
              <Typo color={colors.neutral200} size={16}>
                Description
              </Typo>
              <Typo color={colors.neutral700} size={14}>
                (Optional)
              </Typo>
            </View>
            <Input
              // placeholder='Enter Amount'
              multiline
              numberOfLines={4}
              value={transaction.description}
              onChangeText={(value) =>
                handleChangeFormTransaction('description', value)
              }
              containerStyle={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                height: verticalScale(100),
                paddingVertical: 15,
              }}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.flexRow}>
              <Typo color={colors.neutral200} size={16}>
                Receipt
              </Typo>
              <Typo color={colors.neutral700} size={14}>
                (Optional)
              </Typo>
            </View>
            <ImageUpload
              placeholder='Upload Image'
              file={transaction.image}
              onClear={() => handleChangeFormTransaction('image', null)}
              onSelect={(file) => handleChangeFormTransaction('image', file)}
            />
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        {oldTransaction?.id && !loading && (
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
            {oldTransaction?.id ? 'Update' : 'Submit'}
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
    gap: spacingY._20,
    paddingVertical: spacingY._15,
    paddingBottom: spacingY._40,
  },
  dropdownIcon: {
    height: verticalScale(30),
    tintColor: colors.neutral300,
  },
  dropdownItemContainer: {
    borderRadius: radius._15,
    marginHorizontal: spacingX._7,
  },
  dropdownPlaceholder: {
    color: colors.white,
  },
  dropdownListContainer: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    borderCurve: 'continuous',
    paddingVertical: spacingY._7,
    top: 5,
    borderColor: colors.neutral500,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
  },
  dropdownItemText: {
    color: colors.white,
  },
  dropdownSelectedText: {
    color: colors.white,
    fontSize: verticalScale(14),
  },
  dropdownContainer: {
    height: verticalScale(54),
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: radius._15,
    paddingHorizontal: spacingX._15,
    borderCurve: 'continuous',
  },
  datepickerButton: {
    backgroundColor: colors.neutral700,
    alignSelf: 'flex-end',
    padding: spacingY._7,
    marginRight: spacingX._7,
    paddingHorizontal: spacingY._15,
    borderRadius: radius._10,
  },
  iosDatePicker: {},
  dateInput: {
    flexDirection: 'row',
    height: verticalScale(54),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: radius._17,
    borderCurve: 'continuous',
    paddingHorizontal: spacingX._15,
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._5,
  },
  androidDropdown: {
    height: verticalScale(54),
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: radius._17,
    borderCurve: 'continuous',
    // paddingHorizontal: spacingX._15,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: verticalScale(14),
    color: colors.white,
  },
  iosDropdown: {
    height: verticalScale(54),
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: radius._17,
    borderCurve: 'continuous',
    paddingHorizontal: spacingX._15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: verticalScale(14),
    color: colors.white,
  },
  inputContainer: {
    gap: spacingY._10,
  },
});
