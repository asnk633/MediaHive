
import { MediaHiveLoader } from "@/components/ui/MediaHiveLoader";

export default function Loading() {
    return (
        <div className="fixed inset-0 bg-[#0f172a] flex items-center justify-center z-[9999]">
            {/* Large Scale Loader for Full Page */}
            <MediaHiveLoader size={2} />
        </div>
    );
}
