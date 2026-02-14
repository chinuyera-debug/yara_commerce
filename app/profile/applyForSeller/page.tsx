
"use client";
import ApplyForSeller from "@/components/profile/applyForSeller/apply";
import { useRouter } from "next/navigation";
export default function applyForSeller() {
    const router = useRouter();
    return (
        <div>
            dont refresh the page 
            <button onClick={() => router.back()}>{"<-"}</button>   
            <ApplyForSeller />
        </div>
    );
}