"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, Link as LinkIcon, User, Settings } from "lucide-react";
import Link from "next/link";
import { ProfileSettingsDialog } from "@/components/ProfileSettingsDialog";

interface UserProfile {
  id: string;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  backgroundImage: string | null;
  customPagePath: string | null;
  createdAt: string;
  posts: {
    id: string;
    title: string;
    createdAt: string;
    board: {
      name: string;
      slug: string;
    }
  }[];
}

export default function UserProfilePage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bingImage, setBingImage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // Get current user from local storage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

  useEffect(() => {
    if (searchParams.get("settings") === "true" && currentUser && currentUser.id === id) {
      setIsSettingsOpen(true);
    }
  }, [searchParams, currentUser, id]);

  const fetchProfile = () => {
    if (id) {
      api.get(`/users/${id}/profile`)
        .then((res) => {
          setProfile(res.data.data);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  useEffect(() => {
    if (profile && !profile.backgroundImage) {
      api.get('/misc/bing-daily-image')
        .then(res => {
          if(res.data.success) setBingImage(res.data.data.url);
        })
        .catch(err => console.error("Failed to fetch Bing image", err));
    }
  }, [profile]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!profile) return <div className="p-8 text-center">User not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header / Background */}
      <div className="h-48 md:h-64 bg-gray-300 relative overflow-hidden">
        {profile.backgroundImage ? (
          <img 
            src={`http://localhost:3000${profile.backgroundImage}`} 
            alt="Background" 
            className="w-full h-full object-cover"
          />
        ) : bingImage ? (
           <img 
            src={bingImage} 
            alt="Bing Daily Background" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500" />
        )}
      </div>

      <div className="container mx-auto px-4 max-w-4xl -mt-16 relative z-10">
        <Card className="">
          <CardContent className="pt-6 pb-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              
              {/* Avatar */}
              <div className="relative -mt-16 md:-mt-20 border-4 border-white rounded-full bg-white">
                <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-200">
                  {profile.avatar ? (
                    <img 
                      src={`http://localhost:3000${profile.avatar}`} 
                      alt={profile.username || "User"} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <User className="h-12 w-12" />
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-2 mt-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">{profile.username || "Anonymous User"}</h1>
                    <p className="text-gray-500 text-sm flex items-center mt-1">
                      <CalendarDays className="h-4 w-4 mr-1" />
                      Joined {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {profile.customPagePath && (
                    <Button variant="outline" asChild>
                      <a href={`http://localhost:3000${profile.customPagePath}`} target="_blank" rel="noopener noreferrer">
                        <LinkIcon className="h-4 w-4 mr-2" />
                        View Personal Page
                      </a>
                    </Button>
                  )}
                  
                  {currentUser && currentUser.id === profile.id && (
                    <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      设置
                    </Button>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-gray-700 mt-4 max-w-2xl">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <ProfileSettingsDialog 
            open={isSettingsOpen} 
            onOpenChange={setIsSettingsOpen} 
            initialData={profile}
            onUpdate={fetchProfile}
        />

        {/* Posts */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 px-1">Recent Posts</h2>
          {profile.posts.length > 0 ? (
            <div className="space-y-4">
              {profile.posts.map(post => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link href={`/posts/${post.id}`} className="text-lg font-medium hover:text-blue-600">
                          {post.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {post.board.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8 bg-white rounded-lg border border-dashed">
              No posts yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
