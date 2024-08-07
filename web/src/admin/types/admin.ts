import * as yup from 'yup';

export const AdminSchema = yup.object().shape({
    firstname: yup.string()
      .min(6, 'Name must be at least 2 characters')
      .max(36, 'Name must not exceed 50 characters')
      .required('Name is required'),
    lastname: yup
      .string()
      .min(6, 'Name must be at least 2 characters')
      .max(36, 'Name must not exceed 50 characters'),
    username: yup.string()
      .min(6, 'Handle must be at least 6 characters')
      .max(30, 'Handle must not exceed 30 characters')
      // .matches(/^[a-z0-9_]+$/, 'Handle must contain only lowercase letters, numbers, and underscores')
      // .test('unique-handle', 'This handle is already taken', async (value) => {
      //   if (value && value.length >= 6) {
      //     try {
      //       const response = await axiosClient.get(`page/handleExists?handle=${value}`);
      //       console.log(response.data)
      //       return response.data;
      //     } catch (error) {
      //       console.error('Error checking handle availability:', error);
      //       return true; // Assume available in case of error
      //     }
      //   }
      //   return true;
      // })
      .required('Handle is required'),
    email: yup
      .string().email()
      .required('emai is required'),
  });
  