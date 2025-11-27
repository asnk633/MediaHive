// src/app/(redesign)/profile/page.tsx
import PageContainer from "@/components/ui/PageContainer";
import FAB from "@/client/components/FAB";
import BottomNav from "@/components/ui/BottomNav";

export default function ProfilePage(){
  // Use small mock content; do not call APIs.
  return (
    <>
      <PageContainer>
        <h1 style={{fontSize:28, marginBottom:12}}>User Profile</h1>
        <section aria-labelledby="profile-info">
          <h2 id="profile-info">Profile Information</h2>
          <div style={{marginTop:12, display:"grid", gap:12}}>
            <div style={{padding:16, borderRadius:12, background:"var(--panel-solid)", boxShadow:"var(--shadow-1)"}}>
              <div style={{fontWeight:600}}>Account Settings</div>
              <div style={{color:"var(--muted)"}}>Manage your preferences</div>
            </div>
            <div style={{padding:16, borderRadius:12, background:"var(--panel-solid)", boxShadow:"var(--shadow-1)"}}>
              <div style={{fontWeight:600}}>Security</div>
              <div style={{color:"var(--muted)"}}>Password and authentication</div>
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