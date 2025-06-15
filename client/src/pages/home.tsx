import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import UploadSection from "@/components/upload-section";
import MarketplaceSection from "@/components/marketplace-section";
import CommunitySection from "@/components/community-section";
import SP1InfoSection from "@/components/sp1-info-section";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"marketplace" | "community" | "upload">("marketplace");
  const { user } = useAuth();

  const handleTabChange = (tab: "marketplace" | "community" | "upload") => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        currentUser={user}
      />
      
      {activeTab === "marketplace" && (
        <>
          <HeroSection onStartCreating={() => handleTabChange("upload")} />
          <MarketplaceSection />
        </>
      )}
      
      {activeTab === "upload" && user && (
        <UploadSection currentUser={user} />
      )}
      
      {activeTab === "community" && (
        <>
          <CommunitySection onNavigateToUpload={() => handleTabChange("upload")} />
          <SP1InfoSection />
        </>
      )}
      
      <Footer onTabChange={handleTabChange} />
    </div>
  );
}
