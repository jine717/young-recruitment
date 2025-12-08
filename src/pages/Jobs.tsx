import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, ArrowRight, ArrowLeft, Building2 } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Jobs = () => {
  const { data: jobs, isLoading, error } = useJobs();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-12 px-6 bg-gradient-young-hero relative overflow-hidden">
        {/* Decorative blur orb */}
        <div className="absolute top-10 right-20 w-48 h-48 bg-young-blue/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container mx-auto max-w-5xl relative">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-young-blue transition-colors mb-8 group">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <h1 className="text-display-lg mb-4 animate-fade-in">OPEN POSITIONS</h1>
          <p className="text-body-lg text-muted-foreground max-w-2xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Join our team of disruptors and help shape the future of entrepreneurship.
          </p>
        </div>
      </section>

      {/* Job Listings */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-5xl">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl border border-border/50 p-6 shadow-young-sm">
                  <div className="shimmer h-8 w-1/3 rounded mb-4" />
                  <div className="shimmer h-4 w-2/3 rounded mb-2" />
                  <div className="shimmer h-4 w-1/2 rounded mb-4" />
                  <div className="flex gap-2">
                    <div className="shimmer h-6 w-16 rounded-full" />
                    <div className="shimmer h-6 w-20 rounded-full" />
                    <div className="shimmer h-6 w-14 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-destructive mb-4">Failed to load jobs. Please try again later.</p>
              <Button variant="young-outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : jobs && jobs.length > 0 ? (
            <div className="space-y-6">
              {jobs.map((job, index) => (
                <Card 
                  key={job.id} 
                  className="group shadow-young-sm hover-lift animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-display-sm mb-2 group-hover:text-young-blue transition-colors">
                          {job.title}
                        </CardTitle>
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
                      <Button variant="young-primary" asChild className="shrink-0">
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
                        <Badge key={tag} variant="young-khaki">
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

      <Footer />
    </div>
  );
};

export default Jobs;
