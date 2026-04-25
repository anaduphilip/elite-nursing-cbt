const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function debugFile() {
  const filePath = 'C:\\Users\\user\\Desktop\\questions\\public-health\\Batch_5_Maternal_Newborn_and_Child_Health_in_the_Community.docx';
  
  console.log('Reading file...');
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  
  // Find all question lines
  const lines = text.split('\n');
  console.log('\n=== FIRST 50 LINES THAT CONTAIN Q ===\n');
  
  let qLines = [];
  for (let i = 0; i < Math.min(lines.length, 200); i++) {
    if (lines[i].includes('Q')) {
      console.log(`Line ${i}: ${lines[i].substring(0, 200)}`);
      qLines.push(lines[i]);
    }
  }
  
  console.log(`\n=== Found ${qLines.length} lines with Q ===`);
  
  // Also show how options are formatted
  console.log('\n=== OPTION FORMAT EXAMPLE ===\n');
  for (let line of qLines.slice(0, 5)) {
    console.log(line);
  }
}

debugFile().catch(console.error);