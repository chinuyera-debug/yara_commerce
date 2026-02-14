import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/middlewares/withUser";
import { prisma } from "@/lib/prisma/client";

// ─── GET: Fetch orders containing this seller's products ──
export async function GET() {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const seller = await prisma.sellerProfile.findUnique({
            where: { userId: user.id },
            select: { id: true, isApprovedByAdmin: true },
        });

        if (!seller?.isApprovedByAdmin) {
            return NextResponse.json({ error: "Not an approved seller" }, { status: 403 });
        }

        // Find all order items that belong to this seller, grouped by order
        const orderItems = await prisma.orderItem.findMany({
            where: { sellerId: seller.id },
            include: {
                product: {
                    select: {
                        name: true,
                        images: true,
                        price: true,
                        category: true,
                    },
                },
                order: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                userProfile: {
                                    select: { firstName: true, lastName: true, phone: true },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { order: { createdAt: "desc" } },
        });

        // Group by order for easier frontend consumption
        const ordersMap = new Map<string, any>();
        for (const item of orderItems) {
            const orderId = item.orderId;
            if (!ordersMap.has(orderId)) {
                ordersMap.set(orderId, {
                    id: item.order.id,
                    status: item.order.status,
                    paymentStatus: item.order.paymentStatus,
                    paymentMethod: item.order.paymentMethod,
                    totalAmount: item.order.totalAmount,
                    finalAmount: item.order.finalAmount,
                    createdAt: item.order.createdAt,
                    updatedAt: item.order.updatedAt,
                    buyer: {
                        name: [item.order.user.userProfile?.firstName, item.order.user.userProfile?.lastName]
                            .filter(Boolean).join(" ") || "Customer",
                        email: item.order.user.email,
                        phone: item.order.user.userProfile?.phone || null,
                    },
                    items: [],
                });
            }
            ordersMap.get(orderId).items.push({
                id: item.id,
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                product: item.product,
            });
        }

        const orders = Array.from(ordersMap.values());

        return NextResponse.json({ success: true, orders });
    } catch (error: any) {
        console.error("Seller orders fetch error:", error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}

// ─── PATCH: Accept or reject an order ─────────────────────
export async function PATCH(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const seller = await prisma.sellerProfile.findUnique({
            where: { userId: user.id },
            select: { id: true, isApprovedByAdmin: true },
        });

        if (!seller?.isApprovedByAdmin) {
            return NextResponse.json({ error: "Not an approved seller" }, { status: 403 });
        }

        const body = await req.json();
        const { orderId, action } = body;

        if (!orderId) {
            return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
        }
        if (!["confirmed", "cancelled", "shipped"].includes(action)) {
            return NextResponse.json({ error: "Action must be 'confirmed', 'cancelled', or 'shipped'" }, { status: 400 });
        }

        // Verify this order has items belonging to this seller
        const orderItems = await prisma.orderItem.findMany({
            where: { orderId, sellerId: seller.id },
        });

        if (orderItems.length === 0) {
            return NextResponse.json({ error: "No items in this order belong to you" }, { status: 403 });
        }

        // Get current order
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Validate status transitions
        if (action === "confirmed" && order.status !== "pending") {
            return NextResponse.json({ error: `Cannot accept an order that is already ${order.status}` }, { status: 400 });
        }
        if (action === "cancelled" && !["pending", "confirmed"].includes(order.status)) {
            return NextResponse.json({ error: `Cannot reject an order that is already ${order.status}` }, { status: 400 });
        }
        if (action === "shipped" && order.status !== "confirmed") {
            return NextResponse.json({ error: "Only confirmed orders can be dispatched" }, { status: 400 });
        }

        // Update order status
        const updatedOrder = await prisma.$transaction(async (tx) => {
            const now = new Date();
            const updated = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: action,
                    ...(action === "confirmed" && { confirmedAt: now }),
                    ...(action === "shipped" && { shippedAt: now }),
                    ...(action === "cancelled" && { cancelledAt: now }),
                },
            });

            // If cancelled, restore stock
            if (action === "cancelled") {
                for (const item of orderItems) {
                    await tx.sellerProducts.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } },
                    });
                }
            }

            return updated;
        });

        return NextResponse.json({
            success: true,
            order: updatedOrder,
            message: action === "confirmed" ? "Order accepted successfully"
                : action === "shipped" ? "Order dispatched successfully"
                    : "Order rejected and stock restored",
        });
    } catch (error: any) {
        console.error("Seller order update error:", error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
