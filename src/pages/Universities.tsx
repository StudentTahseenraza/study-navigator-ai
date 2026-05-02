import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UniversityCard } from '@/components/UniversityCard';
import { useUniversities } from '@/hooks/useUniversities';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Filter,
  X,
  Globe,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  Shield,
  Loader2,
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

const countries = [
  'All', 'USA', 'UK', 'Canada', 'Australia', 'Germany', 'Netherlands', 
  'Switzerland', 'Singapore', 'Japan', 'Hong Kong', 'South Korea', 'France', 
  'Sweden', 'Denmark', 'Norway', 'Finland', 'Belgium', 'Austria', 'Ireland',
  'New Zealand', 'Spain', 'Italy', 'China', 'Taiwan', 'India', 'UAE', 
  'Malaysia', 'Thailand', 'Brazil', 'Mexico', 'South Africa', 'Turkey', 
  'Egypt', 'Philippines', 'Indonesia', 'Vietnam', 'Israel', 'Russia'
];

const ITEMS_PER_PAGE = 12;

export const Universities = () => {
  const { universities, loadingUniversities, addToShortlist, isShortlisted } = useUniversities();
  const { profile } = useProfile();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [sortBy, setSortBy] = useState('ranking');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCategory, setShowCategory] = useState<'all' | 'dream' | 'target' | 'safe'>('all');

  const filteredUniversities = useMemo(() => {
    let filtered = universities.filter(uni => {
      const matchesSearch = uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uni.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uni.programs?.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCountry = selectedCountry === 'All' || uni.country === selectedCountry;
      return matchesSearch && matchesCountry;
    });

    // Categorize universities
    const categorized = filtered.map(uni => {
      const userGpa = profile?.gpa || 3.0;
      const minGpa = uni.min_gpa || 3.0;
      const acceptanceRate = uni.acceptance_rate || 50;

      if (acceptanceRate < 20 || minGpa > userGpa + 0.3) {
        return { ...uni, category: 'dream' as const };
      } else if (acceptanceRate < 50 || minGpa > userGpa - 0.2) {
        return { ...uni, category: 'target' as const };
      }
      return { ...uni, category: 'safe' as const };
    });

    // Filter by selected category
    if (showCategory !== 'all') {
      filtered = categorized.filter(uni => uni.category === showCategory);
    } else {
      filtered = categorized;
    }

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'ranking':
          return (a.ranking || 999) - (b.ranking || 999);
        case 'tuition_low':
          return (a.tuition_min || 0) - (b.tuition_min || 0);
        case 'tuition_high':
          return (b.tuition_max || 0) - (a.tuition_max || 0);
        case 'acceptance':
          return (b.acceptance_rate || 0) - (a.acceptance_rate || 0);
        case 'fit_score': {
          const calculateFitScore = (uni: typeof a) => {
            let score = 0;
            const userGpa = profile?.gpa || 3.0;
            if (uni.min_gpa) {
              const gpaDiff = (userGpa - uni.min_gpa) * 10;
              score += Math.max(0, Math.min(30, gpaDiff));
            }
            if (uni.acceptance_rate) {
              score += Math.min(40, uni.acceptance_rate * 0.4);
            }
            return score;
          };
          return calculateFitScore(b) - calculateFitScore(a);
        }
        default:
          return 0;
      }
    });
  }, [universities, searchQuery, selectedCountry, sortBy, showCategory, profile?.gpa]);

  const totalPages = Math.ceil(filteredUniversities.length / ITEMS_PER_PAGE);
  const paginatedUniversities = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUniversities.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUniversities, currentPage]);

  const handleAddToShortlist = async (uni: Tables<'universities'>) => {
    const userGpa = profile?.gpa || 3.0;
    const minGpa = uni.min_gpa || 3.0;
    const acceptanceRate = uni.acceptance_rate || 50;

    let category: 'dream' | 'target' | 'safe' = 'safe';
    if (acceptanceRate < 20 || minGpa > userGpa + 0.3) {
      category = 'dream';
    } else if (acceptanceRate < 50 || minGpa > userGpa - 0.2) {
      category = 'target';
    }

    await addToShortlist.mutateAsync({
      universityId: uni.id,
      category,
      fitScore: Math.round((uni.acceptance_rate || 50) + ((profile?.gpa || 3) / (uni.min_gpa || 3)) * 20),
      riskLevel: category === 'dream' ? 'high' : category === 'target' ? 'medium' : 'low',
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCountry, sortBy, showCategory]);

  const categoryCounts = useMemo(() => {
    const userGpa = profile?.gpa || 3.0;
    return {
      dream: universities.filter(u => {
        const minGpa = u.min_gpa || 3.0;
        const acceptanceRate = u.acceptance_rate || 50;
        return acceptanceRate < 20 || minGpa > userGpa + 0.3;
      }).length,
      target: universities.filter(u => {
        const minGpa = u.min_gpa || 3.0;
        const acceptanceRate = u.acceptance_rate || 50;
        return (acceptanceRate >= 20 && acceptanceRate < 50) || 
               (minGpa > userGpa - 0.2 && minGpa <= userGpa + 0.3);
      }).length,
      safe: universities.filter(u => {
        const minGpa = u.min_gpa || 3.0;
        const acceptanceRate = u.acceptance_rate || 50;
        return acceptanceRate >= 50 && minGpa <= userGpa - 0.2;
      }).length
    };
  }, [universities, profile?.gpa]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Discover Universities
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Explore {universities.length}+ universities worldwide with real logos and data
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Globe className="w-4 h-4" />
            <span>{filteredUniversities.length} universities found</span>
            {filteredUniversities.length > ITEMS_PER_PAGE && (
              <span className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 px-3 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant={showCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setShowCategory('all')}
            className={`justify-start h-auto py-4 transition-all ${
              showCategory === 'all' 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Globe className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">All Universities</div>
              <div className="text-sm opacity-80">{universities.length} total</div>
            </div>
          </Button>

          <Button
            variant={showCategory === 'dream' ? 'default' : 'outline'}
            onClick={() => setShowCategory('dream')}
            className={`justify-start h-auto py-4 transition-all ${
              showCategory === 'dream' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Sparkles className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Dream</div>
              <div className="text-sm opacity-80">{categoryCounts.dream} universities</div>
            </div>
          </Button>

          <Button
            variant={showCategory === 'target' ? 'default' : 'outline'}
            onClick={() => setShowCategory('target')}
            className={`justify-start h-auto py-4 transition-all ${
              showCategory === 'target' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Target className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Target</div>
              <div className="text-sm opacity-80">{categoryCounts.target} universities</div>
            </div>
          </Button>

          <Button
            variant={showCategory === 'safe' ? 'default' : 'outline'}
            onClick={() => setShowCategory('safe')}
            className={`justify-start h-auto py-4 transition-all ${
              showCategory === 'safe' 
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-0' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Shield className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Safe</div>
              <div className="text-sm opacity-80">{categoryCounts.safe} universities</div>
            </div>
          </Button>
        </div>

        {/* Search and Filters - DARK THEME UPDATED */}
        <div className="bg-gray-900 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl p-5 border border-gray-800 dark:border-gray-700 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search universities, programs, or countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 rounded-xl h-12 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-300 transition-colors" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-gray-100 rounded-xl h-12 focus:ring-blue-500/20">
                  <Filter className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                  {countries.map(country => (
                    <SelectItem 
                      key={country} 
                      value={country}
                      className="focus:bg-gray-700 focus:text-gray-100"
                    >
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-gray-100 rounded-xl h-12 focus:ring-blue-500/20">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                  </svg>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectItem value="ranking" className="focus:bg-gray-700">Ranking</SelectItem>
                  <SelectItem value="tuition_low" className="focus:bg-gray-700">Tuition (Low to High)</SelectItem>
                  <SelectItem value="tuition_high" className="focus:bg-gray-700">Tuition (High to Low)</SelectItem>
                  <SelectItem value="acceptance" className="focus:bg-gray-700">Acceptance Rate</SelectItem>
                  <SelectItem value="fit_score" className="focus:bg-gray-700">Fit Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-800">
            {(selectedCountry !== 'All' || searchQuery || showCategory !== 'all') && (
              <div className="text-sm text-gray-400 mr-2">Active filters:</div>
            )}
            {selectedCountry !== 'All' && (
              <div className="px-3 py-1 bg-blue-900/40 text-blue-300 rounded-full text-sm flex items-center gap-1 border border-blue-800/50">
                Country: {selectedCountry}
                <button 
                  onClick={() => setSelectedCountry('All')}
                  className="hover:text-blue-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {searchQuery && (
              <div className="px-3 py-1 bg-purple-900/40 text-purple-300 rounded-full text-sm flex items-center gap-1 border border-purple-800/50">
                Search: "{searchQuery}"
                <button 
                  onClick={() => setSearchQuery('')}
                  className="hover:text-purple-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {showCategory !== 'all' && (
              <div className="px-3 py-1 bg-emerald-900/40 text-emerald-300 rounded-full text-sm flex items-center gap-1 border border-emerald-800/50">
                {showCategory.charAt(0).toUpperCase() + showCategory.slice(1)} only
                <button 
                  onClick={() => setShowCategory('all')}
                  className="hover:text-emerald-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Universities Grid */}
        {loadingUniversities ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {paginatedUniversities.length > 0 ? (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedUniversities.map((uni) => (
                    <UniversityCard
                      key={uni.id}
                      university={uni}
                      category={(uni as any).category}
                      isShortlisted={isShortlisted(uni.id)}
                      onAddToShortlist={handleAddToShortlist}
                      profileGpa={profile?.gpa}
                    />
                  ))}
                </div>

                {/* Pagination - Dark Theme */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="rounded-full border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="icon"
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 rounded-full ${
                            currentPage === pageNum 
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0' 
                              : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="rounded-full border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    
                    <span className="text-sm text-gray-400 ml-4">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredUniversities.length)} of {filteredUniversities.length} universities
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full flex items-center justify-center">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2 text-gray-100">No universities found</h3>
                <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCountry('All');
                      setShowCategory('all');
                      setSortBy('ranking');
                    }}
                    className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
                  >
                    Clear all filters
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
                    onClick={() => document.getElementById('search-section')?.scrollIntoView()}
                  >
                    Back to search
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Universities;