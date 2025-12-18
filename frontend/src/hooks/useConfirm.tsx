import { useState } from 'react';
import { ConfirmDialog } from '../components/ui/confirm-dialog';

interface UseConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive';
  icon?: React.ReactNode;
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null);
  const [options, setOptions] = useState<UseConfirmOptions>({
    title: '',
  });

  const confirm = (opts: UseConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolveCallback(() => resolve);
    });
  };

  const handleConfirm = () => {
    if (resolveCallback) {
      resolveCallback(true);
      setResolveCallback(null);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (resolveCallback) {
      resolveCallback(false);
      setResolveCallback(null);
    }
    setIsOpen(false);
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title={options.title}
      description={options.description}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      confirmVariant={options.confirmVariant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      icon={options.icon}
    />
  );

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
}
