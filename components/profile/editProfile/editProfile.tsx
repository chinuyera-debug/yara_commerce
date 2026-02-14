"use client";
import { useState,useEffect } from "react";
import axios from "axios";

export default function EditProfilePage() {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        age: "",
        height: "",
        weight: "",
        gender: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Only send fields accepted by the server-side POST handler
            const allowed = ["firstName", "lastName", "phone", "age", "height", "weight", "gender"];
            const numeric = ["age", "height", "weight"];
            const payload: any = {};
            for (const key of allowed) {
                const val = (form as any)[key];
                if (val === null || val === undefined) continue;
                const trimmed = typeof val === "string" ? val.trim() : val;
                if (trimmed === "") continue; // skip empty fields
                if (numeric.includes(key)) {
                    const n = Number(trimmed);
                    if (!Number.isNaN(n)) payload[key] = n;
                } else {
                    payload[key] = trimmed;
                }
            }

            if (Object.keys(payload).length === 0) {
                setError("Please fill at least one of: firstName, lastName, phone, age, height, weight, gender");
                setLoading(false);
                return;
            }

            const res = await axios.post("/api/user/profile", payload);
            setSuccess(res.data?.message || "Profile updated successfully");
        } catch (err: any) {
            setError(err?.response?.data?.error || err.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    // prefill form with existing profile values
    useEffect(() => {
        let mounted = true;
        axios
            .get("/api/user/profile")
            .then((res) => {
                if (!mounted) return;
                const profile = res.data?.profile?.userProfile ?? res.data?.profile;
                if (!profile) return;
                setForm((f) => ({
                    ...f,
                    firstName: profile.firstName ?? "",
                    lastName: profile.lastName ?? "",
                    phone: profile.phone ?? "",
                    age: profile.age !== undefined && profile.age !== null ? String(profile.age) : "",
                    height: profile.height !== undefined && profile.height !== null ? String(profile.height) : "",
                    weight: profile.weight !== undefined && profile.weight !== null ? String(profile.weight) : "",
                    gender: profile.gender ?? "",
                }));
            })
            .catch(() => {})
            .finally(() => {});

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" className="input" />
                <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" className="input" />
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="input" />
                <input name="age" type="number" value={form.age} onChange={handleChange} placeholder="Age" className="input" />
                <input name="height" type="number" step="any" value={form.height} onChange={handleChange} placeholder="Height" className="input" />
                <input name="weight" type="number" step="any" value={form.weight} onChange={handleChange} placeholder="Weight" className="input" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select name="gender" value={form.gender} onChange={handleChange} className="input">
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div className="flex items-center gap-3">
                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
                    {loading ? "Saving..." : "Save"}
                </button>
                {error && <p className="text-red-600">{error}</p>}
                {success && <p className="text-green-600">{success}</p>}
            </div>
        </form>
    );
}