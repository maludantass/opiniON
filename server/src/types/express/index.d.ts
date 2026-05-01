declare global {
    namespace Express {
        interface Request {
            authUserId?: number;
            authUserEmail?: string;
        }
    }
}

export {};
