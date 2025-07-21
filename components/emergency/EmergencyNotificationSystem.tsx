"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Phone, Mail, MessageSquare, CheckCircle } from 'lucide-react';

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  priority: number;
  notificationMethods: ('call' | 'email' | 'sms')[];
}

interface EmergencyNotificationProps {
  riskScore: number;
  patientName: string;
  assessmentData?: any;
  onNotificationSent?: (contact: EmergencyContact, method: string) => void;
}

const DEFAULT_CONTACTS: EmergencyContact[] = [
  {
    id: '1',
    name: 'Dr. Sarah Chen',
    relationship: 'Primary Care Physician',
    phone: '+65 6123 4567',
    email: 'dr.chen@healthcenter.sg',
    priority: 1,
    notificationMethods: ['call', 'email']
  },
  {
    id: '2',
    name: 'Michael Johnson',
    relationship: 'Son (Emergency Contact)',
    phone: '+65 9876 5432',
    email: 'michael.johnson@email.com',
    priority: 2,
    notificationMethods: ['call', 'sms', 'email']
  },
  {
    id: '3',
    name: 'Singapore General Hospital',
    relationship: 'Emergency Department',
    phone: '+65 6321 4311',
    email: 'emergency@sgh.com.sg',
    priority: 3,
    notificationMethods: ['call']
  }
];

export function EmergencyNotificationSystem({ 
  riskScore, 
  patientName, 
  assessmentData,
  onNotificationSent 
}: EmergencyNotificationProps) {
  const [contacts] = useState<EmergencyContact[]>(DEFAULT_CONTACTS);
  const [notificationStatus, setNotificationStatus] = useState<Record<string, 'pending' | 'sent' | 'failed'>>({});
  const [isEmergency, setIsEmergency] = useState(false);

  useEffect(() => {
    if (riskScore >= 70) {
      setIsEmergency(true);
      // Auto-trigger emergency notifications for high-risk scores
      triggerEmergencyAlerts();
    }
  }, [riskScore]);

  const triggerEmergencyAlerts = async () => {
    // Sort contacts by priority
    const sortedContacts = [...contacts].sort((a, b) => a.priority - b.priority);
    
    for (const contact of sortedContacts) {
      for (const method of contact.notificationMethods) {
        await sendNotification(contact, method);
        // Add delay between notifications to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const sendNotification = async (contact: EmergencyContact, method: 'call' | 'email' | 'sms') => {
    const notificationKey = `${contact.id}-${method}`;
    setNotificationStatus(prev => ({ ...prev, [notificationKey]: 'pending' }));

    try {
      // Simulate notification sending
      await simulateNotification(contact, method);
      
      setNotificationStatus(prev => ({ ...prev, [notificationKey]: 'sent' }));
      onNotificationSent?.(contact, method);
      
      // Log the notification
      console.log(`Emergency notification sent to ${contact.name} via ${method}`);
      
    } catch (error) {
      console.error(`Failed to send notification to ${contact.name} via ${method}:`, error);
      setNotificationStatus(prev => ({ ...prev, [notificationKey]: 'failed' }));
    }
  };

  const simulateNotification = async (contact: EmergencyContact, method: string): Promise<void> => {
    // In a real implementation, this would integrate with actual notification services
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 95% success rate
        if (Math.random() > 0.05) {
          resolve();
        } else {
          reject(new Error('Network error'));
        }
      }, 2000);
    });
  };

  const makeEmergencyCall = (contact: EmergencyContact) => {
    // Use tel: protocol to initiate call on mobile devices
    window.location.href = `tel:${contact.phone}`;
    sendNotification(contact, 'call');
  };

  const sendEmergencyEmail = (contact: EmergencyContact) => {
    const subject = `URGENT: High Risk Assessment Alert for ${patientName}`;
    const body = `
EMERGENCY ALERT

Patient: ${patientName}
Risk Score: ${riskScore}/100 (HIGH RISK)
Assessment Time: ${new Date().toLocaleString()}

This is an automated alert indicating that ${patientName} has received a high-risk cognitive assessment score. Immediate medical attention may be required.

Assessment Details:
- Overall Risk Score: ${riskScore}
- Assessment Date: ${new Date().toLocaleDateString()}
- Recommended Action: Contact patient immediately and consider medical evaluation

Please respond to this alert as soon as possible.

Reflexion Cognitive Health Monitoring System
    `.trim();

    const mailtoUrl = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    sendNotification(contact, 'email');
  };

  const getNotificationIcon = (method: string) => {
    switch (method) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (!isEmergency) {
    return null;
  }

  return (
    <Card className="p-6 border-red-300 bg-red-50">
      <div className="flex items-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
        <h3 className="text-lg font-bold text-red-800">Emergency Alert System</h3>
      </div>

      <div className="mb-6">
        <p className="text-red-700 mb-2">
          High-risk assessment detected for {patientName} (Score: {riskScore}/100)
        </p>
        <p className="text-sm text-red-600">
          Emergency notifications are being sent to all registered contacts.
        </p>
      </div>

      <div className="space-y-4">
        {contacts.map((contact) => (
          <div key={contact.id} className="p-4 bg-white rounded-lg border border-red-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                <p className="text-sm text-gray-600">{contact.relationship}</p>
                <p className="text-sm text-gray-500">{contact.phone}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => makeEmergencyCall(contact)}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </Button>
                <Button
                  onClick={() => sendEmergencyEmail(contact)}
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700"
                >
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {contact.notificationMethods.map((method) => {
                const notificationKey = `${contact.id}-${method}`;
                const status = notificationStatus[notificationKey];
                return (
                  <div
                    key={method}
                    className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${
                      status === 'sent' ? 'bg-green-100' :
                      status === 'failed' ? 'bg-red-100' :
                      status === 'pending' ? 'bg-yellow-100' :
                      'bg-gray-100'
                    }`}
                  >
                    {getNotificationIcon(method)}
                    <span className={getStatusColor(status)}>
                      {method.toUpperCase()}
                    </span>
                    {status === 'sent' && <CheckCircle className="w-3 h-3 text-green-600" />}
                    {status === 'pending' && <div className="w-3 h-3 border border-yellow-600 border-t-transparent rounded-full animate-spin" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>Next Steps:</strong> Emergency contacts have been notified. If this is a medical emergency, 
          call emergency services immediately at 995 (Singapore) or your local emergency number.
        </p>
      </div>
    </Card>
  );
}