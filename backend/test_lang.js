const axios = require("axios");
(async () => {
    try {
        const url = "https://openlibrary.org/search.json?subject=fiction&limit=5&has_fulltext=true";
        const response = await axios.get(url);
        response.data.docs.forEach(doc => {
            console.log(doc.language);
        });
    } catch(e) {
        console.error("Error:", e);
    }
})();
