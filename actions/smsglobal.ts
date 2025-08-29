'use server';

import type {
    SMSGlobalConfig,
    SMSMessage,
    SMSResponse,
    DeliveryReceipt,
    IncomingMessage,
    MessageStatus,
    OTPRequest,
    OTPVerification,
    OTPResponse,
    Balance,
    APIError
} from '@/types/smsglobal';
import { createRequestHeaders } from '@/lib/smsglobal';

// Environment variable validation
function getSMSGlobalCredentials() {
    const apiKey = process.env.SMSGLOBAL_API_KEY;
    const apiSecret = process.env.SMSGLOBAL_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error(
            'SMSGlobal credentials not found. Please set SMSGLOBAL_API_KEY and SMSGLOBAL_API_SECRET environment variables.'
        );
    }

    return { apiKey, apiSecret };
}

const BASE_URL = 'https://api.smsglobal.com';

class SMSGlobalAPI {
    private config: SMSGlobalConfig;

    constructor(config: SMSGlobalConfig) {
        this.config = {
            ...config,
            baseUrl: config.baseUrl || BASE_URL
        };
    }

    private async makeRequest<T>(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
        body?: any
    ): Promise<T> {
        const url = `${this.config.baseUrl}${endpoint}`;
        const path = endpoint;

        // Validate credentials
        if (!this.config.apiKey || !this.config.apiSecret) {
            throw new Error('SMSGlobal API credentials are required');
        }

        const headers = createRequestHeaders(
            this.config.apiKey,
            this.config.apiSecret,
            method,
            path,
            body
        );

        const requestOptions: RequestInit = {
            method,
            headers
        };

        if (
            body &&
            (method === 'POST' || method === 'PUT' || method === 'PATCH')
        ) {
            requestOptions.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                let errorDetails = '';

                try {
                    // Try to parse as JSON first
                    const errorData: APIError = await response.json();
                    errorMessage = `SMSGlobal API Error: ${errorData.error.message}`;
                    errorDetails = JSON.stringify(errorData, null, 2);
                } catch (parseError) {
                    // If JSON parsing fails, get the text response
                    try {
                        const textError = await response.text();
                        errorMessage = `SMSGlobal API Error: ${textError}`;
                        errorDetails = textError;
                    } catch (textError) {
                        // If both fail, use the status text
                        errorMessage = `SMSGlobal API Error: ${response.status} ${response.statusText}`;
                    }
                }

                console.error('API Error Details:', errorDetails);
                throw new Error(errorMessage);
            }

            const responseData = await response.json();
            return responseData;
        } catch (error) {
            console.error('SMSGlobal API Request Failed:', error);
            throw error;
        }
    }

    // Send SMS
    async sendSMS(messages: SMSMessage[]): Promise<SMSResponse> {
        return this.makeRequest<SMSResponse>('/v2/sms/', 'POST', { messages });
    }

    // Send single SMS
    async sendSingleSMS(message: SMSMessage): Promise<SMSResponse> {
        return this.sendSMS([message]);
    }

    // Get message status
    async getMessageStatus(messageId: string): Promise<MessageStatus> {
        return this.makeRequest<MessageStatus>(`/v2/sms/${messageId}`);
    }

    // Get all messages
    async getMessages(
        limit?: number,
        offset?: number,
        dateFrom?: string,
        dateTo?: string
    ): Promise<{ messages: MessageStatus[] }> {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        if (offset) params.append('offset', offset.toString());
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);

        const query = params.toString() ? `?${params.toString()}` : '';
        return this.makeRequest(`/v2/sms/${query}`);
    }

    // Delete scheduled message
    async deleteScheduledMessage(
        messageId: string
    ): Promise<{ success: boolean }> {
        return this.makeRequest(`/v2/sms/${messageId}`, 'DELETE');
    }

    // Get delivery receipts
    async getDeliveryReceipts(
        limit?: number,
        offset?: number
    ): Promise<{ deliveryReceipts: DeliveryReceipt[] }> {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        if (offset) params.append('offset', offset.toString());

        const query = params.toString() ? `?${params.toString()}` : '';
        return this.makeRequest(`/v2/sms/delivery-receipts/${query}`);
    }

    // Get incoming messages
    async getIncomingMessages(
        limit?: number,
        offset?: number
    ): Promise<{ incomingMessages: IncomingMessage[] }> {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        if (offset) params.append('offset', offset.toString());

        const query = params.toString() ? `?${params.toString()}` : '';
        return this.makeRequest(`/v2/sms/incoming-messages/${query}`);
    }

    // Send OTP
    async sendOTP(otpRequest: OTPRequest): Promise<OTPResponse> {
        return this.makeRequest<OTPResponse>('/v2/otp/', 'POST', otpRequest);
    }

    // Verify OTP
    async verifyOTP(
        verification: OTPVerification
    ): Promise<{ verified: boolean }> {
        return this.makeRequest(
            `/v2/otp/${verification.requestId}/verify/`,
            'POST',
            { code: verification.code }
        );
    }

    // Get OTP status
    async getOTPStatus(requestId: string): Promise<OTPResponse> {
        return this.makeRequest<OTPResponse>(`/v2/otp/${requestId}`);
    }

    // Get balance
    async getBalance(): Promise<Balance> {
        return this.makeRequest<Balance>('/v2/user/balance/');
    }

    // Get user profile
    async getUserProfile(): Promise<any> {
        return this.makeRequest('/v2/user/');
    }
}

