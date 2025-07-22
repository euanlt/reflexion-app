"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function DailyCheckinPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <div className="text-center">
        <Link href="/" className="inline-flex items-center text-primary mb-6">
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="text-senior-base">Back to Home</span>
        </Link>

        <Card className="senior-card gradient-primary text-white">
          <div className="text-center">
            <h1 className="text-senior-xl font-bold mb-4">
              Daily Check-in
            </h1>
            <p className="text-senior-base mb-6 opacity-90">
              This feature is being updated. Please check back soon.
            </p>
            
            <Link href="/">
              <Button 
                className="senior-button bg-white text-primary hover:bg-gray-50"
                size="lg"
              >
                Return Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}