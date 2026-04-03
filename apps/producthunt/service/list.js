const PH_URL = "https://www.producthunt.com";

const extractProducts = (html) => {
  const products = [];
  const regex = /"name":"([^"]+)"[^}]*?"tagline":"([^"]+)"[^}]*?"slug":"([^"]+)"[^}]*?"votesCount":(\d+)/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    products.push({ name: match[1], tagline: match[2], slug: match[3], votes: Number(match[4]), url: `${PH_URL}/posts/${match[3]}` });
  }
  const seen = new Set();
  return products.filter((p) => { if (seen.has(p.slug)) return false; seen.add(p.slug); return true; }).slice(0, 20);
};

const list = async () => {
  const res = await fetch(PH_URL, { headers: { "User-Agent": "Mozilla/5.0 (compatible; AIOS/1.0)", Accept: "text/html" } });
  if (!res.ok) throw new Error(`ProductHunt fetch error ${res.status}`);
  const html = await res.text();
  const products = extractProducts(html);
  return { success: true, products };
};

export { list };
