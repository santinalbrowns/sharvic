"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiatePayment = initiatePayment;
exports.verifyPayment = verifyPayment;
const PAYCHANGU_SECRET_KEY = process.env.PAYCHANGU_SECRET_KEY || 'SEC-976debzgR7Gu6xzJ4WQhZEtzlfUgWiYX';
const PAYCHANGU_API_URL = 'https://api.paychangu.com/payment';
async function initiatePayment(params) {
    const response = await fetch(PAYCHANGU_API_URL, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PAYCHANGU_SECRET_KEY}`,
        },
        body: JSON.stringify(params),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Paychangu API error: ${response.status} - ${error}`);
    }
    return response.json();
}
async function verifyPayment(txRef) {
    const response = await fetch(`https://api.paychangu.com/verify-payment/${txRef}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${PAYCHANGU_SECRET_KEY}`,
        },
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Paychangu verification error: ${response.status} - ${error}`);
    }
    return response.json();
}
