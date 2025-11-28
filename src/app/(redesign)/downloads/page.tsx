// src/app/(redesign)/downloads/page.tsx
import PageContainer from "@/components/ui/PageContainer";
import BottomNav from "@/components/ui/BottomNav";
import FAB from "@/client/components/FAB";

export default function DownloadsPage(){
  return (
    <>
      <PageContainer>
        <h1 style={{fontSize:22}}>Downloads</h1>
        <div style={{marginTop:14, display:"grid", gap:12}}>
          {[
            ["Policy_v2.pdf","2.5 MB • Today"],
            ["Schedule.xlsx","1.8 MB • Yesterday"],
            ["Clinical_Guidelines_2024.pdf","5.1 MB • Oct 25"],
            ["Lab_Results_Template.docx","300 KB • Oct 24"],
            ["Staff_Directory.csv","1.2 MB • Oct 20"]
          ].map((r,i)=>(
            <div key={i} style={{padding:14, borderRadius:12, background:"var(--panel-solid)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <div>
                <div style={{fontWeight:600}}>{r[0]}</div>
                <div style={{color:"var(--muted)", fontSize:13}}>{r[1]}</div>
              </div>
              <div style={{opacity:0.9}}>⇩</div>
            </div>
          ))}
        </div>
      </PageContainer>

      <FAB role="team" />
      <BottomNav />
    </>
  );
}