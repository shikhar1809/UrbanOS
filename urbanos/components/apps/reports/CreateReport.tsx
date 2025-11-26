'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Upload, MapPin, AlertCircle, Video, Building2, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useToast } from '@/lib/toast-context';
import { handleError, logError } from '@/lib/error-handler';
import { getAuthoritiesByTypeAndLocation, Authority } from '@/lib/services/authority-tagger';

const LocationPicker = dynamic(() => import('./LocationPicker'), { ssr: false });

interface CreateReportProps {
  onSuccess: () => void;
}

const issueTypes = [
  { value: 'pothole', label: 'Pothole', icon: '🕳️' },
  { value: 'streetlight', label: 'Street Light', icon: '💡' },
  { value: 'garbage', label: 'Garbage/Waste', icon: '🗑️' },
  { value: 'animal_carcass', label: 'Animal Carcass Removal', icon: '🦌' },
  { value: 'cyber', label: 'Cyber Security', icon: '🔒' },
  { value: 'road_safety_hazards', label: 'Road Safety Hazards', icon: '⚠️' },
  { value: 'public_infrastructure', label: 'Public Infrastructure', icon: '🏗️' },
  { value: 'environmental', label: 'Environmental', icon: '🌱' },
  { value: 'health_safety', label: 'Health & Safety', icon: '🏥' },
  { value: 'other', label: 'Other', icon: '📋' },
];

