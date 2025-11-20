import { ReceiptData } from "./ReceiptData";

interface ReceiptPreviewProps {
    data: ReceiptData;
}

export default function ReceiptPreview({ data }: ReceiptPreviewProps) {
    const grandTotal = data.feeItems.reduce(
        (sum, item) => sum + item.paid + item.due + item.tax,
        0
    );
    const totalPaid = data.feeItems.reduce((sum, item) => sum + item.paid, 0);
    const totalDue = data.feeItems.reduce((sum, item) => sum + item.due, 0);
    const totalTax = data.feeItems.reduce((sum, item) => sum + item.tax, 0);

    return (
        <div
            id="receipt-preview"
            className="w-full mx-auto bg-white text-black p-6 shadow-lg"
            style={{ minHeight: "600px", maxWidth: "1200px" }}
        >
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-4 mb-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">
                            {data.institutionName || "Institution Name"}
                        </h1>
                        <p className="text-xs text-gray-600 whitespace-pre-line">
                            {data.institutionAddress || "Institution Address"}
                        </p>
                    </div>
                    {data.institutionLogo && (
                        <div className="w-20 h-20 flex-shrink-0">
                            <img
                                src={data.institutionLogo}
                                alt="Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    )}
                </div>
                <div className="mt-3">
                    <h2 className="text-xl font-bold text-center text-gray-800">
                        FEE RECEIPT
                    </h2>
                </div>
            </div>

            {/* Receipt Details and Student Info in 2 columns */}
            <div className="grid grid-cols-2 gap-6 mb-4">
                {/* Receipt Details */}
                <div className="space-y-2">
                    <div>
                        <p className="text-xs text-gray-600">Receipt Number:</p>
                        <p className="font-semibold text-gray-900 text-sm">
                            {data.receiptNumber || "RCP-000000"}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-600">Receipt Date:</p>
                        <p className="font-semibold text-gray-900 text-sm">
                            {data.receiptDate || new Date().toISOString().split("T")[0]}
                        </p>
                    </div>
                </div>

                {/* Student Information */}
                <div className="space-y-2">
                    <div>
                        <span className="text-xs text-gray-600">Student Name: </span>
                        <span className="font-semibold text-gray-900 text-sm">
                            {data.studentName || "Student Name"}
                        </span>
                    </div>
                    <div>
                        <span className="text-xs text-gray-600">Address: </span>
                        <span className="text-gray-900 text-sm">
                            {data.studentAddress || "Student Address"}
                        </span>
                    </div>
                    <div>
                        <span className="text-xs text-gray-600">Contact: </span>
                        <span className="text-gray-900 text-sm">
                            {data.studentContact || "Contact Number"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Fee Details Table */}
            <div className="mb-4">
                <h3 className="font-bold text-gray-800 mb-2 text-sm">Fee Details</h3>
                <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                        <tr className="bg-gray-800 text-white">
                            <th className="border border-gray-300 p-1.5 text-left">Service</th>
                            <th className="border border-gray-300 p-1.5 text-right">Paid</th>
                            <th className="border border-gray-300 p-1.5 text-right">Due</th>
                            <th className="border border-gray-300 p-1.5 text-right">Tax</th>
                            <th className="border border-gray-300 p-1.5 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.feeItems.map((item, index) => {
                            const total = item.paid + item.due + item.tax;
                            return (
                                <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                    <td className="border border-gray-300 p-1.5">
                                        {item.service || "Service"}
                                    </td>
                                    <td className="border border-gray-300 p-1.5 text-right">
                                        ${item.paid.toFixed(2)}
                                    </td>
                                    <td className="border border-gray-300 p-1.5 text-right">
                                        ${item.due.toFixed(2)}
                                    </td>
                                    <td className="border border-gray-300 p-1.5 text-right">
                                        ${item.tax.toFixed(2)}
                                    </td>
                                    <td className="border border-gray-300 p-1.5 text-right font-semibold">
                                        ${total.toFixed(2)}
                                    </td>
                                </tr>
                            );
                        })}
                        <tr className="bg-gray-100 font-bold">
                            <td className="border border-gray-300 p-1.5">TOTAL</td>
                            <td className="border border-gray-300 p-1.5 text-right">
                                ${totalPaid.toFixed(2)}
                            </td>
                            <td className="border border-gray-300 p-1.5 text-right">
                                ${totalDue.toFixed(2)}
                            </td>
                            <td className="border border-gray-300 p-1.5 text-right">
                                ${totalTax.toFixed(2)}
                            </td>
                            <td className="border border-gray-300 p-1.5 text-right text-base">
                                ${grandTotal.toFixed(2)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Payment Info and Terms in 2 columns */}
            <div className="grid grid-cols-2 gap-6 mb-4">
                {/* Payment Information */}
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-2 text-sm">Payment Information</h3>
                    <div className="space-y-1">
                        <div>
                            <span className="text-xs text-gray-600">Payment Method: </span>
                            <span className="font-semibold text-gray-900 text-sm">
                                {data.paymentMethod || "Cash"}
                            </span>
                        </div>
                        {data.paymentDetails && (
                            <div>
                                <span className="text-xs text-gray-600">Details: </span>
                                <span className="text-gray-900 text-xs">{data.paymentDetails}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Terms and Conditions */}
                {data.terms && (
                    <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-2 text-sm">Terms and Conditions</h3>
                        <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                            {data.terms}
                        </p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-300">
                <div className="flex justify-between items-end">
                    <div className="text-center">
                        {data.authorizedSignature ? (
                            <div className="mb-1">
                                <img
                                    src={data.authorizedSignature}
                                    alt="Authorized Signature"
                                    className="h-12 object-contain mx-auto"
                                />
                            </div>
                        ) : (
                            <div className="border-t border-gray-800 w-40 mb-1"></div>
                        )}
                        <p className="text-xs text-gray-600">Authorized Signature</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                        <p>This is a computer-generated receipt</p>
                        <p>Receipt ID: {data.receiptNumber || "RCP-000000"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
