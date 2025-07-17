import { firestore } from '@/config/firebase';
import { ResponseType, TransactionType, WalletType } from '@/types';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { uploadFileToCloudinary } from './imageService';

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

    if (type === 'expense' && walletData.amount! - amount < amount) {
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
    console.log('error creating or updating transaction: ', error);
    return { success: false, msg: error.message };
  }
};
