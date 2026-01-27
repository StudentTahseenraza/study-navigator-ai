import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUniversities } from '@/hooks/useUniversities';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  MapPin,
  DollarSign,
  TrendingUp,
  Star,
  Plus,
  Check,
  GraduationCap,
  Filter,
  X,
  Globe,
} from 'lucide-react';

const countries = ['All', 'USA', 'UK', 'Canada', 'Australia', 'Germany', 'Netherlands', 'Switzerland', 'Singapore'];

export const Universities = () => {
  const { universities, loadingUniversities, addToShortlist, isShortlisted } = useUniversities();
  const { profile } = useProfile();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [sortBy, setSortBy] = useState('ranking');
  const [showFilters, setShowFilters] = useState(false);

  const filteredUniversities = universities
    .filter(uni => {
      const matchesSearch = uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uni.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uni.programs?.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCountry = selectedCountry === 'All' || uni.country === selectedCountry;
      return matchesSearch && matchesCountry;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'ranking':
          return (a.ranking || 999) - (b.ranking || 999);
        case 'tuition_low':
          return (a.tuition_min || 0) - (b.tuition_min || 0);
        case 'tuition_high':
          return (b.tuition_max || 0) - (a.tuition_max || 0);
        case 'acceptance':
          return (b.acceptance_rate || 0) - (a.acceptance_rate || 0);
        default:
          return 0;
      }
    });

  const categorizeUniversity = (uni: typeof universities[0]) => {
    const userGpa = profile?.gpa || 3.0;
    const minGpa = uni.min_gpa || 3.0;
    const acceptanceRate = uni.acceptance_rate || 50;

    if (acceptanceRate < 20 || minGpa > userGpa + 0.3) {
      return 'dream';
    } else if (acceptanceRate < 50 || minGpa > userGpa - 0.2) {
      return 'target';
    }
    return 'safe';
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'dream':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'target':
        return 'bg-success/20 text-success border-success/30';
      case 'safe':
        return 'bg-warning/20 text-warning border-warning/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleAddToShortlist = async (uni: typeof universities[0]) => {
    const category = categorizeUniversity(uni);
    await addToShortlist.mutateAsync({
      universityId: uni.id,
      category,
      fitScore: Math.round((uni.acceptance_rate || 50) + ((profile?.gpa || 3) / (uni.min_gpa || 3)) * 20),
      riskLevel: category === 'dream' ? 'high' : category === 'target' ? 'medium' : 'low',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">Discover Universities</h1>
            <p className="text-muted-foreground">
              Find universities that match your profile and goals
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-4 h-4" />
            <span>{filteredUniversities.length} universities found</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="glass-card p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search universities, programs, or countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-40 bg-secondary border-border">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-secondary border-border">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ranking">Ranking</SelectItem>
                  <SelectItem value="tuition_low">Tuition (Low to High)</SelectItem>
                  <SelectItem value="tuition_high">Tuition (High to Low)</SelectItem>
                  <SelectItem value="acceptance">Acceptance Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Dream (Competitive)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span>Target (Good Fit)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span>Safe (High Chance)</span>
            </div>
          </div>
        </div>

        {/* Universities Grid */}
        {loadingUniversities ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUniversities.map(uni => {
              const category = categorizeUniversity(uni);
              const shortlisted = isShortlisted(uni.id);
              
              return (
                <div
                  key={uni.id}
                  className={`university-card ${category}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getCategoryStyles(category)}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Badge>
                        {uni.ranking && (
                          <span className="text-xs text-muted-foreground">
                            #{uni.ranking} World
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-lg font-semibold leading-tight">
                        {uni.name}
                      </h3>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-6 h-6 text-primary" />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{uni.city}, {uni.country}</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <DollarSign className="w-3 h-3" />
                        Tuition/Year
                      </div>
                      <p className="font-semibold text-sm">
                        ${((uni.tuition_min || 0) / 1000).toFixed(0)}k - ${((uni.tuition_max || 0) / 1000).toFixed(0)}k
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <TrendingUp className="w-3 h-3" />
                        Acceptance
                      </div>
                      <p className="font-semibold text-sm">
                        {uni.acceptance_rate?.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="space-y-2 mb-4">
                    {uni.min_gpa && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Min GPA</span>
                        <span className="font-medium">{uni.min_gpa.toFixed(1)}</span>
                      </div>
                    )}
                    {uni.min_ielts && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">IELTS</span>
                        <span className="font-medium">{uni.min_ielts.toFixed(1)}+</span>
                      </div>
                    )}
                    {uni.min_gre && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">GRE</span>
                        <span className="font-medium">{uni.min_gre}+</span>
                      </div>
                    )}
                  </div>

                  {/* Programs */}
                  {uni.programs && uni.programs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {uni.programs.slice(0, 3).map(program => (
                        <span
                          key={program}
                          className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground"
                        >
                          {program}
                        </span>
                      ))}
                      {uni.programs.length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-muted-foreground">
                          +{uni.programs.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={() => handleAddToShortlist(uni)}
                    disabled={shortlisted || addToShortlist.isPending}
                    variant={shortlisted ? 'outline' : 'default'}
                    className={`w-full ${!shortlisted ? 'gradient-bg text-white hover:opacity-90' : ''}`}
                  >
                    {shortlisted ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Shortlisted
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Shortlist
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {filteredUniversities.length === 0 && !loadingUniversities && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-display text-xl font-semibold mb-2">No universities found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Universities;
