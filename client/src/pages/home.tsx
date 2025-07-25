import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import UploadSection from "@/components/upload-section";
import MarketplaceSection from "@/components/marketplace-section";
import CommunitySection from "@/components/community-section";
import SP1InfoSection from "@/components/sp1-info-section";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useSearch } from "wouter";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"marketplace" | "community" | "upload">("marketplace");
  const { user } = useAuth();
  const search = useSearch();

  // Handle URL search params for tab navigation
  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    const tab = searchParams.get('tab') as "marketplace" | "community" | "upload";
    if (tab && ['marketplace', 'community', 'upload'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [search]);

  const handleTabChange = (tab: "marketplace" | "community" | "upload") => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
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
