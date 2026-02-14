import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getUser } from "@/lib/middlewares/withUser";
export async function GET() {
    try {
        const supabase = await createClient();

        // get authenticated user
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // fetch user profile from DB
        const profile = await prisma.user.findUnique({
            where: { id: user.id },
            include: { userProfile: true,
                userAddress: true,
             },

        });
        if (!profile) { return NextResponse.json({ error: "Profile not found" }, { status: 404 }); }

        return NextResponse.json({ profile });
    }
    catch (error) { console.error("Error fetching user profile:", error); return NextResponse.json({ error: "Internal Server Error" }, { status: 500 }); }
}


export async function POST(req:NextRequest) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await req.json();
    // Build update object with only provided fields to avoid overwriting with nulls
    const updateObj: any = {};

    if (Object.prototype.hasOwnProperty.call(body, "firstName") && typeof body.firstName === "string") {
      const v = body.firstName.trim();
      if (v !== "") updateObj.firstName = v;
    }

    if (Object.prototype.hasOwnProperty.call(body, "lastName") && typeof body.lastName === "string") {
      const v = body.lastName.trim();
      if (v !== "") updateObj.lastName = v;
    }

    if (Object.prototype.hasOwnProperty.call(body, "phone") && typeof body.phone === "string") {
      const v = body.phone.trim();
      if (v !== "") updateObj.phone = v;
    }

    if (Object.prototype.hasOwnProperty.call(body, "age") && body.age !== undefined && body.age !== null) {
      const n = Number(body.age);
      if (!Number.isNaN(n)) updateObj.age = n;
    }

    if (Object.prototype.hasOwnProperty.call(body, "height") && body.height !== undefined && body.height !== null) {
      const n = Number(body.height);
      if (!Number.isNaN(n)) updateObj.height = n;
    }

    if (Object.prototype.hasOwnProperty.call(body, "weight") && body.weight !== undefined && body.weight !== null) {
      const n = Number(body.weight);
      if (!Number.isNaN(n)) updateObj.weight = n;
    }

    // handle gender (accept case-insensitive 'male'|'female'|'other' or enum values)
    if (Object.prototype.hasOwnProperty.call(body, "gender") && typeof body.gender === "string") {
      const g = String(body.gender).trim().toLowerCase();
      const allowed = ["male", "female", "other"];
      if (allowed.includes(g)) {
        updateObj.gender = g; // store lowercase enum value
      }
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: updateObj,
      create: { userId: user.id, ...updateObj },
    });

        
        
        return NextResponse.json({ message: "Profile updated successfully", profile });
    } catch (error) {
        console.error("Error updating user profile:", error);
        
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}