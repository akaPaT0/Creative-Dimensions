import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import LikeIconButton from "./LikeIconButton";
import CartIconButton from "./CartIconButton";

export type ProductCardData = {
  href: string;
  title: string;
  price: string;
  /** Small label above the name, e.g. category or subcategory. */
  label?: string;
  image: string;
  hoverImage?: string;
  isNew?: boolean;
  /** Has colour options; the cart icon opens the product page instead. */
  hasVariants?: boolean;
};

export default function ProductCard({
  item,
  className = "",
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw",
  actions,
  productId,
}: {
  item: ProductCardData;
  className?: string;
  sizes?: string;
  /** Extra controls over the image, e.g. like and wishlist buttons. */
  actions?: ReactNode;
  /** When set, shows like and add-to-cart buttons over the image. */
  productId?: string;
}) {
  return (
    <Link
      href={item.href}
      className={`group flex flex-col rounded-2xl border border-white/10 bg-[#161619]/90 hover:border-[#FF8B64]/40 transition-all duration-200 p-2.5 sm:p-3 shadow-md ${className}`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/40 border border-white/5">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className={`object-cover transition-all duration-300 group-hover:scale-[1.04] ${
            item.hoverImage ? "group-hover:opacity-0" : ""
          }`}
          sizes={sizes}
        />
        {item.hoverImage && (
          <Image
            src={item.hoverImage}
            alt=""
            aria-hidden="true"
            fill
            className="object-cover opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-[1.04]"
            sizes={sizes}
          />
        )}
        {item.isNew && (
          <span className="absolute left-2 top-2 rounded-full bg-[#FF8B64] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0D0D0D]">
            New
          </span>
        )}
        {productId && (
          <>
            <LikeIconButton productId={productId} positionClass="bottom-2 right-10" />
            <CartIconButton productId={productId} productName={item.title} needsChoice={item.hasVariants} />
          </>
        )}
        {actions}
      </div>

      <div className="mt-2.5 flex flex-1 flex-col">
        {item.label && (
          <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-white/40">
            {item.label}
          </span>
        )}
        <span className="mt-0.5 line-clamp-2 min-h-[2.5em] text-xs sm:text-sm font-semibold leading-tight text-white group-hover:text-[#FF8B64] transition-colors">
          {item.title}
        </span>
        <span className="mt-auto pt-1.5 text-xs sm:text-sm font-bold text-[#FF8B64]">
          {item.price}
        </span>
      </div>
    </Link>
  );
}
