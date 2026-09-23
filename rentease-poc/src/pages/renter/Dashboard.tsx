import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  useProperties,
  useRenterBookings,
  useRenterRequests,
  useRewardCard,
  useUnits,
} from '../../api/hooks';
import { EmptyState, PageHead, SectionTitle } from '../../components/ui/Bits';
import { Button, LinkButton } from '../../components/ui/Button';
import { StatusPill, VerifiedBadge } from '../../components/ui/Chip';
import { ListingCard } from '../../components/ListingCard';
import { ServiceCard } from '../../components/ServiceCard';
import { FloorPlan } from '../../components/FloorPlan';
import { RewardsCard } from '../../components/RewardsCard';
import { SearchBar, ANY_TYPE, type SearchFilters } from '../../components/SearchBar';
import MyHome from './MyHome';
import { IconSofa, IconSparkle, IconWrench } from '../../components/icons';
import { filterUnits } from '../../lib/search';

export default function RenterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const units = useUnits();
  const properties = useProperties();
  const reqs = useRenterRequests(user?.id);
  const bookings = useRenterBookings(user?.id);
  const rewardCard = useRewardCard(user?.id);
  const [filters, setFilters] = useState<SearchFilters>({
    location: user?.city ?? 'Indore',
    type: ANY_TYPE,
    budget: 'any',
  });

  // A live lease replaces discovery: you get the home you have, not the ones you
  // might. Search and its filters live on /renter/search from then on.
  if (bookings.some((b) => b.status === 'active')) return <MyHome />;

  const matches = filterUnits(units, properties, filters);

  function search() {
    const params = new URLSearchParams({
      location: filters.location,
      type: filters.type,
      budget: filters.budget,
    });
    navigate(`/renter/search?${params}`);
  }

  return (
    <>
      <PageHead
        title="Find your next home"
        subtitle="Browse verified listings, book a tour, and move in — everything in one place."
        action={user?.verified ? <VerifiedBadge label="ID verified" /> : undefined}
      />

      <SearchBar value={filters} onChange={setFilters} onSubmit={search} />

      <SectionTitle title="Homes for you" link="/renter/search" linkLabel="View all" />
      {matches.length === 0 ? (
        <EmptyState
          title="No homes match that"
          message="Try widening the budget or clearing the location filter."
          action={
            <Button variant="ghost" onClick={() => setFilters({ location: '', type: ANY_TYPE, budget: 'any' })}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matches.slice(0, 3).map((u) => (
            <ListingCard key={u.id} unit={u} property={properties.find((p) => p.id === u.propertyId)} />
          ))}
        </div>
      )}

      {/* AI planner banner */}
      <div className="mt-4 flex items-center gap-6 overflow-hidden rounded-card bg-[linear-gradient(120deg,#153726,#245240)] px-[26px] py-6 text-[#EAF2E7]">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 text-[12.5px] font-semibold text-honey">Powered by AI</div>
          <h3 className="display m-0 mb-1.5 text-[22px] font-semibold text-[#F3F8F1]">
            See the room, already furnished
          </h3>
          <p className="m-0 max-w-[52ch] text-sm text-[#B9CDB6]">
            Pick the floor plan and RentEase lays out a bed, table and almirah that fit — then you rent
            or buy the pieces in a tap.
          </p>
          <LinkButton to="/planner" variant="honey" className="mt-4">
            Try the layout planner
          </LinkButton>
        </div>
        <div className="hidden w-[186px] flex-none rounded-xl border border-honey/40 bg-white/5 p-3 md:block">
          <FloorPlan type="2 BHK" tone="light" labels={false} furnished className="block h-[120px] w-full" />
        </div>
      </div>

      <SectionTitle title="Set up your home" className="mt-[34px]" />
      <div className="grid gap-4 lg:grid-cols-3">
        <ServiceCard
          icon={<IconSofa />}
          title="Furniture on rent or buy"
          body="Beds, tables and almirahs suggested from your floor plan so they fit the space. Rent monthly or buy outright."
          to="/furniture"
          linkLabel="Browse furniture"
        />
        <ServiceCard
          icon={<IconSparkle />}
          title="Festival & décor store"
          body="Lights, diyas and party décor for Diwali, housewarming or any function — buy, or rent in bulk for the day."
          to="/decor"
          linkLabel="Shop décor"
        />
        <ServiceCard
          icon={<IconWrench />}
          title="Home services"
          body="Book a verified plumber, electrician or construction help. Track the job and pay through the same wallet."
          to="/services"
          linkLabel="Book a pro"
        />
      </div>

      <div className="mt-[34px] grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div>
          <SectionTitle title="Your tours" link="/renter/tours" className="mt-0" />
          {reqs.length === 0 ? (
            <EmptyState
              title="No tours booked"
              message="Open a listing and hit ‘Book a tour’ — the owner replies right here."
            />
          ) : (
            <div className="card overflow-hidden">
              {reqs.slice(0, 4).map((r) => {
                const unit = units.find((u) => u.id === r.unitId);
                const prop = properties.find((p) => p.id === unit?.propertyId);
                return (
                  <div key={r.id} className="flex items-center gap-3.5 border-b border-line px-[18px] py-3.5 last:border-b-0">
                    <span className="h-10 w-[52px] flex-none rounded-lg border border-green-line bg-green-soft p-1">
                      {unit && <FloorPlan type={unit.floorPlanType} labels={false} className="h-full w-full" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <b className="block text-sm font-semibold">
                        {unit?.type} · {prop?.name ?? 'Listing'}
                      </b>
                      <span className="block text-[12.5px] text-muted">
                        {r.status === 'pending' ? 'Requested · awaiting owner' : (r.when ?? 'Slot to be confirmed')}
                      </span>
                    </div>
                    <StatusPill tone={r.status === 'accepted' ? 'ok' : r.status === 'declined' ? 'rented' : 'wait'}>
                      {r.status === 'accepted'
                        ? r.kind === 'booking'
                          ? 'Booking confirmed'
                          : 'Tour confirmed'
                        : r.status === 'declined'
                          ? 'Declined'
                          : 'Awaiting owner'}
                    </StatusPill>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <SectionTitle title="Rent" className="mt-0" />
          <EmptyState
            title="No active rental yet"
            message="Once an owner accepts your booking, this screen becomes your home — rent, bills, services and all."
          />

          {rewardCard && (
            <>
              <SectionTitle title="Rewards" link="/rewards" linkLabel="Open card" className="mt-[26px]" />
              <RewardsCard card={rewardCard} holder={user?.name ?? ''} compact />
              <p className="m-0 mt-2.5 text-[12.5px] leading-snug text-muted">
                Every rent payment earns RentPoints and cashback. Stay 3, 6 or 12 months and coins land
                on the same card.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
