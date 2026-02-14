"use client";

import { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import { Upload, CheckCircle, ArrowRight, ArrowLeft, Store, MapPin, FileText, Loader2 } from "lucide-react";
import router from "next/router";

type Step = 1 | 2 | 3;

interface DocFile {
    file: File | null;
    preview: string | null;
    uploadedUrl: string | null;
}

export default function ApplyForSeller() {
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [alreadyApplied, setAlreadyApplied] = useState(false);
    const [isApproved, setIsApproved] = useState(false);

    // Step 1: Shop Details
    const [shopName, setShopName] = useState("");
    const [gstNumber, setGstNumber] = useState("");

    // Step 2: Address
    const [address, setAddress] = useState({
        street: "",
        district: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
    });

    // Step 3: Documents
    const [docs, setDocs] = useState<{
        panCardFront: DocFile;
        panCardBack: DocFile;
        aadharCardFront: DocFile;
        aadharCardBack: DocFile;
    }>({
        panCardFront: { file: null, preview: null, uploadedUrl: null },
        panCardBack: { file: null, preview: null, uploadedUrl: null },
        aadharCardFront: { file: null, preview: null, uploadedUrl: null },
        aadharCardBack: { file: null, preview: null, uploadedUrl: null },
    });

    // Fetch existing seller data
    useEffect(() => {
        let mounted = true;
        axios
            .get("/api/seller/apply")
            .then((res) => {
                if (!mounted) return;
                const sp = res.data?.sellerProfile;
                if (sp) {
                    setShopName(sp.shopName ?? "");
                    setGstNumber(sp.gstNumber ?? "");
                    if (sp.isRequestedForSeller) setAlreadyApplied(true);
                    if (sp.isApprovedByAdmin) setIsApproved(true);

                    if (sp.sellerAddress) {
                        setAddress({
                            street: sp.sellerAddress.street ?? "",
                            district: sp.sellerAddress.district ?? "",
                            city: sp.sellerAddress.city ?? "",
                            state: sp.sellerAddress.state ?? "",
                            zipCode: sp.sellerAddress.zipCode ?? "",
                            country: sp.sellerAddress.country ?? "",
                        });
                    }

                    if (sp.sellerDocs) {
                        setDocs({
                            panCardFront: { file: null, preview: sp.sellerDocs.panCardFront, uploadedUrl: sp.sellerDocs.panCardFront },
                            panCardBack: { file: null, preview: sp.sellerDocs.panCardBack, uploadedUrl: sp.sellerDocs.panCardBack },
                            aadharCardFront: { file: null, preview: sp.sellerDocs.aadharCardFront, uploadedUrl: sp.sellerDocs.aadharCardFront },
                            aadharCardBack: { file: null, preview: sp.sellerDocs.aadharCardBack, uploadedUrl: sp.sellerDocs.aadharCardBack },
                        });
                    }
                }
            })
            .catch(() => { })
            .finally(() => {
                if (mounted) setFetchLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAddress((p) => ({ ...p, [name]: value }));
    };

    const handleFileChange = (docType: keyof typeof docs) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setDocs((p) => ({
            ...p,
            [docType]: { file, preview, uploadedUrl: null },
        }));
    };

    const uploadSingleDoc = async (docType: string, file: File): Promise<string> => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("docType", docType);
        const res: AxiosResponse = await axios.post("/api/seller/upload-doc", fd);
        return res.data.url;
    };

    const validateStep1 = (): boolean => {
        if (!shopName.trim()) { setError("Shop name is required"); return false; }
        if (!gstNumber.trim()) { setError("GST number is required"); return false; }
        setError(null);
        return true;
    };

    const validateStep2 = (): boolean => {
        if (!address.street.trim()) { setError("Street is required"); return false; }
        if (!address.city.trim()) { setError("City is required"); return false; }
        if (!address.state.trim()) { setError("State is required"); return false; }
        if (!address.zipCode.trim()) { setError("ZIP Code is required"); return false; }
        if (!address.country.trim()) { setError("Country is required"); return false; }
        setError(null);
        return true;
    };

    const validateStep3 = (): boolean => {
        for (const key of Object.keys(docs) as (keyof typeof docs)[]) {
            const d = docs[key];
            if (!d.file && !d.uploadedUrl) {
                setError(`Please upload ${formatDocLabel(key)}`);
                return false;
            }
        }
        setError(null);
        return true;
    };

    const formatDocLabel = (key: string): string => {
        const map: Record<string, string> = {
            panCardFront: "PAN Card (Front)",
            panCardBack: "PAN Card (Back)",
            aadharCardFront: "Aadhaar Card (Front)",
            aadharCardBack: "Aadhaar Card (Back)",
        };
        return map[key] ?? key;
    };

    const nextStep = () => {
        if (step === 1 && validateStep1()) setStep(2);
        else if (step === 2 && validateStep2()) setStep(3);
    };

    const prevStep = () => {
        setError(null);
        if (step === 2) setStep(1);
        else if (step === 3) setStep(2);
    };

    const handleSubmit = async () => {
        if (!validateStep3()) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Upload any new files
            const docUrls: Record<string, string> = {};
            for (const key of Object.keys(docs) as (keyof typeof docs)[]) {
                const d = docs[key];
                if (d.file) {
                    docUrls[key] = await uploadSingleDoc(key, d.file);
                } else if (d.uploadedUrl) {
                    docUrls[key] = d.uploadedUrl;
                }
            }

            // Submit everything
            await axios.post("/api/seller/apply", {
                shopName,
                gstNumber,
                address,
                docs: docUrls,
            });

            setSuccess("Your seller application has been submitted successfully! We will review it shortly.");
            setAlreadyApplied(true);
            router.push("/profile");
        } catch (err: any) {
            setError(err?.response?.data?.error || err.message || "Submission failed");
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    if (isApproved) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                    <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                    <h2 className="text-2xl font-semibold text-green-800">You&apos;re an Approved Seller!</h2>
                    <p className="text-green-600 mt-2">Your seller account has been approved. You can start listing products.</p>
                </div>
            </div>
        );
    }

    if (alreadyApplied && !success) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
                    <Store className="mx-auto text-amber-500 mb-4" size={48} />
                    <h2 className="text-2xl font-semibold text-amber-800">Application Pending</h2>
                    <p className="text-amber-600 mt-2">Your seller application is under review. We&apos;ll notify you once it&apos;s approved.</p>
                </div>
            </div>
        );
    }

    const stepIndicators = [
        { num: 1, label: "Shop Details", icon: Store },
        { num: 2, label: "Address", icon: MapPin },
        { num: 3, label: "Documents", icon: FileText },
    ];

    return (
        <div className="max-w-2xl mx-auto">
            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-8">
                {stepIndicators.map((s, i) => {
                    const Icon = s.icon;
                    const isActive = step === s.num;
                    const isDone = step > s.num;
                    return (
                        <div key={s.num} className="flex items-center flex-1">
                            <div className="flex flex-col items-center flex-1">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isDone
                                            ? "bg-green-500 text-white"
                                            : isActive
                                                ? "bg-black text-white"
                                                : "bg-gray-200 text-gray-500"
                                        }`}
                                >
                                    {isDone ? <CheckCircle size={18} /> : <Icon size={18} />}
                                </div>
                                <span
                                    className={`text-xs mt-1 ${isActive ? "font-semibold text-black" : "text-gray-400"
                                        }`}
                                >
                                    {s.label}
                                </span>
                            </div>
                            {i < stepIndicators.length - 1 && (
                                <div
                                    className={`h-0.5 flex-1 -mt-4 ${step > s.num ? "bg-green-500" : "bg-gray-200"
                                        }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 rounded-lg text-sm">
                    {success}
                </div>
            )}

            {/* Step 1: Shop Details */}
            {step === 1 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Store size={20} /> Shop Details
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shop / Business Name *</label>
                        <input
                            type="text"
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            placeholder="e.g. Srinibas Vastra"
                            className="input bg-white w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">GST Number *</label>
                        <input
                            type="text"
                            value={gstNumber}
                            onChange={(e) => setGstNumber(e.target.value)}
                            placeholder="e.g. 22AAAAA0000A1Z5"
                            className="input bg-white w-full"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={nextStep}
                            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Next <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Address */}
            {step === 2 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <MapPin size={20} /> Shop / Godown Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Street *</label>
                            <input name="street" value={address.street} onChange={handleAddressChange} className="input bg-white w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                            <input name="district" value={address.district} onChange={handleAddressChange} className="input bg-white w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                            <input name="city" value={address.city} onChange={handleAddressChange} className="input bg-white w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                            <input name="state" value={address.state} onChange={handleAddressChange} className="input bg-white w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                            <input name="zipCode" value={address.zipCode} onChange={handleAddressChange} className="input bg-white w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                            <input name="country" value={address.country} onChange={handleAddressChange} className="input bg-white w-full" />
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <button
                            onClick={prevStep}
                            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                        <button
                            onClick={nextStep}
                            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Next <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Documents */}
            {step === 3 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText size={20} /> Upload Documents
                    </h3>
                    <p className="text-sm text-gray-500">Upload clear images of your PAN Card and Aadhaar Card (front and back)</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {(Object.keys(docs) as (keyof typeof docs)[]).map((docType) => {
                            const d = docs[docType];
                            return (
                                <div key={docType} className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {formatDocLabel(docType)} *
                                    </label>
                                    <label
                                        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors min-h-[140px] ${d.preview
                                                ? "border-green-300 bg-green-50"
                                                : "border-gray-300 hover:border-gray-400 bg-gray-50"
                                            }`}
                                    >
                                        {d.preview ? (
                                            <img
                                                src={d.preview}
                                                alt={formatDocLabel(docType)}
                                                className="max-h-28 object-contain rounded"
                                            />
                                        ) : (
                                            <>
                                                <Upload className="text-gray-400 mb-2" size={24} />
                                                <span className="text-xs text-gray-500">Click to upload</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange(docType)}
                                        />
                                    </label>
                                    {d.preview && (
                                        <p className="text-xs text-green-600 flex items-center gap-1">
                                            <CheckCircle size={12} />
                                            {d.file ? "Ready to upload" : "Previously uploaded"}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-between pt-2">
                        <button
                            onClick={prevStep}
                            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} /> Submitting...
                                </>
                            ) : (
                                <>Submit Application</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}