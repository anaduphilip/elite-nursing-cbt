const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function debugDocument() {
  const filePath = 'C:\\Users\\user\\Desktop\\questions\\1-100 CARDIOVASCULAR NURSING (RICHARD).docx';
  
  console.log('📖 Reading document...');
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  
  console.log('\n📝 First 2000 characters of the document:\n');
  console.log(text.substring(0, 2000));
  
  console.log('\n\n🔍 Looking for patterns...\n');
  
  // Check for Q1 pattern
  const lines = text.split('\n');
  let qCount = 0;
  for (let i = 0; i < Math.min(lines.length, 100); i++) {
    const line = lines[i].trim();
    if (line.match(/^Q\d+\./i)) {
      console.log(`Found: ${line.substring(0, 100)}`);
      qCount++;
    }
  }
  
  console.log(`\nFound ${qCount} question lines in first 100 lines`);
}

debugDocument().catch(console.error);