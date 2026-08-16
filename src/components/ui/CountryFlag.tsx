import React from 'react';

interface CountryFlagProps {
  iso2: string;
  name?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ 
  iso2, 
  name = "Country", 
  className = "", 
  width = 24, 
  height = 18 
}) => {
  if (!iso2) return null;

  return (
    <img
      src={`/flags/${iso2.toLowerCase()}.svg`}
      alt={`${name} flag`}
      width={width}
      height={height}
      className={`inline-block rounded shadow-sm ${className}`}
      onError={(e) => {
        // Fallback if the flag SVG doesn't exist
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
};
