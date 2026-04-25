const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function debugMidwifery() {
  const midwiferyPath = 'C:\\Users\\user\\Desktop\\questions\\midwifery';
  const files = fs.readdirSync(midwiferyPath);
  const docxFiles = files.filter(f => f.toLowerCase().endsWith('.docx'));
  
  if (docxFiles.length === 0) {
    console.log('No docx files found');
    return;
  }
  
  const firstFile = path.join(midwiferyPath, docxFiles[0]);
  console.log('Reading file:', docxFiles[0]);
  console.log('========================');
  
  const result = await mammoth.extractRawText({ path: firstFile });
  const text = result.value;
  
  // Show first 3000 characters to see the format
  console.log(text.substring(0, 3000));
}

debugMidwifery().catch(console.error);