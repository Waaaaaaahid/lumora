import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type FormEvent } from "react";
import { ImagePlus, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/AppButton";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { useToast } from "@/context/ToastContext";
import { adminService } from "@/services/adminService";
import { portfolioService, type PortfolioImage, type PortfolioProject } from "@/services/portfolioService";

export const Route = createFileRoute("/admin/our-work")({
  head: () => ({ meta: [{ title: "Our Work — Admin" }, { name: "description", content: "Manage interior design portfolio projects." }] }),
  component: AdminOurWorkPage,
});

const emptyForm = { title: "", category: "Kitchen Interior", description: "", location: "", images: [] as PortfolioImage[], featured: false, published: true, sortOrder: 0 };

function AdminOurWorkPage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const projectsQuery = useQuery({ queryKey: ["admin-portfolio"], queryFn: portfolioService.listAdmin });
  const categoriesQuery = useQuery({ queryKey: ["gallery-categories"], queryFn: adminService.listCategories });
  const galleryCategories = (categoriesQuery.data || []).filter(category => category.active).map(category => category.name);
  const projects = projectsQuery.data ?? [];

  const reset = () => { setEditing(null); setForm(emptyForm); if (fileInput.current) fileInput.current.value = ""; };
  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const valid = Array.from(files).filter((file) => (["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 5 * 1024 * 1024) || (["video/mp4", "video/webm"].includes(file.type) && file.size <= 50 * 1024 * 1024));
    if (!valid.length) { notify("Select images (max 5 MB) or MP4/WebM videos (max 50 MB)", { variant: "error" }); return; }
    setUploading(true);
    try {
      const uploaded = await Promise.all(valid.map(async (file) => {
        const result = file.type.startsWith("video/") ? await adminService.uploadPortfolioVideo(file) : await adminService.uploadPortfolioImage(file);
        return { url: result.url, publicId: result.publicId, mediaType: file.type.startsWith("video/") ? "video" as const : "image" as const, alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") };
      }));
      setForm((current) => ({ ...current, images: [...current.images, ...uploaded] }));
      notify(`${uploaded.length} media file(s) uploaded`, { variant: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Image upload failed", { variant: "error" });
    } finally { setUploading(false); if (fileInput.current) fileInput.current.value = ""; }
  };

  const addVideo = () => { const url = videoUrl.trim(); if (!url || !/^https?:\\/\\//i.test(url)) { notify("Enter a valid video URL (https://)", { variant: "error" }); return; } setForm(current => ({ ...current, images: [...current.images, { url, mediaType: "video" as const, alt: current.title || "Project video" }] })); setVideoUrl(""); };

  const editProject = (project: PortfolioProject) => {
    setEditing(project._id);
    setForm({ title: project.title, category: project.category, description: project.description, location: project.location || "", images: project.images || [], featured: project.featured, published: project.published, sortOrder: project.sortOrder || 0 });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveProject = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.images.length) { notify("Upload at least one project image", { variant: "error" }); return; }
    setSaving(true);
    try {
      if (editing) await portfolioService.update(editing, form);
      else await portfolioService.create(form);
      await queryClient.invalidateQueries({ queryKey: ["admin-portfolio"] });
      await queryClient.invalidateQueries({ queryKey: ["portfolio-projects"] });
      notify(editing ? "Project updated" : "Project published", { variant: "success" });
      reset();
    } catch (error) { notify(error instanceof Error ? error.message : "Could not save project", { variant: "error" }); }
    finally { setSaving(false); }
  };

  const deleteMutation = useMutation({
    mutationFn: portfolioService.remove,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin-portfolio"] }); await queryClient.invalidateQueries({ queryKey: ["portfolio-projects"] }); notify("Project deleted", { variant: "success" }); },
    onError: () => notify("Could not delete project", { variant: "error" }),
  });

  return <div className="space-y-8">
    <div><p className="eyebrow text-accent">Portfolio management</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Our Work</h1><p className="mt-2 text-sm text-muted-foreground">Upload interior design projects, add details and control what visitors can see.</p></div>
    <form onSubmit={saveProject} className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-7">
      <div className="mb-6 flex items-center justify-between gap-3"><h2 className="font-display text-xl font-semibold">{editing ? "Edit project" : "Add a project"}</h2>{editing ? <Button type="button" variant="outline" size="sm" onClick={reset}><X className="mr-2 size-4" /> Cancel edit</Button> : null}</div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="portfolio-title" label="Project title"><TextInput id="portfolio-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Warm modern kitchen" /></Field>
        <Field id="portfolio-category" label="Gallery category"><select id="portfolio-category" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">{Array.from(new Set([form.category, ...galleryCategories, "Living Room", "Bedroom", "Kitchen", "Full Home", "Office", "Other"].filter(Boolean))).map(category => <option key={category} value={category}>{category}</option>)}</select><p className="mt-1 text-xs text-muted-foreground">Add/edit categories from Gallery Categories in the admin menu.</p></Field>
        <Field id="portfolio-location" label="Location (optional)"><TextInput id="portfolio-location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. New Delhi" /></Field>
        <Field id="portfolio-order" label="Display order"><TextInput id="portfolio-order" type="number" value={String(form.sortOrder)} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })} /></Field>
        <div className="md:col-span-2"><Field id="portfolio-description" label="Project description"><TextArea id="portfolio-description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the materials, layout, style and special details..." /></Field></div>
      </div>
      <div className="mt-6 rounded-2xl border border-dashed border-border p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Photos & videos</h3><p className="mt-1 text-xs text-muted-foreground">Upload photos (JPG/PNG/WebP, max 5 MB) or MP4/WebM videos (max 50 MB), or paste a hosted video URL.</p></div><Button type="button" variant="outline" disabled={uploading} onClick={() => fileInput.current?.click()}><ImagePlus className="mr-2 size-4" /> {uploading ? "Uploading media..." : "Upload photos/videos"}</Button></div>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple className="hidden" onChange={(e) => void uploadImages(e.target.files)} />
        <div className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Paste hosted video URL (MP4)" className="h-10 flex-1 rounded-xl border bg-background px-3 text-sm" /><Button type="button" variant="outline" onClick={addVideo}>Add video URL</Button></div>
        {form.images.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{form.images.map((image, index) => <div key={image.publicId || image.url} className="relative aspect-square overflow-hidden rounded-xl bg-muted">{image.mediaType === "video" ? <video src={image.url} controls className="h-full w-full object-cover" /> : <img src={image.url} alt={image.alt || form.title} className="h-full w-full object-cover" />}<button type="button" aria-label="Remove image" onClick={() => setForm({ ...form, images: form.images.filter((_, i) => i !== index) })} className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white"><X className="size-3.5" /></button><span className="absolute bottom-2 left-2 rounded bg-black/65 px-2 py-1 text-[10px] text-white">{image.mediaType === "video" ? "Video" : `Image ${index + 1}`}</span></div>)}</div> : <div className="py-8 text-center text-xs text-muted-foreground"><Upload className="mx-auto mb-2 size-5" />No media uploaded yet</div>}
      </div>
      <div className="mt-5 flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured project</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Visible on website</label></div>
      <div className="mt-6"><Button type="submit" size="lg" loading={saving || uploading} disabled={saving || uploading}><Plus className="mr-2 size-4" /> {editing ? "Save changes" : "Publish project"}</Button></div>
    </form>

    <section><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Saved projects</h2><span className="text-xs text-muted-foreground">{projects.length} total</span></div>
      {projectsQuery.isLoading ? <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">Loading projects...</div> : projects.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{projects.map((project) => <article key={project._id} className="overflow-hidden rounded-2xl border border-border bg-card"><div className="relative aspect-[1.5] bg-muted">{project.images[0]?.mediaType === "video" ? <video src={project.images[0]?.url} muted className="h-full w-full object-cover" /> : <img src={project.images[0]?.url} alt={project.title} className="h-full w-full object-cover" />}<span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase text-[#333]">{project.published ? "Published" : "Hidden"}</span></div><div className="p-4"><h3 className="font-semibold">{project.title}</h3><p className="mt-1 text-xs text-muted-foreground">{project.category} · {project.images.filter(x=>x.mediaType!=="video").length} photo(s) · {project.images.filter(x=>x.mediaType==="video").length} video(s)</p><div className="mt-4 flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => editProject(project)}><Pencil className="mr-1.5 size-3.5" /> Edit</Button><Button type="button" variant="outline" size="sm" onClick={() => { if (window.confirm("Delete this portfolio project?")) deleteMutation.mutate(project._id); }}><Trash2 className="mr-1.5 size-3.5" /> Delete</Button></div></div></article>)}</div> : <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No projects yet. Add your first design above.</div>}
    </section>
  </div>;
}
