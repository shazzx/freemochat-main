import { FieldError, UseFormRegister } from "react-hook-form";
import { z, ZodType } from "zod"; 


export type FormData = {
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
};

export type FormFieldProps = {
    type: string;
    placeholder: string;
    name: ValidFieldNames;
    register: UseFormRegister<FormData>;
    error: FieldError | undefined;
    valueAsNumber?: boolean;
};


export type ValidFieldNames =
    | "firstname"
    | "lastname"
    | "username"
    | "email"
    | "password"
    | "confirmPassword";


export const UserSchema = z
    .object({
        firstname: z.string().max(64, { message: "must be longer than 5 characters" }),
        lastname: z.string().max(32, { message: "must be longer than 5 characters" }),
        username: z.string().min(5, { message: "must be longer than 5 characters" }),
        email: z.string().email(),
        
        password: z
            .string()
            .min(8, { message: "Password is too short" })
            .max(20, { message: "Password is too long" }),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"], 
    });