/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Calculator, 
  FileText, 
  MessageSquare, 
  BookOpen, 
  Book,
  Menu, 
  X, 
  ChevronRight, 
  Globe, 
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2,
  User,
  Bot,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Briefcase,
  Phone,
  Heart,
  Users,
  Mail,
  Linkedin,
  MapPin,
  Award,
  Trophy,
  Camera,
  Upload,
  Image,
  Calendar,
  Bell,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import { 
  chatWithGeminiStream, 
  findUniversitiesStream, 
  calculatePOFStream, 
  getVisaGuideStream 
} from './services/gemini';
import Markdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { io, Socket } from 'socket.io-client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  appwriteIds,
  handleAppwriteError,
  OperationType,
  onAuthStateChanged,
  signOut,
  refreshCurrentUser,
  getDocument,
  listDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  subscribeCollection,
  uploadImageFile,
  getFileViewUrl,
  createUserDocument,
  buildNewsPayload,
  buildNotificationPayload,
  Query,
  Permission,
  Role,
  ID,
  AppUser,
} from './lib/appwrite';
import { Auth } from './components/Auth';

// --- Types ---
type View = 'home' | 'universities' | 'pof' | 'visa' | 'resume' | 'chat' | 'blog' | 'blog-post' | 'privacy' | 'terms' | 'contact' | 'admin';

