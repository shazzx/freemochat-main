import { Request } from "express";

interface Request extends Request {
    user: {
        username: string,
        sub: string
    }
}