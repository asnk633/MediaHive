"use client";

import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";
import { useState, useEffect } from "react";
import { triggerHaptic } from "@/lib/haptics";

export default function AppTour() {
    const [run, setRun] = useState(false);

    useEffect(() => {
        const done = localStorage.getItem("mediahive_tour_complete");
        if (!done) {
            // Delay slightly to ensure dashboard is settled
            const timer = setTimeout(() => setRun(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const steps: Step[] = [
        {
            target: "#fab-create-task",
            content: "Create a new task for shoots, editing, or design work.",
            disableBeacon: true,
        },
        {
            target: "#calendar-widget",
            content: "View upcoming events and schedules here.",
        },
        {
            target: "#notification-bell",
            content: "You will receive updates when tasks are assigned.",
        }
    ];

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            localStorage.setItem("mediahive_tour_complete", "true");
        }
        
        if (data.action === 'next' || data.action === 'prev') {
            triggerHaptic();
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showSkipButton
            showProgress
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: '#0096FF',
                    textColor: '#1e293b',
                    backgroundColor: '#ffffff',
                    arrowColor: '#ffffff',
                },
                tooltipContainer: {
                    textAlign: 'left',
                    borderRadius: '12px',
                    padding: '8px',
                },
                buttonNext: {
                    borderRadius: '8px',
                    fontWeight: '600',
                },
                buttonBack: {
                    marginRight: '12px',
                    fontWeight: '600',
                    color: '#64748b'
                },
                buttonSkip: {
                    color: '#94a3b8'
                }
            }}
        />
    );
}
