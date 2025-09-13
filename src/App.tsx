import { useState, useEffect } from "react";
import { Plus, Search, LogOut, MapPin } from "lucide-react";
import Map from "./components/Map";
import MemoryForm from "./components/MemoryForm";
import MemoryDisplay from "./components/MemoryDisplay";
import LocationPermission from "./components/LocationPermission";
import type { Memory, Location, CreateMemoryData, MapViewport } from "./types";
import { supabase } from "./lib/supabase";
import "./App.css";

function App() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [showMemoryForm, setShowMemoryForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [viewport, setViewport] = useState<MapViewport>({
    latitude: 40.7128,
    longitude: -74.006,
    zoom: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTags] = useState<string[]>([]);
  const [showLocationPermission, setShowLocationPermission] = useState(false);

  // Initialize user session
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load memories
  useEffect(() => {
    loadMemories();
  }, [user]);

  const loadMemories = async () => {
    if (!user) return;

    try {
      // First, get all memories
      const { data: memoriesData, error: memoriesError } = await supabase
        .from("memories")
        .select("*")
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .order("created_at", { ascending: false });

      if (memoriesError) throw memoriesError;

      if (!memoriesData || memoriesData.length === 0) {
        setMemories([]);
        return;
      }

      // Get all memory IDs
      const memoryIds = memoriesData.map((m) => m.id);

      // Get like counts for all memories at once
      const { data: likesData, error: likesError } = await supabase
        .from("memory_likes")
        .select("memory_id, user_id")
        .in("memory_id", memoryIds);

      if (likesError) {
        console.error("Error loading likes:", likesError);
        // Continue without likes data
      }

      // Process the data
      const memoriesWithLikes = memoriesData.map((memory) => {
        // Count likes for this memory
        const likeCount =
          likesData?.filter((like) => like.memory_id === memory.id).length || 0;

        // Check if current user liked this memory
        const isLikedByUser =
          likesData?.some(
            (like) => like.memory_id === memory.id && like.user_id === user.id
          ) || false;

        return {
          id: memory.id,
          title: memory.title,
          description: memory.description,
          location: {
            latitude: memory.latitude,
            longitude: memory.longitude,
            address: memory.address,
            city: memory.city,
            country: memory.country,
          },
          mediaUrls: memory.media_urls,
          tags: memory.tags,
          isPublic: memory.is_public,
          userId: memory.user_id,
          createdAt: memory.created_at,
          updatedAt: memory.updated_at,
          likeCount,
          isLikedByUser,
        };
      });

      setMemories(memoriesWithLikes);
    } catch (error) {
      console.error("Error loading memories:", error);
    }
  };

  const handleMapClick = (coordinates: [number, number]) => {
    setSelectedLocation({
      latitude: coordinates[1],
      longitude: coordinates[0],
    });
    setShowMemoryForm(true);
  };

  const handleNewMemoryClick = () => {
    setShowLocationPermission(true);
  };

  const handleLocationGranted = (location: Location) => {
    setSelectedLocation(location);
    setShowLocationPermission(false);
    setShowMemoryForm(true);
  };

  const handleLocationDenied = () => {
    setShowLocationPermission(false);
    setShowMemoryForm(true);
  };

  const handleMemoryClick = (memory: Memory) => {
    setSelectedMemory(memory);
  };

  const handleCreateMemory = async (data: CreateMemoryData) => {
    if (!user) {
      console.error("No user found when creating memory");
      return;
    }

    console.log("Creating memory for user:", user.id);
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    console.log("User session:", sessionData);

    if (sessionError || !sessionData.session) {
      console.error("No valid session found:", sessionError);
      alert("Please sign in again to create memories.");
      return;
    }

    setIsLoading(true);
    try {
      // Upload media files to Supabase Storage
      const mediaUrls: string[] = [];
      for (const file of data.mediaFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;
        const filePath = `memories/${user.id}/${fileName}`;
        console.log("Uploading file to path:", filePath);

        console.log("Attempting to upload file:", {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          filePath: filePath,
          bucketName: "memory-media",
        });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("memory-media")
          .upload(filePath, file);

        console.log("Upload response:", { uploadData, uploadError });

        if (uploadError) {
          console.error("Storage upload error details:", {
            message: uploadError.message,
            statusCode: uploadError.statusCode,
            error: uploadError.error,
            details: uploadError,
          });
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("memory-media").getPublicUrl(filePath);

        mediaUrls.push(publicUrl);
      }

      // Create memory record
      console.log("Inserting memory with data:", {
        title: data.title,
        description: data.description,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        address: data.location.address,
        city: data.location.city,
        country: data.location.country,
        media_urls: mediaUrls,
        tags: data.tags,
        is_public: data.isPublic,
        user_id: user.id,
      });

      const { data: newMemory, error } = await supabase
        .from("memories")
        .insert({
          title: data.title,
          description: data.description,
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          address: data.location.address,
          city: data.location.city,
          country: data.location.country,
          media_urls: mediaUrls,
          tags: data.tags,
          is_public: data.isPublic,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Database error details:", error);
        throw error;
      }

      // Add to local state
      const formattedMemory: Memory = {
        id: newMemory.id,
        title: newMemory.title,
        description: newMemory.description,
        location: {
          latitude: newMemory.latitude,
          longitude: newMemory.longitude,
          address: newMemory.address,
          city: newMemory.city,
          country: newMemory.country,
        },
        mediaUrls: newMemory.media_urls,
        tags: newMemory.tags,
        isPublic: newMemory.is_public,
        userId: newMemory.user_id,
        createdAt: newMemory.created_at,
        updatedAt: newMemory.updated_at,
      };

      setMemories((prev) => [formattedMemory, ...prev]);
      setShowMemoryForm(false);
      setSelectedLocation(null);
    } catch (error) {
      console.error("Error creating memory:", error);
      alert("Failed to create memory. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!confirm("Are you sure you want to delete this memory?")) return;

    try {
      const { error } = await supabase
        .from("memories")
        .delete()
        .eq("id", memoryId);

      if (error) throw error;

      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
      setSelectedMemory(null);
    } catch (error) {
      console.error("Error deleting memory:", error);
      alert("Failed to delete memory. Please try again.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleLikeMemory = async (memoryId: string) => {
    if (!user) {
      console.error("No user found when trying to like memory");
      return;
    }

    console.log("Attempting to like memory:", memoryId);
    console.log("Current user:", user.id);

    try {
      const memory = memories.find((m) => m.id === memoryId);
      if (!memory) {
        console.error("Memory not found:", memoryId);
        return;
      }

      console.log("Memory found:", memory.title);
      console.log("Currently liked by user:", memory.isLikedByUser);

      if (memory.isLikedByUser) {
        // Unlike the memory
        console.log("Unliking memory...");
        const { error } = await supabase
          .from("memory_likes")
          .delete()
          .eq("memory_id", memoryId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error unliking memory:", error);
          throw error;
        }

        console.log("Successfully unliked memory");

        // Update local state
        setMemories((prev) => {
          const updated = prev.map((m) =>
            m.id === memoryId
              ? {
                  ...m,
                  isLikedByUser: false,
                  likeCount: Math.max(0, (m.likeCount || 0) - 1),
                }
              : m
          );
          console.log(
            "Updated memories:",
            updated.find((m) => m.id === memoryId)
          );

          // Update selectedMemory if it's the one being unliked
          if (selectedMemory && selectedMemory.id === memoryId) {
            const updatedMemory = updated.find((m) => m.id === memoryId);
            if (updatedMemory) {
              console.log("Updating selected memory:", updatedMemory);
              setSelectedMemory(updatedMemory);
            }
          }

          return updated;
        });
      } else {
        // Like the memory
        console.log("Liking memory...");
        const { error } = await supabase.from("memory_likes").insert({
          memory_id: memoryId,
          user_id: user.id,
        });

        if (error) {
          console.error("Error liking memory:", error);
          throw error;
        }

        console.log("Successfully liked memory");

        // Update local state
        setMemories((prev) => {
          const updated = prev.map((m) =>
            m.id === memoryId
              ? {
                  ...m,
                  isLikedByUser: true,
                  likeCount: (m.likeCount || 0) + 1,
                }
              : m
          );
          console.log(
            "Updated memories:",
            updated.find((m) => m.id === memoryId)
          );

          // Update selectedMemory if it's the one being liked
          if (selectedMemory && selectedMemory.id === memoryId) {
            const updatedMemory = updated.find((m) => m.id === memoryId);
            if (updatedMemory) {
              console.log("Updating selected memory:", updatedMemory);
              setSelectedMemory(updatedMemory);
            }
          }

          return updated;
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("Failed to like memory. Please check the console for details.");
    }
  };

  // Filter memories based on search and tags
  const filteredMemories = memories.filter((memory) => {
    const matchesSearch =
      searchQuery === "" ||
      memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTags =
      filterTags.length === 0 ||
      (memory.tags && filterTags.some((tag) => memory.tags!.includes(tag)));

    return matchesSearch && matchesTags;
  });

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Augmented Memories</h1>
          <p>Sign in to start creating your memory scrapbook</p>
          <button
            onClick={() =>
              supabase.auth.signInWithOAuth({ provider: "google" })
            }
            className="btn btn-primary"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>Augmented Memories</h1>
          <div className="header-actions">
            <div className="search-container">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button onClick={handleNewMemoryClick} className="btn btn-primary">
              <Plus size={16} />
              New Memory
            </button>
            <button onClick={handleSignOut} className="btn btn-secondary">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <main className="app-main-split">
        {/* Left Sidebar */}
        <aside className="app-sidebar">
          <div className="sidebar-section">
            <h3>Your Memories</h3>
            <div className="memories-list">
              {filteredMemories.map((memory) => (
                <div
                  key={memory.id}
                  className={`memory-item ${
                    selectedMemory?.id === memory.id ? "active" : ""
                  }`}
                  onClick={() => handleMemoryClick(memory)}
                >
                  <div className="memory-item-title">{memory.title}</div>
                  <div className="memory-item-meta">
                    <div className="memory-item-date">
                      {new Date(memory.createdAt).toLocaleDateString()}
                    </div>
                    <div className="memory-item-stats">
                      <div className="memory-likes">
                        ❤️ {memory.likeCount || 0}
                      </div>
                      {memory.tags && memory.tags.length > 0 && (
                        <div className="memory-item-tags">
                          {memory.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="memory-tag">
                              {tag}
                            </span>
                          ))}
                          {memory.tags.length > 2 && (
                            <span className="memory-tag">
                              +{memory.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredMemories.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "#64748b",
                    padding: "2rem 0",
                  }}
                >
                  No memories yet. Click on the map to create your first memory!
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Right Content - Map */}
        <div className="app-content">
          <div className="map-container">
            <Map
              memories={filteredMemories}
              onMemoryClick={handleMemoryClick}
              onMapClick={handleMapClick}
              selectedMemoryId={selectedMemory?.id}
              viewport={viewport}
              onViewportChange={setViewport}
            />
          </div>
        </div>
      </main>

      {/* Memory Form Modal */}
      {showMemoryForm && (
        <MemoryForm
          onSubmit={handleCreateMemory}
          onCancel={() => {
            setShowMemoryForm(false);
            setSelectedLocation(null);
          }}
          selectedLocation={selectedLocation}
          isLoading={isLoading}
        />
      )}

      {/* Memory Display Modal */}
      {selectedMemory && (
        <MemoryDisplay
          memory={selectedMemory}
          onClose={() => setSelectedMemory(null)}
          onDelete={handleDeleteMemory}
          onLike={handleLikeMemory}
          isOwner={selectedMemory.userId === user.id}
        />
      )}

      {/* Location Permission Modal */}
      <LocationPermission
        isVisible={showLocationPermission}
        onLocationGranted={handleLocationGranted}
        onLocationDenied={handleLocationDenied}
      />
    </div>
  );
}

export default App;
