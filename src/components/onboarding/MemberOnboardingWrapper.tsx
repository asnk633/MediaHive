"use client";

import React, { useState } from "react";
import { MemberWelcomeModal } from "./MemberWelcomeModal";
import { MemberGuideModal } from "./MemberGuideModal";
 
export function MemberOnboardingWrapper() {
    const [showGuide, setShowGuide] = useState(false);
 
    return (
        <>
            <MemberWelcomeModal onOpenGuide={() => setShowGuide(true)} />
            <MemberGuideModal open={showGuide} onClose={() => setShowGuide(false)} />
        </>
    );
}
