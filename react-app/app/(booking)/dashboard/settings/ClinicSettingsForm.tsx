'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/client';
import type {
  ApprovalMode,
  DoctorSession,
  DoctorSettings,
  PaymentProvider,
  SessionScope,
} from '@/lib/appointments/types';
import styles from './ClinicSettings.module.css';

type Layer = 'default' | 'weekday' | 'date';

type SessionDraft = {
  draftId: string;
  scope: SessionScope;
  scopeKey: string;
  start: string;
  end: string;
  quota: number;
};

type Props = {
  settings: DoctorSettings | null;
  sessions: DoctorSession[];
  closedDates: string[];
  today: string;
};

type Note = { message: string; error: boolean };

const dayLabels = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const monthNames = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const layerLabels: Record<Layer, string> = {
  default: 'الجدول الافتراضي',
  weekday: 'استثناء يوم',
  date: 'استثناء تاريخ',
};

const fallback: DoctorSettings = {
  id: 'clinic',
  approval_mode: 'pay_at_clinic_auto_confirmed',
  paymob_enabled: false,
  fawry_enabled: false,
  open_days: [],
  work_start: null,
  work_end: null,
  slot_minutes: 30,
  hold_minutes: 15,
  cancel_hours_before: 0,
  timezone: 'Africa/Cairo',
};

const pad = (value: number) => String(value).padStart(2, '0');

