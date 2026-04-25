const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function debugMissingQuestions() {
  const folderPath = 'C:\\Users\\user\\Desktop\\questions\\public-health';
  const files = fs.readdirSync(folderPath);
  const docxFiles = files.filter(f => f.endsWith('.docx'));
  
  // Find the Batch_1 file
  const targetFile = docxFiles.find(f => f.includes('Batch_1'));
  if (!targetFile) {
    console.log('Batch_1 file not found');
    return;
  }
  
  const filePath = path.join(folderPath, targetFile);
  console.log('Analyzing file:', targetFile);
  console.log('');
  
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  
  // Show first 500 characters to see formatting
  console.log('=== FIRST 500 CHARACTERS ===');
  console.log(text.substring(0, 500));
  console.log('');
  
  // Count patterns
  const qPattern = /Q(\d+)\./g;
  let match;
  let questionCount = 0;
  while ((match = qPattern.exec(text)) !== null) {
    questionCount++;
  }
  
  console.log('Total Q patterns found:', questionCount);
  
  // Check specific numbers
  for (let i = 1; i <= 250; i++) {
    const regex = new RegExp(`Q${i}\\.`, 'i');
    if (!regex.test(text)) {
      console.log(`Missing Q${i}`);
      if (i > 10) break;
    }
  }
  
  // Look at the end to see answer key format
  console.log('');
  console.log('=== LAST 1000 CHARACTERS ===');
  console.log(text.slice(-1000));
}

debugMissingQuestions().catch(console.error);