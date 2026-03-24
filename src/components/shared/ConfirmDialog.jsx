import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  open,
  title = 'Confirm Action',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  const variantConfig = {
    default: { icon: AlertTriangle, iconColor: 'text-yellow-600', actionVariant: 'default' },
    destructive: { icon: AlertTriangle, iconColor: 'text-red-600', actionVariant: 'destructive' },
  };

  const config = variantConfig[variant] || variantConfig.default;
  const IconComponent = config.icon;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <IconComponent className={`w-6 h-6 ${config.iconColor} flex-shrink-0`} />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
        </AlertDialogHeader>

        {description && (
          <AlertDialogDescription>{description}</AlertDialogDescription>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {isLoading ? 'Please wait...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}