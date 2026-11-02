import DashboardLayout from '@/Layouts/DashboardLayout';
import { featureFlags } from '@/config/features';
import { Head } from '@inertiajs/react';
import {
    Activity,
    ArrowDownRight,
    ArrowUp,
    ArrowUpRight,
    Boxes,
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleGauge,
    Download,
    Eye,
    Filter,
    Info,
    LoaderCircle,
    MessageCircleWarning,
    PackageSearch,
    RefreshCw,
    Search,
    Star,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Select from 'react-select';
import {
    Area,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    LabelList,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const numberFormat = new Intl.NumberFormat('id-ID');
const decimalFormat = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
const currencyFormat = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const sentimentMeta = {
    positive: { label: 'Positif', color: '#03ac0e' },
    neutral: { label: 'Netral', color: '#f59e0b' },
    negative: { label: 'Negatif', color: '#e25555' },
};

const categoryColors = {
    Elektronik: '#5b72d6',
    'Handphone & Tablet': '#7c5ce5',
    Kesehatan: '#0e9f9a',
    'Makanan & Minuman': '#e4a73c',
    Olahraga: '#ef6c68',
    Pertukangan: '#2b91d1',
};

const tokopediaGreens = ['#00880b', '#029b0d', '#03ac0e', '#19b923', '#35c43d', '#58cf60'];

const selectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: 40,
        borderRadius: 12,
        borderColor: state.isFocused ? '#03ac0e' : '#e2e8f0',
        backgroundColor: '#ffffff',
        boxShadow: state.isFocused ? '0 0 0 3px rgba(6, 182, 212, 0.12)' : 'none',
        cursor: 'pointer',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        ':hover': { borderColor: state.isFocused ? '#03ac0e' : '#cbd5e1' },
    }),
    valueContainer: (base) => ({ ...base, flexWrap: 'nowrap', overflowX: 'auto', padding: '0 10px' }),
    singleValue: (base) => ({ ...base, color: '#334155', fontSize: 13, fontWeight: 700 }),
    input: (base) => ({ ...base, color: '#334155', fontSize: 13, fontWeight: 600 }),
    placeholder: (base) => ({ ...base, color: '#94a3b8', fontSize: 12 }),
    multiValue: (base) => ({ ...base, flex: '0 0 auto', borderRadius: 7, backgroundColor: '#e8f8ea' }),
    multiValueLabel: (base) => ({ ...base, color: '#087b12', fontSize: 10, fontWeight: 700 }),
    multiValueRemove: (base) => ({
        ...base,
        borderRadius: '0 7px 7px 0',
        color: '#03ac0e',
        ':hover': { backgroundColor: '#d7f3da', color: '#087b12' },
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base, state) => ({
        ...base,
        color: state.isFocused ? '#03ac0e' : '#94a3b8',
        padding: 8,
        ':hover': { color: '#03ac0e' },
    }),
    menu: (base) => ({
        ...base,
        zIndex: 60,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        boxShadow: '0 16px 35px rgba(15, 23, 42, 0.14)',
    }),
    menuList: (base) => ({ ...base, padding: 6, maxHeight: 240 }),
    option: (base, state) => ({
        ...base,
        borderRadius: 8,
        backgroundColor: state.isSelected ? '#03ac0e' : state.isFocused ? '#e8f8ea' : '#ffffff',
        color: state.isSelected ? '#ffffff' : '#334155',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: state.isSelected ? 700 : 600,
        ':active': { backgroundColor: state.isSelected ? '#03ac0e' : '#d7f3da' },
    }),
    noOptionsMessage: (base) => ({ ...base, color: '#64748b', fontSize: 12 }),
};

function formatMonth(month) {
    return new Date(`${month}-01T00:00:00`).toLocaleDateString('id-ID', {
        month: 'short',
        year: '2-digit',
    });
}

function SelectFilter({ id, label, value, onChange, options, placeholder }) {
    return (
        <div className="min-w-0 flex-1">
            <label htmlFor={id} className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</label>
            <Select
                inputId={id}
                instanceId={id}
                value={options.filter((option) => value.includes(option.value))}
                onChange={(selected) => onChange(selected.map((option) => option.value))}
                options={options}
                styles={selectStyles}
                isSearchable
                isMulti
                isClearable
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                menuPosition="absolute"
                menuPlacement="auto"
                menuShouldScrollIntoView={false}
                placeholder={placeholder}
                noOptionsMessage={() => 'Data tidak ditemukan'}
                aria-label={`Filter ${label}`}
            />
        </div>
    );
}

function KpiCard({ icon: Icon, label, value, description, badge }) {
    return (
        <article className="group relative overflow-hidden rounded-2xl border border-[#03ac0e] bg-gradient-to-br from-[#03ac0e] to-[#00880b] p-4 text-white shadow-[0_12px_30px_rgba(3,172,14,0.20)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(3,172,14,0.28)] xl:p-5">
            <div className="pointer-events-none absolute -right-9 -top-10 size-28 rounded-full bg-white/10 transition-transform duration-300 group-hover:scale-110" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 size-24 rounded-full bg-emerald-950/10" />
            <div className="relative flex items-start justify-between gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl border border-white/15 bg-white/15 text-white backdrop-blur-sm">
                    <Icon className="size-[18px]" strokeWidth={2.2} />
                </div>
                {badge && <span className="rounded-full border border-white/15 bg-white/15 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">{badge}</span>}
            </div>
            <p className="relative mt-4 text-[11px] font-bold uppercase tracking-[0.13em] text-emerald-50/85">{label}</p>
            <p className="relative mt-1 text-[26px] font-extrabold tracking-[-0.04em] text-white">{value}</p>
            <p className="relative mt-1 truncate text-[11px] font-medium text-emerald-50/80">{description}</p>
        </article>
    );
}

