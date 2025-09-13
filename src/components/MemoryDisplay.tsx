import React, { useState } from "react";
import { format } from "date-fns";
import {
  X,
  MapPin,
  Calendar,
  Tag,
  Eye,
  EyeOff,
  Share2,
  Download,
  Heart,
} from "lucide-react";
import type { Memory } from "../types";

interface MemoryDisplayProps {
  memory: Memory;
  onClose: () => void;
  onEdit?: (memory: Memory) => void;
  onDelete?: (memoryId: string) => void;
  onLike?: (memoryId: string) => void;
  isOwner?: boolean;
}

const MemoryDisplay: React.FC<MemoryDisplayProps> = ({
  memory,
  onClose,
  onEdit,
  onDelete,
  onLike,
  isOwner = false,
}) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nextMedia = () => {
    setCurrentMediaIndex((prev) =>
      prev < memory.mediaUrls.length - 1 ? prev + 1 : 0
    );
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prev) =>
      prev > 0 ? prev - 1 : memory.mediaUrls.length - 1
    );
  };

  const downloadMedia = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareMemory = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: memory.title,
          text: memory.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const currentMedia = memory.mediaUrls[currentMediaIndex];

  return (
    <div className="memory-display-overlay">
      <div className="memory-display">
        <div className="memory-display-header">
          <div className="memory-title-section">
            <h2>{memory.title}</h2>
            <div className="memory-meta">
              <span className="memory-date">
                <Calendar size={14} />
                {format(new Date(memory.createdAt), "MMM dd, yyyy")}
              </span>
              <span className="memory-privacy">
                {memory.isPublic ? (
                  <>
                    <Eye size={14} />
                    Public
                  </>
                ) : (
                  <>
                    <EyeOff size={14} />
                    Private
                  </>
                )}
              </span>
            </div>
          </div>
          <div className="memory-actions">
            <button
              onClick={() => {
                console.log("Like button clicked for memory:", memory.id);
                console.log("onLike function:", onLike);
                onLike?.(memory.id);
              }}
              className={`action-button like-button ${
                memory.isLikedByUser ? "liked" : ""
              }`}
            >
              <Heart
                size={16}
                fill={memory.isLikedByUser ? "currentColor" : "none"}
              />
              {memory.likeCount || 0}
            </button>
            {isOwner && (
              <>
                <button
                  onClick={() => onEdit?.(memory)}
                  className="action-button"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete?.(memory.id)}
                  className="action-button delete"
                >
                  Delete
                </button>
              </>
            )}
            <button onClick={shareMemory} className="action-button">
              <Share2 size={16} />
            </button>
            <button onClick={onClose} className="close-button">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="memory-display-content">
          {/* Media Section */}
          {memory.mediaUrls.length > 0 && (
            <div className="memory-media-section">
              <div className="media-container">
                {currentMedia && (
                  <>
                    {currentMedia.match(/\.(mp4|mov|avi|webm)$/i) ? (
                      <video
                        src={currentMedia}
                        controls
                        className="memory-media"
                        onClick={() => setIsFullscreen(true)}
                      />
                    ) : (
                      <img
                        src={currentMedia}
                        alt={memory.title}
                        className="memory-media"
                        onClick={() => setIsFullscreen(true)}
                      />
                    )}

                    {/* Media Navigation */}
                    {memory.mediaUrls.length > 1 && (
                      <>
                        <button
                          onClick={prevMedia}
                          className="media-nav prev"
                          disabled={memory.mediaUrls.length <= 1}
                        >
                          ‹
                        </button>
                        <button
                          onClick={nextMedia}
                          className="media-nav next"
                          disabled={memory.mediaUrls.length <= 1}
                        >
                          ›
                        </button>
                      </>
                    )}

                    {/* Media Counter */}
                    <div className="media-counter">
                      {currentMediaIndex + 1} / {memory.mediaUrls.length}
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={() =>
                        downloadMedia(
                          currentMedia,
                          `${memory.title}_${currentMediaIndex + 1}`
                        )
                      }
                      className="download-button"
                    >
                      <Download size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* Media Thumbnails */}
              {memory.mediaUrls.length > 1 && (
                <div className="media-thumbnails">
                  {memory.mediaUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentMediaIndex(index)}
                      className={`thumbnail ${
                        index === currentMediaIndex ? "active" : ""
                      }`}
                    >
                      {url.match(/\.(mp4|mov|avi|webm)$/i) ? (
                        <video src={url} className="thumbnail-media" />
                      ) : (
                        <img
                          src={url}
                          alt={`${memory.title} ${index + 1}`}
                          className="thumbnail-media"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {memory.description && (
            <div className="memory-description">
              <p>{memory.description}</p>
            </div>
          )}

          {/* Location */}
          <div className="memory-location">
            <MapPin size={16} />
            <div className="location-info">
              <p className="location-address">
                {memory.location.address ||
                  `${memory.location.latitude.toFixed(
                    4
                  )}, ${memory.location.longitude.toFixed(4)}`}
              </p>
              {memory.location.city && (
                <p className="location-details">
                  {memory.location.city}, {memory.location.country}
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          {memory.tags && memory.tags.length > 0 && (
            <div className="memory-tags">
              <Tag size={16} />
              <div className="tags-list">
                {memory.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && currentMedia && (
        <div
          className="fullscreen-modal"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="fullscreen-content">
            {currentMedia.match(/\.(mp4|mov|avi|webm)$/i) ? (
              <video
                src={currentMedia}
                controls
                autoPlay
                className="fullscreen-media"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={currentMedia}
                alt={memory.title}
                className="fullscreen-media"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <button
              onClick={() => setIsFullscreen(false)}
              className="fullscreen-close"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryDisplay;
