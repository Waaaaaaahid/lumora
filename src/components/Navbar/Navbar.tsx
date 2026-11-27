import { AnimatePresence, motion } from "framer-motion";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Menu as MenuIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AnnouncementBar } from "@/components/AnnouncementBar/AnnouncementBar";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setMobileOpen(false), [pathname]);
  const links = [{ label: "Home", to: "/" }, { label: "Our Work", to: "/our-work" }, { label: "About", to: "/about" }, { label: "Contact", to: "/contact" }];
  return <header className={"sticky top-0 z-50 border-b border-[#e9e8e1] bg-[#fbfaf7]/95 backdrop-blur-xl transition-all " + (scrolled ? "shadow-[0_8px_28px_rgba(30,32,26,.06)]" : "")}>
    <AnnouncementBar />
    <nav className="relative mx-auto flex h-[70px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-14">
      <button className="flex h-10 w-10 items-center justify-center rounded-full lg:hidden" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle menu">{mobileOpen ? <X/> : <MenuIcon/>}</button>
      <Link to="/" className="absolute left-1/2 -translate-x-1/2 text-center" aria-label="Lumora Curio home"><span className="flex flex-col items-center font-serif font-bold leading-none text-[#803b36]"><span className="text-[1.8rem] tracking-[-.055em]">Lumora</span><span className="mt-1 text-[1.1rem] tracking-wide">Curio</span></span></Link>
      <div className="hidden items-center gap-1 lg:flex">{links.map(l=><Link key={l.label} to={l.to} className={"rounded-full px-4 py-2 text-xs font-semibold " + (pathname===l.to?"bg-[#e9ede3] text-[#343e2f]":"text-[#65665e] hover:bg-white")}>{l.label}</Link>)}</div>
      <div className="hidden lg:block">{isAdmin?<Link to="/admin" className="inline-flex items-center gap-2 rounded-full bg-[#e9ede3] px-4 py-2 text-xs font-semibold text-[#343e2f]"><LayoutDashboard className="size-4"/> Admin</Link>:<Link to="/contact" className="rounded-full bg-[#252720] px-5 py-2.5 text-xs font-semibold text-white">Enquire now</Link>}</div>
      <Link to="/contact" className="rounded-full bg-[#252720] px-3 py-2 text-[11px] font-semibold text-white lg:hidden">Enquire</Link>
    </nav>
    <AnimatePresence>{mobileOpen&&<motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden border-t bg-[#fbfaf7] lg:hidden"><ul className="px-5 py-3">{links.map(l=><li key={l.label}><Link to={l.to} className="block rounded-xl px-4 py-3 text-sm font-medium">{l.label}</Link></li>)}{isAdmin&&<li><Link to="/admin" className="block rounded-xl px-4 py-3 text-sm font-medium">Admin dashboard</Link></li>}</ul></motion.div>}</AnimatePresence>
  </header>;
}