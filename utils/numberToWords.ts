
const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertToWords(num: number): string {
    if (num < 20) {
        return units[num];
    }
    if (num < 100) {
        return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + units[num % 10] : '');
    }
    if (num < 1000) {
        return units[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + convertToWords(num % 100) : '');
    }
    return '';
}

export function numberToWordsIndian(num: number): string {
    if (num === 0) return 'Zero';

    const strNum = Math.floor(num).toString();
    
    const crore = strNum.length > 7 ? strNum.slice(0, -7) : '';
    const lakh = strNum.length > 5 ? strNum.slice(-7, -5) : '';
    const thousand = strNum.length > 3 ? strNum.slice(-5, -3) : '';
    const hundreds = strNum.slice(-3);

    let words = '';
    if (crore) {
        words += convertToWords(parseInt(crore)) + ' Crore ';
    }
    if (lakh) {
        words += convertToWords(parseInt(lakh)) + ' Lakh ';
    }
    if (thousand) {
        words += convertToWords(parseInt(thousand)) + ' Thousand ';
    }
    if (hundreds) {
        words += convertToWords(parseInt(hundreds));
    }

    const decimalPart = Math.round((num - Math.floor(num)) * 100);
    if (decimalPart > 0) {
        words += ' and ' + convertToWords(decimalPart) + ' Paise';
    }

    return `Indian Rupee ${words.trim()} Only`;
}
