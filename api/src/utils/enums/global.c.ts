export enum Address {
    INVALID = "Invalid Address"
}

export enum GENERAL {
    COUNT = "count",
    REQUEST = "request",
    FOLLOWERS = "followers",
    FRIENDS = "friends",
}

export enum MODELS {
    MEMBERS = "members",
    USERS = "users",
    FOLLOWERS = "followers",
    COUNTERS = "counters",
    FRIEND_REQUESTS = "friendrequests"
}

export enum Error {
    WRONG_USERNAME_OR_PASSWORD = "provide correct username or password",
    REMOVE_FRIENDS = "error while removing friends"
}

export enum AddressTypes {
    COUNTRY = 'country',
    CITY = 'city',
    AREA = 'area',
}

export enum LANGUAGES {
    ENGLISH = 'en'
}

export enum CURRENCIES {
    USD = 'usd'
}


export enum ReachStatus {
    IN_PROGRESS = 'In Progress',
    COMPLETED = 'Completed',
}

export enum POST_PROMOTION {
    ALREADY_ACTIVE = 'this post is already on promotion please deactivate the promotion than try again',
}

export enum PAYMENT_METHOD_TYPES {
    CARD = 'card'
}

export enum PAYMENT_STATES {
    PENDING = 'PENDNG',
    PAID = 'PAID',
}

export enum PAYMENT_PROVIDERS {
    STRIPE = 'Stripe'
}

export enum PAYMENT_URLS {
    SUCCESS = 'http://localhost:5173/campaigns',
    CANCEL = 'http://localhost:5173',
}

export enum CHECKOUT_MODES {
    PAYMENT = "payment",
    SETUP = "setup",
    SUBSCRIPTION = "subscription",
}