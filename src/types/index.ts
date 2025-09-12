export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  location: Location;
  mediaUrls: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  tags?: string[];
  isPublic: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface CreateMemoryData {
  title: string;
  description: string;
  location: Location;
  mediaFiles: File[];
  tags?: string[];
  isPublic: boolean;
}

export interface MapMarker {
  id: string;
  coordinates: [number, number];
  memory: Memory;
}

export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
}
