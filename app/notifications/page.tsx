"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bell, CheckCircle, AlertTriangle, Info, Clock, Menu } from 'lucide-react';
import Link from 'next/link';

const NOTIFICATIONS = [
  {
    id: 1,
    type: 'reminder',
    title: 'Daily Assessment Reminder',
    message: 'Time for your daily cognitive check-in!',
    time: '9:00 AM',
    date: 'Today',
    read: false,
    icon: Bell
  },
  {
    id: 2,
    type: 'achievement',
    title: 'Streak Achievement!',
    message: 'Congratulations! You\'ve completed 7 days in a row.',
    time: '2:30 PM',
    date: 'Yesterday',
    read: false,
    icon: CheckCircle
  },
  {
    id: 3,
    type: 'alert',
    title: 'Score Change Detected',
    message: 'Your cognitive score has decreased slightly. Consider trying some exercises.',
    time: '11:15 AM',
    date: 'Yesterday',
    read: true,
    icon: AlertTriangle
  },
  {
    id: 4,
    type: 'info',
    title: 'New Exercise Available',
    message: 'We\'ve added a new memory game to help improve your cognitive health.',
    time: '4:45 PM',
    date: '2 days ago',
    read: true,
    icon: Info
  },
  {
    id: 5,
    type: 'reminder',
    title: 'Caregiver Check-in',
    message: 'Your daughter Sarah would like to review your progress.',
    time: '6:00 PM',
    date: '3 days ago',
    read: true,
    icon: Clock
  }
];

export default function NotificationsPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const getNotificationStyle = (type: string, read: boolean) => {
    const baseStyle = read ? 'bg-gray-50' : 'bg-white border-l-4';
    const typeStyles = {
      reminder: read ? baseStyle : `${baseStyle} border-l-blue-500`,
      achievement: read ? baseStyle : `${baseStyle} border-l-green-500`,
      alert: read ? baseStyle : `${baseStyle} border-l-yellow-500`,
      info: read ? baseStyle : `${baseStyle} border-l-purple-500`
    };
    return typeStyles[type as keyof typeof typeStyles] || baseStyle;
  };

  const getIconColor = (type: string) => {
    const colors = {
      reminder: 'text-blue-600',
      achievement: 'text-green-600',
      alert: 'text-yellow-600',
      info: 'text-purple-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
        <Link href="/">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="ml-2 bg-red-500 text-white">
              {unreadCount}
            </Badge>
          )}
        </div>
        <Menu className="w-6 h-6 text-gray-700" />
      </div>

      <div className="px-6 py-8">
        {/* Quick Actions */}
        <div className={`flex space-x-4 mb-8 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
            className="flex-1"
          >
            Mark All Read
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Settings
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map((notification, index) => {
            const IconComponent = notification.icon;
            return (
              <div
                key={notification.id}
                className={`transform transition-all duration-1000 delay-${index * 100} ${
                  isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
              >
                <Card 
                  className={`p-4 rounded-2xl border border-gray-200 cursor-pointer hover:shadow-md transition-shadow ${
                    getNotificationStyle(notification.type, notification.read)
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-full bg-gray-100 ${getIconColor(notification.type)}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-semibold ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{notification.time}</p>
                          <p className="text-xs text-gray-500">{notification.date}</p>
                        </div>
                      </div>
                      <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">You're all caught up!</p>
          </div>
        )}

        {/* Action Button */}
        <div className={`mt-8 transform transition-all duration-1000 delay-600 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Link href="/daily-checkin">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-2xl text-lg">
              Start Daily Assessment
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}