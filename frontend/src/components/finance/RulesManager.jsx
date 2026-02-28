import { useEffect, useState } from 'react';
import * as financeApi from '../../api/finance';

function RulesManager() {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [rules, setRules] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [ruleFormData, setRuleFormData] = useState({ keyword: '', category_id: '' });
    const [newCategoryName, setNewCategoryName] = useState('');

    const [editingRuleId, setEditingRuleId] = useState(null);
    const [editingCatId, setEditingCatId] = useState(null);

    const [filterCategoryId, setFilterCategoryId] = useState('');

    useEffect(() => {
        const init = async () => {
            const [resAcc, resCats] = await Promise.all([
                financeApi.getAccounts(),
                financeApi.getCategories()
            ]);
            if (resAcc.ok) setAccounts(resAcc.data);
            if (resCats.ok) setCategories(resCats.data);
        };
        init();
    }, []);

    useEffect(() => {
        if (!selectedAccountId) {
            setRules([]);
            return;
        }
        loadRules();
    }, [selectedAccountId]);

    const loadRules = async () => {
        setLoading(true);
        const res = await financeApi.getRules(selectedAccountId); 
        if (res.ok) setRules(res.data);
        setLoading(false);
    };

    const filteredRules = filterCategoryId 
        ? rules.filter(r => String(r.category_id) === String(filterCategoryId))
        : rules;

    const selectedCategoryName = categories.find(c => String(c.id) === String(filterCategoryId))?.name;

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        const res = editingCatId 
            ? await financeApi.updateCategory(editingCatId, { name: newCategoryName })
            : await financeApi.createCategory({ name: newCategoryName });
        if (res.ok) {
            setNewCategoryName(''); setEditingCatId(null);
            const resCats = await financeApi.getCategories();
            if (resCats.ok) setCategories(resCats.data);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Usunąć kategorię?")) return;
        const res = await financeApi.deleteCategory(id);
        if (res.ok) {
            const resCats = await financeApi.getCategories();
            if (resCats.ok) setCategories(resCats.data);
        }
    };

    const handleRuleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...ruleFormData, account_id: selectedAccountId };
        const res = editingRuleId 
            ? await financeApi.updateRule(editingRuleId, payload)
            : await financeApi.createRule(payload);
        if (res.ok) {
            setRuleFormData({ keyword: '', category_id: '' });
            setEditingRuleId(null);
            loadRules();
        }
    };

    const handleApplyRule = async (ruleId) => {
        if (!window.confirm("Przeskanować historię?")) return;
        const res = await financeApi.applyRule(ruleId);
        if (res.ok) alert("Zastosowano regułę!");
    };

    const handleDeleteRule = async (id) => {
        if (!window.confirm("Usunąć regułę?")) return;
        const res = await financeApi.deleteRule(id);
        if (res.ok) loadRules();
    };

    const isLocked = !selectedAccountId;

    return (
        <div className="finance-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3>⚙️ Konfiguracja Słowników</h3>
                <select 
                    className="finance-select" style={{ width: 'auto', minWidth: '280px' }}
                    value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}
                >
                    <option value="">Wybierz konto bankowe...</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '25px', alignItems: 'start' }}>
                
                <div className={`finance-card ${isLocked ? 'locked-opacity' : ''}`}>
                    <h4>📂 Kategorie</h4>
                    <form onSubmit={handleSaveCategory} className="mini-form">
                        <input className="finance-input" placeholder="Nazwa..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} disabled={isLocked} />
                        <button className="btn-submit-finance" disabled={isLocked}>{editingCatId ? 'OK' : '+'}</button>
                    </form>
                    <div className="preview-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <div className="data-table">
                            {categories.map(cat => (
                                <div key={cat.id} className="data-row">
                                    <div>{cat.name}</div>
                                    <div className="action-btns">
                                        <button className="nav-tab-btn" onClick={() => { setEditingCatId(cat.id); setNewCategoryName(cat.name); }}>✎</button>
                                        <button className="nav-tab-btn del-btn" onClick={() => handleDeleteCategory(cat.id)}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={`finance-card ${isLocked ? 'locked-opacity' : ''}`}>
                    <h4>🔗 Reguły Automatyzacji</h4>

                    <form onSubmit={handleRuleSubmit} className="mini-form-grid" style={{ marginBottom: '20px' }}>
                        <input className="finance-input" placeholder="Słowo kluczowe..." value={ruleFormData.keyword} onChange={e => setRuleFormData({...ruleFormData, keyword: e.target.value})} required />
                        <select className="finance-select" value={ruleFormData.category_id} onChange={e => setRuleFormData({...ruleFormData, category_id: e.target.value})} required>
                            <option value="">Wybierz kategorię...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button className="btn-submit-finance">{editingRuleId ? 'Zapisz' : 'Dodaj'}</button>
                    </form>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#aaa' }}>Filtruj listę:</span>
                        <select 
                            className="finance-select" 
                            style={{ width: 'auto', minWidth: '200px', fontSize: '0.9rem', height: '42px', background: filterCategoryId ? 'rgba(37, 117, 252, 0.15)' : '' }}
                            value={filterCategoryId}
                            onChange={(e) => setFilterCategoryId(e.target.value)}
                        >
                            <option value="">Wszystkie kategorie</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {filterCategoryId && (
                        <div style={{ background: 'rgba(37, 117, 252, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.85rem', borderLeft: '4px solid #2575fc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Widok: <strong>{selectedCategoryName}</strong> ({filteredRules.length})</span>
                            <button onClick={() => setFilterCategoryId('')} style={{ background: '#ff5050', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>WYCZYŚĆ FILTR</button>
                        </div>
                    )}

                    <div className="preview-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <div className="data-table">
                            <div className="data-row data-header" style={{ position: 'sticky', top: 0, background: '#1e1e24', zIndex: 1 }}>
                                <div>Słowo / Kategoria</div>
                                <div style={{ textAlign: 'right' }}>Akcje</div>
                            </div>
                            
                            {filteredRules.length === 0 ? (
                                <p className="empty-msg" style={{ padding: '20px', textAlign: 'center' }}>Brak reguł dla wybranych kryteriów.</p>
                            ) : (
                                filteredRules.map(rule => (
                                    <div key={rule.id} className="data-row">
                                        <div>
                                            <span className="rule-tag" style={{ marginRight: '10px' }}>{rule.keyword}</span>
                                            <span className="badge-cat">{categories.find(c => String(c.id) === String(rule.category_id))?.name || 'Brak'}</span>
                                        </div>
                                        <div className="action-btns">
                                            <button className="nav-tab-btn" onClick={() => handleApplyRule(rule.id)}>⚡</button>
                                            <button className="nav-tab-btn" onClick={() => { setEditingRuleId(rule.id); setRuleFormData({keyword: rule.keyword, category_id: rule.category_id}); }}>✎</button>
                                            <button className="nav-tab-btn del-btn" onClick={() => handleDeleteRule(rule.id)}>🗑️</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RulesManager;