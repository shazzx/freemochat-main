export interface User {
    _id: string;
    username: string;
    avatar?: string;
}

export interface Group {
    _id: string;
    handle: string;
    name: string;
    avatar?: string;
}

export interface Page {
    _id: string;
    handle: string;
    name: string;
    avatar?: string;
}

export interface Post {
    _id: string;
    content: string;
    author: string;
    createdAt: string;
}

export interface SearchResults {
    users?: User[];
    groups?: Group[];
    pages?: Page[];
    posts?: Post[];
}