'use client';

import type React from 'react';
import { useState, useCallback, useTransition } from 'react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Upload, X, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteImage, uploadImage } from '@/actions/supabase';
import { updateCompanyLogo } from '@/actions/company';
import { logCompanyLogoUpdated } from '@/actions/audit/audit-company';
import { UpdateLogoDialogProps } from '@/types/company';

const imageProps = {
    bucket: 'logos',
    type: 'COMPANY'
};

export function UpdateLogoDialog({
    open,
    onOpenChange,
    currentLogo,
    userSession
}: UpdateLogoDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [logoPreview, setLogoPreview] = useState<string | null>(
        currentLogo || null
    );
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [imageId, setImageId] = useState('');

    const handleFileSelect = useCallback(
        async (file: File) => {
            if (!file.type.startsWith('image/')) {
                toast.error('Invalid file type', {
                    description:
                        'Please select an image file (PNG, JPG, GIF, etc.)'
                });
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error('File too large', {
                    description: 'Please select an image smaller than 5MB'
                });
                return;
            }

            try {
                // Simulate file reading progress
                const reader = new FileReader();

                reader.onload = async () => {
                    try {
                        // Create FormData for server action
                        const formData = new FormData();
                        formData.append('image', file);
                        formData.append('bucket', imageProps.bucket);
                        formData.append('type', imageProps.type);

                        // Call server action
                        const result = await uploadImage(formData);

                        if (result.error) {
                            console.log(result.error);
                            toast.error(
                                'Failed to update logo. Please try again.'
                            );
                        } else if (result.success && result.publicUrl) {
                            // Update form with the returned URL
                            setImageId(result.imageId);
                            setLogoPreview(result.publicUrl);
                            setSelectedFile(file);
                        }
                    } catch (uploadError) {
                        console.log(uploadError);
                        toast.error('Failed to update logo. Please try again.');
                    }
                };

                reader.onerror = () => {
                    toast.error('Failed to update logo. Please try again.');
                };

                reader.readAsArrayBuffer(file);
            } catch (error) {
                console.error('Upload failed:', error);
                toast.error('Failed to update logo. Please try again.');
            }
        },
        [imageProps.bucket]
    );

    // const handleFileSelect = (file: File) => {
    //     // Validate file type
    //     if (!file.type.startsWith('image/')) {
    //         toast.error('Invalid file type', {
    //             description: 'Please select an image file (PNG, JPG, GIF, etc.)'
    //         });
    //         return;
    //     }

    //     // Validate file size (5MB limit)
    //     if (file.size > 5 * 1024 * 1024) {
    //         toast.error('File too large', {
    //             description: 'Please select an image smaller than 5MB'
    //         });
    //         return;
    //     }

    //     setSelectedFile(file);
    //     const reader = new FileReader();
    //     reader.onload = (e) => {
    //         setLogoPreview(e.target?.result as string);
    //     };
    //     reader.readAsDataURL(file);
    // };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragOver(false);

        const file = event.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragOver(false);
    };

    const removeLogo = () => {
        setLogoPreview(null);
        setSelectedFile(null);
        setImageId('removedLogo');
    };

    const handleSave = async () => {
        startTransition(async () => {
            const data = await updateCompanyLogo(imageId);
            if (data.error) {
                toast.error(data.error);
            }
            if (data.data) {
                if (userSession) {
                    await logCompanyLogoUpdated(userSession.user.id, {
                        companyId: data.data.id,
                        imageId
                    });
                }
                onOpenChange(false);
                toast.success('Logo successfully updated');
            }
        });

        // onOpenChange(false);
    };

    const handleCancel = () => {
        onOpenChange(false);
        setSelectedFile(null);
        setImageId('');
        setLogoPreview(currentLogo || null);
    };

    const hasChanges = selectedFile !== null || logoPreview !== currentLogo;

    return (
        <Dialog open={open} onOpenChange={handleCancel}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Update Company Logo
                    </DialogTitle>
                    <DialogDescription>
                        Upload a new logo or remove the current one. Recommended
                        size: 200x200px or larger.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Current Logo Preview */}
                    <div className="flex justify-center">
                        {logoPreview ? (
                            <div className="relative group">
                                <Image
                                    src={
                                        logoPreview ||
                                        '/images/assets/placeholder.svg'
                                    }
                                    alt="Company logo preview"
                                    width={128}
                                    height={128}
                                    className="w-32 h-32 rounded-xl object-cover border-2 border-border shadow-sm"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={removeLogo}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="w-32 h-32 border-2 border-dashed border-muted-foreground/25 rounded-xl flex items-center justify-center bg-muted/50">
                                <div className="text-center">
                                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        No logo
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Upload Area */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                            isDragOver
                                ? 'border-primary bg-primary/5'
                                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                        }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                        <div className="space-y-2">
                            <p className="text-sm font-medium">
                                Drag and drop your logo here, or{' '}
                                <Button
                                    type="button"
                                    variant="link"
                                    className="p-0 h-auto text-primary"
                                    onClick={() =>
                                        document
                                            .getElementById('logo-file-input')
                                            ?.click()
                                    }
                                >
                                    browse files
                                </Button>
                            </p>
                            <p className="text-xs text-muted-foreground">
                                PNG, JPG, GIF up to 5MB • Recommended: 200x200px
                                or larger
                            </p>
                        </div>
                        <input
                            id="logo-file-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 bg-transparent"
                            onClick={() =>
                                document
                                    .getElementById('logo-file-input')
                                    ?.click()
                            }
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Choose File
                        </Button>
                        {logoPreview && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={removeLogo}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Remove
                            </Button>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isPending || !hasChanges}
                    >
                        {isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
