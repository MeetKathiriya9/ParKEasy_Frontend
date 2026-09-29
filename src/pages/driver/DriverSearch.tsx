import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { SectionHeader, Badge, EmptyState } from '@/components/ui';
import { facilities } from '@/data/mockData';
import { Search, MapPin, Star, Zap, Shield, Accessibility, Clock, Navigation, Filter, CheckCircle2, TrendingUp } from 'lucide-react';

type SortBy = 'distance' | 'price' | 'availability' | 'rating';

export function DriverSearch() {
  const { selectFacility } = useApp();
  const [destination, setDestination] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('distance');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    evCharging: false,
    covered: false,
    accessible: false,
    openNow: false,
    reservable: false,
    maxPrice: 10,
  });

  const filtered = useMemo(() => {
    let result = facilities.filter((f) => {
      if (filters.evCharging && !f.hasEV) return false;
      if (filters.covered && !f.hasCovered) return false;
      if (filters.accessible && !f.hasAccessible) return false;
      if (filters.openNow && !f.openNow) return false;
      if (filters.reservable && !f.isReservable) return false;
      if (f.hourlyRate > filters.maxPrice) return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'distance': return (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0);
        case 'price': return a.hourlyRate - b.hourlyRate;
        case 'availability': return b.availableSpaces - a.availableSpaces;
        case 'rating': return b.rating - a.rating;
      }
    });
    return result;
  }, [filters, sortBy]);

  const recommended = filtered[0];

  const toggleFilter = (key: keyof typeof filters) => {
    if (key === 'maxPrice') return;
    setFilters({ ...filters, [key]: !filters[key] });
  };

  return (
    <div>
      <SectionHeader title="Find Parking" subtitle="Search for parking near your destination" />

      {/* Search bar */}
      <div className="pe-card p-4 mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a8a]" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter destination, address, or landmark..."
              className="pe-input pl-9"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`pe-btn-outline ${showFilters ? 'border-[#2563eb] text-[#3b82f6]' : ''}`}>
            <Filter size={16} /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-[#1e2d4d] pe-fade-in">
            <div className="flex flex-wrap gap-2 mb-4">
              {([
                { key: 'evCharging', label: 'EV Charging', icon: <Zap size={14} /> },
                { key: 'covered', label: 'Covered', icon: <Shield size={14} /> },
                { key: 'accessible', label: 'Accessible', icon: <Accessibility size={14} /> },
                { key: 'openNow', label: 'Open Now', icon: <Clock size={14} /> },
                { key: 'reservable', label: 'Reservable', icon: <CheckCircle2 size={14} /> },
              ] as const).map((f) => (
                <button
                  key={f.key}
                  onClick={() => toggleFilter(f.key)}
                  className={filters[f.key] ? 'pe-chip-active' : 'pe-chip-idle'}
                >
                  {f.icon} {f.label}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs text-[#8a98b5] font-medium mb-2 block">Max Price: ${filters.maxPrice}/hr</label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                className="w-full accent-[#2563eb]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sort + results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#8a98b5]">{filtered.length} facilities found</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8a98b5]">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="pe-input w-auto py-1.5 text-xs"
          >
            <option value="distance">Distance</option>
            <option value="price">Price</option>
            <option value="availability">Availability</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      {/* Smart Recommendation */}
      {recommended && (
        <div className="pe-card p-5 mb-4 border-[#10b981]/30 bg-gradient-to-r from-[#10b981]/5 to-transparent">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#10b981]/15 flex items-center justify-center text-[#10b981] flex-shrink-0">
              <TrendingUp size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-[#10b981] font-bold uppercase tracking-wider mb-1">Smart Recommendation</p>
              <p className="font-semibold">{recommended.name}</p>
              <p className="text-sm text-[#8a98b5] mt-1">
                Best match: {recommended.distanceMiles} mi away, {recommended.availableSpaces} spaces available, ${recommended.hourlyRate}/hr
                {recommended.hasEV && ', EV charging available'}.
              </p>
              <button onClick={() => selectFacility(recommended.id)} className="pe-btn-primary mt-3 text-sm">
                View Facility <Navigation size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Search size={28} />} title="No facilities found" message="Try adjusting your filters or search destination." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((f) => (
            <button key={f.id} onClick={() => selectFacility(f.id)} className="pe-card p-5 text-left hover:border-[#2563eb] transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold">{f.name}</p>
                  <p className="text-sm text-[#8a98b5] flex items-center gap-1 mt-1">
                    <MapPin size={14} /> {f.address} · {f.distanceMiles} mi
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star size={14} className="text-[#f59e0b]" fill="currentColor" />
                  <span className="font-semibold">{f.rating}</span>
                  <span className="text-[#5a6a8a] text-xs">({f.reviewCount})</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                {f.openNow ? <Badge color="green">Open Now</Badge> : <Badge color="red">Closed</Badge>}
                {f.hasEV && <Badge color="cyan"><Zap size={10} /> EV</Badge>}
                {f.hasCovered && <Badge color="blue">Covered</Badge>}
                {f.isReservable && <Badge color="amber">Reservable</Badge>}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs text-[#8a98b5]">Available</p>
                    <p className="font-bold text-[#10b981]">{f.availableSpaces} / {f.totalSpaces}</p>
                  </div>
                  <div className="w-px h-8 bg-[#1e2d4d]" />
                  <div>
                    <p className="text-xs text-[#8a98b5]">Rate</p>
                    <p className="font-bold">${f.hourlyRate}/hr</p>
                  </div>
                </div>
                <span className="text-[#3b82f6] text-sm font-medium group-hover:translate-x-1 transition-transform">View →</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
