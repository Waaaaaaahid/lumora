import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShoppingBag, Star, ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import { menuService } from "@/services/menuService";
import { reviewService } from "@/services/reviewService";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/utils/format";
import type { MenuItem } from "@/lib/types";

export const Route = createFileRoute("/product/$productId")({
  head: () => ({ meta: [{ title: "Product details" }, { name: "description", content: "Explore product photos, details, related finds and customer reviews." }] }),
  component: ProductPage,
});

const fallbackImage = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85";
type Media = { kind: "image" | "video"; src: string };

function ProductPage() {
  const { productId } = Route.useParams();
  const { addItem, openCart } = useCart();
  const [activeMedia, setActiveMedia] = useState(0);
  const touchX = useRef<number | null>(null);
  const productQuery = useQuery({ queryKey: ["product", productId], queryFn: () => menuService.get(productId) });
  const product = productQuery.data;
  const reviewsQuery = useQuery({ queryKey: ["product-reviews", productId], queryFn: () => reviewService.listForItem(productId), enabled: Boolean(productId) });
  const relatedQuery = useQuery({ queryKey: ["related-products", product?.category], queryFn: () => menuService.list(product?.category), enabled: Boolean(product?.category) });
  const media: Media[] = useMemo(() => {
    if (!product) return [];
    const photos = [product.image, ...(product.gallery ?? [])].filter((src): src is string => Boolean(src && src.trim()));
    const uniquePhotos = Array.from(new Set(photos));
    return [...uniquePhotos.map((src) => ({ kind: "image" as const, src })), ...(product.videoUrl ? [{ kind: "video" as const, src: product.videoUrl }] : [])];
  }, [product]);
  const reviews = reviewsQuery.data?.reviews ?? [];
  const related = (relatedQuery.data ?? []).filter((item) => item.available && item._id !== productId).slice(0, 12);
  const goMedia = (index: number) => setActiveMedia((index + media.length) % Math.max(media.length, 1));
  const onTouchStart = (event: React.TouchEvent) => { touchX.current = event.touches[0]?.clientX ?? null; };
  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchX.current === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    if (Math.abs(delta) > 45) goMedia(activeMedia + (delta < 0 ? 1 : -1));
    touchX.current = null;
  };
  if (productQuery.isLoading) return <div className="mx-auto max-w-6xl px-5 py-16"><div className="grid animate-pulse gap-6 md:grid-cols-2"><div className="aspect-square rounded-3xl bg-[#efeee8]" /><div className="space-y-4"><div className="h-10 rounded bg-[#efeee8]" /><div className="h-24 rounded bg-[#efeee8]" /></div></div></div>;
  if (productQuery.isError || !product) return <div className="mx-auto max-w-5xl px-5 py-20 text-center"><h1 className="text-2xl font-semibold">Product not found</h1><p className="mt-2 text-sm text-[#73746c]">This product may have been removed or is no longer available.</p><Link to="/menu" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2e4031] px-5 py-3 text-sm font-semibold text-white"><ArrowLeft className="size-4" /> Browse products</Link></div>;

  const rating = reviewsQuery.data?.average ?? Number(product.rating ?? 0);
  const count = reviewsQuery.data?.count ?? 0;
  const active = media[activeMedia] ?? media[0];
  const videoSrc = active?.kind === "video" ? active.src : "";
  const isEmbed = /youtube\.com|youtu\.be|vimeo\.com/.test(videoSrc);
  const embedSrc = videoSrc.includes("youtu.be/") ? `https://www.youtube.com/embed/${videoSrc.split("youtu.be/")[1].split(/[?&]/)[0]}` : videoSrc.includes("youtube.com/watch") ? `https://www.youtube.com/embed/${new URL(videoSrc).searchParams.get("v")}` : videoSrc.includes("vimeo.com/") ? `https://player.vimeo.com/video/${videoSrc.split("vimeo.com/")[1].split(/[?&]/)[0]}` : videoSrc;
  const discount = product.compareAtPrice && product.compareAtPrice > product.price ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;

  return <div className="min-h-screen bg-[#fbfaf7] text-[#242521]">
    <div className="mx-auto max-w-[1440px] px-5 pt-6 sm:px-8 lg:px-14">
      <Link to="/menu" className="inline-flex items-center gap-2 text-xs font-semibold text-[#6e7568] hover:text-[#2e4031]"><ArrowLeft className="size-4" /> Back to shop</Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div>
          <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="relative aspect-square overflow-hidden rounded-3xl bg-[#efeee8]">
            {active?.kind === "video" ? (isEmbed ? <iframe src={embedSrc} title={product.name + " video"} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <video src={active.src} controls playsInline className="h-full w-full object-contain" />) : <img src={active?.src || fallbackImage} alt={product.name} className="h-full w-full object-contain" />}
            {media.length > 1 ? <><button type="button" onClick={() => goMedia(activeMedia - 1)} aria-label="Previous media" className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow"><ChevronLeft className="size-5" /></button><button type="button" onClick={() => goMedia(activeMedia + 1)} aria-label="Next media" className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow"><ChevronRight className="size-5" /></button><span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">{activeMedia + 1} / {media.length}</span></> : null}
          </div>
          {media.length > 1 ? <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{media.map((entry, index) => <button key={entry.src} type="button" onClick={() => setActiveMedia(index)} className={`relative size-20 shrink-0 overflow-hidden rounded-xl border-2 ${activeMedia === index ? "border-[#2e4031]" : "border-transparent"} bg-[#efeee8]`}>{entry.kind === "video" ? <span className="flex h-full items-center justify-center"><PlayCircle className="size-8" /></span> : <img src={entry.src} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" />}</button>)}</div> : null}
        </div>
        <div className="lg:sticky lg:top-24 lg:h-fit">
          {product.badge || product.popular ? <span className="inline-flex rounded-full bg-[#e9ede3] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#596d4e]">{product.badge || "Featured"}</span> : null}
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#78856c]">{product.category.replaceAll("-", " ")}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-4xl">{product.name}</h1>
          <a href="#customer-reviews" className="mt-4 inline-flex items-center gap-2 text-sm"><span className="flex text-[#a0782c]">{[1,2,3,4,5].map(n => <Star key={n} className={`size-4 ${n <= Math.round(rating) ? "fill-current" : ""}`} />)}</span><span className="text-[#73746c]">{rating > 0 ? rating.toFixed(1) : "No rating"}{count ? ` · ${count} reviews` : ""}</span></a>
          <div className="mt-5 flex flex-wrap items-center gap-3"><span className="text-2xl font-bold">{formatCurrency(product.price)}</span>{discount > 0 ? <><span className="text-sm text-[#96968e] line-through">{formatCurrency(product.compareAtPrice!)}</span><span className="rounded-full bg-[#e9ede3] px-2.5 py-1 text-xs font-bold text-[#58755a]">{discount}% OFF</span></> : null}</div>
          <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#64665e]">{product.description}</p>
          {product.brand ? <p className="mt-4 text-sm text-[#73746c]">Brand: <span className="font-semibold text-[#242521]">{product.brand}</span></p> : null}
          {product.sku ? <p className="mt-2 text-xs text-[#85867e]">Product code: {product.sku}</p> : null}
          <div className="mt-8 grid gap-3 sm:grid-cols-2"><button type="button" disabled={!product.available} onClick={() => { addItem(product); openCart(); }} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#2e4031] px-5 text-sm font-semibold text-white transition hover:bg-[#3c5540] disabled:cursor-not-allowed disabled:opacity-50"><ShoppingBag className="size-4" /> Add to cart</button><button type="button" disabled={!product.available} onClick={() => { addItem(product); openCart(); }} className="h-12 rounded-full border border-[#2e4031] px-5 text-sm font-semibold text-[#2e4031] transition hover:bg-[#edf1e8] disabled:opacity-50">Buy now</button></div>
          {!product.available ? <p className="mt-3 text-sm text-[#a34d4d]">Currently unavailable</p> : product.stock !== undefined && product.stock <= 5 && product.stock > 0 ? <p className="mt-3 text-sm text-[#a34d4d]">Only {product.stock} left in stock</p> : null}
          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-[#e7e6df] pt-5 text-xs text-[#73746c]"><div className="rounded-xl bg-white p-4">Secure checkout</div><div className="rounded-xl bg-white p-4">Delivery across India</div></div>
        </div>
      </div>
    </div>
    <section className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-14">
      <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#78856c]">Keep exploring</p><h2 className="mt-2 text-2xl font-medium sm:text-3xl">You may also like</h2></div>{related.length ? <span className="text-xs text-[#73746c]">Swipe to explore</span> : null}</div>
      {relatedQuery.isLoading ? <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4"><div className="aspect-[4/5] animate-pulse rounded-2xl bg-[#efeee8]" /><div className="aspect-[4/5] animate-pulse rounded-2xl bg-[#efeee8]" /></div> : related.length ? <div className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">{related.map(item => <Link key={item._id} to="/product/$productId" params={{ productId: item._id }} className="group w-[58%] shrink-0 snap-start sm:w-[30%] lg:w-[22%]"><div className="aspect-[4/5] overflow-hidden rounded-2xl bg-[#efeee8]"><img src={item.image || fallbackImage} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div><h3 className="mt-3 text-sm font-semibold">{item.name}</h3><p className="mt-1 text-sm font-bold">{formatCurrency(item.price)}</p></Link>)}</div> : <p className="mt-6 text-sm text-[#73746c]">More products coming soon.</p>}
    </section>
    <section id="customer-reviews" className="border-t border-[#e7e6df] bg-white">
      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-14">
        <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#78856c]">Customer feedback</p><h2 className="mt-2 text-2xl font-medium sm:text-3xl">Reviews for {product.name}</h2></div>
        <div className="mt-6 rounded-2xl bg-[#fbfaf7] p-5 sm:p-7"><div className="flex flex-wrap items-center gap-3"><span className="text-3xl font-semibold">{rating ? rating.toFixed(1) : "—"}</span><span className="flex text-[#a0782c]">{[1,2,3,4,5].map(n => <Star key={n} className={`size-5 ${n <= Math.round(rating) ? "fill-current" : ""}`} />)}</span><span className="text-sm text-[#73746c]">{count} product reviews</span></div></div>
        {reviewsQuery.isLoading ? <div className="mt-5 space-y-3"><div className="h-28 animate-pulse rounded-2xl bg-[#efeee8]" /><div className="h-28 animate-pulse rounded-2xl bg-[#efeee8]" /></div> : reviews.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{reviews.map(review => <article key={review._id} className="rounded-2xl border border-[#e9e8e1] bg-[#fbfaf7] p-5"><div className="flex text-[#a0782c]">{[1,2,3,4,5].map(n => <Star key={n} className={`size-4 ${n <= review.rating ? "fill-current" : ""}`} />)}</div><p className="mt-4 text-sm leading-6 text-[#55574f]">{review.comment}</p><div className="mt-5 border-t border-[#e9e8e1] pt-4"><p className="text-sm font-semibold">{review.authorName || review.user?.name || "Customer"}</p><p className="mt-1 text-xs text-[#85867e]">{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p></div></article>)}</div> : <p className="mt-5 rounded-2xl border border-dashed border-[#d9d9d0] p-8 text-center text-sm text-[#73746c]">No reviews for this product yet. Be the first to share your experience.</p>}
      </div>
    </section>
  </div>;
}
