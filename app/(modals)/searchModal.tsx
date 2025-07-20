import BackButton from '@/components/BackButton';
import Header from '@/components/Header';
import Input from '@/components/Input';
import ModalWrapper from '@/components/ModalWrapper';
import TransactionList from '@/components/TransactionList';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import useFetchData from '@/hooks/useFetchData';
import { TransactionType } from '@/types';
import { scale, verticalScale } from '@/utils/styling';
import { limit, orderBy, where } from 'firebase/firestore';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

const SearchModal = () => {
  const { user, updateUserData } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const constraints = [
    where('uid', '==', user?.uid),
    orderBy('date', 'desc'),
    limit(20),
  ];

  const {
    data: allTransactions,
    loading: transactionsLoading,
    error,
  } = useFetchData<TransactionType>('transactions', constraints);

  const filteredTransactions = allTransactions.filter((transaction) => {
    if (searchQuery?.length > 1) {
      if (
        transaction.category
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        transaction.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) {
        return true;
      }
      return false;
    }
    return true;
  });

  return (
    <ModalWrapper style={{ backgroundColor: colors.neutral900 }}>
      <View style={styles.container}>
        <Header
          title={'Search'}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.inputContainer}>
            <Input
              placeholder='Search transactions...'
              value={searchQuery}
              placeholderTextColor={colors.neutral400}
              containerStyle={{ backgroundColor: colors.neutral800 }}
              onChangeText={(value) => setSearchQuery(value)}
            />
          </View>

          <View>
            <TransactionList
              loading={transactionsLoading}
              data={filteredTransactions}
              emptyListMessage='No transactions found'
            />
          </View>
        </ScrollView>
      </View>
    </ModalWrapper>
  );
};

export default SearchModal;

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
