import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { menuService } from "@/services/menuService";
import type { MenuItem } from "@/lib/types";

export const Route = createFileRoute("/new-arrivals")({
  head: () => ({ meta: [
    { title: "New Arrivals — Lumora Curio" },
    { name: "description", content: "Discover the latest additions to the Lumora Curio collection." },
  ] }),
  component: NewArrivalsPage,
});

const fallbackImage = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85";

function NewArrivalsPage() {
  const { addItem, lines, increment, decrement } = useCart();
  const productsQuery = useQuery({ queryKey: ["menu", "new-arrivals"], queryFn: () => menuService.list(undefined, true) });
  const products = (productsQuery.data ?? []).filter((product) => product.available);

  return <main className="min-h-screen bg-[#fbfaf7] text-[#242521]">
    <section className="border-b border-[#e9e8e1] bg-[#f0f1e9]">
      <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-14">
        <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#718064]">Just added to the collection</p>
        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><h1 className="font-serif text-4xl font-normal tracking-[-.035em] sm:text-6xl">New arrivals.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-[#73746c] sm:text-base">Fresh finds, thoughtful details and the latest pieces selected for your everyday.</p></div>
          <Link to="/menu" className="inline-flex items-center gap-2 text-xs font-semibold text-[#43533d]">Explore the full collection <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 sm:py-12 lg:px-14">
      <div className="mb-7 flex items-center justify-between border-b border-[#e7e6df] pb-5"><div><p className="text-sm font-semibold">Recently added</p><p className="mt-1 text-xs text-[#85867e]">New pieces picked by our team</p></div><span className="rounded-full border border-[#e4e4db] bg-white px-4 py-2 text-xs text-[#62645c]">{products.length} products</span></div>
      {productsQuery.isLoading ? <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[1,2,3,4,5,6,7,8].map((n) => <div key={n} className="aspect-[4/5] animate-pulse rounded-2xl bg-[#f0efe9]" />)}</div> :
       productsQuery.isError ? <div className="rounded-2xl border border-dashed border-[#d9d9d0] bg-white p-10 text-center"><h2 className="text-lg font-semibold">New arrivals couldn't load</h2><p className="mt-2 text-sm text-[#73746c]">Please check your connection and try again.</p><button onClick={() => void productsQuery.refetch()} className="mt-4 rounded-full bg-[#242521] px-5 py-2.5 text-xs font-semibold text-white">Try again</button></div> :
       products.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 sm:gap-y-11 lg:grid-cols-4">{products.map((product: MenuItem) => {
         const line = lines.find((item) => item.itemId === product._id);
         return <article key={product._id} className="group min-w-0">
           <Link to="/menu" className="block"><div className="relative aspect-[4/4.7] overflow-hidden rounded-2xl bg-[#f0efe9]"><img src={product.image || fallbackImage} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" /><span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[9px] font-bold tracking-[.12em] text-[#34352e]">NEW</span></div><div className="pt-3"><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-[#85867e]">{product.category.replaceAll("-", " ")}</p><h2 className="mt-1.5 text-sm font-semibold leading-5 sm:text-base">{product.name}</h2><div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#a0782c]"><Star className="h-3 w-3 fill-current" /><span className="text-[#73746c]">{Number(product.rating ?? 0) > 0 ? Number(product.rating).toFixed(1) : "Just added"}</span></div><div className="mt-2 flex items-center gap-2"><span className="text-sm font-bold">₹{product.price.toLocaleString("en-IN")}</span>{product.compareAtPrice && product.compareAtPrice > product.price ? <span className="text-xs text-[#96968e] line-through">₹{product.compareAtPrice.toLocaleString("en-IN")}</span> : null}</div></div></Link>
           {line ? <div className="mt-3 flex h-11 items-center justify-between rounded-xl border border-[#2e4031] bg-white px-3 text-[#2e4031]"><button type="button" onClick={() => decrement(product._id)} className="flex h-8 w-8 items-center justify-center text-xl">−</button><span className="text-sm font-bold">{line.quantity}</span><button type="button" onClick={() => increment(product._id)} className="flex h-8 w-8 items-center justify-center text-xl">+</button></div> : <button type="button" onClick={() => addItem(product)} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2e4031] px-3 text-xs font-semibold text-white transition hover:bg-[#3c5540]"><Plus className="h-4 w-4" /> Add to cart</button>}
         </article>;
       })}</div> :
       <div className="rounded-2xl border border-dashed border-[#d9d9d0] bg-white px-5 py-14 text-center"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#78856c]">Coming soon</p><h2 className="mt-3 font-serif text-3xl">Something lovely is on its way.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#73746c]">Our latest finds will appear here as soon as they are selected. In the meantime, explore the full collection.</p><Link to="/menu" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2e4031] px-5 py-3 text-xs font-semibold text-white">Shop all <ArrowRight className="h-4 w-4" /></Link></div>}
    </section>
  </main>;
}
