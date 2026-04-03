const CG_API = "https://api.coingecko.com/api/v3";

const detail = async ({ id }) => {
  if (!id) return { status: 400, message: "id is required" };
  const [info, chart] = await Promise.all([
    fetch(`${CG_API}/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`).then((r) => r.json()),
    fetch(`${CG_API}/coins/${id}/market_chart?vs_currency=usd&days=7`).then((r) => r.json())
  ]);
  return {
    success: true,
    coin: {
      id: info.id, symbol: info.symbol, name: info.name, image: info.image?.large,
      price: info.market_data?.current_price?.usd,
      marketCap: info.market_data?.market_cap?.usd,
      rank: info.market_cap_rank,
      change24h: info.market_data?.price_change_percentage_24h,
      change7d: info.market_data?.price_change_percentage_7d,
      high24h: info.market_data?.high_24h?.usd,
      low24h: info.market_data?.low_24h?.usd,
      ath: info.market_data?.ath?.usd,
      athDate: info.market_data?.ath_date?.usd,
      description: info.description?.en?.slice(0, 500) || ''
    },
    chart: (chart.prices || []).map(([t, p]) => ({ t, p }))
  };
};

export { detail };
