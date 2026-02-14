import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/middlewares/withUser";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const docType = formData.get("docType") as string | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!docType || !["panCardFront", "panCardBack", "aadharCardFront", "aadharCardBack"].includes(docType)) {
            return NextResponse.json({ error: "Invalid docType" }, { status: 400 });
        }

        // Convert file to base64 data URI for Cloudinary upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString("base64");
        const dataUri = `data:${file.type};base64,${base64}`;

        const result = await cloudinary.uploader.upload(dataUri, {
            folder: `seller-docs/${user.id}`,
            public_id: `${docType}_${Date.now()}`,
            resource_type: "image",
        });

        return NextResponse.json({
            url: result.secure_url,
            public_id: result.public_id,
        });
    } catch (error: any) {
        console.error("Error uploading document:", error);
        return NextResponse.json(
            { error: error.message || "Upload failed" },
            { status: 500 }
        );
    }
}
