import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Zap, ShieldCheck, ExternalLink, Cpu } from "lucide-react";

export default function SP1InfoSection() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="bg-primary/10 text-primary mb-4">
            <Cpu className="w-4 h-4 mr-2" />
            Powered by SP1 zkVM
          </Badge>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Revolutionary Technology</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            SP1 brings zero-knowledge proofs to NFTs, providing cryptographic proof ensuring
            privacy and authenticity without revealing sensitive transaction details.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy-First</h3>
              <p className="text-gray-600">
                Zero-knowledge proofs ensure transaction privacy while maintaining verifiability
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">
                SP1's optimized zkVM delivers proofs in seconds, not minutes
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cryptographically Secure</h3>
              <p className="text-gray-600">
                Mathematical guarantees of authenticity and ownership
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <a
            href="https://succinctlabs.notion.site/SP1-Community-Developer-Resources-1afe020fb42f807888efe7190c3d427d"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <span>Learn how it works</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
