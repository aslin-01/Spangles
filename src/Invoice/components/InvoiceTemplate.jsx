import React from "react";

const InvoiceTemplate = ({ record, currency, numberToWords, formatDateDisplay, pdfNumber, computeItemTax, calculatedTotal }) => {
  const { from, to, items, number, date, discountPercent, showDiscount, roundOff, additionalInfo, showAdditionalInfo } = record;

  const getTaxDetails = (item) => computeItemTax(item.amount, item.gstPercent);

  const finalTotal = calculatedTotal;

  return (
    <div
      className="w-[800px] mx-auto bg-white p-10 text-gray-800 relative overflow-hidden"
      style={{
        minHeight: "1132px", // Precise A4 aspect ratio height for 800px width
        fontFamily: "'Inter', 'Roboto', sans-serif",
      }}
    >
      {/* Top Right Triangles */}
      <div className="absolute top-0 right-0 w-[260px] h-[260px] pointer-events-none z-0">
        {/* LIGHT TRIANGLE (top-most corner cut) */}
        <div className="absolute top-0 right-0 w-[160px] h-[160px] bg-[#a6a6a6] rotate-45 translate-x-[80px] -translate-y-[80px] z-[1]" />
        {/* DARK TRIANGLE (slightly lower & left) */}
        <div className="absolute top-0 right-0 w-[180px] h-[180px] bg-[#2f4858] rotate-45 translate-x-[120px] translate-y-[10px] z-[2]" />
      </div>

      <div className="relative z-10 pt-4">
        {/* Company Header */}
        <div className="text-center mb-16 flex justify-center">
          <img src="/logo.png" alt="Spanglez WebX Logo" className="h-16 object-contain" />
        </div>

        {/* Invoice Details */}
        <div className="flex justify-between items-start mb-10 px-2">
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-widest text-[#345261] mb-6">INVOICE</h2>
            <p className="text-medium font-bold text-gray-700">Invoice No: <span className="font-normal text-gray-600 ml-2">{number}</span></p>
            <p className="text-medium font-bold text-gray-700">Date Issued: <span className="font-normal text-gray-600 ml-2">{formatDateDisplay(date)}</span></p>
          </div>

          <div className="text-left pr-12 min-w-[170px]">
            <h2 className="text-medium font-bold text-gray-700 mb-3">Issued to:</h2>
            <div className="text-sm text-gray-600 font-medium leading-relaxed">
              <p className="font-bold text-gray-800">{to.name}</p>
              {to.address && <p className="whitespace-pre-line">{to.address}</p>}
              {to.phone && <p>{to.phone}</p>}
              {to.email && <p>{to.email}</p>}
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="w-full border-2 border-gray-700 mt-8 flex flex-col h-[550px] relative bg-white">

          {/* Vertical Lines for body (hidden behind header and total via z-index) */}
          <div className="absolute top-0 bottom-0 left-[100px] w-px bg-gray-700 z-0"></div>
          <div className="absolute top-0 bottom-0 right-[200px] w-px bg-gray-700 z-0"></div>

          {/* Table Header */}
          <div className="grid grid-cols-[100px_1fr_200px] bg-[#345261] text-white text-[15px] font-bold tracking-widest uppercase relative z-10 border-b-2 border-gray-700 pb-4">
            <div className="py-3 flex items-center justify-center border-r border-gray-700 leading-none">S.NO</div>
            <div className="py-3 flex items-center justify-center border-r border-gray-700 leading-none">DESCRIPTION</div>
            <div className="py-3 flex items-center justify-center leading-none">PRICE</div>
          </div>

          {/* Body Content */}
          <div className="flex-1 p-0 z-10 relative">
            {items.map((item, index) => {
              const tax = getTaxDetails(item);
              return (
                <div key={index} className="grid grid-cols-[100px_1fr_200px] gap-0 pt-6">
                  <div className="text-sm text-gray-700 text-center font-bold">
                    {index + 1}
                  </div>
                  <div className="text-sm text-gray-800 px-6 flex justify-start">
                    <div className="inline-block text-center">
                      <div className="font-bold text-gray-800 uppercase tracking-wide">{item.name}</div>
                      {item.description && <div className="text-[12px] text-black mt-1 uppercase tracking-wider whitespace-pre-line">{item.description}</div>}
                      {item.gstPercent && (
                        <div className="text-[12px] text-black mt-1 uppercase tracking-wider">
                          INCL. GST ({item.gstPercent}%) - {currency(tax.gst)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-800 text-center font-bold">
                    {pdfNumber(tax.total)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Section */}
          <div className="border-t-2 border-gray-700 grid grid-cols-[100px_1fr_200px] py-4 bg-white relative z-10">
            <div></div>
            <div className="text-end pr-8">
              <span className="text-[18px] font-bold tracking-widest uppercase text-[#345261]">TOTAL</span>
            </div>
            <div className="text-center">
              <span className="text-sm font-bold text-black">{currency(finalTotal)}/-</span>
            </div>
          </div>
        </div>

        {/* Note Section */}
        <div className="mt-8 px-2 flex items-end">
          <p className="text-[20px] font-bold text-gray-700 mr-2 whitespace-nowrap">Note :</p>
          <div className="text-sm text-black font-medium leading-relaxed">
            {showAdditionalInfo && additionalInfo ? (
              additionalInfo.split('\n').map((line, i) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return <br key={i} />;
                const colonIndex = trimmedLine.indexOf(':');
                if (colonIndex !== -1 && colonIndex < 30) {
                  return (
                    <p key={i}>
                      <span className="font-bold text-gray-700">{trimmedLine.substring(0, colonIndex + 1)}</span>
                      {trimmedLine.substring(colonIndex + 1)}
                    </p>
                  );
                }
                return <p key={i}>{trimmedLine}</p>;
              })
            ) : ""}
          </div>
        </div>
      </div>

      {/* Bottom Left Triangles */}
      <div className="absolute bottom-0 left-0 w-[260px] h-[260px] pointer-events-none z-0">
        {/* LIGHT TRIANGLE (bottom-most corner cut) */}
        <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-[#a6a6a6] rotate-45 -translate-x-[20px] translate-y-[110px] z-[2]" />
        {/* DARK TRIANGLE (slightly higher & left) */}
        <div className="absolute bottom-0 left-0 w-[100px] h-[100px] bg-[#2f4858] rotate-45 -translate-x-[90px] translate-y-[20px] z-[1]" />
      </div>
    </div>
  );
};

export default InvoiceTemplate;
