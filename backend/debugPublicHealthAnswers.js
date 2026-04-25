const mammoth = require('mammoth');

async function debugAnswers() {
  const filePath = 'C:\\Users\\user\\Desktop\\questions\\public-health\\Batch_2_Epidemiology_and_Disease_Surveillance.docx';
  
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  
  // Show the last 3000 characters where answer key is
  console.log('=== LAST 3000 CHARACTERS ===\n');
  console.log(text.slice(-3000));
  
  // Count how many Q patterns are in the answer key
  const answerPattern = /Q(\d+)[\.\s:]*\s*([a-d])/gi;
  let count = 0;
  let match;
  while ((match = answerPattern.exec(text.slice(-5000))) !== null) {
    count++;
  }
  console.log(`\nFound ${count} answer entries in last 5000 characters`);
}

debugAnswers().catch(console.error);