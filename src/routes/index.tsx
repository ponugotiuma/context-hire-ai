import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Sparkles,
  Download,
  ArrowLeft,
  Github,
  Trophy,
  Medal,
  Award,
  ChevronDown,
  ShieldCheck,
  Loader2,
  Copy,
  TrendingUp,
  Users,
  Target,
  Link2,
} from "lucide-react";

import { extractPdfText } from "@/lib/pdf-extract";
import {
  rankCandidates,
  type RankedCandidate,
} from "@/lib/ranking.functions";
import { toCsv, downloadCsv, type RankedRow } from "@/lib/csv";
import { SAMPLE_JD, SAMPLE_RESUMES } from "@/data/sample";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ContextHire AI — Stop losing talent to keywords" },
      {
        name: "description",
        content:
          "Upload a JD and resumes. ContextHire AI ranks candidates by semantic fit, career trajectory, and behavioral signals — and explains every score.",
      },
      { property: "og:title", content: "ContextHire AI" },
      { property: "og:description", content: "Recruiting that thinks like a great human recruiter." },
    ],
  }),
  component: ContextHire,
});

type View = "upload" | "loading" | "results";

function ContextHire() {
  const [view, setView] = useState<View>("upload");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [anonymize, setAnonymize] = useState(true);
  const [ranked, setRanked] = useState<RankedCandidate[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");

  const rank = useServerFn(rankCandidates);

  const runPipeline = useCallback(
    async (jdText: string, resumes: { name: string; text: string }[]) => {
      setView("loading");
      setProgressLabel("Reading the room — embedding JD + resumes");
      const t0 = performance.now();
      try {
        const res = await rank({ data: { jdText, resumes, anonymize } });
        setRanked(res.ranked);
        setWarnings(res.warnings);
        setElapsed(Math.round(performance.now() - t0));
        setView("results");
        if (res.warnings.length) {
          toast.warning(`${res.warnings.length} non-fatal issue(s) — partial results shown.`);
        } else {
          toast.success(`Ranked ${resumes.length} candidates in ${(performance.now() - t0 / 1).toFixed(0)}ms`);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        toast.error(`Ranking failed: ${msg}`);
        setView("upload");
      }
    },
    [rank, anonymize],
  );

  const runFromFiles = useCallback(async () => {
    if (!jdFile) return toast.error("Upload a Job Description PDF first.");
    if (resumeFiles.length === 0) return toast.error("Add at least one resume PDF.");
    setView("loading");
    setProgressLabel("Parsing PDFs in your browser…");
    try {
      const jdText = await extractPdfText(jdFile);
      if (jdText.length < 40) throw new Error("JD PDF appears empty or image-only");
      const resumes: { name: string; text: string }[] = [];
      for (const f of resumeFiles) {
        try {
          const t = await extractPdfText(f);
          if (t.length < 40) {
            toast.warning(`${f.name} appears image-only — skipped`);
            continue;
          }
          resumes.push({ name: f.name, text: t });
        } catch {
          toast.warning(`${f.name} unreadable — skipped`);
        }
      }
      if (resumes.length === 0) throw new Error("No readable resume PDFs");
      await runPipeline(jdText, resumes);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error(`Parsing failed: ${msg}`);
      setView("upload");
    }
  }, [jdFile, resumeFiles, runPipeline]);

  const runDemo = useCallback(() => {
    toast.message("Running with bundled sample JD + 5 resumes");
    void runPipeline(SAMPLE_JD, SAMPLE_RESUMES);
  }, [runPipeline]);

  const reset = () => {
    setView("upload");
    setRanked([]);
    setWarnings([]);
    setJdFile(null);
    setResumeFiles([]);
  };

  return (
    <main className="min-h-screen bg-background bg-hero">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-display text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          ContextHire <span className="text-primary">AI</span>
        </div>
        <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          <span className="rounded-full border border-border px-2 py-0.5">v1.0</span>
          <span>Recruiting that thinks</span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {view === "upload" && (
          <UploadView
            key="upload"
            jdFile={jdFile}
            setJdFile={setJdFile}
            resumeFiles={resumeFiles}
            setResumeFiles={setResumeFiles}
            anonymize={anonymize}
            setAnonymize={setAnonymize}
            onRun={runFromFiles}
            onDemo={runDemo}
          />
        )}
        {view === "loading" && <LoadingView key="loading" label={progressLabel} />}
        {view === "results" && (
          <ResultsView
            key="results"
            ranked={ranked}
            warnings={warnings}
            elapsedMs={elapsed}
            onBack={reset}
          />
        )}
      </AnimatePresence>

      <footer className="mx-auto max-w-6xl px-6 py-12 text-center text-xs text-muted-foreground">
        Hybrid scoring: <span className="text-foreground">60% semantic</span> ·{" "}
        <span className="text-foreground">30% trajectory</span> ·{" "}
        <span className="text-foreground">10% behavioral</span> — explained per candidate.
      </footer>
    </main>
  );
}

/* ---------- Upload view ---------- */

function UploadView(props: {
  jdFile: File | null;
  setJdFile: (f: File | null) => void;
  resumeFiles: File[];
  setResumeFiles: (f: File[]) => void;
  anonymize: boolean;
  setAnonymize: (v: boolean) => void;
  onRun: () => void;
  onDemo: () => void;
}) {
  const jdZone = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: (accepted) => accepted[0] && props.setJdFile(accepted[0]),
  });
  const resZone = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
    onDrop: (accepted) =>
      props.setResumeFiles([...props.resumeFiles, ...accepted].slice(0, 60)),
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mx-auto max-w-6xl px-6 pt-8 pb-16"
    >
      <div className="mx-auto max-w-3xl text-center">
        <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
          Recruiting that thinks like a human
        </Badge>
        <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl md:text-7xl">
          Stop losing talent to <span className="text-primary">keywords</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
          Drop in a JD and a stack of resumes. ContextHire reads <em>context</em>, traces career
          trajectory, and ranks candidates the way a great recruiter actually thinks — then
          explains every score.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" variant="default" onClick={props.onDemo} className="font-semibold">
            <Sparkles className="mr-2 h-4 w-4" /> Run 1-click demo (5 resumes)
          </Button>
          <span className="text-sm text-muted-foreground">
            or upload your own PDFs below
          </span>
        </div>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        <DropCard
          {...jdZone.getRootProps()}
          title="Job Description"
          subtitle="The role you're hiring for"
          isActive={jdZone.isDragActive}
        >
          <input {...jdZone.getInputProps()} />
          {props.jdFile ? (
            <FileChip name={props.jdFile.name} onClear={() => props.setJdFile(null)} />
          ) : (
            <EmptyHint label="Drop the JD PDF here, or click to choose" />
          )}
        </DropCard>

        <DropCard
          {...resZone.getRootProps()}
          title="Resumes"
          subtitle={`${props.resumeFiles.length} loaded · up to 60`}
          isActive={resZone.isDragActive}
        >
          <input {...resZone.getInputProps()} />
          {props.resumeFiles.length === 0 ? (
            <EmptyHint label="Drop one or many resume PDFs here" />
          ) : (
            <div className="flex max-h-40 flex-wrap gap-2 overflow-auto">
              {props.resumeFiles.map((f, i) => (
                <FileChip
                  key={i}
                  name={f.name}
                  onClear={() =>
                    props.setResumeFiles(props.resumeFiles.filter((_, j) => j !== i))
                  }
                />
              ))}
            </div>
          )}
        </DropCard>
      </div>

      <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-border bg-card/60 px-5 py-4 sm:flex-row">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <div>
            <Label htmlFor="anon" className="cursor-pointer text-sm font-medium">
              Bias-test mode: anonymize names before scoring
            </Label>
            <p className="text-xs text-muted-foreground">
              Removes candidate names from the text sent to the model. Names still shown in UI.
            </p>
          </div>
        </div>
        <Switch id="anon" checked={props.anonymize} onCheckedChange={props.setAnonymize} />
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          size="lg"
          variant="default"
          onClick={props.onRun}
          disabled={!props.jdFile || props.resumeFiles.length === 0}
          className="h-12 px-8 font-semibold"
        >
          Rank candidates <Sparkles className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <Pillar
          weight="60%"
          title="Semantic fit"
          body="text-embedding-3-small compares the whole JD to the whole resume — not just keywords."
        />
        <Pillar
          weight="30%"
          title="Career trajectory"
          body="Does the candidate's path actually lead here? An LLM rates 1–10."
        />
        <Pillar
          weight="10%"
          title="Behavioral signal"
          body="GitHub, portfolio, or personal domain present? Real builders show their work."
        />
      </div>
    </motion.section>
  );
}

