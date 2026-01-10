import { useState } from 'react';
import { createLoan } from '../api/loans';
import '../assets/styles/credit.css';

function AddLoanForm({ onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    total_amount: '',
    installments_count: '',
    due_day: '',
    installment_amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const totalAmount = parseFloat(form.total_amount);
    const installmentAmount = parseFloat(form.installment_amount);
    const installmentsCount = Number(form.installments_count);
    const dueDay = Number(form.due_day);

    if (!form.name || isNaN(totalAmount) || isNaN(installmentAmount) || isNaN(installmentsCount) || isNaN(dueDay)) {
        setError('Wszystkie pola muszą być wypełnione poprawnie.');
        setLoading(false);
        return;
    }

    try {
        await createLoan({
        name: form.name,
        total_amount: totalAmount,
        installments_count: installmentsCount,
        due_day: dueDay,
        installment_amount: installmentAmount,
        });

        setSuccess('Kredyt został dodany pomyślnie!');
        setForm({ name: '', total_amount: '', installments_count: '', due_day: '', installment_amount: '' });

        setTimeout(() => {
        setSuccess(null);
        onSuccess?.();
        }, 3000);

    } catch (err) {
        setError(err.message || 'Błąd serwera');
    } finally {
        setLoading(false);
    }
    }

  return (
    <form onSubmit={handleSubmit} className="credit-form">
      <div className="credit-form-fields">
        <input name="name" placeholder="Nazwa kredytu" value={form.name} onChange={handleChange} required />
        <input name="total_amount" type="text" placeholder="Kwota całkowita" value={form.total_amount} onChange={handleChange} required />
        <input name="installments_count" type="number" placeholder="Liczba rat" value={form.installments_count} onChange={handleChange} required />
        <input name="due_day" type="number" placeholder="Dzień spłaty" value={form.due_day} onChange={handleChange} required />
        <input name="installment_amount" type="text" placeholder="Kwota raty" value={form.installment_amount} onChange={handleChange} required />
      </div>

      {error && <p className="credit-message credit-error">{error}</p>}
      {success && <p className="credit-message credit-success">{success}</p>}

      <button type="submit" disabled={loading}>{loading ? 'Zapisywanie...' : 'Zapisz kredyt'}</button>
    </form>
  );
}

export default AddLoanForm;
