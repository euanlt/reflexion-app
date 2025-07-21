"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, AlertTriangle, TrendingUp, Calendar, Phone, Mail, Heart } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Mock caregiver data
const MOCK_CAREGIVER_DATA = {
  patient: {
    name: "Helena",
    age: 72,
    lastCheckIn: "4 hours ago",
    overallHealth: "High Risk",
    streak: 7
  },
  alerts: [
    { 
      type: "urgent", 
      message: "High risk assessment detected - immediate attention required", 
      time: "4 hours ago",
      severity: "high"
    },
    { 
      type: "info", 
      message: "Completed daily check-in", 
      time: "4 hours ago",
      severity: "low"
    },
    { 
      type: "warning", 
      message: "Speech pace slightly slower than baseline", 
      time: "4 hours ago",
      severity: "high"
    },
    { 
      type: "warning", 
      message: "Facial expression analysis shows concerning patterns", 
      time: "4 hours ago",
      severity: "high"
    }
  ],
  weeklyTrends: [
    { day: 'Mon', cognitive: 65, mood: 3, engagement: 70 },
    { day: 'Tue', cognitive: 68, mood: 3, engagement: 72 },
    { day: 'Wed', cognitive: 72, mood: 2, engagement: 68 },
    { day: 'Thu', cognitive: 70, mood: 3, engagement: 75 },
    { day: 'Fri', cognitive: 77, mood: 2, engagement: 70 },
    { day: 'Sat', cognitive: 79, mood: 2, engagement: 74 },
    { day: 'Sun', cognitive: 80, mood: 2, engagement: 76 },
  ],
  taskBreakdown: [
    { name: 'Memory', value: 80, color: '#DC2626' },
    { name: 'Speech', value: 80, color: '#DC2626' },
    { name: 'Emotion', value: 80, color: '#DC2626' },
  ]
};

export default function CaregiverPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'urgent': return '🚨';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className={`flex items-center justify-between mb-8 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <div className="flex items-center">
          <Link href="/" className="mr-4">
            <Button variant="ghost" size="lg" className="senior-button h-auto p-3">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-senior-xl font-bold text-gray-900">Caregiver Dashboard</h1>
            <p className="text-senior-base text-gray-600">Monitor cognitive health progress</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
        </div>
      </div>

      {/* Patient Overview */}
      <div className={`mb-8 transform transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <Card className="senior-card bg-red-600 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-full">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-senior-lg font-bold mb-1">{MOCK_CAREGIVER_DATA.patient.name}</h2>
                <p className="opacity-90 mb-2">Age {MOCK_CAREGIVER_DATA.patient.age} • Last check-in: {MOCK_CAREGIVER_DATA.patient.lastCheckIn}</p>
                <div className="flex items-center space-x-4">
                  <Badge className="bg-white bg-opacity-20 text-white border-white border-opacity-20">
                    {MOCK_CAREGIVER_DATA.patient.streak} day streak
                  </Badge>
                  <Badge className="bg-red-800 text-white border-0">
                    {MOCK_CAREGIVER_DATA.patient.overallHealth}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">80</div>
              <div className="text-sm opacity-90">Risk Score</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Urgent Alert Banner */}
      <div className={`mb-8 transform transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <Card className="senior-card bg-red-50 border-red-200">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-senior-lg font-bold text-red-800 mb-2">
              Helena is at high risk of dementia. Seek out assistance quickly to diagnose and treat early.
            </h3>
            <p className="text-red-700 mb-6">
              Early detection can significantly reduce the rate of cognitive decline. Call +65 xxxx for more assistance.
            </p>
            <div className="space-y-3">
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-2xl text-lg">
                Call Emergency Contact
              </Button>
              <Button variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-50 font-semibold py-4 px-6 rounded-2xl text-lg">
                View Details
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Weekly Trends */}
          <div className={`transform transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <Card className="senior-card">
              <h3 className="text-senior-lg font-bold mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-red-600" />
                Weekly Progress Trends
              </h3>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MOCK_CAREGIVER_DATA.weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="cognitive" 
                      stroke="#DC2626" 
                      strokeWidth={2}
                      name="Cognitive Score"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="engagement" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      name="Engagement"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Task Performance Breakdown */}
          <div className={`transform transition-all duration-1000 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <Card className="senior-card">
              <h3 className="text-senior-lg font-bold mb-6">Task Performance This Week</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={MOCK_CAREGIVER_DATA.taskBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {MOCK_CAREGIVER_DATA.taskBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4">
                  {MOCK_CAREGIVER_DATA.taskBreakdown.map((task) => (
                    <div key={task.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: task.color }}
                        />
                        <span className="font-medium">{task.name}</span>
                      </div>
                      <span className="text-lg font-bold">{task.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Alerts */}
          <div className={`transform transition-all duration-1000 delay-900 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <Card className="senior-card">
              <h3 className="text-senior-lg font-bold mb-4 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-3 text-red-600" />
                Recent Activity
              </h3>
              
              <div className="space-y-3">
                {MOCK_CAREGIVER_DATA.alerts.map((alert, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-xl border ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getAlertIcon(alert.type)}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{alert.message}</p>
                        <p className="text-xs opacity-75 mt-1">{alert.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className={`transform transition-all duration-1000 delay-1100 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <Card className="senior-card">
              <h3 className="text-senior-lg font-bold mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <Button className="w-full senior-button bg-red-600 hover:bg-red-700 border-0 text-white">
                  Emergency Call
                </Button>
                
                <Button className="w-full senior-button bg-blue-600 hover:bg-blue-700 border-0 text-white">
                  <Calendar className="w-5 h-5 mr-3" />
                  Schedule Urgent Visit
                </Button>
                
                <Button variant="outline" className="w-full senior-button">
                  <Phone className="w-5 h-5 mr-3" />
                  Video Call
                </Button>
                
                <Button variant="outline" className="w-full senior-button">
                  <Mail className="w-5 h-5 mr-3" />
                  Send Message
                </Button>
              </div>
            </Card>
          </div>

          {/* Health Summary */}
          <div className={`transform transition-all duration-1000 delay-1300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <Card className="senior-card">
              <h3 className="text-senior-lg font-bold mb-4">Health Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Score</span>
                  <Badge className="bg-red-100 text-red-800">80 - High Risk</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <Badge className="bg-yellow-100 text-yellow-800">85%</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Mood Trend</span>
                  <Badge className="bg-red-100 text-red-800">Declining</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Next Check-in</span>
                  <span className="text-sm text-red-600 font-medium">Overdue</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}