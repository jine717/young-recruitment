import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Target, Zap, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";

const Index = () => {
  const { trackEvent } = useFunnelTracking();

  useEffect(() => {
    trackEvent('homepage_viewed');
  }, [trackEvent]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="full" />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-young-hero relative overflow-hidden">
        {/* Decorative blur orbs */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-young-blue/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-young-gold/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container mx-auto max-w-5xl relative">
          <div className="text-center">
            <p className="text-young-gold font-semibold mb-4 tracking-widest uppercase animate-fade-in">
              Unite to Disrupt
            </p>
            <h1 className="text-display-xl leading-none mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              WE'RE HIRING<br />
              <span className="text-primary young-underline">DISRUPTORS</span>
            </h1>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Join a collective of fearless pioneers who believe true success comes from forging your own path, embracing originality, and thinking differently.
            </p>
            <div className="flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Button size="lg" variant="young-primary" className="text-lg px-8 hover-glow" asChild>
                <Link to="/jobs">
                  View Open Positions
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-6 bg-young-cream/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-display-md text-center mb-16">OUR VALUES</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-card p-8 rounded-xl border border-border/50 shadow-young-sm hover-lift animate-fade-in" style={{ animationDelay: '0s' }}>
              <div className="w-14 h-14 bg-young-blue/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-young-blue/30 transition-colors">
                <Zap className="h-7 w-7 text-young-blue" />
              </div>
              <h3 className="text-display-sm mb-3">FEARLESS</h3>
              <p className="text-muted-foreground">
                We bravely take on challenges and see setbacks as chances to grow. Fear plays no role in our journey.
              </p>
            </div>
            <div className="group bg-card p-8 rounded-xl border border-border/50 shadow-young-sm hover-lift animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="w-14 h-14 bg-young-gold/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-young-gold/30 transition-colors">
                <Target className="h-7 w-7 text-young-gold" />
              </div>
              <h3 className="text-display-sm mb-3">UNUSUAL</h3>
              <p className="text-muted-foreground">
                We're not typical. We believe in unique, extraordinary, out-of-the-box thinking that sparks innovation.
              </p>
            </div>
            <div className="group bg-card p-8 rounded-xl border border-border/50 shadow-young-sm hover-lift animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-14 h-14 bg-young-blue/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-young-blue/30 transition-colors">
                <Users className="h-7 w-7 text-young-blue" />
              </div>
              <h3 className="text-display-sm mb-3">AUTHENTIC</h3>
              <p className="text-muted-foreground">
                We value being true to oneself, honest, and sincere towards others. We focus on the person behind the title.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in">
              <h2 className="text-display-md mb-6">
                EMPOWERING<br />
                <span className="text-primary young-underline">DISRUPTORS</span><br />
                TO SUCCEED
              </h2>
              <p className="text-body-lg text-muted-foreground mb-8">
                We envision a world where young entrepreneurs can thrive based on their excellence, positive impact, and relevance to their customers.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 group">
                  <Award className="h-6 w-6 text-young-gold flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:text-foreground transition-colors">Hands-on partnership-oriented approach</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <Award className="h-6 w-6 text-young-gold flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:text-foreground transition-colors">Direct impact on growing ventures</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <Award className="h-6 w-6 text-young-gold flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:text-foreground transition-colors">Culture of agility and determination</span>
                </li>
              </ul>
            </div>
            <div className="bg-card rounded-2xl p-10 border-l-4 border-young-gold shadow-young-md hover-lift animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <p className="text-2xl font-medium leading-relaxed">
                "Our motivation doesn't stem from elite education or fancy certificates; it's grounded in hands-on experience and learning by doing."
              </p>
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-display-sm text-young-gold">YOUNG. PHILOSOPHY</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-young-black text-young-cream relative">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-young-blue via-young-gold to-young-blue" />
        
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-display-lg mb-6 animate-fade-in">READY TO DISRUPT?</h2>
          <p className="text-xl opacity-80 mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Browse our open positions and start your journey with us. We're looking for driven individuals eager to make an impact.
          </p>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button size="lg" variant="young-secondary" className="text-lg px-10" asChild>
              <Link to="/jobs">
                Explore Careers
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
