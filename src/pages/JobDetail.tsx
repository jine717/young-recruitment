import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, ArrowLeft, Building2, CheckCircle, ExternalLink } from "lucide-react";
import { useJob } from "@/hooks/useJobs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading, error } = useJob(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-young-blue/30 border-t-young-blue rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading position...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h1 className="text-display-md mb-4">JOB NOT FOUND</h1>
          <p className="text-muted-foreground mb-6">This position may no longer be available.</p>
          <Button variant="young-primary" asChild>
            <Link to="/jobs">View All Positions</Link>
          </Button>
        </div>
      </div>
    );
  }

  const formatType = (type: string) => {
    return type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Job Header */}
      <section className="pt-32 pb-12 px-6 bg-gradient-young-hero relative overflow-hidden">
        {/* Decorative blur orbs */}
        <div className="absolute top-10 right-20 w-48 h-48 bg-young-blue/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-32 h-32 bg-young-gold/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container mx-auto max-w-4xl relative">
          <Link to="/jobs" className="inline-flex items-center text-muted-foreground hover:text-young-blue transition-colors mb-8 group">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Open Positions
          </Link>
          
          <div className="flex flex-wrap gap-2 mb-4 animate-fade-in">
            {job.tags.map((tag) => (
              <Badge key={tag} variant="young-khaki">
                {tag}
              </Badge>
            ))}
          </div>
          
          <h1 className="text-display-lg mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="young-underline">{job.title.toUpperCase()}</span>
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <span className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {job.departments?.name || 'General'}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {job.location}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {formatType(job.type)}
            </span>
          </div>
          
          <p className="text-body-lg text-muted-foreground leading-relaxed animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {job.description}
          </p>
        </div>
      </section>

      {/* Job Details */}
      <section className="pb-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="grid gap-8">
            {/* Responsibilities */}
            {job.responsibilities.length > 0 && (
              <Card className="shadow-young-sm hover-lift animate-fade-in">
                <CardHeader>
                  <CardTitle className="text-display-sm">WHAT YOU'LL DO</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {job.responsibilities.map((item, index) => (
                      <li key={index} className="flex items-start gap-3 group">
                        <CheckCircle className="h-5 w-5 text-young-blue flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {job.requirements.length > 0 && (
              <Card className="shadow-young-sm hover-lift animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <CardHeader>
                  <CardTitle className="text-display-sm">WHAT WE'RE LOOKING FOR</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {job.requirements.map((item, index) => (
                      <li key={index} className="flex items-start gap-3 group">
                        <CheckCircle className="h-5 w-5 text-young-gold flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {job.benefits.length > 0 && (
              <Card className="shadow-young-sm hover-lift animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <CardHeader>
                  <CardTitle className="text-display-sm">WHAT WE OFFER</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {job.benefits.map((item, index) => (
                      <li key={index} className="flex items-start gap-3 group">
                        <CheckCircle className="h-5 w-5 text-young-blue flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* DISC Assessment Notice */}
      <section className="py-12 px-6 bg-young-cream/30">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-l-4 border-young-gold bg-young-gold/5 shadow-young-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex-1">
                  <h3 className="text-display-sm mb-2">DISC ASSESSMENT REQUIRED</h3>
                  <p className="text-muted-foreground">
                    As part of our application process, all candidates must complete the Tony Robbins DISC Assessment. 
                    This helps us understand your behavioral style and ensures the best possible team fit.
                  </p>
                </div>
                <Button variant="young-outline" asChild>
                  <a href="https://www.tonyrobbins.com/disc/" target="_blank" rel="noopener noreferrer">
                    Take Assessment
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="py-24 px-6 bg-young-cream/50 relative">
        {/* Top accent line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-young-blue to-transparent" />
        
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-display-md mb-6 animate-fade-in">READY TO APPLY?</h2>
          <p className="text-muted-foreground text-body-lg mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Submit your application and take the first step towards joining our team of disruptors.
          </p>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button size="lg" variant="young-primary" className="text-lg px-10 hover-glow" asChild>
              <Link to={`/apply/${job.id}`}>
                Start Application
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default JobDetail;
