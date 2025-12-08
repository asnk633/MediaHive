"use client";

import { use } from "react";
import Link from "next/link";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="px-4 pb-28 pt-6">
      {/* Title + intro — based on your Stitch event detail view */}
      <h1 className="text-[32px] font-bold leading-tight">Quarterly Media Strategy Meeting</h1>
      <p className="pt-2 text-zinc-300">
        A brief paragraph outlining the event's purpose and agenda, discussing KPIs and the next quarter’s content plan.
      </p>

      {/* Meta rows */}
      <div className="mt-6 space-y-2">
        <MetaRow icon="calendar_month" label="Start Date &amp; Time" value="Sep 20, 2024, 10:00 AM" />
        <MetaRow icon="schedule" label="End Date &amp; Time" value="Sep 20, 2024, 11:30 AM" />
        <MetaRow
          icon="videocam"
          label="Location / Link"
          value={
            <a className="text-[#00BFA6] underline" href="#">
              Join Google Meet
            </a>
          }
        />
      </div>

      {/* Attendees */}
      <section className="mt-6 rounded-xl bg-zinc-900/40 p-4">
        <h3 className="mb-3 text-lg font-bold">Attendees (6)</h3>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            {[
              "https://lh3.googleusercontent.com/aida-public/AB6AXuBRKYV7QicHBAvH2xcQ56mCz0GwmUZun2IDs5FgXh68dywkGGTwlrfXSK-hARWf95y8Aw2-zOgvrnCYvptia5SQiX3M_znHnTssxwhQYYOJZuo6vsIvVsqhuqn8PD0FCdCrdRxNw6yn0aM100n8-lk-YFSPKTxvAR4zktOCZJMpflUs-V-rbEW4oGdz1XpZK_ioqP8Xu13PASRz5T4oNMwhho7yficYc-nIeyp9YdmcHVgv8UQW-T_u4n5TmYk8FPvXDMSrvKfURg-w",
              "https://lh3.googleusercontent.com/aida-public/AB6AXuBfXB9PP-76B0vdwbzeFLNvqlPcO4dIjzSZRENoleyGy8cVLnlml5PHF74cwJz5GesVCP8gWbeQCCONlX_sDyvE5vOg-v-GkVPmBYcC11U_KDGOUEL78xiDiQqzFhxKPHSfhe0UQfTyb-eKQnjoxlLcznd0QVZLNCQ7jgD6oHeCxQAQaVbgqJvlhzB-f9lO16TNC35qD7Q8JKyIL16Fr0u3YwsoHOdQpxCID2fcg8N94z7dPjF8qadUvHHB6lb93UHLMEKUWyQvXu0a",
              "https://lh3.googleusercontent.com/aida-public/AB6AXuBX9GPqAcluoDkiEijkGvmnHDv4dzcI4xPIF9vwPUO6HlFpJ-eT0uInlzgmtvQ-x5_E41KOsiIPaXneifC1VcDS8z0IheZHWJ3hgbzKDxfn8Fd221pcWO4sbGojfXpDnzC5WqHHyceH1xb2HxzepiiDGWbpd12bQkR2IaOaDU0jAFJrx0Ea963Iq13uudOtX5UpLq1z1tddhPxb6ESCkwpL6qM74eFFCjg0t8mDk1v2vyqE-nGVtngsmiJcHhmUEkIhfvjkVPgjyUxd",
              "https://lh3.googleusercontent.com/aida-public/AB6AXuD2Rf42Z3deNi-uxCygsrhYI8ESFUcGl60ETOMIQdJFixNbnkeb4jAMPBDlNS4ejrjjo7ZyAnsTFujbHYaC-lI-4X9dXxSumbF7n_OkeAvdOtnPjzVfj4DX2BKUklY0xoGV5z-fuNPAYPM_uzToYbZdxWfTL9v_5dp8G_MKW6b9e-zuoKdrcg059zVU0BTDu_8W8Ut2xasjU6AZW_IoVdJTSOGlm0qhajiR0JzZY-y_kZFB04b_xZ4oGpPduygevsas88oWUSTpN2b1",
            ].map((src) => (
              <img key={src} src={src} alt="" className="size-10 rounded-full border-2 border-[#121212] object-cover" />
            ))}
            <div className="grid size-10 place-items-center rounded-full border-2 border-[#121212] bg-zinc-700 text-sm font-semibold">
              +2
            </div>
          </div>
          <div className="flex-1" />
          <button className="text-[#00BFA6] font-bold">View All</button>
        </div>
      </section>

      {/* Linked tasks */}
      <section className="mt-6 rounded-xl bg-zinc-900/40 p-4">
        <h3 className="mb-3 text-lg font-bold">Linked Tasks</h3>
        <ul className="space-y-3">
          <Linked icon="task_alt" text="Prepare Presentation Slides" />
          <Linked icon="meeting_room" text="Book Conference Room A" />
        </ul>
      </section>

      {/* Actions */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href="./edit" className="grid h-12 place-items-center rounded-xl bg-[#00BFA6] font-bold text-black">
          Edit Event
        </Link>
        <Link href="./delete" className="grid h-12 place-items-center rounded-xl bg-white/10">
          Delete
        </Link>
      </div>

      <p className="mt-8 text-xs text-white/50">Event ID: {id}</p>
    </div>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: React.ReactNode | string;
}) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="grid size-10 place-items-center rounded-lg bg-[#00BFA6]/20 text-[#00BFA6]">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <p className="text-base">{label}</p>
      </div>
      <div className="shrink-0 text-zinc-300">{value}</div>
    </div>
  );
}

function Linked({ icon, text }: { icon: string; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="grid size-8 place-items-center rounded-full bg-zinc-700 text-zinc-300">
        <span className="material-symbols-outlined !text-[20px]">{icon}</span>
      </div>
      <p>{text}</p>
    </li>
  );
}