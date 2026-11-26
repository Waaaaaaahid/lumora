import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Images, MapPin } from "lucide-react";
import { useState } from "react";
import { portfolioService, type PortfolioProject } from "@/services/portfolioService";

export const Route = createFileRoute("/our-work")({
  head: () => ({ meta: [
    { title: "Our Work — Lumora Curio" },
    { name: "description", content: "Explore interior design projects and spaces created by Lumora Curio." },
  ] }),
  component: OurWorkPage,
});

function youtubeEmbed(url: string) {
  const match = url.match(/(?:youtube\.com\\/(?:watch\\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}
function youtubeThumbnail(url: string) {
  const match = url.match(/(?:youtube\.com\\/(?:watch\\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}
function OurWorkPage() {
  const [activeProject, setActiveProject] = useState<PortfolioProject | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const projectsQuery = useQuery({ queryKey: ["portfolio-projects"], queryFn: portfolioService.list, staleTime: 30_000 });
  const projects = projectsQuery.data ?? [];
  const categories = ["All", ...Array.from(new Set(projects.map(p => p.category).filter(Boolean)))].sort((a,b)=>a==="All"?-1:b==="All"?1:a.localeCompare(b));
  const visibleProjects = activeCategory === "All" ? projects : projects.filter(project => project.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#f5f4f1] text-[#242521]">
      <section className="relative overflow-hidden bg-[#292a25] px-5 py-16 text-center text-white sm:py-24">
        <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#d4b99b]">Spaces made personal</p>
        <h1 className="mx-auto mt-4 max-w-3xl font-serif text-4xl leading-tight tracking-[-.035em] sm:text-6xl">Our work, <span className="italic text-[#d8c3a9]">your inspiration.</span></h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/65 sm:text-base">Explore a selection of interiors designed with thoughtful details, timeless materials and everyday comfort.</p>
        <div className="mx-auto mt-8 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-white/55"><Images className="size-4" /> Interior design portfolio</div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8b765d]">Selected projects</p><h2 className="mt-2 font-serif text-3xl sm:text-4xl">Designed with intention</h2></div>
          <span className="text-xs text-[#85867e]">{visibleProjects.length} {visibleProjects.length === 1 ? "project" : "projects"}</span>
        </div>
        <div className="mb-6 flex flex-wrap gap-2">{categories.map(category => <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${activeCategory===category ? "border-[#292a25] bg-[#292a25] text-white" : "border-[#d6d3ca] bg-white text-[#55564f] hover:bg-[#eae8e2]"}`}>{category}</button>)}</div>

        {projectsQuery.isLoading ? <div className="grid gap-7 md:grid-cols-2">{[1,2,3,4].map((n) => <div key={n} className="h-[420px] animate-pulse rounded-3xl bg-[#e8e6e0]" />)}</div> :
        projectsQuery.isError ? <div className="rounded-3xl border border-dashed border-[#d6d3ca] p-12 text-center text-sm text-[#77786f]">Our work couldn't load right now. Please try again shortly.</div> :
        visibleProjects.length ? <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {visibleProjects.map((project) => <button key={project._id} type="button" onClick={() => setActiveProject(project)} className="group overflow-hidden rounded-3xl bg-white text-left shadow-[0_12px_40px_rgba(35,35,28,.07)] transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(35,35,28,.12)]">
            <div className="relative aspect-[1.32] overflow-hidden bg-[#e8e6e0]">{project.images[0]?.mediaType === "video" ? (youtubeThumbnail(project.images[0]?.url) ? <img src={youtubeThumbnail(project.images[0]?.url)!} alt={project.title} className="h-full w-full object-cover" /> : <video src={project.images[0]?.url} muted playsInline className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />) : <img src={project.images[0]?.url} alt={project.images[0]?.alt || project.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />}<span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#38382f]">{project.category}</span><span className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/90 text-[#34352e]"><ArrowUpRight className="size-4" /></span></div>
            <div className="p-6 sm:p-7"><h3 className="font-serif text-2xl">{project.title}</h3>{project.location ? <p className="mt-2 flex items-center gap-1.5 text-xs text-[#85867e]"><MapPin className="size-3.5" />{project.location}</p> : null}<p className="mt-3 line-clamp-3 text-sm leading-6 text-[#77786f]">{project.description}</p><p className="mt-5 text-[10px] font-bold uppercase tracking-[.17em] text-[#8b765d]">View project <span aria-hidden>↗</span></p></div>
          </button>)}
        </div> : <div className="rounded-3xl border border-dashed border-[#d6d3ca] bg-white p-12 text-center"><Images className="mx-auto size-8 text-[#9b988e]" /><h3 className="mt-4 font-serif text-2xl">Projects coming soon</h3><p className="mt-2 text-sm text-[#77786f]">Our latest interior designs will appear here.</p></div>}
      </section>

      {activeProject ? <div role="dialog" aria-modal="true" aria-label={activeProject.title} className="fixed inset-0 z-[100] overflow-y-auto bg-black/75 p-4 sm:p-8" onClick={() => setActiveProject(null)}>
        <div className="mx-auto my-6 max-w-5xl overflow-hidden rounded-3xl bg-white" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-4 p-6 sm:p-8"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8b765d]">{activeProject.category}</p><h2 className="mt-2 font-serif text-3xl">{activeProject.title}</h2>{activeProject.location ? <p className="mt-2 text-xs text-[#77786f]">{activeProject.location}</p> : null}</div><button type="button" onClick={() => setActiveProject(null)} className="rounded-full border border-[#e6e3dc] px-3 py-2 text-sm">Close</button></div>
          <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2 sm:px-6">{activeProject.images.map((image, index) => image.mediaType === "video" ? (youtubeEmbed(image.url) ? <iframe key={image.publicId || image.url} src={youtubeEmbed(image.url)!} title={activeProject.title + " video"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="aspect-video w-full rounded-2xl bg-black" /> : <video key={image.publicId || image.url} src={image.url} controls playsInline className="max-h-[520px] w-full rounded-2xl object-contain bg-black" />) : <img key={image.publicId || image.url} src={image.url} alt={image.alt || activeProject.title} className="max-h-[520px] w-full rounded-2xl object-cover" loading={index > 1 ? "lazy" : "eager"} />)}</div>
          <p className="px-6 pb-7 text-sm leading-7 text-[#65665e] sm:px-8">{activeProject.description}</p>
        </div>
      </div> : null}
    </div>
  );
}
