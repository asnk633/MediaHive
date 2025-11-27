// src/app/(redesign)/reports/page.tsx
import PageContainer from "@/components/ui/PageContainer";
import FAB from "@/client/components/FAB";
import BottomNav from "@/components/ui/BottomNav";

export default function ReportsPage(){
  // Use small mock content; do not call APIs.
  return (
    <>
      <PageContainer>
        <h1 style={{fontSize:28, marginBottom:12}}>Reports Dashboard</h1>
        <section aria-labelledby="key-metrics">
          <h2 id="key-metrics">Key Metrics</h2>
          <div style={{marginTop:12, display:"grid", gap:12}}>
            <div style={{padding:16, borderRadius:12, background:"var(--panel-solid)", boxShadow:"var(--shadow-1)"}}>
              <div style={{fontWeight:600}}>Task Completion Rate</div>
              <div style={{color:"var(--muted)"}}>85% this month</div>
            </div>
            <div style={{padding:16, borderRadius:12, background:"var(--panel-solid)", boxShadow:"var(--shadow-1)"}}>
              <div style={{fontWeight:600}}>Event Attendance</div>
              <div style={{color:"var(--muted)"}}>92% average</div>
            </div>
          </div>
        </section>
      </PageContainer>

      {/* Visual-only FAB (role set to admin for preview) */}
      <FAB role="admin" />
      <BottomNav />
    </>
  );
}