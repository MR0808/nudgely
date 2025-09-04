'use client';

import { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteImage, uploadImage } from '@/actions/supabase';
import Image from 'next/image';

interface ImageUploadProps {
    name?: string;
    bucket?: string;
    type?: string;
    setUrl: React.Dispatch<React.SetStateAction<string>>;
    url: string;
}

type ProgressStage = 'preparing' | 'uploading' | 'complete' | 'error';

interface ProgressState {
    stage: ProgressStage;
    percentage: number;
    message: string;
}

const ImageUploadField = ({
    name = 'image',
    bucket = 'images',
    type = 'COMPANY',
    setUrl,
    url
}: ImageUploadProps) => {
    const { setValue, watch } = useFormContext();
    const value = watch(name);

    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState<ProgressState>({
        stage: 'preparing',
        percentage: 0,
        message: 'Preparing...'
    });
    const [error, setError] = useState<string | null>(null);

    const simulateUploadProgress = useCallback(() => {
        let currentProgress = 20; // Start after file preparation

        const interval = setInterval(() => {
            currentProgress += Math.random() * 15 + 5; // Random increment between 5-20%

            if (currentProgress >= 95) {
                currentProgress = 95;
                clearInterval(interval);
            }

            setProgress({
                stage: 'uploading',
                percentage: Math.min(currentProgress, 95),
                message: 'Uploading to server...'
            });
        }, 200);

        return interval;
    }, []);

    const handleFile = useCallback(
        async (file: File) => {
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }

            setIsUploading(true);
            setError(null);

            // Stage 1: File preparation with real progress
            setProgress({
                stage: 'preparing',
                percentage: 0,
                message: 'Preparing file...'
            });

            try {
                // Simulate file reading progress
                const reader = new FileReader();

                reader.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const percentLoaded = Math.round(
                            (e.loaded / e.total) * 20
                        ); // 0-20% for preparation
                        setProgress({
                            stage: 'preparing',
                            percentage: percentLoaded,
                            message: 'Reading file...'
                        });
                    }
                };

                reader.onload = async () => {
                    // Stage 2: Start upload simulation
                    const progressInterval = simulateUploadProgress();

                    try {
                        // Create FormData for server action
                        const formData = new FormData();
                        formData.append('image', file);
                        formData.append('bucket', bucket);
                        formData.append('type', type);

                        // Call server action
                        const result = await uploadImage(formData);

                        // Clear progress simulation
                        clearInterval(progressInterval);

                        if (result.error) {
                            setProgress({
                                stage: 'error',
                                percentage: 0,
                                message: result.error
                            });
                            setError(result.error);
                        } else if (result.success && result.publicUrl) {
                            // Stage 3: Complete
                            setProgress({
                                stage: 'complete',
                                percentage: 100,
                                message: 'Upload complete!'
                            });

                            // Update form with the returned URL
                            setValue(name, result.imageId);
                            setUrl(result.publicUrl);

                            // Clear progress after a short delay
                            setTimeout(() => {
                                setProgress({
                                    stage: 'preparing',
                                    percentage: 0,
                                    message: 'Preparing...'
                                });
                            }, 1500);
                            console.log(url);
                        }
                    } catch (uploadError) {
                        clearInterval(progressInterval);
                        const errorMessage = 'Upload failed. Please try again.';
                        setProgress({
                            stage: 'error',
                            percentage: 0,
                            message: errorMessage
                        });
                        setError(errorMessage);
                    }
                };

                reader.onerror = () => {
                    setError('Failed to read file');
                    setProgress({
                        stage: 'error',
                        percentage: 0,
                        message: 'Failed to read file'
                    });
                };

                reader.readAsArrayBuffer(file);
            } catch (error) {
                console.error('Upload failed:', error);
                setError('Upload failed. Please try again.');
                setProgress({
                    stage: 'error',
                    percentage: 0,
                    message: 'Upload failed'
                });
            } finally {
                setIsUploading(false);
            }
        },
        [bucket, simulateUploadProgress, setValue, name]
    );

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleFile(files[0]);
            }
        },
        [handleFile]
    );

    const handleRemove = useCallback(async () => {
        const data = await deleteImage(url, bucket, value);
        if (data.success) {
            setError(null);
            setUrl('');
            setValue(name, '');
        }
    }, [setValue, name, url]);

    // Show uploaded image if we have a URL and not uploading
    if (url && !isUploading) {
        return (
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Image
                        src={url || '/images/assets/placeholder.svg'}
                        alt="Uploaded image"
                        width={200}
                        height={200}
                        className="rounded-lg object-cover border border-border"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 cursor-pointer"
                        onClick={handleRemove}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted">
                <Upload className="w-6 h-6 text-muted-foreground" />
            </div>

            <div className="flex flex-col items-center space-y-2">
                {isUploading ? (
                    <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className="text-sm text-gray-600">
                            {progress.message}
                        </p>
                    </>
                ) : (
                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                            id="logo-upload"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                !isUploading &&
                                document.getElementById('logo-upload')?.click()
                            }
                            className="border-border cursor-point"
                        >
                            Upload Logo
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG up to 5MB
                        </p>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && !isUploading && (
                <div className="text-xs text-red-600 text-center flex items-center justify-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                </div>
            )}
        </div>
    );
};

export default ImageUploadField;
