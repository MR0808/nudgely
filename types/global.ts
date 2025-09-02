export type ActionResult<T = any> = {
    success: boolean;
    message: string;
    data?: T;
    cooldownTime?: number;
};

export type ParamsSlug = Promise<{ slug: string }>;
