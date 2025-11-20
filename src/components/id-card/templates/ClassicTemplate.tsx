import QRCode from "react-qr-code";
import { IdCardData } from "../IdCardForm";

interface TemplateProps {
    data: IdCardData;
}

export default function ClassicTemplate({ data }: TemplateProps) {
    return (
        <div className="w-[350px] h-[550px] bg-[#ffffff] text-[#000000] rounded-xl overflow-hidden relative flex flex-col" style={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)", border: "1px solid #d1d5db" }}>
            {/* Header */}
            <div className="h-24 bg-[#1e3a8a] flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    {data.logo ? (
                        <img src={data.logo} alt="Logo" className="h-12 w-12 object-contain bg-white rounded-full p-1" />
                    ) : (
                        <div className="h-12 w-12 bg-white rounded-full" />
                    )}
                    <div className="text-white">
                        <h3 className="font-bold text-sm leading-tight">{data.schoolName}</h3>
                        <p className="text-[10px] opacity-80">{data.address}</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 flex flex-col">
                <div className="flex gap-4 mb-6">
                    <div className="w-24 h-32 bg-[#f3f4f6] border-2 border-[#e5e7eb] rounded-md overflow-hidden flex-shrink-0">
                        {data.photo && (
                            <img src={data.photo} alt="Student" className="w-full h-full object-cover" />
                        )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                        <h2 className="text-xl font-bold text-[#111827] uppercase leading-tight">{data.fullName}</h2>
                        <span className="inline-block bg-[#dbeafe] text-[#1e40af] text-xs font-bold px-2 py-1 rounded mt-2 self-start">
                            {data.grade}
                        </span>
                    </div>
                </div>

                <div className="space-y-3 text-sm flex-1">
                    <div className="grid grid-cols-3 gap-2">
                        <span className="text-[#6b7280] font-medium text-xs uppercase">ID No.</span>
                        <span className="col-span-2 font-semibold text-[#374151]">{data.idNumber || "000000"}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <span className="text-[#6b7280] font-medium text-xs uppercase">DOB</span>
                        <span className="col-span-2 font-semibold text-[#374151]">{data.dob}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <span className="text-[#6b7280] font-medium text-xs uppercase">Phone</span>
                        <span className="col-span-2 font-semibold text-[#374151]">{data.phone}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <span className="text-[#6b7280] font-medium text-xs uppercase">Email</span>
                        <span className="col-span-2 font-semibold text-[#374151] break-all text-xs">{data.email}</span>
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-[#e5e7eb] flex justify-between items-end">
                    <div className="text-center">
                        {data.signature ? (
                            <img src={data.signature} alt="Signature" className="h-10 object-contain" />
                        ) : (
                            <div className="h-10 w-24 bg-[#f3f4f6]" />
                        )}
                        <p className="text-[10px] text-[#6b7280] mt-1 border-t border-[#9ca3af] pt-1 inline-block px-2">Principal Signature</p>
                    </div>
                    <div className="w-16 h-16 bg-white flex items-center justify-center">
                        <QRCode
                            value={JSON.stringify({
                                id: data.idNumber,
                                name: data.fullName,
                                school: data.schoolName
                            })}
                            size={64}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                        />
                    </div>
                </div>
            </div>

            <div className="h-4 bg-[#1d4ed8]" />
        </div>
    );
}


