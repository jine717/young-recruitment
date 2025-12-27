import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, ArrowLeft, Building2, CheckCircle, ExternalLink } from "lucide-react";
import { useJob } from "@/hooks/useJobs";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading, error } = useJob(id);
  const { trackEvent } = useFunnelTracking();

  // Track page view
  useEffect(() => {
    if (!isLoading && job) {
      trackEvent('job_detail_viewed', job.id, { jobTitle: job.title });
    }
  }, [isLoading, job, trackEvent]);

  const handleApplyClick = (buttonLocation: string) => {
    if (job) {
      trackEvent('apply_button_clicked', job.id, { buttonLocation });
    }
  };

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
      <section className="pt-24 md:pt-32 pb-8 md:pb-12 px-4 md:px-6 bg-gradient-young-hero relative overflow-hidden">
        {/* Decorative blur orbs */}
        <div className="absolute top-10 right-10 md:right-20 w-32 md:w-48 h-32 md:h-48 bg-young-blue/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-5 md:left-10 w-24 md:w-32 h-24 md:h-32 bg-young-gold/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container mx-auto max-w-4xl relative">
          <Link to="/jobs" className="inline-flex items-center text-muted-foreground hover:text-young-blue transition-colors mb-6 md:mb-8 group text-sm md:text-base">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Open Positions
          </Link>
          
          <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4 animate-fade-in">
            {job.tags.map((tag) => (
              <Badge key={tag} variant="young-khaki" className="text-xs md:text-sm">
                {tag}
              </Badge>
            ))}
          </div>
          
          <h1 className="text-display-md md:text-display-lg mb-4 md:mb-6 animate-fade-in leading-tight" style={{ animationDelay: '0.1s' }}>
            <span className="young-underline">{job.title.toUpperCase()}</span>
          </h1>
          
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 md:gap-6 text-muted-foreground mb-6 md:mb-8 text-sm md:text-base animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              {job.departments?.name || 'General'}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              {job.location}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              {formatType(job.type)}
            </span>
          </div>
          
          <div 
            className="text-body-md md:text-body-lg text-muted-foreground leading-relaxed animate-fade-in prose-job-description" 
            style={{ animationDelay: '0.3s' }}
            dangerouslySetInnerHTML={{ __html: job.description }}
          />
        </div>
      </section>

      {/* Job Details */}
      <section className="py-8 md:pb-12 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="grid gap-6 md:gap-8">
            {/* Responsibilities */}
            {job.responsibilities.length > 0 && (
              <Card className="shadow-young-sm hover-lift animate-fade-in">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-display-sm">WHAT YOU'LL DO</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                  <ul className="space-y-2.5 md:space-y-3">
                    {job.responsibilities.map((item, index) => (
                      <li key={index} className="flex items-start gap-2.5 md:gap-3 group text-sm md:text-base">
                        <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-young-blue flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
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
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-display-sm">WHAT WE'RE LOOKING FOR</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                  <ul className="space-y-2.5 md:space-y-3">
                    {job.requirements.map((item, index) => (
                      <li key={index} className="flex items-start gap-2.5 md:gap-3 group text-sm md:text-base">
                        <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-young-gold flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
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
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-display-sm">WHAT WE OFFER</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                  <ul className="space-y-2.5 md:space-y-3">
                    {job.benefits.map((item, index) => (
                      <li key={index} className="flex items-start gap-2.5 md:gap-3 group text-sm md:text-base">
                        <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-young-blue flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
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
      <section className="py-8 md:py-12 px-4 md:px-6 bg-young-cream/30">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-l-4 border-young-gold bg-young-gold/5 shadow-young-sm">
            <CardContent className="p-4 md:pt-6 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
                <div className="flex-1">
                  <h3 className="text-base md:text-display-sm mb-2 font-semibold">DISC ASSESSMENT REQUIRED</h3>
                  <p className="text-muted-foreground text-sm md:text-base">
                    As part of our application process, all candidates must complete the Tony Robbins DISC Assessment. 
                    This helps us understand your behavioral style and ensures the best possible team fit.
                  </p>
                </div>
                <Button variant="young-outline" asChild className="w-full sm:w-auto">
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
      <section className="py-16 md:py-24 px-4 md:px-6 bg-young-cream/50 relative">
        {/* Top accent line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-young-blue to-transparent" />
        
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-display-sm md:text-display-md mb-4 md:mb-6 animate-fade-in">READY TO APPLY?</h2>
          <p className="text-muted-foreground text-body-md md:text-body-lg mb-8 md:mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Submit your application and take the first step towards joining our team of disruptors.
          </p>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button 
              size="lg" 
              variant="young-primary" 
              className="text-base md:text-lg px-8 md:px-10 hover-glow w-full sm:w-auto" 
              asChild
              onClick={() => handleApplyClick('cta_section')}
            >
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
