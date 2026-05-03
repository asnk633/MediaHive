import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * getSupabaseServerClient
 * 
 * Creates a Supabase client that automatically reads the user's session
 * from cookies. This client should be used in API routes and Server Components.
 */
export async function getSupabaseServerClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options)
                        })
                    } catch (error) {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware/proxy refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}