function CardHeader({ eyebrow, title, description, action }) {
    return (
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-start xl:px-6">
            <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-700">{eyebrow}</p>
                <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">{title}</h2>
                {description && <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>}
            </div>
            {action}
        </div>
    );
}

function TrendTooltip({ active, payload, label, sentiments }) {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload;
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl">
            <p className="font-extrabold text-slate-800">{label}</p>
            <div className="mt-2 space-y-1.5">
                <p className="flex items-center justify-between gap-8 text-slate-500">
                    Volume {sentiments.length ? sentiments.map((sentiment) => sentimentMeta[sentiment].label.toLowerCase()).join(' + ') : 'ulasan'}
                    <span className="font-bold text-slate-800">{numberFormat.format(row.volume)}</span>
                </p>
                <p className="flex items-center justify-between gap-8 text-slate-500">
                    Ulasan negatif
                    <span className="font-bold text-rose-600">{decimalFormat.format(row.negativeRate)}%</span>
                </p>
            </div>
        </div>
    );
}

function ScatterTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    return (
        <div className="max-w-64 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl">
            <p className="line-clamp-2 font-extrabold leading-4 text-slate-800">{item.name}</p>
            <p className="mt-1 text-slate-400">{item.category}</p>
            <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1">
                <span className="text-slate-400">Harga</span><span className="text-right font-bold">{currencyFormat.format(item.price)}</span>
                <span className="text-slate-400">Terjual</span><span className="text-right font-bold">{numberFormat.format(item.sold)}</span>
                <span className="text-slate-400">Rating</span><span className="text-right font-bold">{decimalFormat.format(item.avgRating)}</span>
            </div>
        </div>
    );
}

function EmptyState({ children }) {
    return (
        <div className="flex h-full min-h-56 flex-col items-center justify-center px-6 text-center">
            <PackageSearch className="size-9 text-slate-300" />
            <p className="mt-3 max-w-sm text-sm font-semibold text-slate-500">{children}</p>
        </div>
    );
}

function paginationItems(currentPage, totalPages) {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

    const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    const visiblePages = [...pages]
        .filter((page) => page >= 1 && page <= totalPages)
        .sort((a, b) => a - b);

    return visiblePages.reduce((items, page, index) => {
        if (index > 0 && page - visiblePages[index - 1] > 1) items.push(`ellipsis-${page}`);
        items.push(page);
        return items;
    }, []);
}

function appendArrayParams(params, name, values) {
    values.forEach((value) => params.append(`${name}[]`, value));
}

function dashboardFilterParams(filters) {
    const params = new URLSearchParams();
    appendArrayParams(params, 'years', filters.year);
    appendArrayParams(params, 'categories', filters.category);
    appendArrayParams(params, 'sentiments', filters.sentiment);
    return params;
}

