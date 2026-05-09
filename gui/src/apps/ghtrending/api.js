// ghtrending 请求层

const BASE = '/apps/ghtrending';

const req = async (p, o) => (await fetch(`${BASE}/${p}`, o)).json();
const json = (body) => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
});

export const listRepos = (since, language) =>
    req(`list?since=${since}&language=${language}`);
export const checkAnalyses = (ids) => req('check', json({ ids }));
export const analyzeRepo = (repo) => req('analyze', json({ repo }));
export const digestList = (list) => req('digest', json({ list }));
export const getHistory = () => req('history');
