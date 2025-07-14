import { firestore } from '@/config/firebase';
import { ResponseType, UserDataType } from '@/types';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadFileToCloudinary } from './imageService';

export const updateUser = async (
  uid: string,
  updateData: UserDataType
): Promise<ResponseType> => {
  try {
    if (updateData.image && updateData?.image?.uri) {
      const imageUploadResponse = await uploadFileToCloudinary(
        updateData.image,
        'users'
      );

      if (!imageUploadResponse.success) {
        return {
          success: false,
          msg: imageUploadResponse.msg || 'Failed to upload image',
        };
      }

      updateData.image = imageUploadResponse?.data;
    }

    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, updateData);
    return { success: true, msg: 'Updated successfully' };
  } catch (error: any) {
    console.log('error updating user: ', error);
    return { success: false, msg: error?.message };
  }
};
