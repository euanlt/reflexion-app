"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Phone, MessageCircle, Clock, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const EMERGENCY_CONTACTS = [
  {
    name: "Dr. Sarah Chen",
    role: "Primary Care Physician",
    phone: "+65 6123 4567",
    available: true,
    priority: 1
  },
  {
    name: "Michael Johnson",
    role: "Son (Emergency Contact)",
    phone: "+65 9876 5432",
    available: true,
    priority: 2
  },
  {
    name: "Singapore General Hospital",
    role: "Emergency Department",
    phone: "+65 6321 4311",
    available: true,
    priority: 3
  }
];

export default function EmergencyAlertPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleEmergencyCall = (contact: typeof EMERGENCY_CONTACTS[0]) => {
    // In a real app, this would initiate a call
    setAlertSent(true);
    console.log(`Calling ${contact.name} at ${contact.phone}`);
  };

  const handleSendAlert = () => {
    setAlertSent(true);
    // In a real app, this would send notifications to all emergency contacts
  };

  return (
    <div className="min-h-screen bg-red-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-red-600 text-white">
        <Link href="/">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-semibold">Emergency Alert</h1>
        <div className="w-6 h-6" />
      </div>

      <div className="px-6 py-8">
        {/* Alert Status */}
        <div className={`mb-8 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Card className="senior-card bg-red-100 border-red-300">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4 animate-pulse" />
              <h2 className="text-senior-xl font-bold text-red-800 mb-4">
                High Risk Assessment Detected
              </h2>
              <p className="text-red-700 mb-6">
                Helena's cognitive assessment shows concerning patterns that require immediate attention from healthcare providers.
              </p>
              
              {!alertSent ? (
                <Button 
                  onClick={handleSendAlert}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-2xl text-lg mb-4"
                >
                  Send Alert to All Contacts
                </Button>
              ) : (
                <div className="p-4 bg-green-100 rounded-xl border border-green-300 mb-4">
                  <p className="text-green-800 font-medium">
                    ✓ Emergency alert sent successfully
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    All emergency contacts have been notified
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Emergency Contacts */}
        <div className={`space-y-4 transform transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h3 className="text-senior-lg font-bold text-gray-900 mb-4">Emergency Contacts</h3>
          
          {EMERGENCY_CONTACTS.map((contact, index) => (
            <Card 
              key={contact.name}
              className={`p-6 rounded-2xl border-2 ${
                contact.priority === 1 ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${
                    contact.priority === 1 ? 'bg-red-200' : 'bg-blue-100'
                  }`}>
                    {contact.role.includes('Dr.') ? (
                      <User className="w-6 h-6 text-red-600" />
                    ) : contact.role.includes('Hospital') ? (
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    ) : (
                      <User className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{contact.name}</h4>
                    <p className="text-gray-600">{contact.role}</p>
                    <p className="text-sm text-gray-500">{contact.phone}</p>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-xs text-green-600">Available</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleEmergencyCall(contact)}
                    className={`${
                      contact.priority === 1 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white p-3 rounded-xl`}
                  >
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    className="p-3 rounded-xl border-gray-300"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Assessment Details */}
        <div className={`mt-8 transform transition-all duration-1000 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Card className="senior-card">
            <h3 className="text-senior-lg font-bold mb-4">Assessment Details</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Overall Risk Score</span>
                <span className="text-2xl font-bold text-red-600">80</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Speaking Patterns</span>
                  <span className="font-bold text-red-600">80</span>
                </div>
                <div className="flex justify-between">
                  <span>Facial Analysis</span>
                  <span className="font-bold text-red-600">80</span>
                </div>
                <div className="flex justify-between">
                  <span>Speech Content</span>
                  <span className="font-bold text-red-600">80</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  Last assessment: 4 hours ago
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className={`mt-8 space-y-4 transform transition-all duration-1000 delay-600 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Link href="/caregiver">
            <Button variant="outline" className="w-full senior-button border-2 border-gray-300">
              View Caregiver Dashboard
            </Button>
          </Link>
          
          <Link href="/daily-checkin">
            <Button variant="outline" className="w-full senior-button border-2 border-blue-300 text-blue-700">
              Take New Assessment
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}