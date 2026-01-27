import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FloatingBubbles } from '@/components/ui/FloatingBubbles';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { 
  GraduationCap, 
  ArrowRight, 
  ArrowLeft, 
  Loader2,
  BookOpen,
  Target,
  Wallet,
  FileText,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const steps = [
  { id: 1, title: 'Academic Background', icon: BookOpen },
  { id: 2, title: 'Study Goals', icon: Target },
  { id: 3, title: 'Budget', icon: Wallet },
  { id: 4, title: 'Exam Readiness', icon: FileText },
];

const countries = [
  'USA', 'UK', 'Canada', 'Australia', 'Germany', 'Netherlands', 
  'Switzerland', 'Singapore', 'New Zealand', 'Ireland'
];

const educationLevels = [
  'High School', "Bachelor's Degree", "Master's Degree", 'PhD', 'Other'
];

const degrees = [
  "Bachelor's", "Master's", 'MBA', 'PhD'
];

const fields = [
  'Computer Science', 'Engineering', 'Business', 'Data Science', 
  'Medicine', 'Law', 'Arts', 'Natural Sciences', 'Other'
];

const fundingPlans = [
  'Self-funded', 'Scholarship-dependent', 'Loan-dependent', 'Partially funded'
];

export const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, updateProfile, isLoading: profileLoading } = useProfile();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Academic Background
    current_education_level: '',
    degree_major: '',
    graduation_year: new Date().getFullYear(),
    gpa: '',
    // Study Goals
    intended_degree: '',
    field_of_study: '',
    target_intake_year: new Date().getFullYear() + 1,
    preferred_countries: [] as string[],
    // Budget
    budget_min: '',
    budget_max: '',
    funding_plan: '',
    // Exams
    ielts_status: 'not_started' as const,
    toefl_status: 'not_started' as const,
    gre_status: 'not_started' as const,
    gmat_status: 'not_started' as const,
    sop_status: 'not_started' as const,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
    if (profile?.onboarding_completed) {
      navigate('/dashboard');
    }
  }, [user, authLoading, profile, navigate]);

  const handleCountryToggle = (country: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_countries: prev.preferred_countries.includes(country)
        ? prev.preferred_countries.filter(c => c !== country)
        : [...prev.preferred_countries, country]
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await updateProfile.mutateAsync({
        ...formData,
        gpa: formData.gpa ? parseFloat(formData.gpa) : null,
        budget_min: formData.budget_min ? parseInt(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseInt(formData.budget_max) : null,
        onboarding_completed: true,
        current_stage: 'profile_building',
        profile_strength: 60,
      });
      toast({
        title: 'Onboarding complete! 🎉',
        description: 'Welcome to AI Counsellor. Let\'s find your dream university.',
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.current_education_level && formData.degree_major;
      case 2:
        return formData.intended_degree && formData.field_of_study && formData.preferred_countries.length > 0;
      case 3:
        return formData.budget_max && formData.funding_plan;
      case 4:
        return true;
      default:
        return false;
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingBubbles />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-xl font-bold">AI Counsellor</span>
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Let's Build Your Profile</h1>
          <p className="text-muted-foreground">
            Complete these steps to unlock personalized university recommendations
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-12 max-w-2xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`stage-indicator ${
                  currentStep > step.id ? 'completed' : 
                  currentStep === step.id ? 'active' : 'upcoming'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs mt-2 ${
                  currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 md:w-24 h-0.5 mx-2 ${
                  currentStep > step.id ? 'bg-success' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="glass-card p-8 max-w-2xl mx-auto">
          {/* Step 1: Academic Background */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h2 className="font-display text-2xl font-bold">Academic Background</h2>
                <p className="text-muted-foreground">Tell us about your education</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Current Education Level *</Label>
                  <Select 
                    value={formData.current_education_level}
                    onValueChange={(value) => setFormData({ ...formData, current_education_level: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationLevels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Degree / Major *</Label>
                  <Input
                    placeholder="e.g., Computer Science"
                    value={formData.degree_major}
                    onChange={(e) => setFormData({ ...formData, degree_major: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Graduation Year</Label>
                  <Input
                    type="number"
                    placeholder="2024"
                    value={formData.graduation_year}
                    onChange={(e) => setFormData({ ...formData, graduation_year: parseInt(e.target.value) })}
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label>GPA (Optional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="3.5"
                    value={formData.gpa}
                    onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Study Goals */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <Target className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h2 className="font-display text-2xl font-bold">Study Goals</h2>
                <p className="text-muted-foreground">What do you want to study and where?</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Intended Degree *</Label>
                  <Select 
                    value={formData.intended_degree}
                    onValueChange={(value) => setFormData({ ...formData, intended_degree: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select degree" />
                    </SelectTrigger>
                    <SelectContent>
                      {degrees.map(degree => (
                        <SelectItem key={degree} value={degree}>{degree}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Field of Study *</Label>
                  <Select 
                    value={formData.field_of_study}
                    onValueChange={(value) => setFormData({ ...formData, field_of_study: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Target Intake Year</Label>
                  <Input
                    type="number"
                    placeholder="2025"
                    value={formData.target_intake_year}
                    onChange={(e) => setFormData({ ...formData, target_intake_year: parseInt(e.target.value) })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Preferred Countries * (Select at least one)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {countries.map(country => (
                    <div
                      key={country}
                      onClick={() => handleCountryToggle(country)}
                      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                        formData.preferred_countries.includes(country)
                          ? 'bg-primary/20 border-primary border'
                          : 'bg-secondary border-border border hover:border-primary/50'
                      }`}
                    >
                      <Checkbox 
                        checked={formData.preferred_countries.includes(country)}
                        className="pointer-events-none"
                      />
                      <span className="text-sm">{country}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Budget */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <Wallet className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h2 className="font-display text-2xl font-bold">Budget & Funding</h2>
                <p className="text-muted-foreground">Help us find universities within your budget</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Minimum Budget (USD/year)</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={formData.budget_min}
                    onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Maximum Budget (USD/year) *</Label>
                  <Input
                    type="number"
                    placeholder="50000"
                    value={formData.budget_max}
                    onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Funding Plan *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {fundingPlans.map(plan => (
                    <div
                      key={plan}
                      onClick={() => setFormData({ ...formData, funding_plan: plan })}
                      className={`p-4 rounded-lg cursor-pointer transition-all text-center ${
                        formData.funding_plan === plan
                          ? 'bg-primary/20 border-primary border'
                          : 'bg-secondary border-border border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-sm font-medium">{plan}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Exam Readiness */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h2 className="font-display text-2xl font-bold">Exam Readiness</h2>
                <p className="text-muted-foreground">Where are you in your test preparation?</p>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'ielts_status', label: 'IELTS / English Proficiency' },
                  { key: 'toefl_status', label: 'TOEFL' },
                  { key: 'gre_status', label: 'GRE' },
                  { key: 'gmat_status', label: 'GMAT' },
                ].map(exam => (
                  <div key={exam.key} className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                    <span className="font-medium">{exam.label}</span>
                    <Select 
                      value={formData[exam.key as keyof typeof formData] as string}
                      onValueChange={(value: any) => setFormData({ ...formData, [exam.key]: value })}
                    >
                      <SelectTrigger className="w-40 bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                  <span className="font-medium">Statement of Purpose (SOP)</span>
                  <Select 
                    value={formData.sop_status}
                    onValueChange={(value: any) => setFormData({ ...formData, sop_status: value })}
                  >
                    <SelectTrigger className="w-40 bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">You're almost there!</p>
                  <p className="text-muted-foreground text-sm">
                    After completing onboarding, the AI Counsellor will analyze your profile 
                    and recommend universities tailored to your goals.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="gradient-bg text-white gap-2 hover:opacity-90"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="gradient-bg text-white gap-2 hover:opacity-90"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
