const CG_API = "https://api.coingecko.com/api/v3";

const list = async ({ currency = "usd", limit = 50 } = {}) => {
  const res = await fetch(
    `${CG_API}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=1h,24h,7d`
  );
  if (!res.ok) throw new Error(`CoinGecko API error ${res.status}`);
  const data = await res.json();
  return {
    success: true,
    coins: data.map((c) => ({
      id: c.id, symbol: c.symbol, name: c.name, image: c.image,
      price: c.current_price, marketCap: c.market_cap, rank: c.market_cap_rank,
      change1h: c.price_change_percentage_1h_in_currency,
      change24h: c.price_change_percentage_24h_in_currency,
      change7d: c.price_change_percentage_7d_in_currency,
      sparkline: c.sparkline_in_7d?.price || [],
      high24h: c.high_24h, low24h: c.low_24h, volume: c.total_volume
    }))
  };
};

export { list };
