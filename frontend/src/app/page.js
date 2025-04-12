'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';

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
          <Link href="/" className="text-white text-3xl font-bold hover:text-gray-300 transition-colors">
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
                {/* Audio Context Section */}
                <div className="bg-gray-50 p-8 rounded-lg shadow-lg">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">Audio Context Analysis</h2>
                  {isAudioLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
                    </div>
                  ) : audioComplete ? (
                    <div className="space-y-4">
                      <ul className="list-disc pl-5 space-y-2 text-gray-900">
                        <li>Speech patterns analyzed</li>
                        <li>Emotional tone detected</li>
                        <li>Keyword frequency identified</li>
                        <li>Contextual relevance scored</li>
                      </ul>
                    </div>
                  ) : null}
                </div>

                {/* Video Context Section */}
                <div className="bg-gray-50 p-8 rounded-lg shadow-lg">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">Video Context Analysis</h2>
                  {isVideoLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
                    </div>
                  ) : videoComplete ? (
                    <div className="space-y-4">
                      <ul className="list-disc pl-5 space-y-2 text-gray-900">
                        <li>Visual elements processed</li>
                        <li>Facial expressions analyzed</li>
                        <li>Scene transitions identified</li>
                        <li>Visual bias indicators detected</li>
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Fact Check Button */}
              {audioComplete && videoComplete && (
                <div className="mt-12 text-center">
                  <button className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-base font-medium shadow-sm">
                    Show Fact Check
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
