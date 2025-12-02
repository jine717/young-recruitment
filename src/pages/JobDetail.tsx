import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, ArrowLeft, Building2, CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { useJob } from "@/hooks/useJobs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading, error } = useJob(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl mb-4">JOB NOT FOUND</h1>
          <p className="text-muted-foreground mb-6">This position may no longer be available.</p>
          <Button asChild>
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
      <section className="pt-32 pb-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <Link to="/jobs" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Open Positions
          </Link>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {job.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          
          <h1 className="font-display text-5xl md:text-6xl mb-6">{job.title.toUpperCase()}</h1>
          
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-8">
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
          
          <p className="text-xl text-muted-foreground leading-relaxed">
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
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-2xl">WHAT YOU'LL DO</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {job.responsibilities.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {job.requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-2xl">WHAT WE'RE LOOKING FOR</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {job.requirements.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {job.benefits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-2xl">WHAT WE OFFER</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {job.benefits.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
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
      <section className="py-12 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex-1">
                  <h3 className="font-display text-xl mb-2">DISC ASSESSMENT REQUIRED</h3>
                  <p className="text-muted-foreground">
                    As part of our application process, all candidates must complete the Tony Robbins DISC Assessment. 
                    This helps us understand your behavioral style and ensures the best possible team fit.
                  </p>
                </div>
                <Button variant="outline" asChild>
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
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-display text-4xl md:text-5xl mb-6">READY TO APPLY?</h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
            Submit your application and take the first step towards joining our team of disruptors.
          </p>
          <Button size="lg" className="text-lg px-10" asChild>
            <Link to={`/apply/${job.id}`}>
              Start Application
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default JobDetail;
