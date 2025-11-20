export interface FeeItem {
    id: string;
    service: string;
    paid: number;
    due: number;
    tax: number;
}

export interface ReceiptData {
    // School/College Information
    institutionName: string;
    institutionAddress: string;
    institutionLogo?: string;

    // Receipt Details
    receiptNumber: string;
    receiptDate: string;

    // Student Information
    studentName: string;
    studentAddress: string;
    studentContact: string;

    // Fee Items
    feeItems: FeeItem[];

    // Payment Information
    paymentMethod: string;
    paymentDetails: string;

    // Terms and Conditions
    terms: string;

    // Authorized Signature
    authorizedSignature?: string;
}