// Server Actions - Updated to use environment variables
export async function sendSMSAction(
    messages: SMSMessage[]
): Promise<SMSResponse> {
    const { apiKey, apiSecret } = getSMSGlobalCredentials();
    const api = new SMSGlobalAPI({ apiKey, apiSecret });
    return api.sendSMS(messages);
}

export async function sendSingleSMSAction(
    message: SMSMessage
): Promise<SMSResponse> {
    const { apiKey, apiSecret } = getSMSGlobalCredentials();
    const api = new SMSGlobalAPI({ apiKey, apiSecret });
    return api.sendSingleSMS(message);
}

export async function getMessageStatusAction(
    messageId: string
): Promise<MessageStatus> {
    const { apiKey, apiSecret } = getSMSGlobalCredentials();
    const api = new SMSGlobalAPI({ apiKey, apiSecret });
    return api.getMessageStatus(messageId);
}

export async function getMessagesAction(options?: {
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
}): Promise<{ messages: MessageStatus[] }> {
    const { apiKey, apiSecret } = getSMSGlobalCredentials();
    const api = new SMSGlobalAPI({ apiKey, apiSecret });
    return api.getMessages(
        options?.limit,
        options?.offset,
        options?.dateFrom,
        options?.dateTo
    );
}

export async function deleteScheduledMessageAction(
    messageId: string
): Promise<{ success: boolean }> {
    const { apiKey, apiSecret } = getSMSGlobalCredentials();
    const api = new SMSGlobalAPI({ apiKey, apiSecret });
    return api.deleteScheduledMessage(messageId);
}

export async function getDeliveryReceiptsAction(
    limit?: number,
    offset?: number
): Promise<{ deliveryReceipts: DeliveryReceipt[] }> {
    const { apiKey, apiSecret } = getSMSGlobalCredentials();
    const api = new SMSGlobalAPI({ apiKey, apiSecret });
    return api.getDeliveryReceipts(limit, offset);
}

export async function getIncomingMessagesAction(
    limit?: number,
    offset?: number
): Promise<{ incomingMessages: IncomingMessage[] }> {
    const { apiKey, apiSecret } = getSMSGlobalCredentials();
    const api = new SMSGlobalAPI({ apiKey, apiSecret });
    return api.getIncomingMessages(limit, offset);
}

export async function sendOTPAction(
    otpRequest: OTPRequest
): Promise<OTPResponse> {
    const { apiKey, apiSecret } = getSMSGlobalCredentials();
    const api = new SMSGlobalAPI({ apiKey, apiSecret });
    return api.sendOTP(otpRequest);
}

export async function verifyOTPAction(
    verification: OTPVerification
): Promise<{ verified: boolean }> {
    const { apiKey, apiSecret } = getSMSGlobalCredentials();
    const api = new SMSGlobalAPI({ apiKey, apiSecret });
    return api.verifyOTP(verification);
}

export async function getOTPStatusAction(
    requestId: string
): Promise<OTPResponse> {
    const { apiKey, apiSecret } = getSMSGlobalCredentials();
    const api = new SMSGlobalAPI({ apiKey, apiSecret });
    return api.getOTPStatus(requestId);
}

export async function getBalanceAction(): Promise<Balance> {
    const { apiKey, apiSecret } = getSMSGlobalCredentials();
    const api = new SMSGlobalAPI({ apiKey, apiSecret });
    return api.getBalance();
}

export async function getUserProfileAction(): Promise<any> {
    const { apiKey, apiSecret } = getSMSGlobalCredentials();
    const api = new SMSGlobalAPI({ apiKey, apiSecret });
    return api.getUserProfile();
}

// Convenience function to create API instance using environment variables
export async function createSMSGlobalAPI() {
    const { apiKey, apiSecret } = getSMSGlobalCredentials();
    return new SMSGlobalAPI({ apiKey, apiSecret });
}