export default function CreateReport({ onSuccess }: CreateReportProps) {
  const { user } = useAuth();
  const [type, setType] = useState<string>('pothole');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string; areaPin?: string } | null>(
    null
  );
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loadingAuthorities, setLoadingAuthorities] = useState(false);
  const { showToast } = useToast();

  // Load authorities when location or type changes
  useEffect(() => {
    if (location && type) {
      loadAuthorities();
    } else {
      setAuthorities([]);
    }
  }, [location, type]);

  const loadAuthorities = async () => {
    if (!location) return;
    
    setLoadingAuthorities(true);
    try {
      const auths = await getAuthoritiesByTypeAndLocation(type, location);
      setAuthorities(auths);
    } catch (err) {
      console.error('Error loading authorities:', err);
    } finally {
      setLoadingAuthorities(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    setImages([...images, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 50 * 1024 * 1024; // 50MB limit
    
    for (const file of files) {
      if (file.size > maxSize) {
        setError(`Video ${file.name} is too large. Maximum size is 50MB.`);
        return;
      }
      if (!file.type.startsWith('video/')) {
        setError(`${file.name} is not a video file.`);
        return;
      }
    }

    setVideos([...videos, ...files]);

    // Create video previews
    files.forEach((file) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setVideoPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
    setVideoPreviews(videoPreviews.filter((_, i) => i !== index));
  };

  const handleLocationSelect = (loc: { lat: number; lng: number; address: string }) => {
    // Add area pin information (extracted from address or user can set)
    setLocation({
      ...loc,
      areaPin: loc.address, // In production, this could be a separate field or extracted differently
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Client-side validation
    if (!title.trim()) {
      setError('Please enter a title for your report');
      return;
    }
    
    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters long');
      return;
    }
    
    if (!description.trim()) {
      setError('Please enter a description for your report');
      return;
    }
    
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }
    
    if (!location) {
      setError('Please select a location on the map');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Ensure user profile exists in public.users
      // This is necessary because reports.user_id references public.users(id)
      let profileExists = false;
      
      try {
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (profileCheckError) {
          // Log but don't throw - we'll try to create the profile anyway
          console.warn('Error checking profile:', profileCheckError);
        } else if (existingProfile) {
          profileExists = true;
        }
      } catch (err) {
        console.warn('Exception checking profile:', err);
      }

      // If profile doesn't exist, create it using the database function
      // This function has SECURITY DEFINER and can bypass RLS
      if (!profileExists) {
        // Extract user information from auth user
        const userEmail = user.email || user.user_metadata?.email || '';
        const userName = user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.user_metadata?.display_name ||
                        (userEmail ? userEmail.split('@')[0] : 'User');

        if (!userEmail) {
          throw new Error('User email is required. Please sign in again.');
        }

        // Use the database function to create the profile
        // This function has SECURITY DEFINER and can bypass RLS
        const { error: createProfileError } = await supabase.rpc('create_user_profile', {
          p_user_id: user.id,
          p_email: userEmail,
          p_full_name: userName || null,
          p_role: 'citizen',
        });

        if (createProfileError) {
          // Log full error details for debugging
          console.error('Failed to create user profile:', {
            code: createProfileError.code,
            message: createProfileError.message,
            details: createProfileError.details,
            hint: createProfileError.hint,
            user_id: user.id,
            user_email: userEmail,
          });
          logError(createProfileError, 'CreateReport.createProfile');
          
          // Provide more helpful error message
          let errorMsg = 'Failed to create user profile. ';
          if (createProfileError.code === '42501') {
            errorMsg += 'Permission denied. Please contact support.';
          } else if (createProfileError.code === '23503') {
            errorMsg += 'User not found in authentication system. Please sign in again.';
          } else if (createProfileError.message) {
            errorMsg += createProfileError.message;
          } else {
            errorMsg += 'Please try again or contact support.';
          }
          throw new Error(errorMsg);
        } else {
          console.log('User profile created successfully');
        }
      }

      // Upload images
      const imageUrls: string[] = [];
      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('report-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('report-images').getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      // Upload videos
      const videoUrls: string[] = [];
      for (const video of videos) {
        const fileExt = video.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('report-videos')
          .upload(fileName, video);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('report-videos').getPublicUrl(fileName);

        videoUrls.push(publicUrl);
      }

      // Get authority IDs for auto-tagging
      const authorityIds = authorities.map((a) => a.id);

      // Create report with enhanced location (includes areaPin)
      const locationWithAreaPin = {
        ...location,
        areaPin: location.areaPin || location.address,
      };

      const { error: insertError } = await supabase.from('reports').insert({
        user_id: user.id,
        type,
        title,
        description,
        location: locationWithAreaPin,
        images: imageUrls,
        videos: videoUrls,
        authority_ids: authorityIds,
        source: 'web',
      });

      if (insertError) throw insertError;

      // Reset form
      setType('pothole');
      setTitle('');
      setDescription('');
      setLocation(null);
      setImages([]);
      setPreviews([]);
      setVideos([]);
      setVideoPreviews([]);
      setAuthorities([]);
      showToast('Report submitted successfully!', 'success');
      onSuccess();
    } catch (err: any) {
      logError(err, 'CreateReport.handleSubmit');
      const errorInfo = handleError(err);
      setError(errorInfo.message);
      showToast(errorInfo.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Issue Type */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Issue Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {issueTypes.map((issueType) => (
              <label key={issueType.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={issueType.value}
                  checked={type === issueType.value}
                  onChange={(e) => {
                    setType(e.target.value);
                    if (error) setError('');
                  }}
                  className="sr-only peer"
                />
                <div className="p-4 bg-foreground/5 border-2 border-foreground/10 rounded-xl peer-checked:border-windows-blue peer-checked:bg-windows-blue/10 transition-all hover:bg-foreground/10 text-center">
                  <div className="text-3xl mb-2">{issueType.icon}</div>
                  <div className="text-sm font-medium">{issueType.label}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            className="w-full px-4 py-3 bg-foreground/5 border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-windows-blue"
            placeholder="Brief description of the issue"
            required
            aria-required="true"
            aria-label="Report title"
            minLength={3}
            maxLength={100}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (error) setError('');
            }}
            className="w-full px-4 py-3 bg-foreground/5 border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-windows-blue h-32 resize-none"
            placeholder="Provide more details about the issue..."
            required
            aria-required="true"
            aria-label="Report description"
            minLength={10}
            maxLength={500}
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Location <span className="text-foreground/50">(Click on map to set location)</span>
          </label>
          <LocationPicker onLocationSelect={handleLocationSelect} />
          {location && (
            <div className="mt-2 flex items-center gap-2 text-sm text-foreground/70">
              <MapPin className="w-4 h-4" />
              <span>{location.address}</span>
              {location.areaPin && (
                <span className="text-foreground/50">• Area: {location.areaPin}</span>
              )}
            </div>
          )}
        </div>

        {/* Authority Auto-tagging Preview */}
        {location && (
          <div className="bg-windows-blue/5 border-2 border-windows-blue/20 rounded-lg p-4">
            <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-windows-blue" />
              <span>Relevant Authorities (Auto-tagged)</span>
            </label>
            {loadingAuthorities ? (
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <Loader2 className="w-4 h-4 animate-spin text-windows-blue" />
                <span>Loading authorities for this location...</span>
              </div>
            ) : authorities.length > 0 ? (
              <div className="space-y-3">
                <div className="grid gap-2">
                  {authorities.map((auth) => (
                    <div key={auth.id} className="bg-white/50 border border-foreground/10 rounded-lg p-3 flex items-start gap-3">
                      <Building2 className="w-4 h-4 text-windows-blue flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-foreground">{auth.name}</div>
                        <div className="text-xs text-foreground/60 mt-1">
                          <span className="inline-block px-2 py-0.5 bg-windows-blue/10 text-windows-blue rounded mr-2">
                            {auth.type}
                          </span>
                          <span>{auth.email}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-foreground/60 mt-3 pt-3 border-t border-foreground/10">
                  <strong>Note:</strong> These authorities will be automatically notified when your report reaches 50 upvotes and becomes a community report.
                </p>
              </div>
            ) : (
              <div className="bg-foreground/5 border border-foreground/10 rounded-lg p-3 text-sm text-foreground/70">
                <p className="mb-1">No authorities found for this location.</p>
                <p className="text-xs text-foreground/50">The report will still be submitted and may be manually assigned to relevant authorities.</p>
              </div>
            )}
          </div>
        )}

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Photos (Optional, max 5)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {previews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="aspect-square border-2 border-dashed border-foreground/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-windows-blue hover:bg-windows-blue/5 transition-colors">
                <Upload className="w-8 h-8 text-foreground/50 mb-2" />
                <span className="text-xs text-foreground/50">Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  multiple
                />
              </label>
            )}
          </div>
        </div>

        {/* Videos */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Videos (Optional, max 50MB each)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {videoPreviews.map((preview, index) => (
              <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-foreground/5">
                <video
                  src={preview}
                  className="w-full h-full object-cover"
                  controls
                />
                <button
                  type="button"
                  onClick={() => removeVideo(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
            <label className="aspect-video border-2 border-dashed border-foreground/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-windows-blue hover:bg-windows-blue/5 transition-colors">
              <Video className="w-8 h-8 text-foreground/50 mb-2" />
              <span className="text-xs text-foreground/50">Add Video</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
                multiple
              />
            </label>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !location}
          className="w-full py-4 bg-windows-blue text-white rounded-lg font-semibold hover:bg-windows-blue-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Report'
          )}
        </button>
      </form>
    </div>
  );
}
