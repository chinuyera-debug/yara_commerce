"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function EditAddress() {
  const [form, setForm] = useState({
    district: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  useEffect(() => {
    let mounted = true;
    axios
      .get("/api/user/adress")
      .then((res) => {
        if (!mounted) return;
        const addr = res.data?.address ?? {};
        setForm({
          district: addr.district ?? "",
          street: addr.street ?? "",
          city: addr.city ?? "",
          state: addr.state ?? "",
          zipCode: addr.zipCode ?? "",
          country: addr.country ?? "",
        });
      })
      .catch(() => {})
      .finally(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const allowed = ["district", "street", "city", "state", "zipCode", "country"];
      const payload: any = {};
      for (const key of allowed) {
        const v = (form as any)[key];
        if (v === undefined || v === null) continue;
        const t = typeof v === "string" ? v.trim() : v;
        if (t === "") continue;
        payload[key] = t;
      }

      if (Object.keys(payload).length === 0) {
        setError("Please fill at least one address field to update.");
        setLoading(false);
        return;
      }

      const res = await axios.post("/api/user/adress", payload);
      setSuccess(res.data?.message || "Address updated successfully");
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to update address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input name="street" value={form.street} onChange={handleChange} placeholder="Street" className="input" />
        <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="input" />
        <input name="district" value={form.district} onChange={handleChange} placeholder="District" className="input" />
        <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="input" />
        <input name="zipCode" value={form.zipCode} onChange={handleChange} placeholder="Zip code" className="input" />
        <input name="country" value={form.country} onChange={handleChange} placeholder="Country" className="input" />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? "Saving..." : "Save Address"}
        </button>
        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}
      </div>
    </form>
  );
}
