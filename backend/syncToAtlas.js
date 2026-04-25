const { exec } = require('child_process');
const path = require('path');

const MONGODB_URI = 'mongodb+srv://anaduphilip090_db_user:vpPyvn5OLz9QRrlc@cluster0.jrviuka.mongodb.net/quizzapp';

async function syncToAtlas() {
  console.log('🔄 Syncing local database to MongoDB Atlas...\n');
  
  // Step 1: Export from local
  console.log('📤 Exporting from local database...');
  exec('"C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongoexport.exe" --db quizapp --collection quizzes --out C:\\Users\\user\\Desktop\\all-quizzes.json', (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Export error: ${error}`);
      return;
    }
    console.log('✅ Export completed\n');
    
    // Step 2: Import to Atlas
    console.log('📥 Importing to MongoDB Atlas...');
    exec(`"C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongoimport.exe" --uri "${MONGODB_URI}" --collection quizzes --file C:\\Users\\user\\Desktop\\all-quizzes.json --drop`, (error2, stdout2, stderr2) => {
      if (error2) {
        console.error(`❌ Import error: ${error2}`);
        return;
      }
      console.log('✅ Import completed!\n');
      console.log('🎉 Your app is now updated! Refresh your browser.');
    });
  });
}

syncToAtlas();