import React from 'react';
import { useData } from '../contexts/DataContext';
import NaturalLanguageInsights from '../components/NaturalLanguageInsights';

const NaturalLanguageInsightsPage: React.FC = () => {
  const { state, generateNLGInsights } = useData();
  const { currentFile, nlgInsights, isLoading } = state;

  const handleGenerateInsights = async (userQuery: string) => {
    if (!currentFile) return;
    
    try {
      await generateNLGInsights(currentFile.filename, userQuery);
    } catch (error) {
      console.error('Error generating insights:', error);
    }
  };

  return (
    <NaturalLanguageInsights
      currentFile={currentFile}
      onGenerateInsights={handleGenerateInsights}
      nlgInsights={nlgInsights || undefined}
      isLoading={isLoading}
    />
  );
};

export default NaturalLanguageInsightsPage; 