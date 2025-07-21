"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, User, Bell, Shield, Settings, ChevronRight, Menu } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const profileSections = [
    {
      title: 'Personal Information',
      icon: User,
      items: [
        { label: 'Name', value: 'Margaret Johnson' },
        { label: 'Age', value: '72 years old' },
        { label: 'Emergency Contact', value: 'Sarah Johnson (Daughter)' }
      ]
    },
    {
      title: 'Preferences',
      icon: Settings,
      items: [
        { label: 'Font Size', value: 'Large' },
        { label: 'Voice Guidance', value: 'Enabled' },
        { label: 'Reminder Time', value: '9:00 AM' }
      ]
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      items: [
        { label: 'Data Sharing', value: 'Family Only' },
        { label: 'Location Services', value: 'Disabled' },
        { label: 'Backup', value: 'Enabled' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
        <Link href="/">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
        <Menu className="w-6 h-6 text-gray-700" />
      </div>

      <div className="px-6 py-8">
        {/* Profile Header */}
        <div className={`text-center mb-8 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden mx-auto mb-4">
            <img 
              src="https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop" 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Margaret Johnson</h2>
          <p className="text-gray-600">Member since March 2024</p>
        </div>

        {/* Profile Sections */}
        <div className="space-y-6">
          {profileSections.map((section, sectionIndex) => {
            const IconComponent = section.icon;
            return (
              <div
                key={section.title}
                className={`transform transition-all duration-1000 delay-${(sectionIndex + 1) * 200} ${
                  isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
              >
                <Card className="p-6 rounded-3xl border border-gray-200">
                  <div className="flex items-center mb-4">
                    <IconComponent className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center justify-between py-2">
                        <span className="text-gray-600">{item.label}</span>
                        <div className="flex items-center">
                          <span className="text-gray-900 font-medium mr-2">{item.value}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className={`mt-8 space-y-4 transform transition-all duration-1000 delay-800 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Link href="/daily-checkin">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-2xl text-lg">
              Start Daily Assessment
            </Button>
          </Link>
          
          <Button variant="outline" className="w-full py-4 px-6 rounded-2xl text-lg font-medium border-2 border-gray-300 hover:border-gray-400">
            <Bell className="w-5 h-5 mr-3" />
            Notification Settings
          </Button>
        </div>
      </div>
    </div>
  );
}