const BLOG_POSTS = [
  { 
    id: 'official-portals',
    title: "Official Immigration Portals: Tier 1 Countries", 
    date: "Mar 01, 2026", 
    excerpt: "Stay updated with the latest immigration policies by visiting the official portals of top study destinations: UK Gov, USCIS (USA), IRCC (Canada), and Home Affairs (Australia).",
    content: `
# Official Immigration Portals: Tier 1 Countries

When planning your study abroad journey, it is crucial to rely on official government sources for the most accurate and up-to-date information regarding visa requirements, immigration policies, and travel regulations.

### Why Official Portals Matter?
Immigration rules change frequently. Third-party websites might not always reflect the latest updates, which could lead to application delays or rejections. Always verify information on these official portals:

1. **United Kingdom (GOV.UK)**: The definitive source for Student Visas (formerly Tier 4), Graduate Route visas, and healthcare surcharge information.
2. **United States (USCIS & Travel.State.Gov)**: Essential for F-1 and M-1 student visa regulations, SEVIS fee details, and interview scheduling.
3. **Canada (IRCC)**: The official site for Study Permits, Post-Graduation Work Permits (PGWP), and Provincial Attestation Letters (PAL).
4. **Australia (Department of Home Affairs)**: Your guide to Subclass 500 Student Visas, the Genuine Student Test (GST), and work rights.

### Pro Tips for Students:
- **Bookmark these sites**: Check them at least once a month.
- **Sign up for alerts**: Many portals offer email notifications for policy changes.
- **Check the 'News' section**: Governments often publish temporary measures or upcoming changes here first.
    `,
    links: [
      { name: "United Kingdom (GOV.UK)", url: "https://www.gov.uk/browse/visas-immigration" },
      { name: "United States (USCIS)", url: "https://www.uscis.gov/" },
      { name: "Canada (IRCC)", url: "https://www.canada.ca/en/services/immigration-citizenship.html" },
      { name: "Australia (Home Affairs)", url: "https://immi.homeaffairs.gov.au/" }
    ]
  },
  {
    id: 'uk-maintenance',
    title: "UK Student Visa: New Maintenance Requirements for 2026",
    date: "Mar 01, 2026",
    excerpt: "The UK Home Office has updated the financial maintenance requirements for student visas. Learn about the new monthly cost of living figures for London and outside London.",
    content: `
# UK Student Visa: New Maintenance Requirements for 2026

The UK Home Office has recently announced updates to the financial requirements for international students. These changes are designed to ensure that students have sufficient funds to support themselves during their studies without relying on public funds.

### Key Changes:
- **Monthly Maintenance (London)**: The required amount has been increased to reflect the rising cost of living in the capital.
- **Monthly Maintenance (Outside London)**: A corresponding increase has been applied for students studying in other parts of the UK.
- **Proof of Funds**: Students must demonstrate they have held the required funds for at least 28 consecutive days.

### What You Need to Prepare:
1. **Bank Statements**: Ensure your bank statements clearly show the required balance.
2. **Currency Conversion**: Use the official OANDA conversion rate if your funds are not in GBP.
3. **Dependents**: If you are bringing family members, remember that additional maintenance funds are required for each dependent.

Stay ahead of these changes by checking the official GOV.UK website regularly.
    `,
    links: [{ name: "UK Gov Updates", url: "https://www.gov.uk/student-visa/money" }]
  },
  {
    id: 'canada-caps',
    title: "Canada Study Permit: Updated Caps and Provincial Attestation Letters",
    date: "Feb 28, 2026",
    excerpt: "IRCC has implemented new caps on study permit applications. Understand how the Provincial Attestation Letter (PAL) system works and if you are exempt.",
    content: `
# Canada Study Permit: Updated Caps and Provincial Attestation Letters

Canada remains a top destination for international students, but recent policy changes have introduced a new layer of complexity to the application process.

### The Provincial Attestation Letter (PAL)
Most new post-secondary international students at the college or undergraduate level must now provide a Provincial Attestation Letter (PAL) from a province or territory with their study permit application.

### Who is Exempt?
- Primary and secondary school students.
- Master's and doctoral degree students.
- Students already in Canada with a valid study permit.

### Strategic Advice:
- **Apply Early**: The PAL process can add weeks to your timeline.
- **Check Provincial Rules**: Each province has its own system for issuing PALs.
- **Focus on Masters/PhD**: These programs are currently exempt from the caps, making them an attractive option for advanced studies.
    `,
    links: [{ name: "IRCC News", url: "https://www.canada.ca/en/immigration-refugees-citizenship/news/notices.html" }]
  },
  {
    id: 'australia-gst',
    title: "Australia: The New Genuine Student Test (GST) Explained",
    date: "Feb 25, 2026",
    excerpt: "Australia has replaced the GTE with the Genuine Student Test (GST). Find out what questions to expect and how to demonstrate your genuine intent to study.",
    content: `
# Australia: The New Genuine Student Test (GST) Explained

The Australian government has transitioned from the Genuine Temporary Entrant (GTE) requirement to the new Genuine Student Test (GST). This change aims to identify students who are genuinely coming to Australia for high-quality education.

### What's New in the GST?
The GST involves a series of targeted questions that assess:
- Your circumstances in your home country.
- Your potential circumstances in Australia.
- The value of the course to your future career.
- Your immigration history.

### How to Prepare:
1. **Research Your Course**: Be ready to explain why you chose this specific course and university.
2. **Career Goals**: Clearly articulate how this degree will help you achieve your professional aspirations in your home country.
3. **Financial Stability**: Be prepared to discuss your financial plan for the duration of your stay.
    `,
    links: [{ name: "Home Affairs Australia", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500" }]
  },
  {
    id: 'usa-f1-trends',
    title: "USA: F-1 Visa Interview Trends and Tips for 2026",
    date: "Feb 22, 2026",
    excerpt: "US Consulates are seeing record numbers of applicants. Get the latest insights on interview wait times and common questions for the 2026 academic year.",
    content: `
# USA: F-1 Visa Interview Trends and Tips for 2026

The F-1 student visa interview is often the most stressful part of the US study abroad process. In 2026, we are seeing high demand and some new trends in how interviews are conducted.

### Current Trends:
- **Increased Scrutiny on Funding**: Consular officers are looking more closely at the source of funds, not just the balance.
- **Focus on 'Ties to Home Country'**: You must convincingly demonstrate that you intend to return home after your studies.
- **Short Interview Times**: Most interviews last only 2-3 minutes, so your first impressions and initial answers are critical.

### Top Tips:
- **Be Concise**: Answer the question directly and stop.
- **Know Your I-20**: Be familiar with every detail on your I-20 form.
- **Practice Your 'Why'**: Why this university? Why this major? Why the USA?
    `,
    links: [{ name: "US State Dept", url: "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html" }]
  },
  {
    id: 'germany-chancenkarte',
    title: "Germany: The Opportunity Card (Chancenkarte) for International Students",
    date: "Feb 20, 2026",
    excerpt: "Germany's new Opportunity Card makes it easier for international graduates to find work. Learn about the points-based system and how you can qualify.",
    content: `
# Germany: The Opportunity Card (Chancenkarte) for International Students

Germany has introduced the Opportunity Card (Chancenkarte) to attract skilled workers and international graduates. This is a game-changer for students looking to transition into the German workforce.

### How the Points System Works:
Points are awarded based on:
- **Qualifications**: Your degree and professional experience.
- **Language Skills**: Proficiency in German (A1-B2) or English (C1).
- **Age**: Younger applicants receive more points.
- **Ties to Germany**: Previous stays or family in the country.

### Benefits for Students:
- **Job Search**: You can stay in Germany for up to a year to find a qualified job.
- **Part-time Work**: You are allowed to work up to 20 hours per week while searching for a full-time position.
- **Path to Residency**: Finding a qualified job leads directly to a residence permit for employment.
    `,
    links: [{ name: "Make it in Germany", url: "https://www.make-it-in-germany.com/en/visa-residence/types/job-search-opportunity-card" }]
  }
];

// --- Components ---

const Navbar = ({ 
  activeView, 
  setView, 
  user, 
  isAdmin, 
  notifications, 
  onMarkAllRead 
}: { 
  activeView: View; 
  setView: (v: View) => void; 
  user: AppUser | null; 
  isAdmin: boolean; 
  notifications: any[]; 
  onMarkAllRead: () => void; 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('read_notifications') || '[]');
    } catch {
      return [];
    }
  });

  // Sync state if localStorage changes or notifications load
  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  const handleToggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      const allIds = notifications.map(n => n.id);
      localStorage.setItem('read_notifications', JSON.stringify(allIds));
      setReadIds(allIds);
      onMarkAllRead();
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setView('home');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navItems = [
    { id: 'universities', label: 'Find University', icon: Search },
    { id: 'pof', label: 'POF Calculator', icon: Calculator },
    { id: 'visa', label: 'Visa Guide', icon: Globe },
    { id: 'resume', label: 'Resume Builder', icon: FileText },
    { id: 'chat', label: 'Chat Advisor', icon: MessageSquare },
    { id: 'blog', label: 'News & Updates', icon: BookOpen },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-brown/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-24">
          <div className="flex items-center cursor-pointer group" onClick={() => setView('home')}>
            <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center mr-4 transform group-hover:scale-105 transition-transform">
              <Globe className="text-white w-7 h-7" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">Digivasity</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as View)}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300",
                    activeView === item.id 
                      ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/20" 
                      : "text-white/80 hover:text-white hover:bg-white/5"
                  )}
                >
                  {item.label}
                </button>
              ))}

              {isAdmin && (
                <button
                  onClick={() => setView('admin')}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-1.5 bg-red-600/20 text-red-200 hover:bg-red-600/30 border border-red-500/20 ml-2 animate-pulse",
                    activeView === 'admin' && "bg-red-600 text-white border-red-600 shadow-xl shadow-red-600/30 animate-none"
                  )}
                >
                  <Shield size={14} />
                  Admin Panel
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
              {user && (
                <div className="relative">
                  <button
                    onClick={handleToggleNotifications}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border border-white/5 relative"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#2D1B14]">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 bg-[#3d251c] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                          <span className="text-white font-black text-xs uppercase tracking-wider">System Notifications</span>
                          {unreadCount > 0 && (
                            <span className="bg-brand-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {unreadCount} UNREAD
                            </span>
                          )}
                        </div>
                        <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-white/40 text-xs font-semibold">
                              No notifications yet
                            </div>
                          ) : (
                            notifications.map((notif) => {
                              const isUnread = !readIds.includes(notif.id);
                              return (
                                <div 
                                  key={notif.id} 
                                  className={cn(
                                    "p-4 hover:bg-white/5 transition-colors cursor-pointer",
                                    isUnread && "bg-brand-orange/5"
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className={cn("text-xs font-bold text-white", isUnread && "text-brand-orange")}>
                                      {notif.title}
                                    </h4>
                                    {isUnread && <span className="w-1.5 h-1.5 bg-brand-orange rounded-full mt-1 shrink-0" />}
                                  </div>
                                  <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
                                    {notif.message}
                                  </p>
                                  {notif.link && (
                                    <button 
                                      onClick={() => {
                                        const targetView = (notif.link === 'news' || notif.link === 'blog') ? 'blog' : notif.link;
                                         setView(targetView as View);
                                        setShowNotifications(false);
                                      }}
                                      className="text-[10px] text-brand-orange font-bold mt-2 hover:underline inline-block uppercase tracking-wider"
                                    >
                                      View Updates &rarr;
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {user ? (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-black text-white uppercase tracking-tight leading-none">
                      {user.displayName || 'Authorized User'}
                    </span>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      {user.email?.split('@')[0]}
                    </span>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border border-white/5"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setView('login' as any)}
                  className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all border border-white/5 uppercase tracking-widest"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-3">
            {user && (
              <div className="relative">
                <button
                  onClick={handleToggleNotifications}
                  className="w-10 h-10 rounded-xl bg-white/5 text-white flex items-center justify-center relative border border-white/5"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-3 w-72 bg-[#3d251c] border border-white/10 rounded-2xl shadow-2xl z-50 p-2"
                    >
                      <div className="p-2 border-b border-white/5 text-center text-xs text-white/80 font-bold uppercase">
                        Notifications ({unreadCount} new)
                      </div>
                      <div className="max-h-56 overflow-y-auto divide-y divide-white/5">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-white/40 text-[11px]">No alerts</div>
                        ) : (
                          notifications.map((notif) => (
                            <div key={notif.id} className="p-3 text-left">
                              <h4 className="text-xs font-bold text-white leading-tight">{notif.title}</h4>
                              <p className="text-[11px] text-white/50 mt-1 leading-snug">{notif.message}</p>
                              {notif.link && (
                                <button
                                  onClick={() => {
                                    const targetView = (notif.link === 'news' || notif.link === 'blog') ? 'blog' : notif.link;
                                    setView(targetView as View);
                                    setShowNotifications(false);
                                  }}
                                  className="text-[10px] text-brand-orange font-bold mt-1 inline-block"
                                >
                                  Read &rarr;
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-3 rounded-2xl bg-brand-orange text-white shadow-lg"
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden bg-brand-brown border-t border-white/5 overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-8 space-y-4">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setView(item.id as View);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex items-center w-full px-6 py-4 rounded-2xl text-lg font-bold transition-all",
                      activeView === item.id 
                        ? "bg-brand-orange text-white" 
                        : "text-white/70 hover:bg-white/5"
                    )}
                  >
                    <item.icon className="w-6 h-6 mr-4" />
                    {item.label}
                  </button>
                ))}

                {isAdmin && (
                  <button
                    onClick={() => {
                      setView('admin');
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex items-center w-full px-6 py-4 rounded-2xl text-lg font-bold bg-red-600/20 text-red-200 border border-red-500/20",
                      activeView === 'admin' && "bg-red-600 text-white"
                    )}
                  >
                    <Shield className="w-6 h-6 mr-4" />
                    Admin Dashboard
                  </button>
                )}
              </div>

              {user ? (
                <div className="pt-6 border-t border-white/5">
                  <div className="flex items-center gap-4 mb-6 px-4">
                    <div className="w-12 h-12 bg-brand-orange/20 rounded-xl flex items-center justify-center">
                      <User className="text-brand-orange w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{user.displayName || 'Digivisor'}</h4>
                      <p className="text-white/40 text-xs">{user.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="w-full bg-white/5 border border-white/5 text-white/60 hover:text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="pt-6 border-t border-white/5">
                  <button 
                    onClick={() => {
                      setView('login' as any);
                      setIsOpen(false);
                    }}
                    className="w-full bg-brand-orange text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-brand-orange/20 transition-all"
                  >
                    Sign In to Digivasity
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ onExplore }: { onExplore: () => void }) => {
  return (
    <div className="relative h-[280px] md:h-[380px] flex items-center overflow-hidden w-full mt-0 mb-4">
      <img 
        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1920" 
        alt="International students collaborating" 
        className="absolute inset-0 w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-brown/60 via-brand-brown/20 to-transparent" />
      
      <div className="relative z-10 w-full px-6 md:px-16 lg:px-24">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 tracking-tight drop-shadow-lg">
            YOUR STUDY ABROAD <br />
            JOURNEY BEGINS <br />
            HERE
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-white mb-6 tracking-[0.2em] uppercase drop-shadow-md">
            AI-DRIVEN OVERSEAS EDUCATION ADVISOR
          </p>
          <button 
            onClick={onExplore}
            className="bg-brand-orange hover:bg-brand-orange-light text-white px-8 py-3 rounded-xl font-black text-xs md:text-sm flex items-center transition-all shadow-xl shadow-brand-orange/40 group uppercase tracking-widest"
          >
            EXPLORE UNIVERSITIES
          </button>
        </motion.div>
      </div>
    </div>
  );
};

const FeatureCard = ({ title, description, icon: Icon, onClick, color = "bg-[#4A2C21]" }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    onClick={onClick}
    className={cn("p-8 rounded-3xl cursor-pointer transition-all border border-white/5", color)}
  >
    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
      <Icon className="text-[#F27D26] w-8 h-8" />
    </div>
    <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
    <p className="text-white/60 mb-6">{description}</p>
    <div className="flex items-center text-[#F27D26] font-semibold">
      Get Started <ChevronRight className="ml-1 w-4 h-4" />
    </div>
  </motion.div>
);

// --- View Components ---

const DefinitionsSection = ({ title, terms }: { title: string, terms: { term: string, definition: string }[] }) => (
  <div className="mt-16 pt-12 border-t border-white/10">
    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
      <Book className="text-brand-orange w-6 h-6" />
      {title}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {terms.map((item, i) => (
        <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/5 hover:border-brand-orange/30 transition-all">
          <h4 className="text-brand-orange font-bold mb-2 uppercase tracking-widest text-xs">{item.term}</h4>
          <p className="text-white/70 text-sm leading-relaxed">{item.definition}</p>
        </div>
      ))}
    </div>
  </div>
);

const UniversityView = () => {
  const [profile, setProfile] = useState({
    residence: '',
    targetCountry: '',
    qualification: '',
    cgpa: '',
    englishScore: '',
    course: '',
    program: ''
  });
  const [results, setResults] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.targetCountry || !profile.course) return;
    setLoading(true);
    setResults("Searching for the best universities for you...");
    try {
      const stream = findUniversitiesStream(profile);
      let fullText = "";
      let firstChunk = true;
      for await (const chunk of stream) {
        if (firstChunk) {
          fullText = "";
          firstChunk = false;
        }
        fullText += chunk;
        setResults(fullText);
      }
      if (!fullText) {
        setResults("No results found. Please try adjusting your search criteria.");
      }
    } catch (err: any) {
      console.error(err);
      setResults(`Error: ${err.message || "We're having trouble connecting to the university database. Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setProfile({
      residence: '',
      targetCountry: '',
      qualification: '',
      cgpa: '',
      englishScore: '',
      course: '',
      program: ''
    });
    setResults(null);
  };

  return (
    <div className="max-w-6xl mx-auto pt-6 pb-4 px-4">
      <div className="relative rounded-[40px] overflow-hidden mb-12 min-h-[300px] flex flex-col justify-center p-8 md:p-12">
        <img 
          src="https://picsum.photos/seed/campus/1200/800" 
          alt="University Campus" 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-brand-brown/80 backdrop-blur-[2px]" />
        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight leading-none">AI University Finder</h2>
          <p className="text-white/80 text-lg max-w-2xl mb-6 font-medium">
            Enter your academic profile and let our AI find the perfect universities, courses, and scholarships tailored specifically for you.
          </p>
          
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Country of Residence</label>
              <input 
                type="text" 
                required
                value={profile.residence}
                onChange={(e) => setProfile({...profile, residence: e.target.value})}
                placeholder="e.g. Nigeria"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Target Country</label>
              <input 
                type="text" 
                required
                value={profile.targetCountry}
                onChange={(e) => setProfile({...profile, targetCountry: e.target.value})}
                placeholder="e.g. United Kingdom"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Highest Qualification</label>
              <select 
                required
                value={profile.qualification}
                onChange={(e) => setProfile({...profile, qualification: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all appearance-none"
              >
                <option value="" className="bg-brand-brown">Select Qualification</option>
                <option value="High School" className="bg-brand-brown">High School / A-Levels</option>
                <option value="Bachelors" className="bg-brand-brown">Bachelors Degree</option>
                <option value="Masters" className="bg-brand-brown">Masters Degree</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">BSc CGPA (e.g. 4.2/5.0)</label>
              <input 
                type="text" 
                required
                value={profile.cgpa}
                onChange={(e) => setProfile({...profile, cgpa: e.target.value})}
                placeholder="e.g. 3.8/4.0"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">English Score (IELTS/TOEFL)</label>
              <input 
                type="text" 
                required
                value={profile.englishScore}
                onChange={(e) => setProfile({...profile, englishScore: e.target.value})}
                placeholder="e.g. IELTS 7.5"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Program of Interest</label>
              <select 
                required
                value={profile.program}
                onChange={(e) => setProfile({...profile, program: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all appearance-none"
              >
                <option value="" className="bg-brand-brown">Select Program</option>
                <option value="Bachelors" className="bg-brand-brown">Bachelors</option>
                <option value="BSc. Top Up" className="bg-brand-brown">BSc. Top Up</option>
                <option value="Masters" className="bg-brand-brown">Masters (MSc/MA)</option>
                <option value="MRes" className="bg-brand-brown">MRes</option>
                <option value="MBA" className="bg-brand-brown">MBA</option>
                <option value="PhD" className="bg-brand-brown">PhD</option>
              </select>
            </div>
            <div className="md:col-span-2 lg:col-span-3 space-y-2">
              <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Course of Interest</label>
              <div className="relative flex flex-col md:block">
                <input 
                  type="text" 
                  required
                  value={profile.course}
                  onChange={(e) => setProfile({...profile, course: e.target.value})}
                  placeholder="e.g. Data Science, International Business, Public Health..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white text-lg focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/20"
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="mt-4 md:mt-0 md:absolute md:right-3 md:top-3 md:bottom-3 bg-brand-orange hover:bg-brand-orange-light text-white px-10 py-4 md:py-0 rounded-xl font-black text-sm flex items-center justify-center disabled:opacity-50 transition-all shadow-lg shadow-brand-orange/20 uppercase tracking-widest"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2 w-4 h-4" />}
                  Find Universities
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {(loading || results) && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#2D1B14] p-10 rounded-[40px] border border-white/5 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-brand-orange/20 rounded-2xl flex items-center justify-center">
                {loading && !results?.startsWith("Searching") ? (
                  <Loader2 className="text-brand-orange w-6 h-6 animate-spin" />
                ) : (
                  <GraduationCap className="text-brand-orange w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-2xl font-black text-white leading-none">
                  {loading ? "AI is Working..." : "Your Personalized Shortlist"}
                </h3>
                <p className="text-white/40 text-sm mt-1">
                  {loading ? "Fetching the latest 2026/2027 data for you" : "Based on your academic profile and preferences"}
                </p>
              </div>
              {!loading && (
                <button 
                  onClick={handleClear}
                  className="ml-auto flex items-center gap-2 text-white/40 hover:text-brand-orange transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear Search
                </button>
              )}
            </div>
            <div className="prose prose-invert max-w-none prose-headings:text-brand-orange prose-strong:text-white prose-p:text-white/80">
              <Markdown>{results || "Initializing search..."}</Markdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DefinitionsSection 
        title="Key University Terms"
        terms={[
          { term: "CGPA", definition: "Cumulative Grade Point Average, a numerical representation of your overall academic performance across your entire degree." },
          { term: "IELTS/TOEFL", definition: "Standardized English language proficiency tests required by universities for non-native speakers to prove they can study in English." },
          { term: "Scholarship", definition: "Financial aid awarded to students based on academic merit, athletic ability, or other criteria that does not need to be repaid." },
          { term: "Entry Requirements", definition: "The minimum academic and language standards a student must meet to be considered for admission into a specific course." },
          { term: "UCAS", definition: "Universities and Colleges Admissions Service. The centralized system used to apply to undergraduate courses in the United Kingdom." },
          { term: "Semester", definition: "A half-year term in a school or college, typically lasting 15-18 weeks, used to divide the academic year." },
          { term: "Credit Hours", definition: "A unit that measures the amount of time a student spends in class for a specific course, used to determine progress toward a degree." }
        ]}
      />
    </div>
  );
};

const POFView = () => {
  const [data, setData] = useState({
    residence: '',
    targetCountry: '',
    university: '',
    program: '',
    course: '',
    dependants: 0
  });
  const [results, setResults] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.residence || !data.targetCountry || !data.university) return;
    setLoading(true);
    setResults("Calculating your Proof of Funds requirements...");
    try {
      const stream = calculatePOFStream(data);
      let fullText = "";
      let firstChunk = true;
      for await (const chunk of stream) {
        if (firstChunk) {
          fullText = "";
          firstChunk = false;
        }
        fullText += chunk;
        setResults(fullText);
      }
      if (!fullText) {
        setResults("Unable to calculate POF at this time. Please try again later.");
      }
    } catch (err: any) {
      console.error(err);
      setResults(`Error: ${err.message || "We encountered an error while calculating your POF. Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setData({
      residence: '',
      targetCountry: '',
      university: '',
      program: '',
      course: '',
      dependants: 0
    });
    setResults(null);
  };

  return (
    <div className="max-w-4xl mx-auto pt-6 pb-12 px-4">
      <h2 className="text-4xl font-bold text-white mb-8">Proof of Funds Calculator</h2>
      
      <div className="bg-[#4A2C21] p-8 rounded-[40px] border border-white/5 shadow-2xl mb-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Country of Residence</label>
            <input 
              type="text" 
              value={data.residence}
              onChange={(e) => setData({...data, residence: e.target.value})}
              placeholder="e.g. Nigeria"
              className="w-full bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/20"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Target Country</label>
            <input 
              type="text" 
              value={data.targetCountry}
              onChange={(e) => setData({...data, targetCountry: e.target.value})}
              placeholder="e.g. United Kingdom"
              className="w-full bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/20"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Name of University</label>
            <input 
              type="text" 
              value={data.university}
              onChange={(e) => setData({...data, university: e.target.value})}
              placeholder="e.g. University of Hertfordshire"
              className="w-full bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/20"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Study Program</label>
            <select 
              value={data.program}
              onChange={(e) => setData({...data, program: e.target.value})}
              className="w-full bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all appearance-none"
              required
            >
              <option value="">Select Program</option>
              <option value="Bachelors">Bachelors</option>
              <option value="BSc. Top Up">BSc. Top Up</option>
              <option value="Masters">Masters (MSc/MA)</option>
              <option value="MRes">MRes</option>
              <option value="MBA">MBA</option>
              <option value="PhD">PhD</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Course of Interest</label>
            <input 
              type="text" 
              value={data.course}
              onChange={(e) => setData({...data, course: e.target.value})}
              placeholder="e.g. Data Science"
              className="w-full bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/20"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Number of Dependants</label>
            <input 
              type="number" 
              min="0"
              value={data.dependants}
              onChange={(e) => setData({...data, dependants: parseInt(e.target.value) || 0})}
              className="w-full bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
              required
            />
          </div>
          <div className="md:col-span-2">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange hover:bg-brand-orange-light text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center disabled:opacity-50 transition-all shadow-lg shadow-brand-orange/20 uppercase tracking-widest"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : <Calculator className="mr-2 w-4 h-4" />}
              Calculate Proof of Funds
            </button>
          </div>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {(loading || results) && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#2D1B14] p-10 rounded-[40px] border border-white/5 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-brand-orange/20 rounded-2xl flex items-center justify-center">
                {loading && !results?.startsWith("Calculating") ? (
                  <Loader2 className="text-brand-orange w-6 h-6 animate-spin" />
                ) : (
                  <Calculator className="text-brand-orange w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-2xl font-black text-white leading-none">
                  {loading ? "Calculating..." : "POF Breakdown"}
                </h3>
                <p className="text-white/40 text-sm mt-1">
                  {loading ? "Analyzing current visa and tuition data" : "Estimated requirements in your local currency"}
                </p>
              </div>
              {!loading && (
                <button 
                  onClick={handleClear}
                  className="ml-auto flex items-center gap-2 text-white/40 hover:text-brand-orange transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
            <div className="prose prose-invert max-w-none prose-headings:text-brand-orange prose-strong:text-white prose-p:text-white/80">
              <Markdown>{results || "Preparing calculation..."}</Markdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DefinitionsSection 
        title="Financial Definitions"
        terms={[
          { term: "Proof of Funds (POF)", definition: "Evidence required by immigration authorities to prove you have sufficient money to cover your tuition fees and living expenses." },
          { term: "Maintenance Funds", definition: "The specific amount of money mandated by a country's immigration policy to cover monthly living costs like rent, food, and transport." },
          { term: "Dependant", definition: "A family member, such as a spouse or child, who is legally allowed to accompany the primary student visa holder." },
          { term: "28-Day Rule", definition: "A common requirement where funds must be held in a bank account for at least 28 consecutive days before the visa application." },
          { term: "OANDA Rate", definition: "The official currency converter used by immigration authorities like the UK Home Office to verify the value of funds in different currencies." },
          { term: "Sponsorship", definition: "Financial support provided by a person or organization (e.g., a government or employer) to cover a student's education and living costs." },
          { term: "Tuition Deposit", definition: "A non-refundable payment made to a university to secure a place in a program, often required before a CAS or COE is issued." }
        ]}
      />
    </div>
  );
};

const ChatView = ({ currentUser }: { currentUser: AppUser | null }) => {
  const [mode, setMode] = useState<'ai' | 'live'>('ai');
  const [messages, setMessages] = useState<{role: 'user' | 'bot' | 'counselor', content: string, sender?: string}[]>([
    { role: 'bot', content: "Hello! I'm your Digivasity AI Advisor. How can I help you with your overseas education journey today?" }
  ]);
  const [liveMessages, setLiveMessages] = useState<{role: 'user' | 'counselor', content: string, sender: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const liveScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'live' && !socket) {
      const newSocket = io();
      setSocket(newSocket);
      newSocket.emit('join_room', 'general_counseling');
      
      newSocket.on('receive_message', (data) => {
        setLiveMessages(prev => [...prev, { 
          role: data.role, 
          content: data.text, 
          sender: data.sender 
        }]);
      });

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [mode, socket]);

  useEffect(() => {
    const ref = mode === 'ai' ? scrollRef : liveScrollRef;
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [messages, liveMessages, mode]);

  const handleSend = async () => {
    if (!input || loading) return;
    const userMsg = input;
    setInput('');

    if (mode === 'ai') {
      setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
      setLoading(true);
      // Add thinking placeholder
      setMessages(prev => [...prev, { role: 'bot', content: "Thinking..." }]);

      try {
        const stream = chatWithGeminiStream(userMsg);
        let fullText = "";
        
        let firstChunk = true;
        for await (const chunk of stream) {
          if (firstChunk) {
            fullText = "";
            firstChunk = false;
          }
          fullText += chunk;
          setMessages(prev => {
            const newMsgs = [...prev];
            if (newMsgs.length > 0) {
              newMsgs[newMsgs.length - 1].content = fullText;
            }
            return newMsgs;
          });
        }
        
        if (firstChunk) {
          setMessages(prev => {
            const newMsgs = [...prev];
            if (newMsgs.length > 0) {
              newMsgs[newMsgs.length - 1].content = "I'm sorry, I couldn't generate a response. Please try again.";
            }
            return newMsgs;
          });
        }
      } catch (err: any) {
        console.error(err);
        setMessages(prev => {
          const newMsgs = [...prev];
          if (newMsgs.length > 0) {
            newMsgs[newMsgs.length - 1].content = `Error: ${err.message || "Error connecting to AI. Please try again."}`;
          }
          return newMsgs;
        });
      } finally {
        setLoading(false);
      }
    } else if (socket) {
      socket.emit('send_message', {
        room: 'general_counseling',
        text: userMsg,
        sender: 'Student', // In a real app, this would be the user's name
        role: 'user'
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto pt-4 pb-12 px-4 h-[calc(100vh-160px)] flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl font-bold text-white">{mode === 'ai' ? 'AI Chat Advisor' : 'Live Counselor'}</h2>
        <div className="flex bg-[#2D1B14] rounded-2xl p-1 border border-white/5">
          <button 
            onClick={() => setMode('ai')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
              mode === 'ai' ? "bg-brand-orange text-white shadow-lg" : "text-white/40 hover:text-white/60"
            )}
          >
            <Bot size={14} />
            AI Advisor
          </button>
          <button 
            onClick={() => setMode('live')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
              mode === 'live' ? "bg-brand-orange text-white shadow-lg" : "text-white/40 hover:text-white/60"
            )}
          >
            <MessageSquare size={14} />
            Live Chat
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#4A2C21] rounded-[40px] border border-white/10 overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-white/5 px-8 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              {mode === 'ai' ? 'System Online' : 'Counselors Available'}
            </span>
          </div>
          {mode === 'live' && (
            <span className="text-[10px] font-bold text-brand-orange uppercase tracking-widest">
              Real-time Support
            </span>
          )}
        </div>

        <div ref={mode === 'ai' ? scrollRef : liveScrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          {(mode === 'ai' ? messages : liveMessages).length === 0 && mode === 'live' && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <MessageSquare size={48} className="text-brand-orange" />
              <p className="text-sm font-medium text-white max-w-[200px]">
                Start a conversation with our expert career counselors.
              </p>
            </div>
          )}
          
          {(mode === 'ai' ? messages : liveMessages).map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i} 
              className={cn("flex flex-col", (msg.role === 'user') ? "items-end" : "items-start")}
            >
              {(msg as any).sender && (
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1 px-2">
                  {(msg as any).sender}
                </span>
              )}
              <div className={cn(
                "max-w-[85%] p-5 rounded-3xl flex gap-4 shadow-lg",
                (msg.role === 'user') ? "bg-brand-orange text-white rounded-tr-none" : "bg-[#2D1B14] text-white/90 rounded-tl-none border border-white/5"
              )}>
                <div className="shrink-0 mt-1">
                  {(msg.role === 'user') ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-brand-orange" />}
                </div>
                <div className="prose prose-invert text-sm leading-relaxed">
                  <Markdown>{msg.content}</Markdown>
                </div>
              </div>
            </motion.div>
          ))}
          
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-[#2D1B14] p-5 rounded-3xl rounded-tl-none border border-white/5 flex gap-4 shadow-lg">
                <Loader2 className="w-4 h-4 text-brand-orange animate-spin" />
                <span className="text-white/40 italic text-xs font-medium">AI is crafting a response...</span>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-6 bg-[#2D1B14]/80 backdrop-blur-xl border-t border-white/5 flex gap-4">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={mode === 'ai' ? "Ask about universities, visas, or POF..." : "Type your message to a counselor..."}
            className="flex-1 bg-[#4A2C21] border border-white/10 rounded-2xl px-8 py-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/20 text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={loading || (mode === 'live' && !socket)}
            className="bg-brand-orange text-white p-4 rounded-2xl hover:bg-brand-orange-light transition-all disabled:opacity-50 shadow-lg shadow-brand-orange/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const CanadaStandardLayout = ({ data }: { data: any }) => {
  return (
    <div className="flex min-h-[1120px] w-full bg-white text-black overflow-hidden font-sans">
      {/* Left Column - Main Content */}
      <div className="w-[65%] p-16 flex flex-col gap-8 border-r border-gray-100">
        <header>
          <h1 className="text-4xl font-black tracking-tight mb-1">
            {data.personalInfo.fullName || "YOUR NAME"}
          </h1>
          <p className="text-lg font-bold text-[#007bff] mb-4">
            {data.experience[0]?.role || "Professional"}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-gray-600">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-[#007bff]" />
              {data.personalInfo.email}
            </div>
            {data.personalInfo.linkedin && (
              <div className="flex items-center gap-2">
                <Linkedin size={14} className="text-[#007bff]" />
                {data.personalInfo.linkedin}
              </div>
            )}
          </div>
        </header>

        {/* Summary */}
        <section>
          <h2 className="text-lg font-black uppercase tracking-widest border-b-2 border-black pb-1 mb-4">
            Summary
          </h2>
          <p className="text-sm leading-relaxed text-gray-700">
            {data.personalInfo.summary}
          </p>
        </section>

        {/* Experience */}
        <section>
          <h2 className="text-lg font-black uppercase tracking-widest border-b-2 border-black pb-1 mb-6">
            Experience
          </h2>
          <div className="space-y-8">
            {data.experience.filter((e: any) => e.company || e.role).map((exp: any, idx: number) => (
              <div key={idx}>
                <h3 className="text-base font-black text-gray-900 mb-0.5">{exp.role}</h3>
                <p className="text-sm font-bold text-[#007bff] mb-2">{exp.company}</p>
                <div className="flex gap-4 text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    {exp.startDate} - {exp.endDate}
                  </div>
                  {exp.location && (
                    <div className="flex items-center gap-1">
                      <MapPin size={12} />
                      {exp.location}
                    </div>
                  )}
                </div>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5 ml-1">
                  {exp.responsibilities.split('\n').filter((line: string) => line.trim()).map((line: string, lIdx: number) => (
                    <li key={lIdx} className="leading-relaxed">{line.replace(/^[•\-\*]\s*/, '')}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section>
          <h2 className="text-lg font-black uppercase tracking-widest border-b-2 border-black pb-1 mb-6">
            Education
          </h2>
          <div className="space-y-6">
            {data.education.filter((e: any) => e.school || e.degree).map((edu: any, idx: number) => (
              <div key={idx}>
                <h3 className="text-base font-black text-gray-900 mb-0.5">{edu.degree}</h3>
                <p className="text-sm font-bold text-[#007bff] mb-2">{edu.school}</p>
                <div className="flex gap-4 text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    {edu.startDate} - {edu.endDate}
                  </div>
                  {edu.location && (
                    <div className="flex items-center gap-1">
                      <MapPin size={12} />
                      {edu.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Right Column - Sidebar */}
      <div className="w-[35%] p-16 bg-gray-50 flex flex-col gap-10">
        {data.personalInfo.address && (
          <div className="flex items-center gap-2 text-xs font-bold text-[#007bff]">
            <MapPin size={16} />
            {data.personalInfo.address}
          </div>
        )}

        {/* Achievements */}
        {data.achievements?.length > 0 && (
          <section>
            <h2 className="text-lg font-black uppercase tracking-widest border-b-2 border-black pb-1 mb-6">
              Achievements
            </h2>
            <div className="space-y-6">
              {data.achievements.map((ach: any, idx: number) => (
                <div key={idx} className="flex gap-3">
                  <div className="mt-1">
                    <Trophy size={18} className="text-[#007bff]" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 mb-1">{ach.title}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        <section>
          <h2 className="text-lg font-black uppercase tracking-widest border-b-2 border-black pb-1 mb-6">
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.filter((s: string) => s.trim()).map((skill: string, idx: number) => (
              <div key={idx} className="bg-white border border-gray-200 px-3 py-1.5 rounded text-xs font-bold text-gray-700 shadow-sm">
                {skill}
              </div>
            ))}
          </div>
        </section>

        {/* Certifications */}
        {data.certifications?.length > 0 && data.certifications[0] !== "" && (
          <section>
            <h2 className="text-lg font-black uppercase tracking-widest border-b-2 border-black pb-1 mb-6">
              Certification
            </h2>
            <div className="space-y-4">
              {data.certifications.filter((c: string) => c.trim()).map((cert: string, idx: number) => (
                <div key={idx}>
                  <p className="text-sm font-black text-[#007bff] mb-1">{cert}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Passions */}
        {data.passions?.length > 0 && (
          <section>
            <h2 className="text-lg font-black uppercase tracking-widest border-b-2 border-black pb-1 mb-6">
              Passions
            </h2>
            <div className="space-y-6">
              {data.passions.map((pas: any, idx: number) => (
                <div key={idx} className="flex gap-3">
                  <div className="mt-1">
                    <Heart size={18} className="text-[#007bff]" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 mb-1">{pas.title}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{pas.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

const USAStandardLayout = ({ data }: { data: any }) => {
  return (
    <div className="p-16 bg-white text-black min-h-[1120px] font-serif flex flex-col gap-8 text-center">
      {/* Header */}
      <header className="border-b border-gray-300 pb-4">
        <h1 className="text-4xl font-bold tracking-wider mb-2 uppercase text-[#1a2a4a]">
          {data.personalInfo.fullName || "YOUR NAME"}
        </h1>
        <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-gray-700">
          <span>{data.personalInfo.address}</span>
          <span>•</span>
          <span>{data.personalInfo.email}</span>
          <span>•</span>
          <span>{data.personalInfo.phone}</span>
        </div>
      </header>

      {/* Summary */}
      <section className="text-left">
        <p className="text-sm leading-relaxed text-gray-800 italic">
          {data.personalInfo.summary}
        </p>
      </section>

      {/* Experience */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] border-y-2 border-[#1a2a4a] py-1 mb-6 text-[#1a2a4a] inline-block px-8">
          Professional Experience
        </h2>
        <div className="space-y-8 text-left">
          {data.experience.filter((e: any) => e.company || e.role).map((exp: any, idx: number) => (
            <div key={idx} className="flex flex-col items-center">
              <h3 className="text-sm font-bold text-gray-900 mb-0.5">{exp.role}</h3>
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">{exp.company}{exp.location ? `, ${exp.location}` : ''}</p>
              <p className="text-xs italic text-gray-500 mb-3">{exp.startDate} – {exp.endDate}</p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 w-full max-w-2xl mx-auto">
                {exp.responsibilities.split('\n').filter((line: string) => line.trim()).map((line: string, lIdx: number) => (
                  <li key={lIdx} className="leading-relaxed">{line.replace(/^[•\-\*]\s*/, '')}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] border-y-2 border-[#1a2a4a] py-1 mb-6 text-[#1a2a4a] inline-block px-8">
          Education
        </h2>
        <div className="space-y-6">
          {data.education.filter((e: any) => e.school || e.degree).map((edu: any, idx: number) => (
            <div key={idx} className="flex flex-col items-center">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{edu.school}{edu.location ? `, ${edu.location}` : ''}</h3>
              <p className="text-xs italic text-gray-500 mb-1">{edu.startDate} – {edu.endDate}</p>
              <p className="text-sm font-medium text-gray-700">{edu.degree}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] border-y-2 border-[#1a2a4a] py-1 mb-6 text-[#1a2a4a] inline-block px-8">
          Additional Skills
        </h2>
        <p className="text-sm text-gray-700 max-w-2xl mx-auto leading-relaxed">
          {data.skills.filter((s: string) => s.trim()).join(', ')}
        </p>
      </section>

      {/* Achievements & Passions */}
      {(data.achievements?.length > 0 && data.achievements[0].title || data.passions?.length > 0 && data.passions[0].title) && (
        <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto text-left">
          {data.achievements?.length > 0 && data.achievements[0].title && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] border-b border-gray-300 pb-1 mb-4 text-[#1a2a4a]">
                Key Achievements
              </h2>
              <div className="space-y-4">
                {data.achievements.map((ach: any, idx: number) => (
                  <div key={idx}>
                    <p className="text-sm font-bold text-gray-900">{ach.title}</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{ach.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          {data.passions?.length > 0 && data.passions[0].title && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] border-b border-gray-300 pb-1 mb-4 text-[#1a2a4a]">
                Passions & Interests
              </h2>
              <div className="space-y-4">
                {data.passions.map((pas: any, idx: number) => (
                  <div key={idx}>
                    <p className="text-sm font-bold text-gray-900">{pas.title}</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{pas.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

const UKStandardLayout = ({ data }: { data: any }) => {
  return (
    <div className="p-16 bg-white text-black min-h-[1120px] font-sans flex flex-col gap-8">
      {/* Header */}
      <header className="border-b-2 border-black pb-6">
        <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">
          {data.personalInfo.fullName || "YOUR NAME"}
        </h1>
        <p className="text-lg font-bold text-[#F27D26] mb-4">
          {data.experience[0]?.role || "Professional"}
        </p>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-[11px] font-bold text-gray-600">
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-[#F27D26]" />
            {data.personalInfo.phone}
          </div>
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-[#F27D26]" />
            {data.personalInfo.email}
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-[#F27D26]" />
            {data.personalInfo.address}
          </div>
          {data.personalInfo.linkedin && (
            <div className="flex items-center gap-2">
              <Linkedin size={14} className="text-[#F27D26]" />
              {data.personalInfo.linkedin}
            </div>
          )}
        </div>
      </header>

      {/* Summary */}
      <section>
        <h2 className="text-lg font-black uppercase tracking-widest border-b-2 border-black pb-1 mb-4">
          Summary
        </h2>
        <p className="text-sm leading-relaxed text-gray-700">
          {data.personalInfo.summary}
        </p>
      </section>

      {/* Experience */}
      <section>
        <h2 className="text-lg font-black uppercase tracking-widest border-b-2 border-black pb-1 mb-6">
          Experience
        </h2>
        <div className="space-y-8">
          {data.experience.filter((e: any) => e.company || e.role).map((exp: any, idx: number) => (
            <div key={idx}>
              <h3 className="text-base font-black text-gray-900 mb-1">{exp.role}</h3>
              <p className="text-sm font-bold text-[#F27D26] mb-2">{exp.company}</p>
              <div className="flex gap-6 text-[10px] font-bold text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  {exp.startDate} - {exp.endDate}
                </div>
                {exp.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    {exp.location}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {exp.responsibilities}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      <section>
        <h2 className="text-lg font-black uppercase tracking-widest border-b-2 border-black pb-1 mb-6">
          Education
        </h2>
        <div className="space-y-6">
          {data.education.filter((e: any) => e.school || e.degree).map((edu: any, idx: number) => (
            <div key={idx}>
              <h3 className="text-base font-black text-gray-900 mb-1">{edu.degree}</h3>
              <p className="text-sm font-bold text-[#F27D26] mb-2">{edu.school}</p>
              <div className="flex gap-6 text-[10px] font-bold text-gray-500 mb-2">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  {edu.startDate} - {edu.endDate}
                </div>
                {edu.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    {edu.location}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Languages & Skills */}
      <div className="grid grid-cols-2 gap-12">
        {data.languages.some((l: any) => l.name) && (
          <section>
            <h2 className="text-lg font-black uppercase tracking-widest border-b-2 border-black pb-1 mb-6">
              Languages
            </h2>
            <div className="space-y-4">
              {data.languages.filter((l: any) => l.name).map((lang: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-gray-900">{lang.name}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">{lang.level}</p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((dot) => (
                      <div 
                        key={dot} 
                        className={cn(
                          "w-3 h-3 rounded-full",
                          dot <= (lang.proficiency || 3) ? "bg-[#F27D26]" : "bg-gray-200"
                        )} 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-black uppercase tracking-widest border-b-2 border-black pb-1 mb-6">
            Skills
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-3">
            {data.skills.filter((s: string) => s.trim()).map((skill: string, idx: number) => (
              <div key={idx} className="border-b border-gray-300 pb-1">
                <span className="text-sm font-bold text-gray-800">{skill}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Achievements & Passions */}
      {(data.achievements?.length > 0 && data.achievements[0].title || data.passions?.length > 0 && data.passions[0].title) && (
        <div className="grid grid-cols-2 gap-12">
          {data.achievements?.length > 0 && data.achievements[0].title && (
            <section>
              <h2 className="text-lg font-black uppercase tracking-widest border-b-2 border-black pb-1 mb-6">
                Achievements
              </h2>
              <div className="space-y-4">
                {data.achievements.map((ach: any, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <Trophy size={16} className="text-[#F27D26] shrink-0 mt-1" />
                    <div>
                      <p className="text-sm font-black text-gray-900">{ach.title}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{ach.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {data.passions?.length > 0 && data.passions[0].title && (
            <section>
              <h2 className="text-lg font-black uppercase tracking-widest border-b-2 border-black pb-1 mb-6">
                Passions
              </h2>
              <div className="space-y-4">
                {data.passions.map((pas: any, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <Heart size={16} className="text-[#F27D26] shrink-0 mt-1" />
                    <div>
                      <p className="text-sm font-black text-gray-900">{pas.title}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{pas.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

const AustraliaStandardLayout = ({ data }: { data: any }) => {
  return (
    <div className="flex min-h-[1120px] w-full bg-white text-black overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-[30%] bg-[#f8f9fa] p-12 flex flex-col gap-10 border-r border-gray-200">
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#003087] mb-4">Contact</h2>
          <div className="space-y-4 text-[11px] font-bold text-gray-600">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0030871a] flex items-center justify-center shrink-0">
                <Phone size={14} className="text-[#003087]" />
              </div>
              <span className="break-all">{data.personalInfo.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0030871a] flex items-center justify-center shrink-0">
                <Mail size={14} className="text-[#003087]" />
              </div>
              <span className="break-all">{data.personalInfo.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0030871a] flex items-center justify-center shrink-0">
                <MapPin size={14} className="text-[#003087]" />
              </div>
              <span>{data.personalInfo.address}</span>
            </div>
            {data.personalInfo.linkedin && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0030871a] flex items-center justify-center shrink-0">
                  <Linkedin size={14} className="text-[#003087]" />
                </div>
                <span className="break-all">{data.personalInfo.linkedin.replace('https://', '')}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#003087] mb-4">Key Skills</h2>
          <div className="flex flex-col gap-2">
            {data.skills.filter((s: string) => s.trim()).map((skill: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-[#003087]" />
                {skill}
              </div>
            ))}
          </div>
        </div>

        {data.languages?.length > 0 && data.languages[0].name && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#003087] mb-4">Languages</h2>
            <div className="space-y-3">
              {data.languages.map((lang: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-gray-800">{lang.name}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((dot) => (
                      <div 
                        key={dot} 
                        className={cn(
                          "w-2 h-2 rounded-full",
                          dot <= (lang.proficiency || 3) ? "bg-[#003087]" : "bg-gray-200"
                        )} 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="w-[70%] p-16 flex flex-col gap-10">
        <header>
          <h1 className="text-5xl font-black tracking-tight text-[#003087] mb-2 uppercase">
            {data.personalInfo.fullName || "YOUR NAME"}
          </h1>
          <p className="text-xl font-bold text-gray-500 tracking-wide">
            {data.experience[0]?.role || "Professional"}
          </p>
        </header>

        <section>
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[#003087] mb-4 border-b-2 border-[#003087] pb-1">
            Professional Profile
          </h2>
          <p className="text-sm leading-relaxed text-gray-700 font-medium">
            {data.personalInfo.summary}
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[#003087] mb-6 border-b-2 border-[#003087] pb-1">
            Employment History
          </h2>
          <div className="space-y-8">
            {data.experience.filter((e: any) => e.company || e.role).map((exp: any, idx: number) => (
              <div key={idx} className="relative pl-6 border-l-2 border-gray-100">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-[#003087]" />
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-base font-black text-gray-900">{exp.role}</h3>
                  <span className="text-[10px] font-black text-[#003087] uppercase tracking-widest bg-[#0030871a] px-2 py-1 rounded">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-500 mb-3">{exp.company}{exp.location ? ` | ${exp.location}` : ''}</p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5 ml-1">
                  {exp.responsibilities.split('\n').filter((line: string) => line.trim()).map((line: string, lIdx: number) => (
                    <li key={lIdx} className="leading-relaxed">{line.replace(/^[•\-\*]\s*/, '')}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[#003087] mb-6 border-b-2 border-[#003087] pb-1">
            Education & Qualifications
          </h2>
          <div className="space-y-6">
            {data.education.filter((e: any) => e.school || e.degree).map((edu: any, idx: number) => (
              <div key={idx} className="relative pl-6 border-l-2 border-gray-100">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-gray-200" />
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-base font-black text-gray-900">{edu.degree}</h3>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{edu.startDate} - {edu.endDate}</span>
                </div>
                <p className="text-sm font-bold text-gray-500">{edu.school}{edu.location ? ` | ${edu.location}` : ''}</p>
              </div>
            ))}
          </div>
        </section>

        {data.achievements?.length > 0 && data.achievements[0].title && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[#003087] mb-6 border-b-2 border-[#003087] pb-1">
              Key Achievements
            </h2>
            <div className="space-y-4">
              {data.achievements.map((ach: any, idx: number) => (
                <div key={idx} className="flex gap-4">
                  <Trophy size={18} className="text-[#003087] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-gray-900">{ach.title}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.passions?.length > 0 && data.passions[0].title && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[#003087] mb-6 border-b-2 border-[#003087] pb-1">
              Passions & Interests
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {data.passions.map((pas: any, idx: number) => (
                <div key={idx} className="flex gap-4">
                  <Heart size={18} className="text-[#003087] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-gray-900">{pas.title}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{pas.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.references && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[#003087] mb-4 border-b-2 border-[#003087] pb-1">
              Referees
            </h2>
            <p className="text-sm italic text-gray-600">
              {data.references}
            </p>
          </section>
        )}
      </div>
    </div>
  );
};

const EuropassLayout = ({ data }: { data: any }) => {
  return (
    <div className="flex min-h-[1120px] w-full bg-white text-black overflow-hidden font-sans">
      {/* Left Column - Sidebar */}
      <div className="w-[32%] bg-[#004494] text-white p-12 flex flex-col gap-8">
        <div className="text-center border-b border-[#ffffff33] pb-8">
          <div className="w-32 h-32 bg-[#ffffff1a] rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-[#ffffff33] overflow-hidden">
            {data.personalInfo.photo ? (
              <img src={data.personalInfo.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={64} className="text-[#ffffff66]" />
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2 uppercase leading-tight">
            {data.personalInfo.fullName || "YOUR NAME"}
          </h1>
          <p className="text-xs font-bold text-[#ffffff99] uppercase tracking-widest mb-6">
            {data.experience[0]?.role || "Professional"}
          </p>
          
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#ffffff1a] flex items-center justify-center shrink-0">
                <Phone size={14} />
              </div>
              <span className="text-xs font-medium">{data.personalInfo.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#ffffff1a] flex items-center justify-center shrink-0">
                <Mail size={14} />
              </div>
              <span className="text-xs font-medium break-all">{data.personalInfo.email}</span>
            </div>
            {data.personalInfo.linkedin && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#ffffff1a] flex items-center justify-center shrink-0">
                  <Linkedin size={14} />
                </div>
                <span className="text-xs font-medium break-all">{data.personalInfo.linkedin}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#ffffff1a] flex items-center justify-center shrink-0">
                <MapPin size={14} />
              </div>
              <span className="text-xs font-medium">{data.personalInfo.address}</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-[#ffffff33] pb-2">
            <div className="w-2 h-2 bg-white rounded-full" />
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.filter((s: string) => s.trim()).map((skill: string, idx: number) => (
              <span key={idx} className="px-3 py-1 bg-[#ffffff1a] rounded-md text-[10px] font-bold uppercase tracking-wider">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {data.interests.some((i: string) => i.trim()) && (
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-[#ffffff33] pb-2">
              <div className="w-2 h-2 bg-white rounded-full" />
              Interests
            </h2>
            <div className="space-y-3">
              {data.interests.filter((i: string) => i.trim()).map((interest: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-medium">
                  <Heart size={10} className="text-[#ffffff66]" />
                  {interest}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Main Content */}
      <div className="w-[68%] p-16 flex flex-col gap-12">
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#0044940d] flex items-center justify-center text-[#004494]">
              <User size={24} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-[#004494]">
              About Me
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-gray-700 font-medium">
            {data.personalInfo.summary || "A professional summary will appear here..."}
          </p>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#0044940d] flex items-center justify-center text-[#004494]">
              <Briefcase size={24} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-[#004494]">
              Work Experience
            </h2>
          </div>
          <div className="space-y-10 relative before:absolute before:left-[23px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
            {data.experience.filter((e: any) => e.company || e.role).map((exp: any, idx: number) => (
              <div key={idx} className="relative pl-16">
                <div className="absolute left-0 top-1 w-12 h-12 rounded-xl bg-white border-2 border-gray-100 flex items-center justify-center z-10">
                  <div className="w-3 h-3 rounded-full bg-[#004494]" />
                </div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-black text-gray-900">{exp.role}</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#004494] bg-[#0044940d] px-3 py-1 rounded-full">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                <p className="text-sm font-bold text-[#004494] mb-3 uppercase tracking-wider">{exp.company}</p>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {exp.responsibilities}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#0044940d] flex items-center justify-center text-[#004494]">
              <GraduationCap size={24} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-[#004494]">
              Education
            </h2>
          </div>
          <div className="space-y-8">
            {data.education.filter((e: any) => e.school || e.degree).map((edu: any, idx: number) => (
              <div key={idx} className="flex gap-6">
                <div className="w-24 shrink-0 text-[10px] font-black uppercase tracking-widest text-gray-400 pt-1">
                  {edu.startDate} - {edu.endDate}
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">{edu.degree}</h3>
                  <p className="text-sm font-bold text-[#004494] mb-2">{edu.school}</p>
                  {edu.description && <p className="text-sm text-gray-600 leading-relaxed">{edu.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {(data.certifications.some((c: string) => c.trim()) || data.references || (data.achievements?.length > 0 && data.achievements[0].title) || (data.passions?.length > 0 && data.passions[0].title)) && (
          <div className="flex flex-col gap-10">
            <div className="grid grid-cols-2 gap-12">
              {data.certifications.some((c: string) => c.trim()) && (
                <section>
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#004494] mb-6 border-b-2 border-[#0044941a] pb-2">
                    Certifications
                  </h2>
                  <div className="space-y-3">
                    {data.certifications.filter((c: string) => c.trim()).map((cert: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Award size={14} className="text-[#004494]" />
                        <span className="text-xs font-bold text-gray-700">{cert}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {data.references && (
                <section>
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#004494] mb-6 border-b-2 border-[#0044941a] pb-2">
                    References
                  </h2>
                  <p className="text-xs italic text-gray-600 leading-relaxed">
                    {data.references}
                  </p>
                </section>
              )}
            </div>

            {(data.achievements?.length > 0 && data.achievements[0].title || data.passions?.length > 0 && data.passions[0].title) && (
              <div className="grid grid-cols-1 gap-10">
                {data.achievements?.length > 0 && data.achievements[0].title && (
                  <section>
                    <h2 className="text-sm font-black uppercase tracking-widest text-[#004494] mb-6 border-b-2 border-[#0044941a] pb-2">
                      Key Achievements
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                      {data.achievements.map((ach: any, idx: number) => (
                        <div key={idx} className="flex gap-3">
                          <Trophy size={16} className="text-[#004494] shrink-0 mt-1" />
                          <div>
                            <p className="text-sm font-black text-gray-900">{ach.title}</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{ach.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                {data.passions?.length > 0 && data.passions[0].title && (
                  <section>
                    <h2 className="text-sm font-black uppercase tracking-widest text-[#004494] mb-6 border-b-2 border-[#0044941a] pb-2">
                      Passions & Interests
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                      {data.passions.map((pas: any, idx: number) => (
                        <div key={idx} className="flex gap-3">
                          <Heart size={16} className="text-[#004494] shrink-0 mt-1" />
                          <div>
                            <p className="text-sm font-black text-gray-900">{pas.title}</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{pas.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ResumeView = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      linkedin: '',
      summary: '',
      photo: ''
    },
    education: [{ school: '', degree: '', startDate: '', endDate: '', description: '', location: '' }],
    experience: [{ company: '', role: '', startDate: '', endDate: '', responsibilities: '', location: '' }],
    skills: [''],
    languages: [{ name: '', level: '', proficiency: 3 }],
    certifications: [''],
    interests: [''],
    achievements: [{ title: '', description: '' }],
    passions: [{ title: '', description: '' }],
    references: 'Available upon request',
    standard: 'UK Standard'
  });
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [resume, setResume] = useState<string | null>(null);
  const resumeRef = useRef<HTMLDivElement>(null);

  const [summaryMode, setSummaryMode] = useState<'manual' | 'ai'>('manual');
  const [aiSummaryData, setAiSummaryData] = useState({ profession: '', years: '', goals: '' });
  const [refining, setRefining] = useState(false);

  const handleRefineSummary = async () => {
    if (!aiSummaryData.profession) return;
    setRefining(true);
    try {
      const prompt = `Refine this professional summary based on:
      Profession: ${aiSummaryData.profession}
      Years of Experience: ${aiSummaryData.years}
      Goals: ${aiSummaryData.goals}
      
      Keep it concise (2-3 sentences), professional, and impactful. Return ONLY the summary text.`;
      const stream = chatWithGeminiStream(prompt, "You are a professional resume writer.");
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setData(prev => ({
          ...prev,
          personalInfo: { ...prev.personalInfo, summary: fullText }
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefining(false);
    }
  };

  const addEducation = () => {
    setData({
      ...data,
      education: [...data.education, { school: '', degree: '', startDate: '', endDate: '', description: '', location: '' }]
    });
  };

  const removeEducation = (index: number) => {
    const newEdu = data.education.filter((_, i) => i !== index);
    setData({ ...data, education: newEdu });
  };

  const addExperience = () => {
    setData({
      ...data,
      experience: [...data.experience, { company: '', role: '', startDate: '', endDate: '', responsibilities: '', location: '' }]
    });
  };

  const removeExperience = (index: number) => {
    const newExp = data.experience.filter((_, i) => i !== index);
    setData({ ...data, experience: newExp });
  };

  const addSkill = () => {
    setData({ ...data, skills: [...data.skills, ''] });
  };

  const removeSkill = (index: number) => {
    const newSkills = data.skills.filter((_, i) => i !== index);
    setData({ ...data, skills: newSkills });
  };

  const addLanguage = () => {
    setData({ ...data, languages: [...data.languages, { name: '', level: '', proficiency: 3 }] });
  };

  const removeLanguage = (index: number) => {
    const newLangs = data.languages.filter((_, i) => i !== index);
    setData({ ...data, languages: newLangs });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({
          ...prev,
          personalInfo: { ...prev.personalInfo, photo: reader.result as string }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResume("Generating your professional resume...");
    try {
      const isEuro = data.standard === 'Euro Standard';
      const isUK = data.standard === 'UK Standard';
      const isUSA = data.standard === 'USA Standard';
      const isCanada = data.standard === 'Canada Standard';
      const isAustralia = data.standard === 'Australia Standard';
      const isJsonMode = isEuro || isUK || isUSA || isCanada || isAustralia;
      
      const prompt = isJsonMode 
        ? `Refine and professionalize the following resume data for the ${data.standard} format. 
           Return the result EXCLUSIVELY as a JSON object with the following structure:
           {
             "personalInfo": { "fullName": "...", "email": "...", "phone": "...", "address": "...", "linkedin": "...", "summary": "..." },
             "education": [{ "school": "...", "degree": "...", "startDate": "...", "endDate": "...", "description": "...", "location": "..." }],
             "experience": [{ "company": "...", "role": "...", "startDate": "...", "endDate": "...", "responsibilities": "...", "location": "..." }],
             "skills": ["...", "..."],
             "languages": [{ "name": "...", "level": "...", "proficiency": 1-5 }],
             "certifications": ["...", "..."],
             "achievements": [{ "title": "...", "description": "..." }],
             "passions": [{ "title": "...", "description": "..." }],
             "interests": ["...", "..."],
             "references": "..."
           }

           DATA:
           ${JSON.stringify(data, null, 2)}`
        : `Generate a professional resume based on the following data and the ${data.standard} format. 
      
           PERSONAL INFORMATION:
           Name: ${data.personalInfo.fullName}
           Email: ${data.personalInfo.email}
           Phone: ${data.personalInfo.phone}
           Address: ${data.personalInfo.address}
           LinkedIn: ${data.personalInfo.linkedin}
           Summary: ${data.personalInfo.summary}
           
           EDUCATION:
           ${data.education.map(e => `- ${e.degree} at ${e.school} (${e.startDate} - ${e.endDate}): ${e.description}`).join('\n')}
           
           WORK EXPERIENCE:
           ${data.experience.map(e => `- ${e.role} at ${e.company} (${e.startDate} - ${e.endDate}): ${e.responsibilities}`).join('\n')}
           
           SKILLS:
           ${data.skills.join(', ')}

           CERTIFICATIONS:
           ${data.certifications.join(', ')}

           INTERESTS:
           ${data.interests.join(', ')}

           REFERENCES:
           ${data.references}
           
           Format the output in clean Markdown. Ensure it strictly follows the ${data.standard} conventions for layout and content priority.`;
      
      const stream = chatWithGeminiStream(prompt, isJsonMode ? "You are a professional resume writer who outputs JSON." : "You are a world-class resume expert specializing in international standards.");
      let fullText = "";
      setStep(5);
      let firstChunk = true;
      for await (const chunk of stream) {
        if (firstChunk) {
          fullText = "";
          firstChunk = false;
        }
        fullText += chunk;
        setResume(fullText);
      }

      if (isJsonMode) {
        try {
          // Clean the JSON string if AI added markdown blocks
          const jsonStr = fullText.replace(/```json\n?|```/g, '').trim();
          const parsed = JSON.parse(jsonStr);
          setData(prev => ({ 
            ...prev, 
            ...parsed,
            personalInfo: {
              ...parsed.personalInfo,
              photo: prev.personalInfo.photo // Preserve the uploaded photo
            }
          }));
        } catch (e) {
          console.error("Failed to parse AI JSON:", e);
        }
      }

      if (!fullText) {
        setResume("Unable to generate resume. Please check your inputs and try again.");
      }
    } catch (err: any) {
      console.error(err);
      setResume(`Error: ${err.message || "An error occurred during resume generation. Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!resumeRef.current || downloading) return;
    
    setDownloading(true);
    try {
      const element = resumeRef.current;
      
      // Create a clone for PDF generation to avoid layout shifts in the UI
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = '794px'; // A4 width at 96 DPI
      clone.style.minHeight = '1123px'; // A4 height at 96 DPI
      // Preserve original padding if it exists, or ensure a minimum padding
      if (!clone.style.padding || clone.style.padding === '0px') {
        // If it's a standard layout, padding is internal. 
        // If it's the default layout, we want to keep the p-12 (48px)
      }
      clone.style.margin = '0';
      clone.style.backgroundColor = '#ffffff';
      clone.style.borderRadius = '0'; // Remove rounded corners for PDF
      document.body.appendChild(clone);

      // Wait for images to load in the clone
      const images = clone.getElementsByTagName('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794,
        y: 0,
        x: 0
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate how many PDF pages we need
      // We want to maintain the aspect ratio and add a small margin if needed
      // But the user wants it "exactly like preview", so we use full width but ensure internal padding exists
      const imgScaledWidth = pdfWidth;
      const imgScaledHeight = (imgHeight * pdfWidth) / imgWidth;
      
      let heightLeft = imgScaledHeight;
      let position = 0;

      // Add the first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgScaledWidth, imgScaledHeight);
      heightLeft -= pdfHeight;

      // Add subsequent pages
      while (heightLeft > 0) {
        position = heightLeft - imgScaledHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgScaledWidth, imgScaledHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = data.personalInfo.fullName 
        ? `${data.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`
        : 'Resume.pdf';
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("There was an error generating your PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pt-6 pb-12 px-4">
      <h2 className="text-4xl font-bold text-white mb-2">AI Resume Builder</h2>
      <p className="text-white/60 mb-8">Craft a professional CV tailored to international standards</p>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {[1, 2, 3, 4, 5].map((s) => (
          <div 
            key={s}
            className={cn(
              "h-1 flex-1 min-w-[40px] rounded-full transition-all",
              step >= s ? "bg-brand-orange" : "bg-white/10"
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-[#4A2C21] p-8 rounded-[40px] border border-white/5 space-y-6"
          >
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
              <User className="text-brand-orange" />
              Personal Information
            </h3>
            
            <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
              <div className="relative group shrink-0">
                <div className="w-32 h-32 rounded-3xl bg-[#2D1B14] border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-brand-orange/50">
                  {data.personalInfo.photo ? (
                    <img src={data.personalInfo.photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera size={32} className="text-white/20 mb-2" />
                      <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Upload Photo</span>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {data.personalInfo.photo && (
                  <button 
                    onClick={() => setData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, photo: '' } }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-white/60 leading-relaxed">
                  Upload a professional headshot. This is highly recommended for the Euro Standard (Europass) format to make your application stand out.
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-brand-orange uppercase tracking-widest">
                  <Upload size={12} />
                  Max size: 2MB (JPG, PNG)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Full Name</label>
                <input 
                  value={data.personalInfo.fullName}
                  onChange={e => setData({...data, personalInfo: {...data.personalInfo, fullName: e.target.value}})}
                  placeholder="John Doe"
                  className="w-full bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Email Address</label>
                <input 
                  value={data.personalInfo.email}
                  onChange={e => setData({...data, personalInfo: {...data.personalInfo, email: e.target.value}})}
                  placeholder="john@example.com"
                  className="w-full bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Phone Number</label>
                <input 
                  value={data.personalInfo.phone}
                  onChange={e => setData({...data, personalInfo: {...data.personalInfo, phone: e.target.value}})}
                  placeholder="+1 234 567 890"
                  className="w-full bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Address</label>
                <input 
                  value={data.personalInfo.address}
                  onChange={e => setData({...data, personalInfo: {...data.personalInfo, address: e.target.value}})}
                  placeholder="City, Country"
                  className="w-full bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">LinkedIn Profile</label>
                <input 
                  value={data.personalInfo.linkedin}
                  onChange={e => setData({...data, personalInfo: {...data.personalInfo, linkedin: e.target.value}})}
                  placeholder="linkedin.com/in/username"
                  className="w-full bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Professional Summary</label>
                  <div className="flex bg-[#2D1B14] rounded-xl p-1 border border-white/5">
                    <button 
                      onClick={() => setSummaryMode('manual')}
                      className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all", summaryMode === 'manual' ? "bg-brand-orange text-white" : "text-white/40")}
                    >
                      Manual
                    </button>
                    <button 
                      onClick={() => setSummaryMode('ai')}
                      className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2", summaryMode === 'ai' ? "bg-brand-orange text-white" : "text-white/40")}
                    >
                      <Sparkles size={12} />
                      AI Assisted
                    </button>
                  </div>
                </div>

                {summaryMode === 'manual' ? (
                  <textarea 
                    value={data.personalInfo.summary}
                    onChange={e => setData({...data, personalInfo: {...data.personalInfo, summary: e.target.value}})}
                    placeholder="Briefly describe your background and goals..."
                    className="w-full bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white h-32 focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                  />
                ) : (
                  <div className="space-y-4 p-6 bg-[#2D1B14] rounded-3xl border border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[8px] font-bold text-white/40 uppercase tracking-widest ml-2">Profession</label>
                        <input 
                          value={aiSummaryData.profession}
                          onChange={e => setAiSummaryData({...aiSummaryData, profession: e.target.value})}
                          placeholder="e.g. Software Engineer"
                          className="w-full bg-[#4A2C21] border border-white/10 rounded-xl py-3 px-4 text-white text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-bold text-white/40 uppercase tracking-widest ml-2">Years of Experience</label>
                        <input 
                          value={aiSummaryData.years}
                          onChange={e => setAiSummaryData({...aiSummaryData, years: e.target.value})}
                          placeholder="e.g. 5 years"
                          className="w-full bg-[#4A2C21] border border-white/10 rounded-xl py-3 px-4 text-white text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-bold text-white/40 uppercase tracking-widest ml-2">Career Goals</label>
                      <textarea 
                        value={aiSummaryData.goals}
                        onChange={e => setAiSummaryData({...aiSummaryData, goals: e.target.value})}
                        placeholder="e.g. Seeking a leadership role in fintech..."
                        className="w-full bg-[#4A2C21] border border-white/10 rounded-xl py-3 px-4 text-white text-sm h-20"
                      />
                    </div>
                    <button 
                      onClick={handleRefineSummary}
                      disabled={refining || !aiSummaryData.profession}
                      className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {refining ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                      Refine with AI
                    </button>
                    {data.personalInfo.summary && (
                      <div className="mt-4 p-4 bg-brand-orange/10 border border-brand-orange/20 rounded-xl">
                        <p className="text-[10px] font-bold text-brand-orange uppercase mb-2">Generated Summary:</p>
                        <p className="text-white/80 text-sm italic">"{data.personalInfo.summary}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setStep(2)} className="w-full bg-brand-orange text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-orange-light transition-all">Next: Education</button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-[#4A2C21] p-8 rounded-[40px] border border-white/5 space-y-6"
          >
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
              <GraduationCap className="text-brand-orange" />
              Academic History
            </h3>
            <div className="space-y-8">
              {data.education.map((edu, idx) => (
                <div key={idx} className="p-6 bg-[#2D1B14] rounded-3xl border border-white/5 relative group">
                  {data.education.length > 1 && (
                    <button 
                      onClick={() => removeEducation(idx)}
                      className="absolute top-4 right-4 p-2 text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">School/University</label>
                      <input 
                        value={edu.school}
                        onChange={e => {
                          const newEdu = [...data.education];
                          newEdu[idx].school = e.target.value;
                          setData({...data, education: newEdu});
                        }}
                        className="w-full bg-[#4A2C21] border border-white/10 rounded-2xl py-4 px-6 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Degree/Qualification</label>
                      <input 
                        value={edu.degree}
                        onChange={e => {
                          const newEdu = [...data.education];
                          newEdu[idx].degree = e.target.value;
                          setData({...data, education: newEdu});
                        }}
                        className="w-full bg-[#4A2C21] border border-white/10 rounded-2xl py-4 px-6 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Location</label>
                      <input 
                        value={edu.location}
                        onChange={e => {
                          const newEdu = [...data.education];
                          newEdu[idx].location = e.target.value;
                          setData({...data, education: newEdu});
                        }}
                        placeholder="e.g. Sacramento, CA"
                        className="w-full bg-[#4A2C21] border border-white/10 rounded-2xl py-4 px-6 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Start Date</label>
                      <input 
                        value={edu.startDate}
                        onChange={e => {
                          const newEdu = [...data.education];
                          newEdu[idx].startDate = e.target.value;
                          setData({...data, education: newEdu});
                        }}
                        placeholder="MM/YYYY"
                        className="w-full bg-[#4A2C21] border border-white/10 rounded-2xl py-4 px-6 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">End Date</label>
                      <input 
                        value={edu.endDate}
                        onChange={e => {
                          const newEdu = [...data.education];
                          newEdu[idx].endDate = e.target.value;
                          setData({...data, education: newEdu});
                        }}
                        placeholder="MM/YYYY or Present"
                        className="w-full bg-[#4A2C21] border border-white/10 rounded-2xl py-4 px-6 text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={addEducation}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-white/40 hover:text-brand-orange hover:border-brand-orange transition-all flex items-center justify-center gap-2 font-bold"
              >
                <Plus size={20} />
                Add Education
              </button>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest">Back</button>
              <button onClick={() => setStep(3)} className="flex-[2] bg-brand-orange text-white py-4 rounded-2xl font-black uppercase tracking-widest">Next: Experience</button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-[#4A2C21] p-8 rounded-[40px] border border-white/5 space-y-6"
          >
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
              <Briefcase className="text-brand-orange" />
              Work Experience
            </h3>
            <div className="space-y-8">
              {data.experience.map((exp, idx) => (
                <div key={idx} className="p-6 bg-[#2D1B14] rounded-3xl border border-white/5 relative group">
                  {data.experience.length > 1 && (
                    <button 
                      onClick={() => removeExperience(idx)}
                      className="absolute top-4 right-4 p-2 text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Company/Organization</label>
                      <input 
                        value={exp.company}
                        onChange={e => {
                          const newExp = [...data.experience];
                          newExp[idx].company = e.target.value;
                          setData({...data, experience: newExp});
                        }}
                        className="w-full bg-[#4A2C21] border border-white/10 rounded-2xl py-4 px-6 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Job Title/Role</label>
                      <input 
                        value={exp.role}
                        onChange={e => {
                          const newExp = [...data.experience];
                          newExp[idx].role = e.target.value;
                          setData({...data, experience: newExp});
                        }}
                        className="w-full bg-[#4A2C21] border border-white/10 rounded-2xl py-4 px-6 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Location</label>
                      <input 
                        value={exp.location}
                        onChange={e => {
                          const newExp = [...data.experience];
                          newExp[idx].location = e.target.value;
                          setData({...data, experience: newExp});
                        }}
                        placeholder="e.g. Sacramento, CA"
                        className="w-full bg-[#4A2C21] border border-white/10 rounded-2xl py-4 px-6 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Start Date</label>
                      <input 
                        value={exp.startDate}
                        onChange={e => {
                          const newExp = [...data.experience];
                          newExp[idx].startDate = e.target.value;
                          setData({...data, experience: newExp});
                        }}
                        placeholder="MM/YYYY"
                        className="w-full bg-[#4A2C21] border border-white/10 rounded-2xl py-4 px-6 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">End Date</label>
                      <input 
                        value={exp.endDate}
                        onChange={e => {
                          const newExp = [...data.experience];
                          newExp[idx].endDate = e.target.value;
                          setData({...data, experience: newExp});
                        }}
                        placeholder="MM/YYYY or Present"
                        className="w-full bg-[#4A2C21] border border-white/10 rounded-2xl py-4 px-6 text-white"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Responsibilities</label>
                      <textarea 
                        value={exp.responsibilities}
                        onChange={e => {
                          const newExp = [...data.experience];
                          newExp[idx].responsibilities = e.target.value;
                          setData({...data, experience: newExp});
                        }}
                        className="w-full bg-[#4A2C21] border border-white/10 rounded-2xl py-4 px-6 text-white h-24"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={addExperience}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-white/40 hover:text-brand-orange hover:border-brand-orange transition-all flex items-center justify-center gap-2 font-bold"
              >
                <Plus size={20} />
                Add Experience
              </button>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest">Back</button>
              <button onClick={() => setStep(4)} className="flex-[2] bg-brand-orange text-white py-4 rounded-2xl font-black uppercase tracking-widest">Next: Skills & Standard</button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-[#4A2C21] p-8 rounded-[40px] border border-white/5 space-y-8"
          >
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <Sparkles className="text-brand-orange" />
                Skills & Expertise
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.skills.map((skill, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      value={skill}
                      onChange={e => {
                        const newSkills = [...data.skills];
                        newSkills[idx] = e.target.value;
                        setData({...data, skills: newSkills});
                      }}
                      placeholder="e.g. Project Management"
                      className="flex-1 bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white"
                    />
                    {data.skills.length > 1 && (
                      <button onClick={() => removeSkill(idx)} className="p-4 text-white/20 hover:text-red-400">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button 
                onClick={addSkill}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-white/40 hover:text-brand-orange flex items-center justify-center gap-2 font-bold"
              >
                <Plus size={20} />
                Add Skill
              </button>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <ShieldCheck className="text-brand-orange" />
                Certifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.certifications.map((cert, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      value={cert}
                      onChange={e => {
                        const newCerts = [...data.certifications];
                        newCerts[idx] = e.target.value;
                        setData({...data, certifications: newCerts});
                      }}
                      placeholder="e.g. Google Analytics Certified"
                      className="flex-1 bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white"
                    />
                    {data.certifications.length > 1 && (
                      <button onClick={() => {
                        const newCerts = data.certifications.filter((_, i) => i !== idx);
                        setData({ ...data, certifications: newCerts });
                      }} className="p-4 text-white/20 hover:text-red-400">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setData({ ...data, certifications: [...data.certifications, ''] })}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-white/40 hover:text-brand-orange flex items-center justify-center gap-2 font-bold"
              >
                <Plus size={20} />
                Add Certification
              </button>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <Globe className="text-brand-orange" />
                Languages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.languages.map((lang, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      value={lang.name}
                      onChange={e => {
                        const newLangs = [...data.languages];
                        newLangs[idx].name = e.target.value;
                        setData({...data, languages: newLangs});
                      }}
                      placeholder="Language (e.g. English)"
                      className="flex-1 bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white"
                    />
                    <input 
                      value={lang.level}
                      onChange={e => {
                        const newLangs = [...data.languages];
                        newLangs[idx].level = e.target.value;
                        setData({...data, languages: newLangs});
                      }}
                      placeholder="Level (e.g. Native)"
                      className="w-40 bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white"
                    />
                    <select
                      value={lang.proficiency}
                      onChange={e => {
                        const newLangs = [...data.languages];
                        newLangs[idx].proficiency = parseInt(e.target.value);
                        setData({...data, languages: newLangs});
                      }}
                      className="w-24 bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-4 text-white appearance-none"
                    >
                      {[1, 2, 3, 4, 5].map(v => (
                        <option key={v} value={v}>{v}/5</option>
                      ))}
                    </select>
                    <button onClick={() => removeLanguage(idx)} className="p-4 text-white/20 hover:text-red-400">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={addLanguage}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-white/40 hover:text-brand-orange flex items-center justify-center gap-2 font-bold"
              >
                <Plus size={20} />
                Add Language
              </button>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <Trophy className="text-brand-orange" />
                Achievements
              </h3>
              <div className="space-y-4">
                {data.achievements.map((ach: any, idx: number) => (
                  <div key={idx} className="p-6 bg-[#2D1B14] rounded-3xl border border-white/5 relative group">
                    <button 
                      onClick={() => {
                        const newAch = data.achievements.filter((_: any, i: number) => i !== idx);
                        setData({ ...data, achievements: newAch });
                      }}
                      className="absolute top-4 right-4 p-2 text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="grid grid-cols-1 gap-4">
                      <input 
                        value={ach.title}
                        onChange={e => {
                          const newAch = [...data.achievements];
                          newAch[idx].title = e.target.value;
                          setData({...data, achievements: newAch});
                        }}
                        placeholder="Achievement Title"
                        className="w-full bg-[#4A2C21] border border-white/10 rounded-2xl py-4 px-6 text-white"
                      />
                      <textarea 
                        value={ach.description}
                        onChange={e => {
                          const newAch = [...data.achievements];
                          newAch[idx].description = e.target.value;
                          setData({...data, achievements: newAch});
                        }}
                        placeholder="Description"
                        className="w-full bg-[#4A2C21] border border-white/10 rounded-2xl py-4 px-6 text-white h-20"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setData({ ...data, achievements: [...data.achievements, { title: '', description: '' }] })}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-white/40 hover:text-brand-orange flex items-center justify-center gap-2 font-bold"
              >
                <Plus size={20} />
                Add Achievement
              </button>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <Heart className="text-brand-orange" />
                Passions
              </h3>
              <div className="space-y-4">
                {data.passions.map((pas: any, idx: number) => (
                  <div key={idx} className="p-6 bg-[#2D1B14] rounded-3xl border border-white/5 relative group">
                    <button 
                      onClick={() => {
                        const newPas = data.passions.filter((_: any, i: number) => i !== idx);
                        setData({ ...data, passions: newPas });
                      }}
                      className="absolute top-4 right-4 p-2 text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="grid grid-cols-1 gap-4">
                      <input 
                        value={pas.title}
                        onChange={e => {
                          const newPas = [...data.passions];
                          newPas[idx].title = e.target.value;
                          setData({...data, passions: newPas});
                        }}
                        placeholder="Passion Title"
                        className="w-full bg-[#4A2C21] border border-white/10 rounded-2xl py-4 px-6 text-white"
                      />
                      <textarea 
                        value={pas.description}
                        onChange={e => {
                          const newPas = [...data.passions];
                          newPas[idx].description = e.target.value;
                          setData({...data, passions: newPas});
                        }}
                        placeholder="Description"
                        className="w-full bg-[#4A2C21] border border-white/10 rounded-2xl py-4 px-6 text-white h-20"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setData({ ...data, passions: [...data.passions, { title: '', description: '' }] })}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-white/40 hover:text-brand-orange flex items-center justify-center gap-2 font-bold"
              >
                <Plus size={20} />
                Add Passion
              </button>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <Heart className="text-brand-orange" />
                Interests
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.interests.map((interest, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      value={interest}
                      onChange={e => {
                        const newInterests = [...data.interests];
                        newInterests[idx] = e.target.value;
                        setData({...data, interests: newInterests});
                      }}
                      placeholder="e.g. Photography"
                      className="flex-1 bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white"
                    />
                    {data.interests.length > 1 && (
                      <button onClick={() => {
                        const newInterests = data.interests.filter((_, i) => i !== idx);
                        setData({ ...data, interests: newInterests });
                      }} className="p-4 text-white/20 hover:text-red-400">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setData({ ...data, interests: [...data.interests, ''] })}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-white/40 hover:text-brand-orange flex items-center justify-center gap-2 font-bold"
              >
                <Plus size={20} />
                Add Interest
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <Users className="text-brand-orange" />
                References
              </h3>
              <textarea 
                value={data.references}
                onChange={e => setData({...data, references: e.target.value})}
                placeholder="e.g. Available upon request"
                className="w-full bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white h-24 focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <Globe className="text-brand-orange" />
                Resume Standard
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['Euro Standard', 'USA Standard', 'Canada Standard', 'Australia Standard', 'UK Standard'].map((std) => (
                  <button
                    key={std}
                    onClick={() => setData({...data, standard: std as any})}
                    className={cn(
                      "py-4 px-6 rounded-2xl font-bold text-sm transition-all border",
                      data.standard === std 
                        ? "bg-brand-orange border-brand-orange text-white" 
                        : "bg-[#2D1B14] border-white/10 text-white/60 hover:border-white/30"
                    )}
                  >
                    {std}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(3)} className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest">Back</button>
              <button 
                onClick={handleGenerate} 
                disabled={loading}
                className="flex-[2] bg-brand-orange text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                Generate Resume
              </button>
            </div>
          </motion.div>
        )}

        {step === 5 && (loading || resume) && (
          <motion.div 
            key="step5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white">
                {loading ? "AI is Crafting Your Resume..." : "Resume Preview"}
              </h3>
              <div className="flex gap-4">
                {!loading && (
                  <>
                    <button onClick={() => setStep(4)} className="bg-white/10 text-white px-6 py-3 rounded-2xl font-bold">Edit</button>
                    <button 
                      onClick={downloadPDF}
                      disabled={downloading}
                      className="bg-brand-orange text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                      {downloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                      {downloading ? "Preparing PDF..." : "Download PDF"}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div 
              ref={resumeRef}
              className={cn(
                "bg-white rounded-lg text-black min-h-[1000px]",
                (data.standard === 'Euro Standard' || data.standard === 'UK Standard' || data.standard === 'USA Standard' || data.standard === 'Canada Standard' || data.standard === 'Australia Standard') ? "p-0" : "p-12 font-serif"
              )}
            >
              {data.standard === 'Euro Standard' && !loading ? (
                <EuropassLayout data={data} />
              ) : data.standard === 'UK Standard' && !loading ? (
                <UKStandardLayout data={data} />
              ) : data.standard === 'USA Standard' && !loading ? (
                <USAStandardLayout data={data} />
              ) : data.standard === 'Canada Standard' && !loading ? (
                <CanadaStandardLayout data={data} />
              ) : data.standard === 'Australia Standard' && !loading ? (
                <AustraliaStandardLayout data={data} />
              ) : (
                <div className="prose prose-slate max-w-none">
                  {data.standard === 'Euro Standard' && data.personalInfo.photo && !loading && (
                    <img src={data.personalInfo.photo} alt="Profile" className="w-32 h-32 rounded-lg object-cover mb-8" />
                  )}
                  <Markdown>{resume || "Preparing your professional document..."}</Markdown>
                </div>
              )}
            </div>

            {!loading && resume && (
              <div className="flex justify-center pt-4">
                <button 
                  onClick={downloadPDF}
                  disabled={downloading}
                  className="bg-brand-orange text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {downloading ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} />}
                  {downloading ? "Generating PDF..." : "Download Your Resume"}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <DefinitionsSection 
        title="Resume Terminology"
        terms={[
          { term: "CV/Resume", definition: "A document that summarizes your education, work experience, and skills. CVs are typically longer and used for academic roles, while resumes are concise for general job applications." },
          { term: "ATS Friendly", definition: "Applicant Tracking System. Resumes designed to be easily read by automated software used by recruiters to filter candidates based on keywords." },
          { term: "Soft Skills", definition: "Personal attributes that enable someone to interact effectively and harmoniously with other people, such as communication, teamwork, and leadership." },
          { term: "Action Verbs", definition: "Strong words used to describe your achievements (e.g., 'Managed', 'Developed', 'Increased') to make your resume more impactful." },
          { term: "Transferable Skills", definition: "Skills developed in one situation which can be transferred to another, such as problem-solving or time management." },
          { term: "Quantifiable Achievements", definition: "Accomplishments that can be measured using numbers, percentages, or timeframes (e.g., 'Increased sales by 20%')." },
          { term: "Chronological Resume", definition: "A resume format that lists work experience in reverse chronological order, starting with the most recent position." }
        ]}
      />
    </div>
  );
};

const VisaView = () => {
  const [data, setData] = useState({
    nationality: '',
    destination: '',
    program: ''
  });
  const [results, setResults] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.nationality || !data.destination || !data.program) return;
    setLoading(true);
    setResults("Generating your personalized visa guide...");
    try {
      const stream = getVisaGuideStream(data);
      let fullText = "";
      let firstChunk = true;
      for await (const chunk of stream) {
        if (firstChunk) {
          fullText = "";
          firstChunk = false;
        }
        fullText += chunk;
        setResults(fullText);
      }
      if (!fullText) {
        setResults("No visa guide found for this combination. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setResults(`Error: ${err.message || "We couldn't generate the visa guide right now. Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setData({
      nationality: '',
      destination: '',
      program: ''
    });
    setResults(null);
  };

  return (
    <div className="max-w-4xl mx-auto pt-6 pb-12 px-4">
      <h2 className="text-4xl font-bold text-white mb-2">Personalized Visa Guide</h2>
      <p className="text-white/60 mb-8">Get your personalized step-by-step visa checklist and cost analysis</p>
      
      <div className="bg-[#4A2C21] p-8 rounded-[40px] border border-white/5 shadow-2xl mb-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">My Nationality</label>
            <input 
              type="text" 
              value={data.nationality}
              onChange={(e) => setData({...data, nationality: e.target.value})}
              placeholder="e.g. Nigeria"
              className="w-full bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/20"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Destination Country</label>
            <input 
              type="text" 
              value={data.destination}
              onChange={(e) => setData({...data, destination: e.target.value})}
              placeholder="e.g. United Kingdom"
              className="w-full bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/20"
              required
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-2">Study Program</label>
            <select 
              value={data.program}
              onChange={(e) => setData({...data, program: e.target.value})}
              className="w-full bg-[#2D1B14] border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all appearance-none"
              required
            >
              <option value="">Select Program</option>
              <option value="Bachelors">Bachelors</option>
              <option value="BSc. Top Up">BSc. Top Up</option>
              <option value="Masters">Masters (MSc/MA)</option>
              <option value="MRes">MRes</option>
              <option value="MBA">MBA</option>
              <option value="PhD">PhD</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange hover:bg-brand-orange-light text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center disabled:opacity-50 transition-all shadow-lg shadow-brand-orange/20 uppercase tracking-widest"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2 w-4 h-4" />}
              Get Visa Guide
            </button>
          </div>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {(loading || results) && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#2D1B14] p-10 rounded-[40px] border border-white/5 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-brand-orange/20 rounded-2xl flex items-center justify-center">
                {loading && !results?.startsWith("Generating") ? (
                  <Loader2 className="text-brand-orange w-6 h-6 animate-spin" />
                ) : (
                  <ShieldCheck className="text-brand-orange w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-2xl font-black text-white leading-none">
                  {loading ? "Generating Guide..." : "Your Visa Checklist"}
                </h3>
                <p className="text-white/40 text-sm mt-1">
                  {loading ? "Fetching latest 2026/2027 visa requirements" : "Personalized step-by-step guidance"}
                </p>
              </div>
              {!loading && (
                <button 
                  onClick={handleClear}
                  className="ml-auto flex items-center gap-2 text-white/40 hover:text-brand-orange transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
            <div className="prose prose-invert max-w-none prose-headings:text-brand-orange prose-strong:text-white prose-p:text-white/80">
              <Markdown>{results || "Preparing guide..."}</Markdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DefinitionsSection 
        title="Visa Terminology"
        terms={[
          { term: "CAS/COE", definition: "Confirmation of Acceptance for Studies (UK) or Confirmation of Enrolment (Australia). Official documents from universities required to apply for a student visa." },
          { term: "Biometrics", definition: "The collection of fingerprints and a digital photograph at a visa application center as part of the identity verification process." },
          { term: "IHS Surcharge", definition: "Immigration Health Surcharge. A mandatory fee paid by visa applicants to access the National Health Service (NHS) during their stay in the UK." },
          { term: "Visa Interview", definition: "A meeting with a consular officer to verify the information in your application and assess your genuine intent to study." },
          { term: "VFS Global", definition: "An outsourcing and technology services specialist for governments and diplomatic missions worldwide, handling visa application processing." },
          { term: "Priority Service", definition: "An optional service offered by some visa application centers to process applications faster for an additional fee." },
          { term: "Refusal Letter", definition: "An official document issued by immigration authorities explaining the specific reasons why a visa application was denied." }
        ]}
      />
    </div>
  );
};

const BlogView = ({ 
  posts, 
  onReadMore,
  isAdmin = false,
  onDeleteNews
}: { 
  posts: any[], 
  onReadMore: (post: any) => void,
  isAdmin?: boolean,
  onDeleteNews?: (id: string) => Promise<void>
}) => {
  return (
    <div className="max-w-4xl mx-auto pt-6 pb-12 px-4">
      <h2 className="text-4xl font-bold text-white mb-8 font-black tracking-tight flex items-center gap-3">
        <BookOpen className="text-brand-orange w-10 h-10" />
        Latest News &amp; Updates
      </h2>
      <div className="grid gap-8">
        {posts.map((post, i) => (
          <motion.div 
            whileHover={{ scale: 1.01 }}
            key={post.id || i} 
            className="bg-[#4A2C21] p-8 rounded-3xl border border-white/5 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden group"
          >
            <div className="w-full md:w-48 h-48 bg-[#2D1B14] rounded-2xl overflow-hidden shrink-0">
              <img 
                src={post.imageUrl || `https://picsum.photos/seed/${post.id || i}/400/400`} 
                alt="News" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <div className="flex-1 w-full">
              <div className="text-[#F27D26] text-sm font-black mb-2 uppercase tracking-widest">{post.date}</div>
              <h3 className="text-2xl font-black text-white mb-4 leading-tight">{post.title}</h3>
              <p className="text-white/70 mb-6 line-clamp-2 text-sm leading-relaxed">{post.excerpt}</p>
              {post.links && post.links.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-6">
                  {post.links.map((link: any, li: number) => (
                    <a 
                      key={li} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold bg-brand-orange/10 text-brand-orange px-3 py-1.5 rounded-lg border border-brand-orange/20 hover:bg-brand-orange hover:text-white transition-all uppercase tracking-wider"
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between w-full mt-6">
                <button 
                  onClick={() => onReadMore(post)}
                  className="text-white font-extrabold flex items-center hover:text-[#F27D26] transition-colors text-sm uppercase tracking-wider"
                >
                  Read Article <ArrowRight className="ml-2 w-4 h-4" />
                </button>

                {isAdmin && post.id && onDeleteNews && (
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm("Are you sure you want to delete this news post?")) {
                        await onDeleteNews(post.id);
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-bold bg-red-500/10 hover:bg-red-500/20 px-3.5 py-2.5 rounded-2xl border border-red-500/20 transition-all select-none"
                    title="Delete News Post"
                  >
                    <Trash2 size={14} />
                    Delete Post
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <DefinitionsSection 
        title="Blog & Policy Terms"
        terms={[
          { term: "Immigration Policy", definition: "The set of rules and regulations established by a government to control the entry and stay of foreign nationals in their country." },
          { term: "Tier 1 Countries", definition: "A term often used to describe the most popular and established study abroad destinations, including the UK, USA, Canada, and Australia." },
          { term: "Visa Cap", definition: "A government-imposed limit on the maximum number of visas that can be issued to international students or workers within a specific timeframe." },
          { term: "Graduate Route", definition: "A post-study work visa that allows international students to stay and work in their host country for a period after graduation." },
          { term: "Skilled Worker Visa", definition: "A type of visa that allows foreign nationals to work in a country in a specific occupation that requires a certain level of skill and salary." },
          { term: "Permanent Residency (PR)", definition: "A status that allows a foreign national to live and work in a country indefinitely without being a citizen of that country." },
          { term: "Post-Graduation Work Permit (PGWP)", definition: "A permit that allows international students who have graduated from a participating Canadian post-secondary institution to work in Canada." }
        ]}
      />
    </div>
  );
};

const BlogPostView = ({ 
  post, 
  onBack,
  isAdmin = false,
  onDeleteNews
}: { 
  post: any, 
  onBack: () => void,
  isAdmin?: boolean,
  onDeleteNews?: (id: string) => Promise<void>
}) => {
  if (!post) return null;

  return (
    <div className="max-w-4xl mx-auto pt-6 pb-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="flex items-center text-white/60 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs"
        >
          <ArrowRight className="mr-2 w-4 h-4 rotate-180" /> Back to Blog
        </button>

        {isAdmin && post && post.id && onDeleteNews && (
          <button 
            onClick={async () => {
              if (window.confirm("Are you sure you want to delete this news post?")) {
                await onDeleteNews(post.id);
                onBack();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-bold bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 rounded-2xl border border-red-500/20 transition-all select-none"
          >
            <Trash2 size={14} />
            Delete Post
          </button>
        )}
      </div>

      <div className="bg-[#4A2C21] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
        <div className="h-64 md:h-96 relative">
          <img 
            src={post.imageUrl || `https://picsum.photos/seed/${post.id}/1200/600`} 
            alt={post.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#4A2C21] to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <div className="text-brand-orange font-bold text-sm mb-2 uppercase tracking-widest">{post.date}</div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">{post.title}</h1>
          </div>
        </div>

        <div className="p-8 md:p-12">
          <div className="prose prose-invert prose-orange max-w-none">
            <Markdown>{post.content}</Markdown>
          </div>

          {post.links && (
            <div className="mt-12 pt-12 border-t border-white/5">
              <h3 className="text-xl font-bold text-white mb-6">Official Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {post.links.map((link: any, i: number) => (
                  <a 
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-[#2D1B14] rounded-2xl border border-white/5 hover:border-brand-orange/50 transition-all group"
                  >
                    <span className="text-white font-bold">{link.name}</span>
                    <Globe className="w-5 h-5 text-brand-orange group-hover:scale-110 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LatestNewsSection = ({ 
  posts, 
  onReadMore,
  onNavigateToBlog
}: { 
  posts: any[], 
  onReadMore: (post: any) => void,
  onNavigateToBlog: () => void
}) => {
  // Take the 3 latest news updates
  const latestPosts = posts.slice(0, 3);
  if (latestPosts.length === 0) return null;

  return (
    <section className="border-t border-white/5 bg-[#2D1B14]/40 py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#F27D26] text-xs font-black uppercase tracking-widest mb-2">
              <span className="w-2 h-2 rounded-full bg-[#F27D26] animate-pulse"></span>
              Live Migration &amp; Study Feeds
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Latest News &amp; Updates
            </h2>
          </div>
          <button 
            type="button"
            onClick={onNavigateToBlog}
            className="group flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-white hover:text-[#F27D26] transition-colors border-2 border-white/10 hover:border-[#F27D26]/30 px-5 py-3 rounded-full bg-white/5 shrink-0"
          >
            View All News <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {latestPosts.map((post, i) => (
            <motion.div
              key={post.id || i}
              whileHover={{ y: -6 }}
              onClick={() => onReadMore(post)}
              className="bg-[#4A2C21]/60 rounded-[1.5rem] border border-white/5 overflow-hidden flex flex-col cursor-pointer group hover:border-[#F27D26]/20 hover:shadow-2xl hover:shadow-[#F27D26]/5 transition-all duration-300"
            >
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={post.imageUrl || `https://picsum.photos/seed/${post.id || i}/600/400`} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2D1B14] to-transparent opacity-60"></div>
                <div className="absolute bottom-4 left-4 text-[#F27D26] text-[10px] font-black uppercase tracking-widest bg-[#2D1B14]/80 px-2.5 py-1 rounded-md border border-white/5">
                  {post.date}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black text-white line-clamp-2 leading-snug group-hover:text-[#F27D26] transition-colors mb-3">
                    {post.title}
                  </h3>
                  <p className="text-white/60 text-xs leading-relaxed line-clamp-3 mb-4">
                    {post.excerpt}
                  </p>
                </div>
                <div className="flex items-center text-[#F27D26] text-xs font-black uppercase tracking-wider group-hover:underline mt-auto">
                  Read More <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const AdminView = ({ 
  onPublishNews, 
  onSendBroadcast, 
  dynamicNews, 
  onDeleteNews 
}: { 
  onPublishNews: (news: any, notify: boolean) => Promise<void>;
  onSendBroadcast: (title: string, msg: string, linkView: string) => Promise<void>;
  dynamicNews: any[];
  onDeleteNews: (id: string) => Promise<void>;
}) => {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [notify, setNotify] = useState(true);
  const [links, setLinks] = useState<{ name: string; url: string }[]>([]);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifLink, setNotifLink] = useState('news');

  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingBroadcast, setLoadingBroadcast] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 20MB.');
      return;
    }

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    setImageFile(file);
    const preview = URL.createObjectURL(file);
    setLocalPreviewUrl(preview);
    setImageUrl('');
    setSuccessMsg('Image selected! It will be uploaded when you publish.');
    setErrorMsg('');
  };

  const uploadImageTask = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      setUploadingImage(true);
      setUploadProgress(10);

      void (async () => {
        try {
          const uploaded = await uploadImageFile(file);
          const downloadUrl = String(getFileViewUrl(uploaded.$id));
          setImageUrl(downloadUrl);
          setUploadProgress(100);
          resolve(downloadUrl);
        } catch (err) {
          reject(new Error('Failed to upload image to Appwrite Storage. Please verify storage permissions.'));
        } finally {
          setUploadingImage(false);
        }
      })();
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleAddLink = () => {
    if (!newLinkName || !newLinkUrl) return;
    setLinks([...links, { name: newLinkName, url: newLinkUrl }]);
    setNewLinkName('');
    setNewLinkUrl('');
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !excerpt || !content) {
      setErrorMsg('Please complete the Title, Excerpt, and Content fields.');
      return;
    }
    setLoadingNews(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      let finalImageUrl = imageUrl;
      if (imageFile && !imageUrl) {
        try {
          finalImageUrl = await uploadImageTask(imageFile);
        } catch (uploadErr: any) {
          setErrorMsg(uploadErr.message || 'Error occurred during image upload.');
          setLoadingNews(false);
          return;
        }
      }

      await onPublishNews({ title, excerpt, content, links, imageUrl: finalImageUrl || null }, notify);
      setSuccessMsg('Successfully published news article and updated global lists!');
      setTitle('');
      setExcerpt('');
      setContent('');
      setLinks([]);
      setImageUrl('');
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      setLocalPreviewUrl('');
      setImageFile(null);
      setUploadProgress(0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving news.');
    } finally {
      setLoadingNews(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMsg) {
      setErrorMsg('Please specify both a broadcast title and a broadcast notification message.');
      return;
    }
    setLoadingBroadcast(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await onSendBroadcast(notifTitle, notifMsg, notifLink);
      setSuccessMsg(`Successfully broadcasted system notification alert: "${notifTitle}"`);
      setNotifTitle('');
      setNotifMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while sending notification.');
    } finally {
      setLoadingBroadcast(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pt-6 pb-12 px-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-red-600/20 rounded-2xl flex items-center justify-center border border-red-500/30">
          <Shield className="text-red-500 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-4xl font-black text-white leading-none">Admin Dashboard</h2>
          <p className="text-white/40 text-xs mt-1 uppercase tracking-widest font-black">Digivasity News &amp; Broadcast Management</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 p-4 rounded-2xl mb-6 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-100 p-4 rounded-2xl mb-6 text-sm flex items-center gap-2">
          <X size={16} className="text-red-500 shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form: Publish News */}
        <div className="lg:col-span-7 bg-[#4E2F23] p-8 rounded-3xl border border-white/5 shadow-xl">
          <h3 className="text-xl font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <Plus className="text-brand-orange" size={18} />
            Publish News Article
          </h3>
          <form onSubmit={handlePublish} className="space-y-5">
            <div>
              <label className="block text-white/50 text-[10px] font-black uppercase tracking-wider mb-2">Article Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Canada Updates Post-Graduation Work Permit (PGWP) Rules for 2026"
                className="w-full bg-[#341F17] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-brand-orange placeholder-white/20 font-semibold"
              />
            </div>

            <div>
              <label className="block text-white/50 text-[10px] font-black uppercase tracking-wider mb-2">Cover Image (Drag & Drop or Upload)</label>
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isDragging 
                    ? 'border-[#F27D26] bg-[#F27D26]/10' 
                    : (localPreviewUrl || imageUrl) 
                      ? 'border-emerald-500/50 bg-emerald-500/5' 
                      : 'border-white/10 bg-[#341F17] hover:border-[#F27D26]/50'
                }`}
                onClick={() => document.getElementById('image-upload-input')?.click()}
              >
                <input 
                  type="file"
                  id="image-upload-input"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {uploadingImage ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="animate-spin text-brand-orange w-8 h-8" />
                    <span className="text-white text-xs font-bold">Uploading to Appwrite Storage... {uploadProgress}%</span>
                    <div className="w-48 bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#F27D26] h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : (localPreviewUrl || imageUrl) ? (
                  <div className="flex flex-col items-center space-y-3 w-full">
                    <div className="relative w-full max-h-36 rounded-xl overflow-hidden border border-white/10">
                      <img src={localPreviewUrl || imageUrl} alt="Uploaded preview" className="w-full h-full object-cover" />
                    </div>
                    {localPreviewUrl && !imageUrl ? (
                      <span className="text-[#F27D26] text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 size={14} className="text-[#F27D26]" /> Image Selected (Will upload on Publish, Max 20MB)
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 size={14} /> Custom Image Uploaded Successfully!
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (localPreviewUrl) {
                          URL.revokeObjectURL(localPreviewUrl);
                        }
                        setImageUrl('');
                        setImageFile(null);
                        setLocalPreviewUrl('');
                        setUploadProgress(0);
                      }}
                      className="text-[10px] font-bold bg-red-500/20 text-red-300 px-3 py-1 rounded-lg border border-red-500/30 hover:bg-red-500 hover:text-white transition-all uppercase tracking-wider"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2 text-center">
                    <Image className="text-white/30 w-10 h-10 mb-1" />
                    <span className="text-white text-xs font-bold">Drag and drop your cover image here, or <span className="text-[#F27D26] underline">browse files</span></span>
                    <span className="text-white/40 text-[10px] uppercase font-black tracking-wider">Supports JPG, PNG, WEBP (Max 20MB)</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-white/50 text-[10px] font-black uppercase tracking-wider mb-2">Short Excerpt / Description</label>
              <textarea 
                rows={2}
                value={excerpt} 
                onChange={e => setExcerpt(e.target.value)}
                placeholder="Give a brief 1-2 sentence overview of this news update..."
                className="w-full bg-[#341F17] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-brand-orange placeholder-white/20 font-semibold resize-none"
              />
            </div>

            <div>
              <label className="block text-white/50 text-[10px] font-black uppercase tracking-wider mb-2">Article content (supports markdown)</label>
              <textarea 
                rows={8}
                value={content} 
                onChange={e => setContent(e.target.value)}
                placeholder="### Summary of the Announcement&#10;&#10;Use markdown syntax like **bold**, lists, and headers to structure the news article body beautiful!"
                className="w-full bg-[#341F17] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-brand-orange placeholder-white/20 font-mono resize-y"
              />
            </div>

            <div className="border-t border-white/5 pt-4">
              <label className="block text-white/50 text-[10px] font-black uppercase tracking-wider mb-2">Official Resource Links (Optional)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input 
                  type="text" 
                  value={newLinkName} 
                  onChange={e => setNewLinkName(e.target.value)}
                  placeholder="Link Name (e.g. Official IRCC Portal)"
                  className="bg-[#341F17] border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-brand-orange placeholder-white/20"
                />
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newLinkUrl} 
                    onChange={e => setNewLinkUrl(e.target.value)}
                    placeholder="URL (e.g. https://canada.ca/...)"
                    className="flex-1 bg-[#341F17] border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-[#F27D26] placeholder-white/20"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddLink}
                    className="bg-brand-orange hover:bg-brand-orange/90 text-white p-3 rounded-xl flex items-center justify-center font-bold"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {links.length > 0 && (
                <div className="space-y-1 bg-[#341F17] p-3 rounded-2xl border border-white/5">
                  {links.map((lnk, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-2 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-white font-bold">{lnk.name} &rarr; <span className="text-white/40 font-normal select-all">{lnk.url}</span></span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveLink(idx)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 bg-[#341F17]/50 p-4 border border-white/5 rounded-2xl">
              <input 
                type="checkbox" 
                id="notifyCheckbox"
                checked={notify} 
                onChange={e => setNotify(e.target.checked)}
                className="w-4 h-4 text-brand-orange rounded border-white/10 bg-[#341F17] focus:ring-0 accent-brand-orange"
              />
              <label htmlFor="notifyCheckbox" className="text-xs font-bold text-white cursor-pointer select-none">
                Automatically broadcast notification to all user profiles on publish
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loadingNews}
              className="w-full bg-brand-orange hover:bg-[#eb741d] active:scale-[0.99] font-black uppercase text-white py-4.5 rounded-2xl shadow-xl shadow-brand-orange/20 flex items-center justify-center gap-2 text-sm transition-all"
            >
              {loadingNews ? <Loader2 className="animate-spin" size={18} /> : 'Publish News Update'}
            </button>
          </form>
        </div>

        {/* Sidebar: Direct Broadcast / Management */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-[#4E2F23] p-8 rounded-3xl border border-white/5 shadow-xl">
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <Send className="text-brand-orange" size={18} />
              Instant Broadcast Alert
            </h3>
            <form onSubmit={handleSendBroadcast} className="space-y-5">
              <div>
                <label className="block text-white/50 text-[10px] font-black uppercase tracking-wider mb-2">Broadcast Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. High Importance Server Maintenance"
                  value={notifTitle}
                  onChange={e => setNotifTitle(e.target.value)}
                  className="w-full bg-[#341F17] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-brand-orange placeholder-white/20 font-semibold"
                />
              </div>

              <div>
                <label className="block text-white/50 text-[10px] font-black uppercase tracking-wider mb-2">Alert Message</label>
                <textarea 
                  rows={3}
                  placeholder="Information or alert message to be pushed directly to user notification dropdowns..."
                  value={notifMsg}
                  onChange={e => setNotifMsg(e.target.value)}
                  className="w-full bg-[#341F17] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-brand-orange placeholder-white/20 font-semibold resize-none"
                />
              </div>

              <div>
                <label className="block text-white/50 text-[10px] font-black uppercase tracking-wider mb-2">Target App View Navigation Link</label>
                <select 
                  value={notifLink}
                  onChange={e => setNotifLink(e.target.value)}
                  className="w-full bg-[#341F17] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-brand-orange font-semibold"
                >
                  <option value="news">News Feed (News &amp; Updates)</option>
                  <option value="universities">Find University</option>
                  <option value="pof">POF Calculator</option>
                  <option value="visa">Visa Guide</option>
                  <option value="resume">Resume Builder</option>
                  <option value="chat">Chat Advisor</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={loadingBroadcast}
                className="w-full bg-brand-orange/20 border border-brand-orange/30 hover:bg-brand-orange/30 text-brand-orange active:scale-[0.99] font-black uppercase py-4 rounded-2xl flex items-center justify-center gap-2 text-xs transition-all tracking-wider"
              >
                {loadingBroadcast ? <Loader2 className="animate-spin" size={14} /> : 'Send Broadcast Notification'}
              </button>
            </form>
          </div>

          {/* Manage Dynamic News list */}
          <div className="bg-[#4E2F23] p-8 rounded-3xl border border-white/5 shadow-xl">
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="text-brand-orange" size={18} />
              Manage Published Feed
            </h3>
            
            {dynamicNews.length === 0 ? (
              <div className="p-6 text-center text-white/30 text-xs font-semibold bg-[#341F17] rounded-2xl border border-white/5">
                No dynamic news articles found in Firestore. Standard system articles are seeded.
              </div>
            ) : (
              <div className="space-y-3 max-h-[20rem] overflow-y-auto pr-1">
                {dynamicNews.map((item) => (
                  <div key={item.id} className="p-4 bg-[#341F17] border border-white/5 rounded-2xl hover:border-white/10 transition-colors flex items-start gap-3 justify-between">
                    <div>
                      <h4 className="text-xs font-black text-white leading-tight line-clamp-1">{item.title}</h4>
                      <p className="text-[10px] text-brand-orange font-bold mt-1 uppercase tracking-wider">{item.date}</p>
                    </div>
                    <button 
                      onClick={() => onDeleteNews(item.id)}
                      className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-xl transition-all shrink-0"
                      title="Delete News Article"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PrivacyView = () => (
  <div className="max-w-4xl mx-auto pt-6 pb-12 px-4 prose prose-invert prose-orange">
    <h2 className="text-4xl font-bold text-white mb-8">Privacy Policy</h2>
    <p className="text-white/60">Last Updated: February 26, 2026</p>
    
    <h3 className="text-white">1. Introduction</h3>
    <p>At Digivasity, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our AI-powered student advisor platform.</p>
    
    <h3 className="text-white">2. Information We Collect</h3>
    <p>We collect information that you provide directly to us, such as when you use our Resume Builder, POF Calculator, or Chat Advisor. This may include:</p>
    <ul>
      <li>Personal identifiers (name, email, phone number, address)</li>
      <li>Academic and professional history</li>
      <li>Financial information for visa requirement calculations</li>
      <li>Chat transcripts and interaction data</li>
    </ul>
    
    <h3 className="text-white">3. How We Use Your Information</h3>
    <p>We use the collected data to:</p>
    <ul>
      <li>Provide and maintain our services</li>
      <li>Personalize your experience and AI-generated content</li>
      <li>Process your requests (e.g., generating a resume or visa guide)</li>
      <li>Improve our platform's AI models and user interface</li>
      <li>Communicate with you regarding updates or support</li>
    </ul>

    <h3 className="text-white">4. Cookies and Web Beacons</h3>
    <p>Digivasity uses 'cookies' to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.</p>
    
    <h3 className="text-white">5. Data Sharing and Disclosure</h3>
    <p>We do not sell your personal data. We may share information with:</p>
    <ul>
      <li>AI Service Providers (e.g., Google Gemini API) to process your requests</li>
      <li>Cloud storage and hosting providers</li>
      <li>Legal authorities if required by law</li>
    </ul>
    
    <h3 className="text-white">6. Data Security</h3>
    <p>We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
    
    <h3 className="text-white">7. Your Rights</h3>
    <p>Depending on your location, you may have the right to access, correct, or delete your personal information. Please contact us to exercise these rights.</p>
    
    <h3 className="text-white">8. Contact Us</h3>
    <p>If you have any questions about this Privacy Policy, please contact us through our <a href="https://wa.link/lb7w29" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">WhatsApp</a>.</p>
  </div>
);

const TermsView = () => (
  <div className="max-w-4xl mx-auto pt-6 pb-12 px-4 prose prose-invert prose-orange">
    <h2 className="text-4xl font-bold text-white mb-8">Terms of Service</h2>
    <p className="text-white/60">Last Updated: February 26, 2026</p>
    
    <h3 className="text-white">1. Acceptance of Terms</h3>
    <p>By accessing or using Digivasity, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
    
    <h3 className="text-white">2. Use of Service</h3>
    <p>You agree to use the service only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the service.</p>
    
    <h3 className="text-white">3. AI-Generated Content</h3>
    <p>Digivasity uses artificial intelligence to provide advice, generate resumes, and calculate requirements. You acknowledge that:</p>
    <ul>
      <li>AI-generated content is for informational purposes only.</li>
      <li>You are responsible for verifying the accuracy of any information provided.</li>
      <li>We are not liable for any decisions made based on AI-generated advice.</li>
    </ul>
    
    <h3 className="text-white">4. Intellectual Property</h3>
    <p>The service and its original content, features, and functionality are and will remain the exclusive property of Digivasity and its licensors.</p>
    
    <h3 className="text-white">5. Limitation of Liability</h3>
    <p>In no event shall Digivasity, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>
    
    <h3 className="text-white">6. Termination</h3>
    <p>We may terminate or suspend your access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
    
    <h3 className="text-white">7. Governing Law</h3>
    <p>These Terms shall be governed and construed in accordance with the laws of Nigeria, without regard to its conflict of law provisions.</p>

    <h3 className="text-white">8. Contact Us</h3>
    <p>If you have any questions about these Terms, please contact us through our <a href="https://wa.link/lb7w29" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">WhatsApp</a>.</p>
  </div>
);

// --- Recurring WhatsApp Popup ---

const WhatsAppPopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsVisible(true);
    }, 60000); // 60 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-8 right-8 z-[100] max-w-[300px]"
        >
          <div className="bg-[#4A2C21] border border-white/10 rounded-[32px] p-6 shadow-2xl shadow-black/50 relative overflow-hidden group">
            {/* Background Image */}
            <img 
              src="https://images.unsplash.com/photo-1523050853063-bd8012fec046?auto=format&fit=crop&q=80&w=800" 
              alt="Campus"
              className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-110 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-brown/80 to-brand-brown" />
            
            <div className="absolute top-0 left-0 w-full h-1 bg-brand-orange" />
            
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-10"
            >
              <X size={18} />
            </button>

            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-brand-orange/20 rounded-xl flex items-center justify-center">
                <MessageSquare className="text-brand-orange w-6 h-6" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Need Help?</h3>
                <p className="text-[11px] text-white/80 leading-relaxed font-medium">
                  Get our admissions team to help you with application, low cost Proof of Funds and visa Application Support. No Service Charge
                </p>
              </div>

              <a 
                href="https://wa.link/lb7w29" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-brand-orange text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-brand-orange-light transition-all shadow-lg shadow-brand-orange/20"
              >
                <Send size={14} />
                Start Now
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Main App ---

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<MainLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

function MainLayout() {
  const [view, setView] = useState<View>('home');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingView, setPendingView] = useState<View | null>(null);
  const navigate = useNavigate();

  // Check for email verification / password reset URL parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const userId = params.get('userId');
    const secret = params.get('secret');
    const authMode = params.get('auth');
    if ((mode === 'verifyEmail' || mode === 'resetPassword') && userId && secret) {
      setShowAuth(true);
    }
    if (authMode === 'google') {
      window.history.replaceState({}, document.title, window.location.pathname);
      void (async () => {
        const current = await refreshCurrentUser();
        if (current) {
          await createUserDocument(current);
          setUser(current);
        }
      })();
    }
    if (authMode === 'google-error') {
      setShowAuth(true);
    }
  }, []);

  // News, Notifications & Admin Roles State
  const [dynamicNews, setDynamicNews] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      // Clear pendingView and dismiss auth screen when user is logged in and verified
      if (currentUser && currentUser.emailVerified) {
        if (pendingView) {
          setView(pendingView);
          setPendingView(null);
        }
        setShowAuth(false);
      }
    });
    return () => unsubscribe();
  }, [pendingView]);

  // Read admin role from email fallback or users database
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    const adminEmails = [
      'ubyytech2023@gmail.com',
      'olamilekanobetter@gmail.com',
      'ezekielxap@gmail.com',
      'info@digiskiskillsconsult.com',
      'ubong.udoka@digiskillsconsult.com',
      'ubongp.udoka@gmail.com'
    ];

    if (user.email && adminEmails.map(email => email.toLowerCase()).includes(user.email.toLowerCase())) {
      setIsAdmin(true);
      return;
    }

    const checkAdmin = async () => {
      try {
        await createUserDocument(user);
        const userDoc = await getDocument(appwriteIds.usersCollectionId, user.uid);
        const data = userDoc as any;
        if (data?.role === 'admin' || data?.admin === true || data?.admi === true) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.warn("Error reading user admin profile:", err);
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [user]);

  // Real-time listener for news feed
  useEffect(() => {
    const unsubscribe = subscribeCollection<any>(
      appwriteIds.newsCollectionId,
      (documents) => {
        const items = documents.map((d: any) => {
          let parsedLinks: any[] = [];
          try {
            parsedLinks = typeof d.linksJson === 'string' ? JSON.parse(d.linksJson || '[]') : (d.links || []);
          } catch {
            parsedLinks = d.links || [];
          }

          return {
            id: d.$id,
            ...d,
            links: parsedLinks,
            date: d.date || (d.$createdAt ? new Date(d.$createdAt).toLocaleDateString('en-US') : new Date().toLocaleDateString('en-US')),
          };
        });
        setDynamicNews(items);
      },
      [Query.orderDesc('publishedAt')],
    );

    return () => unsubscribe();
  }, []);

  // Real-time listener for notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeCollection<any>(
      appwriteIds.notificationsCollectionId,
      (documents) => {
        const items = documents.map((d: any) => ({
          id: d.$id,
          ...d,
        }));
        setNotifications(items);
      },
      [Query.orderDesc('createdAt')],
    );

    return () => unsubscribe();
  }, [user]);

  // Notifications are handled separately from auth and database records.

  // Publish News Article
  const handlePublishNews = async (newsData: any, notifyUsers: boolean) => {
    if (!user || !isAdmin) {
      throw new Error("Unauthorized Access: Admin privileges required to publish news.");
    }
    try {
      const newsDoc = buildNewsPayload({
        title: newsData.title,
        summary: newsData.excerpt,
        excerpt: newsData.excerpt,
        content: newsData.content,
        imageUrl: newsData.imageUrl || '',
        links: newsData.links || [],
        createdBy: user.uid,
        authorUid: user.uid,
        authorName: user.displayName || user.email || '',
        status: 'published',
      });

      const permissions = [
        Permission.read(Role.any()),
        Permission.update(Role.user(user.uid)),
        Permission.delete(Role.user(user.uid)),
      ];

      const docRef = await createDocument(
        appwriteIds.newsCollectionId,
        ID.unique(),
        newsDoc,
        permissions,
      );

      if (notifyUsers) {
        await createDocument(
          appwriteIds.notificationsCollectionId,
          ID.unique(),
          buildNotificationPayload({
            title: `New Update: ${newsData.title}`,
            message: newsData.excerpt,
            body: newsData.excerpt,
            link: 'news',
            type: 'news',
            newsId: docRef.$id,
            createdBy: user.uid,
          }),
          [
            Permission.read(Role.any()),
            Permission.update(Role.user(user.uid)),
            Permission.delete(Role.user(user.uid)),
          ],
        );
      }
    } catch (err) {
      handleAppwriteError(err, OperationType.CREATE, 'news');
    }
  };

  // Send System-wide Broadcast Notification
  const handleSendBroadcast = async (title: string, message: string, destination: string) => {
    if (!user || !isAdmin) {
      throw new Error("Unauthorized Access: Admin privileges required to broadcast messages.");
    }
    try {
      await createDocument(
        appwriteIds.notificationsCollectionId,
        ID.unique(),
        buildNotificationPayload({
          title,
          message,
          body: message,
          link: destination,
          type: 'broadcast',
          createdBy: user.uid,
        }),
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.uid)),
          Permission.delete(Role.user(user.uid)),
        ],
      );
    } catch (err) {
      handleAppwriteError(err, OperationType.CREATE, 'notifications');
    }
  };

  // Delete Published News
  const handleDeleteNews = async (id: string) => {
    if (!user || !isAdmin) {
      throw new Error("Unauthorized Access: Admin privileges required to remove articles.");
    }
    try {
      await deleteDocument(appwriteIds.newsCollectionId, id);
    } catch (err) {
      handleAppwriteError(err, OperationType.DELETE, `news/${id}`);
    }
  };

  // Prepend dynamic news to static blogs
  const mergedPosts = [...dynamicNews, ...BLOG_POSTS];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const handleSetView = (newView: View) => {
    if (newView === 'contact') {
      window.open("https://wa.link/lb7w29", "_blank");
      return;
    }

    if (newView === 'login' as any) {
      setShowAuth(true);
      return;
    }

    // All views except 'admin' are public and do not require logging in
    const publicViews: View[] = [
      'home', 
      'universities', 
      'pof', 
      'visa', 
      'resume', 
      'chat', 
      'blog', 
      'blog-post', 
      'privacy', 
      'terms'
    ];
    if (!publicViews.includes(newView)) {
      if (!user || !user.emailVerified) {
        setPendingView(newView);
        setShowAuth(true);
        return;
      }
    }

    setView(newView);
    setShowAuth(false);
  };

  return (
    <div className="min-h-screen bg-[#2D1B14] text-white font-sans selection:bg-[#F27D26]/30">
      <Navbar 
        activeView={view} 
        setView={handleSetView} 
        user={user} 
        isAdmin={isAdmin} 
        notifications={notifications} 
        onMarkAllRead={() => {}} 
      />
      
      <main className="pt-20 pb-4">
        {showAuth ? (
          <Auth 
            onSuccess={() => {
              if (pendingView) {
                setView(pendingView);
                setPendingView(null);
              }
              setShowAuth(false);
            }} 
            onBack={() => {
              setShowAuth(false);
              setPendingView(null);
            }}
          />
        ) : (
          <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Hero onExplore={() => handleSetView('universities')} />
              
              <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Find University Card */}
                <motion.div 
                  whileHover={{ y: -5 }}
                  onClick={() => handleSetView('universities')}
                  className="md:col-span-4 glass-card p-0 flex flex-col min-h-[220px] relative overflow-hidden group cursor-pointer"
                >
                  <img 
                    src="https://picsum.photos/seed/dream-uni/800/600" 
                    alt="Dream University Campus" 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-brand-brown/60 group-hover:bg-brand-brown/40 transition-colors" />
                  <div className="relative z-10 p-6 flex flex-col h-full">
                    <div className="w-12 h-12 bg-brand-orange/20 rounded-xl flex items-center justify-center mb-4">
                      <Globe className="text-brand-orange w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-white leading-tight mb-2">Find Your Dream <br /> University</h3>
                    <button 
                      className="mt-auto text-[10px] font-bold text-brand-orange uppercase tracking-widest flex items-center gap-2"
                    >
                      Search Now <ArrowRight size={12} />
                    </button>
                  </div>
                </motion.div>

                {/* Blog Card (Latest News & Updates) */}
                <motion.div 
                  whileHover={{ y: -5 }}
                  onClick={() => handleSetView('blog')}
                  className="md:col-span-3 glass-card p-0 flex flex-col min-h-[220px] relative overflow-hidden group cursor-pointer"
                >
                  <img 
                    src="https://picsum.photos/seed/news-bg/800/600?brightness=0.6" 
                    alt="News and announcements" 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-brand-brown/60 group-hover:bg-brand-brown/40 transition-colors" />
                  <div className="relative z-10 p-6 flex flex-col h-full items-center text-center">
                    <div className="w-12 h-12 bg-brand-orange/20 rounded-xl flex items-center justify-center mb-4">
                      <BookOpen className="text-brand-orange w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-white leading-tight mb-2">Latest News &amp; <br /> Updates</h3>
                    <span className="mt-auto text-[10px] font-bold text-white/60 uppercase tracking-widest">
                      Alerts &amp; Global News
                    </span>
                  </div>
                </motion.div>

                {/* Visa Guide Card (Visa Application Guide) */}
                <motion.div 
                  whileHover={{ y: -5 }}
                  onClick={() => handleSetView('visa')}
                  className="md:col-span-5 glass-card p-0 flex flex-col min-h-[220px] relative overflow-hidden group cursor-pointer"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?auto=format&fit=crop&q=80&w=800" 
                    alt="Student in London near UK landmark" 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-brand-brown/60 group-hover:bg-brand-brown/40 transition-colors" />
                  <div className="relative z-10 p-6 flex flex-col h-full">
                    <div className="w-12 h-12 bg-brand-orange/20 rounded-xl flex items-center justify-center mb-4">
                      <FileText className="text-brand-orange w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-white leading-tight mb-2">Visa Application <br /> Guide</h3>
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider max-w-[220px]">
                      Step by step document checklist and visa cost analysis
                    </p>
                    
                    <button className="mt-auto text-[10px] font-bold text-brand-orange uppercase tracking-widest flex items-center gap-2">
                      Click to Start <ArrowRight size={12} />
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Secondary Bento Row */}
              <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <motion.div 
                  whileHover={{ y: -5 }}
                  onClick={() => handleSetView('pof')}
                  className="glass-card p-6 flex items-center gap-4 cursor-pointer group"
                >
                  <div className="w-14 h-14 bg-brand-orange/10 rounded-2xl flex items-center justify-center group-hover:bg-brand-orange/20 transition-colors">
                    <Calculator className="text-brand-orange w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">POF Calculator</h3>
                    <p className="text-white/50 text-sm">Calculate required funds for your visa application.</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -5 }}
                  onClick={() => handleSetView('resume')}
                  className="glass-card p-6 flex items-center gap-4 cursor-pointer group"
                >
                  <div className="w-14 h-14 bg-brand-orange/10 rounded-2xl flex items-center justify-center group-hover:bg-brand-orange/20 transition-colors">
                    <FileText className="text-brand-orange w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Resume Builder</h3>
                    <p className="text-white/50 text-sm">Create a professional academic resume with AI.</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {view === 'universities' && <motion.div key="uni" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><UniversityView /></motion.div>}
          {view === 'pof' && <motion.div key="pof" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><POFView /></motion.div>}
          {view === 'visa' && <motion.div key="visa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><VisaView /></motion.div>}
          {view === 'resume' && <motion.div key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ResumeView /></motion.div>}
          {view === 'chat' && <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ChatView currentUser={user} /></motion.div>}
          {view === 'blog' && (
            <motion.div key="blog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BlogView 
                posts={mergedPosts}
                isAdmin={isAdmin}
                onDeleteNews={handleDeleteNews}
                onReadMore={(post) => {
                  setSelectedPost(post);
                  handleSetView('blog-post');
                }} 
              />
            </motion.div>
          )}
          {view === 'blog-post' && (
            <motion.div key="blog-post" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BlogPostView 
                post={selectedPost} 
                isAdmin={isAdmin}
                onDeleteNews={handleDeleteNews}
                onBack={() => handleSetView('blog')} 
              />
            </motion.div>
          )}
          {view === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminView 
                onPublishNews={handlePublishNews}
                onSendBroadcast={handleSendBroadcast}
                dynamicNews={dynamicNews}
                onDeleteNews={handleDeleteNews}
              />
            </motion.div>
          )}
          {view === 'privacy' && <motion.div key="privacy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><PrivacyView /></motion.div>}
          {view === 'terms' && <motion.div key="terms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><TermsView /></motion.div>}
        </AnimatePresence>
        )}
      </main>

      {/* Floating Chat Button (only visible when not in chat view) */}
      {view !== 'chat' && (
        <motion.button
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => handleSetView('chat')}
          className="fixed bottom-10 right-10 w-16 h-16 bg-[#F27D26] rounded-full shadow-2xl flex items-center justify-center z-40 group border-4 border-[#2D1B14]"
        >
          <MessageSquare className="text-white w-8 h-8" />
          <span className="absolute right-full mr-4 bg-[#2D1B14] text-white px-4 py-2 rounded-xl text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 shadow-xl">
            Chat with Advisor
          </span>
        </motion.button>
      )}

      <WhatsAppPopup />

      {/* Latest News Section displayed before footer section */}
      {view !== 'admin' && view !== 'blog' && view !== 'blog-post' && view !== 'chat' && (
        <LatestNewsSection 
          posts={mergedPosts}
          onReadMore={(post) => {
            setSelectedPost(post);
            handleSetView('blog-post');
          }}
          onNavigateToBlog={() => {
            handleSetView('blog');
          }}
        />
      )}
      
      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 md:px-12 mt-0 bg-[#24150F]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex items-center cursor-pointer" onClick={() => handleSetView('home')}>
              <div className="w-10 h-10 bg-[#F27D26] rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-brand-orange/20">
                <Globe className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">Digivasity</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              <button onClick={() => handleSetView('privacy')} className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-[#F27D26] transition-colors">Privacy</button>
              <button onClick={() => handleSetView('terms')} className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-[#F27D26] transition-colors">Terms</button>
              <button onClick={() => handleSetView('contact')} className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-[#F27D26] transition-colors">Contact Us</button>
            </div>
          </div>

          <div className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] text-center md:text-right">
            <p>© 2026 Digivasity AI Advisor. <br className="md:hidden" /> All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
