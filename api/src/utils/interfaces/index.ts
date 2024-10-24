export interface CreateUser {
    firstname: string,
    lastname: string,
    username: string,
    email?: string,
    password: string,
    confirmPassword: string,
    address: {
        country?: string,
        city?: string,
        area?: string,
    },
    phone: string,
    tempSecret: string
}