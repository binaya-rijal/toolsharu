"use client";

import { ReceiptData, FeeItem } from "./ReceiptData";
import { Plus, Trash2 } from "lucide-react";

interface ReceiptFormProps {
    data: ReceiptData;
    onChange: (data: ReceiptData) => void;
}

export default function ReceiptForm({ data, onChange }: ReceiptFormProps) {
    const handleChange = (field: keyof ReceiptData, value: any) => {
        onChange({ ...data, [field]: value });
    };

    const handleFeeItemChange = (id: string, field: keyof FeeItem, value: any) => {
        const updatedItems = data.feeItems.map((item) =>
            item.id === id ? { ...item, [field]: value } : item
        );
        handleChange("feeItems", updatedItems);
    };

    const addFeeItem = () => {
        const newItem: FeeItem = {
            id: Date.now().toString(),
            service: "",
            paid: 0,
            due: 0,
            tax: 0,
        };
        handleChange("feeItems", [...data.feeItems, newItem]);
    };

    const removeFeeItem = (id: string) => {
        handleChange(
            "feeItems",
            data.feeItems.filter((item) => item.id !== id)
        );
    };

    const handleImageUpload = (field: "institutionLogo", e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleChange(field, reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-4">Receipt Information</h2>
            </div>

            {/* Institution Information */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Institution Details</h3>
                <div>
                    <label className="block text-sm font-medium mb-2">Institution Name</label>
                    <input
                        type="text"
                        value={data.institutionName}
                        onChange={(e) => handleChange("institutionName", e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                        placeholder="Enter institution name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Institution Address</label>
                    <textarea
                        value={data.institutionAddress}
                        onChange={(e) => handleChange("institutionAddress", e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                        rows={2}
                        placeholder="Enter institution address"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Institution Logo</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload("institutionLogo", e)}
                        className="w-full p-2 border rounded-md bg-background"
                    />
                </div>
            </div>

            {/* Receipt Details */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Receipt Details</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Receipt Number</label>
                        <input
                            type="text"
                            value={data.receiptNumber}
                            onChange={(e) => handleChange("receiptNumber", e.target.value)}
                            className="w-full p-2 border rounded-md bg-background"
                            placeholder="Auto-generated"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Receipt Date</label>
                        <input
                            type="date"
                            value={data.receiptDate}
                            onChange={(e) => handleChange("receiptDate", e.target.value)}
                            className="w-full p-2 border rounded-md bg-background"
                        />
                    </div>
                </div>
            </div>

            {/* Student Information */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Student Information</h3>
                <div>
                    <label className="block text-sm font-medium mb-2">Student Name</label>
                    <input
                        type="text"
                        value={data.studentName}
                        onChange={(e) => handleChange("studentName", e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                        placeholder="Enter student name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Student Address</label>
                    <textarea
                        value={data.studentAddress}
                        onChange={(e) => handleChange("studentAddress", e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                        rows={2}
                        placeholder="Enter student address"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Contact Number</label>
                    <input
                        type="text"
                        value={data.studentContact}
                        onChange={(e) => handleChange("studentContact", e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                        placeholder="Enter contact number"
                    />
                </div>
            </div>

            {/* Fee Items Table */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Fee Details</h3>
                    <button
                        onClick={addFeeItem}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                        <Plus size={16} />
                        Add Row
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-muted">
                                <th className="border p-2 text-left">Service</th>
                                <th className="border p-2 text-left">Paid</th>
                                <th className="border p-2 text-left">Due</th>
                                <th className="border p-2 text-left">Tax</th>
                                <th className="border p-2 text-left">Total</th>
                                <th className="border p-2 text-left">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.feeItems.map((item) => {
                                const total = item.paid + item.due + item.tax;
                                return (
                                    <tr key={item.id}>
                                        <td className="border p-2">
                                            <input
                                                type="text"
                                                value={item.service}
                                                onChange={(e) => handleFeeItemChange(item.id, "service", e.target.value)}
                                                className="w-full p-1 bg-background border rounded"
                                                placeholder="Service name"
                                            />
                                        </td>
                                        <td className="border p-2">
                                            <input
                                                type="number"
                                                value={item.paid}
                                                onChange={(e) => handleFeeItemChange(item.id, "paid", parseFloat(e.target.value) || 0)}
                                                className="w-full p-1 bg-background border rounded"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="border p-2">
                                            <input
                                                type="number"
                                                value={item.due}
                                                onChange={(e) => handleFeeItemChange(item.id, "due", parseFloat(e.target.value) || 0)}
                                                className="w-full p-1 bg-background border rounded"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="border p-2">
                                            <input
                                                type="number"
                                                value={item.tax}
                                                onChange={(e) => handleFeeItemChange(item.id, "tax", parseFloat(e.target.value) || 0)}
                                                className="w-full p-1 bg-background border rounded"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="border p-2 font-semibold">{total.toFixed(2)}</td>
                                        <td className="border p-2">
                                            <button
                                                onClick={() => removeFeeItem(item.id)}
                                                className="p-1 text-red-500 hover:text-red-700"
                                                disabled={data.feeItems.length === 1}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Payment Information</h3>
                <div>
                    <label className="block text-sm font-medium mb-2">Payment Method</label>
                    <select
                        value={data.paymentMethod}
                        onChange={(e) => handleChange("paymentMethod", e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                    >
                        <option value="Cash">Cash</option>
                        <option value="Check">Check</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Online Payment">Online Payment</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Payment Details</label>
                    <textarea
                        value={data.paymentDetails}
                        onChange={(e) => handleChange("paymentDetails", e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                        rows={2}
                        placeholder="Enter payment details (e.g., transaction ID, check number)"
                    />
                </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Terms and Conditions</h3>
                <div>
                    <textarea
                        value={data.terms}
                        onChange={(e) => handleChange("terms", e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                        rows={4}
                        placeholder="Enter terms and conditions"
                    />
                </div>
            </div>

            {/* Authorized Signature */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Authorized Signature</h3>
                <div>
                    <label className="block text-sm font-medium mb-2">Upload Signature</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    handleChange("authorizedSignature", reader.result as string);
                                };
                                reader.readAsDataURL(file);
                            }
                        }}
                        className="w-full p-2 border rounded-md bg-background"
                    />
                    {data.authorizedSignature && (
                        <div className="mt-2">
                            <img src={data.authorizedSignature} alt="Signature Preview" className="h-16 object-contain border rounded p-2 bg-white" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
