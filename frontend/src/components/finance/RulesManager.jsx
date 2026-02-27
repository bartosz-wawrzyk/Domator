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

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        const res = editingCatId 
            ? await financeApi.updateCategory(editingCatId, { name: newCategoryName })
            : await financeApi.createCategory({ name: newCategoryName });

        if (res.ok) {
            setNewCategoryName('');
            setEditingCatId(null);
            const resCats = await financeApi.getCategories();
            if (resCats.ok) setCategories(resCats.data);
        } else {
            alert(res.data?.detail || "Błąd podczas zapisywania kategorii.");
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Czy na pewno chcesz usunąć tę kategorię? System sprawdzi czy nie jest używana.")) return;

        const res = await financeApi.deleteCategory(id);
        if (res.ok) {
            const resCats = await financeApi.getCategories();
            if (resCats.ok) setCategories(resCats.data);
        } else {
            const msg = res.data?.detail || "Nie udało się usunąć kategorii.";
            alert(`Błąd: ${msg}`);
        }
    };

    const handleRuleSubmit = async (e) => {
        e.preventDefault();
        if (!ruleFormData.keyword || !ruleFormData.category_id) return;

        const payload = { ...ruleFormData, account_id: selectedAccountId };
        const res = editingRuleId 
            ? await financeApi.updateRule(editingRuleId, payload)
            : await financeApi.createRule(payload);

        if (res.ok) {
            setRuleFormData({ keyword: '', category_id: '' });
            setEditingRuleId(null);
            loadRules();
        } else {
            alert(res.data?.detail || "Błąd podczas zapisywania reguły.");
        }
    };

    const handleApplyRule = async (ruleId) => {
        if (!window.confirm("Czy na pewno chcesz przeskanować historię i przypisać tę kategorię do pasujących transakcji?")) return;

        const res = await financeApi.applyRule(ruleId);
        if (res.ok) {
            const match = res.data.message.match(/\d+/);
            const count = match ? match[0] : "0";

            let userMessage = `Sukces! Zaktualizowano ${count} transakcji.`;
            
            if (count === "0") {
                userMessage = "Przeskanowano historię, ale nie znaleziono nowych transakcji pasujących do tej reguły.";
            } else if (count === "1") {
                userMessage = "Sukces! Zaktualizowano 1 transakcję.";
            }

            alert(userMessage);
        } else {
            alert(res.data?.detail || "Wystąpił błąd podczas stosowania reguły.");
        }
    };

    const handleDeleteRule = async (id) => {
        if (!window.confirm("Usunąć tę regułę?")) return;

        const res = await financeApi.deleteRule(id);
        if (res.ok) {
            loadRules();
        } else {
            const msg = res.data?.detail || "Nie udało się usunąć reguły.";
            alert(`Błąd: ${msg}`);
        }
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
                    <div className="card-header">
                        <h4>📂 Kategorie</h4>
                    </div>
                    
                    <form onSubmit={handleSaveCategory} className="mini-form">
                        <input 
                            className="finance-input" placeholder="Nazwa kategorii..." 
                            value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                            disabled={isLocked}
                        />
                        <button className="btn-submit-finance" disabled={isLocked}>
                            {editingCatId ? 'Zapisz' : 'Dodaj'}
                        </button>
                        {editingCatId && (
                            <button 
                                type="button" 
                                className="nav-tab-btn" 
                                style={{ color: '#ff5252', fontWeight: 'bold', border: '1px solid #ff5252' }}
                                onClick={() => { setEditingCatId(null); setNewCategoryName(''); }}
                            >
                                Anuluj
                            </button>
                        )}
                    </form>

                    <div className="data-table">
                        <div className="data-row data-header">
                            <div>Nazwa kategorii</div>
                            <div style={{ textAlign: 'right' }}>Akcje</div>
                        </div>
                        {isLocked ? (
                            <p className="empty-msg">Wybierz konto, aby zobaczyć kategorie.</p>
                        ) : categories.length === 0 ? (
                            <p className="empty-msg">Brak kategorii.</p>
                        ) : (
                            categories.map(cat => (
                                <div key={cat.id} className="data-row">
                                    <div style={{ fontWeight: '500' }}>{cat.name}</div>
                                    <div className="action-btns">
                                        <button className="nav-tab-btn" onClick={() => { setEditingCatId(cat.id); setNewCategoryName(cat.name); }}>✎</button>
                                        <button className="nav-tab-btn del-btn" onClick={() => handleDeleteCategory(cat.id)}>🗑️</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className={`finance-card ${isLocked ? 'locked-opacity' : ''}`}>
                    <div className="card-header">
                        <h4>🔗 Reguły Automatyzacji</h4>
                    </div>

                    <form onSubmit={handleRuleSubmit} className="mini-form-grid">
                        <input 
                            className="finance-input" placeholder="Słowo kluczowe..." 
                            value={ruleFormData.keyword} onChange={e => setRuleFormData({...ruleFormData, keyword: e.target.value})}
                            disabled={isLocked} required
                        />
                        <select 
                            className="finance-select" value={ruleFormData.category_id}
                            onChange={e => setRuleFormData({...ruleFormData, category_id: e.target.value})}
                            disabled={isLocked} required
                        >
                            <option value="">Wybierz kategorię...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button className="btn-submit-finance" disabled={isLocked}>
                            {editingRuleId ? 'Zapisz' : 'Dodaj'}
                        </button>
                        {editingRuleId && (
                            <button 
                                type="button" 
                                className="nav-tab-btn" 
                                style={{ color: '#ff5252', fontWeight: 'bold', border: '1px solid #ff5252' }}
                                onClick={() => { setEditingRuleId(null); setRuleFormData({ keyword: '', category_id: '' }); }}
                            >
                                Anuluj
                            </button>
                        )}
                    </form>

                    <div className="data-table">
                        <div className="data-row data-header">
                            <div>Słowo / Kategoria</div>
                            <div style={{ textAlign: 'right' }}>Akcje</div>
                        </div>
                        {isLocked ? (
                            <p className="empty-msg">Wybierz konto, aby zobaczyć reguły.</p>
                        ) : rules.length === 0 ? (
                            <p className="empty-msg">Brak reguł.</p>
                        ) : (
                            rules.map(rule => (
                                <div key={rule.id} className="data-row">
                                    <div>
                                        <span className="rule-tag" style={{ marginRight: '10px' }}>{rule.keyword}</span>
                                        <span className="badge-cat">{categories.find(c => c.id === rule.category_id)?.name || 'Brak'}</span>
                                    </div>
                                    <div className="action-btns">
                                        <button 
                                            className="nav-tab-btn" 
                                            style={{ padding: '5px 12px', fontSize: '0.7rem', background: 'rgba(66, 230, 149, 0.15)', color: '#42e695' }}
                                            onClick={() => handleApplyRule(rule.id)}
                                            title="To narzędzie przeszuka wszystkie dotychczasowe transakcje na tym koncie i automatycznie przypisze im kategorię, jeśli pasują do słowa kluczowego."
                                        >
                                            ⚡ Zastosuj teraz
                                        </button>
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
    );
}

export default RulesManager;