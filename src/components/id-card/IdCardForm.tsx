"use client";

import { useState, ChangeEvent } from "react";
import { Upload } from "lucide-react";

export interface IdCardData {
    fullName: string;
    grade: string;
    dob: string;
    schoolName: string;
    address: string;
    email: string;
    phone: string;
    photo: string | null;
    logo: string | null;
    signature: string | null;
    idNumber?: string;
    variant?: 'modern' | 'classic' | 'minimal';
}

interface IdCardFormProps {
    onSubmit: (data: IdCardData) => void;
}

export default function IdCardForm({ onSubmit }: IdCardFormProps) {
    const [formData, setFormData] = useState<IdCardData>({
        fullName: "",
        grade: "",
        dob: "",
        schoolName: "",
        address: "",
        email: "",
        phone: "",
        photo: null,
        logo: null,
        signature: null,
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, field: keyof IdCardData) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev) => ({ ...prev, [field]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const variants: ('modern' | 'classic' | 'minimal')[] = ['modern', 'classic', 'minimal'];
        const randomVariant = variants[Math.floor(Math.random() * variants.length)];

        const dataWithId = {
            ...formData,
            idNumber: Math.floor(100000 + Math.random() * 900000).toString(),
            variant: randomVariant
        };
        onSubmit(dataWithId);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full p-2 rounded-md border bg-background"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Grade/Class</label>
                    <input
                        type="text"
                        name="grade"
                        value={formData.grade}
                        onChange={handleChange}
                        className="w-full p-2 rounded-md border bg-background"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Date of Birth</label>
                    <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                        className="w-full p-2 rounded-md border bg-background"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">School/University</label>
                    <input
                        type="text"
                        name="schoolName"
                        value={formData.schoolName}
                        onChange={handleChange}
                        className="w-full p-2 rounded-md border bg-background"
                        required
                    />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Address</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full p-2 rounded-md border bg-background"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-2 rounded-md border bg-background"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full p-2 rounded-md border bg-background"
                        required
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 pt-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium block">Student Photo</label>
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, "photo")}
                            className="hidden"
                            id="photo-upload"
                        />
                        <label
                            htmlFor="photo-upload"
                            className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
                        >
                            {formData.photo ? (
                                <img src={formData.photo} alt="Preview" className="h-full w-full object-cover rounded-md" />
                            ) : (
                                <div className="flex flex-col items-center text-muted-foreground">
                                    <Upload size={20} />
                                    <span className="text-xs mt-1">Upload</span>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium block">School Logo</label>
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, "logo")}
                            className="hidden"
                            id="logo-upload"
                        />
                        <label
                            htmlFor="logo-upload"
                            className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
                        >
                            {formData.logo ? (
                                <img src={formData.logo} alt="Preview" className="h-full w-full object-contain rounded-md" />
                            ) : (
                                <div className="flex flex-col items-center text-muted-foreground">
                                    <Upload size={20} />
                                    <span className="text-xs mt-1">Upload</span>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium block">Principal Signature</label>
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, "signature")}
                            className="hidden"
                            id="signature-upload"
                        />
                        <label
                            htmlFor="signature-upload"
                            className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
                        >
                            {formData.signature ? (
                                <img src={formData.signature} alt="Preview" className="h-full w-full object-contain rounded-md" />
                            ) : (
                                <div className="flex flex-col items-center text-muted-foreground">
                                    <Upload size={20} />
                                    <span className="text-xs mt-1">Upload</span>
                                </div>
                            )}
                        </label>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 transition-colors mt-6"
            >
                Generate Card
            </button>
        </form>
    );
}
