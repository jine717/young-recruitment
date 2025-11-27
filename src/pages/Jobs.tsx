import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, ArrowRight, ArrowLeft, Building2, Loader2 } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";

const Jobs = () => {
  const { data: jobs, isLoading, error } = useJobs();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-3xl tracking-tight">
            YOUNG.
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/jobs" className="text-foreground font-medium">
              Open Positions
            </Link>
            <Button asChild>
              <Link to="/auth">Join Us</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-12 px-6">
        <div className="container mx-auto max-w-5xl">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="font-display text-5xl md:text-7xl mb-4">OPEN POSITIONS</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Join our team of disruptors and help shape the future of entrepreneurship.
          </p>
        </div>
      </section>

      {/* Job Listings */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-5xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-destructive mb-4">Failed to load jobs. Please try again later.</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : jobs && jobs.length > 0 ? (
            <div className="space-y-6">
              {jobs.map((job) => (
                <Card key={job.id} className="group hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-2xl font-display mb-2">{job.title}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-4 text-base">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {job.departments?.name || 'General'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {job.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </CardDescription>
                      </div>
                      <Button asChild className="shrink-0">
                        <Link to={`/jobs/${job.id}`}>
                          Apply Now
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{job.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {job.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No positions available at the moment.</p>
              <p className="text-muted-foreground">Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* No Fit CTA */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-4">DON'T SEE THE RIGHT FIT?</h2>
          <p className="text-muted-foreground text-lg mb-6">
            We're always looking for exceptional talent. Send us your application and tell us how you'd like to contribute.
          </p>
          <Button variant="outline" size="lg">
            Send Open Application
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

export default Jobs;
