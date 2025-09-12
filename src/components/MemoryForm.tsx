import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, MapPin, Upload, Tag, Eye, EyeOff } from "lucide-react";
import type { CreateMemoryData, Location } from "../types";

interface MemoryFormProps {
  onSubmit: (data: CreateMemoryData) => void;
  onCancel: () => void;
  selectedLocation?: Location | null;
  isLoading?: boolean;
}

const MemoryForm: React.FC<MemoryFormProps> = ({
  onSubmit,
  onCancel,
  selectedLocation,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: "",
    isPublic: false,
  });
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setMediaFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "video/*": [".mp4", ".mov", ".avi", ".webm"],
    },
    multiple: true,
  });

  const removeMediaFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLocation) {
      alert("Please select a location on the map");
      return;
    }

    if (!formData.title.trim()) {
      alert("Please enter a title");
      return;
    }

    const tags = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    onSubmit({
      title: formData.title,
      description: formData.description,
      location: selectedLocation,
      mediaFiles,
      tags: tags.length > 0 ? tags : undefined,
      isPublic: formData.isPublic,
    });
  };

  return (
    <div className="memory-form-overlay">
      <div className="memory-form">
        <div className="memory-form-header">
          <h2>Create New Memory</h2>
          <button onClick={onCancel} className="close-button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="memory-form-content">
          {/* Location Display */}
          <div className="form-group">
            <label className="form-label">
              <MapPin size={16} />
              Location
            </label>
            {selectedLocation ? (
              <div className="location-display">
                <p>
                  {selectedLocation.address ||
                    `${selectedLocation.latitude.toFixed(
                      4
                    )}, ${selectedLocation.longitude.toFixed(4)}`}
                </p>
                {selectedLocation.city && (
                  <p className="location-details">
                    {selectedLocation.city}, {selectedLocation.country}
                  </p>
                )}
              </div>
            ) : (
              <p className="location-placeholder">
                Click on the map to select a location
              </p>
            )}
          </div>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Give your memory a title..."
              className="form-input"
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Tell the story of this memory..."
              className="form-textarea"
              rows={4}
            />
          </div>

          {/* Media Upload */}
          <div className="form-group">
            <label className="form-label">
              <Upload size={16} />
              Photos & Videos
            </label>
            <div
              {...getRootProps()}
              className={`media-dropzone ${isDragActive ? "active" : ""}`}
            >
              <input {...getInputProps()} />
              <div className="dropzone-content">
                <Upload size={32} />
                <p>
                  {isDragActive
                    ? "Drop files here..."
                    : "Drag & drop files here, or click to select"}
                </p>
                <p className="dropzone-hint">Supports images and videos</p>
              </div>
            </div>

            {/* Media Preview */}
            {mediaFiles.length > 0 && (
              <div className="media-preview">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="media-item">
                    <div className="media-info">
                      <span className="media-name">{file.name}</span>
                      <span className="media-size">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMediaFile(index)}
                      className="remove-media"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="form-group">
            <label htmlFor="tags" className="form-label">
              <Tag size={16} />
              Tags
            </label>
            <input
              type="text"
              id="tags"
              value={formData.tags}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tags: e.target.value }))
              }
              placeholder="vacation, family, sunset (comma separated)"
              className="form-input"
            />
          </div>

          {/* Privacy */}
          <div className="form-group">
            <label className="form-label">
              <Eye size={16} />
              Privacy
            </label>
            <div className="privacy-toggle">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, isPublic: !prev.isPublic }))
                }
                className={`toggle-button ${
                  formData.isPublic ? "public" : "private"
                }`}
              >
                {formData.isPublic ? <Eye size={16} /> : <EyeOff size={16} />}
                {formData.isPublic ? "Public" : "Private"}
              </button>
              <p className="privacy-description">
                {formData.isPublic
                  ? "This memory will be visible to other users"
                  : "This memory will only be visible to you"}
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !selectedLocation}
            >
              {isLoading ? "Creating..." : "Create Memory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemoryForm;
