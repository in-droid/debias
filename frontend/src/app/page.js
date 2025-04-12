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
  const [politicalPosition, setPoliticalPosition] = useState('60%');
  const [politicalDescription, setPoliticalDescription] = useState('');
  const [politicalBias, setPoliticalBias] = useState(null);
  const [factChecks, setFactChecks] = useState([]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState('right');
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
      const response = await fetch('/audio_context/output.txt');
      const text = await response.text();
      // Split the text into lines and filter for bullet points
      const bulletPoints = text.split('\n\n')
        .filter(line => line.trim())
        .map((line, index) => {
          // Split the line into title and content
          const [title, content] = line.split('::');
          // Convert markdown bold to HTML and wrap in a div
          const formattedTitle = title.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return `
            <div class="mb-4 border-b border-gray-200">
              <button 
                onclick="this.nextElementSibling.classList.toggle('hidden'); this.querySelector('svg').classList.toggle('rotate-180')"
                class="w-full flex items-center justify-between py-2 text-left hover:bg-gray-50 px-4 rounded-lg transition-colors"
              >
                <div class="font-bold">${formattedTitle}</div>
                <svg class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div class="px-4 pb-4 hidden">
                ${content.trim()}
              </div>
            </div>
          `;
        });
      setAudioSummary(bulletPoints);
    } catch (error) {
      console.error('Error reading audio context:', error);
      setAudioSummary(['Error loading audio context']);
    }
  };

  const generateFactChecks = async () => {
    try {
      const response = await fetch('/fact_checks.json');
      const data = await response.json();
      setFactChecks(data.facts);
    } catch (error) {
      console.error('Error reading fact checks:', error);
      setFactChecks([]);
    }
  };

  const generatePoliticalBias = async () => {
    try {
      const response = await fetch('/political_bias.json');
      const data = await response.json();
      setPoliticalBias(data);
      
      // Calculate position based on scores
      const total = data.left + data.right + data.center + data.neutral;
      if (data.neutral > Math.max(data.left, data.right, data.center)) {
        setPoliticalPosition('50%');
        setPoliticalDescription('This content appears to be neutral in nature');
      } else {
        const weightedPosition = ((data.left * 0) + (data.center * 50) + (data.right * 100)) / 
                               Math.max(1, data.left + data.center + data.right);
        setPoliticalPosition(`${weightedPosition}%`);
        setPoliticalDescription('Based on our analysis, this content leans towards the right of the political spectrum');
      }
    } catch (error) {
      console.error('Error reading political bias:', error);
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
      // Generate fact checks
      generateFactChecks();
      // Generate political bias
      generatePoliticalBias();
      
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

  const nextFact = () => {
    setSlideDirection('right');
    setCurrentFactIndex((prev) => (prev + 1) % factChecks.length);
  };

  const prevFact = () => {
    setSlideDirection('left');
    setCurrentFactIndex((prev) => (prev - 1 + factChecks.length) % factChecks.length);
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
            <div className="max-w-7xl mx-auto px-4">
              {/* Top Grid - Political Analysis and Fact Check */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Left Column - Political Analysis */}
                <div className="bg-gray-50 p-8 rounded-lg shadow-lg">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">Political Perspective Analysis</h2>
                  {isVideoLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
                    </div>
                  ) : videoComplete && politicalBias ? (
                    <div className="space-y-6">
                      <div className="relative">
                        {/* Spectrum Background */}
                        <div className="h-2 bg-gradient-to-r from-blue-600 via-gray-200 to-red-600 rounded-full"></div>
                        
                        {/* Labels */}
                        <div className="flex justify-between text-sm mt-2 text-gray-600">
                          <span>Far Left</span>
                          <span>Center Left</span>
                          <span>Center</span>
                          <span>Center Right</span>
                          <span>Far Right</span>
                        </div>

                        {/* Position Indicator */}
                        <div 
                          className={`absolute top-0 w-4 h-4 bg-black rounded-full -mt-1 transform -translate-x-1/2 transition-all duration-500 ${
                            politicalBias.neutral > Math.max(politicalBias.left, politicalBias.right, politicalBias.center) 
                              ? 'bg-gray-500' 
                              : 'bg-black'
                          }`}
                          style={{ left: politicalPosition }}
                        ></div>

                        {/* Neutral Indicator */}
                        {politicalBias.neutral > Math.max(politicalBias.left, politicalBias.right, politicalBias.center) && (
                          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 border border-gray-300">
                            Neutral Content
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-gray-700 text-center mt-8">
                        {politicalDescription}
                      </p>

                      {/* Analysis Thoughts */}
                      <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Details</h3>
                        <p className="text-gray-700">{politicalBias.thoughts}</p>
                      </div>

                      {/* Score Breakdown */}
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        {[
                          { label: 'Left', score: politicalBias.left },
                          { label: 'Center', score: politicalBias.center },
                          { label: 'Right', score: politicalBias.right },
                          { label: 'Neutral', score: politicalBias.neutral }
                        ].map(({ label, score }) => (
                          <div key={label} className="bg-white rounded-lg p-3 text-center border border-gray-200">
                            <div className="text-sm text-gray-600">{label}</div>
                            <div className="text-xl font-semibold text-gray-900">{score}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Right Column - Fact Check */}
                <div className="bg-gray-50 p-8 rounded-lg shadow-lg flex flex-col justify-center">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">Fact Check Results</h2>
                  {isVideoLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
                    </div>
                  ) : videoComplete && factChecks.length > 0 ? (
                    <div className="space-y-6 flex-1 flex flex-col justify-center">
                      {/* Fact Content Container with Overlaid Navigation */}
                      <div className="relative">
                        <div className="bg-white rounded-lg shadow-sm">
                          <div 
                            className={`transform transition-all duration-500 ease-in-out ${
                              slideDirection === 'right' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
                            }`}
                          >
                            <div className="border-l-4 border-yellow-400 pl-4 py-4 mx-4">
                              <div className="h-[200px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                                <span className="text-sm font-semibold text-gray-500">{factChecks[currentFactIndex].timestamp}</span>
                                <p className="text-gray-900 mt-2">
                                  <span className="font-semibold">Claim:</span> "{factChecks[currentFactIndex].claim}"
                                </p>
                                <p className="text-red-600 mt-2">
                                  <span className="font-semibold">Correction:</span> {factChecks[currentFactIndex].correction}
                                </p>
                                <a 
                                  href={factChecks[currentFactIndex].sourceUrl} 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                                >
                                  Source: {factChecks[currentFactIndex].source}
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Overlaid Navigation Buttons */}
                        <button
                          onClick={prevFact}
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity"
                          aria-label="Previous fact"
                        >
                          <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={nextFact}
                          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity"
                          aria-label="Next fact"
                        >
                          <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Progress Indicators and Counter */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex justify-center gap-1.5">
                          {factChecks.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setSlideDirection(index > currentFactIndex ? 'right' : 'left');
                                setCurrentFactIndex(index);
                              }}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                index === currentFactIndex 
                                  ? 'bg-blue-600 w-6' 
                                  : 'bg-gray-300 w-1.5 hover:bg-gray-400'
                              }`}
                              aria-label={`Go to fact ${index + 1}`}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-gray-500">
                          Fact {currentFactIndex + 1} of {factChecks.length}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Bottom Section - Audio Summary */}
              <div className="bg-gray-50 p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Audio Context Summary</h2>
                {isAudioLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
                  </div>
                ) : audioComplete ? (
                  <div className="space-y-4">
                    {audioSummary.map((point, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="text-gray-900 prose prose-strong:text-gray-900" dangerouslySetInnerHTML={{ __html: point }} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
