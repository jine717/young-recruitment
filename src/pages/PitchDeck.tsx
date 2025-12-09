import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Briefcase, 
  Mail, 
  Brain, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Shield,
  Sparkles,
  Target,
  Clock,
  TrendingUp,
  CheckCircle,
  Zap,
  Award,
  Globe
} from "lucide-react";

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
}

const PitchDeck = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    // Slide 1: Cover
    {
      id: "cover",
      title: "",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-7xl md:text-9xl font-display font-bold text-foreground tracking-tight">
              YOUNG<span className="text-young-gold">.</span>
            </h1>
            <p className="text-2xl md:text-3xl text-young-khaki font-medium">
              Unite to Disrupt
            </p>
          </div>
          <div className="max-w-2xl space-y-4 mt-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
              AI-Powered Recruitment Platform
            </h2>
            <p className="text-lg text-muted-foreground">
              Transform your hiring process with intelligent automation, 
              data-driven insights, and seamless candidate management.
            </p>
          </div>
          <div className="flex gap-4 mt-8">
            <div className="px-6 py-3 bg-young-blue/20 rounded-full text-young-blue font-medium">
              Enterprise Ready
            </div>
            <div className="px-6 py-3 bg-young-gold/20 rounded-full text-young-gold font-medium">
              AI-First Approach
            </div>
          </div>
        </div>
      ),
    },
    // Slide 2: Problem Statement
    {
      id: "problem",
      title: "The Problem",
      subtitle: "Traditional recruitment is broken",
      content: (
        <div className="grid md:grid-cols-2 gap-8 h-full items-center">
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-6 bg-destructive/10 rounded-xl border border-destructive/20">
              <Clock className="w-8 h-8 text-destructive flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Time Consuming</h3>
                <p className="text-muted-foreground">Average time-to-hire: 42 days. Recruiters spend 23 hours screening resumes per hire.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 bg-destructive/10 rounded-xl border border-destructive/20">
              <Target className="w-8 h-8 text-destructive flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Inconsistent Evaluation</h3>
                <p className="text-muted-foreground">Subjective decisions lead to 50% of new hires failing within 18 months.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 bg-destructive/10 rounded-xl border border-destructive/20">
              <Users className="w-8 h-8 text-destructive flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Poor Candidate Experience</h3>
                <p className="text-muted-foreground">60% of candidates abandon applications due to complex processes.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-64 h-64 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/5 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-6xl font-bold text-destructive">€15K</p>
                  <p className="text-muted-foreground mt-2">Average cost per bad hire</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 3: Solution Overview
    {
      id: "solution",
      title: "The Solution",
      subtitle: "Young: AI-powered recruitment reimagined",
      content: (
        <div className="grid md:grid-cols-3 gap-6 h-full items-center">
          <Card className="p-8 bg-young-blue/5 border-young-blue/20 hover:shadow-young-md transition-all">
            <Brain className="w-12 h-12 text-young-blue mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI-First Evaluation</h3>
            <p className="text-muted-foreground">
              Intelligent scoring of CVs, personality assessments, and business cases with transparent reasoning.
            </p>
          </Card>
          <Card className="p-8 bg-young-gold/5 border-young-gold/20 hover:shadow-young-gold transition-all">
            <Zap className="w-12 h-12 text-young-gold mb-4" />
            <h3 className="text-xl font-semibold mb-2">Automated Workflows</h3>
            <p className="text-muted-foreground">
              From application to offer, automate communications and status updates seamlessly.
            </p>
          </Card>
          <Card className="p-8 bg-young-khaki/5 border-young-khaki/20 hover:shadow-young-md transition-all">
            <BarChart3 className="w-12 h-12 text-young-khaki mb-4" />
            <h3 className="text-xl font-semibold mb-2">Data-Driven Insights</h3>
            <p className="text-muted-foreground">
              Real-time analytics, executive reports, and actionable metrics for informed decisions.
            </p>
          </Card>
        </div>
      ),
    },
    // Slide 4: Core Features - Dashboard
    {
      id: "dashboard",
      title: "Recruiter Dashboard",
      subtitle: "Complete candidate visibility in one place",
      content: (
        <div className="grid md:grid-cols-2 gap-8 h-full items-center">
          <div className="space-y-4">
            <FeatureItem 
              icon={<Users className="w-5 h-5" />}
              title="Candidate Management"
              description="Filter, sort, and manage all applications with bulk actions"
            />
            <FeatureItem 
              icon={<Target className="w-5 h-5" />}
              title="AI Score Visualization"
              description="Instant candidate ranking with transparent AI recommendations"
            />
            <FeatureItem 
              icon={<Briefcase className="w-5 h-5" />}
              title="Multi-Job Support"
              description="Manage multiple vacancies with team assignment capabilities"
            />
            <FeatureItem 
              icon={<Clock className="w-5 h-5" />}
              title="Status Tracking"
              description="Real-time application status updates and stage progression"
            />
            <FeatureItem 
              icon={<FileText className="w-5 h-5" />}
              title="Data Export"
              description="Export candidate data and reports in multiple formats"
            />
          </div>
          <div className="bg-muted/30 rounded-2xl p-8 border">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-young-blue/20" />
                  <div>
                    <p className="font-medium">Elena Rodriguez</p>
                    <p className="text-sm text-muted-foreground">Senior Developer</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-green-500/20 text-green-600 rounded-full text-sm font-medium">
                  Score: 87
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-background rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-young-gold/20" />
                  <div>
                    <p className="font-medium">Marcus Chen</p>
                    <p className="text-sm text-muted-foreground">Product Manager</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-young-gold/20 text-young-gold rounded-full text-sm font-medium">
                  Score: 72
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-background rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-young-khaki/20" />
                  <div>
                    <p className="font-medium">Sofia Andersson</p>
                    <p className="text-sm text-muted-foreground">UX Designer</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-green-500/20 text-green-600 rounded-full text-sm font-medium">
                  Score: 91
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 5: AI Features
    {
      id: "ai-features",
      title: "AI-Powered Intelligence",
      subtitle: "Young AI: Your recruitment copilot",
      content: (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 h-full items-center">
          <AIFeatureCard
            icon={<FileText className="w-8 h-8" />}
            title="CV Analysis"
            description="Extract experience, skills, education, and identify red flags automatically"
            color="blue"
          />
          <AIFeatureCard
            icon={<Users className="w-8 h-8" />}
            title="DISC Analysis"
            description="Personality profiling with communication style and team fit insights"
            color="gold"
          />
          <AIFeatureCard
            icon={<Target className="w-8 h-8" />}
            title="Candidate Scoring"
            description="0-100 scoring with skills, communication, and cultural fit breakdown"
            color="khaki"
          />
          <AIFeatureCard
            icon={<MessageSquare className="w-8 h-8" />}
            title="Interview Questions"
            description="Custom questions generated based on CV gaps and job requirements"
            color="blue"
          />
          <AIFeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="Post-Interview Analysis"
            description="Score updates with transparent reasoning after interview feedback"
            color="gold"
          />
          <AIFeatureCard
            icon={<Award className="w-8 h-8" />}
            title="Candidate Comparison"
            description="Multi-candidate evaluation with executive reports and recommendations"
            color="khaki"
          />
        </div>
      ),
    },
    // Slide 6: Young AI Assistant
    {
      id: "young-ai",
      title: "Young AI Assistant",
      subtitle: "Conversational AI for recruiters",
      content: (
        <div className="grid md:grid-cols-2 gap-8 h-full items-center">
          <div className="space-y-6">
            <div className="p-6 bg-young-blue/10 rounded-xl border border-young-blue/20">
              <Sparkles className="w-8 h-8 text-young-blue mb-3" />
              <h3 className="font-semibold text-lg mb-2">Context-Aware Assistance</h3>
              <p className="text-muted-foreground">
                Ask questions about specific candidates, get insights on their profile, 
                and receive actionable recommendations in natural language.
              </p>
            </div>
            <div className="p-6 bg-young-gold/10 rounded-xl border border-young-gold/20">
              <Briefcase className="w-8 h-8 text-young-gold mb-3" />
              <h3 className="font-semibold text-lg mb-2">Job Creation Copilot</h3>
              <p className="text-muted-foreground">
                Step-by-step guidance to create complete job vacancies with AI-generated 
                descriptions, requirements, and interview questions.
              </p>
            </div>
            <div className="p-6 bg-young-khaki/10 rounded-xl border border-young-khaki/20">
              <MessageSquare className="w-8 h-8 text-young-khaki mb-3" />
              <h3 className="font-semibold text-lg mb-2">Comparison Drill-Down</h3>
              <p className="text-muted-foreground">
                Interactive Q&A about candidate comparisons, explore AI reasoning, 
                and get deeper insights for final decisions.
              </p>
            </div>
          </div>
          <div className="bg-background rounded-2xl border shadow-young-md p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <div className="w-10 h-10 rounded-full bg-young-blue flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">Young AI</p>
                <p className="text-sm text-muted-foreground">Your recruitment assistant</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="bg-young-blue text-white px-4 py-2 rounded-2xl rounded-br-md max-w-[80%]">
                  How does Elena compare to Marcus for this role?
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md max-w-[80%]">
                  Elena scores higher in technical skills (92 vs 78) and has 3 more years of relevant experience. However, Marcus shows stronger leadership indicators from his DISC profile...
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 7: Automation
    {
      id: "automation",
      title: "Workflow Automation",
      subtitle: "Save time with intelligent automation",
      content: (
        <div className="h-full flex flex-col justify-center">
          <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
            <AutomationStep 
              icon={<FileText className="w-6 h-6" />}
              title="Application"
              description="Auto-acknowledge receipt"
              isFirst
            />
            <div className="flex-1 h-1 bg-gradient-to-r from-young-blue to-young-gold mx-2" />
            <AutomationStep 
              icon={<Brain className="w-6 h-6" />}
              title="AI Analysis"
              description="Instant CV & DISC scoring"
            />
            <div className="flex-1 h-1 bg-gradient-to-r from-young-gold to-young-khaki mx-2" />
            <AutomationStep 
              icon={<Mail className="w-6 h-6" />}
              title="Status Updates"
              description="Automated notifications"
            />
            <div className="flex-1 h-1 bg-gradient-to-r from-young-khaki to-green-500 mx-2" />
            <AutomationStep 
              icon={<CheckCircle className="w-6 h-6" />}
              title="Decision"
              description="Offer or feedback sent"
              isLast
            />
          </div>
          <div className="grid md:grid-cols-4 gap-6 mt-12">
            <MetricCard value="80%" label="Time Saved" sublabel="on screening" />
            <MetricCard value="24/7" label="Always On" sublabel="instant responses" />
            <MetricCard value="100%" label="Consistency" sublabel="branded emails" />
            <MetricCard value="0" label="Manual Steps" sublabel="fully automated" />
          </div>
        </div>
      ),
    },
    // Slide 8: Analytics
    {
      id: "analytics",
      title: "Analytics Dashboard",
      subtitle: "Data-driven recruitment decisions",
      content: (
        <div className="grid md:grid-cols-3 gap-6 h-full items-center">
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-young-blue/10 rounded-xl border border-young-blue/20">
                <p className="text-3xl font-bold text-young-blue">156</p>
                <p className="text-muted-foreground">Total Applications</p>
              </div>
              <div className="p-6 bg-young-gold/10 rounded-xl border border-young-gold/20">
                <p className="text-3xl font-bold text-young-gold">34%</p>
                <p className="text-muted-foreground">Interview Rate</p>
              </div>
              <div className="p-6 bg-green-500/10 rounded-xl border border-green-500/20">
                <p className="text-3xl font-bold text-green-600">2h 45m</p>
                <p className="text-muted-foreground">Avg. Time to Review</p>
              </div>
              <div className="p-6 bg-young-khaki/10 rounded-xl border border-young-khaki/20">
                <p className="text-3xl font-bold text-young-khaki">78</p>
                <p className="text-muted-foreground">Avg. AI Score</p>
              </div>
            </div>
            <div className="p-6 bg-muted/30 rounded-xl border">
              <h4 className="font-semibold mb-4">Hiring Funnel</h4>
              <div className="space-y-3">
                <FunnelBar label="Applied" value={100} color="bg-young-blue" />
                <FunnelBar label="Under Review" value={65} color="bg-young-blue/80" />
                <FunnelBar label="Interview" value={34} color="bg-young-gold" />
                <FunnelBar label="Hired" value={12} color="bg-green-500" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <AnalyticsFeature 
              icon={<TrendingUp className="w-5 h-5" />}
              title="Trend Analysis"
              description="Track application volume over time"
            />
            <AnalyticsFeature 
              icon={<Target className="w-5 h-5" />}
              title="Score Distribution"
              description="Visualize AI score patterns"
            />
            <AnalyticsFeature 
              icon={<Clock className="w-5 h-5" />}
              title="Time Metrics"
              description="Monitor response times"
            />
            <AnalyticsFeature 
              icon={<Briefcase className="w-5 h-5" />}
              title="Job Performance"
              description="Compare vacancy effectiveness"
            />
          </div>
        </div>
      ),
    },
    // Slide 9: Executive Reports
    {
      id: "reports",
      title: "Executive Reports",
      subtitle: "Presentation-ready candidate comparisons",
      content: (
        <div className="grid md:grid-cols-2 gap-8 h-full items-center">
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold">AI-Generated Executive Reports</h3>
            <p className="text-muted-foreground text-lg">
              Compare 2-5 final candidates and generate professional PDF reports 
              ready for stakeholder presentations.
            </p>
            <div className="space-y-3">
              <ReportFeature text="Executive summary with AI narrative" />
              <ReportFeature text="Top recommendation with reasoning" />
              <ReportFeature text="Detailed comparison matrix" />
              <ReportFeature text="Business case response analysis" />
              <ReportFeature text="Interview performance comparison" />
              <ReportFeature text="Risk assessment per candidate" />
              <ReportFeature text="Recommended next steps & timeline" />
            </div>
            <div className="flex gap-4 pt-4">
              <div className="px-4 py-2 bg-young-blue/20 rounded-lg text-young-blue font-medium">
                PDF Export
              </div>
              <div className="px-4 py-2 bg-young-gold/20 rounded-lg text-young-gold font-medium">
                Email Sharing
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-young-lg p-8 border">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-2xl font-display font-bold">YOUNG<span className="text-young-gold">.</span></div>
              <div className="text-sm text-muted-foreground">Executive Report</div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-young-cream rounded-lg">
                <p className="text-sm italic text-foreground/80">
                  "After comprehensive analysis of all candidates, Sofia Andersson emerges 
                  as the strongest fit for this position..."
                </p>
              </div>
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-12 h-12 rounded-full bg-young-gold/20 flex items-center justify-center">
                  <Award className="w-6 h-6 text-young-gold" />
                </div>
                <div>
                  <p className="font-semibold">Top Recommendation</p>
                  <p className="text-sm text-muted-foreground">Sofia Andersson • Score: 91</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 10: ROI
    {
      id: "roi",
      title: "Return on Investment",
      subtitle: "Measurable impact on your recruitment",
      content: (
        <div className="h-full flex flex-col justify-center">
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <ROICard 
              value="70%"
              label="Reduction in Time-to-Hire"
              description="From 42 days to 12 days average"
              icon={<Clock className="w-8 h-8" />}
            />
            <ROICard 
              value="85%"
              label="Less Manual Screening"
              description="AI handles initial evaluation"
              icon={<Brain className="w-8 h-8" />}
            />
            <ROICard 
              value="3x"
              label="Better Candidate Quality"
              description="Data-driven selection reduces bad hires"
              icon={<Target className="w-8 h-8" />}
            />
            <ROICard 
              value="€50K+"
              label="Annual Savings"
              description="Per recruiter productivity gain"
              icon={<TrendingUp className="w-8 h-8" />}
            />
          </div>
          <div className="bg-gradient-to-r from-young-blue/10 via-young-gold/10 to-young-khaki/10 rounded-2xl p-8 border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold mb-2">Calculate Your ROI</h3>
                <p className="text-muted-foreground">
                  Based on your current hiring volume and costs, Young typically delivers 
                  positive ROI within the first 3 months.
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-young-gold">300%</p>
                <p className="text-muted-foreground">Average ROI Year 1</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 11: Competitive Advantages
    {
      id: "advantages",
      title: "Competitive Advantages",
      subtitle: "Why Young stands out",
      content: (
        <div className="grid md:grid-cols-2 gap-8 h-full items-center">
          <div className="space-y-6">
            <AdvantageCard
              icon={<Sparkles className="w-6 h-6" />}
              title="Conversational AI"
              description="Unlike static dashboards, Young AI provides interactive, context-aware assistance throughout the recruitment process."
              highlight="Unique"
            />
            <AdvantageCard
              icon={<FileText className="w-6 h-6" />}
              title="DISC Integration"
              description="Native personality assessment analysis with team fit predictions and management recommendations."
              highlight="Differentiator"
            />
            <AdvantageCard
              icon={<Award className="w-6 h-6" />}
              title="Executive Reports"
              description="AI-generated presentation-ready reports for stakeholder alignment, not just data exports."
              highlight="Premium"
            />
          </div>
          <div className="space-y-6">
            <AdvantageCard
              icon={<Brain className="w-6 h-6" />}
              title="Transparent AI"
              description="Every AI score comes with detailed reasoning and score change explanations. No black box decisions."
              highlight="Trust"
            />
            <AdvantageCard
              icon={<Globe className="w-6 h-6" />}
              title="Unified Platform"
              description="From job posting to offer letter - one platform for the entire recruitment lifecycle."
              highlight="Complete"
            />
            <AdvantageCard
              icon={<Shield className="w-6 h-6" />}
              title="Enterprise Security"
              description="Role-based access control, data encryption, and compliance-ready architecture."
              highlight="Secure"
            />
          </div>
        </div>
      ),
    },
    // Slide 12: CTA
    {
      id: "cta",
      title: "",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground">
            Ready to Transform<br />
            <span className="text-young-gold">Your Recruitment?</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Join forward-thinking companies using Young to build exceptional teams 
            faster and smarter than ever before.
          </p>
          <div className="flex gap-6 mt-8">
            <Button size="lg" className="bg-young-blue hover:bg-young-blue/90 text-white px-8 py-6 text-lg">
              Schedule Demo
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-young-gold text-young-gold hover:bg-young-gold/10">
              Contact Sales
            </Button>
          </div>
          <div className="flex items-center gap-8 mt-12 text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Free 14-day trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Full onboarding support</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-display text-2xl font-bold">
            YOUNG<span className="text-young-gold">.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {currentSlide + 1} / {slides.length}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={prevSlide}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextSlide}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 pt-20 pb-24">
        <div className="container mx-auto px-6 h-full">
          <div className="h-full flex flex-col">
            {slides[currentSlide].title && (
              <div className="mb-8">
                <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">
                  {slides[currentSlide].title}
                </h2>
                {slides[currentSlide].subtitle && (
                  <p className="text-xl text-muted-foreground mt-2">
                    {slides[currentSlide].subtitle}
                  </p>
                )}
              </div>
            )}
            <div className="flex-1">
              {slides[currentSlide].content}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t py-4">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide
                    ? "bg-young-blue w-8"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Component helpers
const FeatureItem = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-muted/50 transition-colors">
    <div className="w-10 h-10 rounded-lg bg-young-blue/10 flex items-center justify-center text-young-blue flex-shrink-0">
      {icon}
    </div>
    <div>
      <h4 className="font-semibold">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const AIFeatureCard = ({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) => {
  const colorClasses = {
    blue: "bg-young-blue/10 border-young-blue/20 text-young-blue",
    gold: "bg-young-gold/10 border-young-gold/20 text-young-gold",
    khaki: "bg-young-khaki/10 border-young-khaki/20 text-young-khaki",
  };
  
  return (
    <Card className={`p-6 border ${colorClasses[color as keyof typeof colorClasses].split(' ').slice(0, 2).join(' ')} hover:shadow-young-md transition-all`}>
      <div className={colorClasses[color as keyof typeof colorClasses].split(' ').slice(2).join(' ')}>
        {icon}
      </div>
      <h3 className="font-semibold mt-4 mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  );
};

const AutomationStep = ({ icon, title, description, isFirst, isLast }: { icon: React.ReactNode; title: string; description: string; isFirst?: boolean; isLast?: boolean }) => (
  <div className="flex flex-col items-center text-center">
    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isFirst ? 'bg-young-blue text-white' : isLast ? 'bg-green-500 text-white' : 'bg-young-gold text-white'}`}>
      {icon}
    </div>
    <h4 className="font-semibold mt-3">{title}</h4>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const MetricCard = ({ value, label, sublabel }: { value: string; label: string; sublabel: string }) => (
  <div className="text-center p-6 bg-muted/30 rounded-xl">
    <p className="text-4xl font-bold text-young-blue">{value}</p>
    <p className="font-semibold mt-2">{label}</p>
    <p className="text-sm text-muted-foreground">{sublabel}</p>
  </div>
);

const FunnelBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex items-center gap-4">
    <span className="w-24 text-sm text-muted-foreground">{label}</span>
    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
    </div>
    <span className="w-12 text-sm font-medium text-right">{value}%</span>
  </div>
);

const AnalyticsFeature = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="p-4 bg-muted/30 rounded-lg border">
    <div className="flex items-center gap-3 mb-2">
      <div className="text-young-blue">{icon}</div>
      <h4 className="font-semibold">{title}</h4>
    </div>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const ReportFeature = ({ text }: { text: string }) => (
  <div className="flex items-center gap-3">
    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
    <span>{text}</span>
  </div>
);

const ROICard = ({ value, label, description, icon }: { value: string; label: string; description: string; icon: React.ReactNode }) => (
  <Card className="p-6 text-center hover:shadow-young-md transition-all">
    <div className="w-16 h-16 rounded-full bg-young-blue/10 flex items-center justify-center mx-auto mb-4 text-young-blue">
      {icon}
    </div>
    <p className="text-4xl font-bold text-young-gold">{value}</p>
    <p className="font-semibold mt-2">{label}</p>
    <p className="text-sm text-muted-foreground mt-1">{description}</p>
  </Card>
);

const AdvantageCard = ({ icon, title, description, highlight }: { icon: React.ReactNode; title: string; description: string; highlight: string }) => (
  <Card className="p-6 hover:shadow-young-md transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className="w-12 h-12 rounded-lg bg-young-blue/10 flex items-center justify-center text-young-blue">
        {icon}
      </div>
      <span className="px-3 py-1 bg-young-gold/20 text-young-gold text-xs font-semibold rounded-full">
        {highlight}
      </span>
    </div>
    <h3 className="font-semibold text-lg mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </Card>
);

export default PitchDeck;
