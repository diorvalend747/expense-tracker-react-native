import { firestore } from '@/config/firebase';
import { ResponseType, TransactionType, WalletType } from '@/types';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
