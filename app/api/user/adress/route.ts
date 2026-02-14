import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getUser } from "@/lib/middlewares/withUser";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      include: { userAddress: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ address: profile.userAddress });
  } catch (error) {
    console.error("Error fetching user address:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const updateObj: any = {};

    if (Object.prototype.hasOwnProperty.call(body, "district") && typeof body.district === "string") {
      const v = body.district.trim();
      if (v !== "") updateObj.district = v;
    }

    if (Object.prototype.hasOwnProperty.call(body, "street") && typeof body.street === "string") {
      const v = body.street.trim();
      if (v !== "") updateObj.street = v;
    }

    if (Object.prototype.hasOwnProperty.call(body, "city") && typeof body.city === "string") {
      const v = body.city.trim();
      if (v !== "") updateObj.city = v;
    }

    if (Object.prototype.hasOwnProperty.call(body, "state") && typeof body.state === "string") {
      const v = body.state.trim();
      if (v !== "") updateObj.state = v;
    }

    if (Object.prototype.hasOwnProperty.call(body, "zipCode") && typeof body.zipCode === "string") {
      const v = body.zipCode.trim();
      if (v !== "") updateObj.zipCode = v;
    }

    if (Object.prototype.hasOwnProperty.call(body, "country") && typeof body.country === "string") {
      const v = body.country.trim();
      if (v !== "") updateObj.country = v;
    }

    const address = await prisma.userAddress.upsert({
      where: { userId: user.id },
      update: updateObj,
      create: { userId: user.id, ...updateObj },
    });

    return NextResponse.json({ message: "Address updated successfully", address });
  } catch (error) {
    console.error("Error updating user address:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
