import { GraduationCap } from 'lucide-react';

interface UniversityLogoProps {
  logoUrl: string | null;
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const UniversityLogo = ({ logoUrl, name, className = '', size = 'md' }: UniversityLogoProps) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = 'none';
    const parent = e.currentTarget.parentElement;
    if (parent) {
      const fallback = parent.querySelector('.university-fallback');
      if (fallback) {
        (fallback as HTMLElement).style.display = 'flex';
      }
    }
  };

  return (
    <div className={`relative ${sizeClasses[size]} rounded-lg bg-white/50 border border-border overflow-hidden flex items-center justify-center flex-shrink-0 ${className}`}>
      {logoUrl ? (
        <>
          <img
            src={logoUrl}
            alt={`${name} logo`}
            className="w-full h-full object-contain p-2"
            onError={handleImageError}
            loading="lazy"
          />
          <div 
            className="university-fallback hidden absolute inset-0 items-center justify-center bg-secondary"
            style={{ display: 'none' }}
          >
            <GraduationCap className={`${size === 'lg' ? 'w-10 h-10' : 'w-8 h-8'} text-primary`} />
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary">
          <GraduationCap className={`${size === 'lg' ? 'w-10 h-10' : 'w-8 h-8'} text-primary`} />
        </div>
      )}
    </div>
  );
};