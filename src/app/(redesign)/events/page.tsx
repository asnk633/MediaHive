// src/app/(redesign)/events/page.tsx
import PageContainer from "@/components/ui/PageContainer";
import FAB from "@/client/components/FAB";
import BottomNav from "@/components/ui/BottomNav";

export default function EventsPage(){
  return (
    <>
      <PageContainer>
        <h1 style={{fontSize:28, marginBottom:12}}>Events</h1>
        <section aria-labelledby="upcoming-events">
          <h2 id="upcoming-events">Upcoming Events</h2>
          <div style={{marginTop:12, display:"grid", gap:12}}>
            <div style={{padding:16, borderRadius:12, background:"var(--panel-solid)", boxShadow:"var(--shadow-1)"}}>
              <div style={{fontWeight:600}}>Team Meeting</div>
              <div style={{color:"var(--muted)"}}>Today, 10:00 AM</div>
            </div>
            <div style={{padding:16, borderRadius:12, background:"var(--panel-solid)", boxShadow:"var(--shadow-1)"}}>
              <div style={{fontWeight:600}}>Training Workshop</div>
              <div style={{color:"var(--muted)"}}>Tomorrow, 2:00 PM</div>
            </div>
          </div>
        </section>
      </PageContainer>

      <FAB role="team" />
      <BottomNav />
    </>
  );
}