import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/middlewares/withUser";
import { prisma } from "@/lib/prisma/client";

// ─── POST: Create order from cart (checkout) ──────────────
export async function POST(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const body = await req.json();
        const { addressId, paymentMethod, notes } = body;

        if (!addressId) {
            return NextResponse.json({ error: "Please select a delivery address" }, { status: 400 });
        }
        if (paymentMethod !== "cod") {
            return NextResponse.json({ error: "Only Cash on Delivery is available at the moment" }, { status: 400 });
        }

        // Verify address belongs to user
        const address = await prisma.userAddress.findFirst({
            where: { id: addressId, userId: dbUser.id },
        });
        if (!address) {
            return NextResponse.json({ error: "Address not found" }, { status: 404 });
        }

        // Get cart with items + product details
        const cart = await prisma.cart.findUnique({
            where: { userId: dbUser.id },
            include: {
                items: {
                    include: {
                        product: {
                            include: { seller: { select: { id: true } } },
                        },
                    },
                },
            },
        });

        if (!cart || cart.items.length === 0) {
            return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
        }

        // Validate stock availability
        for (const item of cart.items) {
            if (!item.product) {
                return NextResponse.json({ error: `Product not found for cart item` }, { status: 400 });
            }
            if (!item.product.isAvailable) {
                return NextResponse.json({ error: `"${item.product.name}" is no longer available` }, { status: 400 });
            }
            if (item.product.stock < item.quantity) {
                return NextResponse.json({
                    error: `Only ${item.product.stock} units left for "${item.product.name}"`,
                }, { status: 400 });
            }
        }

        // Calculate totals
        let totalAmount = 0;
        const orderItemsData = cart.items.map((item) => {
            const unitPrice = item.product!.price;
            const totalPrice = unitPrice * item.quantity;
            totalAmount += totalPrice;
            return {
                productId: item.productId,
                sellerId: item.product!.seller.id,
                quantity: item.quantity,
                unitPrice,
                totalPrice,
            };
        });

        // Create order + items + decrement stock in a transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create order
            const newOrder = await tx.order.create({
                data: {
                    userId: dbUser.id,
                    status: "pending",
                    paymentStatus: "cod_pending",
                    paymentMethod: "cod",
                    shippingMethod: "standard",
                    totalAmount,
                    discount: 0,
                    shippingCharge: 0,
                    finalAmount: totalAmount,
                    addressId,
                    notes: notes || null,
                    items: {
                        create: orderItemsData,
                    },
                },
                include: {
                    items: {
                        include: { product: { select: { name: true, images: true } } },
                    },
                },
            });

            // Stock is NOT decremented here — it will be decremented when the seller accepts (confirms) the order.

            // Clear cart items
            await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

            // Delete the cart
            await tx.cart.delete({ where: { id: cart.id } });

            return newOrder;
        });

        return NextResponse.json({ success: true, order });
    } catch (error: any) {
        console.error("Checkout error:", error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}

// ─── GET: Fetch user's orders ─────────────────────────────
export async function GET() {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const orders = await prisma.order.findMany({
            where: { userId: dbUser.id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                images: true,
                                price: true,
                                category: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ success: true, orders });
    } catch (error: any) {
        console.error("Fetch orders error:", error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
