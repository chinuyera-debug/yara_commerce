"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
export default function ProfilePage() {
	const [profile, setProfile] = useState<any | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();


	useEffect(() => {
		let mounted = true;
		setLoading(true);

		axios
			.get("/api/user/profile")
			.then((res) => {
				if (!mounted) return;
				const data = res.data;
				setProfile(data.profile ?? data);
				console.log("Fetched profile:", data.profile ?? data);
				setError(null);
			})
			.catch((err) => {
				if (!mounted) return;
				const msg = err?.response?.data?.error || err.message || "Error fetching profile";
				setError(msg);
			})
			.finally(() => {
				if (!mounted) return;
				setLoading(false);
			});

		return () => {
			mounted = false;
		};
	}, []);

	return (
		<div className="p-6">

			<h1 className="text-2xl font-semibold mb-4">Profile</h1>

			{loading ? (
				<p>Loading...</p>
			) : error ? (
				<p className="text-red-600">Error: {error}</p>
			) : profile ? (
				<div className="space-y-3">
					<div>
						<strong>Email:</strong> {profile.email ?? "—"}
					</div>
					<div>
						<strong>ID:</strong> {profile.id ?? "—"}
					</div>

					{profile.userProfile ? (
						<div className="pt-2">
							<h2 className="font-medium">User Profile</h2>
							<div>
								<strong>Name:</strong>{" "}
								{`${profile.userProfile.firstName ?? ""} ${profile.userProfile.lastName ?? ""}`.trim() || "—"}
							</div>
							<div>
								<strong>Phone:</strong> {profile.userProfile.phone ?? "—"}
							</div>
							<div>
								<strong>Age:</strong> {profile.userProfile.age ?? "—"}
							</div>
							<div>
								<strong>Gender:</strong> {profile.userProfile.gender ?? "—"}
							</div>
							<div>
								<strong>Height:</strong> {profile.userProfile.height ?? "—"}cm
							</div>
							<div>
								<strong>Weight:</strong> {profile.userProfile.weight ?? "—"}kg
							</div>
						</div>
					) : (<><p className="text-gray-500">No user profile data available.</p>
						<button
							className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
							onClick={() => router.push("/profile/editProfile")}
						>Update Profile</button>
					</>)}
					<button
						className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
						onClick={() => router.push("/profile/editProfile")}
					>Update Profile</button>
					{(() => {
						const defaultAddr = Array.isArray(profile.userAddress)
							? profile.userAddress.find((a: any) => a.isDefault)
							: null;
						return defaultAddr ? (
							<div className="pt-2">
								<h2 className="font-medium flex items-center gap-2">
									Default Address
									<span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-normal">Default</span>
								</h2>
								<div>
									<strong>Street:</strong> {defaultAddr.street ?? "—"}
								</div>
								<div>
									<strong>City:</strong> {defaultAddr.city ?? "—"}
								</div>
								<div>
									<strong>District:</strong> {defaultAddr.district ?? "—"}
								</div>
								<div>
									<strong>State:</strong> {defaultAddr.state ?? "—"}
								</div>
								<div>
									<strong>Zip:</strong> {defaultAddr.zipCode ?? "—"}
								</div>
								<div>
									<strong>Country:</strong> {defaultAddr.country ?? "—"}
								</div>
							</div>
						) : (
							<p className="text-gray-500 pt-2">No default address set.</p>
						);
					})()}
					<button
						className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
						onClick={() => router.push("/profile/editAddress")}
					>Update Address</button>

					{profile.sellerProfile?.isApprovedByAdmin ? (
						<div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded">
							✅ Approved Seller
						</div>
					) : profile.sellerProfile?.isRequestedForSeller ? (
						<div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded">
							⏳ Seller Application Pending
						</div>
					) : (
						<button
							className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
							onClick={() => router.push("/profile/applyForSeller")}
						>Apply to be a Seller</button>
					)}

					<details>
						<summary className="mt-2 cursor-pointer">Raw JSON</summary>
						<pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">{JSON.stringify(profile, null, 2)}</pre>
					</details>
				</div>
			) : (
				<p>No profile data.</p>
			)}
		</div>
	);
}


