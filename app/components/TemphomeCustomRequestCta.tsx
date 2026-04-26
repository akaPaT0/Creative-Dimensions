"use client";

import CustomRequestModal, { openCustomRequest } from "./CustomRequestModal";

type Props = {
  className?: string;
  productName?: string;
  productUrl?: string;
  buttonLabel?: string;
};

export default function TemphomeCustomRequestCta({
  className = "",
  productName = "Custom Order",
  productUrl = "https://creativedimensionslb.com/temphome",
  buttonLabel = "Request Custom",
}: Props) {
  return (
    <>
      <button
        type="button"
        onClick={() => openCustomRequest({ productName, productUrl })}
        className={className}
      >
        {buttonLabel}
      </button>

      <CustomRequestModal
        hideButton
        productName={productName}
        productUrl={productUrl}
      />
    </>
  );
}
