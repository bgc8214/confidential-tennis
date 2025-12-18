import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel?: () => void;
  icon?: ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmText = '확인',
  cancelText = '취소',
  confirmVariant = 'default',
  onConfirm,
  onCancel,
  icon,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          {icon && <div className="mb-4 flex justify-center">{icon}</div>}
          <DialogTitle className="text-xl sm:text-2xl text-center">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-center text-base">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children && <div className="py-4">{children}</div>}
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={handleConfirm}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ActionChoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  choices: {
    label: string;
    description?: string;
    icon?: ReactNode;
    variant?: 'default' | 'outline' | 'destructive';
    onClick: () => void;
  }[];
}

export function ActionChoiceDialog({
  open,
  onOpenChange,
  title,
  description,
  choices,
}: ActionChoiceDialogProps) {
  const handleChoice = (onClick: () => void) => {
    onClick();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-base">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {choices.map((choice, index) => (
            <Button
              key={index}
              variant={choice.variant || 'outline'}
              onClick={() => handleChoice(choice.onClick)}
              className="h-auto py-4 px-6 justify-start text-left"
            >
              <div className="flex items-start gap-4 w-full">
                {choice.icon && (
                  <div className="flex-shrink-0 mt-1">{choice.icon}</div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-base mb-1">{choice.label}</div>
                  {choice.description && (
                    <div className="text-sm text-muted-foreground font-normal">
                      {choice.description}
                    </div>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
