#!/usr/bin/env node

/**
 * PDF Generator for THC Dope Budz Advertisement
 * Creates a print-ready PDF from HTML
 */

import fs from 'fs';
import { exec } from 'child_process';

console.log('📄 Generating THC Dope Budz Advertisement PDF...');

// Check if we have the HTML file
const htmlFile = './thc-dope-budz-advert.html';
if (!fs.existsSync(htmlFile)) {
    console.error('❌ HTML advertisement file not found');
    process.exit(1);
}

console.log('✅ HTML file found, attempting PDF generation...');

// Try multiple PDF generation methods
const methods = [
    // Method 1: Use system tools if available
    'which google-chrome || which chromium-browser',
    // Method 2: Try headless chrome
    'google-chrome --headless --disable-gpu --print-to-pdf=thc-dope-budz-advert.pdf thc-dope-budz-advert.html',
    // Method 3: Try chromium
    'chromium-browser --headless --disable-gpu --print-to-pdf=thc-dope-budz-advert.pdf thc-dope-budz-advert.html'
];

function tryNextMethod(index = 0) {
    if (index >= methods.length) {
        console.log('📄 PDF generation tools not available. HTML file ready for manual conversion.');
        console.log('💡 You can:');
        console.log('   1. Open thc-dope-budz-advert.html in a browser');
        console.log('   2. Press Ctrl+P to print');
        console.log('   3. Save as PDF');
        console.log('   4. Use online HTML to PDF converters');
        return;
    }
    
    exec(methods[index], (error, stdout, stderr) => {
        if (error) {
            console.log(`⚠️  Method ${index + 1} failed, trying next...`);
            tryNextMethod(index + 1);
        } else {
            console.log('✅ PDF generated successfully: thc-dope-budz-advert.pdf');
        }
    });
}

tryNextMethod();