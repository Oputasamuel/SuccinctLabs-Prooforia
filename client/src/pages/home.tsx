import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import UploadSection from "@/components/upload-section";
import MarketplaceSection from "@/components/marketplace-section";
import CommunitySection from "@/components/community-section";
import SP1InfoSection from "@/components/sp1-info-section";
import Footer from "@/components/footer";
import DiscordAuth from "@/components/discord-auth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

interface DiscordUser {
  id: number;
  username: string;
  discordUsername: string;
  discordAvatar: string;
  walletAddress: string;
  testTokenBalance: number;
  delegatedCredits: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"marketplace" | "community" | "upload">("marketplace");
  const [currentUser, setCurrentUser] = useState<DiscordUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  const handleUserLogin = (user: DiscordUser | null) => {
    setCurrentUser(user);
    setShowAuth(false);
  };

  const handleShowAuth = () => {
    setShowAuth(true);
  };

  const handleTabChange = (tab: "marketplace" | "community" | "upload") => {
    if (tab === "upload" && !currentUser) {
      setShowAuth(true);
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        currentUser={currentUser}
        onShowAuth={handleShowAuth}
      />
      
      {activeTab === "marketplace" && <HeroSection onStartCreating={() => handleTabChange("upload")} />}
      
      {activeTab === "upload" && currentUser && <UploadSection currentUser={currentUser} />}
      {activeTab === "marketplace" && <MarketplaceSection />}
      {activeTab === "community" && <CommunitySection />}
      
      <SP1InfoSection />
      <Footer />

      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="max-w-md">
          <DiscordAuth 
            onUserLogin={handleUserLogin}
            currentUser={currentUser}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
