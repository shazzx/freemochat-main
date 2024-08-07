import * as yup from 'yup';

const postPromotionSchema = yup.object().shape({
    numberField: yup.number()
        .typeError('Must be a number')
        .min(2000, 'Minimum reach target is 2000')
        .max(10000, 'Maximum reach target is 10000')
        .required('This field is required'),
});

export default postPromotionSchema;