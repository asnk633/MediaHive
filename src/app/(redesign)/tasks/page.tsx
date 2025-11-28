// src/app/(redesign)/tasks/page.tsx
import PageContainer from "@/components/ui/PageContainer";
import FAB from "@/client/components/FAB";
import BottomNav from "@/components/ui/BottomNav";

export default function TasksPage(){
  return (
    <>
      <PageContainer>
        <h1 style={{fontSize:28, marginBottom:12}}>Tasks</h1>
        <section aria-labelledby="pending-tasks">
          <h2 id="pending-tasks">Pending Tasks</h2>
          <div style={{marginTop:12, display:"grid", gap:12}}>
            <div style={{padding:16, borderRadius:12, background:"var(--panel-solid)", boxShadow:"var(--shadow-1)"}}>
              <div style={{fontWeight:600}}>Review patient feedback</div>
              <div style={{color:"var(--muted)"}}>Due tomorrow</div>
            </div>
            <div style={{padding:16, borderRadius:12, background:"var(--panel-solid)", boxShadow:"var(--shadow-1)"}}>
              <div style={{fontWeight:600}}>Update medication database</div>
              <div style={{color:"var(--muted)"}}>Due in 3 days</div>
            </div>
          </div>
        </section>
      </PageContainer>

      <FAB role="team" />
      <BottomNav />
    </>
  );
}