import crypto from 'crypto';

export function generateAuthHeader(
    apiKey: string,
    apiSecret: string,
    method: string,
    uri: string,
    host: string,
    port = '443',
    ext = ''
): string {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    // Create the normalized request string according to OAuth 2 MAC spec
    // Format: ts + "\n" + nonce + "\n" + method + "\n" + request-uri + "\n" + host + "\n" + port + "\n" + ext + "\n"
    const normalizedString =
        [timestamp, nonce, method.toUpperCase(), uri, host, port, ext].join(
            '\n'
        ) + '\n';

    // Generate HMAC-SHA256 signature
    const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(normalizedString, 'utf8')
        .digest('base64');

    // Return properly formatted MAC authorization header
    return `MAC id="${apiKey}", ts="${timestamp}", nonce="${nonce}", mac="${signature}"`;
}

export function createRequestHeaders(
    apiKey: string,
    apiSecret: string,
    method: string,
    path: string,
    body?: any
): HeadersInit {
    const host = 'api.smsglobal.com';
    const port = '443';

    // Generate auth header (note: body is NOT included in MAC signature)
    const authHeader = generateAuthHeader(
        apiKey,
        apiSecret,
        method,
        path,
        host,
        port
    );

    const headers: HeadersInit = {
        Authorization: authHeader,
        Accept: 'application/json'
    };

    // Only add Content-Type for requests with body
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        headers['Content-Type'] = 'application/json';
    }

    return headers;
}
