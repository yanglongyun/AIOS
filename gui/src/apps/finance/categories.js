// Heuristic categorization: maps a transaction note + type to a display category.
// Pure presentation — the database doesn't store category, we infer it on the client.
//
// Rules are deliberately ordered: more specific keywords first.

const RULES = [
    { key: 'housing',      icon: '🏠', labelKey: '__T_FINANCE_CAT_HOUSING__',      kw: ['房租', '租金', '物业', '房贷', '水电', 'rent'] },
    { key: 'utilities',    icon: '💡', labelKey: '__T_FINANCE_CAT_UTILITIES__',    kw: ['电费', '水费', '煤气', '燃气', '宽带', '网费', '话费', 'utility'] },
    { key: 'groceries',    icon: '🛒', labelKey: '__T_FINANCE_CAT_GROCERIES__',    kw: ['超市', '生鲜', '买菜', '蔬菜', '水果', '日用', '永辉', '盒马', '沃尔玛', 'grocery', 'market'] },
    { key: 'dining',       icon: '🍲', labelKey: '__T_FINANCE_CAT_DINING__',       kw: ['餐', '饭', '外卖', '聚餐', '火锅', '海底捞', '烤肉', '麦当劳', '肯德基', '星巴克', '咖啡', '奶茶', 'meal', 'dinner', 'lunch', 'coffee'] },
    { key: 'transport',    icon: '🚕', labelKey: '__T_FINANCE_CAT_TRANSPORT__',    kw: ['打车', '出租', '滴滴', '地铁', '公交', '高铁', '火车', '机票', '加油', '油费', 'taxi', 'metro', 'bus', 'train'] },
    { key: 'digital',      icon: '📱', labelKey: '__T_FINANCE_CAT_DIGITAL__',      kw: ['京东', '淘宝', '拼多多', '苹果', '小米', '华为', '数码', '电子', '充电', '耳机', 'jd', 'apple', 'digital'] },
    { key: 'health',       icon: '🏥', labelKey: '__T_FINANCE_CAT_HEALTH__',       kw: ['医院', '医生', '诊所', '药', '体检', '健身', 'gym', 'hospital', 'health'] },
    { key: 'entertainment',icon: '🎬', labelKey: '__T_FINANCE_CAT_ENTERTAINMENT__',kw: ['电影', '游戏', '会员', 'netflix', 'spotify', 'b站', 'bilibili', '订阅'] },
    { key: 'shopping',     icon: '🛍️', labelKey: '__T_FINANCE_CAT_SHOPPING__',     kw: ['衣', '鞋', '包', '化妆品', '美妆', '服装', '商场', 'mall', 'shop'] },
    { key: 'salary',       icon: '💼', labelKey: '__T_FINANCE_CAT_SALARY__',       kw: ['工资', '薪资', '薪水', '奖金', '年终奖', '提成', 'salary', 'bonus', 'payroll'] },
];

const DEFAULT_INCOME  = { key: 'other_income',  icon: '💰', labelKey: '__T_FINANCE_CAT_OTHER_INCOME__'  };
const DEFAULT_EXPENSE = { key: 'other_expense', icon: '💳', labelKey: '__T_FINANCE_CAT_OTHER_EXPENSE__' };

const matchKw = (note, kw) => {
    const n = String(note || '').toLowerCase();
    return kw.some((k) => n.includes(k.toLowerCase()));
};

export const categorize = (note, type) => {
    if (type === 'income') {
        for (const r of RULES) {
            if (r.key === 'salary' && matchKw(note, r.kw)) return r;
        }
        return DEFAULT_INCOME;
    }
    for (const r of RULES) {
        if (r.key === 'salary') continue;
        if (matchKw(note, r.kw)) return r;
    }
    return DEFAULT_EXPENSE;
};

// Hue for the donut wedge per category. Picked from a mint→teal→olive palette so
// the chart still feels like one family.
export const CATEGORY_COLOR = {
    housing:        '#047857',
    dining:         '#10b981',
    groceries:      '#34d399',
    transport:      '#6ee7b7',
    digital:        '#0d9488',
    health:         '#14b8a6',
    entertainment:  '#22d3ee',
    shopping:       '#84cc16',
    utilities:      '#a3e635',
    salary:         '#059669',
    other_income:   '#10b981',
    other_expense:  '#a7f3d0',
};
