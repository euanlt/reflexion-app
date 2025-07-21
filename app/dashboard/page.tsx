"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Brain, Calendar, TrendingUp, Award, Heart, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Mock data for demonstration
const MOCK_DATA = {
  streak: 7,
  totalSessions: 23,
  averageScore: 85,
  weeklyProgress: [
    { day: 'Mon', score: 82, mood: 4 },
    { day: 'Tue', score: 88, mood: 4 },
    { day: 'Wed', score: 79, mood: 3 },
    { day: 'Thu', score: 91, mood: 5 },
    { day: 'Fri', score: 85, mood: 4 },
    { day: 'Sat', score: 87, mood: 4 },
    { day: 'Sun', score: 89, mood: 5 },
  ],
  taskPerformance: [
    { task: 'Memory', score: 88, improvement: '+5%' },
    { task: 'Speech', score: 82, improvement: '+3%' },
    { task: 'Emotion', score: 90, improvement: '+8%' },
  ],
  achievements: [
    { title: '7-Day Streak', icon: '🔥', earned: true },
    { title: 'Memory Master', icon: '🧠', earned: true },
    { title: 'Consistent User', icon: '⭐', earned: false },
    { title: 'Voice Champion', icon: '🎤', earned: true },
  ]
};

export default function DashboardPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className={`flex items-center mb-8 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <Link href="/" className="mr-4">
          <Button variant="ghost" size="lg" className="senior-button h-auto p-3">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-senior-xl font-bold text-gray-900">My Progress</h1>
          <p className="text-senior-base text-gray-600">Track your cognitive health journey</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 transform transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <Card className="senior-card gradient-primary text-white">
          <div className="text-center">
            <Calendar className="w-8 h-8 mx-auto mb-3" />
            <p className="text-3xl font-bold mb-1">{MOCK_DATA.streak}</p>
            <p className="text-sm opacity-90">Day Streak</p>
          </div>
        </Card>
        
        <Card className="senior-card gradient-success text-white">
          <div className="text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-3" />
            <p className="text-3xl font-bold mb-1">{MOCK_DATA.averageScore}%</p>
            <p className="text-sm opacity-90">Average Score</p>
          </div>
        </Card>
        
        <Card className="senior-card bg-purple-600 text-white">
          <div className="text-center">
            <Brain className="w-8 h-8 mx-auto mb-3" />
            <p className="text-3xl font-bold mb-1">{MOCK_DATA.totalSessions}</p>
            <p className="text-sm opacity-90">Total Sessions</p>
          </div>
        </Card>
      </div>

      {/* Weekly Progress Chart */}
      <div className={`mb-8 transform transition-all duration-1000 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <Card className="senior-card">
          <h3 className="text-senior-lg font-bold mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
            Weekly Performance
          </h3>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_DATA.weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${value}${name === 'score' ? '%' : '/5'}`, 
                    name === 'score' ? 'Score' : 'Mood'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Task Performance */}
      <div className={`mb-8 transform transition-all duration-1000 delay-600 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <Card className="senior-card">
          <h3 className="text-senior-lg font-bold mb-6 flex items-center">
            <BarChart3 className="w-6 h-6 mr-3 text-green-600" />
            Task Performance
          </h3>
          
          <div className="space-y-4">
            {MOCK_DATA.taskPerformance.map((task, index) => (
              <div key={task.task} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{task.task}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold">{task.score}%</span>
                      <span className="text-sm text-green-600 font-medium">{task.improvement}</span>
                    </div>
                  </div>
                  <Progress value={task.score} className="h-3" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Achievements */}
      <div className={`mb-8 transform transition-all duration-1000 delay-800 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <Card className="senior-card">
          <h3 className="text-senior-lg font-bold mb-6 flex items-center">
            <Award className="w-6 h-6 mr-3 text-yellow-600" />
            Achievements
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {MOCK_DATA.achievements.map((achievement, index) => (
              <div 
                key={achievement.title}
                className={`p-4 rounded-xl text-center transition-all duration-200 ${
                  achievement.earned 
                    ? 'bg-yellow-50 border-2 border-yellow-200' 
                    : 'bg-gray-50 border-2 border-gray-200 opacity-60'
                }`}
              >
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <p className="font-semibold text-sm">{achievement.title}</p>
                {achievement.earned && (
                  <div className="w-6 h-6 bg-green-500 rounded-full mx-auto mt-2 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className={`flex flex-col sm:flex-row gap-4 transform transition-all duration-1000 delay-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <Link href="/daily-checkin" className="flex-1">
          <Button className="senior-button gradient-primary border-0 text-white w-full">
            <Heart className="w-6 h-6 mr-3" />
            Today's Check-in
          </Button>
        </Link>
        
        <Link href="/caregiver" className="flex-1">
          <Button variant="outline" className="senior-button w-full">
            Share with Caregiver
          </Button>
        </Link>
      </div>
    </div>
  );
}