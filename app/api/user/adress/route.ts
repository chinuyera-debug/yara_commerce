import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getUser } from "@/lib/middlewares/withUser";

// GET: Fetch all addresses for the logged-in user
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.userAddress.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: 'desc' } // Default address first
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Create a new address
export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Check if this is the first address for the user?
    const count = await prisma.userAddress.count({ where: { userId: user.id } });
    const isFirst = count === 0;

    const isDefault = body.isDefault === true || isFirst;

    // If making default, unset previous default
    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.userAddress.create({
      data: {
        userId: user.id,
        district: body.district ?? null,
        street: body.street ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        zipCode: body.zipCode ?? null,
        country: body.country ?? null,
        isDefault: isDefault,
      },
    });

    return NextResponse.json({ message: "Address created successfully", address: newAddress });
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Update an existing address
export async function PUT(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.userAddress.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    if (updates.isDefault === true) {
      await prisma.userAddress.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (updates.district !== undefined) updateData.district = updates.district;
    if (updates.street !== undefined) updateData.street = updates.street;
    if (updates.city !== undefined) updateData.city = updates.city;
    if (updates.state !== undefined) updateData.state = updates.state;
    if (updates.zipCode !== undefined) updateData.zipCode = updates.zipCode;
    if (updates.country !== undefined) updateData.country = updates.country;
    if (updates.isDefault !== undefined) updateData.isDefault = updates.isDefault;


    const updatedAddress = await prisma.userAddress.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: "Address updated successfully", address: updatedAddress });

  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Remove an address
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.userAddress.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    await prisma.userAddress.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Address deleted successfully" });

  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
