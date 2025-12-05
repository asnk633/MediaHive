"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { File as FileType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, File, Folder, Download, Eye, EyeOff, Users, Globe, AlertCircle, Upload, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FilesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState<FileType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all-filter');
  const [folderFilter, setFolderFilter] = useState<string>('all-folders');
  
  // Upload state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFolder, setUploadFolder] = useState('');
  const [uploadVisibility, setUploadVisibility] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchFiles();
  }, [user, router]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (user) fetchFiles();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, visibilityFilter, folderFilter]);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: '100',
      });

      if (visibilityFilter !== 'all-filter') params.append('visibility', visibilityFilter);
      if (folderFilter !== 'all-folders') params.append('folder', folderFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/files?${params}`);
      if (response.ok) {
        let data = await response.json();
        
        // Filter based on user role
        if (user!.role === 'guest') {
          data = data.filter((f: FileType) => ['all', 'guest'].includes(f.visibility));
        } else if (user!.role === 'team') {
          data = data.filter((f: FileType) => ['all', 'team'].includes(f.visibility));
        }
        
        setFiles(data);
      } else {
        toast.error('Failed to fetch files');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Error loading files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('folder', uploadFolder || '');
      formData.append('visibility', uploadVisibility);

      const response = await fetch('/api/upload/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      toast.success('File uploaded successfully');
      setIsUploadOpen(false);
      setSelectedFile(null);
      setUploadFolder('');
      fetchFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (file: FileType) => {
    try {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = file.fileUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'all': return <Globe className="h-4 w-4" />;
      case 'team': return <Users className="h-4 w-4" />;
      case 'guest': return <Eye className="h-4 w-4" />;
      default: return <EyeOff className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const folders = [...new Set(files.map(f => f.folder).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--text)]">Files</h1>
        {user?.role === 'admin' && (
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Upload Files
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Files</DialogTitle>
                <DialogDescription>
                  Upload files with folder and visibility settings
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>File</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {selectedFile ? selectedFile.name : 'Choose File'}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      Size: {formatFileSize(selectedFile.size)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Folder (optional)</Label>
                  <Input
                    placeholder="e.g., Documents, Images"
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value)}
                    disabled={isUploading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select value={uploadVisibility} onValueChange={setUploadVisibility} disabled={isUploading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All (Public)</SelectItem>
                      <SelectItem value="team">Team Only</SelectItem>
                      <SelectItem value="guest">Guest Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload File
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {folders.length > 0 && (
          <Select value={folderFilter} onValueChange={setFolderFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-folders">All Folders</SelectItem>
              {folders.map(folder => (
                <SelectItem key={folder} value={folder!}>
                  {folder}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-filter">All Visibility</SelectItem>
            <SelectItem value="all">Public</SelectItem>
            <SelectItem value="team">Team Only</SelectItem>
            <SelectItem value="guest">Guest Access</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Files Grid */}
      {files.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No files found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchQuery || visibilityFilter !== 'all-filter' || folderFilter !== 'all-folders'
                ? 'Try adjusting your filters'
                : 'No files available yet'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {files.map(file => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <File className="h-10 w-10 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{file.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(file.fileSize)} • {file.fileType}
                    </p>
                    {file.folder && (
                      <div className="flex items-center gap-1 mt-2">
                        <Folder className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{file.folder}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="text-xs">
                        {getVisibilityIcon(file.visibility)}
                        <span className="ml-1">{file.visibility}</span>
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-xs"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <File className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{files.length}</p>
              <p className="text-sm text-muted-foreground">Total Files</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Folder className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{folders.length}</p>
              <p className="text-sm text-muted-foreground">Folders</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Download className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">
                {formatFileSize(files.reduce((acc, f) => acc + f.fileSize, 0))}
              </p>
              <p className="text-sm text-muted-foreground">Total Size</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}