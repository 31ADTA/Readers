const axios = require('axios');

async function checkGutenbergCors() {
  try {
    const res = await axios.options('https://www.gutenberg.org/files/1342/1342-0.txt');
    console.log("CORS headers:", res.headers);
  } catch(e) {
    if (e.response) {
      console.log("CORS headers:", e.response.headers);
    } else {
      console.log("Error:", e.message);
    }
  }
}
checkGutenbergCors();
