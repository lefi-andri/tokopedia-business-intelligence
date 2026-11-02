import {
    BarChart3,
    CircleGauge,
    Database,
    Lightbulb,
    Menu,
    MessageSquareWarning,
    X,
} from 'lucide-react';
import { featureFlags } from '@/config/features';
import { useEffect, useState } from 'react';

const navigation = [
    { label: 'Overview', href: '#overview', icon: CircleGauge },
    ...(featureFlags.kpiDictionary
        ? [{ label: 'KPI Dictionary', href: '#kpi-dictionary', icon: Database }]
        : []),
    { label: 'Performance', href: '#performance', icon: BarChart3 },
    { label: 'Voice of Customer', href: '#sentiment', icon: MessageSquareWarning },
    { label: 'Recommendations', href: '#recommendations', icon: Lightbulb },
];

export default function DashboardLayout({ children, meta }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('overview');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 24);
        const sections = navigation
            .map((item) => document.querySelector(item.href))
            .filter(Boolean);
        const observer = new IntersectionObserver((entries) => {
            const visibleSection = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

            if (visibleSection) setActiveSection(visibleSection.target.id);
        }, { rootMargin: '-172px 0px -58% 0px', threshold: [0, 0.2, 0.5] });

        handleScroll();
        sections.forEach((section) => observer.observe(section));
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#f5faf5] text-slate-900">
            <header className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${scrolled ? 'border-emerald-100 bg-white/98 shadow-[0_8px_28px_rgba(3,172,14,0.09)]' : 'border-emerald-100/70 bg-white/92 shadow-[0_1px_12px_rgba(15,23,42,0.04)]'}`}>
                <div className={`mx-auto flex max-w-[1600px] items-center justify-between gap-5 px-4 transition-all duration-300 sm:px-6 xl:px-8 ${scrolled ? 'h-16' : 'h-[72px]'}`}>
                    <a href="#overview" className="flex shrink-0 items-center gap-3" aria-label="Tokopedia Insight BI">
                        <img src="/images/tokopedia.svg" alt="Tokopedia" className="h-7 w-auto sm:h-8" />
                        <span className="hidden border-l border-emerald-100 pl-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 sm:block">Insight BI</span>
                    </a>

                    <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi dashboard">
                        {navigation.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                onClick={() => setActiveSection(item.href.slice(1))}
                                className={`rounded-lg px-3 py-2 text-[12px] font-bold transition ${
                                    activeSection === item.href.slice(1)
                                        ? 'bg-[#e8f8ea] text-[#087b12]'
                                        : 'text-slate-500 hover:bg-emerald-50 hover:text-[#03ac0e]'
                                }`}
                                aria-current={activeSection === item.href.slice(1) ? 'page' : undefined}
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>

                    <div className="flex shrink-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen((open) => !open)}
                            className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
                            aria-expanded={mobileMenuOpen}
                            aria-label="Buka menu navigasi"
                        >
                            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
                        <nav className="mx-auto grid max-w-[1600px] gap-1 sm:grid-cols-2" aria-label="Navigasi dashboard seluler">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        onClick={() => {
                                            setActiveSection(item.href.slice(1));
                                            setMobileMenuOpen(false);
                                        }}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${activeSection === item.href.slice(1) ? 'bg-[#e8f8ea] text-[#087b12]' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#03ac0e]'}`}
                                    >
                                        <Icon className="size-4 text-[#03ac0e]" />
                                        {item.label}
                                    </a>
                                );
                            })}
                        </nav>
                        <div className="mx-auto mt-2 flex max-w-[1600px] items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-500">
                            <Database className="size-3.5 text-[#03ac0e]" />
                            Tokopedia Reviews · {meta.minDate} — {meta.maxDate}
                        </div>
                    </div>
                )}
            </header>

            <main className="mx-auto max-w-[1600px] px-4 pb-6 pt-[96px] sm:px-6 xl:px-8 xl:pb-8 xl:pt-[104px]">{children}</main>
        </div>
    );
}
