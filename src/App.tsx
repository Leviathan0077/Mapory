import { useState, useEffect } from "react";
import { Plus, Search, LogOut } from "lucide-react";
import Map from "./components/Map";
import MemoryForm from "./components/MemoryForm";
import MemoryDisplay from "./components/MemoryDisplay";
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
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedMemories: Memory[] = data.map((memory) => ({
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
      }));

      setMemories(formattedMemories);
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

  const handleMemoryClick = (memory: Memory) => {
    setSelectedMemory(memory);
  };

  const handleCreateMemory = async (data: CreateMemoryData) => {
    if (!user) return;

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

        const { error: uploadError } = await supabase.storage
          .from("memory-media")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("memory-media").getPublicUrl(filePath);

        mediaUrls.push(publicUrl);
      }

      // Create memory record
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

      if (error) throw error;

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
            <button
              onClick={() => setShowMemoryForm(true)}
              className="btn btn-primary"
            >
              <Plus size={16} />
              New Memory
            </button>
            <button onClick={handleSignOut} className="btn btn-secondary">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
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
          isOwner={selectedMemory.userId === user.id}
        />
      )}
    </div>
  );
}

export default App;
