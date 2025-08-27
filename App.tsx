import React, { useState, useMemo, useRef, useEffect } from 'react';

// Utility function to convert numbers to Indian currency words
const numberToWordsIndian = (num) => {
    if (num === 0) return 'Zero Rupees';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const toWords = (n, s) => {
        let str = '';
        if (n > 19) {
            str += tens[Math.floor(n / 10)] + ' ' + ones[n % 10];
        } else if (n > 9) {
            str += teens[n - 10];
        } else {
            str += ones[n];
        }
        if (n !== 0) {
            str += s;
        }
        return str.trim() + ' ';
    };

    let words = '';
    words += toWords(Math.floor(num / 10000000), 'Crore ');
    words += toWords(Math.floor((num / 100000) % 100), 'Lakh ');
    words += toWords(Math.floor((num / 1000) % 100), 'Thousand ');
    words += toWords(Math.floor((num / 100) % 10), 'Hundred ');

    if (num > 100 && num % 100 !== 0) {
        words += 'and ';
    }

    words += toWords(Math.floor(num % 100), '');

    const [integerPart, decimalPart] = num.toFixed(2).split('.');
    const paisa = parseInt(decimalPart, 10);
    
    let result = words.trim() + ' Rupees';
    if (paisa > 0) {
        result += ' and ' + toWords(paisa, '').trim() + ' Paise';
    }
    
    return result + ' Only';
};


