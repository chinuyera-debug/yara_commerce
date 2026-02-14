"use client";


import EditProfilePage from "@/components/profile/editProfile/editProfile";
import { useRouter } from "next/navigation";

export default function EditProfilePageShow() {
 const router = useRouter();

  return (
    <div className="p-6">
      <button onClick={() => router.back()}>{"<-"}</button>
     
      <EditProfilePage />
    </div>
  );
}
