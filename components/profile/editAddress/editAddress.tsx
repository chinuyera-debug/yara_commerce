"use client";

import { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import { Plus, Trash2, Edit2, CheckCircle, MapPin } from "lucide-react";

interface Address {
  id: string;
  district: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  isDefault: boolean;
}

export default function EditAddress() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false); // Global loading
  const [editingId, setEditingId] = useState<string | null>(null); // If null, means creating new if showing form
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // ID being acted upon

  const [form, setForm] = useState({
    district: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    isDefault: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/user/adress");
      setAddresses(res.data.addresses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      district: addr.district ?? "",
      street: addr.street ?? "",
      city: addr.city ?? "",
      state: addr.state ?? "",
      zipCode: addr.zipCode ?? "",
      country: addr.country ?? "",
      isDefault: addr.isDefault,
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      setActionLoading(id);
      await axios.delete(`/api/user/adress?id=${id}`);
      setAddresses(addresses.filter((a) => a.id !== id));
      setSuccess("Address deleted successfully");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to delete address");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      setActionLoading(id);
      await axios.put("/api/user/adress", { id, isDefault: true });
      // Optimistic update
      setAddresses(addresses.map(a => ({
        ...a,
        isDefault: a.id === id
      })));
      setSuccess("Default address updated");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to set default address");
    } finally {
      setActionLoading(null);
    }
  }

  const handleAddNew = () => {
    setEditingId(null);
    setForm({
      district: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      isDefault: addresses.length === 0, // Default true if it's the first
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("form");
    setError(null);
    setSuccess(null);

    try {
      const payload: any = { ...form };
      // Clean up empty strings
      Object.keys(payload).forEach(key => {
        if (typeof payload[key] === 'string' && payload[key].trim() === '') {
          payload[key] = null;
        }
      });
      // Ensure strings are trimmed
      Object.keys(payload).forEach(key => {
        if (typeof payload[key] === 'string') {
          payload[key] = payload[key].trim();
        }
      });

      let res: AxiosResponse;
      if (editingId) {
        res = await axios.put("/api/user/adress", { ...payload, id: editingId });
        setAddresses(addresses.map(a => a.id === editingId ? res.data.address : (res.data.address.isDefault ? { ...a, isDefault: false } : a)));
        setSuccess("Address updated successfully");
      } else {
        res = await axios.post("/api/user/adress", payload);
        // If the new one is default, others become non-default
        if (res.data.address.isDefault) {
          setAddresses([...addresses.map(a => ({ ...a, isDefault: false })), res.data.address]);
        } else {
          setAddresses([...addresses, res.data.address]);
        }
        setSuccess("Address added successfully");
      }
      setShowForm(false);
      setEditingId(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Operation failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && addresses.length === 0) return <div className="text-center p-4">Loading addresses...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Addresses</h2>
        {!showForm && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} /> Add New
          </button>
        )}
      </div>

      {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">{success}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-medium text-lg mb-4">{editingId ? "Edit Address" : "New Address"}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="street" value={form.street} onChange={handleChange} placeholder="Street Address" className="input bg-white" required />
            <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="input bg-white" required />
            <input name="district" value={form.district} onChange={handleChange} placeholder="District" className="input bg-white" />
            <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="input bg-white" required />
            <input name="zipCode" value={form.zipCode} onChange={handleChange} placeholder="ZIP Code" className="input bg-white" required />
            <input name="country" value={form.country} onChange={handleChange} placeholder="Country" className="input bg-white" required />
          </div>

          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              name="isDefault"
              checked={form.isDefault}
              onChange={handleChange}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Set as default address</span>
          </label>

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={actionLoading === "form"}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading === "form" ? "Saving..." : "Save Address"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Address List */}
      {!showForm && (
        <div className="grid grid-cols-1 gap-4">
          {addresses.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              No addresses found. Add one to get started.
            </div>
          ) : (
            addresses.map((addr) => (
              <div
                key={addr.id}
                className={`relative p-5 rounded-lg border ${addr.isDefault ? "border-blue-500 bg-blue-50/10" : "border-gray-200 hover:border-gray-300"
                  } transition-all`}
              >
                {addr.isDefault && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 text-blue-600 text-xs font-medium bg-blue-100 px-2 py-1 rounded-full">
                    <CheckCircle size={12} /> Default
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="mt-1 text-gray-400">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{addr.street || "No street"}</p>
                    <p className="text-gray-600 text-sm">
                      {addr.city}, {addr.state} {addr.zipCode}
                    </p>
                    <p className="text-gray-500 text-sm">{addr.country}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-3 border-t pt-3">
                  <button
                    onClick={() => handleEdit(addr)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 size={14} /> Edit
                  </button>

                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      disabled={actionLoading === addr.id}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      {actionLoading === addr.id ? "Setting..." : "Set Default"}
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={actionLoading === addr.id}
                    className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 ml-auto transition-colors"
                  >
                    <Trash2 size={14} /> {actionLoading === addr.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
