import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Minus, ShoppingBag, Star } from "lucide-react";
import { menuService } from "@/services/menuService";
import { reviewService } from "@/services/reviewService";
import { useCart } from "@/context/CartContext";
import type { MenuItem } from "@/lib/types";

export const Route = createFileRoute("/product/$id")({ component: ProductPage });

const fallback = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85";

function ProductPage() {
  const { id } = Route.useParams();
  const productQuery = useQuery({ queryKey: ["product", id], queryFn: () => menuService.get(id) });
  const allQuery = useQuery({ queryKey: ["menu"], queryFn: () => menuService.list() });
  const reviewsQuery = useQuery({ queryKey: ["product-reviews", id], queryFn: () => reviewService.listForItem(id) });
  const { addItem, openCart } = useCart();
  const [mediaIndex, setMediaIndex] = useState(0);
  const product = productQuery.data;
  const media = useMemo(() => product ? [...(product.gallery ?? []).filter(Boolean), product.image].filter((url, index, arr) => Boolean(url) && arr.indexOf(url) === index).map(url => ({ type: "image" as const, url })).concat(product.videoUrl ? [{ type: "video" as const, url: product.videoUrl }] : []) : [], [product]);
  const related = (allQuery.data ?? []).filter(item => item.available && item._id !== id && (item.category === product?.category || item.popular)).slice(0, 12);
  const reviews = reviewsQuery.data?.reviews ?? [];
  if (productQuery.isLoading) return <div className="min-h-[70vh] animate-pulse bg-[#f0efe9]" />;
  if (!product || productQuery.isError) return <div className="mx-auto max-w-xl px-5 py-24 text-center"><h1 className="text-2xl font-semibold">Product not found</h1><Link to="/menu" className="mt-5 inline-block underline">Back to shop</Link></div>;
  const current = media[mediaIndex];
  const setIndex = (index: number) => setMediaIndex((index + media.length) % media.length);
  return <main className="bg-[#fbfaf7] text-[#242521]">
    <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-8 lg:px-14">
      <Link to="/menu" className="mb-5 inline-flex items-center gap-1 text-xs text-[#72746b]"><ChevronLeft className="h-4 w-4"/> Back to shop</Link>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <section>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f0efe9] sm:rounded-3xl">
            {current?.type === "video" ? <video src={current.url} controls playsInline className="h-full w-full object-contain bg-black" /> : <img src={current?.url || product.image || fallback} alt={product.name} className="h-full w-full object-contain" />}
            {media.length > 1 && current?.type !== "video" ? <><button aria-label="Previous media" onClick={() => setIndex(mediaIndex-1)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow"><ChevronLeft/></button><button aria-label="Next media" onClick={() => setIndex(mediaIndex+1)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow"><ChevronRight/></button></> : null}
            <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-xs text-white">{mediaIndex+1} / {media.length || 1}</span>
          </div>
          {media.length > 1 ? <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{media.map((m, i) => <button key={m.url+i} onClick={() => setIndex(i)} className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${i === mediaIndex ? "border-[#344b36]" : "border-transparent"}`}>{m.type === "video" ? <span className="grid h-full place-items-center bg-[#242521] text-xs text-white">VIDEO</span> : <img src={m.url} alt={`Product view ${i+1}`} className="h-full w-full object-cover"/>}</button>)}</div> : null}
        </section>
        <section className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#78856c]">{product.category?.replaceAll("-", " ")}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-[#a0782c]"><Star className="h-4 w-4 fill-current"/><span>{Number(product.rating ?? 0) ? Number(product.rating).toFixed(1) : "No ratings yet"}</span><span className="text-[#77786f]">({reviewsQuery.data?.count ?? 0} reviews)</span></div>
          <div className="mt-5 flex items-center gap-3"><span className="text-2xl font-bold">₹{product.price.toLocaleString("en-IN")}</span>{product.compareAtPrice && product.compareAtPrice > product.price ? <><span className="text-base text-[#888] line-through">₹{product.compareAtPrice.toLocaleString("en-IN")}</span><span className="rounded-full bg-[#e9ede3] px-2 py-1 text-xs font-bold text-[#52674d]">{Math.round((1-product.price/product.compareAtPrice)*100)}% off</span></> : null}</div>
          <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#62645c]">{product.description || "A thoughtfully selected find for everyday living."}</p>
          <div className="mt-7 flex gap-3"><button disabled={!product.available} onClick={() => addItem(product)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#344b36] px-4 py-3.5 text-sm font-semibold text-[#344b36] disabled:opacity-40"><Plus className="h-4 w-4"/> Add to cart</button><button disabled={!product.available} onClick={() => {addItem(product); openCart();}} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2e4031] px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-40"><ShoppingBag className="h-4 w-4"/> Buy now</button></div>
          {!product.available ? <p className="mt-3 text-sm text-red-600">Currently unavailable</p> : null}
          <div className="mt-8 border-t border-[#e6e5de] pt-5"><h2 className="text-sm font-semibold">Product details</h2><dl className="mt-3 space-y-2 text-sm text-[#62645c]">{product.brand ? <div className="flex justify-between"><dt>Brand</dt><dd>{product.brand}</dd></div> : null}{product.sku ? <div className="flex justify-between"><dt>SKU</dt><dd>{product.sku}</dd></div> : null}<div className="flex justify-between"><dt>Availability</dt><dd>{product.available ? "In stock" : "Out of stock"}</dd></div></dl></div>
        </section>
      </div>
      <section className="mt-16 border-t border-[#e6e5de] pt-10 sm:mt-20"><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#78856c]">More to explore</p><h2 className="mt-2 text-2xl font-semibold">You may also like</h2></div><Link to="/menu" className="text-xs font-semibold underline">Shop all</Link></div>
        {related.length ? <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-3">{related.map(item => <RelatedCard key={item._id} item={item}/>)}</div> : <p className="mt-5 text-sm text-[#77786f]">More products coming soon.</p>}
      </section>
      <section className="mt-16 border-t border-[#e6e5de] pt-10 sm:mt-20"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#78856c]">Customer feedback</p><h2 className="mt-2 text-2xl font-semibold">Reviews for {product.name}</h2><div className="mt-4 flex items-center gap-2"><span className="text-xl font-bold">{reviewsQuery.data?.average ?? 0}</span><span className="text-[#a0782c]">★★★★★</span><span className="text-sm text-[#77786f]">{reviewsQuery.data?.count ?? 0} reviews</span></div>
        {reviewsQuery.isLoading ? <p className="mt-6 text-sm text-[#77786f]">Loading reviews…</p> : reviews.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{reviews.map(review => <article key={review._id} className="rounded-2xl border border-[#e6e5de] bg-white p-5"><div className="text-[#a0782c]">{ "★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</div><p className="mt-3 text-sm leading-6 text-[#62645c]">{review.comment}</p><p className="mt-4 text-sm font-semibold">{review.authorName || review.user?.name || "Customer"}</p><p className="mt-1 text-xs text-[#888]">{new Date(review.createdAt).toLocaleDateString()}</p></article>)}</div> : <p className="mt-6 rounded-2xl border border-dashed border-[#deded5] p-6 text-sm text-[#77786f]">No reviews for this product yet.</p>}
      </section>
    </div>
  </main>;
}

function RelatedCard({ item }: { item: MenuItem }) {
  const { addItem, openCart } = useCart();
  return <article className="w-44 shrink-0 snap-start sm:w-56"><Link to="/product/$id" params={{id:item._id}} className="block"><div className="aspect-square overflow-hidden rounded-2xl bg-[#f0efe9]"><img src={item.image || fallback} alt={item.name} className="h-full w-full object-cover"/></div><h3 className="mt-3 line-clamp-2 text-sm font-semibold">{item.name}</h3><p className="mt-1 text-sm font-bold">₹{item.price.toLocaleString("en-IN")}</p></Link><button onClick={() => {addItem(item); openCart();}} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2e4031] py-2.5 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5"/>Add to cart</button></article>;
}
