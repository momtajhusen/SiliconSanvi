import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = false,
  loading = false,
  onConfirm,
  children,
}) {
  return (
    <Modal
      open={open}
      onOpenChange={(value) => !loading && onOpenChange(value)}
      title={title}
      description={description}
      className="max-w-md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant={destructive ? 'destructive' : 'default'} size="sm" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
