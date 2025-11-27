// src/app/(redesign)/downloads/page.tsx
import PageContainer from "@/components/ui/PageContainer";
import FAB from "@/client/components/FAB";
import BottomNav from "@/components/ui/BottomNav";

export default function DownloadsPage(){
  // Use small mock content; do not call APIs.
  return (
    <>
      <PageContainer>
        <h1 style={{fontSize:28, marginBottom:12}}>Downloads Center</h1>
        <section aria-labelledby="recent-downloads">
          <h2 id="recent-downloads">Recent Downloads</h2>
          <div style={{marginTop:12, display:"grid", gap:12}}>
            <div style={{padding:16, borderRadius:12, background:"var(--panel-solid)", boxShadow:"var(--shadow-1)"}}>
              <div style={{fontWeight:600}}>Monthly Report.pdf</div>
              <div style={{color:"var(--muted)"}}>2.4 MB</div>
            </div>
            <div style={{padding:16, borderRadius:12, background:"var(--panel-solid)", boxShadow:"var(--shadow-1)"}}>
              <div style={{fontWeight:600}}>Team Photos.zip</div>
              <div style={{color:"var(--muted)"}}>15.7 MB</div>
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