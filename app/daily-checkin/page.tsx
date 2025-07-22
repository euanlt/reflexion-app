"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Brain, Calendar, CheckCircle, ClipboardList } from 'lucide-react';

export default function DailyCheckinPage() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-lg">Back to Home</span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Daily Check-in
          </h1>
          <p className="text-lg text-gray-600">
            Complete your daily cognitive assessments to track your brain health
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* MoCA Test Card */}
          <Card 
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-400"
            onClick={() => router.push('/moca-test')}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  MoCA Test
                </h2>
                <p className="text-gray-600 mb-4">
                  Montreal Cognitive Assessment - A comprehensive 10-minute test evaluating multiple cognitive domains
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <ClipboardList className="w-4 h-4" />
                    30 points
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    ~10 minutes
                  </span>
                </div>
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                  Start MoCA Test
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Memory Check Card */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-400">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Quick Memory Check
                </h2>
                <p className="text-gray-600 mb-4">
                  A brief 3-minute assessment focusing on short-term memory and recall
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <ClipboardList className="w-4 h-4" />
                    10 points
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    ~3 minutes
                  </span>
                </div>
                <Button className="mt-4 bg-gray-400 hover:bg-gray-500 text-white" disabled>
                  Coming Soon
                </Button>
              </div>
            </div>
          </Card>

          {/* Speech Analysis Card */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-400">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Speech Analysis
                </h2>
                <p className="text-gray-600 mb-4">
                  Voice-based assessment analyzing speech patterns and fluency
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <ClipboardList className="w-4 h-4" />
                    15 points
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    ~5 minutes
                  </span>
                </div>
                <Button className="mt-4 bg-gray-400 hover:bg-gray-500 text-white" disabled>
                  Coming Soon
                </Button>
              </div>
            </div>
          </Card>

          {/* Mood Assessment Card */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-yellow-400">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Mood & Wellness
                </h2>
                <p className="text-gray-600 mb-4">
                  Quick assessment of emotional well-being and daily mood
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <ClipboardList className="w-4 h-4" />
                    5 points
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    ~2 minutes
                  </span>
                </div>
                <Button className="mt-4 bg-gray-400 hover:bg-gray-500 text-white" disabled>
                  Coming Soon
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Assessments */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Recent Assessments
          </h2>
          <Card className="p-6 bg-gray-50">
            <p className="text-gray-600 text-center">
              Complete your first assessment to see your history here
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}