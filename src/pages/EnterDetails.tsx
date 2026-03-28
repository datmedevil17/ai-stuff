import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileUpload } from "@/components/ui/file-upload";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import {
    IconUser, IconCash, IconBuildingBank, IconTarget, IconPaperclip,
    IconBriefcase, IconBuildingStore, IconSchool, IconBeach,
    IconDiamond, IconLinkOff, IconFlame, IconShieldHalfFilled, IconScale, IconDeviceLaptop,
    IconHeartbeat, IconLock, IconCar, IconX, IconTrendingUp,
    IconBrain, IconRobotFace, IconSparkles, IconChartPie
} from "@tabler/icons-react";


// ─── Types ────────────────────────────────────────────────────────────────────
interface FormState {
    firstName: string; lastName: string; age: string; employment: string;
    income: number; expenses: number; dependents: number;
    savings: string; investments: string; emi: string; loan: string; insurance: string[];
    goal: string; riskAppetite: number;
    files: File[]; chatQuery: string;
}
type Errors = Partial<Record<keyof FormState, string>>;

// ─── Config ───────────────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: "About You", icon: <IconUser className="w-5 h-5" />, hint: "This takes < 2 minutes" },
    { id: 2, label: "Cash Flow", icon: <IconCash className="w-5 h-5" />, hint: "We'll personalise your plan" },
    { id: 3, label: "Assets & Debts", icon: <IconBuildingBank className="w-5 h-5" />, hint: "You're doing great!" },
    { id: 4, label: "Goals", icon: <IconTarget className="w-5 h-5" />, hint: "One last big step" },
    { id: 5, label: "Documents", icon: <IconPaperclip className="w-5 h-5" />, hint: "Optional but powerful" },
];

const EMPLOYMENT_OPTIONS = [
    { label: "Salaried", icon: <IconBriefcase className="w-6 h-6" /> }, { label: "Self-Employed", icon: <IconDeviceLaptop className="w-6 h-6" /> },
    { label: "Business", icon: <IconBuildingStore className="w-6 h-6" /> }, { label: "Student", icon: <IconSchool className="w-6 h-6" /> },
    { label: "Retired", icon: <IconBeach className="w-6 h-6" /> },
];

const GOAL_OPTIONS = [
    { label: "Wealth Building", icon: <IconDiamond className="w-6 h-6 text-blue-400" />, desc: "Grow your portfolio" },
    { label: "Debt Freedom", icon: <IconLinkOff className="w-6 h-6 text-blue-400" />, desc: "Pay off EMIs faster" },
    { label: "FIRE", icon: <IconFlame className="w-6 h-6 text-orange-400" />, desc: "Retire early" },
    { label: "Emergency Fund", icon: <IconShieldHalfFilled className="w-6 h-6 text-green-400" />, desc: "6-month safety net" },
    { label: "Tax Optimisation", icon: <IconScale className="w-6 h-6 text-blue-400" />, desc: "Save more on taxes" },
    { label: "Child Education", icon: <IconSchool className="w-6 h-6" />, desc: "Plan for your child's future" },
];

const INSURANCE_OPTIONS = [
    { label: "Health", icon: <IconHeartbeat className="w-5 h-5" /> }, { label: "Term Life", icon: <IconLock className="w-5 h-5" /> },
    { label: "Vehicle", icon: <IconCar className="w-5 h-5" /> }, { label: "None", icon: <IconX className="w-5 h-5" /> },
];

const RISK_OPTIONS = [
    { label: "Conservative", icon: <IconShieldHalfFilled className="w-6 h-6 text-green-400" />, desc: "Stable returns, lower risk" },
    { label: "Moderate", icon: <IconScale className="w-6 h-6 text-blue-400" />, desc: "Balanced risk & growth" },
    { label: "Aggressive", icon: <IconFlame className="w-6 h-6 text-orange-400" />, desc: "High risk, high reward" },
];

const DEBT_FIELDS: { key: "savings" | "investments" | "emi" | "loan"; label: string; placeholder: string }[] = [
    { key: "savings", label: "Savings / FDs (₹)", placeholder: "2,00,000" },
    { key: "investments", label: "Portfolio – MF+Stocks (₹)", placeholder: "5,00,000" },
    { key: "emi", label: "Monthly EMI (₹)", placeholder: "15,000" },
    { key: "loan", label: "Outstanding Loan (₹)", placeholder: "3,00,000" },
];

