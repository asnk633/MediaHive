"use client";

import React, { useState } from "react";
import { GuestWelcomeModal } from "./GuestWelcomeModal";
import { GuestGuideModal } from "./GuestGuideModal";

export function GuestOnboardingWrapper() {
    const [showGuide, setShowGuide] = useState(false);

    return (
        <>
            <GuestWelcomeModal onOpenGuide={() => setShowGuide(true)} />
            <GuestGuideModal open={showGuide} onClose={() => setShowGuide(false)} />
        </>
    );
}
