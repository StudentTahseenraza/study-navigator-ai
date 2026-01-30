import { X, MapPin, DollarSign, TrendingUp, Calendar, Globe, BookOpen, Award, Users, Clock } from 'lucide-react';
import { UniversityLogo } from './UniversityLogo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Tables } from '@/integrations/supabase/types';

interface UniversityDetailsModalProps {
  university: Tables<'universities'>;
  category: 'dream' | 'target' | 'safe';
  isOpen: boolean;
  onClose: () => void;
  profileGpa?: number;
}

export const UniversityDetailsModal = ({
  university,
  category,
  isOpen,
  onClose,
  profileGpa = 3.0
}: UniversityDetailsModalProps) => {
  if (!isOpen) return null;

  const categoryStyles = {
    dream: 'bg-gradient-to-r from-purple-600 to-pink-600',
    target: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    safe: 'bg-gradient-to-r from-amber-600 to-orange-600'
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-800 shadow-2xl">
        {/* Header */}
        <div className={`${categoryStyles[category]} p-6 text-white`}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-white/20 backdrop-blur-sm border-0 text-white">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Badge>
                {university.ranking && (
                  <span className="text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    World Rank #{university.ranking}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold mb-2">{university.name}</h2>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">{university.city}, {university.country}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UniversityLogo logoUrl={university.logo_url} name={university.name} size="lg" />
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Description */}
            {university.description && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-white">
                  <BookOpen className="w-5 h-5" />
                  About University
                </h3>
                <p className="text-gray-300">{university.description}</p>
              </div>
            )}

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-xl p-4 border border-blue-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium text-gray-400">Annual Tuition</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  ${((university.tuition_min || 0) / 1000).toFixed(0)}k
                </p>
                <p className="text-sm text-gray-500">to ${((university.tuition_max || 0) / 1000).toFixed(0)}k</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-xl p-4 border border-emerald-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium text-gray-400">Acceptance Rate</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {university.acceptance_rate?.toFixed(1)}%
                </p>
                <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{ width: `${Math.min(100, (university.acceptance_rate || 0) * 2)}%` }}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 rounded-xl p-4 border border-amber-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-medium text-gray-400">Fit Score</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {fitScore}/100
                </p>
                <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      fitScore >= 70 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 
                      fitScore >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 
                      'bg-gradient-to-r from-red-500 to-pink-500'
                    }`}
                    style={{ width: `${fitScore}%` }}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium text-gray-400">Programs</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {university.programs?.length || 0}
                </p>
                <p className="text-sm text-gray-500">Available programs</p>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Admission Requirements</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {university.min_gpa && (
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Minimum GPA</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">
                        {university.min_gpa.toFixed(1)}
                      </span>
                      {profileGpa && (
                        <span className={`text-sm ${profileGpa >= university.min_gpa ? 'text-emerald-400' : 'text-red-400'}`}>
                          {profileGpa >= university.min_gpa ? '✓ Meets' : '✗ Below'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {university.min_ielts && (
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">IELTS</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">
                        {university.min_ielts.toFixed(1)}+
                      </span>
                    </div>
                  </div>
                )}
                {university.min_toefl && (
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">TOEFL iBT</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">
                        {university.min_toefl}+
                      </span>
                    </div>
                  </div>
                )}
                {university.min_gre && (
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">GRE</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">
                        {university.min_gre}+
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Programs */}
            {university.programs && university.programs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-white">Available Programs</h3>
                <div className="flex flex-wrap gap-2">
                  {university.programs.map((program, index) => (
                    <span
                      key={`${program}-${index}`}
                      className="px-4 py-2 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 text-blue-300 rounded-lg font-medium border border-blue-700/50"
                    >
                      {program}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Intake Months */}
            {university.intake_months && university.intake_months.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                  <Calendar className="w-5 h-5" />
                  Intake Periods
                </h3>
                <div className="flex flex-wrap gap-2">
                  {university.intake_months.map((month, index) => (
                    <span
                      key={`${month}-${index}`}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-900/30 to-teal-900/30 text-emerald-300 rounded-lg font-medium border border-emerald-700/50"
                    >
                      {month}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Application Deadline */}
            {university.application_deadline && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                  <Clock className="w-5 h-5" />
                  Application Deadline
                </h3>
                <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-xl p-4 border border-amber-700/50">
                  <div className="text-2xl font-bold text-white">
                    {new Date(university.application_deadline).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {Math.ceil((new Date(university.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4 flex justify-between items-center bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-400">Official Website:</span>
            {university.website_url && (
              <a 
                href={university.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline font-medium"
              >
                {university.website_url.replace('https://', '')}
              </a>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300">
              Close
            </Button>
            {university.website_url && (
              <a href={university.website_url} target="_blank" rel="noopener noreferrer">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90">
                  Visit Website
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};