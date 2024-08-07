export type TUser = {
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    phone: string;
    bio: string;
    address: {
        country: string,
        city: string,
    }
}