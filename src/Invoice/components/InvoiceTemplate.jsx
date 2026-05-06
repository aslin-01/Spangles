import React from "react";

const InvoiceTemplate = ({
  record,
  currency,
  numberToWords,
  formatDateDisplay,
  pdfNumber,
  computeItemTax,
  calculatedTotal,
}) => {
  const {
    from,
    to,
    items,
    number,
    date,
    discountPercent,
    showDiscount,
    roundOff,
    additionalInfo,
    showAdditionalInfo,
  } = record;

  const getTaxDetails = (item) => computeItemTax(item.amount, item.gstPercent);

  const finalTotal = calculatedTotal;

  // DYNAMIC HEIGHT-BASED PAGINATION:
  // Instead of a fixed number, we estimate the height of each item (including long descriptions).
  // This ensures that if a description is very long, it automatically moves to the next page.
  const firstPageMaxHeight = 650; // Further increased to fit one more row on Page 1
  const otherPageMaxHeight = 890; // Further increased to fit one more row on Page 2+

  const itemChunks = [];
  let currentChunk = [];
  let currentHeight = 0;
  let isFirst = true;

  if (items && items.length > 0) {
    items.forEach((item) => {
      // Estimate height of this specific item row
      // We use a base height of 55 to account for padding (py-3 = 24px total) and name height
      let rowHeight = 55;

      if (item.name && item.name.length > 40) {
        rowHeight += Math.ceil(item.name.length / 40) * 15; // Extra height for wrapped names
      }

      if (item.description) {
        const lines = item.description.split("\n").length;
        // Each description line roughly takes 18px. We add buffer for wrapping.
        rowHeight += lines * 20;

        // If a single line is very long, it will wrap. We estimate this too.
        if (item.description.length / 50 > lines) {
          rowHeight +=
            (Math.floor(item.description.length / 50) - lines + 1) * 18;
        }
      }

      if (item.gstPercent) rowHeight += 25; // Space for GST info

      const limit = isFirst ? firstPageMaxHeight : otherPageMaxHeight;

      if (currentHeight + rowHeight > limit && currentChunk.length > 0) {
        itemChunks.push(currentChunk);
        currentChunk = [item];
        currentHeight = rowHeight;
        isFirst = false;
      } else {
        currentChunk.push(item);
        currentHeight += rowHeight;
      }
    });
    if (currentChunk.length > 0) itemChunks.push(currentChunk);
  } else {
    itemChunks.push([]);
  }

  const chunksToRender = itemChunks;

  // Calculate starting index for each chunk to keep Serial Numbers (S.NO) correct
  const chunkStartingIndices = [];
  let cumulativeIndex = 0;
  itemChunks.forEach((chunk) => {
    chunkStartingIndices.push(cumulativeIndex);
    cumulativeIndex += chunk.length;
  });

  return (
    <div className="flex flex-col gap-0">
      {chunksToRender.map((chunk, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === chunksToRender.length - 1;

        return (
          <div
            data-invoice-page="true"
            key={pageIndex}
            className="w-[800px] mx-auto bg-white p-10 text-gray-800 relative overflow-hidden"
            style={{
              minHeight: "1132px", // Precise A4 height
              fontFamily: "'Montserrat', sans-serif",
              pageBreakAfter: isLastPage ? "auto" : "always",
              overflow: "hidden",
            }}
          >
            <div className="relative z-10 pt-4">
              {/* Company Header */}
              <div className="text-center mb-16 flex justify-center">
                <img
                  src="/logo.png"
                  alt="Spanglez WebX Logo"
                  className="h-16 object-contain"
                />
              </div>

              {/* Invoice Details (Only on First Page) */}
              {isFirstPage && (
                <div className="flex justify-between items-start mb-10 px-2 min-h-[160px]">
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold tracking-widest text-[#345261] mb-6">
                      INVOICE
                    </h2>
                    <p className="text-medium font-bold text-gray-700">
                      Invoice No:{" "}
                      <span className="font-normal text-gray-600 ml-2">
                        {number}
                      </span>
                    </p>
                    <p className="text-medium font-bold text-gray-700">
                      Date Issued:{" "}
                      <span className="font-normal text-gray-600 ml-2">
                        {formatDateDisplay(date)}
                      </span>
                    </p>
                  </div>

                  <div className="text-left pr-12 min-w-[170px]">
                    <h2 className="text-medium font-bold text-gray-700 mb-3">
                      Issued to:
                    </h2>
                    <div className="text-sm text-gray-600 font-medium leading-relaxed">
                      <p className="font-bold text-gray-800">{to.name}</p>
                      {to.address && (
                        <p className="whitespace-pre-line">{to.address}</p>
                      )}
                      {to.phone && <p>{to.phone}</p>}
                      {to.email && <p>{to.email}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Table Area - Variable height to fill the page depending on available space */}
              <div
                className="w-full border-2 border-gray-700 mt-8 flex flex-col relative bg-white"
                style={{ minHeight: "150px" }}
              >
                {/* Table Header */}
                <div className="grid grid-cols-[100px_1fr_200px] bg-[#345261] text-white text-[15px] font-bold tracking-widest uppercase relative z-10 border-b-2 border-gray-700 pb-4">
                  <div className="py-3 flex items-center justify-center border-r border-gray-700 leading-none">
                    S.NO
                  </div>
                  <div className="py-3 flex items-center justify-center border-r border-gray-700 leading-none">
                    DESCRIPTION
                  </div>
                  <div className="py-3 flex items-center justify-center leading-none">
                    PRICE
                  </div>
                </div>

                <div className="flex-1 p-0 z-10 relative">
                  {chunk.map((item, index) => {
                    const tax = getTaxDetails(item);
                    const globalIndex = chunkStartingIndices[pageIndex] + index;
                    return (
                      <div
                        key={index}
                        className="grid grid-cols-[100px_1fr_200px] gap-0 min-h-[50px]"
                      >
                        <div className="text-sm text-gray-700 text-center font-bold px-2 py-3 break-words border-r border-gray-700 flex items-start justify-center">
                          {globalIndex + 1}
                        </div>
                        <div className="text-sm text-gray-800 px-6 py-3 flex justify-center items-center overflow-hidden border-r border-gray-700">
                          <div className="w-full text-center break-words">
                            <div className="font-bold text-gray-800 uppercase tracking-wide leading-tight">
                              {item.name}
                            </div>
                            {item.description && (
                              <div className="text-[12px] text-black mt-1 uppercase tracking-wider whitespace-pre-line leading-relaxed">
                                {item.description}
                              </div>
                            )}
                            {item.gstPercent && (
                              <div className="text-[12px] text-black mt-1 uppercase tracking-wider">
                                INCL. GST ({item.gstPercent}%) -{" "}
                                {currency(tax.gst)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-800 text-center font-bold px-2 py-3 break-words flex items-center justify-center">
                          {pdfNumber(tax.total)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total Section (Only on Last Page) */}
                {isLastPage && (
                  <div className="border-t-2 border-gray-700 grid grid-cols-[100px_1fr_200px] bg-white relative z-10">
                    <div className="border-r border-gray-700 py-2"></div>
                    <div className="text-end pr-8 border-r border-gray-700 py-2 flex items-center justify-end">
                      <span className="text-[18px] font-bold tracking-widest uppercase text-[#345261]">
                        TOTAL
                      </span>
                    </div>
                    <div className="text-center py-2 flex items-center justify-center">
                      <span className="text-sm font-bold text-black">
                        {currency(finalTotal)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Note Section (Only on Last Page) - Premium Minimalist Layout */}
              {isLastPage && (
                <div className="mt-12 relative z-10 px-8">
                  <div className="pt-2 flex flex-col gap-4">
                    <h4 className="text-[16px] font-black text-[#345261] uppercase tracking-[0.25em]">Note:</h4>
                    <div className="text-[14px] text-gray-700 leading-[1.8] font-medium max-w-[700px]">
                      {showAdditionalInfo && additionalInfo ? (
                        <div className="whitespace-pre-line">{additionalInfo}</div>
                      ) : (
                        <p className="text-gray-400 italic m-0">No additional notes provided for this invoice.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TOP RIGHT - EXACT MATCH TO BRANDING DESIGN */}
            <div className="absolute top-0 right-0 w-[300px] h-[500px] pointer-events-none z-0">
              {/* GRAY TRIANGLE (Top Corner) */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: "70px solid #a6a6a6",
                  borderLeft: "70px solid transparent",
                  position: "absolute",
                  top: 0,
                  right: 0,
                  zIndex: 1,
                }}
              />
              {/* DARK BLUE TRIANGLE (Rotated Version) */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: "90px solid transparent",
                  borderBottom: "90px solid transparent",
                  borderRight: "90px solid #2f4858",
                  position: "absolute",
                  top: 0,
                  right: 0,
                  zIndex: 2,
                }}
              />
            </div>

            {/* BOTTOM LEFT */}
            <div className="absolute bottom-0 left-0 w-[260px] h-[260px] pointer-events-none z-[9999]">
              <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-[#a6a6a6] rotate-45 -translate-x-[20px] translate-y-[110px] z-[2]" />

              <div className="absolute bottom-0 left-0 w-[100px] h-[100px] bg-[#2f4858] rotate-45 -translate-x-[90px] translate-y-[20px] z-[1]" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InvoiceTemplate;
