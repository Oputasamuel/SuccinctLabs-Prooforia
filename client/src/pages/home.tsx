import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import UploadSection from "@/components/upload-section";
import MarketplaceSection from "@/components/marketplace-section";
import CommunitySection from "@/components/community-section";
import SP1InfoSection from "@/components/sp1-info-section";
import Footer from "@/components/footer";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"marketplace" | "community" | "upload">("marketplace");

  return (
    <div className="min-h-screen bg-white">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === "marketplace" && <HeroSection onStartCreating={() => setActiveTab("upload")} />}
      
      {activeTab === "upload" && <UploadSection />}
      {activeTab === "marketplace" && <MarketplaceSection />}
      {activeTab === "community" && <CommunitySection />}
      
      <SP1InfoSection />
      <Footer />
    </div>
  );
}
