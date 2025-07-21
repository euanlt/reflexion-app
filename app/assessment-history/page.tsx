"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Minus, Menu } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ASSESSMENT_HISTORY = [
  { date: '2024-01-15', score: 45, risk: 'Medium', trend: 'down' },
  { date: '2024-01-14', score: 52, risk: 'Medium', trend: 'up' },
  { date: '2024-01-13', score: 48, risk: 'Medium', trend: 'down' },
  { date: '2024-01-12', score: 55, risk: 'Medium', trend: 'up' },
  { date: '2024-01-11', score: 50, risk: 'Medium', trend: 'stable' },
  { date: '2024-01-10', score: 47, risk: 'Medium', trend: 'down' },
  { date: '2024-01-09', score: 53, risk: 'Medium', trend: 'up' },
];

const CHART_DATA = ASSESSMENT_HISTORY.map(item => ({
  date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  score: item.score
})).reverse();

export default function AssessmentHistoryPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRiskBadge = (risk: string) => {
    const colors = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-red-100 text-red-800'
    };
    return colors[risk as keyof typeof colors] || colors.Medium;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
        <Link href="/">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Assessment History</h1>
        <Menu className="w-6 h-6 text-gray-700" />
      </div>

      <div className="px-6 py-8">
        {/* Chart Section */}
        <div className={`mb-8 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Card className="p-6 rounded-3xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-6 h-6 text-blue-600 mr-3" />
              7-Day Trend
            </h3>
            
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}`, 'Risk Score']} />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#D97706" 
                    strokeWidth={3}
                    dot={{ r: 6, fill: '#D97706' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* History List */}
        <div className={`space-y-4 transform transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-6 h-6 text-blue-600 mr-3" />
            Recent Assessments
          </h3>
          
          {ASSESSMENT_HISTORY.map((assessment, index) => (
            <Card 
              key={assessment.date}
              className={`p-4 rounded-2xl border border-gray-200 transform transition-all duration-500 delay-${index * 100}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{assessment.score}</p>
                    <p className="text-xs text-gray-600">Score</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(assessment.date).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getRiskBadge(assessment.risk)}>
                        {assessment.risk} Risk
                      </Badge>
                      {getTrendIcon(assessment.trend)}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600">
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Summary Stats */}
        <div className={`mt-8 grid grid-cols-2 gap-4 transform transition-all duration-1000 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Card className="p-4 rounded-2xl border border-gray-200 text-center">
            <p className="text-2xl font-bold text-yellow-600">50</p>
            <p className="text-sm text-gray-600">Average Score</p>
          </Card>
          <Card className="p-4 rounded-2xl border border-gray-200 text-center">
            <p className="text-2xl font-bold text-blue-600">7</p>
            <p className="text-sm text-gray-600">Days Tracked</p>
          </Card>
        </div>

        {/* Action Button */}
        <div className={`mt-8 transform transition-all duration-1000 delay-600 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Link href="/daily-checkin">
            <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-4 px-6 rounded-2xl text-lg">
              Take Today's Assessment
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}