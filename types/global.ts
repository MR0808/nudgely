export type ActionResult<T = any> = {
    success: boolean;
    message: string;
    data?: T;
    cooldownTime?: number;
};
