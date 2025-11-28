// src/app/(redesign)/reports/page.tsx
import PageContainer from "@/components/ui/PageContainer";
import FAB from "@/client/components/FAB";
import BottomNav from "@/components/ui/BottomNav";

export default function ReportsPage(){
  return (
    <>
      <PageContainer>
        <h1 style={{fontSize:28, marginBottom:12}}>Reports</h1>
        <section aria-labelledby="available-reports">
          <h2 id="available-reports">Available Reports</h2>
          <div style={{marginTop:12, display:"grid", gap:12}}>
            <div style={{padding:16, borderRadius:12, background:"var(--panel-solid)", boxShadow:"var(--shadow-1)"}}>
              <div style={{fontWeight:600}}>Monthly Performance</div>
              <div style={{color:"var(--muted)"}}>Updated yesterday</div>
            </div>
            <div style={{padding:16, borderRadius:12, background:"var(--panel-solid)", boxShadow:"var(--shadow-1)"}}>
              <div style={{fontWeight:600}}>Patient Satisfaction</div>
              <div style={{color:"var(--muted)"}}>Updated last week</div>
            </div>
          </div>
        </section>
      </PageContainer>

      <FAB role="admin" />
      <BottomNav />
    </>
  );
}