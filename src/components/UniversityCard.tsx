import { useState } from 'react';
import { MapPin, DollarSign, TrendingUp, Plus, Check, ExternalLink, Eye, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UniversityLogo } from './UniversityLogo';
import { UniversityDetailsModal } from './UniversityDetailsModal';
import type { Tables } from '@/integrations/supabase/types';

interface UniversityCardProps {
  university: Tables<'universities'>;
  category: 'dream' | 'target' | 'safe';
  isShortlisted: boolean;
  onAddToShortlist: (university: Tables<'universities'>) => void;
  profileGpa?: number;
}

export const UniversityCard = ({
  university,
  category,
  isShortlisted,
  onAddToShortlist,
  profileGpa = 3.0
}: UniversityCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const categoryStyles = {
    dream: {
      bg: 'bg-gradient-to-r from-purple-900/30 to-pink-900/30',
      border: 'border-purple-700/50',
      badge: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
      text: 'text-purple-300',
      button: 'from-purple-600 to-pink-600'
    },
    target: {
      bg: 'bg-gradient-to-r from-emerald-900/30 to-teal-900/30',
      border: 'border-emerald-700/50',
      badge: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white',
      text: 'text-emerald-300',
      button: 'from-emerald-600 to-teal-600'
    },
    safe: {
      bg: 'bg-gradient-to-r from-amber-900/30 to-orange-900/30',
      border: 'border-amber-700/50',
      badge: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white',
      text: 'text-amber-300',
      button: 'from-amber-600 to-orange-600'
    }
  };

  const styles = categoryStyles[category];

  // Calculate fit score based on profile vs requirements
  const calculateFitScore = () => {
    let score = 0;
    
    if (university.min_gpa) {
      const gpaDiff = (profileGpa - university.min_gpa) * 10;
      score += Math.max(0, Math.min(30, gpaDiff));
    }
    
    if (university.acceptance_rate) {
      score += Math.min(40, university.acceptance_rate * 0.4);
    }
    
    return Math.round(score);
  };

  const fitScore = calculateFitScore();

  return (
    <>
      <div className={`${styles.bg} ${styles.border} rounded-xl border p-5 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:scale-[1.02] h-full flex flex-col backdrop-blur-sm`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${styles.badge} border-0 font-semibold px-3 py-1 shadow-lg`}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Badge>
              {university.ranking && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/50 backdrop-blur-sm rounded-full">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-semibold text-gray-200">#{university.ranking}</span>
                </div>
              )}
            </div>
            <h3 className="font-display text-lg font-bold text-white leading-tight">
              {university.name}
            </h3>
          </div>
          
          <UniversityLogo 
            logoUrl={university.logo_url} 
            name={university.name}
            className="shadow-lg border-gray-700"
          />
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-300 mb-4">
          <MapPin className="w-4 h-4" />
          <span className="font-medium">{university.city}, {university.country}</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
              <DollarSign className="w-3 h-3" />
              Tuition/Year
            </div>
            <p className="font-bold text-white">
              ${((university.tuition_min || 0) / 1000).toFixed(0)}k - ${((university.tuition_max || 0) / 1000).toFixed(0)}k
            </p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
              <TrendingUp className="w-3 h-3" />
              Acceptance
            </div>
            <p className="font-bold text-white">
              {university.acceptance_rate?.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Fit Score */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-300">Fit Score</span>
            <span className={`text-sm font-bold ${
              fitScore >= 70 ? 'text-emerald-400' : 
              fitScore >= 50 ? 'text-amber-400' : 
              'text-red-400'
            }`}>
              {fitScore}/100
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                fitScore >= 70 ? 'bg-emerald-500' : 
                fitScore >= 50 ? 'bg-amber-500' : 
                'bg-red-500'
              }`}
              style={{ width: `${fitScore}%` }}
            />
          </div>
        </div>

        {/* Requirements */}
        <div className="space-y-2 mb-4">
          {university.min_gpa && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Min GPA</span>
              <span className="font-bold text-white">
                {university.min_gpa.toFixed(1)}
                {profileGpa && (
                  <span className={`ml-2 text-xs ${profileGpa >= university.min_gpa ? 'text-emerald-400' : 'text-red-400'}`}>
                    ({profileGpa >= university.min_gpa ? '✓' : '✗'})
                  </span>
                )}
              </span>
            </div>
          )}
          {university.min_ielts && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">IELTS</span>
              <span className="font-bold text-white">
                {university.min_ielts.toFixed(1)}+
              </span>
            </div>
          )}
          {university.min_gre && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">GRE</span>
              <span className="font-bold text-white">
                {university.min_gre}+
              </span>
            </div>
          )}
        </div>

        {/* Programs */}
        {university.programs && university.programs.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-400 mb-2">Popular Programs</div>
            <div className="flex flex-wrap gap-1.5">
              {university.programs.slice(0, 3).map((program, index) => (
                <span
                  key={`${program}-${index}`}
                  className="px-2.5 py-1 rounded-full text-xs bg-gray-800/70 text-gray-300 font-medium border border-gray-700"
                >
                  {program}
                </span>
              ))}
              {university.programs.length > 3 && (
                <span className="px-2.5 py-1 rounded-full text-xs bg-gray-800 text-gray-400 font-medium">
                  +{university.programs.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto">
          <Button
            onClick={() => onAddToShortlist(university)}
            disabled={isShortlisted}
            className={`flex-1 font-semibold ${
              isShortlisted 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                : `bg-gradient-to-r ${styles.button} text-white hover:opacity-90 shadow-lg`
            }`}
          >
            {isShortlisted ? (
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
          
          <Button
            variant="outline"
            size="icon"
            className="flex-shrink-0 border-gray-700 bg-gray-800/50 hover:bg-gray-700/50"
            onClick={() => setShowDetails(true)}
            title="View details"
          >
            <Eye className="w-4 h-4 text-gray-300" />
          </Button>
          
          {university.website_url && (
            <a
              href={university.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
              title="Visit website"
            >
              <Button variant="outline" size="icon" className="border-gray-700 bg-gray-800/50 hover:bg-gray-700/50">
                <ExternalLink className="w-4 h-4 text-gray-300" />
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <UniversityDetailsModal
        university={university}
        category={category}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        profileGpa={profileGpa}
      />
    </>
  );
};