function DropCard({
  title,
  subtitle,
  children,
  isActive,
  ...rest
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  isActive?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={`group relative cursor-pointer rounded-2xl border-2 border-dashed bg-card/50 p-6 transition ${
        isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="font-display text-lg font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
        <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
      </div>
      {children}
    </div>
  );
}

function EmptyHint({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background/40 py-10 text-sm text-muted-foreground">
      <FileText className="mb-2 h-6 w-6" />
      {label}
    </div>
  );
}

function FileChip({ name, onClear }: { name: string; onClear: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 truncate rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs">
      <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="truncate">{name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
        className="ml-1 text-muted-foreground transition hover:text-destructive"
        aria-label="Remove"
      >
        ×
      </button>
    </span>
  );
}

function Pillar({ weight, title, body }: { weight: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      <div className="font-mono text-xs text-primary">{weight}</div>
      <div className="mt-1 font-display text-lg font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

/* ---------- Loading ---------- */

function LoadingView({ label }: { label: string }) {
  const steps = [
    "Parsing PDFs in your browser",
    "Embedding JD + resumes (60%)",
    "Asking the model about career trajectory (30%)",
    "Detecting GitHub & portfolio signals (10%)",
    "Writing top-5 explanations",
  ];
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center"
    >
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <h2 className="mt-6 font-display text-2xl font-semibold">{label}</h2>
      <ul className="mt-8 space-y-2 text-left text-sm text-muted-foreground">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
            {s}
          </li>
        ))}
      </ul>
    </motion.section>
  );
}

/* ---------- Results ---------- */

function ResultsView({
  ranked,
  warnings,
  elapsedMs,
  onBack,
}: {
  ranked: RankedCandidate[];
  warnings: string[];
  elapsedMs: number;
  onBack: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(ranked[0]?.candidate_name ?? null);

  const rows: RankedRow[] = useMemo(
    () =>
      ranked.map((r) => ({
        candidate_name: r.candidate_name,
        score: r.score,
        why_fit: r.why_fit,
        risk_flag: r.risk_flag,
        evidence: r.evidence,
      })),
    [ranked],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mx-auto max-w-6xl px-6 pb-16"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </button>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Ranked candidates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ranked.length} resumes · ranked in {(elapsedMs / 1000).toFixed(1)}s · top 5 explained
          </p>
        </div>
        <Button
          variant="default"
          onClick={() => downloadCsv("ranked_output.csv", toCsv(rows))}
          className="font-semibold"
        >
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <StatsPanel ranked={ranked} />

      {warnings.length > 0 && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Partial results: {warnings.slice(0, 3).join(" · ")}
        </div>
      )}


      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card/40">
        <div className="grid grid-cols-12 gap-2 border-b border-border bg-secondary/40 px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <div className="col-span-1">Rank</div>
          <div className="col-span-3">Candidate</div>
          <div className="col-span-4">Score</div>
          <div className="col-span-3">Why fit</div>
          <div className="col-span-1 text-right">More</div>
        </div>
        {ranked.map((c, i) => (
          <RankRow
            key={c.candidate_name}
            rank={i + 1}
            candidate={c}
            open={openId === c.candidate_name}
            onToggle={() =>
              setOpenId(openId === c.candidate_name ? null : c.candidate_name)
            }
          />
        ))}
      </div>
    </motion.section>
  );
}

function RankRow({
  rank,
  candidate,
  open,
  onToggle,
}: {
  rank: number;
  candidate: RankedCandidate;
  open: boolean;
  onToggle: () => void;
}) {
  const medal =
    rank === 1 ? (
      <Trophy className="h-5 w-5 text-gold" />
    ) : rank === 2 ? (
      <Medal className="h-5 w-5 text-silver" />
    ) : rank === 3 ? (
      <Award className="h-5 w-5 text-bronze" />
    ) : (
      <span className="font-mono text-sm text-muted-foreground">#{rank}</span>
    );

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggle}
        className="grid w-full grid-cols-12 items-center gap-2 px-5 py-4 text-left transition hover:bg-secondary/30"
      >
        <div className="col-span-1 flex items-center">{medal}</div>
        <div className="col-span-3">
          <div className="font-medium">{candidate.candidate_name}</div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            {candidate.has_link && (
              <span className="inline-flex items-center gap-1 text-accent">
                <Github className="h-3 w-3" /> link found
              </span>
            )}
          </div>
        </div>
        <div className="col-span-4">
          <div className="flex items-center gap-3">
            <Progress value={candidate.score} className="h-2" />
            <span className="font-mono text-sm font-semibold tabular-nums">
              {candidate.score}
            </span>
          </div>
        </div>
        <div className="col-span-3 truncate text-sm text-muted-foreground">
          {candidate.why_fit}
        </div>
        <div className="col-span-1 flex justify-end">
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid gap-4 border-t border-border bg-background/50 px-5 py-5 sm:grid-cols-2">
              <Detail label="Why fit" value={candidate.why_fit} />
              <Detail label="Risk flag" value={candidate.risk_flag} />
              <Detail label="Evidence" value={candidate.evidence} />
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Score breakdown
                </div>
                <div className="mt-2 space-y-1.5 text-sm">
                  <Component label="Semantic (60%)" value={candidate.semantic} />
                  <Component label="Trajectory (30%)" value={candidate.trajectory} />
                  <Component label="Behavioral (10%)" value={candidate.behavioral} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const msg = `Hi ${candidate.candidate_name.split(/[\s_-]/)[0]},\n\nYour background caught our attention — especially: ${candidate.why_fit}\n\nEvidence we noted: ${candidate.evidence}\n\nWould you be open to a 20-minute intro chat this week?\n\nBest,\nThe Hiring Team`;
                    navigator.clipboard.writeText(msg);
                    toast.success("Outreach message copied to clipboard");
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2.5 py-1.5 text-xs font-medium transition hover:bg-secondary"
                >
                  <Copy className="h-3 w-3" /> Copy outreach message
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm">{value || "—"}</div>
    </div>
  );
}

function Component({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}

function StatsPanel({ ranked }: { ranked: RankedCandidate[] }) {
  if (ranked.length === 0) return null;
  const scores = ranked.map((r) => r.score);
  const top = Math.max(...scores);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const strong = ranked.filter((r) => r.score >= 70).length;
  const withLink = ranked.filter((r) => r.has_link).length;
  const linkPct = Math.round((withLink / ranked.length) * 100);

  // mini histogram buckets of 10
  const buckets = Array(10).fill(0) as number[];
  for (const s of scores) buckets[Math.min(9, Math.floor(s / 10))]++;
  const maxB = Math.max(...buckets, 1);

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={<Trophy className="h-4 w-4" />} label="Top score" value={`${top}`} accent="text-gold" />
      <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Average" value={`${avg}`} />
      <StatCard
        icon={<Target className="h-4 w-4" />}
        label="Strong matches (≥70)"
        value={`${strong} / ${ranked.length}`}
      />
      <StatCard
        icon={<Link2 className="h-4 w-4" />}
        label="With portfolio link"
        value={`${linkPct}%`}
      />
      <div className="rounded-xl border border-border bg-card/40 p-5 sm:col-span-2 lg:col-span-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Users className="h-4 w-4" /> Score distribution
          </div>
          <div className="text-xs text-muted-foreground">buckets of 10</div>
        </div>
        <div className="flex items-end gap-1.5 h-20">
          {buckets.map((b, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary/70 transition-all"
                style={{ height: `${(b / maxB) * 100}%`, minHeight: b ? "4px" : "1px" }}
                title={`${i * 10}–${i * 10 + 9}: ${b}`}
              />
              <span className="font-mono text-[10px] text-muted-foreground">{i * 10}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className={`mt-2 font-display text-3xl font-bold tabular-nums ${accent ?? ""}`}>
        {value}
      </div>
    </div>
  );
}
