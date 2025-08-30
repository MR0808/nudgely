'use client';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTransition, useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage
} from '@/components/ui/form';

import { authClient, useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { ProfilePictureSchema } from '@/schemas/profile';
import Image from 'next/image';
import profile from '@/public/images/assets/profile.jpg';
import { Input } from '@/components/ui/input';
import { ProfileButton } from '@/components/form/Buttons';
import { SessionProps } from '@/types/session';
import { uploadAvatar, deleteAvatar } from '@/actions/supabase';
import { logProfileUpdated } from '@/actions/audit/audit-profile';

const ProfilePictureForm = ({ userSession }: SessionProps) => {
    const { data: currentUser, refetch } = useSession();
    const [user, setUser] = useState(userSession?.user);
    const [newImage, setNewImage] = useState(false);
    const imageRef = useRef<HTMLInputElement | null>(null);
    const [image, setImage] = useState<string | null | undefined>(user?.image);
    const [isPending, startTransition] = useTransition();

    const hasGoogleAccount = userSession?.accounts.some(
        (account) => account.providerId === 'google'
    );

    useEffect(() => {
        if (currentUser && currentUser.user) {
            setUser(currentUser?.user);
        }
    }, [currentUser]);

    const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setImage(URL.createObjectURL(event.target.files[0]));
            setNewImage(true);
        }
    };

    const removeImage = () => {
        setImage(user?.image);
        setNewImage(false);
        if (imageRef.current) imageRef.current.value = '';
    };

    const form = useForm<z.infer<typeof ProfilePictureSchema>>({
        resolver: zodResolver(ProfilePictureSchema)
    });

    const { ref, ...fileRef } = form.register('image');

    const handleClick = () => {
        imageRef.current?.click();
    };

    const onSubmit = (values: z.infer<typeof ProfilePictureSchema>) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('image', values.image[0]);
            formData.append('bucket', 'avatars');
            const image = await uploadAvatar(formData);
            if (user?.image)
                await deleteAvatar({
                    imageUrl: user?.image,
                    bucket: 'avatars'
                });
            await authClient.updateUser({
                image: image.publicUrl,
                fetchOptions: {
                    onError: (ctx) => {
                        toast.error(ctx.error.message);
                    },
                    onSuccess: async () => {
                        refetch();
                        if (user && user.id)
                            await logProfileUpdated(
                                user.id,
                                'user.picture_updated',
                                ['image'],
                                {
                                    updatedFields: {
                                        image: image.publicUrl
                                    }
                                }
                            );
                        toast.success('Profile picture successfully updated');
                        form.reset(values);
                    }
                }
            });
        });
    };

    return (
        <div className="mt-8 border-b border-b-gray-200 pb-8">
            <div className="w-full md:w-3/5 flex flex-col gap-5">
                <div className="flex justify-between">
                    <h3 className="text-base font-semibold">Profile Picture</h3>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="flex flex-row space-x-10 items-center justify-start">
                            <div className="relative h-[120px] max-h-[120px] w-[120px] max-w-[120px] rounded-full border-2 border-solid border-white shadow-[0_8px_24px_0px_rgba(149,157,165,0.2)]">
                                <Image
                                    src={image || profile}
                                    alt={`${user?.name} ${user?.lastName}}`}
                                    fill
                                    className={cn('w-full rounded-full')}
                                />
                                {!hasGoogleAccount && (
                                    <>
                                        <div
                                            className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-[#585C5480] bg-white text-xs leading-7 text-black hover:bg-primary hover:text-white"
                                            onClick={handleClick}
                                        >
                                            <Camera className="h-4 w-4" />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="image"
                                            render={({ field }) => {
                                                return (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                type="file"
                                                                placeholder="shadcn"
                                                                {...fileRef}
                                                                onChange={(
                                                                    event
                                                                ) => {
                                                                    fileRef.onChange(
                                                                        event
                                                                    );
                                                                    onImageChange(
                                                                        event
                                                                    );
                                                                }}
                                                                className="hidden"
                                                                accept="image/*"
                                                                ref={(e) => {
                                                                    ref(e);
                                                                    imageRef.current =
                                                                        e; // you can still assign to ref
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                            {!hasGoogleAccount && (
                                <div className="mt-5 flex flex-col items-center justify-center">
                                    {newImage && (
                                        <div
                                            className="cursor-pointer pb-2 text-sm text-gray-700 hover:underline"
                                            onClick={removeImage}
                                        >
                                            Remove
                                        </div>
                                    )}
                                    <div>
                                        <ProfileButton
                                            text="Save"
                                            newImage={newImage}
                                            isPending={isPending}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
};
export default ProfilePictureForm;
