import React, { useState, useEffect } from 'react';
import { Search, X, GraduationCap, Palette, Upload } from 'lucide-react';
import { Button } from './ui/button';

interface School {
  "School Name": string;
  "Logo": string;
  "Conference": string | null;
  "Colors": Array<{
    name: string;
    hex: string;
  }>;
}

interface SchoolSelectorProps {
  schools: School[];
  selectedSchool: School | null;
  onSchoolSelect: (school: School | null) => void;
  onApplyColors: (school: School) => void;
  onApplyLogo: (school: School) => void;
  isDarkMode?: boolean;
}

export const SchoolSelector: React.FC<SchoolSelectorProps> = ({
  schools,
  selectedSchool,
  onSchoolSelect,
  onApplyColors,
  onApplyLogo,
  isDarkMode = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);

  // Filter schools based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSchools([]);
    } else {
      const filtered = schools.filter(school =>
        school["School Name"].toLowerCase().includes(searchTerm.toLowerCase()) ||
        (school.Conference && school.Conference.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 8); // Limit to 8 results for better UX
      setFilteredSchools(filtered);
    }
  }, [searchTerm, schools]);

  const handleSchoolSelect = (school: School) => {
    onSchoolSelect(school);
    setSearchTerm('');
    setFilteredSchools([]);
  };

  const clearSelection = () => {
    onSchoolSelect(null);
    setSearchTerm('');
  };

  const handleApplyColors = (school: School) => {
    onApplyColors(school);
  };

  const handleApplyLogo = (school: School) => {
    onApplyLogo(school);
  };

  return (
    <div className="h-[80px] flex flex-col">
      {/* Ultra Compact Header with Search */}
      <div className="flex items-center gap-2 mb-2">
        {/* Left: Label */}
        <div className="flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <GraduationCap className={`w-3 h-3 hidden md:block transition-all duration-300 ${
              isDarkMode ? 'text-white/80' : 'text-muted-foreground'
            }`} />
            <h3 className={`text-xs font-medium transition-all duration-300 hidden md:block ${
              isDarkMode ? 'text-white/90' : 'text-foreground'
            }`}>
              Search Schools
            </h3>
          </div>
        </div>
        
        {/* Right: Search Bar and Results/Selected Container */}
        <div className="flex-1 flex items-center gap-2">
          {/* Search Bar - shrinks when results appear or school is selected */}
          <div className={`relative transition-all duration-300 ${
            (filteredSchools.length > 0 && !selectedSchool) || selectedSchool ? 'hidden md:w-56' : 'flex-1'
          }`}>
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-all duration-300 ${
              isDarkMode ? 'text-white/60' : 'text-muted-foreground'
            }`} />
            <input
              type="text"
              placeholder="Search schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-black/30 border-white/30 text-white placeholder-white/60' 
                  : 'bg-white border-border text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
          
          {/* Selected School - Inline on Desktop */}
          {selectedSchool && (
            <div className="hidden md:flex items-center gap-2 flex-1">
              <span className={`text-xs font-medium transition-all duration-300 ${
                isDarkMode ? 'text-white/70' : 'text-muted-foreground'
              }`}>
                Selected:
              </span>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300 ${
                isDarkMode ? 'bg-black/30 border-white/20' : 'bg-secondary/30 border-border/50'
              }`}>
                <img
                  src={selectedSchool.Logo}
                  alt={`${selectedSchool["School Name"]} logo`}
                  className="w-5 h-5 object-contain rounded flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="min-w-0">
                  <p className={`font-medium text-xs transition-all duration-300 truncate ${
                    isDarkMode ? 'text-white/90' : 'text-foreground'
                  }`}>{selectedSchool["School Name"]}</p>
                </div>
                
                {/* School Colors Preview */}
                {selectedSchool.Colors.length > 0 && (
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    {selectedSchool.Colors.slice(0, 3).map((color, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: color.hex }}
                        title={`${color.name}: ${color.hex}`}
                      />
                    ))}
                    {selectedSchool.Colors.length > 3 && (
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8px] font-medium ${
                        isDarkMode ? 'bg-white/20 border-white/30 text-white/80' : 'bg-secondary border-border text-muted-foreground'
                      }`}>
                        +{selectedSchool.Colors.length - 3}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApplyColors(selectedSchool)}
                    className={`h-6 px-2 flex items-center gap-1 transition-all duration-300 ${
                      isDarkMode 
                        ? 'hover:bg-white/10 text-white/80 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Palette className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApplyLogo(selectedSchool)}
                    className={`h-6 px-2 flex items-center gap-1 transition-all duration-300 ${
                      isDarkMode 
                        ? 'hover:bg-white/10 text-white/80 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className={`h-6 w-6 p-0 transition-all duration-300 ${
                      isDarkMode 
                        ? 'hover:bg-white/10 text-white/80 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Inline Results - Desktop Only (only show when no school is selected) */}
          {filteredSchools.length > 0 && !selectedSchool && (
            <div className="flex items-center gap-2 flex-1 overflow-x-auto">
              {filteredSchools.slice(0, 4).map((school, index) => (
                <button
                  key={index}
                  onClick={() => handleSchoolSelect(school)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all duration-300 hover:scale-105 flex-shrink-0 ${
                    isDarkMode 
                      ? 'bg-black/40 border-white/30 hover:bg-white/10 text-white/90' 
                      : 'bg-white border-border hover:bg-secondary/50 text-foreground'
                  }`}
                >
                  <img
                    src={school.Logo}
                    alt={`${school["School Name"]} logo`}
                    className="w-4 h-4 object-contain rounded flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  
                  <div className="text-left min-w-0">
                    <p className="text-xs font-medium truncate max-w-20">
                      {school["School Name"]}
                    </p>
                  </div>
                  
                  {/* School Colors Preview */}
                  {school.Colors.length > 0 && (
                    <div className="flex gap-0.5 flex-shrink-0">
                      {school.Colors.slice(0, 2).map((color, colorIndex) => (
                        <div
                          key={colorIndex}
                          className="w-2 h-2 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  )}
                </button>
              ))}
              {filteredSchools.length > 4 && (
                <span className={`text-xs px-2 py-1 rounded transition-all duration-300 ${
                  isDarkMode ? 'text-white/60 bg-black/20' : 'text-muted-foreground bg-secondary/50'
                }`}>
                  +{filteredSchools.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Selected School Badge */}
      {selectedSchool && (
        <div className={`md:hidden p-3 rounded-lg border transition-all duration-300 ${
          isDarkMode ? 'bg-black/30 border-white/20' : 'bg-secondary/30 border-border/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={selectedSchool.Logo}
                alt={`${selectedSchool["School Name"]} logo`}
                className="w-8 h-8 object-contain rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div>
                <p className={`font-medium text-xs transition-all duration-300 ${
                  isDarkMode ? 'text-white/90' : 'text-foreground text-xs'
                }`}>{selectedSchool["School Name"]}</p>
                {selectedSchool.Conference && (
                  <p className={`text-xs transition-all duration-300 ${
                    isDarkMode ? 'text-white/60' : 'text-muted-foreground'
                  }`}></p>
                )}
              </div>
              
              {/* School Colors Preview */}
              {selectedSchool.Colors.length > 0 && (
                <div className="flex gap-1 ml-2">
                  {selectedSchool.Colors.slice(0, 3).map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: color.hex }}
                      title={`${color.name}: ${color.hex}`}
                    />
                  ))}
                  {selectedSchool.Colors.length > 3 && (
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8px] font-medium ${
                      isDarkMode ? 'bg-white/20 border-white/30 text-white/80' : 'bg-secondary border-border text-muted-foreground'
                    }`}>
                      +{selectedSchool.Colors.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleApplyColors(selectedSchool)}
                className={`h-8 px-3 flex items-center gap-1 transition-all duration-300 ${
                  isDarkMode 
                    ? 'border-white/30 text-white/80 hover:bg-white/10 hover:text-white' 
                    : 'border-border text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Palette className="w-3 h-3" />
                Colors
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleApplyLogo(selectedSchool)}
                className={`h-8 px-3 flex items-center gap-1 transition-all duration-300 ${
                  isDarkMode 
                    ? 'border-white/30 text-white/80 hover:bg-white/10 hover:text-white' 
                    : 'border-border text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Upload className="w-3 h-3" />
                Logo
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className={`h-8 w-8 p-0 transition-all duration-300 ${
                  isDarkMode 
                    ? 'hover:bg-white/10 text-white/80 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search Results - Mobile Only (Desktop shows inline) */}
      {filteredSchools.length > 0 && (
        <div className="hidden space-y-2">
          <p className={`text-sm font-medium transition-all duration-300 ${
            isDarkMode ? 'text-white/90' : 'text-foreground'
          }`}>
            Found {filteredSchools.length} school{filteredSchools.length !== 1 ? 's' : ''}:
          </p>
          
          <div className="flex flex-wrap gap-2">
            {filteredSchools.map((school, index) => (
              <button
                key={index}
                onClick={() => handleSchoolSelect(school)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all duration-300 hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-black/40 border-white/30 hover:bg-white/10 text-white/90' 
                    : 'bg-white border-border hover:bg-secondary/50 text-foreground'
                }`}
              >
                <img
                  src={school.Logo}
                  alt={`${school["School Name"]} logo`}
                  className="w-4 h-4 object-contain rounded flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                
                <div className="text-left min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">
                    {school["School Name"]}
                  </p>
                </div>
                
                {/* School Colors Preview */}
                {school.Colors.length > 0 && (
                  <div className="flex gap-1 flex-shrink-0">
                    {school.Colors.slice(0, 2).map((color, colorIndex) => (
                      <div
                        key={colorIndex}
                        className="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                    {school.Colors.length > 2 && (
                      <div className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center text-[6px] font-medium ${
                        isDarkMode ? 'bg-white/20 border-white/30 text-white/80' : 'bg-secondary border-border text-muted-foreground'
                      }`}>
                        +{school.Colors.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {searchTerm.trim() && filteredSchools.length === 0 && (
        <div className={`text-center py-4 transition-all duration-300 ${
          isDarkMode ? 'text-white/60' : 'text-muted-foreground'
        }`}>
          <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No schools found matching "{searchTerm}"</p>
          <p className="text-xs mt-1">Try searching by school name or conference</p>
        </div>
      )}
    </div>
  );
};