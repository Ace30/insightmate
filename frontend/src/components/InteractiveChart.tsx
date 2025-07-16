import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Scatter, Doughnut } from 'react-chartjs-2';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface InteractiveChartProps {
  data: any[];
  selectedColumns: string[];
  chartType: string;
  title?: string;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  selectedColumns,
  chartType,
  title = 'Data Visualization'
}) => {
  const [drillDownMode, setDrillDownMode] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [lineChartMode, setLineChartMode] = useState<'overview' | 'country'>('overview');
  const [countrySearchTerm, setCountrySearchTerm] = useState<string>('');
  const [selectedCountryForLine, setSelectedCountryForLine] = useState<string>('');

  const isNumericColumn = (column: string) => {
    const sampleValues = data.slice(0, 100).map(row => row[column]).filter(val => val !== null && val !== undefined);
    return sampleValues.length > 0 && sampleValues.every(val => !isNaN(Number(val)));
  };

  const getColumnTypes = () => {
    return selectedColumns.map(col => ({
      name: col,
      type: isNumericColumn(col) ? 'numeric' : 'categorical'
    }));
  };

  const columnTypes = getColumnTypes();
  const numericColumns = columnTypes.filter(col => col.type === 'numeric');
  const categoricalColumns = columnTypes.filter(col => col.type === 'categorical');

  const generateChartData = () => {
    switch (chartType) {
      case 'bar':
        return generateBarChartData();
      case 'line':
        return generateLineChartData();
      case 'scatter':
        return generateScatterChartData();
      case 'pie':
        return generatePieChartData();
      case 'histogram':
        return generateHistogramData();
      default:
        return generateBarChartData();
    }
  };

  const generateBarChartData = () => {
    if (selectedColumns.length === 0) return null;

    // If in drill-down mode, show year-by-year data for selected country
    if (drillDownMode && selectedCountry) {
      return generateDrillDownBarData();
    }

    const xColumn = categoricalColumns.length > 0 ? categoricalColumns[0].name : selectedColumns[0];
    const yColumn = numericColumns.length > 0 ? numericColumns[0].name : selectedColumns[1] || selectedColumns[0];
    // Look for year column - either contains 'year' or is a 4-digit year
    const yearColumn = selectedColumns.find(col => {
      if (!isNumericColumn(col)) return false;
      const colLower = col.toLowerCase();
      return colLower.includes('year') || /^\d{4}$/.test(col);
    });

    // Check if we have year columns (columns that are 4-digit years)
    const yearColumns = selectedColumns.filter(col => /^\d{4}$/.test(col));
    
    if (yearColumns.length > 0) {
      // Data structure: Country | 2000 | 2001 | 2002 | ...
      // We need to restructure this to show all years for each country
      const countryColumn = categoricalColumns.length > 0 ? categoricalColumns[0].name : selectedColumns[0];
      
      // Create data points for each country-year combination
      const chartData: Array<{country: string, year: string, value: number}> = [];
      
      data.forEach(row => {
        const country = String(row[countryColumn] || 'Unknown');
        yearColumns.forEach(yearCol => {
          const value = Number(row[yearCol]) || 0;
          if (value > 0) { // Only include valid data points
            chartData.push({
              country,
              year: yearCol,
              value
            });
          }
        });
      });
      
      // Sort by year, then by country
      chartData.sort((a, b) => {
        const yearA = Number(a.year);
        const yearB = Number(b.year);
        if (yearA !== yearB) return yearA - yearB;
        return a.country.localeCompare(b.country);
      });
      
      // Create labels showing "Country (Year)" format
      const labels = chartData.map(item => `${item.country} (${item.year})`);
      const values = chartData.map(item => item.value);
      
      // Group data for tooltips
      const groupedData = chartData.reduce((acc, item) => {
        if (!acc[item.country]) {
          acc[item.country] = { values: [], years: [], total: 0, count: 0 };
        }
        acc[item.country].values.push(item.value);
        acc[item.country].years.push(item.year);
        acc[item.country].total += item.value;
        acc[item.country].count += 1;
        return acc;
      }, {} as Record<string, { values: number[]; years: string[]; total: number; count: number }>);

      return {
        labels,
        datasets: [
          {
            label: 'Life Expectancy',
            data: values,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            // Store additional data for tooltips and interactions
            countryData: chartData.map(item => {
              const countryStats = groupedData[item.country];
              return {
                country: item.country,
                year: item.year,
                value: item.value,
                average: countryStats ? countryStats.total / countryStats.count : item.value,
                total: countryStats ? countryStats.total : item.value,
                count: countryStats ? countryStats.count : 1,
                min: countryStats ? Math.min(...countryStats.values) : item.value,
                max: countryStats ? Math.max(...countryStats.values) : item.value,
                allYears: countryStats ? countryStats.years.join(', ') : item.year
              };
            })
          },
        ],
      };
    } else if (yearColumn) {
      // Original logic for when we have a separate year column
      // Sort data by year first, then by country
      const sortedData = data.sort((a, b) => {
        const yearA = Number(a[yearColumn]) || 0;
        const yearB = Number(b[yearColumn]) || 0;
        if (yearA !== yearB) return yearA - yearB;
        
        const countryA = String(a[xColumn] || '');
        const countryB = String(b[xColumn] || '');
        return countryA.localeCompare(countryB);
      });

      // Create labels showing "Country (Year)" format
      const labels = sortedData.map(row => {
        const country = String(row[xColumn] || 'Unknown');
        const year = String(row[yearColumn] || '');
        return `${country} (${year})`;
      });

      const values = sortedData.map(row => Number(row[yColumn]) || 0);

      // Group data for tooltips
      const groupedData = data.reduce((acc, row) => {
        const country = String(row[xColumn] || 'Unknown');
        const year = String(row[yearColumn] || '');
        const value = Number(row[yColumn]) || 0;
        
        if (!acc[country]) {
          acc[country] = { values: [], years: [], total: 0, count: 0 };
        }
        acc[country].values.push(value);
        acc[country].years.push(year);
        acc[country].total += value;
        acc[country].count += 1;
        return acc;
      }, {} as Record<string, { values: number[]; years: string[]; total: number; count: number }>);

      return {
        labels,
        datasets: [
          {
            label: yColumn,
            data: values,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            // Store additional data for tooltips and interactions
            countryData: labels.map((label, index) => {
              const country = String(sortedData[index][xColumn] || 'Unknown');
              const year = String(sortedData[index][yearColumn] || '');
              const value = Number(sortedData[index][yColumn]) || 0;
              const countryStats = groupedData[country];
              
              return {
                country,
                year,
                value,
                average: countryStats ? countryStats.total / countryStats.count : value,
                total: countryStats ? countryStats.total : value,
                count: countryStats ? countryStats.count : 1,
                min: countryStats ? Math.min(...countryStats.values) : value,
                max: countryStats ? Math.max(...countryStats.values) : value,
                allYears: countryStats ? countryStats.years.join(', ') : year
              };
            })
          },
        ],
      };
    } else {
      // Fallback to original average calculation if no year column
      const groupedData = data.reduce((acc, row) => {
        const xValue = String(row[xColumn] || 'Unknown');
        const yValue = Number(row[yColumn]) || 0;
        
        if (!acc[xValue]) {
          acc[xValue] = { sum: 0, count: 0, values: [] };
        }
        acc[xValue].sum += yValue;
        acc[xValue].count += 1;
        acc[xValue].values.push(yValue);
        return acc;
      }, {} as Record<string, { sum: number; count: number; values: number[] }>);

      const labels = Object.keys(groupedData).slice(0, 20); // Limit to 20 categories
      const values = labels.map(label => groupedData[label].sum / groupedData[label].count); // Average values

      return {
        labels,
        datasets: [
          {
            label: `Average ${yColumn}`,
            data: values,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            // Store additional data for tooltips and interactions
            countryData: labels.map(label => ({
              country: label,
              average: groupedData[label].sum / groupedData[label].count,
              total: groupedData[label].sum,
              count: groupedData[label].count,
              min: Math.min(...groupedData[label].values),
              max: Math.max(...groupedData[label].values)
            }))
          },
        ],
      };
    }
  };

  const generateDrillDownBarData = () => {
    if (!selectedCountry) return null;

    // Check if we have year columns (columns that are 4-digit years)
    const yearColumns = selectedColumns.filter(col => /^\d{4}$/.test(col));
    
    if (yearColumns.length > 0) {
      // Data structure: Country | 2000 | 2001 | 2002 | ...
      const countryColumn = categoricalColumns.length > 0 ? categoricalColumns[0].name : selectedColumns[0];
      
      // Find the row for the selected country
      const countryRow = data.find(row => String(row[countryColumn]) === selectedCountry);
      
      if (!countryRow) return null;
      
      // Get values for each year
      const yearData = yearColumns
        .map(yearCol => ({
          year: yearCol,
          value: Number(countryRow[yearCol]) || 0
        }))
        .filter(item => item.value > 0) // Only include valid data points
        .sort((a, b) => Number(a.year) - Number(b.year));

      const labels = yearData.map(item => item.year);
      const values = yearData.map(item => item.value);

      return {
        labels,
        datasets: [
          {
            label: `Life Expectancy for ${selectedCountry}`,
            data: values,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 2,
          },
        ],
      };
    } else {
      // Original logic for when we have a separate year column
      const yearColumn = selectedColumns.find(col => {
        if (!isNumericColumn(col)) return false;
        const colLower = col.toLowerCase();
        return colLower.includes('year') || /^\d{4}$/.test(col);
      }) || selectedColumns[0];
      const valueColumn = numericColumns.length > 0 ? numericColumns[0].name : selectedColumns[1] || selectedColumns[0];
      const countryColumn = categoricalColumns.length > 0 ? categoricalColumns[0].name : selectedColumns[0];

      // Filter data for selected country
      const countryData = data.filter(row => String(row[countryColumn]) === selectedCountry);
      
      // Sort by year
      const sortedData = countryData.sort((a, b) => Number(a[yearColumn]) - Number(b[yearColumn]));

      const labels = sortedData.map(row => String(row[yearColumn] || ''));
      const values = sortedData.map(row => Number(row[valueColumn]) || 0);

      return {
        labels,
        datasets: [
          {
            label: `${valueColumn} for ${selectedCountry}`,
            data: values,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 2,
          },
        ],
      };
    }
  };

  const generateLineChartData = () => {
    if (numericColumns.length === 0) return null;

    // Check if we have year columns (columns that are 4-digit years)
    const yearColumns = selectedColumns.filter(col => /^\d{4}$/.test(col));
    
    if (yearColumns.length > 0) {
      // Data structure: Country | 2000 | 2001 | 2002 | ...
      const countryColumn = categoricalColumns.length > 0 ? categoricalColumns[0].name : selectedColumns[0];
      
      // Sort year columns chronologically
      const sortedYearColumns = yearColumns.sort((a, b) => Number(a) - Number(b));
      
      if (lineChartMode === 'country' && selectedCountryForLine) {
        // Single country view
        const countryData = data.find(row => String(row[countryColumn]) === selectedCountryForLine);
        if (!countryData) return null;
        
        const values = sortedYearColumns.map(yearCol => Number(countryData[yearCol]) || 0);
        
        return {
          labels: sortedYearColumns,
          datasets: [
            {
              label: `Life Expectancy - ${selectedCountryForLine}`,
              data: values,
              borderColor: 'rgba(59, 130, 246, 1)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true,
              pointRadius: 6,
              pointHoverRadius: 8,
              borderWidth: 3,
            },
          ],
        };
      } else {
        // Overview mode - show all countries
        const allCountries = Array.from(new Set(data.map(row => String(row[countryColumn] || 'Unknown'))));
        
        // Create datasets for each country (limit to first 15 countries for readability)
        const countries = allCountries.slice(0, 15);
        
        const datasets = countries.map((country, index) => {
          const countryData = data.find(row => String(row[countryColumn]) === country);
          if (!countryData) return null;
          
          const values = sortedYearColumns.map(yearCol => Number(countryData[yearCol]) || 0);
          
          // Generate a color for each country
          const colors = [
            'rgba(59, 130, 246, 1)',   // Blue
            'rgba(16, 185, 129, 1)',   // Green
            'rgba(239, 68, 68, 1)',    // Red
            'rgba(245, 158, 11, 1)',   // Yellow
            'rgba(139, 92, 246, 1)',   // Purple
            'rgba(236, 72, 153, 1)',   // Pink
            'rgba(34, 197, 94, 1)',    // Emerald
            'rgba(168, 85, 247, 1)',   // Violet
            'rgba(251, 146, 60, 1)',   // Orange
            'rgba(6, 182, 212, 1)',    // Cyan
            'rgba(75, 85, 99, 1)',     // Gray
            'rgba(168, 85, 247, 1)',   // Violet
            'rgba(236, 72, 153, 1)',   // Pink
            'rgba(34, 197, 94, 1)',    // Emerald
            'rgba(6, 182, 212, 1)'     // Cyan
          ];
          
          return {
            label: country,
            data: values,
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length].replace('1)', '0.1)'),
            tension: 0.4,
            fill: false,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2,
          };
        }).filter(Boolean);

        return {
          labels: sortedYearColumns,
          datasets,
        };
      }
    } else {
      // Original logic for when we have a separate year column
      const xColumn = selectedColumns[0];
      const yColumn = numericColumns[0].name;

      // Sort data by x-axis if numeric
      const sortedData = isNumericColumn(xColumn) 
        ? data.sort((a, b) => Number(a[xColumn]) - Number(b[xColumn]))
        : data;

      const labels = sortedData.map(row => String(row[xColumn] || '')).slice(0, 50);
      const values = sortedData.map(row => Number(row[yColumn]) || 0).slice(0, 50);

      return {
        labels,
        datasets: [
          {
            label: yColumn,
            data: values,
            borderColor: 'rgba(16, 185, 129, 1)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      };
    }
  };

  const generateScatterChartData = () => {
    // Check if we have year columns (columns that are 4-digit years)
    const yearColumns = selectedColumns.filter(col => /^\d{4}$/.test(col));
    
    // For scatter plot, we need either 2+ numeric columns OR 2+ year columns
    if (numericColumns.length < 2 && yearColumns.length < 2) return null;
    
    if (yearColumns.length > 0) {
      // Data structure: Country | 2000 | 2001 | 2002 | ...
      // Create scatter plot comparing two different years
      const countryColumn = categoricalColumns.length > 0 ? categoricalColumns[0].name : selectedColumns[0];
      
      // Use the first two year columns for comparison
      const [year1, year2] = yearColumns.sort((a, b) => Number(a) - Number(b)).slice(0, 2);
      
      if (!year1 || !year2) return null;
      
      const points = data
        .filter(row => {
          const val1 = Number(row[year1]) || 0;
          const val2 = Number(row[year2]) || 0;
          return val1 > 0 && val2 > 0; // Only include valid data points
        })
        .map(row => ({
          x: Number(row[year1]),
          y: Number(row[year2]),
          country: String(row[countryColumn] || 'Unknown')
        }))
        .slice(0, 100); // Limit to 100 points for performance

      return {
        datasets: [
          {
            label: `${year1} vs ${year2}`,
            data: points,
            backgroundColor: 'rgba(239, 68, 68, 0.6)',
            borderColor: 'rgba(239, 68, 68, 1)',
            pointRadius: 4,
            // Store country data for tooltips
            pointData: points.map(point => ({
              country: point.country,
              year1: year1,
              year2: year2,
              value1: point.x,
              value2: point.y,
              change: point.y - point.x,
              changePercent: ((point.y - point.x) / point.x * 100).toFixed(1)
            }))
          },
        ],
      };
    } else {
      // Original logic for when we have separate x and y columns
      const xColumn = numericColumns[0].name;
      const yColumn = numericColumns[1].name;

      const points = data
        .filter(row => row[xColumn] !== null && row[xColumn] !== undefined && 
                       row[yColumn] !== null && row[yColumn] !== undefined)
        .map(row => ({
          x: Number(row[xColumn]),
          y: Number(row[yColumn])
        }))
        .slice(0, 100); // Limit to 100 points for performance

      return {
        datasets: [
          {
            label: `${xColumn} vs ${yColumn}`,
            data: points,
            backgroundColor: 'rgba(239, 68, 68, 0.6)',
            borderColor: 'rgba(239, 68, 68, 1)',
            pointRadius: 4,
          },
        ],
      };
    }
  };

  const generatePieChartData = () => {
    if (selectedColumns.length === 0) return null;

    const column = selectedColumns[0];
    const isNumeric = isNumericColumn(column);

    if (isNumeric) {
      // For numeric data, create ranges
      const values = data.map(row => Number(row[column]) || 0).filter(val => val > 0);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      const bucketSize = range / 5;

      const buckets: Record<string, number> = {};
      values.forEach(value => {
        const bucket = Math.floor((value - min) / bucketSize);
        const bucketLabel = `${(min + bucket * bucketSize).toFixed(1)}-${(min + (bucket + 1) * bucketSize).toFixed(1)}`;
        buckets[bucketLabel] = (buckets[bucketLabel] || 0) + 1;
      });

      return {
        labels: Object.keys(buckets),
        datasets: [
          {
            data: Object.values(buckets),
            backgroundColor: [
              'rgba(239, 68, 68, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(139, 92, 246, 0.8)',
            ],
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      };
    } else {
      // For categorical data, count occurrences
      const counts: Record<string, number> = {};
      data.forEach(row => {
        const value = String(row[column] || 'Unknown');
        counts[value] = (counts[value] || 0) + 1;
      });

      const sortedEntries = Object.entries(counts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8); // Limit to top 8 categories

      return {
        labels: sortedEntries.map(([label]) => label),
        datasets: [
          {
            data: sortedEntries.map(([,count]) => count),
            backgroundColor: [
              'rgba(239, 68, 68, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(236, 72, 153, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(168, 85, 247, 0.8)',
            ],
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      };
    }
  };

  const generateHistogramData = () => {
    if (numericColumns.length === 0) return null;

    const column = numericColumns[0].name;
    const values = data.map(row => Number(row[column]) || 0).filter(val => val !== 0);

    if (values.length === 0) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const bucketCount = Math.min(10, Math.ceil(Math.sqrt(values.length)));
    const bucketSize = range / bucketCount;

    const buckets: Record<string, number> = {};
    for (let i = 0; i < bucketCount; i++) {
      const bucketStart = min + i * bucketSize;
      const bucketEnd = min + (i + 1) * bucketSize;
      const bucketLabel = `${bucketStart.toFixed(1)}-${bucketEnd.toFixed(1)}`;
      buckets[bucketLabel] = 0;
    }

    values.forEach(value => {
      const bucketIndex = Math.min(Math.floor((value - min) / bucketSize), bucketCount - 1);
      const bucketStart = min + bucketIndex * bucketSize;
      const bucketEnd = min + (bucketIndex + 1) * bucketSize;
      const bucketLabel = `${bucketStart.toFixed(1)}-${bucketEnd.toFixed(1)}`;
      buckets[bucketLabel]++;
    });

    return {
      labels: Object.keys(buckets),
      datasets: [
        {
          label: `Distribution of ${column}`,
          data: Object.values(buckets),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
        },
      ],
    };
  };

  const chartData = generateChartData();
  if (!chartData) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
          <p className="text-gray-500">Unable to generate chart with selected data</p>
        </div>
      </div>
    );
  }

  const handleBarClick = (event: any, elements: any[]) => {
    if (chartType === 'bar' && !drillDownMode && elements.length > 0) {
      const index = elements[0].index;
      const chartDataTyped = chartData as any;
      const label = chartDataTyped.labels[index];
      
      // Extract country name from label (format: "Country (Year)" or just "Country")
      let country = label;
      if (label.includes(' (')) {
        country = label.split(' (')[0];
      }
      
      setSelectedCountry(country);
      setDrillDownMode(true);
    }
  };

  const handleBackToOverview = () => {
    setDrillDownMode(false);
    setSelectedCountry('');
  };

  const handleCountrySelect = (country: string) => {
    setSelectedCountryForLine(country);
    setLineChartMode('country');
    setCountrySearchTerm('');
  };

  const handleBackToOverviewLine = () => {
    setLineChartMode('overview');
    setSelectedCountryForLine('');
    setCountrySearchTerm('');
  };

  // Get all available countries for search
  const getAllCountries = () => {
    if (chartType !== 'line') return [];
    const yearColumns = selectedColumns.filter(col => /^\d{4}$/.test(col));
    if (yearColumns.length === 0) return [];
    
    const countryColumn = categoricalColumns.length > 0 ? categoricalColumns[0].name : selectedColumns[0];
    return Array.from(new Set(data.map(row => String(row[countryColumn] || 'Unknown')))).sort();
  };

  const filteredCountries = getAllCountries().filter(country =>
    country.toLowerCase().includes(countrySearchTerm.toLowerCase())
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: drillDownMode ? `${title} - ${selectedCountry}` : title,
      },
              tooltip: {
          callbacks: {
            label: function(context: any) {
              if (chartType === 'bar' && !drillDownMode && context.dataset.countryData) {
                const countryInfo = context.dataset.countryData[context.dataIndex];
                if (countryInfo.year) {
                  // Show detailed info for year-specific data
                  return [
                    `Country: ${countryInfo.country}`,
                    `Year: ${countryInfo.year}`,
                    `Value: ${countryInfo.value.toFixed(2)}`,
                    `Average (all years): ${countryInfo.average.toFixed(2)}`,
                    `Years available: ${countryInfo.allYears}`,
                    `Range (all years): ${countryInfo.min.toFixed(2)} - ${countryInfo.max.toFixed(2)}`
                  ];
                } else {
                  // Show info for averaged data
                  return [
                    `Country: ${countryInfo.country}`,
                    `Average: ${countryInfo.average.toFixed(2)}`,
                    `Total: ${countryInfo.total.toFixed(2)}`,
                    `Data Points: ${countryInfo.count}`,
                    `Range: ${countryInfo.min.toFixed(2)} - ${countryInfo.max.toFixed(2)}`
                  ];
                }
              } else if (chartType === 'scatter' && context.dataset.pointData) {
                const pointInfo = context.dataset.pointData[context.dataIndex];
                return [
                  `Country: ${pointInfo.country}`,
                  `${pointInfo.year1}: ${pointInfo.value1.toFixed(2)}`,
                  `${pointInfo.year2}: ${pointInfo.value2.toFixed(2)}`,
                  `Change: ${pointInfo.change > 0 ? '+' : ''}${pointInfo.change.toFixed(2)}`,
                  `Change %: ${pointInfo.changePercent}%`
                ];
              }
              return context.dataset.label + ': ' + context.parsed.y;
            }
          }
        }
    },
    scales: chartType === 'scatter' ? {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
      },
      y: {
        type: 'linear' as const,
      },
    } : undefined,
    onClick: handleBarClick,
  };

  const renderChart = () => {
    const chartDataTyped = chartData as any;
    switch (chartType) {
      case 'bar':
        return <Bar data={chartDataTyped} options={chartOptions} />;
      case 'line':
        return <Line data={chartDataTyped} options={chartOptions} />;
      case 'scatter':
        return <Scatter data={chartDataTyped} options={chartOptions} />;
      case 'pie':
        return <Doughnut data={chartDataTyped} options={chartOptions} />;
      case 'histogram':
        return <Bar data={chartDataTyped} options={chartOptions} />;
      default:
        return <Bar data={chartDataTyped} options={chartOptions} />;
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {drillDownMode ? `${title} - ${selectedCountry}` : 
           lineChartMode === 'country' ? `${title} - ${selectedCountryForLine}` : title}
        </h3>
        <div className="flex items-center gap-2">
          {drillDownMode && (
            <button
              onClick={handleBackToOverview}
              className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Overview
            </button>
          )}
          {chartType === 'line' && lineChartMode === 'country' && (
            <button
              onClick={handleBackToOverviewLine}
              className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to All Countries
            </button>
          )}
        </div>
      </div>

      {/* Country Search for Line Chart */}
      {chartType === 'line' && lineChartMode === 'overview' && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              placeholder="Search for a country..."
              value={countrySearchTerm}
              onChange={(e) => setCountrySearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => setCountrySearchTerm('')}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
          </div>
          {countrySearchTerm && filteredCountries.length > 0 && (
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md">
              {filteredCountries.slice(0, 10).map((country) => (
                <button
                  key={country}
                  onClick={() => handleCountrySelect(country)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  {country}
                </button>
              ))}
              {filteredCountries.length > 10 && (
                <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50">
                  Showing first 10 results. Type more to narrow down.
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="h-96">
        {renderChart()}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Chart Type: {chartType.charAt(0).toUpperCase() + chartType.slice(1)}</p>
        <p>Data Points: {data.length}</p>
        <p>Selected Columns: {selectedColumns.join(', ')}</p>
        {drillDownMode && (
          <p className="text-blue-600 font-medium">
            Showing detailed view for: {selectedCountry}
          </p>
        )}
        {chartType === 'bar' && !drillDownMode && (
          <p className="text-green-600 font-medium">
            💡 Click on any bar to see detailed year-by-year analysis for that country
          </p>
        )}
        {chartType === 'line' && lineChartMode === 'overview' && (
          <p className="text-green-600 font-medium">
            💡 Use the search box above to select a specific country for detailed view
          </p>
        )}
        {chartType === 'line' && lineChartMode === 'country' && (
          <p className="text-blue-600 font-medium">
            Showing life expectancy trend for: {selectedCountryForLine}
          </p>
        )}
      </div>
    </div>
  );
};

export default InteractiveChart; 