const AI_HINTS: Record<number, string> = {
    1: "I'll use this to detect your financial persona",
    2: "Your savings rate helps me compare you with similar profiles",
    3: "Debt-to-income ratio shapes your risk assessment",
    4: "This directs the 6 AI agents to what matters most for you",
    5: "Uploading a PDF gives 3× more accurate recommendations",
};

const ANALYSIS_MESSAGES = [
    { msg: "Analyzing your spending patterns…", icon: <IconChartPie className="w-10 h-10 text-blue-400" /> },
    { msg: "Checking investment opportunities…", icon: <IconTrendingUp className="w-10 h-10 text-blue-400" /> },
    { msg: "Building your financial persona…", icon: <IconBrain className="w-10 h-10 text-blue-400" /> },
    { msg: "Deploying 6 AI agents…", icon: <IconRobotFace className="w-10 h-10 text-blue-400" /> },
    { msg: "Crafting your strategy…", icon: <IconSparkles className="w-10 h-10 text-blue-400" /> },
];

const DELIVER_ITEMS = [
    "💎 Personalised investment plan",
    "⚖️ Old vs New tax regime comparison",
    "🛡️ Insurance gap analysis",
    "🔥 FIRE roadmap with SIP schedule",
    "📊 Asset allocation rebalancing",
    "🎖️ Top 3 priority actions",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatINR = (n: number) => "₹" + n.toLocaleString("en-IN");

function savingsRate(income: number, expenses: number) {
    if (income <= 0) return 0;
    return Math.round(((income - expenses) / income) * 100);
}

function debtLoad(emi: string, income: number) {
    const e = parseFloat(emi) || 0;
    if (income <= 0 || e <= 0) return null;
    const r = (e / income) * 100;
    if (r < 20) return { label: "Low ✓", color: "text-green-400" };
    if (r < 40) return { label: "Medium", color: "text-yellow-400" };
    return { label: "High ⚠️", color: "text-red-400" };
}

function validate(step: number, form: FormState): Errors {
    const err: Errors = {};
    if (step === 1) {
        if (!form.firstName.trim()) err.firstName = "First name is required";
        const a = parseInt(form.age);
        if (!form.age || isNaN(a) || a < 18 || a > 90) err.age = "Enter a valid age (18–90)";
        if (!form.employment) err.employment = "Pick your employment type";
    }
    if (step === 2) {
        if (form.income <= 0) err.income = "Income must be greater than ₹0";
    }
    if (step === 4) {
        if (!form.goal) err.goal = "Please select a goal";
    }
    return err;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ErrorMsg({ msg }: { msg?: string }) {
    if (!msg) return null;
    return (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-xs text-red-400">⚠ {msg}
        </motion.p>
    );
}

function MoneySlider({ label, value, min, max, step = 2500, onChange, error }: {
    label: string; value: number; min: number; max: number;
    step?: number; onChange: (v: number) => void; error?: string;
}) {
    const pct = ((value - min) / (max - min)) * 100;
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400">{label}</span>
                <span className="font-clash text-base font-semibold text-white">{formatINR(value)}</span>
            </div>
            <div className="relative h-2 rounded-full bg-white/10">
                <div className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
                    style={{ width: `${pct}%` }} />
                <input type="range" min={min} max={max} step={step} value={value}
                    onChange={e => onChange(Number(e.target.value))}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                <div className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-400 bg-white shadow-md transition-all"
                    style={{ left: `${pct}%` }} />
            </div>
            <ErrorMsg msg={error} />
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EnterDetails() {
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
    const [errors, setErrors] = useState<Errors>({});
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [analysisIdx, setAnalysisIdx] = useState(0);
    const [showHint, setShowHint] = useState(true);


    const firstInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const [form, setForm] = useState<FormState>({
        firstName: "", lastName: "", age: "", employment: "",
        income: 60000, expenses: 35000, dependents: 0,
        savings: "", investments: "", emi: "", loan: "", insurance: [],
        goal: "", riskAppetite: 1,
        files: [], chatQuery: "",
    });

    // Autofocus first input on step change
    useEffect(() => {
        const t = setTimeout(() => firstInputRef.current?.focus(), 320);
        return () => clearTimeout(t);
    }, [step]);

    // Analysis animation loop
    useEffect(() => {
        if (!loading) return;
        if (analysisIdx >= ANALYSIS_MESSAGES.length) {
            const t = setTimeout(() => { setLoading(false); navigate("/platform"); }, 600);
            return () => clearTimeout(t);
        }
        const t = setTimeout(() => setAnalysisIdx(i => i + 1), 1300);
        return () => clearTimeout(t);
    }, [loading, analysisIdx, navigate]);

    const update = <K extends keyof FormState>(key: K, val: FormState[K]) =>
        setForm(f => ({ ...f, [key]: val }));

    const toggleInsurance = (opt: string) => {
        if (opt === "None") { update("insurance", ["None"]); return; }
        const next = form.insurance.includes(opt)
            ? form.insurance.filter(x => x !== opt)
            : [...form.insurance.filter(x => x !== "None"), opt];
        update("insurance", next);
    };

    const goNext = () => {
        const errs = validate(step, form);
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setErrors({});
        setDoneSteps(prev => new Set(prev).add(step));
        setDirection(1); setStep(s => s + 1); setShowHint(true);
    };

    const goPrev = () => { setErrors({}); setDirection(-1); setStep(s => s - 1); };

    const handleSubmit = () => {
        const errs = validate(step, form);
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setDoneSteps(prev => new Set(prev).add(step));
        setAnalysisIdx(0); setLoading(true);
    };

    const resetForm = () => {
        setSubmitted(false); setLoading(false); setStep(1);
        setDoneSteps(new Set()); setErrors({}); setShowHint(true);
        setForm({
            firstName: "", lastName: "", age: "", employment: "", income: 60000, expenses: 35000,
            dependents: 0, savings: "", investments: "", emi: "", loan: "", insurance: [],
            goal: "", riskAppetite: 1, files: [], chatQuery: ""
        });
    };

    const name = form.firstName.trim();
    const sr = savingsRate(form.income, form.expenses);
    const dl = debtLoad(form.emi, form.income);
    const pct = Math.round(((step - 1) / (STEPS.length - 1)) * 100);

    const slideV = {
        enter: (d: number) => ({ x: d > 0 ? 52 : -52, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (d: number) => ({ x: d > 0 ? -52 : 52, opacity: 0 }),
    };

    // ── Loading Screen ───────────────────────────────────────────────────────────
    if (loading) {
        const idx = Math.min(analysisIdx, ANALYSIS_MESSAGES.length - 1);
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#060d1f]">
                <div className="flex flex-col items-center gap-8 text-center">
                    <div className="relative h-24 w-24">
                        <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-400" />
                        <div className="absolute inset-3 animate-pulse rounded-full bg-blue-500/10" />
                        <span className="absolute inset-0 flex items-center justify-center text-3xl">
                            {ANALYSIS_MESSAGES[idx].icon}
                        </span>
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.p key={analysisIdx}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4 }}
                            className="font-clash text-xl font-semibold text-white">
                            {ANALYSIS_MESSAGES[idx].msg}
                        </motion.p>
                    </AnimatePresence>
                    <div className="flex gap-2">
                        {ANALYSIS_MESSAGES.map((_, i) => (
                            <motion.div key={i}
                                animate={{ scale: i <= analysisIdx ? 1 : 0.5, opacity: i <= analysisIdx ? 1 : 0.25 }}
                                className="h-2 w-2 rounded-full bg-blue-400" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── Success Screen ───────────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#060d1f] px-6">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="flex w-full max-w-md flex-col items-center gap-6 text-center">
                    <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: 2, duration: 0.45 }}
                        className="text-6xl">🎯</motion.div>
                    <h1 className="font-clash text-4xl font-bold text-white">
                        {name ? `${name}'s plan is ready!` : "Your plan is ready!"}
                    </h1>
                    <p className="text-sm text-neutral-400">
                        FinPersona has analysed your profile and deployed the 6-agent War Room.
                    </p>
                    <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">You'll receive</p>
                        {DELIVER_ITEMS.map(item => (
                            <p key={item} className="py-0.5 text-sm text-neutral-300">{item}</p>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <Link to="/" className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-neutral-400 transition hover:text-white">
                            ← Home
                        </Link>
                        <button onClick={resetForm}
                            className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400">
                            Start Over
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ── Step title ────────────────────────────────────────────────────────────────
    const stepTitle = [
        name ? `Hey ${name} 👋` : "Let's get to know you 👋",
        name ? `${name}, tell us your cash flow` : "Tell us your cash flow",
        "What do you have & owe?",
        "What are you working towards?",
        "Supercharge with documents",
    ][step - 1];

    // ── Main Form ────────────────────────────────────────────────────────────────
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#060d1f] px-4 py-16">
            <div className="w-full max-w-lg">

                {/* Header */}
                <div className="mb-6 text-center">
                    <Link to="/" className="text-xs text-neutral-600 transition hover:text-neutral-300">← Back to home</Link>
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-blue-400/60">FinPersona · AI Financial Advisor</p>
                    <h1 className="font-clash mt-1 text-2xl font-bold text-white">{stepTitle}</h1>
                    <p className="mt-0.5 text-xs text-neutral-500">{STEPS[step - 1].hint}</p>
                </div>

                {/* Progress bar */}
                <div className="mb-1 flex items-center justify-between text-xs text-neutral-600">
                    <span>Step {step} of {STEPS.length}</span>
                    <span className="font-semibold text-blue-400">{pct}%</span>
                </div>
                <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-700 to-blue-400"
                        animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: "easeInOut" }} />
                </div>

                {/* Step dots */}
                <div className="mb-7 flex items-center">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex flex-1 items-center">
                            <motion.div
                                animate={doneSteps.has(s.id) ? { scale: [1, 1.2, 1] } : {}}
                                className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-full border text-sm transition-all duration-300",
                                    step === s.id ? "border-blue-400 bg-blue-500/20 text-blue-300 shadow-[0_0_14px_rgba(59,130,246,0.35)]"
                                        : doneSteps.has(s.id) ? "border-blue-500/40 bg-blue-500/10 text-green-400"
                                            : "border-white/10 bg-white/5 text-neutral-600"
                                )}>
                                {doneSteps.has(s.id) ? <IconX className="w-4 h-4" /> : s.icon}
                            </motion.div>
                            {i < STEPS.length - 1 && (
                                <div className={cn("mx-1 h-px flex-1 transition-colors duration-700",
                                    doneSteps.has(s.id) ? "bg-blue-500/40" : "bg-white/10")} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form card */}
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div key={step} custom={direction} variants={slideV}
                            initial="enter" animate="center" exit="exit"
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="p-7">

                            {/* ── STEP 1: About You ── */}
                            {step === 1 && (
                                <div className="flex flex-col gap-5">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-medium text-neutral-400">First Name</label>
                                            <input ref={firstInputRef} type="text" placeholder="Riya" value={form.firstName}
                                                onChange={e => { update("firstName", e.target.value); if (errors.firstName) setErrors(v => ({ ...v, firstName: undefined })); }}
                                                className={cn("w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-700 outline-none transition",
                                                    "focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/10",
                                                    errors.firstName ? "border-red-500/60" : "border-white/10")} />
                                            <ErrorMsg msg={errors.firstName} />
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-medium text-neutral-400">Last Name</label>
                                            <input type="text" placeholder="Sharma" value={form.lastName}
                                                onChange={e => update("lastName", e.target.value)}
                                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-700 outline-none transition focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/10" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-neutral-400">Age</label>
                                        <input type="number" placeholder="28" min={18} max={90} value={form.age}
                                            onChange={e => { update("age", e.target.value); if (errors.age) setErrors(v => ({ ...v, age: undefined })); }}
                                            className={cn("w-40 rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-700 outline-none transition",
                                                "focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/10",
                                                errors.age ? "border-red-500/60" : "border-white/10")} />
                                        <ErrorMsg msg={errors.age} />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-neutral-400">Employment Type</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {EMPLOYMENT_OPTIONS.map(opt => (
                                                <button key={opt.label} type="button"
                                                    onClick={() => { update("employment", opt.label); if (errors.employment) setErrors(v => ({ ...v, employment: undefined })); }}
                                                    className={cn("flex flex-col items-center gap-1.5 rounded-xl border p-3 transition active:scale-95",
                                                        form.employment === opt.label
                                                            ? "border-blue-400/60 bg-blue-500/15 shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                                                            : "border-white/10 bg-white/5 hover:border-white/20")}>
                                                    <span className="text-2xl">{opt.icon}</span>
                                                    <span className={cn("text-[10px] font-medium leading-tight text-center",
                                                        form.employment === opt.label ? "text-blue-300" : "text-neutral-500")}>
                                                        {opt.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                        <ErrorMsg msg={errors.employment} />
                                    </div>
                                </div>
                            )}

                            {/* ── STEP 2: Cash Flow ── */}
                            {step === 2 && (
                                <div className="flex flex-col gap-6">
                                    <MoneySlider label="Monthly Income" value={form.income} min={0} max={600000}
                                        onChange={v => { update("income", v); if (errors.income) setErrors(e => ({ ...e, income: undefined })); }}
                                        error={errors.income} />
                                    <MoneySlider label="Monthly Expenses" value={form.expenses} min={0} max={500000}
                                        onChange={v => update("expenses", v)} />

                                    {/* Stepper */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-neutral-400">Dependents</span>
                                        <div className="flex items-center gap-3">
                                            <button type="button" onClick={() => update("dependents", Math.max(0, form.dependents - 1))}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white/10 active:scale-90">−</button>
                                            <span className="w-5 text-center font-semibold text-white">{form.dependents}</span>
                                            <button type="button" onClick={() => update("dependents", Math.min(10, form.dependents + 1))}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white/10 active:scale-90">+</button>
                                        </div>
                                    </div>

                                    {/* Live insights card */}
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        className="rounded-xl border border-white/10 bg-white/5 p-4">
                                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Live Insights</p>
                                        <div className="flex flex-col gap-2.5">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-neutral-400">💰 Savings Rate</span>
                                                <span className={cn("font-semibold",
                                                    sr >= 30 ? "text-green-400" : sr >= 15 ? "text-yellow-400" : "text-red-400")}>
                                                    {sr}% — {sr >= 30 ? "Excellent" : sr >= 15 ? "Good" : "Low"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-neutral-400">📅 Monthly Surplus</span>
                                                <span className="font-semibold text-white">{formatINR(Math.max(0, form.income - form.expenses))}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            )}

                            {/* ── STEP 3: Assets & Debts ── */}
                            {step === 3 && (
                                <div className="flex flex-col gap-5">
                                    <div className="grid grid-cols-2 gap-3">
                                        {DEBT_FIELDS.map(f => (
                                            <div key={f.key}>
                                                <label className="mb-1.5 block text-xs font-medium text-neutral-400">{f.label}</label>
                                                <input type="number" placeholder={f.placeholder} value={form[f.key]}
                                                    onChange={e => update(f.key, e.target.value)}
                                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-700 outline-none transition focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/10" />
                                            </div>
                                        ))}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-medium text-neutral-400">Insurance Coverage</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {INSURANCE_OPTIONS.map(opt => (
                                                <button key={opt.label} type="button" onClick={() => toggleInsurance(opt.label)}
                                                    className={cn("flex flex-col items-center gap-1.5 rounded-xl border p-3 transition active:scale-95",
                                                        form.insurance.includes(opt.label)
                                                            ? "border-blue-400/60 bg-blue-500/15 text-blue-300"
                                                            : "border-white/10 bg-white/5 text-neutral-400 hover:border-white/20")}>
                                                    <span className="text-lg">{opt.icon}</span>
                                                    <span className="text-[10px] font-medium">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Debt snapshot */}
                                    <AnimatePresence>
                                        {dl && (
                                            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                className="rounded-xl border border-white/10 bg-white/5 p-4">
                                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Debt Snapshot</p>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-neutral-400">⚠️ Debt Load</span>
                                                    <span className={cn("font-semibold", dl.color)}>{dl.label}</span>
                                                </div>
                                                {parseFloat(form.emi) > 0 && form.income > 0 && (
                                                    <div className="mt-2 flex items-center justify-between text-sm">
                                                        <span className="text-neutral-400">💸 EMI/Income</span>
                                                        <span className="font-semibold text-white">
                                                            {Math.round((parseFloat(form.emi) / form.income) * 100)}%
                                                        </span>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* ── STEP 4: Goals & Risk ── */}
                            {step === 4 && (
                                <div className="flex flex-col gap-6">
                                    <div>
                                        <label className="mb-3 block text-xs font-medium text-neutral-400">Primary Financial Goal</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {GOAL_OPTIONS.map(g => (
                                                <button key={g.label} type="button"
                                                    onClick={() => { update("goal", g.label); if (errors.goal) setErrors(v => ({ ...v, goal: undefined })); }}
                                                    className={cn("flex items-start gap-3 rounded-xl border p-3.5 text-left transition active:scale-[0.98]",
                                                        form.goal === g.label
                                                            ? "border-blue-400/60 bg-blue-500/15 shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                                                            : "border-white/10 bg-white/5 hover:border-white/20")}>
                                                    <span className="mt-0.5 text-xl">{g.icon}</span>
                                                    <div>
                                                        <p className={cn("text-sm font-semibold", form.goal === g.label ? "text-blue-300" : "text-white")}>
                                                            {g.label}
                                                        </p>
                                                        <p className="text-[11px] text-neutral-500">{g.desc}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        <ErrorMsg msg={errors.goal} />
                                    </div>

                                    <div>
                                        <label className="mb-3 block text-xs font-medium text-neutral-400">Risk Appetite</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {RISK_OPTIONS.map((r, idx) => (
                                                <button key={r.label} type="button" onClick={() => update("riskAppetite", idx)}
                                                    className={cn("flex flex-col items-center gap-2 rounded-xl border p-4 transition active:scale-95",
                                                        form.riskAppetite === idx
                                                            ? "border-blue-400/60 bg-blue-500/15 shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                                                            : "border-white/10 bg-white/5 hover:border-white/20")}>
                                                    <span className="text-2xl">{r.icon}</span>
                                                    <p className={cn("text-xs font-semibold", form.riskAppetite === idx ? "text-blue-300" : "text-white")}>
                                                        {r.label}
                                                    </p>
                                                    <p className="text-center text-[10px] leading-tight text-neutral-500">{r.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── STEP 5: Documents ── */}
                            {step === 5 && (
                                <div className="flex flex-col gap-5">
                                    <div className="rounded-xl border border-dashed border-white/10 bg-black/20">
                                        <FileUpload onChange={files => update("files", files)} />
                                    </div>

                                    <AnimatePresence>
                                        {form.files.length > 0 && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2">
                                                {form.files.map((f, i) => (
                                                    <div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm">
                                                        <span>📄</span>
                                                        <span className="flex-1 truncate text-neutral-300">{f.name}</span>
                                                        <span className="text-xs text-green-400 animate-pulse">✓ Ready</span>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="flex items-center gap-3">
                                        <div className="h-px flex-1 bg-white/10" />
                                        <span className="text-xs text-neutral-600">or describe in plain english</span>
                                        <div className="h-px flex-1 bg-white/10" />
                                    </div>

                                    <textarea rows={3}
                                        placeholder="e.g. I got a ₹5L bonus, have 2 loans, want to retire at 45…"
                                        value={form.chatQuery} onChange={e => update("chatQuery", e.target.value)}
                                        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-700 outline-none transition focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/10" />

                                    {/* Delivery preview */}
                                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-400/60">You'll receive</p>
                                        {DELIVER_ITEMS.slice(0, 4).map(item => (
                                            <p key={item} className="py-0.5 text-xs text-neutral-400">{item}</p>
                                        ))}
                                    </div>

                                    <p className="text-center text-xs text-neutral-600">
                                        You can skip both — your profile data is enough to get started.
                                    </p>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>

                    {/* Nav footer */}
                    <div className="flex items-center justify-between border-t border-white/10 px-7 py-4">
                        {step > 1
                            ? <button onClick={goPrev} className="text-sm text-neutral-500 transition hover:text-white">← Back</button>
                            : <span />}
                        {step < STEPS.length
                            ? <button onClick={goNext}
                                className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-2.5 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-blue-700 active:scale-[0.97]">
                                Continue →
                            </button>
                            : <button onClick={handleSubmit}
                                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-2.5 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-blue-700 active:scale-[0.97]">
                                <span className="relative z-10">Submit &amp; Analyse 🚀</span>
                                <span className="absolute inset-0 animate-pulse bg-blue-400/10 opacity-0 group-hover:opacity-100 transition" />
                            </button>}
                    </div>
                </div>

                {/* Floating AI hint */}
                <AnimatePresence>
                    {showHint && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                            className="fixed bottom-8 right-8 flex max-w-[220px] items-start gap-2 rounded-2xl border border-white/10 bg-[#0d1835]/95 px-4 py-3 shadow-xl backdrop-blur-sm">
                            <span className="mt-0.5 text-base shrink-0">🤖</span>
                            <div className="flex-1">
                                <p className="text-[10px] text-neutral-600">FinPersona AI</p>
                                <p className="text-xs text-neutral-300">{AI_HINTS[step]}</p>
                            </div>
                            <button onClick={() => setShowHint(false)} className="text-[10px] text-neutral-600 hover:text-white">✕</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="mt-4 text-center text-[11px] text-neutral-700">
                    Your data is processed securely and never shared.
                </p>
            </div>
        </div>
    );
}
