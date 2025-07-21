"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Menu, Home, Calendar, Headphones, Puzzle, Grid3X3, Calculator } from 'lucide-react';
import Link from 'next/link';

const COGNITIVE_EXERCISES = [
  {
    id: 'memory-game',
    title: 'Memory Game',
    description: 'Remember where the matching tiles are! Find all the pairs!',
    icon: Grid3X3,
    image: 'https://images.pexels.com/photos/278918/pexels-photo-278918.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
    color: 'bg-blue-50 border-blue-200'
  },
  {
    id: 'jigsaw-puzzles',
    title: 'Jigsaw Puzzles',
    description: 'Piece together the image! You can also use your own photos for your own custom puzzles!',
    icon: Puzzle,
    image: 'https://images.pexels.com/photos/1111597/pexels-photo-1111597.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
    color: 'bg-purple-50 border-purple-200'
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    description: 'No repeating numbers in the same row, column or grid: Can you figure out the solution?',
    icon: Calculator,
    image: 'https://images.pexels.com/photos/6256065/pexels-photo-6256065.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
    color: 'bg-green-50 border-green-200'
  }
];

export default function ExercisesPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('cognitive');

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white">
        <Menu className="w-6 h-6 text-gray-700" />
        <h1 className="text-xl font-semibold text-gray-900">Reflexion</h1>
        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
          <img 
            src="https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="px-6 pb-24">
        {/* Tab Navigation */}
        <div className={`flex mb-8 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <button
            onClick={() => setActiveTab('cognitive')}
            className={`flex-1 pb-3 text-center font-medium border-b-2 transition-colors ${
              activeTab === 'cognitive'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-gray-200'
            }`}
          >
            Cognitive Exercises
          </button>
          <button
            onClick={() => setActiveTab('moca')}
            className={`flex-1 pb-3 text-center font-medium border-b-2 transition-colors ${
              activeTab === 'moca'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-gray-200'
            }`}
          >
            MoCA Test
          </button>
        </div>

        {/* Exercise Cards */}
        <div className="space-y-6">
          {COGNITIVE_EXERCISES.map((exercise, index) => {
            const IconComponent = exercise.icon;
            const isImplemented = ['memory-game', 'jigsaw-puzzles', 'sudoku'].includes(exercise.id);
            
            const cardContent = (
              <Card className={`p-6 rounded-3xl border-2 ${exercise.color} ${isImplemented ? 'hover:shadow-lg transition-shadow cursor-pointer' : 'opacity-75'}`}>
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900">
                        {exercise.title}
                      </h3>
                      {!isImplemented && (
                        <span className="px-3 py-1 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-base leading-relaxed">
                      {exercise.description}
                    </p>
                  </div>
                  <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                    <img
                      src={exercise.image}
                      alt={exercise.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </Card>
            );
            
            return (
              <div
                key={exercise.id}
                className={`transform transition-all duration-1000 delay-${(index + 1) * 200} ${
                  isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
              >
                {isImplemented ? (
                  <Link href={`/exercises/${exercise.id}`}>
                    {cardContent}
                  </Link>
                ) : (
                  cardContent
                )}
              </div>
            );
          })}
        </div>

        {/* Back to Assessment Button */}
        <div className={`mt-8 transform transition-all duration-1000 delay-800 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Link href="/">
            <Button 
              variant="outline" 
              className="w-full py-4 px-6 rounded-2xl text-lg font-medium border-2 border-gray-300 hover:border-gray-400"
            >
              <ArrowLeft className="w-5 h-5 mr-3" />
              Back to Assessment
            </Button>
          </Link>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-around">
          <Home className="w-6 h-6 text-gray-900" />
          <Calendar className="w-6 h-6 text-gray-400" />
          <Headphones className="w-6 h-6 text-gray-400" />
        </div>
      </div>
    </div>
  );
}