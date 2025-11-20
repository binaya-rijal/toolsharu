import { IdCardData } from "../IdCardForm";

interface TemplateProps {
    data: IdCardData;
}

export default function ModernTemplate({ data }: TemplateProps) {
    return (
        <div className="w-[350px] h-[550px] bg-[#ffffff] text-[#000000] rounded-xl overflow-hidden relative flex flex-col" style={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)", border: "1px solid #d1d5db" }}>
            {/* Header Design */}
            <div className="h-32 relative" style={{ background: "linear-gradient(90deg, #2563eb, #4338ca)" }}>
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#ffffff] rounded-full p-1 z-10" style={{ boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
                    {data.photo ? (
                        <img src={data.photo} alt="Student" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <div className="w-full h-full rounded-full bg-[#e5e7eb]" />
                    )}
                </div>
                {/* Decorative circles */}
                <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-[#ffffff] rounded-full" style={{ opacity: 0.1 }} />
                <div className="absolute bottom-4 left-4 w-12 h-12 bg-[#ffffff] rounded-full" style={{ opacity: 0.1 }} />
            </div>

            {/* Content */}
            <div className="flex-1 pt-14 px-6 pb-6 text-center flex flex-col items-center">
                <h2 className="text-xl font-bold text-[#1f2937]">{data.fullName}</h2>
                <p className="text-[#4f46e5] font-medium text-sm uppercase tracking-wider mt-1">{data.grade}</p>

                <div className="mt-6 w-full space-y-3 text-left text-sm">
                    <div className="flex justify-between border-b border-[#f3f4f6] pb-2">
                        <span className="text-[#6b7280] text-xs uppercase">ID No.</span>
                        <span className="font-semibold">{data.idNumber || "000000"}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#f3f4f6] pb-2">
                        <span className="text-[#6b7280] text-xs uppercase">DOB</span>
                        <span className="font-semibold">{data.dob}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#f3f4f6] pb-2">
                        <span className="text-[#6b7280] text-xs uppercase">Phone</span>
                        <span className="font-semibold">{data.phone}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#f3f4f6] pb-2">
                        <span className="text-[#6b7280] text-xs uppercase">Email</span>
                        <span className="font-semibold truncate max-w-[180px]">{data.email}</span>
                    </div>
                </div>

                <div className="mt-auto w-full pt-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col items-center">
                            {data.signature ? (
                                <img src={data.signature} alt="Signature" className="h-8 object-contain" />
                            ) : (
                                <div className="h-8 w-20 bg-[#f3f4f6] rounded" />
                            )}
                            <span className="text-[10px] text-[#9ca3af] mt-1 uppercase">Principal Signature</span>
                        </div>
                        <div className="flex flex-col items-center">
                            {data.logo ? (
                                <img src={data.logo} alt="Logo" className="h-8 object-contain" />
                            ) : (
                                <div className="h-8 w-8 bg-[#f3f4f6] rounded-full" />
                            )}
                            <span className="text-[10px] text-[#9ca3af] mt-1 uppercase">School Logo</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#f3f4f6]">
                        <p className="font-bold text-[#1f2937] text-sm">{data.schoolName}</p>
                        <p className="text-xs text-[#6b7280] mt-1">{data.address}</p>
                    </div>
                </div>
            </div>

            {/* Footer Strip */}
            <div className="h-2 bg-[#4f46e5] w-full" />
        </div>
    );
}
