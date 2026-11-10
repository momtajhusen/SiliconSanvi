import Input from '../ui/Input';
import Select from '../ui/Select';
import Field from './Field';
import { FEE_COMPONENTS } from '../../constants/institute';
import { formatDate, formatINR, formatTiming, todayInput } from '../../lib/format';

export function emptyFee(course) {
  return {
    courseFee: course?.baseFee ?? '',
    admissionFee: course?.admissionFee ?? '',
    examFee: course?.examFee ?? '',
    certificateFee: '',
    otherFees: '',
    discount: '',
    scholarship: '',
    installments: 1,
    firstDueDate: '',
  };
}

export function emptyEnrollment() {
  return { courseId: '', batchId: '', enrollmentDate: todayInput(), allowOverCapacity: false, fee: emptyFee() };
}

const n = (value) => Number(value) || 0;

export function feeTotals(fee) {
  const total = FEE_COMPONENTS.reduce((sum, { key }) => sum + n(fee[key]), 0);
  const net = total - n(fee.discount) - n(fee.scholarship);
  return { total, net };
}

export function previewSchedule(net, count, firstDue) {
  const installments = Math.max(1, Math.min(36, Math.round(n(count) || 1)));
  const base = Math.floor(net / installments);
  const start = firstDue ? new Date(firstDue) : new Date();
  return Array.from({ length: installments }, (_, index) => {
    const due = new Date(start);
    due.setMonth(due.getMonth() + index);
    return {
      number: index + 1,
      amount: index === installments - 1 ? Math.round((net - base * (installments - 1)) * 100) / 100 : base,
      dueDate: due,
    };
  });
}

export function feePayload(fee) {
  const out = {};
  for (const { key } of FEE_COMPONENTS) out[key] = n(fee[key]);
  out.discount = n(fee.discount);
  out.scholarship = n(fee.scholarship);
  out.installments = Math.max(1, Math.round(n(fee.installments) || 1));
  if (fee.firstDueDate) out.firstDueDate = fee.firstDueDate;
  return out;
}

export function enrollmentPayload(value) {
  return {
    courseId: value.courseId,
    batchId: value.batchId || undefined,
    enrollmentDate: value.enrollmentDate || undefined,
    allowOverCapacity: Boolean(value.allowOverCapacity),
    fee: feePayload(value.fee),
  };
}

/** Returns an error message, or '' when the fee inputs are usable. */
export function validateFee(fee) {
  const { total, net } = feeTotals(fee);
  if ([...FEE_COMPONENTS.map(({ key }) => fee[key]), fee.discount, fee.scholarship].some((v) => n(v) < 0)) return 'Fee amounts cannot be negative';
  if (net < 0) return `Discount is more than the total fee (${formatINR(total)})`;
  const count = n(fee.installments);
  if (count < 1 || count > 36) return 'Installments must be between 1 and 36';
  return '';
}

export function FeeFields({ value, onChange, startDate }) {
  const set = (key) => (event) => onChange({ ...value, [key]: event.target.value });
  const { total, net } = feeTotals(value);
  const schedule = net > 0 ? previewSchedule(net, value.installments, value.firstDueDate || startDate) : [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FEE_COMPONENTS.map(({ key, label }) => (
          <Field key={key} label={`${label} (₹)`}>
            <Input type="number" min="0" inputMode="decimal" value={value[key]} onChange={set(key)} placeholder="0" />
          </Field>
        ))}
        <Field label="Discount (₹)">
          <Input type="number" min="0" inputMode="decimal" value={value.discount} onChange={set('discount')} placeholder="0" />
        </Field>
        <Field label="Scholarship (₹)">
          <Input type="number" min="0" inputMode="decimal" value={value.scholarship} onChange={set('scholarship')} placeholder="0" />
        </Field>
        <Field label="Installments">
          <Input type="number" min="1" max="36" value={value.installments} onChange={set('installments')} />
        </Field>
        <Field label="First due date" hint="Defaults to the enrollment date">
          <Input type="date" value={value.firstDueDate} onChange={set('firstDueDate')} />
        </Field>
      </div>

      <div className="rounded-lg border border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-muted))]/40 p-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-muted-foreground">Total {formatINR(total)}</span>
          <span className="font-semibold">Net payable {formatINR(net)}</span>
        </div>
        {schedule.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {schedule.map((row) => (
              <span key={row.number} className="rounded-md border border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-card-bg))] px-2 py-1 text-[11px]">
                #{row.number} · {formatINR(row.amount)} · {formatDate(row.dueDate)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EnrollmentFields({ value, onChange, courses = [], batches = [], lockCourse = false, errors = {} }) {
  const course = courses.find((row) => row.id === value.courseId);
  const courseBatches = batches.filter(
    (batch) => (batch.courseId?.id || batch.courseId) === value.courseId && ['upcoming', 'active'].includes(batch.status)
  );
  const selectedBatch = courseBatches.find((batch) => batch.id === value.batchId);

  const changeCourse = (event) => {
    const next = courses.find((row) => row.id === event.target.value);
    onChange({ ...value, courseId: event.target.value, batchId: '', fee: { ...emptyFee(next), installments: value.fee.installments } });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Course" required error={errors.courseId}>
          <Select value={value.courseId} onChange={changeCourse} disabled={lockCourse} error={undefined}>
            <option value="">Select course</option>
            {courses.map((row) => (
              <option key={row.id} value={row.id}>
                {row.courseName} ({row.courseCode})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Batch" hint={value.courseId && !courseBatches.length ? 'No open batch for this course — you can assign later' : undefined}>
          <Select value={value.batchId} onChange={(event) => onChange({ ...value, batchId: event.target.value })} disabled={!value.courseId}>
            <option value="">{value.courseId ? 'Assign later' : 'Select course first'}</option>
            {courseBatches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.batchName} · {formatTiming(batch.timingFrom, batch.timingTo)} · {batch.seatsLeft > 0 ? `${batch.seatsLeft} seats left` : 'Full'}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Enrollment date">
          <Input type="date" value={value.enrollmentDate} onChange={(event) => onChange({ ...value, enrollmentDate: event.target.value })} />
        </Field>
      </div>

      {selectedBatch && selectedBatch.seatsLeft <= 0 && (
        <label className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          <input
            type="checkbox"
            checked={value.allowOverCapacity}
            onChange={(event) => onChange({ ...value, allowOverCapacity: event.target.checked })}
          />
          This batch is full ({selectedBatch.currentStrength}/{selectedBatch.maxStrength}). Add the student anyway.
        </label>
      )}

      {course && (
        <FeeFields value={value.fee} onChange={(fee) => onChange({ ...value, fee })} startDate={value.enrollmentDate} />
      )}
    </div>
  );
}
