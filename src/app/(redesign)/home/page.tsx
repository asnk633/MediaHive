// src/app/(redesign)/home/page.tsx
import PageContainer from "@/components/ui/PageContainer";
import FAB from "@/client/components/FAB";
import BottomNav from "@/components/ui/BottomNav";

export default function HomePage(){
  // Use small mock content; do not call APIs.
  return (
    <>
      <PageContainer>
        <h1 style={{fontSize:28, marginBottom:12}}>Good Morning, Admin.</h1>
        <section aria-labelledby="upcoming">
          <h2 id="upcoming">Upcoming Tasks</h2>
          <div style={{marginTop:12, display:"grid", gap:12}}>
            <div style={{padding:16, borderRadius:12, background:"var(--panel-solid)", boxShadow:"var(--shadow-1)"}}>
              <div style={{fontWeight:600}}>Review monthly report</div>
              <div style={{color:"var(--muted)"}}>2h left</div>
            </div>
            <div style={{padding:16, borderRadius:12, background:"var(--panel-solid)", boxShadow:"var(--shadow-1)"}}>
              <div style={{fontWeight:600}}>Update inventory list</div>
              <div style={{color:"var(--muted)"}}>5h left</div>
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