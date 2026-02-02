'use client';


export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-card)] flex items-center justify-center p-4">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-[var(--text-primary)] mb-4">404</h1>
                <p className="text-xl text-[var(--text-secondary)] mb-8">Page not found</p>
                <a
                    href="/home"
                    className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                    Go Home
                </a>
            </div>
        </div>
    );
}
