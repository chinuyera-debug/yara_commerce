import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/middlewares/withUser";
import { prisma } from "@/lib/prisma/client";

// GET: Fetch existing seller application data
export async function GET() {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId: user.id },
            include: {
                sellerAddress: true,
                sellerDocs: true,
            },
        });

        return NextResponse.json({ sellerProfile });
    } catch (error) {
        console.error("Error fetching seller profile:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Submit seller application
export async function POST(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { shopName, gstNumber, address, docs } = body;

        // Validate required fields
        if (!shopName || !gstNumber) {
            return NextResponse.json(
                { error: "Shop name and GST number are required" },
                { status: 400 }
            );
        }

        if (!address || !address.street || !address.city || !address.state || !address.zipCode || !address.country) {
            return NextResponse.json(
                { error: "Complete address is required" },
                { status: 400 }
            );
        }

        if (!docs || !docs.panCardFront || !docs.panCardBack || !docs.aadharCardFront || !docs.aadharCardBack) {
            return NextResponse.json(
                { error: "All document images (PAN front/back, Aadhaar front/back) are required" },
                { status: 400 }
            );
        }

        // Upsert sellerProfile
        const sellerProfile = await prisma.sellerProfile.upsert({
            where: { userId: user.id },
            update: {
                shopName: shopName.trim(),
                gstNumber: gstNumber.trim(),
                isRequestedForSeller: true,
            },
            create: {
                userId: user.id,
                shopName: shopName.trim(),
                gstNumber: gstNumber.trim(),
                isRequestedForSeller: true,
            },
        });

        // Upsert sellerAddress
        await prisma.sellerAddress.upsert({
            where: { userId: sellerProfile.userId },
            update: {
                district: address.district?.trim() || null,
                street: address.street.trim(),
                city: address.city.trim(),
                state: address.state.trim(),
                zipCode: address.zipCode.trim(),
                country: address.country.trim(),
            },
            create: {
                userId: sellerProfile.userId,
                district: address.district?.trim() || null,
                street: address.street.trim(),
                city: address.city.trim(),
                state: address.state.trim(),
                zipCode: address.zipCode.trim(),
                country: address.country.trim(),
            },
        });

        // Upsert sellerDocs
        await prisma.sellerDocs.upsert({
            where: { userId: sellerProfile.id },
            update: {
                panCardFront: docs.panCardFront,
                panCardBack: docs.panCardBack,
                aadharCardFront: docs.aadharCardFront,
                aadharCardBack: docs.aadharCardBack,
            },
            create: {
                userId: sellerProfile.id,
                panCardFront: docs.panCardFront,
                panCardBack: docs.panCardBack,
                aadharCardFront: docs.aadharCardFront,
                aadharCardBack: docs.aadharCardBack,
            },
        });

        return NextResponse.json({
            message: "Seller application submitted successfully",
            sellerProfile,
        });
    } catch (error: any) {
        console.error("Error submitting seller application:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}