const isoDate = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`;

function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function minutes(value: string) {
  const [hours, secs] = value.split(':').map(Number);
  return hours * 60 + secs;
}

function toDraft(session: DoctorSession): SessionDraft {
  return {
    draftId: session.id,
    scope: session.scope,
    scopeKey: session.scope_key ?? '',
    start: session.start_time.slice(0, 5),
    end: session.end_time.slice(0, 5),
    quota: session.patient_limit,
  };
}

function makeDraft(scope: SessionScope, scopeKey: string): SessionDraft {
  const suffix =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  return {
    draftId: `draft-${suffix}`,
    scope,
    scopeKey,
    start: '09:00',
    end: '12:00',
    quota: 1,
  };
}

function friendlyError(message: string) {
  if (message.includes('Sessions cannot overlap')) {
    return 'لا يمكن تداخل الجلسات في نفس اليوم.';
  }
  if (message.includes('Patient limit exceeds')) {
    return 'عدد المرضى في الجلسة أكبر من عدد المواعيد المتاحة بها.';
  }
  if (message.includes('Slot length is too long')) {
    return 'طول الموعد أكبر من سعة إحدى الجلسات. راجع الجلسات قبل الحفظ.';
  }
  if (message.includes('Not allowed')) {
    return 'صلاحياتك لا تسمح بحفظ إعدادات العيادة.';
  }
  return 'تعذّر حفظ الإعدادات. تحقق من الاتصال والصلاحيات ثم حاول مجددًا.';
}

export default function ClinicSettingsForm({
  settings,
  sessions,
  closedDates,
  today,
}: Props) {
  const router = useRouter();
  const initialForm = settings ?? fallback;
  const initialDrafts = sessions.map(toDraft);
  const initialClosed = [...closedDates].sort();

  const [form, setForm] = useState<DoctorSettings>(initialForm);
  const [drafts, setDrafts] = useState<SessionDraft[]>(initialDrafts);
  const [closed, setClosed] = useState<string[]>(initialClosed);
  const [baseline, setBaseline] = useState({
    form: initialForm,
    drafts: initialDrafts,
    closed: initialClosed,
  });
  const [selectedDay, setSelectedDay] = useState(() => parseIsoDate(today).getDay());
  const [viewYear, setViewYear] = useState(() => parseIsoDate(today).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parseIsoDate(today).getMonth());
  const [selectedDate, setSelectedDate] = useState(today);
  const [layer, setLayer] = useState<Layer>('default');
  const [note, setNote] = useState<Note | null>(null);
  const [busy, setBusy] = useState(false);
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);
  const chipStripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollTarget) return;
    document.getElementById(scrollTarget)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    setScrollTarget(null);
  }, [layer, scrollTarget]);

  useEffect(() => {
    const strip = chipStripRef.current;
    if (!strip) return;
    // RTL overflow uses negative scrollLeft. The date chip is the far-left chip.
    if (layer === 'date') {
      strip.scrollLeft = -(strip.scrollWidth - strip.clientWidth);
    } else if (layer === 'weekday') {
      strip.scrollLeft = -(strip.scrollWidth - strip.clientWidth) / 2;
    } else {
      strip.scrollLeft = 0;
    }
  }, [layer]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const monthLabel = `${monthNames[viewMonth]} ${viewYear}`;
  const calendarCells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const weekdayOverrideCount = drafts.filter(
    (draft) => draft.scope === 'weekday' && draft.quota > 0
  ).length;
  const dateOverrideCount = drafts.filter(
    (draft) => draft.scope === 'date' && draft.quota > 0
  ).length;
  const closedDatesInMonth = closed.filter((date) =>
    date.startsWith(`${viewYear}-${pad(viewMonth + 1)}-`)
  ).length;

  const activeSessions =
    layer === 'default'
      ? rowsFor('default', '')
      : layer === 'weekday'
        ? rowsFor('weekday', String(selectedDay))
        : rowsFor('date', selectedDate);

  const activeLabel =
    layer === 'weekday'
      ? `${dayLabels[selectedDay]} — استثناء أسبوعي`
      : layer === 'date'
        ? `${selectedDate} — استثناء تاريخ`
        : 'كل أيام العمل';

  const dateLayerActive = layer === 'date';

  function rowsFor(scope: SessionScope, key: string) {
    return drafts
      .filter((draft) => draft.scope === scope && draft.scopeKey === key)
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  function patch<K extends keyof DoctorSettings>(key: K, value: DoctorSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setNote(null);
  }

  function notify(message: string, error = false) {
    setNote({ message, error });
  }

  function updateSession(draftId: string, changes: Partial<SessionDraft>) {
    setDrafts((current) =>
      current.map((draft) => (draft.draftId === draftId ? { ...draft, ...changes } : draft))
    );
    setNote(null);
  }

  function addSession() {
    const scope: SessionScope = layer;
    const key = layer === 'default' ? '' : layer === 'weekday' ? String(selectedDay) : selectedDate;
    setDrafts((current) => [...current, makeDraft(scope, key)]);
    setNote(null);
  }

  function removeSession(draftId: string) {
    setDrafts((current) => current.filter((draft) => draft.draftId !== draftId));
    setNote(null);
  }

  function toggleDay(day: number) {
    const next = form.open_days.includes(day)
      ? form.open_days.filter((item) => item !== day)
      : [...form.open_days, day].sort((a, b) => a - b);
    patch('open_days', next);
  }

  function toggleClosedDate(date: string) {
    setClosed((current) =>
      current.includes(date) ? current.filter((item) => item !== date) : [...current, date].sort()
    );
    setNote(null);
  }

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    const year = next.getFullYear();
    const month = next.getMonth();
    setViewYear(year);
    setViewMonth(month);
    setSelectedDate(isoDate(year, month, 1));
    setLayer('date');
    setNote(null);
  }

  function goToLayer(item: Layer) {
    setLayer(item);
    setScrollTarget(item === 'date' ? 'v2-calendar' : 'v2-schedule');
  }

  function previewFor(date: string) {
    if (closed.includes(date)) {
      return { label: 'مغلق — استثناء لمرة واحدة', sessions: [] as SessionDraft[] };
    }
    const dated = rowsFor('date', date);
    if (dated.length) {
      return { label: 'جلسات خاصة بالتاريخ', sessions: dated };
    }
    const weekday = parseIsoDate(date).getDay();
    if (!form.open_days.includes(weekday)) {
      return { label: 'مغلق — ليس يوم عمل', sessions: [] as SessionDraft[] };
    }
    const weekly = rowsFor('weekday', String(weekday));
    if (weekly.length) {
      return { label: `استثناء ${dayLabels[weekday]}`, sessions: weekly };
    }
    return { label: 'الجدول الافتراضي', sessions: rowsFor('default', '') };
  }

  const preview = previewFor(selectedDate);
  const previewSlots = preview.sessions.reduce(
    (total, session) => total + Math.max(0, Math.floor((minutes(session.end) - minutes(session.start)) / Math.max(1, form.slot_minutes))),
    0
  );
  const previewPatients = preview.sessions.reduce((total, session) => total + session.quota, 0);
  const slotCapacity = (session: SessionDraft) =>
    Math.max(0, Math.floor((minutes(session.end) - minutes(session.start)) / Math.max(1, form.slot_minutes)));

  function validate() {
    if (
      form.approval_mode === 'auto_after_payment' &&
      !form.paymob_enabled &&
      !form.fawry_enabled
    ) {
      return 'فعّل باي موب أو فوري عند اختيار التأكيد بعد الدفع الإلكتروني.';
    }
    if (form.slot_minutes < 5 || form.slot_minutes > 180) {
      return 'طول الموعد يجب أن يكون بين 5 و180 دقيقة.';
    }
    if (form.hold_minutes < 1 || form.hold_minutes > 120) {
      return 'انتظار الدفع يجب أن يكون بين 1 و120 دقيقة.';
    }
    if (form.cancel_hours_before < 0 || form.cancel_hours_before > 168) {
      return 'الإلغاء قبل يجب أن يكون بين 0 و168 ساعة.';
    }

    const groups = new Map<string, SessionDraft[]>();
    drafts.forEach((draft) => {
      const key = `${draft.scope}:${draft.scopeKey}`;
      groups.set(key, [...(groups.get(key) ?? []), draft]);
    });

    for (const group of groups.values()) {
      const sorted = [...group].sort((a, b) => a.start.localeCompare(b.start));
      for (let index = 0; index < sorted.length; index += 1) {
        const draft = sorted[index];
        if (!draft.start || !draft.end || draft.start >= draft.end) {
          return 'تأكد من أن نهاية كل جلسة بعد بدايتها.';
        }
        const capacity = Math.floor((minutes(draft.end) - minutes(draft.start)) / form.slot_minutes);
        if (capacity < 1) {
          return 'مدة إحدى الجلسات أقصر من طول الموعد.';
        }
        if (draft.quota < 1) {
          return 'عدد مرضى الجلسة يجب أن يكون رقمًا صحيحًا لا يقل عن 1.';
        }
        if (draft.quota > capacity) {
          return `عدد مرضى الجلسة (${draft.quota}) أكبر من عدد مواعيدها (${capacity}).`;
        }
        const next = sorted[index + 1];
        if (next && next.start < draft.end) {
          return 'لا يمكن تداخل الجلسات في نفس اليوم.';
        }
      }
    }
    return null;
  }

  async function save() {
    const supabase = getBrowserClient();
    if (!supabase) {
      notify('الاتصال بقاعدة البيانات غير مهيأ على هذا الجهاز. راجع متغيرات البيئة.', true);
      return;
    }

    const problem = validate();
    if (problem) {
      notify(problem, true);
      return;
    }

    // Keep the column-limited booking_config view consistent with the new
    // session source of truth.
    const defaults = rowsFor('default', '').sort((a, b) => a.start.localeCompare(b.start));
    const workStart = defaults[0]?.start ?? null;
    const workEnd = defaults.length
      ? defaults.reduce((latest, draft) => (draft.end > latest ? draft.end : latest), defaults[0].end)
      : null;

    setBusy(true);
    setNote(null);

    const { error } = await supabase.rpc('save_clinic_settings', {
      p_settings: {
        approval_mode: form.approval_mode,
        paymob_enabled: form.paymob_enabled,
        fawry_enabled: form.fawry_enabled,
        open_days: form.open_days,
        work_start: workStart,
        work_end: workEnd,
        slot_minutes: form.slot_minutes,
        hold_minutes: form.hold_minutes,
        cancel_hours_before: form.cancel_hours_before,
        timezone: form.timezone,
      },
      p_sessions: drafts.map((draft) => ({
        scope: draft.scope,
        scope_key: draft.scope === 'default' ? null : draft.scopeKey,
        start_time: draft.start,
        end_time: draft.end,
        patient_limit: draft.quota,
      })),
      p_closed_dates: closed.map((date) => ({ date })),
    });

    setBusy(false);
    if (error) {
      notify(friendlyError(error.message), true);
      return;
    }

    const savedForm = { ...form };
    const savedDrafts = drafts.map((draft) => ({ ...draft }));
    const savedClosed = [...closed].sort();
    setBaseline({ form: savedForm, drafts: savedDrafts, closed: savedClosed });
    setForm(savedForm);
    setDrafts(savedDrafts);
    setClosed(savedClosed);
    notify('تم حفظ الإعدادات في قاعدة البيانات.');
    router.refresh();
  }

  function restoreSaved() {
    setForm({ ...baseline.form });
    setDrafts(baseline.drafts.map((draft) => ({ ...draft })));
    setClosed([...baseline.closed]);
    setLayer('default');
    setSelectedDate(today);
    setSelectedDay(parseIsoDate(today).getDay());
    setViewYear(parseIsoDate(today).getFullYear());
    setViewMonth(parseIsoDate(today).getMonth());
    notify('تمت استعادة الإعدادات المحفوظة.');
  }

  function toggleProvider(provider: PaymentProvider) {
    const key = provider === 'paymob' ? 'paymob_enabled' : 'fawry_enabled';
    patch(key, !form[key]);
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.kicker}>الطبيب / الإعدادات</p>
          <h2>إعدادات الحجز</h2>
          <p className={styles.intro}>
            اضبط جدول العيادة من طبقة واحدة: القواعد الأسبوعية، ثم استثناءات الأيام، ثم استثناءات
            التواريخ. الحفظ يكتب الجلسات والأيام المغلقة وسياسات الحجز في قاعدة البيانات دفعة واحدة.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/dashboard/doctor" className={styles.textLink}>
            ← لوحة الطبيب
          </Link>
          <span className={styles.savedTag}>متصل مباشرة</span>
        </div>
      </header>

      {note ? (
        <p
          className={`${styles.status} ${note.error ? styles.statusError : ''}`}
          role="status"
          aria-live="polite"
        >
          {note.message}
        </p>
      ) : null}

      <div className={styles.summaryBar} aria-live="polite">
        <span>
          <small>أيام مفتوحة</small>
          <b>{form.open_days.length}</b>
        </span>
        <span>
          <small>استثناءات أيام</small>
          <b>{weekdayOverrideCount}</b>
        </span>
        <span>
          <small>استثناءات تواريخ</small>
          <b>{dateOverrideCount}</b>
        </span>
        <span>
          <small>أيام مغلقة هذا الشهر</small>
          <b>{closedDatesInMonth}</b>
        </span>
        <span className={styles.summaryRule}>
          <small>ترتيب التطبيق</small>
          <b>تاريخ ← يوم ← افتراضي</b>
        </span>
      </div>

      <div className={styles.layout}>
        <main className={styles.main}>
          <div className={styles.panel}>
            <div
              className={styles.layerChips}
              role="group"
              aria-label="طبقة التعديل"
              ref={chipStripRef}
            >
              {(['default', 'weekday', 'date'] as Layer[]).map((item, index) => (
                <button
                  type="button"
                  key={item}
                  className={layer === item ? styles.layerChipActive : styles.layerChip}
                  aria-pressed={layer === item}
                  onClick={() => goToLayer(item)}
                >
                  <span>{index + 1}</span>
                  <b>{layerLabels[item]}</b>
                  <small>
                    {item === 'default'
                      ? 'كل أيام العمل'
                      : item === 'weekday'
                        ? `يوم ${dayLabels[selectedDay]}`
                        : selectedDate}
                  </small>
                </button>
              ))}
            </div>

            {!dateLayerActive ? (
              <section className={styles.section} id="v2-schedule">
                <div className={styles.panelHead}>
                  <div>
                    <p className={styles.panelLabel}>الخطوة الأولى / القواعد</p>
                    <h3>القواعد الأسبوعية</h3>
                  </div>
                  <p>اضغط على أي مكان في اليوم لضبط استثنائه، وعلى المفتاح بجانبه لفتحه أو إغلاقه.</p>
                </div>

                <div className={styles.weekGrid}>
                  {dayLabels.map((day, index) => {
                    const isOpen = form.open_days.includes(index);
                    const override = rowsFor('weekday', String(index));
                    const shown = isOpen
                      ? override.length
                        ? override
                        : rowsFor('default', '')
                      : [];
                    return (
                      <div
                        className={`${styles.dayCard} ${
                          layer === 'weekday' && selectedDay === index ? styles.dayCardActive : ''
                        } ${override.length ? styles.dayCardOverride : ''} ${
                          !isOpen ? styles.dayCardClosed : ''
                        }`}
                        key={day}
                        onClick={() => {
                          setSelectedDay(index);
                          setLayer('weekday');
                          setNote(null);
                        }}
                      >
                        <div className={styles.dayCardTop}>
                          <button type="button" className={styles.daySelect}>
                            {day}
                          </button>
                          <button
                            type="button"
                            className={`${styles.dayToggle} ${
                              isOpen ? styles.dayToggleOn : styles.dayToggleOff
                            }`}
                            aria-pressed={isOpen}
                            aria-label={`${day} ${isOpen ? 'مفتوح' : 'مغلق'}`}
                            onClick={() => toggleDay(index)}
                          >
                            {isOpen ? '✓' : '×'}
                          </button>
                        </div>
                        {override.length ? (
                          <em className={styles.overrideTag}>
                            {isOpen ? 'استثناء' : 'استثناء متوقف'}
                          </em>
                        ) : null}
                        {shown.length ? (
                          shown.map((session) => (
                            <span className={styles.sessionChip} key={session.draftId}>
                              <span dir="ltr">
                                {session.start}–{session.end}
                              </span>
                              <small>{session.quota} مرضى</small>
                            </span>
                          ))
                        ) : (
                          <span className={styles.noSessions}>لا جلسات</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {dateLayerActive ? (
              <section className={styles.section} id="v2-calendar">
                <div className={styles.panelHead}>
                  <div>
                    <p className={styles.panelLabel}>الخطوة الثانية / الاستثناءات</p>
                    <h3>التقويم والاستثناءات</h3>
                  </div>
                  <p>اختر تاريخًا لرؤية جدوله الفعلي في معاينة المريض.</p>
                </div>

                <div className={styles.calendarTop}>
                  <h4>{monthLabel}</h4>
                  <div className={styles.monthNav}>
                    <button type="button" aria-label="الشهر السابق" onClick={() => shiftMonth(-1)}>
                      › السابق
                    </button>
                    <button type="button" aria-label="الشهر التالي" onClick={() => shiftMonth(1)}>
                      التالي ‹
                    </button>
                  </div>
                </div>

                <div className={styles.calendarGrid}>
                  {dayLabels.map((day) => (
                    <span className={styles.weekdayCell} key={day}>
                      {day}
                    </span>
                  ))}
                  {calendarCells.map((day, index) => {
                    if (day === null) {
                      return <span className={styles.leadingCell} key={`lead-${index}`} aria-hidden="true" />;
                    }
                    const date = isoDate(viewYear, viewMonth, day);
                    const isClosed = closed.includes(date);
                    const isSpecial = rowsFor('date', date).length > 0;
                    return (
                      <button
                        type="button"
                        className={`${styles.calendarCell} ${isClosed ? styles.calendarClosed : ''} ${
                          isSpecial ? styles.calendarSpecial : ''
                        } ${selectedDate === date ? styles.calendarSelected : ''}`}
                        key={date}
                        onClick={() => {
                          setSelectedDate(date);
                          setLayer('date');
                          setNote(null);
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className={styles.calendarLegend}>
                  <span>
                    <i className={styles.legendClosed} /> مغلق
                  </span>
                  <span>
                    <i className={styles.legendSpecial} /> جلسة خاصة
                  </span>
                  <span>
                    <i className={styles.legendSelected} /> المختار
                  </span>
                </div>

                <div className={styles.dateDetail}>
                  <div className={styles.dateDetailHead}>
                    <b>{selectedDate}</b>
                    <span>{preview.label}</span>
                  </div>
                  <button type="button" onClick={() => toggleClosedDate(selectedDate)}>
                    {closed.includes(selectedDate) ? 'فتح هذا التاريخ' : 'إغلاق هذا التاريخ'}
                  </button>
                  {preview.sessions.length ? (
                    preview.sessions.map((session) => (
                      <div className={styles.previewRow} key={session.draftId}>
                        <span dir="ltr">
                          {session.start}–{session.end}
                        </span>
                        <small>{session.quota} مرضى</small>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyNote}>لا يستطيع المريض حجز موعد في هذا اليوم.</p>
                  )}
                </div>
              </section>
            ) : null}
          </div>
        </main>

        <aside className={styles.preview}>
          <div className={styles.previewEditor}>
            <div
              className={`${styles.editorCard} ${dateLayerActive ? styles.editorCardDate : ''}`}
              id="v2-editor"
            >
              <div className={styles.editorHead}>
                <div>
                  <p className={styles.panelLabel}>محرر الجلسات</p>
                  <h4>{activeLabel}</h4>
                </div>
                <button type="button" className={styles.smallButton} onClick={addSession}>
                  + جلسة
                </button>
              </div>
              {activeSessions.length ? (
                activeSessions.map((session) => (
                  <div className={styles.sessionEditor} key={session.draftId}>
                    <label>
                      من
                      <input
                        type="time"
                        value={session.start}
                        onChange={(event) => updateSession(session.draftId, { start: event.target.value })}
                      />
                    </label>
                    <label>
                      إلى
                      <input
                        type="time"
                        value={session.end}
                        onChange={(event) => updateSession(session.draftId, { end: event.target.value })}
                      />
                    </label>
                    <label>
                      السعة
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={session.quota}
                        onChange={(event) =>
                          updateSession(session.draftId, { quota: Number(event.target.value) })
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className={styles.removeButton}
                      aria-label="حذف الجلسة"
                      onClick={() => removeSession(session.draftId)}
                    >
                      ×
                    </button>
                    <small>{slotCapacity(session)} موعدًا متاحًا</small>
                  </div>
                ))
              ) : (
                <p className={styles.emptyNote}>لا توجد جلسات في هذه الطبقة. أضف جلسة أو اتركها فارغة.</p>
              )}
              {layer === 'date' ? (
                <div className={styles.dateAction}>
                  <b>تاريخ {selectedDate}</b>
                  <button type="button" onClick={() => toggleClosedDate(selectedDate)}>
                    {closed.includes(selectedDate) ? 'فتح هذا التاريخ' : 'إغلاق هذا التاريخ'}
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <p className={styles.panelLabel}>معاينة المريض المباشرة</p>
          <h3>{selectedDate}</h3>
          <span className={styles.sourceTag}>{preview.label}</span>

          {preview.sessions.length ? (
            preview.sessions.map((session) => (
              <div className={styles.previewSession} key={session.draftId}>
                <div className={styles.previewRow}>
                  <span dir="ltr">
                    {session.start}–{session.end}
                  </span>
                  <small>{session.quota} مرضى</small>
                </div>
                <div className={styles.timeline}>
                  {Array.from({ length: Math.min(slotCapacity(session), 16) }, (_, index) => (
                    <i key={index} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className={styles.emptyNote}>لا يستطيع المريض حجز موعد في هذا اليوم.</p>
          )}

          <div className={styles.previewStats}>
            <span>
              مواعيد <b>{previewSlots}</b>
            </span>
            <span>
              سعة <b>{previewPatients}</b>
            </span>
          </div>
          <p className={styles.previewNote}>
            النتيجة محسوبة من الطبقات: تاريخ ← يوم ← افتراضي، ومطابقة لما يراه المريض في الحجز.
          </p>
        </aside>
      </div>

      <section className={`${styles.section} ${styles.policiesSection}`} id="v2-policies">
        <div className={styles.panelHead}>
          <div>
            <p className={styles.panelLabel}>الخطوة الثالثة / السياسات</p>
            <h3>سياسات الحجز</h3>
          </div>
          <p>هذه القيم تحسب عدد المواعيد المعروضة وتتحكم في تأكيد الحجز.</p>
        </div>

        <div className={styles.policyGrid}>
          <label className={styles.policyCard}>
            <span>طول الموعد</span>
            <input
              type="number"
              min={5}
              max={180}
              value={form.slot_minutes}
              onChange={(event) => patch('slot_minutes', Number(event.target.value))}
            />
            <small>دقيقة لكل موعد</small>
          </label>
          <label className={styles.policyCard}>
            <span>انتظار الدفع</span>
            <input
              type="number"
              min={1}
              max={120}
              value={form.hold_minutes}
              onChange={(event) => patch('hold_minutes', Number(event.target.value))}
            />
            <small>دقيقة قبل تحرير الحجز</small>
          </label>
          <label className={styles.policyCard}>
            <span>الإلغاء قبل</span>
            <input
              type="number"
              min={0}
              max={168}
              value={form.cancel_hours_before}
              onChange={(event) => patch('cancel_hours_before', Number(event.target.value))}
            />
            <small>ساعة من موعد الحجز</small>
          </label>
        </div>

        <div className={styles.approvalCard}>
          <p className={styles.panelLabel}>طريقة التأكيد</p>
          <div className={styles.approval}>
            <button
              type="button"
              className={form.approval_mode === 'pay_at_clinic_auto_confirmed' ? styles.approvalActive : ''}
              aria-pressed={form.approval_mode === 'pay_at_clinic_auto_confirmed'}
              onClick={() => patch('approval_mode', 'pay_at_clinic_auto_confirmed')}
            >
              دفع في العيادة — تأكيد فوري
            </button>
            <button
              type="button"
              className={form.approval_mode === 'auto_after_payment' ? styles.approvalActive : ''}
              aria-pressed={form.approval_mode === 'auto_after_payment'}
              onClick={() => patch('approval_mode', 'auto_after_payment')}
            >
              تأكيد بعد الدفع الإلكتروني
            </button>
          </div>

          <div className={styles.providerToggles}>
            <span>مزودو الدفع</span>
            <div className={styles.providerButtons}>
              <button
                type="button"
                className={form.paymob_enabled ? styles.approvalActive : ''}
                aria-pressed={form.paymob_enabled}
                onClick={() => toggleProvider('paymob')}
              >
                باي موب {form.paymob_enabled ? 'مفعّل' : 'متوقف'}
              </button>
              <button
                type="button"
                className={form.fawry_enabled ? styles.approvalActive : ''}
                aria-pressed={form.fawry_enabled}
                onClick={() => toggleProvider('fawry')}
              >
                فوري {form.fawry_enabled ? 'مفعّل' : 'متوقف'}
              </button>
            </div>
          </div>

          <p className={styles.approvalNote}>
            التأكيد النهائي يظل مرتبطًا بدفع موثّق أو بإجراء من الممرضة — لا يُمنح تلقائيًا بمجرّد الطلب.
          </p>
        </div>
      </section>

      <div className={styles.footer}>
        <span>يُحفظ الجدول والجلسات والأيام المغلقة وسياسات الحجز معًا في عملية واحدة.</span>
        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.saveButton}
            disabled={busy}
            onClick={() => void save()}
          >
            {busy ? 'جارٍ الحفظ…' : 'حفظ الإعدادات'}
          </button>
          <button
            type="button"
            className={styles.resetButton}
            disabled={busy}
            onClick={restoreSaved}
          >
            استعادة المحفوظ
          </button>
        </div>
      </div>
    </div>
  );
}
