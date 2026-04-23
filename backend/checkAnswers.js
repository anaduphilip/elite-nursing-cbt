const mammoth = require('mammoth');
const path = require('path');

async function checkFile() {
  const filePath = 'C:\\Users\\user\\Desktop\\questions\\101-202 CARDIOVASCULAR NURSING (RICHARD).docx';
  
  const result = await mammoth.extractRawText({ path: filePath });
  const content = result.value;
  
  // Get last 2000 characters (where answer key usually is)
  const lastPart = content.slice(-3000);
  console.log('LAST 3000 CHARACTERS OF FILE:\n');
  console.log(lastPart);
}

checkFile();