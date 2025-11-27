// src/app/(redesign)/tasks/page.tsx
import PageContainer from "@/components/ui/PageContainer";
import FAB from "@/client/components/FAB";
import BottomNav from "@/components/ui/BottomNav";

export default function TasksPage(){
  // Use small mock content; do not call APIs.
  return (
    <>
      <PageContainer>
        <h1 style={{fontSize:28, marginBottom:12}}>Task Management</h1>
        <section aria-labelledby="recent-tasks">
          <h2 id="recent-tasks">Recent Tasks</h2>
          <div style={{marginTop:12, display:"grid", gap:12}}>
            <div style={{padding:16, borderRadius:12, background:"var(--panel-solid)", boxShadow:"var(--shadow-1)"}}>
              <div style={{fontWeight:600}}>Prepare presentation slides</div>
              <div style={{color:"var(--muted)"}}>In Progress</div>
            </div>
            <div style={{padding:16, borderRadius:12, background:"var(--panel-solid)", boxShadow:"var(--shadow-1)"}}>
              <div style={{fontWeight:600}}>Schedule team meeting</div>
              <div style={{color:"var(--muted)"}}>Completed</div>
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