import { z } from 'zod'
import * as yup from 'yup';
import { axiosClient } from '@/api/axiosClient';

export const SignupUserSchema = z.object({
  firstname: z.string(),
  lastname: z.string(),
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
  confirmPassword: z.string()
})


export const LoginUserSchema = z.object({
  username: z.string(),
  password: z.string()
})


export const PageCreateSchema = yup.object().shape({
  name: yup
    .string()
    .min(6, 'Name must be at least 2 characters')
    .max(36, 'Name must not exceed 50 characters')
    .required('Name is required'),
  handle: yup.string()
    .min(6, 'Handle must be at least 6 characters')
    .max(30, 'Handle must not exceed 30 characters')
    .matches(/^[a-z0-9_]+$/, 'Handle must contain only lowercase letters, numbers, and underscores')
    .test('unique-handle', 'This handle is already taken', async (value) => {
      if (value && value.length >= 6) {
        try {
          const response = await axiosClient.get(`page/handleExists?handle=${value}`);
          console.log(response.data)
          return response.data;
        } catch (error) {
          console.error('Error checking handle availability:', error);
          return true; // Assume available in case of error
        }
      }
      return true;
    })
    .required('Handle is required'),
  bio: yup
    .string()
    .max(120, 'Bio must not exceed 120 characters'),
  about: yup
    .string()
    .max(500, 'About must not exceed 500 characters')
    .required('About is required'),
});


export const UserSchema = yup.object().shape({
  firstname: yup.string()
    .min(3, 'Name must be at least 3 characters')
    .max(36, 'Name must not exceed 36 characters')
    .required('Name is required'),
  lastname: yup
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(36, 'Name must not exceed 50 characters'),
  username: yup.string()
    .min(6, 'Username must be at least 6 characters')
    .max(30, 'Username must not exceed 30 characters')
    .matches(/^[a-z0-9_]+$/, 'Handle must contain only lowercase letters, numbers, and underscores')
    .test('unique-handle', 'This handle is already taken', async (value) => {
      if (value && value.length >= 6) {
        try {
          const response = await axiosClient.post(`user/username-exists`, { username: value });
          console.log(response.data)
          return response.data.success;
        } catch (error) {
          console.error('Error checking handle availability:', error);
          return false; // Assume available in case of error
        }
      }
      return false;
    })
    .required('username is required'),
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
  // .required('Handle is required'),
  // email: yup
  // .string().email()
  // .required('emai is required'),
  // phone: yup.number().required('phone no is required'),
  // address: yup.object({
  // country: yup.string().required("country is required"),
  // city: yup.string().required('city is required'),
  // area: yup.string().required('area is required')
  // }),
  bio: yup.string().max(160, "bio should not exceed 160 characters"),
  // password: yup.string().min(8, "password atleast be 8 characters long"),
  // confirmPassword: yup.string().required().oneOf([yup.ref('password'), null], "Passwords Must Match")
});


export const SignupSchema = yup.object().shape({
  firstname: yup.string()
    .min(3, 'Name must be at least 3 characters')
    .max(36, 'Name must not exceed 50 characters')
    .required('Name is required'),
  lastname: yup
    .string()
    .min(3, 'Name must be at least 2 characters')
    .max(24, 'Name must not exceed 24 characters'),
  username: yup.string().min(3, 'Username must be at least 3 characters long')
    .max(20, 'Username cannot exceed 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .test('no-email', 'Username cannot be in an email format', (value) => {
      if (!value) return true; // Handle empty values

      // Prevent '@' symbol
      if (value.includes('@')) return false;

      // Prevent email-like patterns
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !emailPattern.test(value);
    })
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
    .required('username is required'),
  // email: yup
  //   .string().email()
  //   .required('emai is required'),
  phone: yup.string().required('phone no is required'),
  address: yup.object({
    // country: yup.string().required("country is required"),
    // city: yup.string().required('city is required'),
    area: yup.string().required("area is required")
  }),
  bio: yup.string().max(160, "bio should not exceed 160 characters").optional(),
  password: yup.string().min(8, "password atleast be 8 characters long"),
  confirmPassword: yup.string().required().oneOf([yup.ref('password'), null], "Passwords Must Match")
});


export const GroupCreateSchema = yup.object().shape({
  name: yup
    .string()
    .min(6, 'Name must be at least 6 characters')
    .max(36, 'Name must not exceed 36 characters')
    .required('Name is required'),
  handle: yup.string()
    .min(6, 'Handle must be at least 6 characters')
    .max(30, 'Handle must not exceed 24 characters')
    .matches(/^[a-z0-9_]+$/, 'Handle must contain only lowercase letters, numbers, and underscores')
    .test('unique-handle', 'This handle is already taken', async (value) => {
      if (value && value.length >= 6) {
        try {
          const response = await axiosClient.get(`groups/handleExists?handle=${value}`);
          console.log(response.data)
          return response.data;
        } catch (error) {
          console.error('Error checking handle availability:', error);
          return true; // Assume available in case of error
        }
      }
      return true;
    })
    .required('Handle is required'),
  bio: yup
    .string()
    .max(300, 'Bio must not exceed 120 characters'),
  description: yup
    .string()
    .max(300, 'About must not exceed 300 characters')
    .required('About is required'),
});

export const ChatGroupCreate = yup.object().shape({
  name: yup
    .string()
    .min(6, 'Name must be at least 6 characters')
    .max(36, 'Name must not exceed 36 characters')
    .required('Name is required'),
  description: yup
    .string()
    .max(300, 'About must not exceed 300 characters')
    .required('About is required'),
});


