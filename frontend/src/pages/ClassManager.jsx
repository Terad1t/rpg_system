import { useState, useEffect } from 'react';

export default function ClassManager() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ name: '', subclass: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);

  // Get auth token
  const token = localStorage.getItem('token');

  // Load classes
  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/classes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!response.ok) throw new Error('Falha ao carregar classes');
      
      const data = await response.json();
      setClasses(data);
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
        ? `http://localhost:8000/api/classes/${editingId}`
        : 'http://localhost:8000/api/classes';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Falha ao salvar classe');

      setMessage({ type: 'success', text: editingId ? 'Classe atualizada!' : 'Classe criada!' });
      setFormData({ name: '', subclass: '', description: '' });
      setEditingId(null);
      
      setTimeout(() => setMessage(null), 3000);
      fetchClasses();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleEdit = (classe) => {
    setFormData({ 
      name: classe.name, 
      subclass: classe.subclass || '', 
      description: classe.description || '' 
    });
    setEditingId(classe.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja deletar esta classe?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/classes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Falha ao deletar classe');

      setMessage({ type: 'success', text: 'Classe deletada!' });
      setTimeout(() => setMessage(null), 3000);
      fetchClasses();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', subclass: '', description: '' });
    setEditingId(null);
  };

  if (loading) return <div className="text-center py-8">Carregando classes...</div>;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-orange-400 mb-4">
            {editingId ? 'Editar Classe' : 'Criar Nova Classe'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nome da Classe *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-orange-400"
                placeholder="Ex: Guerreiro, Mago, Arqueiro..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Subclasse
              </label>
              <input
                type="text"
                value={formData.subclass}
                onChange={(e) => setFormData({ ...formData, subclass: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-orange-400"
                placeholder="Ex: Cavaleiro, Bruxo, Ranger..."
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
                placeholder="Descreva as características da classe..."
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
            Classes Existentes ({classes.length})
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {classes.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Nenhuma classe criada</p>
            ) : (
              classes.map((classe) => (
                <div
                  key={classe.id}
                  className="bg-slate-700/50 p-3 rounded border border-slate-600 hover:border-orange-400 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-300">{classe.name}</h4>
                      {classe.subclass && (
                        <p className="text-xs text-slate-400">Subclasse: {classe.subclass}</p>
                      )}
                      {classe.description && (
                        <p className="text-sm text-slate-400 mt-1">{classe.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => handleEdit(classe)}
                        className="px-3 py-1 bg-blue-600/50 text-blue-300 rounded text-sm hover:bg-blue-600 transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(classe.id)}
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
