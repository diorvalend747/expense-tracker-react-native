import { firestore } from '@/config/firebase';
import { colors } from '@/constants/theme';
import { ResponseType, TransactionType, WalletType } from '@/types';
import { getLast12Months, getLast7Days, getYearsRange } from '@/utils/common';
import { scale } from '@/utils/styling';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { uploadFileToCloudinary } from './imageService';
import { createOrUpdateWallet } from './walletService';

export const createOrUpdateTransaction = async (
  transactionData: Partial<TransactionType>
): Promise<ResponseType> => {
  try {
    const { id, type, walletId, amount, image } = transactionData;

    if (!amount || amount <= 0 || !walletId || !type) {
      return { success: false, msg: 'Invalid transaction' };
    }

    if (id) {
      // Update existing transaction
      const oldTransactionDoc = await getDoc(
        doc(firestore, 'transactions', id)
      );
      const oldTransaction = oldTransactionDoc.data() as TransactionType;
      const shouldReverOriginal =
        oldTransaction?.type !== type ||
        oldTransaction?.walletId !== walletId ||
        oldTransaction?.amount !== amount;

      if (shouldReverOriginal) {
        // Revert original transaction from wallet
        let response = await revertAndUpdateWallets(
          oldTransaction,
          Number(amount),
          type,
          walletId
        );
        if (!response.success) {
          return response;
        }
      }
    } else {
      // Update wallet for new transaction
      let response = await updateWalletForNewTransaction(
        walletId!,
        Number(amount!),
        type
      );
      if (!response.success) {
        return response;
      }
    }

    if (image) {
      const imageUploadResponse = await uploadFileToCloudinary(
        image,
        'transactions'
      );

      if (!imageUploadResponse.success) {
        return {
          success: false,
          msg: imageUploadResponse.msg || 'Failed to upload receipt',
        };
      }

      transactionData.image = imageUploadResponse?.data;
    }

    const transactionRef = id
      ? doc(firestore, 'transactions', id)
      : doc(collection(firestore, 'transactions'));

    await setDoc(transactionRef, transactionData, { merge: true });

    return {
      success: true,
      data: { ...transactionData, id: transactionRef.id },
      msg: 'Transaction saved successfully',
    };
  } catch (error: any) {
    console.log('error creating or updating transactions: ', error);
    return { success: false, msg: error.message };
  }
};

const updateWalletForNewTransaction = async (
  walletId: string,
  amount: number,
  type: string
) => {
  try {
    const walletRef = doc(firestore, 'wallets', walletId);
    const walletDoc = await getDoc(walletRef);

    if (!walletDoc.exists()) {
      return { success: false, msg: 'Wallet not found' };
    }

    const walletData = walletDoc.data() as WalletType;

    if (type === 'expense' && walletData.amount! - amount < 0) {
      return { success: false, msg: 'Insufficient funds in wallet' };
    }

    const updateType = type === 'income' ? 'totalIncome' : 'totalExpenses';
    const updateWalletAmount =
      type === 'income'
        ? Number(walletData.amount) + amount
        : Number(walletData.amount) - amount;

    const updatedTotals =
      type === 'income'
        ? Number(walletData.totalIncome) + amount
        : Number(walletData.totalExpenses) + amount;

    await updateDoc(walletRef, {
      amount: updateWalletAmount,
      [updateType]: updatedTotals,
    });

    return { success: true };
  } catch (error: any) {
    console.log('error updating wallet for new transaction: ', error);
    return { success: false, msg: error.message };
  }
};

