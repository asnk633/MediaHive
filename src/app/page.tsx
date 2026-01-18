import { redirect } from "next/navigation";
import { verifyUser } from "@/lib/server-utils";

export default async function HomePage() {
    // Use a dummy Request to satisfy the signature; verifyUser relies on cookies()
    const user = await verifyUser(new Request("http://localhost"));

    if (user) {
        redirect("/home");
    } else {
        redirect("/login");
    }
}
