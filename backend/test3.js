const map = { eng: "en", hin: "hi", fre: "fr", ger: "de", spa: "es", ita: "it", por: "pt", rus: "ru", chi: "zh", jpn: "ja", ara: "ar", mar: "mr", ben: "bn" };
const tests = ["eng", "chi", "por", "fre"];
for (let lang of tests) {
  console.log(map[lang] || lang.substring(0,2));
}
