const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://localhost:8000/api/books?category=fiction');
    console.log(res.data);
  } catch (e) {
    if (e.response) console.log(e.response.data);
    else console.log(e.message);
  }
}
test();
