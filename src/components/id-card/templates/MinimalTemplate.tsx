import { IdCardData } from "../IdCardForm";

interface TemplateProps {
    data: IdCardData;
}

export default function MinimalTemplate({ data }: TemplateProps) {
    return (
        <div className="w-[350px] h-[550px] bg-[#ffffff] text-[#000000] rounded-xl overflow-hidden relative flex flex-col" style={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)", border: "1px solid #d1d5db" }}>
            <div className="flex-1 p-8 flex flex-col items-center text-center border-[12px] border-[#ffffff] outline outline-1 outline-[#e5e7eb] m-2">

                <div className="mb-6">
                    {data.logo ? (
                        <img src={data.logo} alt="Logo" className="h-12 object-contain mx-auto" />
                    ) : (
                        <div className="h-12 w-12 bg-[#f3f4f6] rounded-full mx-auto" />
                    )}
                    <h3 className="font-bold text-[#111827] mt-2 text-sm uppercase tracking-widest">{data.schoolName}</h3>
                </div>

                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#f3f4f6] mb-6 shadow-inner">
                    {data.photo ? (
                        <img src={data.photo} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-[#e5e7eb]" />
                    )}
                </div>

                <h2 className="text-2xl font-bold text-[#111827] mb-1">{data.fullName}</h2>
                <p className="text-[#6b7280] uppercase text-xs tracking-widest mb-6">{data.grade}</p>

                <div className="w-full space-y-2 text-sm border-t border-b border-[#e5e7eb] py-4 mb-6">
                    <div className="flex justify-between">
                        <span className="text-[#9ca3af] text-xs">ID</span>
                        <span className="font-mono text-[#374151]">{data.idNumber || "000000"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[#9ca3af] text-xs">DOB</span>
                        <span className="text-[#374151]">{data.dob}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[#9ca3af] text-xs">PHONE</span>
                        <span className="text-[#374151]">{data.phone}</span>
                    </div>
                </div>

                <div className="mt-auto">
                    {data.signature ? (
                        <img src={data.signature} alt="Signature" className="h-8 object-contain mx-auto" />
                    ) : (
                        <div className="h-8 w-24 bg-[#f3f4f6] mx-auto" />
                    )}
                    <p className="text-[8px] text-[#9ca3af] mt-1 uppercase tracking-widest">Authorized Signature</p>
                </div>
            </div>
        </div>
    );
}
