import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, ArrowLeft, Building2, CheckCircle, ExternalLink } from "lucide-react";

// Mock data - will be replaced with database
const jobs: Record<string, {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  tags: string[];
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
}> = {
  "1": {
    id: "1",
    title: "Growth Marketing Manager",
    department: "Marketing",
    location: "Amsterdam, NL",
    type: "Full-time",
    description: "Lead growth initiatives across our portfolio companies, driving user acquisition and retention strategies. You'll work directly with founders and leadership teams to scale their businesses through data-driven marketing.",
    tags: ["Marketing", "Growth", "Strategy"],
    responsibilities: [
      "Develop and execute growth strategies for portfolio companies",
      "Analyze user data and market trends to identify opportunities",
      "Lead cross-functional teams to implement growth initiatives",
      "Establish KPIs and measure campaign performance",
      "Mentor junior team members and share best practices",
    ],
    requirements: [
      "5+ years of experience in growth marketing or related field",
      "Proven track record of scaling B2B or B2C companies",
      "Strong analytical skills and data-driven mindset",
      "Experience with marketing automation and analytics tools",
      "Excellent communication and leadership skills",
    ],
    benefits: [
      "Competitive salary and equity participation",
      "Flexible working arrangements",
      "Direct impact on multiple ventures",
      "Learning and development budget",
      "International team environment",
    ],
  },
  "2": {
    id: "2",
    title: "Investment Analyst",
    department: "Investments",
    location: "Remote",
    type: "Full-time",
    description: "Analyze potential investment opportunities, conduct due diligence, and support portfolio company growth. You'll be at the forefront of identifying the next generation of disruptive businesses.",
    tags: ["Finance", "Analysis", "Due Diligence"],
    responsibilities: [
      "Source and evaluate investment opportunities",
      "Conduct financial modeling and due diligence",
      "Support portfolio companies with strategic initiatives",
      "Prepare investment memos and presentations",
      "Build relationships with entrepreneurs and co-investors",
    ],
    requirements: [
      "3+ years in venture capital, private equity, or investment banking",
      "Strong financial modeling and analytical skills",
      "Understanding of startup ecosystems and business models",
      "Excellent written and verbal communication",
      "Entrepreneurial mindset and self-starter attitude",
    ],
    benefits: [
      "Exposure to diverse industries and business models",
      "Direct involvement in investment decisions",
      "Network access to top entrepreneurs and investors",
      "Flexible remote work policy",
      "Performance-based bonuses",
    ],
  },
  "3": {
    id: "3",
    title: "Operations Lead",
    department: "Operations",
    location: "Amsterdam, NL",
    type: "Full-time",
    description: "Optimize operational processes across our ventures, ensuring scalability and efficiency. You'll work hands-on with portfolio companies to build systems that enable rapid growth.",
    tags: ["Operations", "Strategy", "Leadership"],
    responsibilities: [
      "Design and implement operational frameworks",
      "Identify bottlenecks and optimize processes",
      "Lead operational due diligence for new investments",
      "Build and manage relationships with vendors and partners",
      "Develop playbooks and best practices for portfolio companies",
    ],
    requirements: [
      "5+ years in operations, consulting, or similar roles",
      "Experience scaling operations in high-growth environments",
      "Strong project management and organizational skills",
      "Ability to work across multiple projects simultaneously",
      "Problem-solving mindset and attention to detail",
    ],
    benefits: [
      "Strategic role with high visibility",
      "Work with diverse portfolio companies",
      "Competitive compensation package",
      "Professional development opportunities",
      "Collaborative team culture",
    ],
  },
  "4": {
    id: "4",
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    description: "Shape the user experience of our portfolio products, from concept to launch. You'll collaborate closely with founders and product teams to create intuitive, impactful designs.",
    tags: ["Design", "UX/UI", "Product"],
    responsibilities: [
      "Lead end-to-end design projects for portfolio companies",
      "Conduct user research and translate insights into designs",
      "Create wireframes, prototypes, and high-fidelity mockups",
      "Collaborate with developers to ensure design quality",
      "Establish and maintain design systems",
    ],
    requirements: [
      "4+ years of product design experience",
      "Strong portfolio demonstrating UX/UI expertise",
      "Proficiency in Figma and prototyping tools",
      "Understanding of design systems and accessibility",
      "Excellent collaboration and communication skills",
    ],
    benefits: [
      "Work on diverse products and industries",
      "Creative freedom and autonomy",
      "Remote-first work environment",
      "Design tools and resources budget",
      "Regular team offsites",
    ],
  },
};

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const job = id ? jobs[id] : null;

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl mb-4">JOB NOT FOUND</h1>
          <Button asChild>
            <Link to="/jobs">View All Positions</Link>
          </Button>
        </div>
      </div>
    );
  }

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
              <Link to={`/apply/${job.id}`}>Apply Now</Link>
            </Button>
          </div>
        </div>
      </nav>

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
              {job.department}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {job.location}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {job.type}
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

            {/* Requirements */}
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

            {/* Benefits */}
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

export default JobDetail;
