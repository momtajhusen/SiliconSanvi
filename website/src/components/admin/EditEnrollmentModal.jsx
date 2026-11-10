import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import { FormBanner } from '../ui/FormBanner';
import Field from './Field';
import { ENROLLMENT_STATUSES } from '../../constants/institute';
import { formatTiming, labelize, todayInput, toInputDate } from '../../lib/format';
import { useOpenBatches } from '../../hooks/useAcademics';
import api, { apiError } from '../../lib/api';

function EditForm({ enrollment, batches, onClose, onSaved }) {
  const courseId = enrollment.courseId?.id || enrollment.courseId;
  const currentBatchId = enrollment.batchId?.id || enrollment.batchId || '';
  const options = batches.filter((b) => (b.courseId?.id || b.courseId) === courseId);
  const [form, setForm] = useState({
    status: enrollment.status,
    progressPercentage: enrollment.progressPercentage ?? 0,
    batchId: currentBatchId,
    enrollmentDate: toInputDate(enrollment.enrollmentDate),
    expectedCompletionDate: toInputDate(enrollment.expectedCompletionDate),
    actualCompletionDate: toInputDate(enrollment.actualCompletionDate),
    remarks: enrollment.remarks || '',
    allowOverCapacity: false,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) => setForm((prev) => {
    const next = { ...prev, [key]: event.target.value };
    if (key === 'status' && event.target.value === 'completed') next.progressPercentage = 100;
    return next;
  });
  const chosen = options.find((b) => b.id === form.batchId);
  const full = chosen && form.batchId !== currentBatchId && chosen.seatsLeft <= 0;

  const submit = async () => {
    const progress = Number(form.progressPercentage);
    if (progress < 0 || progress > 100) return setError('Progress must be between 0 and 100');
    setError('');
    setSaving(true);
    try {
      await api.patch(`/admin/enrollments/${enrollment.id}`, {
        status: form.status,
        progressPercentage: progress,
        batchId: form.batchId || null,
        enrollmentDate: form.enrollmentDate || undefined,
        expectedCompletionDate: form.expectedCompletionDate || null,
        actualCompletionDate: form.status === 'completed' ? form.actualCompletionDate || todayInput() : form.actualCompletionDate || null,
        remarks: form.remarks,
        allowOverCapacity: form.allowOverCapacity,
      });
      toast.success('Enrollment updated');
      onSaved?.();
      onClose();
    } catch (err) {
      setError(apiError(err));
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {error && <FormBanner tone="error" title="Could not save">{error}</FormBanner>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Status">
            <Select value={form.status} onChange={set('status')}>
              {ENROLLMENT_STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
            </Select>
          </Field>
          <Field label="Progress (%)">
            <Input type="number" min="0" max="100" value={form.progressPercentage} onChange={set('progressPercentage')} />
          </Field>
          <Field label="Batch" className="sm:col-span-2">
            <Select value={form.batchId} onChange={set('batchId')}>
              <option value="">No batch</option>
              {currentBatchId && !options.some((b) => b.id === currentBatchId) && (
                <option value={currentBatchId}>{enrollment.batchId?.batchName || 'Current batch'}</option>
              )}
              {options.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchName} · {formatTiming(b.timingFrom, b.timingTo)} · {b.currentStrength}/{b.maxStrength}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Enrollment date"><Input type="date" value={form.enrollmentDate} onChange={set('enrollmentDate')} /></Field>
          <Field label="Expected completion"><Input type="date" value={form.expectedCompletionDate} onChange={set('expectedCompletionDate')} /></Field>
          {(form.status === 'completed' || form.actualCompletionDate) && (
            <Field label="Actual completion" hint={form.status === 'completed' && !form.actualCompletionDate ? 'Today if left empty' : undefined}>
              <Input type="date" value={form.actualCompletionDate} onChange={set('actualCompletionDate')} max={todayInput()} />
            </Field>
          )}
        </div>
        {full && (
          <label className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
            <input type="checkbox" checked={form.allowOverCapacity} onChange={(e) => setForm((p) => ({ ...p, allowOverCapacity: e.target.checked }))} />
            This batch is full. Move the student anyway.
          </label>
        )}
        <Field label="Remarks"><Textarea rows={2} value={form.remarks} onChange={set('remarks')} /></Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button size="sm" onClick={submit} loading={saving}>Save</Button>
      </div>
    </>
  );
}

export default function EditEnrollmentModal({ enrollment, onOpenChange, onSaved }) {
  const { batches } = useOpenBatches();
  return (
    <Modal
      open={Boolean(enrollment)}
      onOpenChange={onOpenChange}
      title="Update enrollment"
      description={enrollment ? `${enrollment.enrollmentNumber} · ${enrollment.courseId?.courseName || ''}` : undefined}
    >
      {enrollment && <EditForm key={enrollment.id} enrollment={enrollment} batches={batches} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
    </Modal>
  );
}
