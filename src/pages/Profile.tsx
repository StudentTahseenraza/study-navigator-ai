import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Save,
  Loader2,
  BookOpen,
  Target,
  Wallet,
  FileText,
} from 'lucide-react';

const countries = [
  'USA', 'UK', 'Canada', 'Australia', 'Germany', 'Netherlands', 
  'Switzerland', 'Singapore', 'New Zealand', 'Ireland'
];

const educationLevels = ['High School', "Bachelor's Degree", "Master's Degree", 'PhD', 'Other'];
const degrees = ["Bachelor's", "Master's", 'MBA', 'PhD'];
const fields = ['Computer Science', 'Engineering', 'Business', 'Data Science', 'Medicine', 'Law', 'Arts', 'Natural Sciences', 'Other'];
const fundingPlans = ['Self-funded', 'Scholarship-dependent', 'Loan-dependent', 'Partially funded'];

export const Profile = () => {
  const { profile, updateProfile, isLoading, calculateProfileStrength } = useProfile();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    current_education_level: profile?.current_education_level || '',
    degree_major: profile?.degree_major || '',
    graduation_year: profile?.graduation_year || new Date().getFullYear(),
    gpa: profile?.gpa?.toString() || '',
    intended_degree: profile?.intended_degree || '',
    field_of_study: profile?.field_of_study || '',
    target_intake_year: profile?.target_intake_year || new Date().getFullYear() + 1,
    preferred_countries: profile?.preferred_countries || [],
    budget_min: profile?.budget_min?.toString() || '',
    budget_max: profile?.budget_max?.toString() || '',
    funding_plan: profile?.funding_plan || '',
    ielts_status: profile?.ielts_status || 'not_started',
    ielts_score: profile?.ielts_score?.toString() || '',
    toefl_status: profile?.toefl_status || 'not_started',
    toefl_score: profile?.toefl_score?.toString() || '',
    gre_status: profile?.gre_status || 'not_started',
    gre_score: profile?.gre_score?.toString() || '',
    gmat_status: profile?.gmat_status || 'not_started',
    gmat_score: profile?.gmat_score?.toString() || '',
    sop_status: profile?.sop_status || 'not_started',
  });

  // Update form when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        current_education_level: profile.current_education_level || '',
        degree_major: profile.degree_major || '',
        graduation_year: profile.graduation_year || new Date().getFullYear(),
        gpa: profile.gpa?.toString() || '',
        intended_degree: profile.intended_degree || '',
        field_of_study: profile.field_of_study || '',
        target_intake_year: profile.target_intake_year || new Date().getFullYear() + 1,
        preferred_countries: profile.preferred_countries || [],
        budget_min: profile.budget_min?.toString() || '',
        budget_max: profile.budget_max?.toString() || '',
        funding_plan: profile.funding_plan || '',
        ielts_status: profile.ielts_status || 'not_started',
        ielts_score: profile.ielts_score?.toString() || '',
        toefl_status: profile.toefl_status || 'not_started',
        toefl_score: profile.toefl_score?.toString() || '',
        gre_status: profile.gre_status || 'not_started',
        gre_score: profile.gre_score?.toString() || '',
        gmat_status: profile.gmat_status || 'not_started',
        gmat_score: profile.gmat_score?.toString() || '',
        sop_status: profile.sop_status || 'not_started',
      });
    }
  });

  const handleCountryToggle = (country: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_countries: prev.preferred_countries.includes(country)
        ? prev.preferred_countries.filter(c => c !== country)
        : [...prev.preferred_countries, country]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile.mutateAsync({
        full_name: formData.full_name,
        current_education_level: formData.current_education_level,
        degree_major: formData.degree_major,
        graduation_year: formData.graduation_year,
        gpa: formData.gpa ? parseFloat(formData.gpa) : null,
        intended_degree: formData.intended_degree,
        field_of_study: formData.field_of_study,
        target_intake_year: formData.target_intake_year,
        preferred_countries: formData.preferred_countries,
        budget_min: formData.budget_min ? parseInt(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseInt(formData.budget_max) : null,
        funding_plan: formData.funding_plan,
        ielts_status: formData.ielts_status as any,
        ielts_score: formData.ielts_score ? parseFloat(formData.ielts_score) : null,
        toefl_status: formData.toefl_status as any,
        toefl_score: formData.toefl_score ? parseInt(formData.toefl_score) : null,
        gre_status: formData.gre_status as any,
        gre_score: formData.gre_score ? parseInt(formData.gre_score) : null,
        gmat_status: formData.gmat_status as any,
        gmat_score: formData.gmat_score ? parseInt(formData.gmat_score) : null,
        sop_status: formData.sop_status as any,
      });
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const profileStrength = calculateProfileStrength(profile);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">My Profile</h1>
            <p className="text-muted-foreground">
              Keep your profile updated for better recommendations
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Profile Strength</p>
              <p className="font-display text-2xl font-bold gradient-text">{profileStrength}%</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gradient-bg text-white hover:opacity-90"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Personal Info */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold">Personal Information</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={profile?.email || ''}
                disabled
                className="bg-muted border-border"
              />
            </div>
          </div>
        </div>

        {/* Academic Background */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold">Academic Background</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Current Education Level</Label>
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
              <Label>Degree / Major</Label>
              <Input
                value={formData.degree_major}
                onChange={(e) => setFormData({ ...formData, degree_major: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Graduation Year</Label>
              <Input
                type="number"
                value={formData.graduation_year}
                onChange={(e) => setFormData({ ...formData, graduation_year: parseInt(e.target.value) })}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>GPA</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.gpa}
                onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </div>

        {/* Study Goals */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold">Study Goals</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Intended Degree</Label>
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
              <Label>Field of Study</Label>
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
                value={formData.target_intake_year}
                onChange={(e) => setFormData({ ...formData, target_intake_year: parseInt(e.target.value) })}
                className="bg-secondary border-border max-w-xs"
              />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Label>Preferred Countries</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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

        {/* Budget */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold">Budget & Funding</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Min Budget (USD/year)</Label>
              <Input
                type="number"
                value={formData.budget_min}
                onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Max Budget (USD/year)</Label>
              <Input
                type="number"
                value={formData.budget_max}
                onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Funding Plan</Label>
              <Select 
                value={formData.funding_plan}
                onValueChange={(value) => setFormData({ ...formData, funding_plan: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {fundingPlans.map(plan => (
                    <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Exam Readiness */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold">Exam Readiness</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { key: 'ielts', label: 'IELTS', scoreKey: 'ielts_score', statusKey: 'ielts_status' },
              { key: 'toefl', label: 'TOEFL', scoreKey: 'toefl_score', statusKey: 'toefl_status' },
              { key: 'gre', label: 'GRE', scoreKey: 'gre_score', statusKey: 'gre_status' },
              { key: 'gmat', label: 'GMAT', scoreKey: 'gmat_score', statusKey: 'gmat_status' },
            ].map(exam => (
              <div key={exam.key} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                <span className="font-medium w-20">{exam.label}</span>
                <Select 
                  value={formData[exam.statusKey as keyof typeof formData] as string}
                  onValueChange={(value) => setFormData({ ...formData, [exam.statusKey]: value })}
                >
                  <SelectTrigger className="w-36 bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Score"
                  value={formData[exam.scoreKey as keyof typeof formData] as string}
                  onChange={(e) => setFormData({ ...formData, [exam.scoreKey]: e.target.value })}
                  className="w-24 bg-background border-border"
                />
              </div>
            ))}

            <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
              <span className="font-medium w-20">SOP</span>
              <Select 
                value={formData.sop_status}
                onValueChange={(value: any) => setFormData({ ...formData, sop_status: value })}
              >
                <SelectTrigger className="w-36 bg-background border-border">
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
        </div>

        {/* Save Button (Mobile) */}
        <div className="lg:hidden">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full gradient-bg text-white hover:opacity-90"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
