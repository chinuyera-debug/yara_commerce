import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma/client";

export async function POST() {
    try {
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get: (name: string) => cookieStore.get(name)?.value,
                },
            }
        );

        // get authenticated user
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 🔒 atomic — no race condition
        await prisma.user.upsert({
            where: { id: user.id },
            update: {
                email: user.email ?? "",
            },
            create: {
                id: user.id,
                email: user.email ?? "",
                isAdmin: false,
                
            },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("First login sync failed:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