export default function Dashboard({ dashboard }) {
    const [filters, setFilters] = useState({ year: [], category: [], sentiment: [] });
    const [analytics, setAnalytics] = useState(dashboard.analytics);
    const [reviewResults, setReviewResults] = useState(dashboard.priorityReviews);
    const [reviewSearch, setReviewSearch] = useState('');
    const [debouncedReviewSearch, setDebouncedReviewSearch] = useState('');
    const [reviewFilters, setReviewFilters] = useState({ category: '', rating: '', minWords: '' });
    const [reviewPage, setReviewPage] = useState(1);
    const [reviewPageSize, setReviewPageSize] = useState(7);
    const [selectedReview, setSelectedReview] = useState(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isKpiDictionaryOpen, setIsKpiDictionaryOpen] = useState(false);
    const [showScrollToTop, setShowScrollToTop] = useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
    const [isReviewsLoading, setIsReviewsLoading] = useState(false);
    const [dataError, setDataError] = useState('');
    const [isFiltering, startFilterTransition] = useTransition();
    const reviewModalTimer = useRef(null);
    const skipInitialAnalyticsRequest = useRef(true);
    const skipInitialReviewsRequest = useRef(true);

    const setFilter = (key, value) => startFilterTransition(() => {
        setFilters((current) => ({ ...current, [key]: value.map(String) }));
    });
    const resetFilters = () => {
        startFilterTransition(() => {
            setFilters({ year: [], category: [], sentiment: [] });
            setReviewSearch('');
            setReviewFilters({ category: '', rating: '', minWords: '' });
            setReviewPage(1);
        });
    };

    const openReviewModal = (review) => {
        window.clearTimeout(reviewModalTimer.current);
        setSelectedReview(review);
        requestAnimationFrame(() => setIsReviewModalOpen(true));
    };

    const closeReviewModal = () => {
        setIsReviewModalOpen(false);
        window.clearTimeout(reviewModalTimer.current);
        reviewModalTimer.current = window.setTimeout(() => setSelectedReview(null), 140);
    };

    useEffect(() => {
        if (!selectedReview) return undefined;

        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') closeReviewModal();
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedReview]);

    useEffect(() => {
        const handleScroll = () => setShowScrollToTop(window.scrollY > 480);
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => () => window.clearTimeout(reviewModalTimer.current), []);

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedReviewSearch(reviewSearch.trim()), 250);
        return () => window.clearTimeout(timer);
    }, [reviewSearch]);

    const filterOptions = useMemo(() => ({
        years: [
            ...dashboard.filters.years.map((year) => ({ value: String(year), label: String(year) })),
        ],
        categories: [
            ...dashboard.filters.categories.map((category) => ({ value: category, label: category })),
        ],
        sentiments: [
            ...dashboard.filters.sentiments.map((sentiment) => ({ value: sentiment, label: sentimentMeta[sentiment].label })),
        ],
    }), [dashboard.filters.categories, dashboard.filters.sentiments, dashboard.filters.years]);

    useEffect(() => {
        if (skipInitialAnalyticsRequest.current) {
            skipInitialAnalyticsRequest.current = false;
            return undefined;
        }

        const controller = new AbortController();
        const params = dashboardFilterParams(filters);
        setIsAnalyticsLoading(true);
        setDataError('');

        fetch(`/dashboard/data?${params.toString()}`, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        })
            .then((response) => {
                if (!response.ok) throw new Error('Data analitik gagal dimuat.');
                return response.json();
            })
            .then(setAnalytics)
            .catch((error) => {
                if (error.name !== 'AbortError') setDataError(error.message);
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsAnalyticsLoading(false);
            });

        return () => controller.abort();
    }, [filters]);

    useEffect(() => {
        if (skipInitialReviewsRequest.current) {
            skipInitialReviewsRequest.current = false;
            return undefined;
        }

        const controller = new AbortController();
        const params = dashboardFilterParams(filters);
        if (reviewFilters.category) params.set('review_category', reviewFilters.category);
        if (reviewFilters.rating) params.set('rating', reviewFilters.rating);
        if (reviewFilters.minWords) params.set('min_words', reviewFilters.minWords);
        if (debouncedReviewSearch) params.set('search', debouncedReviewSearch);
        params.set('page', reviewPage);
        params.set('per_page', reviewPageSize);
        setIsReviewsLoading(true);
        setDataError('');

        fetch(`/dashboard/reviews?${params.toString()}`, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        })
            .then((response) => {
                if (!response.ok) throw new Error('Daftar ulasan gagal dimuat.');
                return response.json();
            })
            .then(setReviewResults)
            .catch((error) => {
                if (error.name !== 'AbortError') setDataError(error.message);
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsReviewsLoading(false);
            });

        return () => controller.abort();
    }, [debouncedReviewSearch, filters, reviewFilters, reviewPage, reviewPageSize]);

    const distribution = analytics.distribution;
    const totalBaseReviews = analytics.metrics.totalBaseReviews;
    const totalSelectedReviews = analytics.metrics.totalSelectedReviews;
    const filteredProductCount = analytics.metrics.filteredProductCount;
    const averageRating = analytics.metrics.averageRating;
    const selectedShare = analytics.metrics.selectedShare;
    const medianSold = analytics.metrics.medianSold;
    const trendData = useMemo(() => analytics.trendData.map((row) => ({
        ...row,
        label: formatMonth(row.month),
    })), [analytics.trendData]);
    const categoryData = analytics.categoryData;

    const scatterGroups = useMemo(() => {
        return dashboard.filters.categories.map((category) => ({
            category,
            rows: analytics.scatterPoints.filter((product) => product.category === category).map((product) => ({
                ...product,
                logPrice: Math.log1p(product.price),
                logSold: Math.log1p(product.sold),
            })),
        })).filter((group) => group.rows.length);
    }, [analytics.scatterPoints, dashboard.filters.categories]);

    const regressionData = analytics.regressionData;
    const paginatedPriorityReviews = reviewResults.data;
    const reviewTotalPages = Math.max(1, reviewResults.lastPage);
    const activeReviewPage = Math.min(reviewResults.currentPage, reviewTotalPages);
    const reviewPaginationItems = paginationItems(activeReviewPage, reviewTotalPages);
    const activeReviewFilterCount = Object.values(reviewFilters).filter(Boolean).length;
    const reviewResultStart = reviewResults.from;
    const reviewResultEnd = reviewResults.to;

    useEffect(() => {
        setReviewPage(1);
    }, [filters, reviewFilters, reviewSearch, reviewPageSize]);

    const liveCorrelation = analytics.metrics.correlation;
    const topCategory = categoryData[0];
    const negativeRate = analytics.metrics.negativeRate;
    const filterCount = Object.values(filters).reduce((total, values) => total + values.length, 0);

    const downloadSummary = () => {
        const rows = [
            ['Metrik', 'Nilai'],
            ['Periode', filters.year.length ? filters.year.join(' + ') : 'Semua tahun'],
            ['Kategori', filters.category.length ? filters.category.join(' + ') : 'Semua kategori'],
            ['Sentimen', filters.sentiment.length ? filters.sentiment.map((sentiment) => sentimentMeta[sentiment].label).join(' + ') : 'Semua sentimen'],
            ['Jumlah ulasan', totalSelectedReviews],
            ['Produk aktif', filteredProductCount],
            ['Rating rata-rata', averageRating.toFixed(2)],
            ['Porsi sentimen', `${selectedShare.toFixed(2)}%`],
            ['Median terjual per produk', medianSold],
        ];
        const content = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
        const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `ringkasan-bi-tokopedia-${filters.year.length ? filters.year.join('-') : 'semua-tahun'}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const sentimentCardLabel = !filters.sentiment.length
        ? 'Sentimen positif'
        : filters.sentiment.length === 1
          ? `Porsi ${sentimentMeta[filters.sentiment[0]].label.toLowerCase()}`
          : 'Porsi sentimen pilihan';

    const kpiDefinitions = [
        {
            number: '01',
            title: 'Ulasan terfilter',
            value: numberFormat.format(totalSelectedReviews),
            formula: 'COUNT(review_id)',
            grain: 'Review-level',
            explanation: 'Jumlah ulasan unik yang sesuai dengan kombinasi periode, kategori, dan sentimen yang dipilih.',
            accent: '#03ac0e',
        },
        {
            number: '02',
            title: 'Produk aktif',
            value: numberFormat.format(filteredProductCount),
            formula: 'COUNT DISTINCT(product_id)',
            grain: 'Product-level',
            explanation: 'Jumlah produk berbeda yang memiliki setidaknya satu ulasan pada konteks filter aktif.',
            accent: '#5874d8',
        },
        {
            number: '03',
            title: 'Rating rata-rata',
            value: decimalFormat.format(averageRating),
            formula: 'SUM(rating) ÷ COUNT(review_id)',
            grain: 'Review-level',
            explanation: 'Rata-rata penilaian pelanggan pada skala 1–5. Nilai yang lebih tinggi menunjukkan kepuasan lebih baik.',
            accent: '#e6a72f',
        },
        {
            number: '04',
            title: sentimentCardLabel,
            value: `${decimalFormat.format(selectedShare)}%`,
            formula: 'Ulasan sentimen ÷ seluruh ulasan × 100%',
            grain: 'Review-level',
            explanation: 'Persentase sentimen pada konteks filter. Label sentimen berasal dari rating: 1–2 negatif, 3 netral, dan 4–5 positif.',
            accent: '#e06262',
        },
        {
            number: '05',
            title: 'Median terjual',
            value: numberFormat.format(medianSold),
            formula: 'MEDIAN(sold_count per product_id)',
            grain: 'Product-level',
            explanation: 'Nilai tengah jumlah terjual antarproduk. Produk dideduplikasi agar sold_count tidak terhitung berulang untuk setiap ulasan.',
            accent: '#7a5bd5',
        },
    ];

    return (
        <DashboardLayout meta={dashboard.meta}>
            <Head title="Tokopedia Business Intelligence" />

            <section id="overview" className="scroll-mt-24">
                <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                            <CircleGauge className="size-4" />
                            EXECUTIVE OVERVIEW
                        </div>
                        <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-slate-950 sm:text-3xl">Tokopedia Commerce Intelligence</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Monitor performa produk, perilaku ulasan, dan sinyal kualitas untuk mendukung keputusan yang lebih cepat dan terukur.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={downloadSummary}
                        className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-[#03ac0e] px-4 text-xs font-bold text-white shadow-lg shadow-emerald-700/15 transition hover:bg-[#02920c] xl:self-auto"
                    >
                        <Download className="size-4" />
                        Unduh ringkasan
                    </button>
                </div>

            </section>

                <div className="sticky top-[76px] z-40 mt-6 rounded-2xl border border-emerald-100 bg-white/95 p-4 shadow-[0_12px_32px_rgba(3,172,14,0.10)] backdrop-blur-xl" aria-busy={isFiltering || isAnalyticsLoading}>
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                        <div className="flex w-full items-center justify-between gap-3 xl:w-auto xl:pr-3">
                            <div className="flex items-center gap-2">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#03ac0e]">
                                    <Filter className="size-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-extrabold text-slate-800">Filter data</p>
                                    <p className="text-[10px] text-slate-400">{filterCount ? `${filterCount} filter aktif` : 'Semua data ditampilkan'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {(isFiltering || isAnalyticsLoading) && (
                                    <span className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-[10px] font-bold text-emerald-800" role="status">
                                        <LoaderCircle className="size-3.5 animate-spin" />
                                        Memuat data
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setMobileFiltersOpen((open) => !open)}
                                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-100 xl:hidden"
                                    aria-expanded={mobileFiltersOpen}
                                    aria-controls="dashboard-filter-controls"
                                >
                                    {mobileFiltersOpen ? 'Tutup' : 'Atur filter'}
                                    <ChevronDown className={`size-3.5 transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        </div>
                        <div id="dashboard-filter-controls" className={`${mobileFiltersOpen ? 'grid' : 'hidden'} flex-1 gap-3 sm:grid-cols-3 xl:grid`}>
                            <SelectFilter id="filter-year" label="Periode" value={filters.year} onChange={(value) => setFilter('year', value)} options={filterOptions.years} placeholder="Semua tahun" />
                            <SelectFilter id="filter-category" label="Kategori" value={filters.category} onChange={(value) => setFilter('category', value)} options={filterOptions.categories} placeholder="Semua kategori" />
                            <SelectFilter id="filter-sentiment" label="Sentimen" value={filters.sentiment} onChange={(value) => setFilter('sentiment', value)} options={filterOptions.sentiments} placeholder="Semua sentimen" />
                        </div>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className={`${mobileFiltersOpen ? 'inline-flex' : 'hidden'} h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 xl:inline-flex`}
                        >
                            <RefreshCw className="size-3.5" /> Reset
                        </button>
                    </div>
                    {dataError && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-bold text-rose-700" role="alert">{dataError}</p>}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    <KpiCard icon={Activity} label="Ulasan terfilter" value={numberFormat.format(totalSelectedReviews)} description="Satu observasi per review_id" accent="#03ac0e" badge="Review-level" />
                    <KpiCard icon={Boxes} label="Produk aktif" value={numberFormat.format(filteredProductCount)} description="Produk dengan ulasan pada filter" accent="#5874d8" badge="Distinct" />
                    <KpiCard icon={Star} label="Rating rata-rata" value={decimalFormat.format(averageRating)} description="Skala penilaian 1 sampai 5" accent="#e6a72f" badge={averageRating >= 4.5 ? 'Sangat baik' : 'Perlu pantau'} badgeTone={averageRating >= 4.5 ? 'positive' : 'neutral'} />
                    <KpiCard icon={MessageCircleWarning} label={sentimentCardLabel} value={`${decimalFormat.format(selectedShare)}%`} description="Proporsi dari ulasan pada periode" accent="#e06262" badge={!filters.sentiment.length ? 'Positive share' : 'Selected share'} badgeTone={filters.sentiment.includes('negative') ? 'negative' : 'positive'} />
                    <KpiCard icon={PackageSearch} label="Median terjual" value={numberFormat.format(medianSold)} description="Dihitung pada produk unik" accent="#7a5bd5" badge="Product-level" />
                </div>
            {featureFlags.kpiDictionary && (
            <section id="kpi-dictionary" className="mt-5 scroll-mt-[172px]">
                <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-end xl:px-6">
                        <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-700">KPI dictionary</p>
                            <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">Cara membaca KPI dashboard</h2>
                            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">Setiap KPI mengikuti filter aktif. Grain data ditampilkan agar metrik ulasan dan produk tidak tercampur.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsKpiDictionaryOpen((isOpen) => !isOpen)}
                            className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-800 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:self-auto"
                            aria-expanded={isKpiDictionaryOpen}
                            aria-controls="kpi-dictionary-content"
                        >
                            {isKpiDictionaryOpen ? 'Tutup detail' : 'Buka detail'}
                            <ChevronDown className={`size-3.5 transition-transform ${isKpiDictionaryOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {isKpiDictionaryOpen && (
                        <div id="kpi-dictionary-content">
                            <div className="grid gap-px bg-slate-100 sm:grid-cols-2 xl:grid-cols-5">
                                {kpiDefinitions.map((kpi) => (
                                    <div key={kpi.number} className="bg-white p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <span className="flex size-8 items-center justify-center rounded-lg text-[10px] font-extrabold" style={{ backgroundColor: `${kpi.accent}15`, color: kpi.accent }}>{kpi.number}</span>
                                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-slate-500">{kpi.grain}</span>
                                        </div>
                                        <p className="mt-4 text-xs font-extrabold text-slate-800">{kpi.title}</p>
                                        <p className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-slate-950">{kpi.value}</p>
                                        <div className="mt-3 rounded-lg bg-slate-50 px-2.5 py-2 font-mono text-[9px] font-bold leading-4 text-slate-500">{kpi.formula}</div>
                                        <p className="mt-3 text-[10px] leading-[1.65] text-slate-500">{kpi.explanation}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 border-t border-amber-100 bg-amber-50/70 px-5 py-3 text-[10px] font-semibold leading-4 text-amber-900 xl:px-6">
                                <Info className="mt-0.5 size-3.5 shrink-0" />
                                <p><strong>Catatan interpretasi:</strong> sold_count adalah atribut produk, bukan transaksi bulanan. Karena itu dashboard menggunakan median pada produk unik dan tidak menjumlahkannya dari seluruh baris ulasan.</p>
                            </div>
                        </div>
                    )}
                </article>
            </section>
            )}

            <section id="performance" className="mt-5 scroll-mt-[172px] space-y-5">
                <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                    <CardHeader
                        eyebrow="Temporal performance"
                        title="Tren volume ulasan dan risiko sentimen"
                        description="Volume mengikuti filter sentimen; garis merah menunjukkan proporsi ulasan negatif dari seluruh sentimen."
                        action={<span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-500"><CalendarDays className="size-3.5" /> Bulanan</span>}
                    />
                    <div className="h-[330px] px-1 pb-4 pt-5 sm:px-4">
                        {trendData.some((row) => row.volume > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={trendData} margin={{ top: 5, right: 24, bottom: 0, left: 0 }}>
                                    <defs>
                                        <linearGradient id="reviewArea" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#03ac0e" stopOpacity={0.28} />
                                            <stop offset="100%" stopColor="#03ac0e" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="#e9eef5" vertical={false} />
                                    <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} interval={trendData.length > 24 ? 3 : 1} />
                                    <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={42} tickFormatter={(value) => numberFormat.format(value)} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={38} tickFormatter={(value) => `${value}%`} />
                                    <Tooltip content={<TrendTooltip sentiments={filters.sentiment} />} />
                                    <Area yAxisId="left" type="monotone" dataKey="volume" name="Volume ulasan" stroke="#03ac0e" strokeWidth={2.5} fill="url(#reviewArea)" />
                                    <Line yAxisId="right" type="monotone" dataKey="negativeRate" name="Sentimen negatif" stroke="#e25555" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : <EmptyState>Tidak ada tren yang dapat ditampilkan untuk kombinasi filter ini.</EmptyState>}
                    </div>
                </article>

                <div className="grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
                    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                        <CardHeader
                            eyebrow="Category benchmark"
                            title="Median penjualan per kategori"
                            description={`Mengikuti filter aktif: ${filters.year.length ? filters.year.join(' + ') : 'semua tahun'}, ${filters.category.length ? filters.category.join(' + ') : 'semua kategori'}, dan ${filters.sentiment.length ? filters.sentiment.map((sentiment) => sentimentMeta[sentiment].label.toLowerCase()).join(' + ') : 'semua sentimen'}.`}
                            action={<span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-800">{numberFormat.format(filteredProductCount)} produk</span>}
                        />
                        <div className="h-[330px] px-2 pb-5 pt-5 sm:px-5">
                            {categoryData.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart key={`${filters.year.join('-')}-${filters.category.join('-')}-${filters.sentiment.join('-')}`} data={categoryData} layout="vertical" margin={{ top: 0, right: 78, bottom: 0, left: 12 }}>
                                        <CartesianGrid stroke="#edf1f6" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="shortCategory" width={112} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(value) => [numberFormat.format(value), 'Median terjual']} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="medianSold" radius={[0, 7, 7, 0]} barSize={20}>
                                            {categoryData.map((row, index) => <Cell key={row.category} fill={tokopediaGreens[index % tokopediaGreens.length]} />)}
                                            <LabelList dataKey="medianSold" position="right" formatter={(value) => numberFormat.format(value)} fill="#087b12" fontSize={10} fontWeight={800} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <EmptyState>Belum ada produk yang cocok dengan filter saat ini.</EmptyState>}
                        </div>
                    </article>

                    <article id="sentiment" className="scroll-mt-[172px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                        <CardHeader eyebrow="Customer voice" title="Distribusi sentimen" description="Konteks seluruh sentimen pada periode dan kategori terpilih." />
                        <div className="relative h-[245px] px-4 pt-3">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={88} paddingAngle={3} stroke="none">
                                        {distribution.map((entry) => <Cell key={entry.key} fill={entry.color} opacity={!filters.sentiment.length || filters.sentiment.includes(entry.key) ? 1 : 0.35} />)}
                                    </Pie>
                                    <Tooltip formatter={(value) => numberFormat.format(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-3">
                                <span className="text-2xl font-extrabold tracking-tight text-slate-900">{decimalFormat.format(negativeRate)}%</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Negatif</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 border-t border-slate-100">
                            {distribution.map((item) => (
                                <div key={item.key} className="border-r border-slate-100 px-2 py-3 text-center last:border-r-0">
                                    <div className="mx-auto mb-1 size-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <p className="text-[10px] font-bold text-slate-500">{item.name}</p>
                                    <p className="mt-0.5 text-xs font-extrabold text-slate-800">{numberFormat.format(item.value)}</p>
                                </div>
                            ))}
                        </div>
                    </article>
                </div>

                <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                    <CardHeader
                        eyebrow="Price intelligence"
                        title="Peta harga dan jumlah terjual"
                        description="Sampel produk pada skala logaritmik; garis merah putus-putus menunjukkan tren regresi harga terhadap jumlah terjual."
                        action={<div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${liveCorrelation < 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{liveCorrelation < 0 ? <ArrowDownRight className="size-3.5" /> : <ArrowUpRight className="size-3.5" />} r = {decimalFormat.format(liveCorrelation)}</div>}
                    />
                    <div className="h-[390px] px-1 pb-4 pt-5 sm:px-4">
                        {scatterGroups.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 4, right: 18, bottom: 10, left: 4 }}>
                                    <CartesianGrid stroke="#e9eef5" />
                                    <XAxis type="number" dataKey="logPrice" name="Harga" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'ln(1 + harga)', position: 'insideBottom', offset: -7, fill: '#94a3b8', fontSize: 10 }} />
                                    <YAxis type="number" dataKey="logSold" name="Terjual" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={40} label={{ value: 'ln(1 + terjual)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                                    <Tooltip content={<ScatterTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 14 }} />
                                    {scatterGroups.map((group) => (
                                        <Scatter key={group.category} name={group.category} data={group.rows} fill={categoryColors[group.category] || '#03ac0e'} fillOpacity={0.64} />
                                    ))}
                                    <Scatter
                                        name="Garis regresi"
                                        data={regressionData}
                                        fill="none"
                                        line={{ stroke: '#ef4444', strokeWidth: 3, strokeDasharray: '8 5' }}
                                        shape={() => null}
                                        legendType="line"
                                        tooltipType="none"
                                        isAnimationActive={false}
                                    />
                                </ScatterChart>
                            </ResponsiveContainer>
                        ) : <EmptyState>Tidak ada produk untuk divisualisasikan pada filter ini.</EmptyState>}
                    </div>
                </article>
            </section>

            <section id="recommendations" className="mt-5 scroll-mt-[172px] grid gap-5 xl:grid-cols-[1.65fr_0.85fr]">
                <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                    <CardHeader
                        eyebrow="Priority queue"
                        title="Ulasan negatif yang perlu perhatian"
                        description="Diurutkan berdasarkan panjang ulasan sebagai sinyal kedalaman masalah."
                        action={
                            <label className="relative block">
                                <span className="sr-only">Cari produk atau isi ulasan</span>
                                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                                <input value={reviewSearch} onChange={(event) => setReviewSearch(event.target.value)} placeholder="Cari ulasan..." className="h-9 w-full rounded-xl border-slate-200 bg-slate-50 pl-9 pr-3 text-xs focus:border-emerald-500 focus:ring-emerald-500/20 sm:w-52" />
                            </label>
                        }
                    />
                    <div className="border-b border-slate-100 bg-slate-50/45 px-5 py-3 xl:px-6">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                    <Filter className="size-3.5" />
                                </span>
                                Filter daftar
                                {activeReviewFilterCount > 0 && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] text-white">{activeReviewFilterCount} aktif</span>}
                                {isReviewsLoading && <LoaderCircle className="size-3.5 animate-spin text-emerald-600" aria-label="Memuat ulasan" />}
                            </div>
                            <div className="grid gap-2 sm:grid-cols-3 lg:flex lg:items-center">
                                <label>
                                    <span className="sr-only">Filter kategori ulasan</span>
                                    <select
                                        value={reviewFilters.category}
                                        onChange={(event) => setReviewFilters((current) => ({ ...current, category: event.target.value }))}
                                        className="h-9 w-full rounded-xl border-slate-200 bg-white py-0 pl-3 pr-8 text-xs font-semibold text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20 lg:w-44"
                                    >
                                        <option value="">Semua kategori</option>
                                        {dashboard.filters.categories.map((category) => <option key={category} value={category}>{category}</option>)}
                                    </select>
                                </label>
                                <label>
                                    <span className="sr-only">Filter rating ulasan</span>
                                    <select
                                        value={reviewFilters.rating}
                                        onChange={(event) => setReviewFilters((current) => ({ ...current, rating: event.target.value }))}
                                        className="h-9 w-full rounded-xl border-slate-200 bg-white py-0 pl-3 pr-8 text-xs font-semibold text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20 lg:w-32"
                                    >
                                        <option value="">Semua rating</option>
                                        {[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>Rating {rating}</option>)}
                                    </select>
                                </label>
                                <label>
                                    <span className="sr-only">Filter panjang ulasan</span>
                                    <select
                                        value={reviewFilters.minWords}
                                        onChange={(event) => setReviewFilters((current) => ({ ...current, minWords: event.target.value }))}
                                        className="h-9 w-full rounded-xl border-slate-200 bg-white py-0 pl-3 pr-8 text-xs font-semibold text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20 lg:w-36"
                                    >
                                        <option value="">Semua panjang</option>
                                        <option value="20">Min. 20 kata</option>
                                        <option value="50">Min. 50 kata</option>
                                        <option value="100">Min. 100 kata</option>
                                    </select>
                                </label>
                                {activeReviewFilterCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setReviewFilters({ category: '', rating: '', minWords: '' })}
                                        className="h-9 rounded-xl px-2.5 text-[10px] font-bold text-slate-500 transition hover:bg-slate-100 hover:text-rose-600"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={`overflow-x-auto transition-opacity ${isReviewsLoading ? 'opacity-55' : 'opacity-100'}`} aria-busy={isReviewsLoading}>
                        {paginatedPriorityReviews.length ? (
                            <table className="w-full min-w-[760px] text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                                        <th className="px-5 py-3">Produk & ulasan</th>
                                        <th className="px-4 py-3">Kategori</th>
                                        <th className="px-4 py-3">Tanggal</th>
                                        <th className="px-4 py-3 text-center">Rating</th>
                                        <th className="px-5 py-3 text-right">Kata</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedPriorityReviews.map((review) => (
                                        <tr
                                            key={review.id}
                                            onClick={() => openReviewModal(review)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    openReviewModal(review);
                                                }
                                            }}
                                            className="group cursor-pointer border-b border-slate-100 outline-none transition last:border-0 hover:bg-emerald-50/60 focus-visible:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
                                            tabIndex={0}
                                            role="button"
                                            aria-label={`Lihat detail ulasan ${review.product}`}
                                        >
                                            <td className="max-w-md px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate text-xs font-bold text-slate-800">{review.product}</p>
                                                    <Eye className="size-3.5 shrink-0 text-emerald-600 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
                                                </div>
                                                <p className="mt-1 line-clamp-1 text-[11px] text-slate-400">“{review.text}”</p>
                                            </td>
                                            <td className="px-4 py-3.5"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{review.category}</span></td>
                                            <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-slate-500">{new Date(`${review.date}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td className="px-4 py-3.5 text-center"><span className="inline-flex size-6 items-center justify-center rounded-lg bg-rose-50 text-[11px] font-extrabold text-rose-600">{review.rating}</span></td>
                                            <td className="px-5 py-3.5 text-right text-xs font-extrabold text-slate-700">{review.words}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="py-10"><EmptyState>{filters.sentiment.length && !filters.sentiment.includes('negative') ? 'Filter sentimen saat ini tidak mencakup ulasan negatif.' : 'Tidak ada ulasan negatif yang cocok dengan filter atau pencarian.'}</EmptyState></div>
                        )}
                    </div>
                    {reviewResults.total > 0 && (
                        <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between xl:px-6">
                            <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-500">
                                <span>Menampilkan <strong className="text-slate-800">{numberFormat.format(reviewResultStart)}-{numberFormat.format(reviewResultEnd)}</strong> dari <strong className="text-slate-800">{numberFormat.format(reviewResults.total)}</strong> ulasan</span>
                                <label className="flex items-center gap-1.5">
                                    <span>Baris</span>
                                    <select
                                        value={reviewPageSize}
                                        onChange={(event) => setReviewPageSize(Number(event.target.value))}
                                        className="h-8 rounded-lg border-slate-200 bg-slate-50 py-0 pl-2 pr-7 text-[10px] font-bold text-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20"
                                    >
                                        {[7, 10, 20].map((size) => <option key={size} value={size}>{size}</option>)}
                                    </select>
                                </label>
                            </div>
                            <nav className="flex items-center gap-1" aria-label="Pagination ulasan negatif">
                                <button
                                    type="button"
                                    onClick={() => setReviewPage((page) => Math.max(1, page - 1))}
                                    disabled={activeReviewPage === 1}
                                    className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Halaman sebelumnya"
                                >
                                    <ChevronLeft className="size-3.5" />
                                </button>
                                {reviewPaginationItems.map((item) => typeof item === 'number' ? (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setReviewPage(item)}
                                        className={`flex size-8 items-center justify-center rounded-lg text-[10px] font-extrabold transition ${item === activeReviewPage ? 'bg-emerald-600 text-white shadow-sm' : 'border border-slate-200 text-slate-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'}`}
                                        aria-label={`Halaman ${item}`}
                                        aria-current={item === activeReviewPage ? 'page' : undefined}
                                    >
                                        {item}
                                    </button>
                                ) : <span key={item} className="flex size-6 items-center justify-center text-xs text-slate-400">...</span>)}
                                <button
                                    type="button"
                                    onClick={() => setReviewPage((page) => Math.min(reviewTotalPages, page + 1))}
                                    disabled={activeReviewPage === reviewTotalPages}
                                    className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Halaman berikutnya"
                                >
                                    <ChevronRight className="size-3.5" />
                                </button>
                            </nav>
                        </div>
                    )}
                </article>

                <aside className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#03ac0e] to-[#00880b] text-white shadow-[0_14px_40px_rgba(3,172,14,0.25)]">
                    <div className="border-b border-white/10 px-5 py-5">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-100">Decision center</p>
                        <h2 className="mt-1 text-lg font-extrabold tracking-tight">Insight & tindakan</h2>
                        <p className="mt-1 text-xs leading-5 text-white/75">Rekomendasi yang mengikuti konteks filter aktif.</p>
                    </div>
                    <div className="space-y-3 p-4">
                        <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/20 text-xs font-extrabold text-white">01</span>
                                <div>
                                    <p className="text-xs font-extrabold">Prioritas kategori</p>
                                    <p className="mt-1.5 text-[11px] leading-5 text-white/75">{topCategory ? `${topCategory.category} mencatat median ${numberFormat.format(topCategory.medianSold)} unit. Pastikan strategi stok dan promosi mengikuti karakter kategori.` : 'Pilih filter yang memiliki produk untuk memperoleh rekomendasi kategori.'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/20 text-xs font-extrabold text-white">02</span>
                                <div>
                                    <p className="text-xs font-extrabold">Kualitas pelanggan</p>
                                    <p className="mt-1.5 text-[11px] leading-5 text-white/75">Proporsi negatif {decimalFormat.format(negativeRate)}%. Prioritaskan ulasan panjang agar detail masalah dapat ditindaklanjuti lebih cepat.</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/20 text-xs font-extrabold text-white">03</span>
                                <div>
                                    <p className="text-xs font-extrabold">Eksperimen harga</p>
                                    <p className="mt-1.5 text-[11px] leading-5 text-white/75">Korelasi harga–penjualan saat ini {decimalFormat.format(liveCorrelation)}. Uji diskon atau bundling secara terbatas, lalu bandingkan dengan kelompok kontrol.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mx-4 mb-4 flex gap-2 rounded-xl bg-white px-4 py-3 text-[#087b12] shadow-sm">
                        <Info className="mt-0.5 size-4 shrink-0" />
                        <p className="text-[10px] font-bold leading-4">Harga dan jumlah terjual merupakan atribut produk. Dashboard selalu mendeduplikasi produk sebelum menghitung metrik penjualan.</p>
                    </div>
                </aside>
            </section>

            {selectedReview && (
                <div
                    className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-[120ms] ease-out motion-reduce:transition-none ${isReviewModalOpen ? 'bg-slate-950/55 opacity-100 backdrop-blur-sm' : 'bg-slate-950/0 opacity-0 backdrop-blur-none'}`}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeReviewModal();
                    }}
                >
                    <div
                        className={`max-h-[88vh] w-full max-w-2xl transform-gpu overflow-y-auto rounded-3xl border border-emerald-100 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.32)] transition-all duration-[120ms] ease-out motion-reduce:transition-none ${isReviewModalOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-[0.985] opacity-0'}`}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="review-detail-title"
                    >
                        <div className="relative overflow-hidden bg-gradient-to-br from-[#03ac0e] to-[#00880b] px-5 py-5 text-white sm:px-6">
                            <div className="pointer-events-none absolute -right-12 -top-16 size-40 rounded-full bg-white/10" />
                            <div className="relative flex items-start justify-between gap-5">
                                <div>
                                    <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-emerald-100">Detail ulasan negatif</p>
                                    <h2 id="review-detail-title" className="mt-1.5 text-lg font-extrabold leading-7">{selectedReview.product}</h2>
                                    <p className="mt-1 text-xs text-white/75">ID ulasan: {selectedReview.id}</p>
                                </div>
                                <button type="button" onClick={closeReviewModal} className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white transition hover:rotate-90 hover:bg-white/25" aria-label="Tutup detail ulasan">
                                    <X className="size-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 sm:p-6">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl bg-slate-50 p-3.5">
                                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Kategori</p>
                                    <p className="mt-1 text-xs font-bold text-slate-800">{selectedReview.category}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-3.5">
                                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Tanggal</p>
                                    <p className="mt-1 text-xs font-bold text-slate-800">{new Date(`${selectedReview.date}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div className="rounded-2xl bg-rose-50 p-3.5">
                                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-rose-400">Rating & panjang</p>
                                    <p className="mt-1 text-xs font-bold text-rose-700">{selectedReview.rating}/5 · {selectedReview.words} kata</p>
                                </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">Isi ulasan lengkap</p>
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">“{selectedReview.text}”</p>
                            </div>

                            <div className="mt-5 flex justify-end">
                                <button type="button" onClick={closeReviewModal} className="inline-flex h-10 items-center justify-center rounded-xl bg-[#03ac0e] px-5 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#02920c] hover:shadow-lg">
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                disabled={!showScrollToTop}
                className={`fixed bottom-6 right-5 z-50 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#03ac0e] px-3.5 text-xs font-extrabold text-white shadow-[0_12px_30px_rgba(3,172,14,0.32)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#02920c] hover:shadow-[0_16px_35px_rgba(3,172,14,0.4)] focus:outline-none focus:ring-4 focus:ring-emerald-200 motion-reduce:transition-none sm:right-7 ${showScrollToTop ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-4 scale-90 opacity-0'}`}
                aria-label="Kembali ke atas"
                title="Kembali ke atas"
            >
                <ArrowUp className="size-4" strokeWidth={2.5} />
                <span className="hidden sm:inline">Ke atas</span>
            </button>

            <footer className="mt-6 flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-[10px] font-medium text-slate-400 sm:flex-row">
                <p>Commerce Insight BI · Data-driven decision making</p>
                <p>{dashboard.meta.grain}</p>
            </footer>
        </DashboardLayout>
    );
}