// Main App Component
const App = () => {
    // State variables
    const [companyName, setCompanyName] = useState('SMARTFAM INDIA PRIVATE LIMITED');
    const [companyAddress, setCompanyAddress] = useState('4th Floor, 405, 2nd Block, Hrbr Layout, Kalyanagar Bengaluru - 560043 India');
    const [consultantName, setConsultantName] = useState('Gleide Menezes de Jesus');
    const [payPeriod, setPayPeriod] = useState('2025-08'); // YYYY-MM
    const [payDate, setPayDate] = useState('2025-09-01'); // YYYY-MM-DD
    
    const [grossFee, setGrossFee] = useState('178000');
    const [tdsPercentage, setTdsPercentage] = useState('10');

    const [paidDays, setPaidDays] = useState('22');
    const [lopDays, setLopDays] = useState('0');

    const [logoUrl, setLogoUrl] = useState(null);
    const [isGrossFeeFocused, setIsGrossFeeFocused] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [scriptsLoaded, setScriptsLoaded] = useState(false);

    const logoInputRef = useRef(null);
    const payslipRef = useRef(null);

    // Load external scripts for PDF generation
    useEffect(() => {
        let loadedCount = 0;
        const scripts = [
            { name: 'jspdf', src: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js' },
            { name: 'html2canvas', src: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js' }
        ];

        scripts.forEach(scriptInfo => {
            if (document.getElementById(scriptInfo.name)) {
                loadedCount++;
                if(loadedCount === scripts.length) setScriptsLoaded(true);
                return;
            }
            const script = document.createElement('script');
            script.id = scriptInfo.name;
            script.src = scriptInfo.src;
            script.async = true;
            script.onload = () => {
                loadedCount++;
                if (loadedCount === scripts.length) {
                    setScriptsLoaded(true);
                }
            };
            script.onerror = () => {
                setErrorMessage(`Failed to load ${scriptInfo.name}. Please check your internet connection.`);
            };
            document.body.appendChild(script);
        });
    }, []);


    // Memoized calculations for performance
    const grossFeeNum = useMemo(() => parseFloat(grossFee) || 0, [grossFee]);
    const tdsPercentageNum = useMemo(() => parseFloat(tdsPercentage) || 0, [tdsPercentage]);
    const tdsAmount = useMemo(() => (grossFeeNum * tdsPercentageNum) / 100, [grossFeeNum, tdsPercentageNum]);
    const netPayable = useMemo(() => grossFeeNum - tdsAmount, [grossFeeNum, tdsAmount]);
    const amountInWords = useMemo(() => numberToWordsIndian(netPayable), [netPayable]);

    // Format currency to Indian standard
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount).replace('₹', 'Rs.');
    };

    // Handle logo file upload
    const handleLogoUpload = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // PDF download handler
    const handleDownloadPdf = async () => {
        const payslipElement = payslipRef.current;
        if (!payslipElement || isGeneratingPdf || !scriptsLoaded) {
            if (!scriptsLoaded) {
                setErrorMessage("PDF libraries are still loading. Please wait a moment and try again.");
            }
            return;
        }

        setIsGeneratingPdf(true);
        setErrorMessage('');

        try {
            const { jsPDF } = window.jspdf;
            const html2canvas = window.html2canvas;

            if (!jsPDF || !html2canvas) {
                throw new Error("PDF generation libraries are not available.");
            }
            
            // Temporarily hide the download button so it's not in the PDF
            const downloadBtnContainer = document.getElementById('download-btn-container');
            if(downloadBtnContainer) downloadBtnContainer.style.visibility = 'hidden';

            const canvas = await html2canvas(payslipElement, {
                scale: 2,
                useCORS: true,
                onclone: (clonedDoc) => {
                    // This logic replaces input fields with static text for the PDF snapshot
                    const originalElements = payslipElement.querySelectorAll('input, textarea');
                    const clonedElements = clonedDoc.querySelectorAll('input, textarea');

                    originalElements.forEach((originalEl, index) => {
                        const clonedEl = clonedElements[index];
                        if (!clonedEl) return;
                        
                        const replacement = clonedDoc.createElement('div');
                        const style = window.getComputedStyle(originalEl);

                        Array.from(style).forEach(key => {
                            replacement.style.setProperty(key, style.getPropertyValue(key), style.getPropertyPriority(key));
                        });

                        replacement.style.display = 'flex';
                        const isTextarea = originalEl.tagName.toLowerCase() === 'textarea';
                        replacement.style.alignItems = isTextarea ? 'flex-start' : 'center';

                        const textAlign = style.getPropertyValue('text-align');
                        replacement.style.justifyContent = textAlign === 'right' ? 'flex-end' : (textAlign === 'center' ? 'center' : 'flex-start');
                        
                        let value = originalEl.value;
                        // Special handling for the gross fee input to use the formatted value
                        if (originalEl.id === 'gross-fee-input') {
                             // Remove formatting commas before parsing to get the correct number
                            const numericValue = parseFloat(value.replace(/,/g, ''));
                            replacement.textContent = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
                        } else if (originalEl.type === 'month' && value) {
                            const [year, month] = value.split('-');
                            const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
                            replacement.textContent = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                        } else if (originalEl.type === 'date' && value) {
                            const date = new Date(value);
                            const userTimezoneOffset = date.getTimezoneOffset() * 60000;
                            const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
                            replacement.textContent = adjustedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
                        } else {
                            replacement.textContent = value;
                        }

                        if (isTextarea) replacement.style.whiteSpace = 'pre-wrap';
                        
                        clonedEl.parentNode?.replaceChild(replacement, clonedEl);
                    });
                },
            });

            // Restore visibility of the download button
            if(downloadBtnContainer) downloadBtnContainer.style.visibility = 'visible';

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            // Create the custom filename
            const [year, month] = payPeriod.split('-');
            const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
            const monthName = date.toLocaleString('en-US', { month: 'long' });
            const consultantNameForFile = consultantName.replace(/\s/g, '_');
            const fileName = `${consultantNameForFile}_${monthName}.pdf`;
            
            pdf.save(fileName);

        } catch (error) {
            console.error("Error generating PDF:", error);
            setErrorMessage(error.message || "An error occurred while generating the PDF.");
            // Restore button visibility on error
            const downloadBtnContainer = document.getElementById('download-btn-container');
            if(downloadBtnContainer) downloadBtnContainer.style.visibility = 'visible';
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // JSX for the component
    return (
        <div className="bg-gray-100 min-h-screen font-sans flex flex-col items-center justify-start p-4 sm:p-8 gap-8">
            {errorMessage && (
                <div className="w-full max-w-5xl bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{errorMessage}</span>
                    <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setErrorMessage('')}>
                        <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                    </span>
                </div>
            )}
            <div ref={payslipRef} className="w-full max-w-5xl bg-white shadow-2xl rounded-xl p-6 sm:p-10">
                {/* Header */}
                <header className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-4 w-full sm:w-2/3">
                        <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                        <div 
                            className="bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-colors flex-shrink-0"
                            onClick={() => logoInputRef.current?.click()}
                            aria-label="Upload company logo"
                            role="button"
                            tabIndex={0}
                        >
                            {logoUrl ? 
                                <img src={logoUrl} alt="Company Logo" className="w-14 h-14 rounded-full object-cover" />
                                :
                                <div className="w-14 h-14 p-2">
                                    <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.5-3.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-2.5-6C9.46 10.5 7.5 8.54 7.5 6h9c0 2.54-1.96 4.5-4.5 4.5z"/>
                                    </svg>
                                </div>
                            }
                        </div>
                        <div className="flex-grow">
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="text-xl sm:text-2xl font-bold text-gray-800 p-1 -ml-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent border-none w-full"
                            />
                            <textarea
                                value={companyAddress}
                                onChange={(e) => setCompanyAddress(e.target.value)}
                                className="text-xs text-gray-500 w-full p-1 -ml-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent border-none mt-1 resize-none"
                                rows={2}
                            />
                        </div>
                    </div>
                    <div className="text-right mt-4 sm:mt-0 flex-shrink-0">
                        <p className="text-sm text-gray-500">Payslip For the Month</p>
                        <input
                            type="month"
                            value={payPeriod}
                            onChange={(e) => setPayPeriod(e.target.value)}
                            className="text-lg font-semibold text-gray-800 text-right p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent border-none"
                        />
                    </div>
                </header>

                {/* Main Content */}
                <main className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Consultant Summary */}
                    <div className="md:col-span-2">
                        <h2 className="text-sm font-bold text-gray-500 tracking-widest uppercase mb-4">CONSULTANT SUMMARY</h2>
                        <div className="space-y-3 text-sm">
                            <SummaryField label="Consultant Name" value={consultantName} onChange={setConsultantName} />
                            <SummaryField label="Pay Period" type="month" value={payPeriod} onChange={setPayPeriod} />
                            <SummaryField label="Pay Date" type="date" value={payDate} onChange={setPayDate} />
                        </div>
                    </div>

                    {/* Net Pay Box */}
                    <div className="md:col-span-1 bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col justify-center">
                        <div className="flex items-start">
                             <div className="h-8 w-1 bg-green-400 rounded-full mr-3 mt-2"></div>
                             <div>
                                <p className="text-sm text-gray-600 mb-1">Total Net Pay</p>
                                <p className="text-3xl font-bold text-gray-800">{formatCurrency(netPayable)}</p>
                            </div>
                        </div>
                         <div className="mt-4 border-t border-green-200 pt-4 text-sm space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Paid Days</span>
                                <div className="flex items-center">
                                    <span className="text-gray-500 mr-2">:</span>
                                    <input
                                        type="text"
                                        value={paidDays}
                                        onChange={(e) => setPaidDays(e.target.value.replace(/[^0-9]/g, ''))}
                                        className="w-16 font-semibold text-gray-800 text-right p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent border-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">LOP Days</span>
                                 <div className="flex items-center">
                                    <span className="text-gray-500 mr-2">:</span>
                                    <input
                                        type="text"
                                        value={lopDays}
                                        onChange={(e) => setLopDays(e.target.value.replace(/[^0-9]/g, ''))}
                                        className="w-16 font-semibold text-gray-800 text-right p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent border-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Earnings & Deductions */}
                <section className="mt-10 border-t border-gray-200 pt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        {/* Earnings Column */}
                        <div>
                            <div className="flex justify-between items-baseline mb-3">
                                <h3 className="text-sm font-bold text-gray-500 tracking-widest uppercase">EARNINGS</h3>
                                <h3 className="text-sm font-bold text-gray-500 tracking-widest uppercase">AMOUNT</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center py-2 border-b border-dotted">
                                    <span className="text-sm text-gray-700">Gross Monthly Consultancy Fee</span>
                                    <input 
                                        id="gross-fee-input"
                                        type="text" 
                                        value={isGrossFeeFocused ? grossFee : new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grossFeeNum)} 
                                        onFocus={() => setIsGrossFeeFocused(true)}
                                        onBlur={() => setIsGrossFeeFocused(false)}
                                        onChange={(e) => setGrossFee(e.target.value.replace(/[^0-9.]/g, ''))}
                                        className="text-sm font-semibold text-gray-800 text-right p-1 w-32 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent border-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-300">
                                <span className="text-sm font-bold text-gray-800">Gross Earnings</span>
                                <span className="text-sm font-bold text-gray-800">{formatCurrency(grossFeeNum)}</span>
                            </div>
                        </div>

                        {/* Deductions Column */}
                        <div>
                            <div className="flex justify-between items-baseline mb-3">
                                <h3 className="text-sm font-bold text-gray-500 tracking-widest uppercase">DEDUCTIONS</h3>
                                <h3 className="text-sm font-bold text-gray-500 tracking-widest uppercase">AMOUNT</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center py-2 border-b border-dotted">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-700">TDS</span>
                                        <input 
                                            type="text" 
                                            value={tdsPercentage} 
                                            onChange={(e) => setTdsPercentage(e.target.value.replace(/[^0-9.]/g, ''))}
                                            className="text-xs font-semibold text-gray-600 p-1 w-14 border-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center bg-transparent"
                                        />
                                         <span className="text-xs text-gray-500">%</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800 text-right">{formatCurrency(tdsAmount)}</span>
                                </div>
                            </div>
                             <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-300">
                                <span className="text-sm font-bold text-gray-800">Total Deductions</span>
                                <span className="text-sm font-bold text-gray-800">{formatCurrency(tdsAmount)}</span>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Footer Summary */}
                <footer className="mt-10">
                    <div className="bg-gray-50 p-4 rounded-lg flex flex-wrap justify-between items-center gap-4">
                        <div>
                            <p className="font-bold text-gray-800">TOTAL NET PAYABLE</p>
                            <p className="text-xs text-gray-500">Gross Earnings - Total Deductions</p>
                        </div>
                        <p className="text-xl font-bold text-gray-800">{formatCurrency(netPayable)}</p>
                    </div>

                     <div className="mt-6 text-sm text-right text-gray-700">
                        <span className="font-semibold">Amount In Words :</span> {amountInWords}
                    </div>
                    
                    <div className="mt-16 text-center text-xs text-gray-400">
                        -- This is a system-generated document. --
                    </div>
                </footer>
            </div>
            
            {/* Download Button - Placed outside the printable area */}
            <div id="download-btn-container" className="mt-[-2rem] mb-8 flex justify-center">
                <button
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf || !scriptsLoaded}
                    className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg disabled:bg-blue-300 disabled:cursor-not-allowed disabled:scale-100 flex items-center gap-2"
                >
                     {isGeneratingPdf ? (
                        <>
                         <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                         Generating...
                        </>
                    ) : 'Download PDF'}
                </button>
            </div>
        </div>
    );
};

// Sub-component for summary fields
const SummaryField = ({ label, value, onChange, type = 'text' }) => {
    return (
        <div className="flex items-center">
            <span className="w-32 text-gray-500 flex-shrink-0">{label}</span>
            <span className="mx-2 text-gray-400">:</span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="font-semibold text-gray-800 flex-1 p-1 -ml-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent border-none"
            />
        </div>
    );
};

export default App;
