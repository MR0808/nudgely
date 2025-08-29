// SMSGlobal API Types
export interface SMSGlobalConfig {
    apiKey: string;
    apiSecret: string;
    baseUrl?: string;
}

export interface SMSMessage {
    origin?: string;
    destination: string;
    message: string;
    scheduledDateTime?: string;
    campaignId?: string;
    sharedPool?: string;
}

export interface SMSResponse {
    messages: Array<{
        id: string;
        origin: string;
        destination: string;
        message: string;
        status: string;
        dateTime: string;
        scheduledDateTime?: string;
    }>;
}

export interface DeliveryReceipt {
    id: string;
    messageId: string;
    status: string;
    dateTime: string;
    destination: string;
}

export interface IncomingMessage {
    id: string;
    origin: string;
    destination: string;
    message: string;
    dateTime: string;
}

export interface MessageStatus {
    id: string;
    status: string;
    dateTime: string;
    destination: string;
    origin: string;
}

export interface OTPRequest {
    destination: string;
    message: string;
    origin?: string;
    expiry?: number;
    codeLength?: number;
}

export interface OTPVerification {
    requestId: string;
    code: string;
}

export interface OTPResponse {
    requestId: string;
    status: string;
    expiry: string;
}

export interface Balance {
    balance: number;
    countryCode: string;
    currency: string;
}

export interface APIError {
    error: {
        code: string;
        message: string;
        details?: any;
    };
}
