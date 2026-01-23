import { useMemo, useEffect, useRef } from 'react';
import { Reels } from '@sayings/react-reels';
import '@sayings/react-reels/dist/index.css';
import type { YouTubeVideo } from '@/hooks/useYouTubeSearch';

interface YouTubeReelsProps {
  videos: YouTubeVideo[];
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  autoPlay?: boolean;
  className?: string;
}

export function YouTubeReels({
  videos,
  currentIndex,
  onNext,
  onPrevious,
  isMuted = false,
  onToggleMute,
  autoPlay = true,
  className = '',
}: YouTubeReelsProps) {
  // Transform YouTube videos to Reels format
  const reelsData = useMemo(() => {
    return videos.map((video, index) => ({
      id: index,
      reelInfo: {
        url: `https://www.youtube.com/embed/${video.id}?autoplay=${autoPlay ? 1 : 0}&mute=${isMuted ? 1 : 0}&loop=1&playlist=${video.id}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`,
        type: 'video', // Try 'video' type - the package might handle iframe URLs
        description: video.title,
        postedBy: {
          avatar: video.thumbnail || '',
          name: video.channelTitle,
        },
        likes: {
          count: Math.floor(Math.random() * 1000) + 100, // Random likes for demo
        },
        dislikes: {
          count: 0,
        },
        comments: {
          count: Math.floor(Math.random() * 100) + 10, // Random comments for demo
        },
        shares: {
          count: Math.floor(Math.random() * 50) + 5, // Random shares for demo
        },
      },
      rightMenu: {
        options: [
          { id: 1, label: 'Share', value: 'share' },
          { id: 2, label: 'Report', value: 'report' },
        ],
      },
    }));
  }, [videos, autoPlay, isMuted]);

  const reelMetaInfo = useMemo(() => ({
    videoDimensions: {
      height: window.innerHeight,
      width: window.innerWidth,
    },
    backGroundColor: '#000000',
    borderRadius: 0,
    likeActiveColor: '#ef4444',
    dislikeActiveColor: '#3b82f6',
  }), []);

  const handleMenuItemClicked = (event: any) => {
    console.log('Menu item clicked:', event.value);
    if (event.value === 'share') {
      // Handle share
      const currentVideo = videos[currentIndex];
      if (currentVideo) {
        navigator.share?.({
          title: currentVideo.title,
          text: currentVideo.description,
          url: `https://www.youtube.com/watch?v=${currentVideo.id}`,
        }).catch(console.error);
      }
    }
  };

  const handleLikeClicked = (reel: any) => {
    console.log('Like clicked:', reel);
  };

  const handleDislikeClicked = (reel: any) => {
    console.log('Dislike clicked:', reel);
  };

  const handleCommentClicked = (reel: any) => {
    console.log('Comment clicked:', reel);
  };

  const handleShareClicked = (reel: any) => {
    console.log('Share clicked:', reel);
    const videoIndex = reel.id;
    const currentVideo = videos[videoIndex];
    if (currentVideo) {
      navigator.share?.({
        title: currentVideo.title,
        text: currentVideo.description,
        url: `https://www.youtube.com/watch?v=${currentVideo.id}`,
      }).catch(console.error);
    }
  };

  const handleAvatarClicked = (reel: any) => {
    console.log('Avatar clicked:', reel);
  };

  // Sync currentIndex with the Reels component
  useEffect(() => {
    // The Reels component manages its own index, but we can try to sync it
    // Note: The package might not expose a way to control the index externally
    // This is a limitation we'll work with
  }, [currentIndex]);

  if (videos.length === 0) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-black ${className}`}>
        <div className="text-center">
          <p className="text-xl text-white/70 mb-4">No videos available</p>
          <p className="text-sm text-white/50">Search for a song to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full ${className}`} style={{ height: '100%', width: '100%' }}>
      <Reels
        reels={reelsData}
        reelMetaInfo={reelMetaInfo}
        onMenuItemClicked={handleMenuItemClicked}
        onLikeClicked={handleLikeClicked}
        onDislikeClicked={handleDislikeClicked}
        onCommentClicked={handleCommentClicked}
        onShareClicked={handleShareClicked}
        onAvatarClicked={handleAvatarClicked}
      />
    </div>
  );
}
