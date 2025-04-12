'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
export default function Home() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoAuthor, setVideoAuthor] = useState('');
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [audioComplete, setAudioComplete] = useState(false);
  const [videoComplete, setVideoComplete] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [audioSummary, setAudioSummary] = useState([]);
  const playerRef = useRef(null);
  const resultsSectionRef = useRef(null);

  useEffect(() => {
    // Control body scrolling
    if (!showResults) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // Cleanup
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showResults]);

  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const fetchVideoDetails = async (videoId) => {
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      const data = await response.json();
      setVideoTitle(data.title);
      setVideoAuthor(data.author_name);
    } catch (error) {
      console.error('Error fetching video details:', error);
      setVideoTitle('');
      setVideoAuthor('');
    }
  };

  useEffect(() => {
    const videoId = extractVideoId(youtubeUrl);
    if (videoId) {
      fetchVideoDetails(videoId);
    } else {
      setVideoTitle('');
      setVideoAuthor('');
    }
  }, [youtubeUrl]);

  useEffect(() => {
    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // Initialize player when API is ready
    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: 'ixxTwcAELB8', // Default video ID from the provided URL
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          loop: 1,
          modestbranding: 1,
          mute: 1,
          playlist: 'ixxTwcAELB8', // Required for loop to work
          playsinline: 1,
          rel: 0, // Disable related videos
        },
        events: {
          onReady: (event) => {
            event.target.playVideo();
            setIsVideoLoaded(true);
          },
        },
      });
    };
  }, []);

  const generateAudioSummary = async () => {
    try {
      const response = await fetch('/audio_context/vaccine.txt');
      const text = await response.text();
      // Split the text into lines and filter for bullet points
      const bulletPoints = text.split('\n')
        .filter(line => line.trim().startsWith('*'))
        .map(line => {
          // Remove the asterisk and trim
          let content = line.trim().substring(1).trim();
          // Convert markdown bold to HTML
          content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return content;
        });
      setAudioSummary(bulletPoints);
    } catch (error) {
      console.error('Error reading audio context:', error);
      setAudioSummary(['Error loading audio context']);
    }
  };

  const handleProcess = () => {
    const videoId = extractVideoId(youtubeUrl);
    if (videoId) {
      // Only load new video if we have a valid URL
      if (playerRef.current) {
        playerRef.current.loadVideoById({
          videoId: videoId,
          startSeconds: 0,
        });
      }

      setShowResults(true);
      // Scroll to results section
      setTimeout(() => {
        resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      // Start loading animations
      setIsAudioLoading(true);
      setIsVideoLoading(true);
      
      // Generate audio summary
      generateAudioSummary();
      
      // Simulate audio analysis completion after 3 seconds
      setTimeout(() => {
        setIsAudioLoading(false);
        setAudioComplete(true);
      }, 3000);
      
      // Simulate video analysis completion after 7 seconds
      setTimeout(() => {
        setIsVideoLoading(false);
        setVideoComplete(true);
      }, 7000);
    }
  };

  return (
    <main className={`relative min-h-screen ${!showResults ? 'overflow-hidden h-screen' : ''}`}>
      {/* YouTube Background */}
      <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen">
        <div
          id="youtube-player"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            objectFit: 'cover',
          }}
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      </div>

      {/* Content Container */}
      <div className="relative">
        {/* Navigation */}
        <nav className="flex justify-between items-center px-6 pt-6">
          <Link href="/" className="flex items-center gap-2 text-white text-3xl font-bold hover:text-gray-300 transition-colors">
            <img src="/logo-transparent.png" alt="DeBias Logo" className="h-8 w-auto" />
            DeBias
          </Link>
          <div className="flex gap-6">
            <div className="text-white/80 hover:text-white transition-colors cursor-pointer">
              About our mission
            </div>
            <div className="text-white/80 hover:text-white transition-colors cursor-pointer">
              Contact
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center h-screen text-center px-4">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6">
            Uncover the Truth
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl">
            Analyze YouTube content for factual accuracy and political bias
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex gap-4 items-center">
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Enter YouTube URL"
                className="px-6 py-3 rounded-full bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[200px] max-w-[600px] w-auto"
                style={{ width: youtubeUrl.length > 0 ? `${Math.min(Math.max(youtubeUrl.length * 8, 200), 600)}px` : '200px' }}
              />
              <button
                onClick={handleProcess}
                className="px-8 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300 flex items-center gap-2 group"
              >
                <span>Analyze</span>
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            </div>
            {videoTitle && videoAuthor && (
              <div className="text-white/80 text-sm">
                {videoTitle} - {videoAuthor}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {showResults && (
          <div ref={resultsSectionRef} className="relative bg-white min-h-screen py-20">
            <div className="max-w-6xl mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column - Audio Context */}
                <div className="bg-gray-50 p-8 rounded-lg shadow-lg">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">Audio Context Summary</h2>
                  {isAudioLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
                    </div>
                  ) : audioComplete ? (
                    <div className="space-y-4">
                      <ul className="list-disc pl-5 space-y-2 text-gray-900">
                        {audioSummary.map((point, index) => (
                          <li key={index} dangerouslySetInnerHTML={{ __html: point }} />
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                {/* Right Column - Political Perspective and Fact Check */}
                <div className="space-y-8">
                  {/* Political Spectrum Section */}
                  <div className="bg-gray-50 p-8 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Political Perspective Analysis</h2>
                    {isVideoLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
                      </div>
                    ) : videoComplete ? (
                      <div className="space-y-6">
                        {/* Spectrum Visualization */}
                        <div className="relative">
                          <div className="h-2 bg-gradient-to-r from-blue-600 via-gray-200 to-red-600 rounded-full"></div>
                          <div className="flex justify-between text-sm mt-2 text-gray-600">
                            <span>Far Left</span>
                            <span>Center Left</span>
                            <span>Center</span>
                            <span>Center Right</span>
                            <span>Far Right</span>
                          </div>
                          {/* Position Indicator */}
                          <div 
                            className="absolute top-0 w-4 h-4 bg-black rounded-full -mt-1 transform -translate-x-1/2"
                            style={{ left: '60%' }}
                          ></div>
                        </div>
                        <p className="text-gray-700 text-center mt-4">
                          Based on our analysis, this content leans slightly towards the right of the political spectrum
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {/* Fact Check Section */}
                  <div className="bg-gray-50 p-8 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Fact Check Results</h2>
                    {isVideoLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
                      </div>
                    ) : videoComplete ? (
                      <div className="space-y-6">
                        <ul className="space-y-4">
                          <li className="border-l-4 border-yellow-400 pl-4 py-2">
                            <span className="text-sm font-semibold text-gray-500">02:15</span>
                            <p className="text-gray-900 mt-1">
                              <span className="font-semibold">Claim:</span> "The economy grew by 10% last year"
                            </p>
                            <p className="text-red-600 mt-1">
                              <span className="font-semibold">Correction:</span> Official economic data shows 3.2% growth
                            </p>
                            <a href="#" className="text-blue-600 hover:underline text-sm mt-1 block">Source: Economic Bureau Statistics</a>
                          </li>
                          <li className="border-l-4 border-yellow-400 pl-4 py-2">
                            <span className="text-sm font-semibold text-gray-500">05:30</span>
                            <p className="text-gray-900 mt-1">
                              <span className="font-semibold">Claim:</span> "This policy has never been tried before"
                            </p>
                            <p className="text-red-600 mt-1">
                              <span className="font-semibold">Correction:</span> Similar policies were implemented in 2015
                            </p>
                            <a href="#" className="text-blue-600 hover:underline text-sm mt-1 block">Source: Government Policy Archive</a>
                          </li>
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
