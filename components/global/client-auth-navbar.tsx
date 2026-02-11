"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "./navbar";

export default function ClientAuthNavbar({
    initialAuthenticated,
}: {
    initialAuthenticated: boolean;
}) {
    const [authenticated, setAuthenticated] = useState<boolean>(initialAuthenticated);

    useEffect(() => {
        const supabase = createClient();

        // ensure initial client-side state matches actual session
        supabase.auth.getUser().then(({ data }) => setAuthenticated(Boolean(data?.user)));

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setAuthenticated(Boolean(session?.user));
        });

        return () => {
            // unsubscribe listener when component unmounts
            try {
                listener?.subscription?.unsubscribe?.();
            } catch { }
        };
    }, []);

    if (!authenticated) return null;

    return <Navbar />;
}