const revertAndUpdateWallets = async (
  oldTransaction: TransactionType,
  newTransactionAmount: number,
  newTransactionType: string,
  newWalletId: string
) => {
  try {
    const originalWalletDoc = await getDoc(
      doc(firestore, 'wallets', oldTransaction?.walletId)
    );

    const originalWalletData = originalWalletDoc.data() as WalletType;

    let newWalletDoc = await getDoc(doc(firestore, 'wallets', newWalletId));
    let newWalletData = newWalletDoc.data() as WalletType;

    const revertType =
      oldTransaction?.type === 'income' ? 'totalIncome' : 'totalExpenses';

    const revertIncomeExpense: number =
      oldTransaction?.type === 'income'
        ? -Number(oldTransaction.amount)
        : Number(oldTransaction.amount);

    const revertedWalletAmount =
      Number(originalWalletData.amount) + revertIncomeExpense;
    // Wallet amount after reverting the old transaction

    const revertedIncomeExpenseAmount =
      Number(originalWalletData[revertType]) - Number(oldTransaction.amount);

    if (newTransactionType === 'expense') {
      // If user tries to convert income to expense on the same wallet
      // or if the user tries to increase the expense amount and don't have enough funds
      if (
        oldTransaction.walletId === newWalletId &&
        revertedWalletAmount < newTransactionAmount
      ) {
        return {
          success: false,
          msg: 'Insufficient funds in wallet for this transaction',
        };
      }

      // If user tries to add expense from a new wallet but the wallet dont't have enough funds
      if (
        oldTransaction.walletId !== newWalletId &&
        newWalletData.amount! < newTransactionAmount
      ) {
        return {
          success: false,
          msg: 'Insufficient funds in selected wallet for this transaction',
        };
      }
    }

    await createOrUpdateWallet({
      id: oldTransaction?.walletId,
      amount: revertedWalletAmount,
      [revertType]: revertedIncomeExpenseAmount,
    });

    ///////////////////////////////////////////////

    // Refetch the new wallet because we may have just updated it
    newWalletDoc = await getDoc(doc(firestore, 'wallets', newWalletId));
    newWalletData = newWalletDoc.data() as WalletType;

    const updateType =
      newTransactionType === 'income' ? 'totalIncome' : 'totalExpenses';

    const updatedTransactionAmount: number =
      newTransactionType === 'income'
        ? Number(newTransactionAmount)
        : -Number(newTransactionAmount);

    const newWalletAmount =
      Number(newWalletData.amount) + updatedTransactionAmount;

    const newIncomeExpenseAmount =
      Number(newWalletData[updateType]) + Number(newTransactionAmount);

    await createOrUpdateWallet({
      id: newWalletId,
      amount: newWalletAmount,
      [updateType]: newIncomeExpenseAmount,
    });

    return { success: true };
  } catch (error: any) {
    console.log('error creating or updating transaction: ', error);
    return { success: false, msg: error.message };
  }
};

export const deleteTransaction = async (
  transactionId: string,
  walletId: string
) => {
  try {
    const transactionRef = doc(firestore, 'transactions', transactionId);
    const transactionDoc = await getDoc(transactionRef);

    if (!transactionDoc.exists()) {
      return { success: false, msg: 'Transaction not found' };
    }

    const transactionData = transactionDoc.data() as TransactionType;

    const transactionType = transactionData.type;
    const transactionAmount = transactionData.amount;

    // Fetch the wallet to revert the transaction
    const walletDoc = await getDoc(doc(firestore, 'wallets', walletId));
    const walletData = walletDoc.data() as WalletType;

    // Check fields to be updated base on transaction type
    const updateType =
      transactionType === 'income' ? 'totalIncome' : 'totalExpenses';

    const newWalletAmount =
      walletData?.amount! -
      (transactionType === 'income' ? transactionAmount : -transactionAmount);

    const newIncomeExpenseAmount =
      walletData?.[updateType]! - transactionAmount;

    // If its expense and the wallet amount can go below zero
    if (transactionType === 'expense' && newWalletAmount < 0) {
      return { success: false, msg: 'Cannot delete this transaction' };
    }

    await createOrUpdateWallet({
      id: walletId,
      amount: newWalletAmount,
      [updateType]: newIncomeExpenseAmount,
    });

    await deleteDoc(transactionRef);

    return { success: true, msg: 'Transaction deleted successfully' };
  } catch (error: any) {
    console.log('error deleting transaction: ', error);
    return { success: false, msg: error.message };
  }
};

