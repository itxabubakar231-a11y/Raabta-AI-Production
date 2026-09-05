import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ArrowRight, CheckCircle2, MessageSquare, Brain,
  HeartHandshake, Users, Shield, BookOpen, Smile, Award,
  Compass, BarChart3, ChevronRight, Menu, X, ArrowUpRight,
  Layers, Volume2, Eye, Zap, Lock
} from 'lucide-react'
import Logo from '../components/Logo'

export default function LandingPage() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activePreviewTab, setActivePreviewTab] = useState('dialogue')

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
  }

  return (
    <div className="min-h-screen bg-[#070a12] text-white selection:bg-indigo-500/30 selection:text-white font-sans overflow-x-hidden antialiased">
      
      {/* 1. STICKY NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#070a12]/85 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Logo size="md" to="/" />

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
            <a href="#impact" className="px-3.5 py-2 rounded-lg hover:text-white hover:bg-white/5 transition-colors">
              Impact
            </a>
            <a href="#personas" className="px-3.5 py-2 rounded-lg hover:text-white hover:bg-white/5 transition-colors">
              For Learners
            </a>
            <a href="#how-it-works" className="px-3.5 py-2 rounded-lg hover:text-white hover:bg-white/5 transition-colors">
              How It Works
            </a>
            <a href="#ai-architecture" className="px-3.5 py-2 rounded-lg hover:text-white hover:bg-white/5 transition-colors">
              AI Architecture
            </a>
            <a href="#preview" className="px-3.5 py-2 rounded-lg hover:text-white hover:bg-white/5 transition-colors">
              Product Preview
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Get Started</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-white/10 bg-[#0b0f19] px-4 py-6 space-y-4"
            >
              <div className="flex flex-col space-y-2 text-sm font-medium text-slate-300">
                <a
                  href="#impact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  Impact
                </a>
                <a
                  href="#personas"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  For Learners
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  How It Works
                </a>
                <a
                  href="#ai-architecture"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  AI Architecture
                </a>
                <a
                  href="#preview"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  Product Preview
                </a>
              </div>
              <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-sm font-semibold text-slate-200 bg-white/5 rounded-xl hover:bg-white/10"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 shadow"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* 2. HERO SECTION */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
          {/* Subtle Ambient Background Lighting */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-[120px] rounded-full" />
            <div className="absolute top-40 right-10 w-72 h-72 bg-blue-600/10 blur-[100px] rounded-full" />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
                backgroundSize: '40px 40px'
              }}
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center max-w-3xl mx-auto space-y-6"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold">
                <Sparkles size={14} className="text-indigo-400" />
                <span>Adaptive Communication & Learning Intelligence</span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]"
              >
                Helping people communicate, learn, and grow —{' '}
                <span className="bg-gradient-to-r from-indigo-300 via-indigo-100 to-cyan-300 bg-clip-text text-transparent">
                  one conversation at a time.
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto"
              >
                Supporting communication practice through adaptive AI experiences designed around the learner. Build fluency, confidence, and comprehension at your own pace.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
                <Link
                  to="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Get Started</span>
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm transition-all"
                >
                  <span>See How It Works</span>
                  <ChevronRight size={16} className="text-slate-400" />
                </a>
              </motion.div>
            </motion.div>

            {/* AI ADAPTIVE CONCEPT FLOW DIAGRAM (Subtle & Elegant) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-16 max-w-4xl mx-auto"
            >
              <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Adaptive Learning Architecture
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    Multi-Turn Context & Real-Time Feedback
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                  {[
                    { title: 'Learner Context', desc: 'Age, goals & level', icon: Users, color: 'text-indigo-400' },
                    { title: 'Dialogue Practice', desc: 'Text & voice exchange', icon: MessageSquare, color: 'text-blue-400' },
                    { title: 'AI Understanding', desc: 'Pattern & clarity analysis', icon: Brain, color: 'text-purple-400' },
                    { title: 'Personal Feedback', desc: 'Actionable coaching', icon: HeartHandshake, color: 'text-emerald-400' },
                    { title: 'Adaptive Evolution', desc: 'Tuned next step', icon: Zap, color: 'text-amber-400' },
                  ].map((node, i) => {
                    const NodeIcon = node.icon
                    return (
                      <div
                        key={node.title}
                        className="p-4 rounded-xl bg-slate-950/70 border border-white/5 flex flex-col items-center text-center space-y-2 relative group hover:border-indigo-500/40 transition-all"
                      >
                        <div className={`p-2.5 rounded-lg bg-white/5 ${node.color} group-hover:scale-110 transition-transform`}>
                          <NodeIcon size={20} />
                        </div>
                        <span className="text-xs font-bold text-white leading-snug">{node.title}</span>
                        <span className="text-[11px] text-slate-400 leading-tight">{node.desc}</span>
                        {i < 4 && (
                          <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-600 z-10">
                            →
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. IMPACT SECTION */}
        <section id="impact" className="py-20 md:py-28 border-t border-white/5 bg-[#090d16] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Core Purpose
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Why Raabta AI Matters
              </h2>
              <p className="text-base text-slate-300 leading-relaxed font-normal">
                Communication challenges can make learning and everyday interaction harder. Raabta AI creates a safe, adaptive environment where users can practice communication, receive feedback, and build confidence at their own pace.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Shield,
                  title: 'Practice Without Pressure',
                  desc: 'Users can practice repeatedly in a supportive, judgment-free space designed for psychological comfort and steady repetition.',
                  gradient: 'from-blue-500/10 to-indigo-500/10'
                },
                {
                  icon: Zap,
                  title: 'Adaptive Learning',
                  desc: 'Activities automatically respond to the learner’s pacing, vocabulary progress, and real-time comprehension signals.',
                  gradient: 'from-indigo-500/10 to-purple-500/10'
                },
                {
                  icon: Sparkles,
                  title: 'Personalized Feedback',
                  desc: 'AI analyzes interactions constructively, highlighting strengths and offering gentle guidance for continuous improvement.',
                  gradient: 'from-purple-500/10 to-pink-500/10'
                },
                {
                  icon: HeartHandshake,
                  title: 'Inclusive Experience',
                  desc: 'Engineered specifically for different ages, comprehension levels, and unique communication journeys without stigma.',
                  gradient: 'from-emerald-500/10 to-teal-500/10'
                }
              ].map((card) => {
                const CardIcon = card.icon
                return (
                  <div
                    key={card.title}
                    className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/70 transition-all hover:border-white/10 group space-y-3.5 shadow-lg"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 group-hover:scale-105 group-hover:text-cyan-300 transition-all">
                      <CardIcon size={22} />
                    </div>
                    <h3 className="text-lg font-bold text-white">{card.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 4. WHO RAABTA AI HELPS (3 PERSONAS) */}
        <section id="personas" className="py-20 md:py-28 border-t border-white/5 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Inclusive Learning Pathways
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Built Around the Learner
              </h2>
              <p className="text-base text-slate-300 leading-relaxed">
                Tailored interaction modules designed specifically for developmental stages, everyday needs, and personal independence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  badge: 'Ages 6–12',
                  title: 'Children',
                  subtitle: 'Foundational Communication',
                  desc: 'Build fundamental communication, expression, and language skills through gentle, highly supportive conversational scenarios.',
                  highlights: ['Simple interactive prompts', 'Visual & verbal clarity', 'Positive reinforcement loops'],
                  icon: Smile,
                  color: 'indigo'
                },
                {
                  badge: 'Ages 13–18',
                  title: 'Teens',
                  subtitle: 'Confidence & Real-World Interaction',
                  desc: 'Practice reading comprehension, vocabulary expansion, social interactions, and practical problem-solving in everyday contexts.',
                  highlights: ['Realistic social scenarios', 'Reading & vocabulary exercises', 'Constructive articulation tips'],
                  icon: Compass,
                  color: 'blue'
                },
                {
                  badge: 'Adults',
                  title: 'Adults',
                  subtitle: 'Everyday Independence & Fluency',
                  desc: 'Develop practical communication, workplace articulation, comprehension, and everyday problem-solving skills at your own pace.',
                  highlights: ['Professional conversation practice', 'Complex comprehension tasks', 'Self-paced private sessions'],
                  icon: Award,
                  color: 'cyan'
                }
              ].map((p) => {
                const PersonaIcon = p.icon
                return (
                  <div
                    key={p.title}
                    className="p-8 rounded-2xl border border-white/10 bg-slate-900/50 hover:bg-slate-900/80 transition-all flex flex-col justify-between space-y-6 group shadow-xl relative overflow-hidden"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
                          {p.badge}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <PersonaIcon size={20} />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-2xl font-black text-white">{p.title}</h3>
                        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mt-0.5">
                          {p.subtitle}
                        </p>
                      </div>

                      <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-2">
                      {p.highlights.map((h) => (
                        <div key={h} className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 5. HOW IT WORKS (4-STEP PROCESS) */}
        <section id="how-it-works" className="py-20 md:py-28 border-t border-white/5 bg-[#090d16] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Continuous Progress Cycle
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                From Practice to Progress
              </h2>
              <p className="text-base text-slate-300 leading-relaxed font-normal">
                How our adaptive intelligence creates measurable, lasting confidence through structured interaction.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  title: 'Understand',
                  desc: 'Raabta AI assesses current communication level, language preference, and personal goals to build a contextual profile.'
                },
                {
                  step: '02',
                  title: 'Practice',
                  desc: 'The learner engages in personalized activities, conversational prompts, and multimodal scenarios designed for their comfort.'
                },
                {
                  step: '03',
                  title: 'Analyze',
                  desc: 'AI evaluates responses, clarity, vocabulary range, and responsiveness without generating test anxiety.'
                },
                {
                  step: '04',
                  title: 'Adapt',
                  desc: 'Subsequent practice sessions seamlessly adjust difficulty, pacing, and focus areas to reinforce learning.'
                }
              ].map((s) => (
                <div
                  key={s.step}
                  className="p-6 rounded-2xl border border-white/5 bg-slate-900/30 hover:bg-slate-900/60 transition-all space-y-4 relative"
                >
                  <span className="text-3xl font-black text-indigo-500/40 tracking-tighter">
                    {s.step}
                  </span>
                  <h3 className="text-xl font-bold text-white">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-normal">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. AI SECTION (ADAPTS TO LEARNER) */}
        <section id="ai-architecture" className="py-20 md:py-28 border-t border-white/5 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Adaptive Intelligence
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  AI That Adapts to the Learner
                </h2>
                <p className="text-base text-slate-300 leading-relaxed">
                  Instead of static scripted paths, Raabta AI continuously synthesizes contextual cues to provide a uniquely calibrated practice environment.
                </p>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-200">
                  {[
                    'Learner Context & Goals',
                    'Communication Level',
                    'Activity History & Patterns',
                    'Speech & Text Clarification',
                    'Performance Milestones',
                    'Real-Time Feedback Tuning'
                  ].map((feature) => (
                    <div key={feature} className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-indigo-400 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl space-y-6 shadow-2xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  System Architecture Pipeline
                </h3>

                <div className="space-y-3">
                  {[
                    { label: 'User Persona Context', role: 'Input', color: 'border-slate-700 bg-slate-950' },
                    { label: 'Multimodal Interaction (Text / Voice)', role: 'Interface', color: 'border-indigo-500/30 bg-indigo-950/20' },
                    { label: 'AI Linguistic & Comprehension Analysis', role: 'Engine', color: 'border-purple-500/30 bg-purple-950/20' },
                    { label: 'Constructive Personal Feedback', role: 'Output', color: 'border-emerald-500/30 bg-emerald-950/20' },
                    { label: 'Dynamic Level & Scenario Adaptation', role: 'Evolution', color: 'border-amber-500/30 bg-amber-950/20' }
                  ].map((pipe, idx) => (
                    <div
                      key={pipe.label}
                      className={`p-3.5 rounded-xl border ${pipe.color} flex items-center justify-between text-xs`}
                    >
                      <span className="font-bold text-white">{pipe.label}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/10 text-slate-300">
                        {pipe.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. REAL-WORLD IMPACT (MORE THAN A CHATBOT) */}
        <section className="py-20 md:py-28 border-t border-white/5 bg-[#090d16] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Human-Centered Technology
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                More Than an AI Chatbot
              </h2>
              <p className="text-base text-slate-300 leading-relaxed font-normal">
                Raabta AI is purposeful software designed around structured practice, emotional safety, and tangible confidence building — never robotic, never overwhelming.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { title: 'Confidence Building', desc: 'Overcoming communication hesitation in private.' },
                { title: 'Communication Practice', desc: 'Targeted verbal and written interaction drills.' },
                { title: 'Personalized Learning', desc: 'Custom pacing adjusted to each individual learner.' },
                { title: 'Measurable Progress', desc: 'Clear visibility into milestone achievements.' },
                { title: 'Supportive Interaction', desc: 'Empathetic, clear, and calm conversational tone.' }
              ].map((pillar) => (
                <div
                  key={pillar.title}
                  className="p-5 rounded-xl border border-white/5 bg-slate-900/40 text-center space-y-2 hover:border-indigo-500/30 transition-colors"
                >
                  <span className="h-1.5 w-8 rounded-full bg-indigo-500 mx-auto block mb-3" />
                  <h3 className="text-sm font-bold text-white">{pillar.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{pillar.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. PRODUCT PREVIEW SECTION */}
        <section id="preview" className="py-20 md:py-28 border-t border-white/5 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Inside the Experience
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Experience Raabta AI
              </h2>
              <p className="text-base text-slate-300 leading-relaxed">
                Take a look at the actual interface components that power our adaptive communication workflows.
              </p>
            </div>

            {/* Interactive Preview Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              {[
                { id: 'dialogue', label: 'AI Dialogue Practice' },
                { id: 'dashboard', label: 'Learner Dashboard' },
                { id: 'feedback', label: 'Constructive Feedback' },
                { id: 'progress', label: 'Progress Tracking' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePreviewTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activePreviewTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Preview Display Window */}
            <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl max-w-4xl mx-auto shadow-2xl">
              {activePreviewTab === 'dialogue' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={16} className="text-indigo-400" />
                      <span className="text-xs font-bold text-white">Interactive Session: Ordering at a Cafe</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Active Practice</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5 max-w-md">
                      <p className="font-semibold text-indigo-300 mb-1">Raabta AI Assistant</p>
                      <p className="text-slate-300">Welcome! Imagine you just stepped up to the counter. What would you like to ask the barista?</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 max-w-md ml-auto text-right">
                      <p className="font-semibold text-slate-200 mb-1">Learner Response</p>
                      <p className="text-white">"Hello! Could I please have a hot tea with honey?"</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5 max-w-md">
                      <p className="font-semibold text-indigo-300 mb-1">Raabta AI Feedback</p>
                      <p className="text-slate-300">Wonderful phrasing! That was polite and clear. How would you ask about the price next?</p>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'dashboard' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="font-bold text-white">Weekly Communication Journey</span>
                    <span className="text-slate-400">Level 2 • Steady Fluency</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950 border border-white/5">
                      <span className="text-slate-400">Practice Time</span>
                      <p className="text-lg font-black text-white mt-1">45 min</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-white/5">
                      <span className="text-slate-400">Scenarios Completed</span>
                      <p className="text-lg font-black text-white mt-1">6 Sessions</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-white/5">
                      <span className="text-slate-400">Clarity Rating</span>
                      <p className="text-lg font-black text-emerald-400 mt-1">92%</p>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'feedback' && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                    <p className="font-bold text-emerald-400 mb-1">Strengths Observed</p>
                    <p className="text-slate-300">Smooth conversational pacing and excellent choice of polite request vocabulary.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
                    <p className="font-bold text-indigo-300 mb-1">Growth Opportunity</p>
                    <p className="text-slate-300">Try incorporating follow-up questions to keep dialogue flowing naturally.</p>
                  </div>
                </div>
              )}

              {activePreviewTab === 'progress' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between font-bold text-white border-b border-white/5 pb-2">
                    <span>Mastery Milestones</span>
                    <span className="text-indigo-400">3 of 5 Unlocked</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-slate-950 border border-white/5 flex items-center justify-between">
                      <span>Everyday Introductions</span>
                      <span className="text-emerald-400 font-bold">Mastered ✓</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-white/5 flex items-center justify-between">
                      <span>Asking for Clarification</span>
                      <span className="text-emerald-400 font-bold">Mastered ✓</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-white/5 flex items-center justify-between">
                      <span>Handling Complex Inquiries</span>
                      <span className="text-amber-400 font-bold">In Progress (60%)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 9. TRUST / DIFFERENTIATION SECTION */}
        <section className="py-20 md:py-28 border-t border-white/5 bg-[#090d16] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Architectural Distinction
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                What Makes Raabta AI Different?
              </h2>
              <p className="text-base text-slate-300 leading-relaxed">
                Six principled design commitments that distinguish Raabta AI from generic chat models.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Adaptive AI Engine', desc: 'Continuously modulates complexity and conversational speed based on live learner signals.' },
                { title: 'Communication-Focused', desc: 'Engineered specifically for verbal, comprehension, and conversational fluency building.' },
                { title: 'Personalized Experiences', desc: 'Content and pacing tailored strictly to individual developmental goals.' },
                { title: 'Multi-Persona Support', desc: 'Distinct interaction pathways designed specifically for Children, Teens, and Adults.' },
                { title: 'Progress-Aware Memory', desc: 'Maintains awareness of past milestones and target growth areas across sessions.' },
                { title: 'Accessible by Design', desc: 'Bilingual (Urdu & English) accessibility, high contrast, and keyboard navigation.' }
              ].map((diff) => (
                <div
                  key={diff.title}
                  className="p-6 rounded-2xl border border-white/5 bg-slate-900/50 hover:bg-slate-900/80 transition-all space-y-2.5 shadow"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <h3 className="text-base font-bold text-white">{diff.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">{diff.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. FINAL CTA */}
        <section className="py-24 border-t border-white/10 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-indigo-600/20 to-blue-600/20 blur-[120px] rounded-full" />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Ready to Start the Conversation?
            </h2>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto font-normal leading-relaxed">
              Create a supportive learning experience designed around the person — not just the problem.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Get Started</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm transition-all"
              >
                <span>Sign In to Your Account</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 11. FOOTER */}
      <footer className="border-t border-white/5 bg-[#05070d] py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Logo size="sm" to="/" />
            <span className="hidden sm:inline text-slate-600">|</span>
            <p className="text-slate-500 text-center sm:text-left">
              Adaptive Communication & Learning Intelligence Platform
            </p>
          </div>

          <div className="flex items-center gap-6 text-slate-400 font-medium">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#personas" className="hover:text-white transition-colors">Learners</a>
            <Link to="/login" className="hover:text-white transition-colors">Portal Sign In</Link>
            <Link to="/app" className="hover:text-white transition-colors">App Command</Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} Raabta AI. All rights reserved.</p>
          <p>Designed for psychological safety, confidence building, and accessible learning.</p>
        </div>
      </footer>
    </div>
  )
}
