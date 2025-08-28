export interface EmailVerificationFormProps {
    email: string;
    userId?: string;
}

export interface LogoutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}
