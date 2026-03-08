import { ArrowLeft, X } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  title: string;
  onBack: () => void;
}

export const VideoPlayer = ({ url, title, onBack }: VideoPlayerProps) => {
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <button
          onClick={onBack}
          className="glass w-10 h-10 rounded-full flex items-center justify-center text-foreground tv-focus"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-foreground text-sm font-medium truncate max-w-[60%]">{title}</h2>
        <button
          onClick={onBack}
          className="glass w-10 h-10 rounded-full flex items-center justify-center text-foreground tv-focus"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {isYouTube ? (
        <iframe
          src={url}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
        />
      ) : (
        <video
          src={url}
          className="w-full h-full"
          controls
          autoPlay
          playsInline
        >
          <source src={url} />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
};
