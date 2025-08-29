"use client";

import { ReloadIcon } from "@radix-ui/react-icons";
import { Heart } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type btnSize = "default" | "lg" | "sm";

type SubmitButtonProps = {
    className?: string;
    text?: string;
    size?: btnSize;
    isPending: boolean;
    disabledCheck?: boolean;
};

type FilterButtonProps = {
    className?: string;
    text?: string;
    size?: btnSize;
};

type ProfileButtonProps = {
    text?: string;
    newImage: boolean;
    isPending: boolean;
};

export const SubmitButton = ({
    className = "",
    text = "submit",
    size = "lg",
    isPending,
    disabledCheck = true
}: SubmitButtonProps) => {
    return (
        <Button
            type="submit"
            disabled={isPending || !disabledCheck}
            className={cn("capitalize", className)}
            size={size}
        >
            {isPending ? (
                <>
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    Please wait...
                </>
            ) : (
                text
            )}
        </Button>
    );
};

export const FilterButton = ({
    className = "",
    text = "submit",
    size = "lg"
}: FilterButtonProps) => {
    return (
        <Button
            type="submit"
            className={cn("capitalize", className)}
            size={size}
        >
            {text}
        </Button>
    );
};

export const AuthSubmitButton = ({
    className = "",
    text = "submit",
    size = "lg",
    isPending
}: SubmitButtonProps) => {
    return (
        <Button
            type="submit"
            disabled={isPending}
            className={cn("h-12 w-full rounded-full capitalize", className)}
            size={size}
        >
            {isPending ? (
                <>
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    Please wait...
                </>
            ) : (
                text
            )}
        </Button>
    );
};

export function ProfileButton({
    text = "submit",
    newImage,
    isPending
}: ProfileButtonProps) {
    return (
        <Button type="submit" disabled={!newImage || isPending}>
            {isPending ? (
                <>
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    Please wait...
                </>
            ) : (
                text
            )}
        </Button>
    );
}

export const FavouriteButton = ({ isFavorite }: { isFavorite: boolean }) => {
    const { pending } = useFormStatus();
    return (
        <Button
            type="submit"
            size="icon"
            variant="outline"
            className="hover:bg-primary flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-black bg-white text-lg text-black transition duration-300 ease-in-out hover:border-0 hover:text-white"
        >
            {pending ? (
                <ReloadIcon className="animate-spin" />
            ) : isFavorite ? (
                <Heart fill="black" />
            ) : (
                <Heart />
            )}
        </Button>
    );
};
