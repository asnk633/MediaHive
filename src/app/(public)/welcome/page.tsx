"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const slides = [
    {
        title: "Simplify Your Media Workflow",
        subtitle:
            "Collect requests, assign your team, and track progress across all Thaiba campuses in one place.",
    },
    {
        title: "Prioritise What Really Matters",
        subtitle:
            "Focus on urgent shoots, live streams, and designs with a clear view of today, this week, and upcoming work.",
    },
    {
        title: "See Progress At A Glance",
        subtitle:
            "Get a dashboard of tasks, events, and reports so nothing slips through the cracks.",
    },
];

export default function WelcomePage() {
    const [index, setIndex] = useState(0);
    const router = useRouter();
    const slide = slides[index];

    const handleNext = () => {
        if (index < slides.length - 1) {
            setIndex(index + 1);
        } else {
            router.push("/login"); // or /home if you already handle auth
        }
    };

    const handleSkip = () => {
        router.push("/login");
    };

    return (
        <main className="flex flex-1 flex-col">
            {/* top brand row */}
            <header className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10">
                        <span className="h-4 w-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin-slow" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-slate-900">
                        Thaiba Tasks
                    </span>
                </div>

                <button
                    type="button"
                    onClick={handleSkip}
                    className="text-xs font-medium text-sky-600 hover:text-sky-700"
                >
                    Skip
                </button>
            </header>

            {/* illustration placeholder */}
            <section className="flex flex-col items-center">
                <div className="mb-8 h-52 w-full rounded-3xl bg-white shadow-md shadow-sky-100/80 flex items-center justify-center">
                    {/* You can replace this with an SVG or Lottie later */}
                    <div className="space-y-3 text-center">
                        <div className="mx-auto h-14 w-14 rounded-2xl bg-sky-500/10" />
                        <div className="mx-auto h-3 w-32 rounded-full bg-slate-200" />
                        <div className="mx-auto h-3 w-20 rounded-full bg-slate-100" />
                    </div>
                </div>

                <h1 className="mb-3 text-center text-2xl font-semibold leading-snug text-slate-900">
                    {slide.title}
                </h1>
                <p className="mb-8 text-center text-sm leading-relaxed text-slate-500">
                    {slide.subtitle}
                </p>

                {/* dots */}
                <div className="mb-10 flex items-center justify-center gap-2">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            aria-label={`Go to slide ${i + 1}`}
                            onClick={() => setIndex(i)}
                            className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-sky-500" : "w-2 bg-slate-300"
                                }`}
                        />
                    ))}
                </div>
            </section>

            {/* bottom CTA button */}
            <div className="mt-auto">
                <button
                    type="button"
                    onClick={handleNext}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-300/70 active:translate-y-0.5 transition-transform"
                >
                    {index < slides.length - 1 ? "Next" : "Get Started"}
                </button>

                <p className="mt-4 text-center text-xs text-slate-500">
                    Already using Thaiba Tasks?{" "}
                    <button
                        type="button"
                        onClick={() => router.push("/login")}
                        className="font-semibold text-sky-600"
                    >
                        Log in
                    </button>
                </p>
            </div>
        </main>
    );
}