export const fetchWeeklyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const db = firestore;
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const transactionQuery = query(
      collection(db, 'transactions'),
      where('uid', '==', uid),
      where('date', '>=', Timestamp.fromDate(sevenDaysAgo)),
      where('date', '<=', Timestamp.fromDate(today)),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(transactionQuery);
    const weeklyData = getLast7Days();
    const transactions: TransactionType[] = [];

    // Mapping transactions to the last 7 days
    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType;
      transaction.id = doc.id;
      transactions.push(transaction);

      const transactionDate = (transaction.date as Timestamp)
        .toDate()
        .toDateString()
        .split('T')[0]; // as specific date

      const test = new Date('2025-07-20');

      console.log(test.toDateString(), 'transaction.date');
      console.log(transactionDate, 'trans');

      const dayData = weeklyData.find(
        (day) => new Date(day.date).toDateString() === transactionDate
      );

      console.log(weeklyData, 'weeklyData');

      if (dayData) {
        if (transaction.type === 'income') {
          dayData.income += transaction.amount;
        } else {
          dayData.expense += transaction.amount;
        }
      }
    });

    // Prepare the stats data: takes the last 7 days and maps the income and expense into two entries in an array
    const stats = weeklyData.flatMap((day) => [
      {
        value: day.income,
        label: day.day,
        frontColor: colors.primary,
        spacing: scale(4),
        labelWidth: scale(30),
      },
      {
        value: day.expense,
        frontColor: colors.rose,
      },
    ]);

    return {
      success: true,
      data: {
        stats,
        transactions,
      },
    };
  } catch (error: any) {
    console.log('error fetching weekly stats: ', error);
    return { success: false, msg: error.message };
  }
};

export const fetchMonthlyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const db = firestore;
    const today = new Date();
    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setMonth(today.getMonth() - 12);

    const transactionQuery = query(
      collection(db, 'transactions'),
      where('uid', '==', uid),
      where('date', '>=', Timestamp.fromDate(twelveMonthsAgo)),
      where('date', '<=', Timestamp.fromDate(today)),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(transactionQuery);
    const monthlyData = getLast12Months();
    const transactions: TransactionType[] = [];

    // Mapping transactions for the last 12 months
    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType;
      transaction.id = doc.id;
      transactions.push(transaction);

      const transactionDate = (transaction.date as Timestamp).toDate();
      const monthName = transactionDate.toLocaleString('default', {
        month: 'short',
      });
      const shortYear = transactionDate.getFullYear().toString().slice(-2);
      const monthData = monthlyData.find(
        (month) => month.month === `${monthName} ${shortYear}`
      );

      if (monthData) {
        if (transaction.type === 'income') {
          monthData.income += transaction.amount;
        } else {
          monthData.expense += transaction.amount;
        }
      }
    });

    // Prepare the stats data: takes the 1 month and maps the income and expense into two entries in an array
    const stats = monthlyData.flatMap((month) => [
      {
        value: month.income,
        label: month.month,
        frontColor: colors.primary,
        spacing: scale(4),
        labelWidth: scale(30),
      },
      {
        value: month.expense,
        frontColor: colors.rose,
      },
    ]);

    return {
      success: true,
      data: {
        stats,
        transactions,
      },
    };
  } catch (error: any) {
    console.log('error fetching monthly stats: ', error);
    return { success: false, msg: error.message };
  }
};

export const fetchYearlyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const db = firestore;

    const transactionQuery = query(
      collection(db, 'transactions'),
      where('uid', '==', uid),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(transactionQuery);
    const transactions: TransactionType[] = [];

    const firstTransaction = querySnapshot.docs.reduce((earliest, doc) => {
      const transactionDate = (doc.data().date as Timestamp).toDate();
      return transactionDate < earliest ? transactionDate : earliest;
    }, new Date());

    const startYear = firstTransaction.getFullYear();
    const currentYear = new Date().getFullYear();

    const yearlyData = getYearsRange(startYear, currentYear);

    // Mapping transactions for every year
    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionType;
      transaction.id = doc.id;
      transactions.push(transaction);

      const transactionYear = (transaction.date as Timestamp)
        .toDate()
        .getFullYear();

      const yearData = yearlyData.find(
        (item: any) => item.year === transactionYear.toString()
      );

      if (yearData) {
        if (transaction.type === 'income') {
          yearData.income += transaction.amount;
        } else {
          yearData.expense += transaction.amount;
        }
      }
    });

    // Prepare the stats data: takes every year and maps the income and expense into two entries in an array
    const stats = yearlyData.flatMap((year: any) => [
      {
        value: year.income,
        label: year.year,
        frontColor: colors.primary,
        spacing: scale(4),
        labelWidth: scale(35),
      },
      {
        value: year.expense,
        frontColor: colors.rose,
      },
    ]);

    return {
      success: true,
      data: {
        stats,
        transactions,
      },
    };
  } catch (error: any) {
    console.log('error fetching yearly stats: ', error);
    return { success: false, msg: error.message };
  }
};
