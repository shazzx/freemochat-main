export type TUser = {
    _id: string;
    firstname: string;
    lastname?: string;
    username: string;
    email: string;
    phone: string;
    bio?: string;
    education?: {
        institution: string,
        degree: string,
        fieldOfStudy: string,
        startYear: string,
        endYear: number,
        description: string,
    }[]
    workExperience?: {
        jobTitle: string,
        company: string,
        totalYears: number,
        description: string,
    }[]
    socialMedia?: {
        facebook: string,
        instagram: string,
        linkedin: string,
        whatsapp: string,
    },
    website?: string,
    dateOfBirth?: string
    maritalStatus?: string
    address: {
        country: string,
        city: string,
        area: string
    }

    createdAt: string;
    updatedAt: string;
}