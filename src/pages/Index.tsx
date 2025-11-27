import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Target, Zap, Award } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-3xl tracking-tight">
            YOUNG.
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/jobs" className="text-muted-foreground hover:text-foreground transition-colors">
              Open Positions
            </Link>
            <Button asChild>
              <Link to="/jobs">Join Us</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-secondary font-medium mb-4 tracking-wide uppercase">Unite to Disrupt</p>
            <h1 className="font-display text-6xl md:text-8xl lg:text-9xl leading-none mb-6">
              WE'RE HIRING<br />
              <span className="text-primary">DISRUPTORS</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Join a collective of fearless pioneers who believe true success comes from forging your own path, embracing originality, and thinking differently.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="text-lg px-8" asChild>
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
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="font-display text-4xl md:text-5xl text-center mb-16">OUR VALUES</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-lg border border-border">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-2xl mb-3">FEARLESS</h3>
              <p className="text-muted-foreground">
                We bravely take on challenges and see setbacks as chances to grow. Fear plays no role in our journey.
              </p>
            </div>
            <div className="bg-card p-8 rounded-lg border border-border">
              <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-display text-2xl mb-3">UNUSUAL</h3>
              <p className="text-muted-foreground">
                We're not typical. We believe in unique, extraordinary, out-of-the-box thinking that sparks innovation.
              </p>
            </div>
            <div className="bg-card p-8 rounded-lg border border-border">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-2xl mb-3">AUTHENTIC</h3>
              <p className="text-muted-foreground">
                We value being true to oneself, honest, and sincere towards others. We focus on the person behind the title.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-4xl md:text-5xl mb-6">
                EMPOWERING<br />
                <span className="text-primary">DISRUPTORS</span><br />
                TO SUCCEED
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We envision a world where young entrepreneurs can thrive based on their excellence, positive impact, and relevance to their customers.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Award className="h-6 w-6 text-secondary flex-shrink-0 mt-0.5" />
                  <span>Hands-on partnership-oriented approach</span>
                </li>
                <li className="flex items-start gap-3">
                  <Award className="h-6 w-6 text-secondary flex-shrink-0 mt-0.5" />
                  <span>Direct impact on growing ventures</span>
                </li>
                <li className="flex items-start gap-3">
                  <Award className="h-6 w-6 text-secondary flex-shrink-0 mt-0.5" />
                  <span>Culture of agility and determination</span>
                </li>
              </ul>
            </div>
            <div className="bg-muted/50 rounded-2xl p-10 border border-border">
              <p className="text-2xl font-medium leading-relaxed">
                "Our motivation doesn't stem from elite education or fancy certificates; it's grounded in hands-on experience and learning by doing."
              </p>
              <div className="mt-6 pt-6 border-t border-border">
                <p className="font-display text-lg">YOUNG. PHILOSOPHY</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-foreground text-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-display text-4xl md:text-6xl mb-6">READY TO DISRUPT?</h2>
          <p className="text-xl opacity-80 mb-10 max-w-2xl mx-auto">
            Browse our open positions and start your journey with us. We're looking for driven individuals eager to make an impact.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-10" asChild>
            <Link to="/jobs">
              Explore Careers
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-display text-2xl">YOUNG.</p>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Young. Unite to Disrupt.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
