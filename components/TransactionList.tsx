import { expenseCategories } from '@/constants/data';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import { TransactionItemProps, TransactionListType } from '@/types';
import { verticalScale } from '@/utils/styling';
import { FlashList } from '@shopify/flash-list';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Loading from './Loading';
import Typo from './Typo';

const TransactionList = ({
  data,
  title,
  loading,
  emptyListMessage,
}: TransactionListType) => {
  const handleClick = () => {
    console.log('test');
  };
  return (
    <View style={styles.container}>
      {title && (
        <Typo size={20} fontWeight='500'>
          {title}
        </Typo>
      )}

      <View style={styles.list}>
        <FlashList
          data={data}
          renderItem={({ item, index }) => (
            <TransactionItem
              item={item}
              index={index}
              handleClick={handleClick}
            />
          )}
        />
      </View>

      {!loading && data.length === 0 && (
        <Typo
          size={15}
          color={colors.neutral400}
          style={{ textAlign: 'center', marginTop: spacingY._15 }}
        >
          {emptyListMessage}
        </Typo>
      )}

      {loading && (
        <View style={{ top: verticalScale(100) }}>
          <Loading />
        </View>
      )}
    </View>
  );
};

const TransactionItem = ({
  item,
  index,
  handleClick,
}: TransactionItemProps) => {
  let category = expenseCategories['utilities'];
  //   let category = incomeCategory;
  const IconComponent = category.icon;
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 75)
        .springify()
        .damping(14)}
    >
      <TouchableOpacity style={styles.row} onPress={() => handleClick(item)}>
        <View style={[styles.icon, { backgroundColor: category.bgColor }]}>
          {IconComponent && (
            <IconComponent
              size={verticalScale(25)}
              color={colors.white}
              weight='fill'
            />
          )}
        </View>

        <View style={styles.categoryDesc}>
          <Typo size={17}>{category.label}</Typo>
          <Typo
            size={12}
            color={colors.neutral400}
            textProps={{ numberOfLines: 1 }}
          >
            Token Listrik
          </Typo>
        </View>

        <View style={styles.amountDate}>
          <Typo fontWeight='500' color={colors.green}>
            + $23
          </Typo>
          <Typo size={13} color={colors.neutral400}>
            10 Jul
          </Typo>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default TransactionList;

const styles = StyleSheet.create({
  amountDate: {
    alignItems: 'flex-end',
    gap: 3,
  },
  categoryDesc: {
    flex: 1,
    gap: 2.5,
  },
  icon: {
    height: verticalScale(44),
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius._12,
    borderCurve: 'continuous',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacingX._12,
    marginBottom: spacingY._12,
    backgroundColor: colors.neutral800,
    padding: spacingY._10,
    paddingHorizontal: spacingY._10,
    borderRadius: radius._17,
  },
  list: {
    minHeight: 3,
  },
  container: {
    gap: spacingY._17,
  },
});
