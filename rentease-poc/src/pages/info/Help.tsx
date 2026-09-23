/** Help centre — contact channels, searchable FAQ, and a ticket desk. */
import { useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { support } from '../../api';
import { useSupportTickets } from '../../api/hooks';
import { EmptyState, ErrorNote, Field, PageHead, SectionTitle, inputClass } from '../../components/ui/Bits';
import { Button, LinkButton } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/Chip';
import { SuccessModal } from '../../components/ui/Modal';
import {
  IconChat,
  IconChevron,
  IconHelp,
  IconMail,
  IconPhone,
  IconSearch,
  IconShield,
} from '../../components/icons';
import { cx, prettyDate, supportTopicLabel } from '../../lib/format';
import type { SupportTicket, SupportTopic } from '../../types';

const TOPICS = Object.keys(supportTopicLabel) as SupportTopic[];

const CHANNELS = [
  {
    icon: <IconPhone />,
    title: 'Call the desk',
    detail: '1800 123 4567',
    note: 'Mon–Sat · 9 AM – 8 PM. Toll free from any Indian number.',
  },
  {
    icon: <IconChat />,
    title: 'Chat on WhatsApp',
    detail: '+91 98260 00000',
    note: 'Typical first reply in under 10 minutes during desk hours.',
  },
  {
    icon: <IconMail />,
    title: 'Email support',
    detail: 'help@rentease.test',
    note: 'Answered within one working day, with your ticket reference.',
  },
];

const FAQS: Array<{ id: string; topic: SupportTopic; q: string; a: string }> = [
  {
    id: 'f1',
    topic: 'rent',
    q: 'How do I pay rent, and where does the money go?',
    a: 'Open Bookings & rent and pay the month that is due. The amount leaves your wallet, lands in the owner’s wallet the same moment, and both sides get a matching entry with the unit number on it. The next due date rolls forward automatically.',
  },
  {
    id: 'f2',
    topic: 'rent',
    q: 'My wallet balance is short of the rent. What happens?',
    a: 'The payment is refused rather than part-paid, so nothing is left half settled. Top up by moving rewards cashback into the wallet, then pay again — the due date does not move until the full amount goes through.',
  },
  {
    id: 'f3',
    topic: 'rent',
    q: 'When can an owner withdraw collected rent?',
    a: 'Any time. Rent wallet → Withdraw moves the balance to the bank account on file. The withdrawal is logged next to the rent it came from, so the ledger always reconciles.',
  },
  {
    id: 'f4',
    topic: 'listing',
    q: 'What does it take to list a unit?',
    a: 'A verified owner account, the unit’s type and size, rent and deposit, furnishing state, house rules, and the floor plan we draw for you from the unit type. Listings go live immediately and can be edited or taken down whenever you like.',
  },
  {
    id: 'f5',
    topic: 'listing',
    q: 'Why is my unit not showing in search?',
    a: 'Units marked rented are hidden from renter search. Set the unit back to available from My listings once the lease ends, and check that rent and locality are filled in — search filters on both.',
  },
  {
    id: 'f6',
    topic: 'booking',
    q: 'How is a tour different from a booking request?',
    a: 'A tour is a visit — the owner confirms a slot and nothing is committed. A booking request is an offer to rent: when the owner accepts it, the unit is marked rented and an active booking with a monthly due date is created for you.',
  },
  {
    id: 'f7',
    topic: 'booking',
    q: 'Can I cancel or reschedule a tour?',
    a: 'Yes, free of charge until the day before the slot. Cancel from My tours; the owner sees it drop off their request queue straight away.',
  },
  {
    id: 'f8',
    topic: 'orders',
    q: 'How does renting furniture work?',
    a: 'Pick rent or buy on any item. Rented pieces are charged monthly for as long as you keep them, delivered and installed at the unit, and picked up when you are done. Bought pieces are yours outright.',
  },
  {
    id: 'f9',
    topic: 'orders',
    q: 'Something arrived damaged — what now?',
    a: 'Raise a request under Orders & delivery within 7 days of delivery. Rented items are swapped at no cost; bought items are picked up and refunded to your wallet.',
  },
  {
    id: 'f10',
    topic: 'services',
    q: 'Are the professionals verified?',
    a: 'Every plumber, electrician and construction crew on RentEase is ID-checked and rated by the people who booked them. Ratings on the cards are real job ratings, not seller claims.',
  },
  {
    id: 'f11',
    topic: 'services',
    q: 'When is the visit charge taken?',
    a: 'The visit charge is quoted on the card before you book and is settled from your wallet once the job is marked done. Parts and materials are billed separately by the professional.',
  },
  {
    id: 'f12',
    topic: 'rewards',
    q: 'How do RentPoints, cashback and coins differ?',
    a: 'Points are earned on every rent payment and order and convert to cashback in blocks of 100. Cashback is rupees you can move into the rent wallet. Coins come from 3, 6 and 12-month tenure milestones and buy perks from the coin store.',
  },
  {
    id: 'f13',
    topic: 'rewards',
    q: 'A tenure milestone did not credit. Can it be fixed?',
    a: 'Milestones unlock on the lease start date, and each one pays out once per booking per person. If the months add up but nothing landed, raise a request under Rewards card and the desk can credit it manually.',
  },
  {
    id: 'f14',
    topic: 'account',
    q: 'I signed up as a guest. How do I rent or list?',
    a: 'Open Unlock more features and pick renter or owner. In the real product that step collects ID proof, and ownership documents for owners; on this build the upgrade is instant.',
  },
  {
    id: 'f15',
    topic: 'account',
    q: 'How do I delete my account and data?',
    a: 'Raise a request under Account & KYC. Active leases and open orders have to be closed first; everything else is removed within 30 days of the request.',
  },
];

const STATUS_TONE = {
  open: 'wait',
  'in-progress': 'wait',
  resolved: 'ok',
} as const;

const STATUS_LABEL = {
  open: 'Open',
  'in-progress': 'With the desk',
  resolved: 'Resolved',
} as const;

export default function Help() {
  const { user } = useAuth();
  const toast = useToast();
  const tickets = useSupportTickets(user?.id);
  const formRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<SupportTopic | 'all'>('all');
  const [openFaq, setOpenFaq] = useState<string | null>(FAQS[0].id);

  const [form, setForm] = useState({ topic: 'rent' as SupportTopic, subject: '', message: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [raised, setRaised] = useState<SupportTicket | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter(
      (f) =>
        (topic === 'all' || f.topic === topic) &&
        (q === '' || `${f.q} ${f.a}`.toLowerCase().includes(q)),
    );
  }, [query, topic]);

  function jumpToForm(next?: SupportTopic) {
    if (next) setForm((f) => ({ ...f, topic: next }));
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function submit() {
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      const ticket = await support.raise({ userId: user.id, ...form });
      setRaised(ticket);
      setForm({ topic: form.topic, subject: '', message: '' });
      toast(`Request ${ticket.reference} is with the ${ticket.agent.toLowerCase()}.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function resolve(id: string) {
    await support.resolve(id);
    toast('Marked as resolved. Thanks for letting us know.');
  }

  return (
    <>
      <PageHead
        title="Help & support"
        subtitle="Answers to the usual questions, and a desk that picks up the rest."
        action={
          <LinkButton to="/about" variant="ghost" size="sm">
            About RentEase
          </LinkButton>
        }
      />

      {/* Talk to someone */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CHANNELS.map((c) => (
          <article key={c.title} className="card flex items-start gap-3.5 p-5">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-[11px] bg-green-soft text-green [&_svg]:h-[22px] [&_svg]:w-[22px]">
              {c.icon}
            </span>
            <div className="min-w-0">
              <h3 className="display m-0 text-base font-semibold">{c.title}</h3>
              <p className="display m-0 mt-0.5 text-[15px] font-semibold text-green">{c.detail}</p>
              <p className="m-0 mt-1.5 text-[12.5px] leading-snug text-muted">{c.note}</p>
            </div>
          </article>
        ))}
      </div>

      <SectionTitle title="Common questions" />

      <div className="mb-4 flex items-center gap-2.5 rounded-[10px] border border-line bg-panel px-3.5 py-2.5">
        <IconSearch className="h-[18px] w-[18px] flex-none text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help — rent, deposit, delivery, milestones…"
          aria-label="Search help articles"
          className="w-full border-0 bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(['all', ...TOPICS] as Array<SupportTopic | 'all'>).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTopic(t)}
            className={cx(
              'cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
              topic === t
                ? 'border-green bg-green text-[#F1F6EF]'
                : 'border-green-line bg-panel text-green hover:bg-green-soft',
            )}
          >
            {t === 'all' ? 'All topics' : supportTopicLabel[t]}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title="No answer for that yet"
          message="Nothing here matches your search. Send it to the desk and someone will write back."
          action={<Button onClick={() => jumpToForm(topic === 'all' ? undefined : topic)}>Ask the desk</Button>}
        />
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {shown.map((f) => {
            const open = openFaq === f.id;
            return (
              <div key={f.id}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? null : f.id)}
                  className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-[18px] py-4 text-left hover:bg-green-soft/60"
                >
                  <span className="flex-1 text-sm font-semibold">{f.q}</span>
                  <span className="hidden text-[12px] font-semibold text-muted sm:block">
                    {supportTopicLabel[f.topic]}
                  </span>
                  <IconChevron
                    className={cx('h-4 w-4 flex-none text-green transition-transform', open && 'rotate-180')}
                  />
                </button>
                {open && (
                  <div className="px-[18px] pb-4 sm:pr-[15%]">
                    <p className="m-0 text-[13.5px] leading-relaxed text-muted">{f.a}</p>
                    <button
                      type="button"
                      onClick={() => jumpToForm(f.topic)}
                      className="mt-2.5 cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-green hover:underline"
                    >
                      Still stuck? Ask the {supportTopicLabel[f.topic].toLowerCase()} desk →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket desk */}
      <SectionTitle title="Raise a request" />
      <div ref={formRef} className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="What is it about?">
              <select
                className={inputClass}
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value as SupportTopic })}
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {supportTopicLabel[t]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Subject">
              <input
                className={inputClass}
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Rent paid but no receipt"
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Tell us what happened" hint="Add unit numbers, order or booking references where you can.">
              <textarea
                rows={5}
                className={cx(inputClass, 'resize-y')}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Describe the issue in a sentence or two…"
              />
            </Field>
          </div>

          {error && <div className="mt-4">
            <ErrorNote>{error}</ErrorNote>
          </div>}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={submit} disabled={busy}>
              {busy ? 'Sending…' : 'Send to the desk'}
            </Button>
            <span className="text-[12.5px] text-muted">
              Raised as <b className="font-semibold text-ink">{user?.name}</b> · {user?.email}
            </span>
          </div>
        </div>

        <div className="card flex flex-col gap-3 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-[11px] bg-honey-soft text-honey">
            <IconShield className="h-[22px] w-[22px]" />
          </span>
          <h3 className="display m-0 text-base font-semibold">Urgent or unsafe?</h3>
          <p className="m-0 text-[13.5px] leading-snug text-muted">
            For a gas leak, live wiring or anything structural, call the desk on{' '}
            <b className="font-semibold text-ink">1800 123 4567</b> instead of raising a ticket — we
            dispatch the nearest professional and hold the visit charge.
          </p>
          <p className="m-0 mt-auto border-t border-line pt-3 text-[12.5px] text-muted">
            RentEase never asks for your card PIN, OTP or wallet password. Anyone who does is not us.
          </p>
        </div>
      </div>

      <SectionTitle title="Your requests" />
      {tickets.length === 0 ? (
        <EmptyState
          title="No open requests"
          message="Anything you send the desk shows up here with its reference and status."
        />
      ) : (
        <div className="card overflow-hidden">
          {tickets.map((t) => (
            <div key={t.id} className="border-b border-line px-[18px] py-4 last:border-b-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-green-soft text-green">
                  <IconHelp className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <b className="block text-sm font-semibold">{t.subject}</b>
                  <span className="block text-[12.5px] text-muted">
                    {t.reference} · {supportTopicLabel[t.topic]} · {prettyDate(t.date)}
                  </span>
                </div>
                <StatusPill tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</StatusPill>
                {t.status !== 'resolved' && (
                  <Button variant="ghost" size="sm" onClick={() => resolve(t.id)}>
                    Mark resolved
                  </Button>
                )}
              </div>

              <p className="m-0 mt-3 ml-[52px] text-[13.5px] leading-snug text-muted">{t.message}</p>
              <div className="mt-3 ml-[52px] rounded-[10px] border border-line bg-[#F3F6F1] px-3.5 py-3">
                <b className="block text-[12.5px] font-semibold text-green">{t.agent}</b>
                <p className="m-0 mt-1 text-[13px] leading-snug text-muted">{t.reply}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <SuccessModal
        open={!!raised}
        title="Request sent"
        message={
          <>
            Your reference is <b>{raised?.reference}</b>. The <b>{raised?.agent}</b> has it and will
            reply on <b>{user?.email}</b>. You can follow it under your requests.
          </>
        }
        onClose={() => setRaised(null)}
        actions={<Button onClick={() => setRaised(null)}>Done</Button>}
      />
    </>
  );
}
