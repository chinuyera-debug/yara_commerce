import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/middlewares/withUser";
import { prisma } from "@/lib/prisma/client";

// GET: List seller's own products
export async function GET() {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify seller is approved
        const seller = await prisma.sellerProfile.findUnique({
            where: { userId: user.id },
            select: { id: true, isApprovedByAdmin: true },
        });

        if (!seller?.isApprovedByAdmin) {
            return NextResponse.json({ error: "Not an approved seller" }, { status: 403 });
        }

        const products = await prisma.sellerProducts.findMany({
            where: { userId: seller.id },
            include: {
                productReviews: {
                    select: { rating: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ products });
    } catch (error) {
        console.error("Error fetching seller products:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Create a new product
export async function POST(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const seller = await prisma.sellerProfile.findUnique({
            where: { userId: user.id },
            select: { id: true, isApprovedByAdmin: true },
        });

        if (!seller?.isApprovedByAdmin) {
            return NextResponse.json({ error: "Not an approved seller" }, { status: 403 });
        }

        const body = await req.json();
        const {
            name, description, price, mrp, stock, category, subCategory,
            fabricType, weaveType, occasion, color, pattern,
            length, width, weight, blouseIncluded, washCare, origin,
            images, tags, sku,
        } = body;

        // Validation
        if (!name?.trim()) {
            return NextResponse.json({ error: "Product name is required" }, { status: 400 });
        }
        if (!description?.trim()) {
            return NextResponse.json({ error: "Description is required" }, { status: 400 });
        }
        if (price == null || price <= 0) {
            return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
        }
        if (stock == null || stock < 0) {
            return NextResponse.json({ error: "Valid stock is required" }, { status: 400 });
        }
        if (!category) {
            return NextResponse.json({ error: "Category is required" }, { status: 400 });
        }
        if (!images || images.length === 0) {
            return NextResponse.json({ error: "At least one image is required" }, { status: 400 });
        }

        const product = await prisma.sellerProducts.create({
            data: {
                userId: seller.id,
                name: name.trim(),
                description: description.trim(),
                price: parseFloat(price),
                mrp: mrp ? parseFloat(mrp) : null,
                stock: parseInt(stock),
                category,
                subCategory: subCategory?.trim() || null,
                fabricType: fabricType || null,
                weaveType: weaveType || null,
                occasion: occasion || [],
                color: color || null,
                pattern: pattern || null,
                length: length ? parseFloat(length) : null,
                width: width ? parseFloat(width) : null,
                weight: weight ? parseFloat(weight) : null,
                blouseIncluded: blouseIncluded || false,
                washCare: washCare?.trim() || null,
                origin: origin?.trim() || null,
                images,
                tags: tags || [],
                sku: sku?.trim() || null,
            },
        });

        return NextResponse.json({ message: "Product created successfully", product });
    } catch (error: any) {
        console.error("Error creating product:", error);
        if (error?.code === "P2002" && error?.meta?.target?.includes("sku")) {
            return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH: Update stock for a product
export async function PATCH(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const seller = await prisma.sellerProfile.findUnique({
            where: { userId: user.id },
            select: { id: true, isApprovedByAdmin: true },
        });

        if (!seller?.isApprovedByAdmin) {
            return NextResponse.json({ error: "Not an approved seller" }, { status: 403 });
        }

        const body = await req.json();
        const { productId, stock } = body;

        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }
        if (stock == null || stock < 0) {
            return NextResponse.json({ error: "Stock must be 0 or greater" }, { status: 400 });
        }

        // Verify product belongs to this seller
        const product = await prisma.sellerProducts.findFirst({
            where: { id: productId, userId: seller.id },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found or not yours" }, { status: 404 });
        }

        const updated = await prisma.sellerProducts.update({
            where: { id: productId },
            data: { stock: parseInt(stock) },
        });

        return NextResponse.json({ success: true, product: updated });
    } catch (error: any) {
        console.error("Error updating stock:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
