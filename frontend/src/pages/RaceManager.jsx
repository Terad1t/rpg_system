import { useState, useEffect } from 'react';

export default function RaceManager() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);

  // Get auth token
  const token = localStorage.getItem('access_token');

  // Load races
  useEffect(() => {
    fetchRaces();
  }, []);

  const fetchRaces = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/racas', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!response.ok) throw new Error('Falha ao carregar raças');
      
      const data = await response.json();
      setRaces(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Nome é obrigatório' });
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `http://localhost:8000/racas/${editingId}`
        : 'http://localhost:8000/racas';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Falha ao salvar raça');

      setMessage({ type: 'success', text: editingId ? 'Raça atualizada!' : 'Raça criada!' });
      setFormData({ name: '', description: '' });
      setEditingId(null);
      
      setTimeout(() => setMessage(null), 3000);
      fetchRaces();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleEdit = (race) => {
    setFormData({ name: race.name, description: race.description || '' });
    setEditingId(race.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja deletar esta raça?')) return;

    try {
      const response = await fetch(`http://localhost:8000/racas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Falha ao deletar raça');

      setMessage({ type: 'success', text: 'Raça deletada!' });
      setTimeout(() => setMessage(null), 3000);
      fetchRaces();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '' });
    setEditingId(null);
  };

  if (loading) return <div className="text-center py-8">Carregando raças...</div>;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-orange-400 mb-4">
            {editingId ? 'Editar Raça' : 'Criar Nova Raça'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nome da Raça *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-orange-400"
                placeholder="Ex: Humano, Elfo, Anão..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-orange-400"
                rows="4"
                placeholder="Descreva as características da raça..."
              />
            </div>

            <div className="flex gap-2">
              <button 
                type="submit"
                className="flex-1 bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition font-semibold"
              >
                {editingId ? 'Atualizar' : 'Criar'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-slate-600 text-white py-2 rounded hover:bg-slate-700 transition font-semibold"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded text-sm ${
              message.type === 'error' 
                ? 'bg-red-900/30 text-red-300' 
                : 'bg-green-900/30 text-green-300'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        {/* List */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-orange-400 mb-4">
            Raças Existentes ({races.length})
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {races.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Nenhuma raça criada</p>
            ) : (
              races.map((race) => (
                <div
                  key={race.id}
                  className="bg-slate-700/50 p-3 rounded border border-slate-600 hover:border-orange-400 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-300">{race.name}</h4>
                      {race.description && (
                        <p className="text-sm text-slate-400 mt-1">{race.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => handleEdit(race)}
                        className="px-3 py-1 bg-blue-600/50 text-blue-300 rounded text-sm hover:bg-blue-600 transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(race.id)}
                        className="px-3 py-1 bg-red-600/50 text-red-300 rounded text-sm hover:bg-red-600 transition"
                      >
                        Deletar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 text-red-300 p-4 rounded border border-red-700">
          Erro: {error}
        </div>
      )}
    </div>
  );
}
